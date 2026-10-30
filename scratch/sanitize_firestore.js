const fs = require('fs');

function sanitizeFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. In handleUploadDocument:
    content = content.replace(
        `const cleanedForStorage = updated.map(d => ({ id: d.id, name: d.name, status: d.status, requirement: d.requirement, fileUrl: d.fileUrl || null }));
                localStorage.setItem('driver_compliance_docs', JSON.stringify(cleanedForStorage));
                if (user?.email) {
                    updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                        driverComplianceDocs: cleanedForStorage
                    }).catch(err => console.error('Error updating driverComplianceDocs:', err));
                }`,
        `const cleanedForStorage = updated.map(d => ({ id: d.id || '', name: d.name || '', status: d.status || 'missing', requirement: d.requirement || '', fileUrl: d.fileUrl || null }));
                localStorage.setItem('driver_compliance_docs', JSON.stringify(cleanedForStorage));
                if (user?.email) {
                    try {
                        updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                            driverComplianceDocs: cleanedForStorage
                        }).catch(err => console.error('Error updating driverComplianceDocs:', err));
                    } catch(err) {
                        console.error('updateDoc error:', err);
                    }
                }`
    );

    // 2. In vehicle docs:
    content = content.replace(
        `const cleanedForStorage = updated.map(d => ({ id: d.id, name: d.name, status: d.status, requirement: d.requirement, fileUrl: d.fileUrl || null }));
                localStorage.setItem('driver_vehicle_docs', JSON.stringify(cleanedForStorage));
                if (user?.email) {
                    updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                        driverVehicleDocs: cleanedForStorage
                    }).catch(err => console.error('Error updating driverVehicleDocs:', err));
                }`,
        `const cleanedForStorage = updated.map(d => ({ id: d.id || '', name: d.name || '', status: d.status || 'missing', requirement: d.requirement || '', fileUrl: d.fileUrl || null }));
                localStorage.setItem('driver_vehicle_docs', JSON.stringify(cleanedForStorage));
                if (user?.email) {
                    try {
                        updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                            driverVehicleDocs: cleanedForStorage
                        }).catch(err => console.error('Error updating driverVehicleDocs:', err));
                    } catch(err) {
                        console.error('updateDoc error:', err);
                    }
                }`
    );

    // 3. In handleAcceptTerms:
    content = content.replace(
        `if (user?.email) {
                updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                    driverComplianceDocs: updated
                }).catch(err => console.error("Error accepting terms in Firestore:", err));
            }`,
        `if (user?.email) {
                try {
                    const sanitized = updated.map(d => ({ id: d.id || '', name: d.name || '', status: d.status || 'missing', requirement: d.requirement || '', fileUrl: d.fileUrl || null }));
                    updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                        driverComplianceDocs: sanitized
                    }).catch(err => console.error("Error accepting terms in Firestore:", err));
                } catch(err) {
                    console.error('updateDoc error:', err);
                }
            }`
    );

    // 4. In manual upload at line 4734 & 4787:
    content = content.replace(
        `if (user?.email) {
                                                                  updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                                      driverComplianceDocs: updatedDocs
                                                                  }).catch(err => console.error("Error updating driverComplianceDocs in Firestore:", err));
                                                              }`,
        `if (user?.email) {
                                                                  try {
                                                                      const sanitized = updatedDocs.map(d => ({ id: d.id || '', name: d.name || '', status: d.status || 'missing', requirement: d.requirement || '', fileUrl: d.fileUrl || null }));
                                                                      updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                                          driverComplianceDocs: sanitized
                                                                      }).catch(err => console.error("Error updating driverComplianceDocs in Firestore:", err));
                                                                  } catch(e) {}
                                                              }`
    );

    content = content.replace(
        `if (user?.email) {
                                                    updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                        driverComplianceDocs: updatedDocs
                                                    }).catch(err => console.error("Error updating terms in Firestore:", err));
                                                }`,
        `if (user?.email) {
                                                    try {
                                                        const sanitized = updatedDocs.map(d => ({ id: d.id || '', name: d.name || '', status: d.status || 'missing', requirement: d.requirement || '', fileUrl: d.fileUrl || null }));
                                                        updateDoc(doc(fbDb, 'users', user.email.toLowerCase()), {
                                                            driverComplianceDocs: sanitized
                                                        }).catch(err => console.error("Error updating terms in Firestore:", err));
                                                    } catch(e) {}
                                                }`
    );

    // 5. In syncDriverProfileToCloud, sanitize object before setDoc
    content = content.replace(
        `await setDoc(uRef, dataToSave, { merge: true });`,
        `try {
                const sanitized = JSON.parse(JSON.stringify(dataToSave, (k, v) => v === undefined ? null : v));
                await setDoc(uRef, sanitized, { merge: true });
            } catch(e) {
                console.error('setDoc error:', e);
            }`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Sanitized:', filePath);
}

sanitizeFile('C:/Users/AURUMPC/Desktop/Khiam green app 4/dgrien-app/src/pages/DriverDashboard.jsx');
sanitizeFile('C:/Users/AURUMPC/Desktop/Khiam green app 4/client/src/pages/DriverDashboard.jsx');
