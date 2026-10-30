const fs = require('fs');

const files = [
    'admin-portal/src/pages/AdminDashboard.jsx',
    'client/src/pages/AdminDashboard.jsx'
];

for (const f of files) {
    if (!fs.existsSync(f)) continue;
    let content = fs.readFileSync(f, 'utf8');

    // Remove the three items or comment them out
    const targetBlock = `{ id: 'hotels', label: 'Hospitality VIP', icon: Building2 },\n                        { id: 'events', label: 'Partys Events', icon: Calendar },\n                        { id: 'system-doors', label: 'Portal Doors', icon: Monitor },`;
    const targetBlockCRLF = `{ id: 'hotels', label: 'Hospitality VIP', icon: Building2 },\r\n                        { id: 'events', label: 'Partys Events', icon: Calendar },\r\n                        { id: 'system-doors', label: 'Portal Doors', icon: Monitor },`;

    if (content.includes(targetBlock)) {
        content = content.replace(targetBlock, '// Temporarily hidden per user request\n                        // { id: \'hotels\', label: \'Hospitality VIP\', icon: Building2 },\n                        // { id: \'events\', label: \'Partys Events\', icon: Calendar },\n                        // { id: \'system-doors\', label: \'Portal Doors\', icon: Monitor },');
        fs.writeFileSync(f, content, 'utf8');
        console.log(`Updated ${f} (LF)`);
    } else if (content.includes(targetBlockCRLF)) {
        content = content.replace(targetBlockCRLF, '// Temporarily hidden per user request\r\n                        // { id: \'hotels\', label: \'Hospitality VIP\', icon: Building2 },\r\n                        // { id: \'events\', label: \'Partys Events\', icon: Calendar },\r\n                        // { id: \'system-doors\', label: \'Portal Doors\', icon: Monitor },');
        fs.writeFileSync(f, content, 'utf8');
        console.log(`Updated ${f} (CRLF)`);
    } else {
        // Regex fallback
        const regex = /\{\s*id:\s*'hotels'[\s\S]*?\{\s*id:\s*'system-doors'[^\n]*\n/g;
        if (regex.test(content)) {
            content = content.replace(regex, '// Temporarily hidden per user request\n');
            fs.writeFileSync(f, content, 'utf8');
            console.log(`Updated ${f} via regex`);
        } else {
            console.log(`Block not found in ${f}`);
        }
    }
}
