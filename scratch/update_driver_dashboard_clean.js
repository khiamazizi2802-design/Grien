const fs = require('fs');

const files = [
    'dgrien-app/src/pages/DriverDashboard.jsx',
    'admin-portal/src/pages/DriverDashboard.jsx',
    'client/src/pages/DriverDashboard.jsx'
];

for (const f of files) {
    if (!fs.existsSync(f)) continue;
    let code = fs.readFileSync(f, 'utf8');

    // 1. Add Ausweis & Terms States right before `const [profileData, setProfileData] = useState({`
    const stateTarget = 'const [profileData, setProfileData] = useState({';
    if (!code.includes('const [idCardFront, setIdCardFront]')) {
        const stateCode = `// Driver Ausweis, Terms & Approval States
    const [idCardFront, setIdCardFront] = useState(() => localStorage.getItem('driver_id_card_front') || null);
    const [idCardBack, setIdCardBack] = useState(() => localStorage.getItem('driver_id_card_back') || null);
    const [idCardApproved, setIdCardApproved] = useState(() => localStorage.getItem('driver_id_card_approved') === 'true');
    const [avatarApproved, setAvatarApproved] = useState(() => localStorage.getItem('driver_avatar_approved') === 'true');
    const [termsAccepted, setTermsAccepted] = useState(() => localStorage.getItem('driver_terms_accepted') === 'true');
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    const handleIdCardUpload = (e, side) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.src = reader.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                const max = 1000;
                if (w > h) { if (w > max) { h = Math.round(h * max / w); w = max; } }
                else { if (h > max) { w = Math.round(w * max / h); h = max; } }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', 0.8);
                if (side === 'front') {
                    setIdCardFront(compressed);
                    localStorage.setItem('driver_id_card_front', compressed);
                } else {
                    setIdCardBack(compressed);
                    localStorage.setItem('driver_id_card_back', compressed);
                }
                syncDriverProfileToCloud({
                    [side === 'front' ? 'idCardFront' : 'idCardBack']: compressed
                });
            };
        };
        reader.readAsDataURL(file);
        e.target.value = null;
    };

    const syncDriverProfileToCloud = async (extraFields = {}) => {
        const email = (user?.email || profileData?.email || 'omarde65aa@gmail.com').toLowerCase();
        if (!email) return;
        try {
            const uRef = doc(fbDb, 'users', email);
            const dataToSave = {
                email: email,
                name: \`\${profileData.firstName || ''} \${profileData.lastName || ''}\`.trim() || user?.name || 'Khiam Azizi',
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                phone: profileData.phoneNumber || '',
                address: profileData.address || '',
                city: profileData.city || '',
                zip: profileData.zipCode || '',
                role: 'driver',
                avatar: tempPhotoPreview || profileData.avatar || '',
                idCardFront: idCardFront || null,
                idCardBack: idCardBack || null,
                idCardApproved: idCardApproved,
                avatarApproved: avatarApproved,
                termsAccepted: termsAccepted,
                updatedAt: new Date().toISOString(),
                ...extraFields
            };
            dataToSave.driverComplianceDocs = [
                { id: 'avatar', name: 'Driver Profile Photo', status: avatarApproved ? 'verified' : (dataToSave.avatar ? 'pending' : 'missing'), fileUrl: dataToSave.avatar },
                { id: 'idcard', name: 'Personalausweis (Vorder- & Rückseite)', status: idCardApproved ? 'verified' : ((dataToSave.idCardFront || dataToSave.idCardBack) ? 'pending' : 'missing'), fileUrl: dataToSave.idCardFront || dataToSave.idCardBack, frontUrl: dataToSave.idCardFront, backUrl: dataToSave.idCardBack },
                { id: 'terms', name: 'Nutzungsbedingungen & AGB', status: dataToSave.termsAccepted ? 'verified' : 'missing' }
            ];
            await setDoc(uRef, dataToSave, { merge: true });

            try {
                const bc = new BroadcastChannel('green_fleet_sync');
                bc.postMessage({ type: 'DRIVER_UPDATE', driver: dataToSave });
                bc.close();
            } catch(e) {}
        } catch(e) {
            console.error('Cloud sync error:', e);
        }
    };

    // Cross-port sync listener
    useEffect(() => {
        let bc;
        try {
            bc = new BroadcastChannel('green_fleet_sync');
            bc.onmessage = (ev) => {
                if (ev.data && ev.data.type === 'DOC_APPROVED') {
                    const { email, docId } = ev.data;
                    const myEmail = (user?.email || profileData.email || '').toLowerCase();
                    if (email && myEmail === email.toLowerCase()) {
                        if (docId === 'avatar') {
                            setAvatarApproved(true);
                            localStorage.setItem('driver_avatar_approved', 'true');
                        }
                        if (docId === 'idcard') {
                            setIdCardApproved(true);
                            localStorage.setItem('driver_id_card_approved', 'true');
                        }
                        if (docId === 'terms') {
                            setTermsAccepted(true);
                            localStorage.setItem('driver_terms_accepted', 'true');
                        }
                    }
                }
            };
        } catch(e) {}
        return () => { if (bc) bc.close(); };
    }, [user?.email, profileData.email]);

    const [profileData, setProfileData] = useState({`;
        code = code.replace(stateTarget, stateCode);
    }

    // 2. Profile Pic Status: take avatarApproved into account
    const profilePicStatusPattern = /const profilePicStatus = \(\(\) => \{[\s\S]*?\}\)\(\);/;
    const profilePicStatusReplacement = `const profilePicStatus = (() => {
        if (avatarApproved) return 'verified';
        const avatarDoc = driverDocs.find(d => d.id === 'avatar');
        if (!avatarDoc) return (tempPhotoPreview || profileData.avatar) ? 'pending' : 'missing';
        return avatarDoc.status === 'verified' ? 'verified' : (avatarDoc.status === 'pending' || tempPhotoPreview || profileData.avatar) ? 'pending' : 'missing';
    })();`;
    code = code.replace(profilePicStatusPattern, profilePicStatusReplacement);

    // 3. Firestore onSnapshot additions
    const snapshotTarget = `if (data.driverComplianceDocs) {`;
    if (!code.includes('if (data.avatarApproved !== undefined)')) {
        const snapshotAdditions = `if (data.avatarApproved !== undefined) {
                    setAvatarApproved(data.avatarApproved);
                    localStorage.setItem('driver_avatar_approved', data.avatarApproved ? 'true' : 'false');
                }
                if (data.idCardApproved !== undefined) {
                    setIdCardApproved(data.idCardApproved);
                    localStorage.setItem('driver_id_card_approved', data.idCardApproved ? 'true' : 'false');
                }
                if (data.idCardFront) {
                    setIdCardFront(data.idCardFront);
                    localStorage.setItem('driver_id_card_front', data.idCardFront);
                }
                if (data.idCardBack) {
                    setIdCardBack(data.idCardBack);
                    localStorage.setItem('driver_id_card_back', data.idCardBack);
                }
                if (data.termsAccepted !== undefined) {
                    setTermsAccepted(data.termsAccepted);
                    localStorage.setItem('driver_terms_accepted', data.termsAccepted ? 'true' : 'false');
                }
                if (data.driverComplianceDocs) {`;
        code = code.replace(snapshotTarget, snapshotAdditions);
    }

    // 4. Replace Save Profile Changes button inside view === 'profile-pic'
    const profilePicIndex = code.indexOf("view === 'profile-pic'");
    if (profilePicIndex !== -1) {
        const sub = code.slice(profilePicIndex);
        const buttonStart = sub.indexOf('<button');
        const saveIndex = sub.indexOf('Save Profile Changes');
        const buttonEnd = sub.indexOf('</button>', saveIndex);

        if (buttonStart !== -1 && saveIndex !== -1 && buttonEnd !== -1) {
            // Find the <button immediately before Save Profile Changes
            const realButtonStart = sub.lastIndexOf('<button', saveIndex);
            const originalButtonBlock = sub.slice(realButtonStart, buttonEnd + 9);

            const replacementUI = `{/* SECTION: PERSONALAUSWEIS / PASS (VORDER- & RÜCKSEITE) */}
                                        <div className="p-6 bg-surface border border-main rounded-3xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <ShieldCheck size={20} className="text-brand" />
                                                    <div>
                                                        <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-white">Personalausweis / Pass</h4>
                                                        <p className="text-[10px] text-gray-400 font-bold">Vorder- und Rückseite als Foto hochladen (Pflicht)</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    {idCardApproved ? (
                                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <CheckCircle size={12} /> Verifiziert
                                                        </span>
                                                    ) : (idCardFront || idCardBack) ? (
                                                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <Clock size={12} /> Wartet auf Admin-Freigabe
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                                            Ausstehend
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                {/* Vorderseite Slot */}
                                                <div className="p-4 bg-dark-900/60 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 relative group">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand">1. Vorderseite</span>
                                                    {idCardFront ? (
                                                        <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 relative">
                                                            <img src={idCardFront} alt="Ausweis Vorderseite" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIdCardFront(null);
                                                                    localStorage.removeItem('driver_id_card_front');
                                                                    syncDriverProfileToCloud({ idCardFront: null });
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-[9px] font-bold"
                                                                title="Entfernen"
                                                            >✕</button>
                                                        </div>
                                                    ) : (
                                                        <label className="w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-brand/60 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05]">
                                                            <Upload size={24} className="text-gray-400 group-hover:text-brand mb-1 transition-colors" />
                                                            <span className="text-[10px] font-black uppercase text-gray-300">Vorderseite wählen</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleIdCardUpload(e, 'front')}
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                {/* Rückseite Slot */}
                                                <div className="p-4 bg-dark-900/60 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 relative group">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand">2. Rückseite</span>
                                                    {idCardBack ? (
                                                        <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 relative">
                                                            <img src={idCardBack} alt="Ausweis Rückseite" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setIdCardBack(null);
                                                                    localStorage.removeItem('driver_id_card_back');
                                                                    syncDriverProfileToCloud({ idCardBack: null });
                                                                }}
                                                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-[9px] font-bold"
                                                                title="Entfernen"
                                                            >✕</button>
                                                        </div>
                                                    ) : (
                                                        <label className="w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-brand/60 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.05]">
                                                            <Upload size={24} className="text-gray-400 group-hover:text-brand mb-1 transition-colors" />
                                                            <span className="text-[10px] font-black uppercase text-gray-300">Rückseite wählen</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleIdCardUpload(e, 'back')}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* SECTION: TERMS & CONDITIONS (AGB) */}
                                        <div className="p-6 bg-surface border border-main rounded-3xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <FileText size={20} className="text-brand" />
                                                    <div>
                                                        <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-white">Terms & Conditions (AGB)</h4>
                                                        <p className="text-[10px] text-gray-400 font-bold">Plattformrichtlinien & Verhaltenskodex für Fahrpersonal</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    {termsAccepted ? (
                                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <CheckCircle size={12} /> Akzeptiert
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider">
                                                            Ausstehend
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTermsModalOpen(true)}
                                                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                                                >
                                                    <FileText size={14} className="text-brand" />
                                                    AGB & Richtlinien lesen
                                                </button>

                                                <label className="flex items-center gap-3 cursor-pointer w-full sm:w-auto p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand/40 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={termsAccepted}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setTermsAccepted(checked);
                                                            localStorage.setItem('driver_terms_accepted', checked ? 'true' : 'false');
                                                            syncDriverProfileToCloud({ termsAccepted: checked });
                                                        }}
                                                        className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                                                    />
                                                    <span className="text-xs font-bold text-gray-300">Ich akzeptiere die AGB & Plattformregeln</span>
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                await syncDriverProfileToCloud();
                                                alert("✅ Fahrer-Profil & Dokumente erfolgreich gespeichert und an Admin übermittelt!");
                                                setView('dashboard');
                                            }}
                                            className="w-full py-5 bg-[var(--brand)] text-[var(--bg-primary)] rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm lg:text-base shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 cursor-pointer"
                                        >
                                            Save Profile Changes
                                        </button>`;

            code = code.slice(0, profilePicIndex + realButtonStart) + replacementUI + code.slice(profilePicIndex + buttonEnd + 9);
        }
    }

    // 5. Add Terms Modal at the end of the return statement before the final closing div
    if (!code.includes('AGB & Richtlinien für Fahrpersonal')) {
        const modalSnippet = `
            {/* TERMS & CONDITIONS MODAL */}
            <AnimatePresence>
                {isTermsModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0b0f19] border border-brand/30 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl text-white max-h-[85vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-brand" size={24} />
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight text-white">AGB & Richtlinien für Fahrpersonal</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Grien Mobility Operations GmbH</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsTermsModalOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                                >✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs md:text-sm text-gray-300 leading-relaxed font-normal">
                                <section className="space-y-1">
                                    <h4 className="font-bold text-white uppercase text-xs">§ 1 Geltungsbereich & Status</h4>
                                    <p>Als registrierter Fahrer auf der Grien Plattform erbringen Sie Fahrdienstleistungen im Auftrag oder in Kooperation mit Ihrem autorisierten Flottenmanager. Alle regionalen Personenbeförderungsgesetze (PBefG § 48 / § 49) sind verbindlich einzuhalten.</p>
                                </section>
                                <section className="space-y-1">
                                    <h4 className="font-bold text-white uppercase text-xs">§ 2 Pflichtdokumente & Identitätsnachweis</h4>
                                    <p>Das Fahrpersonal verpflichtet sich, ein aktuelles biometrisches Passfoto sowie die Vorder- und Rückseite eines gültigen Personalausweises oder Reisepasses im Profil zu hinterlegen. Die Freischaltung erfolgt nach administrativer Prüfung.</p>
                                </section>
                                <section className="space-y-1">
                                    <h4 className="font-bold text-white uppercase text-xs">§ 3 Verhaltenskodex & Kundenservice</h4>
                                    <p>Höchste Zuverlässigkeit, Pünktlichkeit, ein gepflegtes Erscheinungsbild sowie ein respektvoller Umgang mit Fahrgästen sind Kern unseres Qualitätsanspruchs. Manipulationen von GPS-Standorten führen zum sofortigen Entzug der Fahrerlizenz.</p>
                                </section>
                                <section className="space-y-1">
                                    <h4 className="font-bold text-white uppercase text-xs">§ 4 Datenschutz & Telemetrie</h4>
                                    <p>Standortdaten werden ausschließlich während der aktiven Schicht bzw. der Durchführung von Fahraufträgen in Echtzeit erfasst und nicht unbefugt an Dritte weitergegeben.</p>
                                </section>
                            </div>

                            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsTermsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase cursor-pointer"
                                >
                                    Schließen
                                </button>
                                <button
                                    onClick={() => {
                                        setTermsAccepted(true);
                                        localStorage.setItem('driver_terms_accepted', 'true');
                                        syncDriverProfileToCloud({ termsAccepted: true });
                                        setIsTermsModalOpen(false);
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-brand text-dark-900 text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-brand/20 cursor-pointer"
                                >
                                    ✓ Akzeptieren & Schließen
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>`;

        const lastDivIndex = code.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
            code = code.slice(0, lastDivIndex) + modalSnippet + '\n' + code.slice(lastDivIndex);
        }
    }

    // 6. Update view === 'verification' to inform driver that fleet docs are managed by the manager
    const verificationPattern = /\{view === 'verification' && \([\s\S]*?<\/div>\s*\)\}/;
    const verificationReplacement = `{view === 'verification' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-surface border border-main rounded-3xl space-y-4">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={28} className="text-brand" />
                                            <div>
                                                <h3 className="text-base font-black uppercase text-white">Gesetzliche Flottendokumente & Freigaben</h3>
                                                <p className="text-xs text-gray-400 font-medium">Verwaltet durch Ihren Flotten-Manager</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-brand/10 border border-brand/20 rounded-2xl text-xs text-emerald-300 font-bold leading-relaxed">
                                            ℹ️ Hinweis für Fahrer: Gesetzliche Nachweise (Konzession, TÜV, Versicherung, Flotten-Freigabe) werden zentral von Ihrem autorisierten Flotten-Manager eingereicht und vom Grien Admin geprüft. Als Fahrer müssen Sie in Ihrem Profil lediglich Ihr Profilbild, Ihren Personalausweis (Vorder- und Rückseite) hinterlegen und die AGB akzeptieren.
                                        </div>
                                        <button
                                            onClick={() => setView('profile-pic')}
                                            className="px-6 py-3 bg-brand text-dark-900 rounded-xl font-black uppercase text-xs hover:scale-105 transition-all cursor-pointer font-bold"
                                        >
                                            👉 Zu Mein Profil & Ausweis-Upload
                                        </button>
                                    </div>
                                </div>
                            )}`;
    code = code.replace(verificationPattern, verificationReplacement);

    fs.writeFileSync(f, code, 'utf8');
    console.log(`Cleanly updated DriverDashboard in ${f}`);
}
