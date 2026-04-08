import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from './apiSettings';
import { Invoice } from './apiInvoices';
import { Project } from './apiProjects';
import { calculateCanadianTax, type CanadianProvince } from '@/utils/taxUtils';

/**
 * Helper to convert an image URL to a base64 string for jsPDF.
 */
const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = (error) => reject(error);
        img.src = url;
    });
};

const GOLD: [number, number, number] = [212, 175, 55];
const ZINC_900: [number, number, number] = [24, 24, 27];
const ZINC_600: [number, number, number] = [82, 82, 91];
const ZINC_400: [number, number, number] = [161, 161, 170];
const ZINC_100: [number, number, number] = [244, 244, 245];

const fmt = (n: any) => {
    const num = Number(n) || 0;
    return num.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
};

const setupDoc = (doc: jsPDF) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.rect(0, 0, pageWidth, 4, 'F');
};

const drawHeader = (doc: jsPDF, title: string, subReference: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('times', 'bold');
    doc.setFontSize(38);
    doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
    doc.text('AUCLAIRE', 14, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
    doc.text('BIJOUTERIE SUR MESURE', 15, 34, { charSpace: 2 });

    doc.setFont('times', 'normal');
    doc.setFontSize(22);
    doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
    doc.text(title, pageWidth - 14, 26, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(ZINC_600[0], ZINC_600[1], ZINC_600[2]);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 32, { align: 'right' });
    doc.text(subReference, pageWidth - 14, 37, { align: 'right' });
};

/**
 * Luxury PDF Quote (Soumission) with Contractual Clauses
 */
export const generateQuotePDF = async (project: Project, settings: CompanySettings, items: {title: string, description: string, price: number}[], discount: number = 0) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const clientName = project.client?.full_name || 'Client';
        const refNum = project.reference_number || `S-${new Date().getTime().toString().slice(-6)}`;

        setupDoc(doc);
        drawHeader(doc, 'SOUMISSION', `Réf : #SOUM-${refNum}`);

        // ── CLIENT & COMPANY GRID ──
        doc.setDrawColor(ZINC_100[0], ZINC_100[1], ZINC_100[2]);
        doc.line(14, 48, pageWidth - 14, 48);

        doc.setFontSize(7);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text('PRÉPARÉ POUR', 14, 56, { charSpace: 1 });
        doc.setFont('times', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        doc.text(clientName, 14, 63);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text('DE LA PART DE', pageWidth / 2 + 7, 56, { charSpace: 1 });
        doc.setFont('times', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        doc.text(settings.company_name, pageWidth / 2 + 7, 63);

        // ── CONTRACTUAL SECTION (NEW) ──
        doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.setLineWidth(0.5);
        doc.line(14, 75, pageWidth - 14, 75);

        doc.setFont('times', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        
        const contractText = `ENTRE : ${clientName.toUpperCase()} (le "Client") ET : AUCLAIRE INC. ("Auclaire")\n\nCONTRAT DE PRODUCTION : Par la présente soumission, il est entendu qu'un dépôt a été effectué ou est requis pour lancer la production officielle. Auclaire garantit la qualité supérieure et l'authenticité de tous les matériaux utilisés (pierres précieuses certifiées et métaux nobles). Ce document fait office d'engagement mutuel sur le design et le prix présentés ci-dessous.`;
        const splitContract = doc.splitTextToSize(contractText, pageWidth - 28);
        doc.text(splitContract, 14, 82);
        
        const contractHeight = splitContract.length * 5;
        const dividerY = 82 + contractHeight + 5;
        doc.setDrawColor(ZINC_100[0], ZINC_100[1], ZINC_100[2]);
        doc.line(14, dividerY, pageWidth - 14, dividerY);

        // ── ITEMS TABLE ──
        const subtotal = items.reduce((s, i) => s + i.price, 0);
        const finalAmount = subtotal - discount;

        autoTable(doc, {
            head: [['Description du Projet', 'Montant']],
            body: items.map(i => [
                { content: `${i.title}\n${i.description}`, styles: { font: 'times', fontSize: 11 } },
                { content: fmt(i.price), styles: { font: 'times', fontSize: 13, halign: 'right' } }
            ]),
            startY: dividerY + 10,
            theme: 'plain',
            headStyles: { fontSize: 8, textColor: GOLD as any, font: 'helvetica', fontStyle: 'bold' },
            styles: { cellPadding: 6 },
            columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 50 } }
        });

        const tableEndY = (doc as any).lastAutoTable.finalY;

        // ── VISUALS ──
        const designFiles = [
            ...(project.stage_details?.design_files || []),
            ...(project.stage_details?.sketch_files || []),
            ...(project.stage_details?.design_versions || []).flatMap(v => v.files || []),
        ].filter((url, i, arr) => arr.indexOf(url) === i).slice(0, 2);

        if (designFiles.length > 0) {
            let imgY = tableEndY + 15;
            if (imgY + 60 > 270) { doc.addPage(); setupDoc(doc); imgY = 20; }
            
            doc.setFontSize(8);
            doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
            doc.text('VISUELS DU PROJET', 14, imgY, { charSpace: 1 });
            
            const imgW = (pageWidth - 36) / 2;
            const imgH = imgW * 0.8;
            for (let i = 0; i < designFiles.length; i++) {
                try {
                    const imgData = await getBase64ImageFromURL(designFiles[i]);
                    doc.addImage(imgData, 'PNG', 14 + (i * (imgW + 8)), imgY + 5, imgW, imgH);
                } catch (e) { console.warn(e); }
            }
        }

        // ── FOOTER SUMMARY ──
        const footerY = 270;
        doc.setFont('times', 'normal');
        doc.setFontSize(28);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text(`TOTAL : ${fmt(finalAmount)}`, pageWidth - 14, footerY, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(ZINC_400[0], ZINC_400[1], ZINC_400[2]);
        doc.text('BIJOUX SUR MESURE CONÇUS AVEC SOIN, PRÉCISION ET ÉLÉGANCE.', pageWidth / 2, 285, { align: 'center', charSpace: 2 });

        doc.save(`Soumission_AUCLAIRE_${refNum}_${clientName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
        console.error('Quote PDF Error:', error);
    }
};

/**
 * Luxury PDF Invoice
 */
export const generateInvoicePDF = async (invoice: Invoice, settings: CompanySettings) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        setupDoc(doc);
        const invoiceNum = (invoice.id || '000000').substring(0, 8).toUpperCase();
        drawHeader(doc, 'FACTURE', `Réf : #INV-${invoiceNum}`);

        // ── DETAILS GRID ──
        doc.setDrawColor(ZINC_100[0], ZINC_100[1], ZINC_100[2]);
        doc.line(14, 48, pageWidth - 14, 48);

        doc.setFontSize(7);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text('PRÉPARÉ POUR', 14, 56, { charSpace: 1 });
        doc.setFont('times', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        doc.text(invoice.project?.client?.full_name || 'Client', 14, 63);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(ZINC_600[0], ZINC_600[1], ZINC_600[2]);
        doc.text(`Projet : ${invoice.project?.title || 'Projet'}`, 14, 69);

        doc.setFontSize(7);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text('DE LA PART DE', pageWidth / 2 + 7, 56, { charSpace: 1 });
        doc.setFont('times', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        doc.text(settings.company_name, pageWidth / 2 + 7, 63);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text(`${settings.city}, ${settings.country}`, pageWidth / 2 + 7, 69);

        // ── ITEMS ──
        const netAmount = Number(invoice.amount) || 0;
        const taxProvince = invoice.project?.financials?.tax_province as CanadianProvince | undefined;
        let taxTotal = 0;
        if (taxProvince) {
            taxTotal = calculateCanadianTax(netAmount, taxProvince).total;
        }

        autoTable(doc, {
            head: [['Description des services', 'Montant']],
            body: [[{ content: 'Design et production de bijoux sur mesure Auclaire', styles: { font: 'times', fontSize: 13 } }, { content: fmt(netAmount), styles: { font: 'times', fontSize: 16, textColor: GOLD as any, halign: 'right' } }]],
            startY: 90,
            theme: 'plain',
            headStyles: { fontSize: 8, textColor: GOLD as any },
            styles: { cellPadding: 8 }
        });

        const summaryY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFillColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        doc.rect(14, summaryY, pageWidth - 28, 40, 'F');
        doc.setFontSize(32);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.text(fmt(netAmount + taxTotal), pageWidth - 30, summaryY + 28, { align: 'right' });

        doc.save(`Facture_AUCLAIRE_${invoiceNum}.pdf`);
    } catch (e) {
        console.error(e);
    }
};
