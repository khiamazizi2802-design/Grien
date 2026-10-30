const fs = require('fs');

function fixTDZ(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove tempPhotoPreview from lower down
    const oldDeclaration1 = `const [tempPhotoPreview, setTempPhotoPreview] = useState(() => localStorage.getItem('driver_profile_avatar') || null);`;
    const oldDeclaration2 = `const [tempPhotoPreview, setTempPhotoPreview] = useState(null);`;

    if (content.includes(oldDeclaration1)) {
        content = content.replace(oldDeclaration1, `// tempPhotoPreview moved to top`);
    } else if (content.includes(oldDeclaration2)) {
        content = content.replace(oldDeclaration2, `// tempPhotoPreview moved to top`);
    }

    // Insert tempPhotoPreview right after profileData state
    const target = `    const [profileData, setProfileData] = useState({`;
    if (!content.includes(`const [tempPhotoPreview, setTempPhotoPreview] = useState(() => localStorage.getItem('driver_profile_avatar') || null);`)) {
        content = content.replace(
            target,
            `    const [tempPhotoPreview, setTempPhotoPreview] = useState(() => localStorage.getItem('driver_profile_avatar') || null);\n${target}`
        );
        console.log('Moved tempPhotoPreview to top of', filePath);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

fixTDZ('C:/Users/AURUMPC/Desktop/Khiam green app 4/dgrien-app/src/pages/DriverDashboard.jsx');
fixTDZ('C:/Users/AURUMPC/Desktop/Khiam green app 4/client/src/pages/DriverDashboard.jsx');
fixTDZ('C:/Users/AURUMPC/Desktop/Khiam green app 4/admin-portal/src/pages/DriverDashboard.jsx');
console.log('TDZ fix completed!');
