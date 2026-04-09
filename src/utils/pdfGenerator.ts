import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { RingConfig } from '../context/RingContext'

// Estimates for Mock Pricing
const PRICES = {
    metal: {
        'Yellow Gold': 800,
        'White Gold': 850,
        'Rose Gold': 800,
        'Platinum': 1200
    },
    gem: {
        'Diamond': 5000, // per carat
        'Sapphire': 1500,
        'Ruby': 2000,
        'Emerald': 1800
    }
}

export const generateSpecSheet = (config: RingConfig, _materials: unknown, imageUrl: string, designName: string = "Custom Design") => {
    const doc = new jsPDF()

    // --- 1. HEADER ---
    doc.setFontSize(24)
    doc.setTextColor(40, 40, 40)
    doc.text("MAISON AUCLAIRE", 105, 20, { align: "center" })
    doc.text("MAISON AUCLAIRE INC", 105, 26, { align: "center" })

    // Line
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 30, 190, 30)

    // --- 2. IMAGE ---
    // Add the screenshot
    if (imageUrl) {
        doc.addImage(imageUrl, 'PNG', 35, 40, 140, 100)
    }

    // --- 3. SPECS TABLE ---
    const estPrice = (PRICES.metal[config.metal] || 800) +
        ((PRICES.gem[config.gem.type] || 1000) * config.gem.size) +
        (config.sideStones.active ? 400 : 0) +
        (config.engraving?.text ? 50 : 0)

    const dateStr = new Date().toLocaleDateString()

    autoTable(doc, {
        startY: 150,
        head: [['Specification', 'Details']],
        body: [
            ['Design Name', designName],
            ['Date', dateStr],
            ['Metal', config.metal],
            ['Center Stone', `${config.gem.size}ct ${config.gem.shape} ${config.gem.type}`],
            ['Setting Style', `${config.head.style} (${config.head.prongCount} Prongs)`],
            ['Gallery Detail', config.head.gallery || 'None'],
            ['Shank Style', `${config.shank.style} (${config.shank.profile})`],
            ['Side Stones', config.sideStones.active ? `${config.sideStones.style}` : 'None'],
            ['Engraving', config.engraving?.text || 'None'],
            ['Estimated Price', `$${estPrice.toLocaleString()}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40] },
        styles: { font: "helvetica", fontSize: 10 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 100 }
        },
        margin: { left: 25 }
    })

    // --- 4. FOOTER ---
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text("Estimate valid for 7 days. Final price requires stone selection.", 105, 280, { align: "center" })
    doc.text("maisonauclaire.ca | Exquisite Craftsmanship", 105, 285, { align: "center" })

    // Save
    doc.save(`Auclaire_${designName.replace(/\s+/g, '_')}_${Date.now()}.pdf`)
}
