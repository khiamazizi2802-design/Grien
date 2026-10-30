const fs = require('fs');

function updateAdmin(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. firebasePartnersRef
    if (!content.includes('const firebasePartnersRef = useRef([]);')) {
        content = content.replace(
            'const [docPartners, setDocPartners] = useState([]);',
            'const [docPartners, setDocPartners] = useState([]);\n    const firebasePartnersRef = useRef([]);'
        );
    }

    content = content.replace(
        'firebasePartners = partners;',
        'firebasePartnersRef.current = partners;'
    );

    content = content.replace(
        'const merged = [...firebasePartners];',
        'const merged = [...(firebasePartnersRef.current || [])];'
    );

    // 2. Enhance syncWithLocal with /api/sync-driver fetch
    const syncPattern = `// Fetch latest driver data from local cross-port bridge`;
    if (!content.includes(syncPattern)) {
        const target = `const defaultDriverEmail = 'omarde65aa@gmail.com';`;
        const addition = `        // Fetch latest driver data from local cross-port bridge
        try {
            fetch('/api/sync-driver').then(r => r.json()).then(apiDriver => {
                if (apiDriver && apiDriver.email) {
                    try {
                        const curList = JSON.parse(localStorage.getItem('green_synced_drivers') || '[]');
                        const idx = curList.findIndex(d => (d.email || '').toLowerCase() === apiDriver.email.toLowerCase());
                        if (idx >= 0) {
                            curList[idx] = { ...curList[idx], ...apiDriver };
                        } else {
                            curList.unshift(apiDriver);
                        }
                        localStorage.setItem('green_synced_drivers', JSON.stringify(curList));
                    } catch(e) {}
                }
            }).catch(() => {});
        } catch(e) {}

        const defaultDriverEmail = 'omarde65aa@gmail.com';`;
        content = content.replace(target, addition);
    }

    // 3. In handleApprovePartnerDoc, notify local API bridge
    const approveBridgePattern = `fetch('/api/sync-driver', { method: 'POST'`;
    if (!content.includes(approveBridgePattern)) {
        const approveTarget = `if (docId === 'license') localStorage.setItem(\`driver_license_approved_\${emailKey}\`, 'true');`;
        const approveAddition = `if (docId === 'license') localStorage.setItem(\`driver_license_approved_\${emailKey}\`, 'true');
            try {
                fetch('/api/sync-driver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: partner.email,
                        ...(docId === 'avatar' ? { avatarApproved: true } : {}),
                        ...(docId === 'idcard' ? { idCardApproved: true } : {}),
                        ...(docId === 'terms' ? { termsAccepted: true } : {})
                    })
                }).catch(() => {});
            } catch(e) {}`;
        content = content.replace(approveTarget, approveAddition);
    }

    // 4. In handleRejectPartnerDoc, notify local API bridge
    const rejectTarget = `triggerNotification('warning', 'Driver Document Rejected ✗', \`Credential rejected.\`);`;
    if (content.includes(rejectTarget)) {
        const rejectAddition = `try {
                const emailKey = (partner.email || partner.emailKey || '').replace(/[^a-zA-Z0-9]/g, '_');
                if (docId === 'avatar') localStorage.setItem(\`driver_avatar_approved_\${emailKey}\`, 'false');
                if (docId === 'idcard') localStorage.setItem(\`driver_id_approved_\${emailKey}\`, 'false');
                if (docId === 'terms') localStorage.setItem(\`driver_terms_approved_\${emailKey}\`, 'false');
                fetch('/api/sync-driver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: partner.email,
                        ...(docId === 'avatar' ? { avatarApproved: false } : {}),
                        ...(docId === 'idcard' ? { idCardApproved: false } : {}),
                        ...(docId === 'terms' ? { termsAccepted: false } : {})
                    })
                }).catch(() => {});
            } catch(e) {}
            triggerNotification('warning', 'Driver Document Rejected ✗', \`Credential rejected.\`);`;
        content = content.replace(rejectTarget, rejectAddition);
    }

    // 5. In handleViewPartnerDoc, support both front & back preview for Ausweis
    const viewTarget = `let url = docState?.fileUrl || docState?.fileData || docState?.file;`;
    if (!content.includes('docState?.frontUrl || docState?.backUrl')) {
        const viewAddition = `if (docState?.frontUrl || docState?.backUrl) {
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.title = 'Personalausweis (Vorder- und Rückseite)';
                newWindow.document.body.style.margin = '0';
                newWindow.document.body.style.padding = '24px';
                newWindow.document.body.style.background = '#0a0a0a';
                newWindow.document.body.style.display = 'flex';
                newWindow.document.body.style.flexDirection = 'column';
                newWindow.document.body.style.justifyContent = 'center';
                newWindow.document.body.style.alignItems = 'center';
                newWindow.document.body.style.gap = '24px';
                newWindow.document.body.style.minHeight = '100vh';
                
                if (docState.frontUrl) {
                    const wrap = newWindow.document.createElement('div');
                    wrap.style.textAlign = 'center';
                    wrap.innerHTML = '<p style="color:#00ff88;font-family:sans-serif;margin:0 0 8px 0;font-weight:900;text-transform:uppercase;font-size:11px;letter-spacing:1px">1. Vorderseite</p>';
                    const img = newWindow.document.createElement('img');
                    img.src = docState.frontUrl;
                    img.style.maxWidth = '85vw';
                    img.style.maxHeight = '42vh';
                    img.style.borderRadius = '16px';
                    img.style.border = '1px solid rgba(255,255,255,0.15)';
                    img.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
                    wrap.appendChild(img);
                    newWindow.document.body.appendChild(wrap);
                }
                if (docState.backUrl) {
                    const wrap = newWindow.document.createElement('div');
                    wrap.style.textAlign = 'center';
                    wrap.innerHTML = '<p style="color:#00ff88;font-family:sans-serif;margin:0 0 8px 0;font-weight:900;text-transform:uppercase;font-size:11px;letter-spacing:1px">2. Rückseite</p>';
                    const img = newWindow.document.createElement('img');
                    img.src = docState.backUrl;
                    img.style.maxWidth = '85vw';
                    img.style.maxHeight = '42vh';
                    img.style.borderRadius = '16px';
                    img.style.border = '1px solid rgba(255,255,255,0.15)';
                    img.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';
                    wrap.appendChild(img);
                    newWindow.document.body.appendChild(wrap);
                }
                return;
            }
        }
        let url = docState?.fileUrl || docState?.fileData || docState?.file;`;
        content = content.replace(viewTarget, viewAddition);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated:', filePath);
}

updateAdmin('C:/Users/AURUMPC/Desktop/Khiam green app 4/admin-portal/src/pages/AdminDashboard.jsx');
updateAdmin('C:/Users/AURUMPC/Desktop/Khiam green app 4/client/src/pages/AdminDashboard.jsx');
