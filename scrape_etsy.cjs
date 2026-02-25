const https = require('https');
const fs = require('fs');

function scrapeEtsy(query) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'www.etsy.com',
            path: '/search?q=' + encodeURIComponent(query),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        };
        https.get(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const urls = [];
                // Look for standard etsystatic image URLs in the HTML
                const regex = /https:\/\/i\.etsystatic\.com\/\d+\/[a-zA-Z0-9_\/]+\/\d+\/il_\d+x[N\d]+\.\d+_[a-zA-Z0-9]+\.jpg/g;
                let match;
                while ((match = regex.exec(data)) !== null) {
                    // Try to get high res
                    const url = match[0].replace(/il_\d+x\d+/, 'il_794xN').replace(/il_\d+xN/, 'il_794xN');
                    if (!urls.includes(url)) urls.push(url);
                }
                resolve(urls.slice(0, 3));
            });
        }).on('error', () => resolve([]));
    });
}

(async () => {
    const results = {};
    const queries = {
        'Round': 'round brilliant cut diamond engagement ring',
        'Princess': 'princess cut diamond engagement ring',
        'Cushion': 'cushion cut diamond engagement ring',
        'EmeraldCut': 'emerald cut diamond engagement ring',
        'Oval': 'oval cut diamond engagement ring',
        'Pear': 'pear shaped diamond engagement ring',
        'Radiant': 'radiant cut diamond engagement ring',
        'Marquise': 'marquise cut diamond engagement ring',
        'Asscher': 'asscher cut diamond engagement ring',
        'Heart': 'heart shaped diamond engagement ring',
        'Sapphire': 'blue sapphire engagement ring',
        'Ruby': 'red ruby engagement ring',
        'EmeraldGem': 'green emerald gemstone ring natural',
        'Diamond': 'solitaire diamond engagement ring'
    };

    for (const [key, q] of Object.entries(queries)) {
        console.log(`Scraping ${key}...`);
        const urls = await scrapeEtsy(q);
        results[key] = urls;
        console.log(`  Found: ${urls.length}`);
    }

    fs.writeFileSync('etsy_urls.json', JSON.stringify(results, null, 2));
    console.log('Done!');
})();
