const https = require('https');

function scrapeDDG(query) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'html.duckduckgo.com',
            path: '/html/?q=' + encodeURIComponent(query + ' diamond engagement ring site:pinterest.com'),
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
    console.log('Round:', await scrapeDDG('round cut'));
    console.log('Oval:', await scrapeDDG('oval cut'));
    console.log('Princess:', await scrapeDDG('princess cut'));
    console.log('Cushion:', await scrapeDDG('cushion cut'));
    console.log('EmeraldCut:', await scrapeDDG('emerald cut'));
    console.log('Pear:', await scrapeDDG('pear shaped'));
    console.log('Radiant:', await scrapeDDG('radiant cut'));
    console.log('Marquise:', await scrapeDDG('marquise cut'));
    console.log('Asscher:', await scrapeDDG('asscher cut'));
    console.log('Heart:', await scrapeDDG('heart shaped'));
})();
