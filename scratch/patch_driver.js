const fs = require('fs');

function updateDriver(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. In syncDriverProfileToCloud, add fetch to local bridge
    const targetPost = `            try {
                const bc = new BroadcastChannel('green_fleet_sync');`;
    const additionPost = `            try {
                fetch('http://localhost:5174/api/sync-driver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave)
                }).catch(() => {});
            } catch(e) {}

            try {
                const bc = new BroadcastChannel('green_fleet_sync');`;
    
    if (!content.includes(`fetch('http://localhost:5174/api/sync-driver'`)) {
        content = content.replace(targetPost, additionPost);
    }

    // 2. In sendBroadcast, sync to bridge and poll approval status
    const targetBroadcast = `            try {
                bc.postMessage({ type: 'DRIVER_UPDATE', driver: payload });
            } catch(e) {}`;
    const additionBroadcast = `            try {
                bc.postMessage({ type: 'DRIVER_UPDATE', driver: payload });
            } catch(e) {}

            try {
                fetch('http://localhost:5174/api/sync-driver', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(r => r.json()).then(data => {
                    if (data) {
                        if (data.avatarApproved === true && !avatarApproved) {
                            setAvatarApproved(true);
                            localStorage.setItem('driver_avatar_approved', 'true');
                        }
                        if (data.idCardApproved === true && !idCardApproved) {
                            setIdCardApproved(true);
                            localStorage.setItem('driver_id_card_approved', 'true');
                        }
                        if (data.termsAccepted === true && !termsAccepted) {
                            setTermsAccepted(true);
                            localStorage.setItem('driver_terms_accepted', 'true');
                        }
                    }
                }).catch(() => {});
            } catch(e) {}`;

    if (content.includes(targetBroadcast) && !content.includes(`data.avatarApproved === true && !avatarApproved`)) {
        content = content.replace(targetBroadcast, additionBroadcast);
    }

    // 3. In avatar upload handler, make sure syncDriverProfileToCloud({ avatar: compressed }) is called
    const targetAvatar = `handleUploadDocument('avatar', compressed);`;
    const additionAvatar = `handleUploadDocument('avatar', compressed);
                                                    syncDriverProfileToCloud({ avatar: compressed });`;
    if (content.includes(targetAvatar) && !content.includes(`syncDriverProfileToCloud({ avatar: compressed });`)) {
        content = content.replace(targetAvatar, additionAvatar);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('DriverDashboard successfully updated:', filePath);
}

updateDriver('C:/Users/AURUMPC/Desktop/Khiam green app 4/dgrien-app/src/pages/DriverDashboard.jsx');
updateDriver('C:/Users/AURUMPC/Desktop/Khiam green app 4/client/src/pages/DriverDashboard.jsx');
