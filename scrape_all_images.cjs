const https = require('https');
const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, 'public', 'images', 'education', 'cuts');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

function scrapeDDG(query) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'html.duckduckgo.com',
            path: '/html/?q=' + encodeURIComponent(query + ' engagement ring site:pinterest.com'),
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        };
        https.get(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const urls = [];
                const regex = /<img[^>]+src="([^">]+)"/g;
                let match;
                while ((match = regex.exec(data)) !== null) {
                    let src = match[1];
                    if (src.startsWith('//')) src = 'https:' + src;
                    if (src.includes('external-content') && src.includes('iu/?u=')) {
                        try {
                            const u = new URL(src).searchParams.get('u');
                            if (u && !u.endsWith('.ico') && !urls.includes(u)) {
                                urls.push(u);
                            }
                        } catch (e) { }
                    }
                }
                resolve(urls.slice(0, 3));
            });
        }).on('error', () => resolve([]));
    });
}

function downloadImage(url, dest) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadImage(res.headers.location, dest).then(resolve);
            }
            if (res.statusCode !== 200) return resolve(false);
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(true); });
        }).on('error', () => resolve(false));
    });
}

(async () => {
    const cuts = [
        'round cut diamond', 'oval cut diamond', 'princess cut diamond',
        'cushion cut diamond', 'emerald cut diamond', 'pear shaped diamond',
        'radiant cut diamond', 'marquise cut diamond', 'asscher cut diamond',
        'heart shaped diamond'
    ];

    for (const cut of cuts) {
        console.log(`Scraping ${cut}...`);
        const urls = await scrapeDDG(cut);
        console.log(`Found ${urls.length} images for ${cut}`);

        const shortName = cut.split(' ')[0];
        for (let i = 0; i < urls.length; i++) {
            const dest = path.join(destDir, `${shortName}_${i + 1}.jpg`);
            const success = await downloadImage(urls[i], dest);
            console.log(`  Downloaded ${shortName}_${i + 1}.jpg: ${success}`);
        }
    }

    // Also fetch 3 gems
    const gems = ['blue sapphire', 'red ruby', 'green emerald'];
    const gemDir = path.join(__dirname, 'public', 'images', 'education', 'gems');
    if (!fs.existsSync(gemDir)) fs.mkdirSync(gemDir, { recursive: true });

    for (const gem of gems) {
        console.log(`Scraping ${gem}...`);
        const urls = await scrapeDDG(gem + ' gemstone macro');
        console.log(`Found ${urls.length} images for ${gem}`);

        const shortName = gem.split(' ')[1];
        for (let i = 0; i < urls.length; i++) {
            const dest = path.join(gemDir, `${shortName}_${i + 1}.jpg`);
            const success = await downloadImage(urls[i], dest);
            console.log(`  Downloaded ${shortName}_${i + 1}.jpg: ${success}`);
        }
    }
})();
