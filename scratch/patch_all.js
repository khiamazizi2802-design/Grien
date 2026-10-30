const fs = require('fs');

// ==========================================
// 1. PATCH ADMIN DASHBOARDS
// ==========================================
function patchAdmin(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add previewSheetDoc state if missing
    if (!content.includes('previewSheetDoc')) {
        content = content.replace(
            'const [docPartners, setDocPartners] = useState([]);',
            'const [docPartners, setDocPartners] = useState([]);\n    const [previewSheetDoc, setPreviewSheetDoc] = useState(null);'
        );
    }

    // Replace handleViewPartnerDoc to open previewSheetDoc instead of window.open()
    const handleViewStart = 'const handleViewPartnerDoc = async (docState, email) => {';
    if (content.includes(handleViewStart)) {
        const idx = content.indexOf(handleViewStart);
        const endIdx = content.indexOf('const [selectedInvoiceForModal', idx);
        if (endIdx > idx) {
            const replacement = `const handleViewPartnerDoc = (docState, email) => {
        setPreviewSheetDoc(docState);
    };

    `;
            content = content.substring(0, idx) + replacement + content.substring(endIdx);
            console.log('Replaced handleViewPartnerDoc in', filePath);
        }
    }

    // Add Document Preview Bottom Sheet before closing tags of component
    const bottomSheetCode = `
            {/* DOCUMENT PREVIEW BOTTOM SHEET */}
            <AnimatePresence>
                {previewSheetDoc && (
                    <div className="fixed inset-0 z-[999] flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewSheetDoc(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                            className="relative z-10 w-full max-w-2xl bg-[#0e131f] border-t border-x border-white/15 rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.9)] p-6 md:p-8 max-h-[85vh] flex flex-col overflow-hidden"
                        >
                            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 cursor-pointer" onClick={() => setPreviewSheetDoc(null)} />
                            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                                <div>
                                    <h3 className="text-sm md:text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                                        <FileText size={18} className="text-brand" /> {previewSheetDoc.name || 'Dokumentenvorschau'}
                                    </h3>
                                    <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-0.5">
                                        Status: <span className={previewSheetDoc.status === 'approved' ? 'text-brand font-black uppercase' : 'text-amber-400 font-black uppercase'}>{previewSheetDoc.status}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPreviewSheetDoc(null)}
                                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="py-6 overflow-y-auto space-y-6">
                                {(previewSheetDoc.frontUrl || previewSheetDoc.backUrl) ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {previewSheetDoc.frontUrl && (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase text-brand tracking-wider flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> 1. Vorderseite
                                                </span>
                                                <div className="w-full h-52 rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-xl flex items-center justify-center p-2">
                                                    <img src={previewSheetDoc.frontUrl} alt="Vorderseite" className="max-h-full max-w-full object-contain rounded-xl" />
                                                </div>
                                            </div>
                                        )}
                                        {previewSheetDoc.backUrl && (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black uppercase text-brand tracking-wider flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> 2. Rückseite
                                                </span>
                                                <div className="w-full h-52 rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-xl flex items-center justify-center p-2">
                                                    <img src={previewSheetDoc.backUrl} alt="Rückseite" className="max-h-full max-w-full object-contain rounded-xl" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (previewSheetDoc.fileUrl || previewSheetDoc.file) ? (
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="max-w-md w-full max-h-[55vh] rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-xl flex items-center justify-center p-3">
                                            <img
                                                src={previewSheetDoc.fileUrl || previewSheetDoc.file}
                                                alt={previewSheetDoc.name}
                                                className="max-h-[50vh] max-w-full object-contain rounded-xl"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-gray-500 font-bold text-xs uppercase">
                                        Keine Bilddatei vorhanden
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setPreviewSheetDoc(null)}
                                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                                >
                                    Schließen
                                </button>
                                {previewSheetDoc.status !== 'approved' && (
                                    <button
                                        onClick={() => {
                                            handleApprovePartnerDoc('omarde65aa_gmail_com', previewSheetDoc.id);
                                            setPreviewSheetDoc(prev => ({ ...prev, status: 'approved' }));
                                        }}
                                        className="px-6 py-2.5 bg-brand text-dark-900 font-black text-xs uppercase tracking-wider rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand/20 flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <CheckCircle2 size={14} /> Jetzt Freigeben
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
`;

    if (!content.includes('{/* DOCUMENT PREVIEW BOTTOM SHEET */}')) {
        const lastPresence = content.lastIndexOf('</AnimatePresence>');
        if (lastPresence !== -1) {
            content = content.substring(0, lastPresence + 18) + bottomSheetCode + content.substring(lastPresence + 18);
            console.log('Added bottom sheet to', filePath);
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

// ==========================================
// 2. PATCH DRIVER DASHBOARDS
// ==========================================
function patchDriver(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Persist avatar in profileData initializer
    content = content.replace(
        `avatar: \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user?.name || 'Parsa'}\``,
        `avatar: localStorage.getItem('driver_profile_avatar') || \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user?.name || 'Parsa'}\``
    );

    // Initializer of tempPhotoPreview to read localStorage
    content = content.replace(
        `const [tempPhotoPreview, setTempPhotoPreview] = useState(null);`,
        `const [tempPhotoPreview, setTempPhotoPreview] = useState(() => localStorage.getItem('driver_profile_avatar') || null);`
    );

    // Make sure avatar upload sets localStorage
    if (!content.includes(`localStorage.setItem('driver_profile_avatar', compressed);`)) {
        content = content.replace(
            `setProfileData(prev => ({ ...prev, avatar: compressed }));`,
            `setProfileData(prev => ({ ...prev, avatar: compressed }));\n                                                    localStorage.setItem('driver_profile_avatar', compressed);`
        );
    }

    // Dedicated approval poller effect
    const pollerCode = `
    // Poll admin approvals from local API bridge every 1.5 seconds
    useEffect(() => {
        const pollApprovals = async () => {
            try {
                const res = await fetch('http://localhost:5174/api/sync-driver');
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        if (data.avatarApproved === true) {
                            setAvatarApproved(true);
                            localStorage.setItem('driver_avatar_approved', 'true');
                        }
                        if (data.idCardApproved === true) {
                            setIdCardApproved(true);
                            localStorage.setItem('driver_id_card_approved', 'true');
                        }
                        if (data.termsAccepted === true) {
                            setTermsAccepted(true);
                            localStorage.setItem('driver_terms_accepted', 'true');
                        }
                    }
                }
            } catch(e) {}
        };
        pollApprovals();
        const interval = setInterval(pollApprovals, 1500);
        return () => clearInterval(interval);
    }, []);
`;

    if (!content.includes('pollApprovals = async () =>')) {
        const syncListenerTarget = `// Cross-port sync listener`;
        content = content.replace(syncListenerTarget, pollerCode + '\n    ' + syncListenerTarget);
        console.log('Added pollApprovals to', filePath);
    }

    // Clean up sendBroadcast to not overwrite admin approvals with false
    const oldSendBroadcastStart = `        const sendBroadcast = () => {`;
    const newSendBroadcast = `        const sendBroadcast = () => {
            const email = (user?.email || profileData?.email || 'omarde65aa@gmail.com').toLowerCase();
            const curAvatar = tempPhotoPreview || profileData.avatar || localStorage.getItem('driver_profile_avatar') || '';
            const curFront = idCardFront || localStorage.getItem('driver_id_card_front') || null;
            const curBack = idCardBack || localStorage.getItem('driver_id_card_back') || null;
            const payload = {
                email: email,
                name: \`\${profileData.firstName || 'Khiam'} \${profileData.lastName || 'Azizi'}\`.trim(),
                phone: profileData.phoneNumber || '017662111103',
                address: profileData.address || 'Auf dem Schafberg 12 3',
                city: profileData.city || 'City',
                zip: profileData.zipCode || '65933',
                avatar: curAvatar,
                idCardFront: curFront,
                idCardBack: curBack,
                ...(avatarApproved ? { avatarApproved: true } : {}),
                ...(idCardApproved ? { idCardApproved: true } : {}),
                termsAccepted: termsAccepted
            };
            try {
                if (bc) bc.postMessage({ type: 'DRIVER_UPDATE', driver: payload });
            } catch(e) {}

            try {
                fetch('http://localhost:5174/api/sync-driver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(() => {});
            } catch(e) {}
        };`;

    if (content.includes(oldSendBroadcastStart)) {
        const startIdx = content.indexOf(oldSendBroadcastStart);
        const endIdx = content.indexOf('sendBroadcast();', startIdx);
        if (endIdx > startIdx) {
            content = content.substring(0, startIdx) + newSendBroadcast + '\n        ' + content.substring(endIdx);
            console.log('Cleaned sendBroadcast in', filePath);
        }
    }

    // Replace avatar UI rendering in view === 'profile-pic' so image is 100% visible and has clean badge
    const oldAvatarSection = `{/* Avatar Section */}`;
    if (content.includes(oldAvatarSection)) {
        const avatarIdx = content.indexOf(oldAvatarSection);
        const formIdx = content.indexOf('{/* Personal Data Form */}', avatarIdx);
        if (formIdx > avatarIdx) {
            const newAvatarUI = `{/* Avatar Section */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative group">
                                            <div className="w-40 h-40 rounded-[2.5rem] bg-brand/20 border-4 border-brand/50 p-1.5 shadow-2xl relative overflow-hidden">
                                                <img
                                                    src={tempPhotoPreview || profileData.avatar || localStorage.getItem('driver_profile_avatar') || \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user?.name || 'Driver'}\`}
                                                    alt="Avatar"
                                                    className="w-full h-full rounded-[2.1rem] bg-dark-800 object-cover"
                                                />
                                                <div
                                                    onClick={() => document.getElementById('profile-pic-view-upload').click()}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity backdrop-blur-[2px]"
                                                >
                                                    <Upload className="text-brand mb-1" size={28} />
                                                    <span className="text-[9px] font-black uppercase text-white tracking-wider">Foto ändern</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('profile-pic-view-upload').click()}
                                                className="absolute -bottom-2 -right-2 w-12 h-12 bg-brand text-dark-900 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-dark-900 hover:scale-110 transition-transform cursor-pointer"
                                                title="Profilbild ändern"
                                            >
                                                <Edit3 size={20} />
                                            </button>
                                        </div>

                                        {/* Status Badge right below photo */}
                                        {avatarApproved ? (
                                            <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                                                <CheckCircle size={14} /> Profilbild Verifiziert ✓
                                            </span>
                                        ) : (tempPhotoPreview || profileData.avatar || localStorage.getItem('driver_profile_avatar')) ? (
                                            <span className="px-4 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                                                <Clock size={14} /> Wartet auf Admin-Freigabe
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('profile-pic-view-upload').click()}
                                                className="px-4 py-1.5 bg-brand/20 text-brand border border-brand/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-brand/30 transition-all cursor-pointer"
                                            >
                                                <Upload size={14} /> Foto hochladen
                                            </button>
                                        )}
                                    </div>

                                    `;
            content = content.substring(0, avatarIdx) + newAvatarUI + content.substring(formIdx);
            console.log('Replaced avatar UI in', filePath);
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

patchAdmin('C:/Users/AURUMPC/Desktop/Khiam green app 4/admin-portal/src/pages/AdminDashboard.jsx');
patchAdmin('C:/Users/AURUMPC/Desktop/Khiam green app 4/client/src/pages/AdminDashboard.jsx');
patchDriver('C:/Users/AURUMPC/Desktop/Khiam green app 4/dgrien-app/src/pages/DriverDashboard.jsx');
patchDriver('C:/Users/AURUMPC/Desktop/Khiam green app 4/client/src/pages/DriverDashboard.jsx');
console.log('All patches applied cleanly!');
