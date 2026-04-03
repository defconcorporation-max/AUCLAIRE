const fs = require('fs');
const https = require('https');

const url = "https://raw.githubusercontent.com/defconcorporation-max/AUCLAIRE/d3fc63a11d381221988df7c3d27b394432374610/src/pages/projects/ProjectDetails.tsx";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync('ProjectDetails_monolithic.tsx', data);
        console.log("Success! File Size: " + data.length);
        process.exit(0);
    });
}).on('error', (e) => {
    console.error("Error: " + e.message);
    process.exit(1);
});
