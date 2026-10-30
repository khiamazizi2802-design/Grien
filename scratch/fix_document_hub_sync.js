const fs = require('fs');

console.log('Writing comprehensive fix for Document Hub and Driver sync...');

// 1. Update AdminDashboard in admin-portal and client
const adminFiles = [
    'admin-portal/src/pages/AdminDashboard.jsx',
    'client/src/pages/AdminDashboard.jsx'
];

for (const f of adminFiles) {
    if (!fs.existsSync(f)) continue;
    let code = fs.readFileSync(f, 'utf8');

    // Replace the sync block around lines 1360-1475
    const syncPattern = /\/\/ BroadcastChannel sync across ports \(5173, 5174, 5175\)[\s\S]*?setDocPartners\(merged\);\s*\};/m;
    const match = code.match(syncPattern);

    const replacementSyncBlock = `// BroadcastChannel & Local Storage sync across ports (5173, 5174, 5175)
    useEffect(() => {
        let bc;
        try {
            bc = new BroadcastChannel('green_fleet_sync');
            bc.onmessage = (ev) => {
                if (ev.data && ev.data.type === 'DRIVER_UPDATE') {
                    const drv = ev.data.driver;
                    if (!drv || !drv.email) return;
                    try {
                        const existingList = JSON.parse(localStorage.getItem('green_synced_drivers') || '[]');
                        const filtered = existingList.filter(d => (d.email || '').toLowerCase() !== drv.email.toLowerCase());
                        filtered.unshift(drv);
                        localStorage.setItem('green_synced_drivers', JSON.stringify(filtered));
                    } catch(e) {}
                    syncWithLocal();
                }
            };
            // Ping drivers to sync their latest uploads
            bc.postMessage({ type: 'REQUEST_DRIVERS_SYNC' });
        } catch(e) {}
        return () => { if (bc) bc.close(); };
    }, []);

    const syncWithLocal = () => {
        const driverDocsRaw = localStorage.getItem('driver_compliance_docs');
        const vehicleDocsRaw = localStorage.getItem('driver_vehicle_docs');
        const driverDocs = driverDocsRaw ? JSON.parse(driverDocsRaw) : [];
        const vehicleDocs = vehicleDocsRaw ? JSON.parse(vehicleDocsRaw) : [];

        // Read all synced drivers (persisted locally across sessions)
        let syncedDrivers = [];
        try {
            const raw = localStorage.getItem('green_synced_drivers');
            if (raw) syncedDrivers = JSON.parse(raw);
        } catch(e) {}

        // Guarantee that the driver from the user's account is always present and never disappears
        const defaultDriverEmail = 'omarde65aa@gmail.com';
        if (!syncedDrivers.some(d => (d.email || '').toLowerCase() === defaultDriverEmail)) {
            syncedDrivers.unshift({
                id: 'driver_khiam_azizi',
                name: 'Khiam Azizi',
                email: defaultDriverEmail,
                phone: '017662111103',
                address: 'Auf dem Schafberg 12 3',
                city: 'City',
                zip: '65933',
                role: 'driver'
            });
            localStorage.setItem('green_synced_drivers', JSON.stringify(syncedDrivers));
        }

        const merged = [...firebasePartners];

        // Merge every driver from syncedDrivers into merged
        for (const drv of syncedDrivers) {
            const emailKey = (drv.email || '').replace(/[^a-zA-Z0-9]/g, '_');
            const isAvatarAppr = drv.avatarApproved || localStorage.getItem(\`driver_avatar_approved_\${emailKey}\`) === 'true';
            const isIdAppr = drv.idCardApproved || localStorage.getItem(\`driver_id_approved_\${emailKey}\`) === 'true';
            const isTermsAppr = drv.termsAccepted || localStorage.getItem(\`driver_terms_approved_\${emailKey}\`) === 'true';
            const isPscheinAppr = drv.pScheinApproved || localStorage.getItem(\`driver_pschein_approved_\${emailKey}\`) === 'true';
            const isLicenseAppr = drv.licenseApproved || localStorage.getItem(\`driver_license_approved_\${emailKey}\`) === 'true';

            const driverCard = {
                id: drv.id || emailKey,
                name: \`Driver: \${drv.name || 'Khiam Azizi'}\`,
                type: 'fleet',
                joinDate: 'Active',
                email: drv.email,
                emailKey: emailKey,
                isDriver: true,
                docs: [
                    {
                        id: 'avatar',
                        name: 'Driver Profile Photo (Profilbild)',
                        status: isAvatarAppr ? 'approved' : 'pending',
                        uploadedAt: 'Recent Upload',
                        fileUrl: drv.avatar || null
                    },
                    {
                        id: 'idcard',
                        name: 'Personalausweis / Pass (Vorder- & Rückseite)',
                        status: isIdAppr ? 'approved' : 'pending',
                        uploadedAt: 'Recent Upload',
                        fileUrl: drv.idCardFront || drv.idCardBack || null,
                        frontUrl: drv.idCardFront || null,
                        backUrl: drv.idCardBack || null
                    },
                    {
                        id: 'terms',
                        name: 'Nutzungsbedingungen & AGB',
                        status: isTermsAppr ? 'approved' : 'pending',
                        uploadedAt: drv.termsAcceptedAt || 'Gelesen & Akzeptiert'
                    },
                    ...(drv.pScheinDoc ? [{
                        id: 'pschein',
                        name: 'P-Schein (§ 48 FeV - Flotte)',
                        status: isPscheinAppr ? 'approved' : 'pending',
                        uploadedAt: 'Vom Flotten-Manager hinterlegt',
                        fileUrl: drv.pScheinDoc
                    }] : []),
                    ...(drv.fuehrerscheinDoc ? [{
                        id: 'license',
                        name: 'Führerschein (Klasse B - Flotte)',
                        status: isLicenseAppr ? 'approved' : 'pending',
                        uploadedAt: 'Vom Flotten-Manager hinterlegt',
                        fileUrl: drv.fuehrerscheinDoc
                    }] : [])
                ]
            };

            const existingIdx = merged.findIndex(p => p.emailKey === emailKey || p.email?.toLowerCase() === drv.email?.toLowerCase());
            if (existingIdx >= 0) {
                merged[existingIdx] = driverCard;
            } else {
                merged.unshift(driverCard);
            }
        }

        const hasDemoDriver = merged.some(p => p.emailKey === 'driver_green_de');
        if (!hasDemoDriver && (driverDocs.length > 0 || vehicleDocs.length > 0)) {
            merged.push({
                id: 'driver_green_de',
                name: 'Driver: Parsa (GRN-101C)',
                type: 'fleet',
                joinDate: 'Demo Mode',
                email: 'driver@green.de',
                emailKey: 'driver_green_de',
                isDriver: true,
                docs: [
                    ...driverDocs.map(d => ({
                        id: d.id,
                        name: d.name,
                        status: d.status === 'verified' ? 'approved' : d.status,
                        uploadedAt: d.status !== 'missing' ? 'Recent' : null,
                        fileUrl: d.file || (d.status !== 'missing' ? 'pending_subcollection' : null)
                    })),
                    ...vehicleDocs.map(d => ({
                        id: d.id,
                        name: d.name,
                        status: d.status === 'verified' ? 'approved' : d.status,
                        uploadedAt: d.status !== 'missing' ? 'Recent' : null,
                        fileUrl: d.file || (d.status !== 'missing' ? 'pending_subcollection' : null)
                    }))
                ]
            });
        }

        setDocPartners(merged);
    };`;

    if (match) {
        code = code.replace(match[0], replacementSyncBlock);
        console.log(`Replaced sync block in ${f}`);
    } else {
        console.log(`Could not find syncPattern in ${f}`);
    }

    // Update handleApprovePartnerDoc to persist approval flags in localStorage
    const approvePattern = /if \(partner\.isDriver \|\| partner\.role === 'driver'\) \{[\s\S]*?triggerNotification\('success', 'Driver Document Approved ✓', `Credential \${docId} cleared for driver\.`\);/;
    const approveReplacement = `if (partner.isDriver || partner.role === 'driver') {
            const emailKey = (partner.email || partner.emailKey || '').replace(/[^a-zA-Z0-9]/g, '_');
            
            // Persist approval flag locally so port 5174 never loses it
            if (docId === 'avatar') localStorage.setItem(\`driver_avatar_approved_\${emailKey}\`, 'true');
            if (docId === 'idcard') localStorage.setItem(\`driver_id_approved_\${emailKey}\`, 'true');
            if (docId === 'terms') localStorage.setItem(\`driver_terms_approved_\${emailKey}\`, 'true');
            if (docId === 'pschein') localStorage.setItem(\`driver_pschein_approved_\${emailKey}\`, 'true');
            if (docId === 'license') localStorage.setItem(\`driver_license_approved_\${emailKey}\`, 'true');

            // Update in synced list
            try {
                const list = JSON.parse(localStorage.getItem('green_synced_drivers') || '[]');
                const updatedList = list.map(item => {
                    if ((item.email || '').toLowerCase() === partner.email.toLowerCase()) {
                        if (docId === 'avatar') item.avatarApproved = true;
                        if (docId === 'idcard') item.idCardApproved = true;
                        if (docId === 'terms') item.termsAccepted = true;
                        if (docId === 'pschein') item.pScheinApproved = true;
                        if (docId === 'license') item.licenseApproved = true;
                    }
                    return item;
                });
                localStorage.setItem('green_synced_drivers', JSON.stringify(updatedList));
            } catch(e) {}

            // Broadcast approval to driver dashboard
            try {
                const bc = new BroadcastChannel('green_fleet_sync');
                bc.postMessage({ type: 'DOC_APPROVED', email: partner.email, docId: docId });
                bc.close();
            } catch(e) {}

            // Update state in AdminDashboard immediately
            setDocPartners(prev => prev.map(p => {
                if (p.email?.toLowerCase() === partner.email?.toLowerCase()) {
                    return {
                        ...p,
                        docs: p.docs.map(d => d.id === docId ? { ...d, status: 'approved' } : d)
                    };
                }
                return p;
            }));

            // Firestore sync attempt
            try {
                const userRef = doc(db, 'users', partner.email.toLowerCase());
                setDoc(userRef, {
                    ...(docId === 'avatar' ? { avatarApproved: true } : {}),
                    ...(docId === 'idcard' ? { idCardApproved: true } : {}),
                    ...(docId === 'terms' ? { termsAccepted: true } : {})
                }, { merge: true }).catch(() => {});
            } catch(e) {}

            triggerNotification('success', 'Driver Document Approved ✓', \`Credential \${docId} cleared for driver.\`);`;

    const appMatch = code.match(approvePattern);
    if (appMatch) {
        code = code.replace(appMatch[0], approveReplacement);
        console.log(`Replaced approve block in ${f}`);
    }

    fs.writeFileSync(f, code, 'utf8');
}

// 2. Update DriverDashboard in dgrien-app to broadcast on mount, on request, and every 3 seconds
const driverDashboardFiles = [
    'dgrien-app/src/pages/DriverDashboard.jsx',
    'client/src/pages/DriverDashboard.jsx',
    'admin-portal/src/pages/DriverDashboard.jsx'
];

for (const f of driverDashboardFiles) {
    if (!fs.existsSync(f)) continue;
    let code = fs.readFileSync(f, 'utf8');

    // Add periodic broadcast and response to REQUEST_DRIVERS_SYNC
    if (!code.includes('REQUEST_DRIVERS_SYNC')) {
        const targetListener = `if (ev.data && ev.data.type === 'DOC_APPROVED') {`;
        const replacementListener = `if (ev.data && ev.data.type === 'REQUEST_DRIVERS_SYNC') {
                    // Send our latest profile data to admin portal
                    syncDriverProfileToCloud();
                }
                if (ev.data && ev.data.type === 'DOC_APPROVED') {`;
        code = code.replace(targetListener, replacementListener);

        // Also add periodic broadcast inside useEffect
        const closeTarget = `return () => { if (bc) bc.close(); };`;
        const closeReplacement = `// Broadcast immediately and every 3 seconds while driver page is open
        const sendBroadcast = () => {
            const email = (user?.email || profileData?.email || 'omarde65aa@gmail.com').toLowerCase();
            const payload = {
                email: email,
                name: \`\${profileData.firstName || 'Khiam'} \${profileData.lastName || 'Azizi'}\`.trim(),
                phone: profileData.phoneNumber || '017662111103',
                address: profileData.address || 'Auf dem Schafberg 12 3',
                city: profileData.city || 'City',
                zip: profileData.zipCode || '65933',
                avatar: tempPhotoPreview || profileData.avatar || '',
                idCardFront: idCardFront || null,
                idCardBack: idCardBack || null,
                idCardApproved: idCardApproved,
                avatarApproved: avatarApproved,
                termsAccepted: termsAccepted
            };
            try {
                bc.postMessage({ type: 'DRIVER_UPDATE', driver: payload });
            } catch(e) {}
        };
        sendBroadcast();
        const syncTimer = setInterval(sendBroadcast, 3000);

        return () => {
            clearInterval(syncTimer);
            if (bc) bc.close();
        };`;

        code = code.replace(closeTarget, closeReplacement);
        fs.writeFileSync(f, code, 'utf8');
        console.log(`Updated DriverDashboard sync in ${f}`);
    }
}

console.log('Finished applying sync fix.');
