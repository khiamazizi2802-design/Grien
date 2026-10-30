const fs = require('fs');

const managerFiles = [
    'dgrien-app/src/pages/ManagerDashboard.jsx',
    'admin-portal/src/pages/ManagerDashboard.jsx',
    'client/src/pages/ManagerDashboard.jsx'
];

for (const f of managerFiles) {
    if (!fs.existsSync(f)) continue;
    let code = fs.readFileSync(f, 'utf8');

    const target = `localStorage.setItem(\`green_driver_account_\${loginUser.toLowerCase()}\`, JSON.stringify(created));
                                    } catch(e) {}`;

    const targetCRLF = `localStorage.setItem(\`green_driver_account_\${loginUser.toLowerCase()}\`, JSON.stringify(created));\r
                                    } catch(e) {}`;

    const replacement = `localStorage.setItem(\`green_driver_account_\${loginUser.toLowerCase()}\`, JSON.stringify(created));
                                        
                                        // Save to Firestore and broadcast to Admin Document Hub
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

    if (code.includes(target)) {
        code = code.replace(target, replacement);
        fs.writeFileSync(f, code, 'utf8');
        console.log(`Updated ManagerDashboard in ${f} (LF)`);
    } else if (code.includes(targetCRLF)) {
        code = code.replace(targetCRLF, replacement);
        fs.writeFileSync(f, code, 'utf8');
        console.log(`Updated ManagerDashboard in ${f} (CRLF)`);
    } else {
        console.log(`Target not found in ${f}`);
    }
}
