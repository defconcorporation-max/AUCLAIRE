import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSVLine(text) {
    let ret = [], keep = false, current = '';
    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        if (c === '"') { keep = !keep; }
        else if (c === ',' && !keep) { ret.push(current); current = ''; }
        else { current += c; }
    }
    ret.push(current);
    return ret;
}

function escapeCSV(str) {
    if (str === undefined || str === null) return '';
    const s = String(str).replace(/"/g, '""');
    if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
        return `"${s}"`;
    }
    return s.trim();
}

const headerRow = 'Type,SKU,Nom,Description,Catégories,Attribut 1 name,Attribut 1 value(s),Attribut 1 visible,Attribut 1 global,Attribut 2 name,Attribut 2 value(s),Attribut 2 visible,Attribut 2 global,Parent,Prix régulier';

// --- BRACELETS ---
const processBracelets = () => {
    const inputPath = path.join(__dirname, 'prix bijoux - Bracelets.csv');
    const outPath = path.join(__dirname, 'bracelets_formatted.csv');
    if (!fs.existsSync(inputPath)) return;

    const lines = fs.readFileSync(inputPath, 'utf8').split('\n');
    const outLines = [headerRow];

    const weights = ['2 ct', '3 ct', '4 ct', '5 ct', '6 ct', '7 ct', '8 ct', '9 ct', '10 ct'];
    const metals = ['10K', '14K'];

    // Read all rows into memory to handle "meme prix que"
    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        parsedRows.push(parseCSVLine(line));
    }

    const priceMap = {}; // sku -> prices array

    // First pass to store prices from explicit rows
    for (const cols of parsedRows) {
        const sku = cols[0];
        let hasPrices = false;
        let prices = [];
        for (let i = 7; i <= 15; i++) if (cols[i]) hasPrices = true;
        if (hasPrices) {
            priceMap[sku] = cols;
        }
    }

    // Second pass to generate output
    for (let cols of parsedRows) {
        let sku = cols[0];
        let nom = cols[4];
        let desc = cols[5];

        let targetCols = cols;
        // Check for reference
        if (cols[3] && cols[3].toLowerCase().includes('meme prix que')) {
            const match = cols[3].match(/BR-\d+/);
            if (match && priceMap[match[0]]) {
                targetCols = priceMap[match[0]];
            }
        }

        // Parent Row
        const parentRow = [
            'variable',
            sku,
            nom,
            desc,
            'Bracelets',
            'Poids diamant',
            weights.join(','),
            '1', '1',
            "Type d'or",
            metals.join(','),
            '1', '1',
            '',
            ''
        ];
        outLines.push(parentRow.map(escapeCSV).join(','));

        // Variations
        let colIndex10k = 7;
        let colIndex14k = 17;
        for (let w = 0; w < weights.length; w++) {
            const price10k = targetCols[colIndex10k + w];
            if (price10k) {
                const childSku = `${sku}-${weights[w].replace(' ', '')}-10K`;
                const childRow = ['variation', childSku, '', '', '', 'Poids diamant', weights[w], '', '', "Type d'or", '10K', '', '', sku, price10k];
                outLines.push(childRow.map(escapeCSV).join(','));
            }
            const price14k = targetCols[colIndex14k + w];
            if (price14k) {
                const childSku = `${sku}-${weights[w].replace(' ', '')}-14K`;
                const childRow = ['variation', childSku, '', '', '', 'Poids diamant', weights[w], '', '', "Type d'or", '14K', '', '', sku, price14k];
                outLines.push(childRow.map(escapeCSV).join(','));
            }
        }
    }
    fs.writeFileSync(outPath, outLines.join('\n'));
    console.log(`Successfully generated bracelets_formatted.csv with ${outLines.length} rows.`);
};

// --- EARRINGS ---
const processEarrings = () => {
    const inputPath = path.join(__dirname, 'prix bijoux - Earings.csv');
    const outPath = path.join(__dirname, 'earrings_formatted.csv');
    if (!fs.existsSync(inputPath)) return;

    const lines = fs.readFileSync(inputPath, 'utf8').split('\n');
    const outLines = [headerRow];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length < 4) continue;

        const sku = cols[0].replace(/\s+/g, ''); // Fix things like 'E- 190309' -> 'E-190309'
        const nom = cols[1];
        const desc = cols[2];
        const price = cols[3];

        if (!sku || !price) continue;

        const parentRow = [
            'variable', sku, nom, desc, 'Boucles d\'oreilles',
            "Type d'or", '10K', '1', '1',
            '', '', '', '',
            '', ''
        ];
        outLines.push(parentRow.map(escapeCSV).join(','));

        const childSku = `${sku}-10K`;
        const childRow = [
            'variation', childSku, '', '', '',
            "Type d'or", '10K', '', '',
            '', '', '', '',
            sku, price
        ];
        outLines.push(childRow.map(escapeCSV).join(','));
    }
    fs.writeFileSync(outPath, outLines.join('\n'));
    console.log(`Successfully generated earrings_formatted.csv with ${outLines.length} rows.`);
};

// --- PENDANTS ---
const processPendants = () => {
    const inputPath = path.join(__dirname, 'prix bijoux - Pendentifs.csv');
    const outPath = path.join(__dirname, 'pendants_formatted.csv');
    if (!fs.existsSync(inputPath)) return;

    const lines = fs.readFileSync(inputPath, 'utf8').split('\n');
    const outLines = [headerRow];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length < 4) continue;

        const sku = cols[0];
        const nom = cols[1];
        const desc = cols[2];
        const price = cols[3];

        if (!sku || !price) continue;

        const parentRow = [
            'variable', sku, nom, desc, 'Pendentifs',
            "Type d'or", '10K', '1', '1',
            '', '', '', '',
            '', ''
        ];
        outLines.push(parentRow.map(escapeCSV).join(','));

        const childSku = `${sku}-10K`;
        const childRow = [
            'variation', childSku, '', '', '',
            "Type d'or", '10K', '', '',
            '', '', '', '',
            sku, price
        ];
        outLines.push(childRow.map(escapeCSV).join(','));
    }
    fs.writeFileSync(outPath, outLines.join('\n'));
    console.log(`Successfully generated pendants_formatted.csv with ${outLines.length} rows.`);
};

// Run all
processBracelets();
processEarrings();
processPendants();
