const fs = require('fs');

['admin-portal/src/pages/ManagerDashboard.jsx', 'client/src/pages/ManagerDashboard.jsx'].forEach(f => {
    let code = fs.readFileSync(f, 'utf8');
    const regex = /localStorage\.setItem\(`green_driver_account_\$\{loginUser\.toLowerCase\(\)\}`[^\n]*\r?\n\s*\} catch\(e\) \{\}/;
    const match = code.match(regex);
    if (match) {
        const replacementSnippet = `// Save to Firestore and broadcast to Admin Document Hub
                                        const driverEmailKey = (created.email || loginUser || '').toLowerCase();
                                        if (driverEmailKey) {
                                            const driverPayload = {
                                                id: created.id,
                                                name: created.name,
                                                email: driverEmailKey,
                                                phone: created.phone || '',
                                                loginUsername: loginUser,
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
        code = code.replace(match[0], match[0].replace('} catch(e) {}', replacementSnippet));
        fs.writeFileSync(f, code, 'utf8');
        console.log('Updated', f);
    } else {
        console.log('Not matched in', f);
    }
});
