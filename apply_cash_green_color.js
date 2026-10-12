const fs = require('fs');
const path = require('path');

const targets = [
    path.join(__dirname, 'client', 'src', 'pages', 'ManagerDashboard.jsx'),
    path.join(__dirname, 'admin-portal', 'src', 'pages', 'ManagerDashboard.jsx')
];

for (const targetFile of targets) {
    if (!fs.existsSync(targetFile)) {
        console.error('File not found:', targetFile);
        process.exit(1);
    }
    let content = fs.readFileSync(targetFile, 'utf8');

    // 1. KPI 1: Bar-Trips badge from amber to emerald
    content = content.replace(
        `isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'`,
        `isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'`
    );

    // 2. KPI 2: Bar-Gross badge from amber to emerald
    content = content.replace(
        `isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'`,
        `isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'`
    );

    // 3. KPI 3: Bar-Offset text color
    content = content.replace(
        `isLight ? 'text-amber-700' : 'text-amber-400'`,
        `isLight ? 'text-emerald-700' : 'text-emerald-400'`
    );
    content = content.replace(
        `span className="font-black text-amber-500">`,
        `span className="font-black text-emerald-500">`
    );

    // 4. KPI 4: "Fahrer ->" link text
    content = content.replace(
        `text-[9px] font-black uppercase text-amber-500 underline ml-1`,
        `text-[9px] font-black uppercase text-emerald-500 underline ml-1`
    );

    // 5. Chart Legend: Bar dot from bg-amber-400 to bg-emerald-500
    content = content.replace(
        `w-2.5 h-2.5 rounded-full bg-amber-400`,
        `w-2.5 h-2.5 rounded-full bg-emerald-500`
    );

    // 6. Chart Bar: Cash bar from bg-amber-400 to bg-emerald-500
    content = content.replace(
        `className="w-full bg-amber-400 rounded-t-sm"`,
        `className="w-full bg-emerald-500 rounded-t-sm"`
    );

    // 7. Bottom Sheet Header & Amounts
    content = content.replace(
        `bg-amber-500/10 text-amber-500 flex items-center justify-center font-black shrink-0 border border-amber-500/20`,
        `bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black shrink-0 border border-emerald-500/20`
    );
    content = content.replace(
        `isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'`,
        `isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'`
    );
    content = content.replace(
        `isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'`,
        `isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'`
    );
    content = content.replace(
        `text-xl md:text-2xl font-black italic text-amber-500`,
        `text-xl md:text-2xl font-black italic text-emerald-500`
    );

    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully updated:', targetFile);
}
