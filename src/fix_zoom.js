const fs = require('fs');
const path = require('path');

const dashboardPath = path.join(__dirname, 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(dashboardPath, 'utf8');

// Replace tiny text classes with more readable ones
content = content.replace(/text-\[7px\]/g, 'text-[10px]');
content = content.replace(/text-\[8px\]/g, 'text-xs');
content = content.replace(/text-\[9px\]/g, 'text-xs');
content = content.replace(/text-\[10px\]/g, 'text-sm');
content = content.replace(/text-\[11px\]/g, 'text-sm mb-1 line-clamp-1'); // Add truncation helpers for titles
content = content.replace(/w-3\.5 h-3\.5/g, 'w-4 h-4'); // Slightly larger icons

fs.writeFileSync(dashboardPath, content, 'utf8');
console.log('Successfully updated text sizes in Dashboard.tsx');
