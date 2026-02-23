import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFilePath = path.join(__dirname, 'prix bijoux - Bagues.csv');
const outputFilePath = path.join(__dirname, 'pricing_formatted.csv');

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
    return s;
}

const lines = fs.readFileSync(inputFilePath, 'utf8').split('\n');

const outLines = [];
// Header
outLines.push('Type,SKU,Nom,Description,Catégories,Attribut 1 name,Attribut 1 value(s),Attribut 1 visible,Attribut 1 global,Attribut 2 name,Attribut 2 value(s),Attribut 2 visible,Attribut 2 global,Parent,Prix régulier');

const weights = ['1 ct', '1.5 ct', '2 ct', '2.5 ct', '3 ct', '3.5 ct', '4 ct'];
const metals = ['10K', '14K', '18K'];

for (let i = 2; i < lines.length; i++) { // Skip first 2 header rows
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);

    if (cols.length < 29) {
        console.warn(`Line ${i + 1} has insufficient columns (${cols.length}): ${cols[0]}`);
        continue;
    }

    const sku = cols[0];
    const nom = cols[1];
    const desc = cols[5];

    // Parent Row
    const parentRow = [
        'variable',
        sku,
        nom,
        desc,
        'Bagues', // Catégories
        'Poids diamant', // Attribut 1 name
        '1 ct,1.5 ct,2 ct,2.5 ct,3 ct,3.5 ct,4 ct', // Attribut 1 value(s)
        '1', '1',
        "Type d'or", // Attribut 2 name
        '10K,14K,18K', // Attribut 2 value(s)
        '1', '1',
        '', // Parent
        ''  // Prix régulier
    ];
    outLines.push(parentRow.map(escapeCSV).join(','));

    // Variations
    let colIndex = 6;
    for (let m = 0; m < metals.length; m++) {
        for (let w = 0; w < weights.length; w++) {
            const price = cols[colIndex];
            if (price) {
                const childSku = `${sku}-${weights[w].replace(' ', '')}-${metals[m]}`;
                const childRow = [
                    'variation',
                    childSku,
                    '', // Nom
                    '', // Description
                    '', // Catégories
                    'Poids diamant',
                    weights[w],
                    '', '',
                    "Type d'or",
                    metals[m],
                    '', '',
                    sku, // Parent
                    price // Prix régulier
                ];
                outLines.push(childRow.map(escapeCSV).join(','));
            }
            colIndex++;
        }
        colIndex++; // skip the empty separator column (13, 21)
    }
}

fs.writeFileSync(outputFilePath, outLines.join('\n'));
console.log('Successfully generated pricing_formatted.csv with ' + outLines.length + ' rows.');
