const https = require('https');

function scrapeDDG(query) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'html.duckduckgo.com',
            path: '/html/?q=' + encodeURIComponent(query + ' jewelry site:pinterest.com'),
            headers: { 'User-Agent': 'Mozilla/5.0' }
        };
        https.get(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const urls = [];
                const regex = /<img.*?src="(.*?)"/g;
                let match;
                while ((match = regex.exec(data)) !== null) {
                    if (match[1].startsWith('//')) {
                        urls.push('https:' + match[1]);
                    }
                }
                resolve(urls.slice(0, 3));
            });
        }).on('error', () => resolve([]));
    });
}
(async () => {
    console.log('Sapphire:', await scrapeDDG('blue sapphire ring'));
    console.log('Ruby:', await scrapeDDG('red ruby ring'));
    console.log('Emerald:', await scrapeDDG('green emerald ring'));
    console.log('Diamond:', await scrapeDDG('engagement diamond ring'));
    console.log('Gold 10k:', await scrapeDDG('10k yellow gold ring plain'));
    console.log('Gold 14k:', await scrapeDDG('14k yellow gold ring plain'));
    console.log('Gold 18k:', await scrapeDDG('18k yellow gold ring plain'));
})();
