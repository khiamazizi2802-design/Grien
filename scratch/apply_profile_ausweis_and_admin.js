const fs = require('fs');

console.log('Starting implementation of driver profile, ausweis upload, terms & conditions, and admin approval sync...');

// 1. Update AdminDashboard.jsx in admin-portal and client
const adminFiles = [
    'admin-portal/src/pages/AdminDashboard.jsx',
    'client/src/pages/AdminDashboard.jsx'
];

for (const f of adminFiles) {
    if (!fs.existsSync(f)) continue;
    let code = fs.readFileSync(f, 'utf8');

    // Make sure broadcast listener is inside AdminDashboard
    if (!code.includes('green_fleet_sync')) {
        const syncTarget = `const [docPartners, setDocPartners] = useState([]);`;
        const syncReplacement = `const [docPartners, setDocPartners] = useState([]);

    // BroadcastChannel sync across ports (5173, 5174, 5175)
    useEffect(() => {
        let bc;
        try {
            bc = new BroadcastChannel('green_fleet_sync');
            bc.onmessage = (ev) => {
                if (ev.data && ev.data.type === 'DRIVER_UPDATE') {
                    const drv = ev.data.driver;
                    if (!drv || !drv.email) return;
                    setDocPartners(prev => {
                        const emailKey = drv.email.replace(/[^a-zA-Z0-9]/g, '_');
                        const existingIdx = prev.findIndex(p => p.emailKey === emailKey || p.email?.toLowerCase() === drv.email?.toLowerCase());
                        const driverPartnerObj = {
                            id: drv.id || emailKey,
                            name: \`Driver: \${drv.name || 'Khiam Azizi'}\`,
                            type: 'fleet',
                            joinDate: 'Today',
                            email: drv.email,
                            emailKey: emailKey,
                            isDriver: true,
                            docs: [
                                {
                                    id: 'avatar',
                                    name: 'Driver Profile Photo (Profilbild)',
                                    status: drv.avatarApproved ? 'approved' : (drv.avatar ? 'pending' : 'missing'),
                                    uploadedAt: 'Recent',
                                    fileUrl: drv.avatar || null
                                },
                                {
                                    id: 'idcard',
                                    name: 'Personalausweis / Pass (Vorder- & Rückseite)',
                                    status: drv.idCardApproved ? 'approved' : ((drv.idCardFront || drv.idCardBack) ? 'pending' : 'missing'),
                                    uploadedAt: 'Recent',
                                    fileUrl: drv.idCardFront || drv.idCardBack || null,
                                    frontUrl: drv.idCardFront || null,
                                    backUrl: drv.idCardBack || null
                                },
                                {
                                    id: 'terms',
                                    name: 'Nutzungsbedingungen & AGB',
                                    status: drv.termsAccepted ? 'approved' : 'missing',
                                    uploadedAt: drv.termsAcceptedAt || 'Ausstehend'
                                },
                                ...(drv.pScheinDoc ? [{
                                    id: 'pschein',
                                    name: 'P-Schein (§ 48 FeV - Flotte)',
                                    status: drv.pScheinApproved ? 'approved' : 'pending',
                                    uploadedAt: 'Vom Flotten-Manager hinterlegt',
                                    fileUrl: drv.pScheinDoc
                                }] : []),
                                ...(drv.fuehrerscheinDoc ? [{
                                    id: 'license',
                                    name: 'Führerschein (Klasse B - Flotte)',
                                    status: drv.licenseApproved ? 'approved' : 'pending',
                                    uploadedAt: 'Vom Flotten-Manager hinterlegt',
                                    fileUrl: drv.fuehrerscheinDoc
                                }] : [])
                            ]
                        };

                        if (existingIdx >= 0) {
                            const updated = [...prev];
                            updated[existingIdx] = driverPartnerObj;
                            return updated;
                        } else {
                            return [driverPartnerObj, ...prev];
                        }
                    });
                }
            };
        } catch(e) {}
        return () => { if (bc) bc.close(); };
    }, []);`;
        code = code.replace(syncTarget, syncReplacement);
    }

    // Enhance handleApprovePartnerDoc in AdminDashboard to broadcast approval
    const approvePattern = /if \(partner\.isDriver \|\| partner\.role === 'driver'\) \{[\s\S]*?triggerNotification\('success', 'Driver Document Approved ✓', `Credential cleared for driver\.`\);/;
    const approveMatch = code.match(approvePattern);
    if (approveMatch) {
        const enhancedApprove = `if (partner.isDriver || partner.role === 'driver') {
            const userRef = doc(db, 'users', partner.email.toLowerCase());
            try {
                const userSnap = await getDoc(userRef);
                let driverComplianceDocs = [];
                let driverVehicleDocs = [];
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    driverComplianceDocs = userData.driverComplianceDocs || [];
                    driverVehicleDocs = userData.driverVehicleDocs || [];
                }
                
                let found = false;
                driverComplianceDocs = driverComplianceDocs.map(d => {
                    if (d.id === docId) {
                        found = true;
                        return { ...d, status: 'verified' };
                    }
                    return d;
                });
                if (!found) {
                    driverComplianceDocs.push({ id: docId, status: 'verified' });
                }

                const extraUpdates = {};
                if (docId === 'avatar') extraUpdates.avatarApproved = true;
                if (docId === 'idcard') extraUpdates.idCardApproved = true;
                if (docId === 'terms') extraUpdates.termsAccepted = true;
                if (docId === 'pschein') extraUpdates.pScheinApproved = true;
                if (docId === 'license') extraUpdates.licenseApproved = true;

                await setDoc(userRef, {
                    driverComplianceDocs,
                    driverVehicleDocs,
                    ...extraUpdates
                }, { merge: true });

                // Cross-port broadcast to driver dashboard
                try {
                    const bc = new BroadcastChannel('green_fleet_sync');
                    bc.postMessage({ type: 'DOC_APPROVED', email: partner.email, docId: docId });
                    bc.close();
                } catch(e) {}

                // Update local state in AdminDashboard immediately
                setDocPartners(prev => prev.map(p => {
                    if (p.email?.toLowerCase() === partner.email?.toLowerCase()) {
                        return {
                            ...p,
                            docs: p.docs.map(d => d.id === docId ? { ...d, status: 'approved' } : d)
                        };
                    }
                    return p;
                }));

                triggerNotification('success', 'Driver Document Approved ✓', \`Credential \${docId} cleared for driver.\`);`;
        code = code.replace(approveMatch[0], enhancedApprove);
    }

    // Enhance driver parsing in Firestore listener so driver docs are always rich
    const driverDocsParsingPattern = /if \(data\.role === 'driver'\) \{\s*const driverDocs = data\.driverComplianceDocs \|\| \[\];[\s\S]*?docs = \[\s*\.\.\.driverDocs\.map[\s\S]*?\.\.\.vehicleDocs\.map[\s\S]*?\];/;
    const driverDocsMatch = code.match(driverDocsParsingPattern);
    if (driverDocsMatch) {
        const enhancedDocsParsing = `if (data.role === 'driver') {
                    const driverDocs = data.driverComplianceDocs || [];
                    const docsList = [...driverDocs];
                    
                    // Avatar check
                    const avatarDoc = docsList.find(d => d.id === 'avatar');
                    const hasAvatarData = !!(data.avatar || data.photoUrl || avatarDoc?.fileUrl || avatarDoc?.file);
                    const avatarStatus = data.avatarApproved ? 'approved' : (avatarDoc?.status === 'verified' ? 'approved' : (hasAvatarData ? 'pending' : 'missing'));
                    if (!avatarDoc) {
                        docsList.unshift({
                            id: 'avatar',
                            name: 'Driver Profile Photo (Profilbild)',
                            status: avatarStatus,
                            fileUrl: data.avatar || data.photoUrl || null
                        });
                    } else {
                        avatarDoc.status = avatarStatus;
                        avatarDoc.fileUrl = avatarDoc.fileUrl || data.avatar || data.photoUrl || null;
                    }

                    // ID Card (Ausweis Vorder- & Rückseite) check
                    const idCardDoc = docsList.find(d => d.id === 'idcard');
                    const hasIdCard = !!(data.idCardFront || data.idCardBack || data.ausweisDoc || idCardDoc?.fileUrl || idCardDoc?.file);
                    const idCardStatus = data.idCardApproved ? 'approved' : (idCardDoc?.status === 'verified' ? 'approved' : (hasIdCard ? 'pending' : 'missing'));
                    if (!idCardDoc) {
                        docsList.push({
                            id: 'idcard',
                            name: 'Personalausweis / Pass (Vorder- & Rückseite)',
                            status: idCardStatus,
                            fileUrl: data.idCardFront || data.idCardBack || data.ausweisDoc || null,
                            frontUrl: data.idCardFront || null,
                            backUrl: data.idCardBack || null
                        });
                    } else {
                        idCardDoc.status = idCardStatus;
                        idCardDoc.fileUrl = idCardDoc.fileUrl || data.idCardFront || data.idCardBack || data.ausweisDoc || null;
                        idCardDoc.frontUrl = data.idCardFront || null;
                        idCardDoc.backUrl = data.idCardBack || null;
                    }

                    // Terms check
                    const termsDoc = docsList.find(d => d.id === 'terms');
                    const termsStatus = data.termsAccepted ? 'approved' : (termsDoc?.status === 'verified' ? 'approved' : 'missing');
                    if (!termsDoc) {
                        docsList.push({
                            id: 'terms',
                            name: 'Allgemeine Geschäftsbedingungen (AGB)',
                            status: termsStatus,
                            fileUrl: null
                        });
                    } else {
                        termsDoc.status = termsStatus;
                    }

                    // P-Schein & Führerschein from Fleet Manager if present
                    if (data.pScheinDoc && !docsList.some(d => d.id === 'pschein')) {
                        docsList.push({
                            id: 'pschein',
                            name: 'P-Schein (§ 48 FeV - Flotte)',
                            status: data.pScheinApproved ? 'approved' : 'pending',
                            fileUrl: data.pScheinDoc
                        });
                    }
                    if (data.fuehrerscheinDoc && !docsList.some(d => d.id === 'license')) {
                        docsList.push({
                            id: 'license',
                            name: 'Führerschein (Klasse B - Flotte)',
                            status: data.licenseApproved ? 'approved' : 'pending',
                            fileUrl: data.fuehrerscheinDoc
                        });
                    }

                    docs = docsList.map(d => ({
                        id: d.id,
                        name: d.name,
                        status: d.status,
                        uploadedAt: d.status !== 'missing' ? 'Recent' : null,
                        fileUrl: d.fileUrl || null,
                        frontUrl: d.frontUrl || null,
                        backUrl: d.backUrl || null
                    }));`;
        code = code.replace(driverDocsMatch[0], enhancedDocsParsing);
    }

    fs.writeFileSync(f, code, 'utf8');
    console.log(`Enhanced AdminDashboard in ${f}`);
}
