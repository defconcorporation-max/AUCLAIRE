const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function extract() {
    try {
        const guideBuffer = fs.readFileSync(path.join(__dirname, 'public', 'docs', 'guide_operationnel_ambassadeur.pdf'));
        const guideData = await pdf(guideBuffer);
        fs.writeFileSync(path.join(__dirname, 'guide_operationnel.txt'), guideData.text);

        const planBuffer = fs.readFileSync(path.join(__dirname, 'public', 'docs', 'plan_ambassadeurs.pdf'));
        const planData = await pdf(planBuffer);
        fs.writeFileSync(path.join(__dirname, 'plan_ambassadeur.txt'), planData.text);

        console.log("Extraction complete.");
    } catch (err) {
        console.error("Error extracting PDFs:", err);
    }
}

extract();
