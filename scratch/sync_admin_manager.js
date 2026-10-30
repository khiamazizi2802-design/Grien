const fs = require('fs');

['admin-portal/src/pages/ManagerDashboard.jsx', 'client/src/pages/ManagerDashboard.jsx'].forEach(f => {
    let code = fs.readFileSync(f, 'utf8');
    const target = 'setDriversList([...driversList, created]);';
    const replacement = `setDriversList([...driversList, created]);
                                    // Save to Firestore & BroadcastChannel
                                    try {
                                        const driverEmailKey = (created.email || '').toLowerCase();
                                        if (driverEmailKey) {
                                            const driverPayload = {
                                                id: created.id,
                                                name: created.name,
                                                email: driverEmailKey,
                                                phone: created.phone || '',
                                                role: 'driver',
                                                businessType: 'FM',
                                                managerId: user?.greenId || user?.id || user?.email || 'FM-MGR',
                                                managerName: user?.name || 'Fleet Manager',
                                                managerEmail: user?.email || '',
                                                accessCode: generatedCode,
                                                pScheinDoc: created.pScheinDoc || null,
                                                fuehrerscheinDoc: created.fuehrerscheinDoc || null,
                                                ausweisDoc: created.ausweisDoc || null,
                                                pScheinApproved: false,
                                                licenseApproved: false,
                                                avatarApproved: false,
                                                idCardApproved: false,
                                                termsAccepted: false,
                                                createdAt: new Date().toISOString()
                                            };
                                            if (typeof fbDb !== 'undefined') {
                                                setDoc(doc(fbDb, 'users', driverEmailKey), driverPayload, { merge: true }).catch(() => {});
                                            }
                                            try {
                                                const bc = new BroadcastChannel('green_fleet_sync');
                                                bc.postMessage({ type: 'DRIVER_UPDATE', driver: driverPayload });
                                                bc.close();
                                            } catch(e) {}
                                        }
                                    } catch(e) {}`;

    if (code.includes(target)) {
        code = code.replace(target, replacement);
        fs.writeFileSync(f, code, 'utf8');
        console.log('Updated', f);
    } else {
        console.log('Target not found in', f);
    }
});
