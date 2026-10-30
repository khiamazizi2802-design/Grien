const fs = require('fs');

const files = [
    'dgrien-app/src/pages/DriverDashboard.jsx',
    'admin-portal/src/pages/DriverDashboard.jsx',
    'client/src/pages/DriverDashboard.jsx'
];

for (const f of files) {
    if (!fs.existsSync(f)) continue;
    let code = fs.readFileSync(f, 'utf8');

    // Extract the profileData definition
    const profileDefTarget = `const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        email: user?.email || '',
        zipCode: '',
        city: '',
        phoneNumber: '',
        avatar: \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user?.name || 'Parsa'}\`
    });`;

    const profileDefTargetCRLF = `const [profileData, setProfileData] = useState({\r
        firstName: '',\r
        lastName: '',\r
        address: '',\r
        email: user?.email || '',\r
        zipCode: '',\r
        city: '',\r
        phoneNumber: '',\r
        avatar: \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user?.name || 'Parsa'}\`\r
    });`;

    // Remove it from its current position
    let found = false;
    if (code.includes(profileDefTarget)) {
        code = code.replace(profileDefTarget, '');
        found = true;
    } else if (code.includes(profileDefTargetCRLF)) {
        code = code.replace(profileDefTargetCRLF, '');
        found = true;
    }

    if (found) {
        // Place it right after `const [profileSheetOpen, setProfileSheetOpen] = useState(false);`
        const anchor = `const [profileSheetOpen, setProfileSheetOpen] = useState(false);`;
        const rep = `const [profileSheetOpen, setProfileSheetOpen] = useState(false);\n    const [profileData, setProfileData] = useState({\n        firstName: '',\n        lastName: '',\n        address: '',\n        email: user?.email || '',\n        zipCode: '',\n        city: '',\n        phoneNumber: '',\n        avatar: \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user?.name || 'Parsa'}\`\n    });`;

        code = code.replace(anchor, rep);

        // Also make sure useEffect dependency uses user?.email safely
        code = code.replace('[user?.email, profileData.email]', '[user?.email, profileData?.email]');
        
        fs.writeFileSync(f, code, 'utf8');
        console.log(`Fixed TDZ order in ${f}`);
    } else {
        console.log(`Could not find profileData definition in ${f}`);
    }
}
