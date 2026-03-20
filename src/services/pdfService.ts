import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from './apiSettings';
import { Invoice } from './apiInvoices';
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

/**
 * Generates a Luxury PDF Invoice matching the 'Soumission' (Quote) style.
 * Includes project design visuals.
 */
export const generateInvoicePDF = async (invoice: Invoice, settings: CompanySettings) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth() || 210;
        const pageHeight = doc.internal.pageSize.getHeight() || 297;

        // ── Brand Tokens ──
        const GOLD: [number, number, number] = [212, 175, 55];
        const ZINC_900: [number, number, number] = [24, 24, 27];
        const ZINC_600: [number, number, number] = [82, 82, 91];
        const ZINC_400: [number, number, number] = [161, 161, 170];
        const ZINC_100: [number, number, number] = [244, 244, 245];

        // ── Helpers ──
        const fmt = (n: any) => {
            const num = Number(n) || 0;
            return num.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
        };

        const safeText = (text: any, x: number, y: number, options?: any) => {
            const str = String(text ?? '');
            if (!str) return;
            try { doc.text(str, x, y, options); } catch (e) { console.warn(e); }
        };

        // 1. TOP GOLD LINE
        doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.rect(0, 0, pageWidth, 4, 'F');

        // 2. HEADER
        doc.setFont('times', 'bold');
        doc.setFontSize(38);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        safeText('AUCLAIRE', 14, 28);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        safeText('BIJOUTERIE SUR MESURE', 15, 34, { charSpace: 2 });

        doc.setFont('times', 'normal');
        doc.setFontSize(22);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        safeText('FACTURE', pageWidth - 14, 26, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(ZINC_600[0], ZINC_600[1], ZINC_600[2]);
        const invoiceNum = (invoice.id || '000000').substring(0, 8).toUpperCase();
        safeText(`Date : ${new Date(invoice.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 32, { align: 'right' });
        safeText(`Réf : #INV-${invoiceNum}`, pageWidth - 14, 37, { align: 'right' });

        // 3. DETAILS GRID
        doc.setDrawColor(ZINC_100[0], ZINC_100[1], ZINC_100[2]);
        doc.setLineWidth(0.5);
        doc.line(14, 48, pageWidth - 14, 48);

        // Column Left: Client
        doc.setFontSize(7);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        safeText('PRÉPARÉ POUR', 14, 56, { charSpace: 1 });
        doc.setFont('times', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        safeText(invoice.project?.client?.full_name || 'Client', 14, 63);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(ZINC_600[0], ZINC_600[1], ZINC_600[2]);
        safeText(`Projet : ${invoice.project?.title || 'Projet'}`, 14, 69);

        // Column Right: Company
        doc.setFontSize(7);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        safeText('DE LA PART DE', pageWidth / 2 + 7, 56, { charSpace: 1 });
        doc.setFont('times', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        safeText(settings.company_name, pageWidth / 2 + 7, 63);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(ZINC_600[0], ZINC_600[1], ZINC_600[2]);
        safeText('Soin, précision et élégance', pageWidth / 2 + 7, 69);
        doc.setFont('helvetica', 'normal');
        safeText(`${settings.city}, ${settings.country}`, pageWidth / 2 + 7, 74);

        doc.line(14, 82, pageWidth - 14, 82);

        // 4. INTRO
        doc.setFont('times', 'italic');
        doc.setFontSize(11);
        doc.setTextColor(ZINC_600[0], ZINC_600[1], ZINC_600[2]);
        const intro = '"Soin, précision et élégance. Nous avons le plaisir de vous présenter la facture suivante pour votre projet de bijouterie sur mesure, conçu avec une attention particulière portée à la qualité des matériaux et à la finition."';
        const splitIntro = doc.splitTextToSize(intro, pageWidth - 40);
        doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
        doc.setLineWidth(1);
        doc.line(14, 90, 14, 90 + (splitIntro.length * 6));
        doc.text(splitIntro, 20, 95);

        // 5. ITEMS TABLE
        const netAmount = Number(invoice.amount) || 0;
        const taxProvince = invoice.project?.financials?.tax_province as CanadianProvince | undefined;
        let taxTotal = 0;
        const taxLabels: string[] = [];
        const taxValues: string[] = [];
        if (taxProvince) {
            const taxes = calculateCanadianTax(netAmount, taxProvince);
            taxTotal = taxes.total;
            if (taxes.gst > 0) { taxLabels.push('TPS (5%)'); taxValues.push(fmt(taxes.gst)); }
            if (taxes.pst > 0) { 
                taxLabels.push(taxProvince === 'QC' ? 'TVQ (9,975%)' : `TVP (${taxProvince})`); 
                taxValues.push(fmt(taxes.pst)); 
            }
            if (taxes.hst > 0) { taxLabels.push(`TVH (${taxProvince})`); taxValues.push(fmt(taxes.hst)); }
        } else if (settings.tax_rate > 0) {
            taxTotal = netAmount * (settings.tax_rate / 100);
            taxLabels.push(`Taxe (${settings.tax_rate}%)`);
            taxValues.push(fmt(taxTotal));
        }

        const grandTotal = netAmount + taxTotal;

        autoTable(doc, {
            head: [['Description des services', 'Montant']],
            body: [[{ content: 'Design et production de bijoux sur mesure Auclaire', styles: { font: 'times', fontSize: 13 } }, { content: fmt(netAmount), styles: { font: 'times', fontSize: 16, textColor: GOLD as any, halign: 'right' } }]],
            startY: 115,
            theme: 'plain',
            headStyles: { fontSize: 8, textColor: GOLD as any },
            styles: { cellPadding: 8 },
            columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 50 } }
        });

        // 6. VISUALS (3D Design Photos)
        let visualY = (doc as any).lastAutoTable.finalY + 10;
        
        // Find images in project stage_details
        const designFiles = invoice.project?.stage_details?.design_files || [];
        const approvedVersion = invoice.project?.stage_details?.design_versions?.find(v => v.status === 'approved');
        const latestVersion = invoice.project?.stage_details?.design_versions?.slice().reverse()[0];
        const versionFiles = (approvedVersion || latestVersion)?.files || [];
        const allImages = [...new Set([...designFiles, ...versionFiles])].slice(0, 2); // Take up to 2

        if (allImages.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
            safeText('DESIGN & VISUELS', 14, visualY, { charSpace: 1 });
            doc.setDrawColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
            doc.setLineWidth(0.2);
            doc.line(14, visualY + 2, pageWidth - 14, visualY + 2);
            
            visualY += 8;
            const imgWidth = (pageWidth - 36) / 2;
            const imgHeight = imgWidth * 0.85; // Slightly less than square for better layout fit

            for (let i = 0; i < allImages.length; i++) {
                try {
                    const imgData = await getBase64ImageFromURL(allImages[i]);
                    const x = 14 + (i * (imgWidth + 8));
                    doc.addImage(imgData, 'PNG', x, visualY, imgWidth, imgHeight);
                } catch (e) {
                    console.warn('Failed to add image to PDF:', allImages[i], e);
                    // Placeholder for missing image
                    const x = 14 + (i * (imgWidth + 4));
                    doc.setFillColor(ZINC_100[0], ZINC_100[1], ZINC_100[2]);
                    doc.rect(x, visualY, imgWidth, imgHeight, 'F');
                    doc.setFontSize(6);
                    doc.setTextColor(ZINC_400[0], ZINC_400[1], ZINC_400[2]);
                    safeText('Image non disponible', x + (imgWidth / 2), visualY + (imgHeight / 2), { align: 'center' });
                }
            }
            visualY += imgHeight + 10;
        }

        // 7. SUMMARY BOX
        const footerThreshold = pageHeight - 65; // Leave space for footer
        let summaryY = Math.max(visualY, (doc as any).lastAutoTable.finalY + 10);
        
        // PAGE BREAK DETECTION
        if (summaryY + 45 > footerThreshold) {
            doc.addPage();
            summaryY = 20; // Start at top of new page
            // Redraw top gold line on new page
            doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
            doc.rect(0, 0, pageWidth, 4, 'F');
        }

        doc.setFillColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
        doc.rect(14, summaryY, pageWidth - 28, 45, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(200, 200, 200);
        safeText(`SOUS-TOTAL : ${fmt(netAmount)}`, 24, summaryY + 15);
        
        taxLabels.forEach((label, i) => {
            doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
            safeText(`${label} : ${taxValues[i]}`, 24, summaryY + 22 + (i * 6));
        });

        doc.setTextColor(ZINC_400[0], ZINC_400[1], ZINC_400[2]);
        doc.setFontSize(7);
        safeText('TOTAL À PAYER', pageWidth - 24, summaryY + 15, { align: 'right', charSpace: 1 });
        
        doc.setFont('times', 'normal');
        doc.setFontSize(42);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        safeText(fmt(grandTotal).replace('$', '').trim(), pageWidth - 30, summaryY + 32, { align: 'right' });
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        safeText('$', pageWidth - 24, summaryY + 32, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(ZINC_400[0], ZINC_400[1], ZINC_400[2]);
        safeText('TAXES INCLUSES', pageWidth - 24, summaryY + 40, { align: 'right', charSpace: 1 });

        // 8. PAYMENT HISTORY
        const payments = invoice.payment_history || [];
        if (payments.length > 0) {
            let historyY = summaryY + 60;
            
            // Check if history fits on this page
            if (historyY + (payments.length * 8) + 20 > pageHeight - 20) {
                doc.addPage();
                historyY = 20;
                doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
                doc.rect(0, 0, pageWidth, 4, 'F');
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
            safeText('HISTORIQUE DES PAIEMENTS', 14, historyY, { charSpace: 1 });
            doc.setDrawColor(ZINC_100[0], ZINC_100[1], ZINC_100[2]);
            doc.line(14, historyY + 2, pageWidth - 14, historyY + 2);

            payments.forEach((p, i) => {
                const rowY = historyY + 10 + (i * 8);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(ZINC_900[0], ZINC_900[1], ZINC_900[2]);
                safeText(`${new Date(p.date).toLocaleDateString('fr-CA')}`, 14, rowY);
                safeText(p.note || 'Paiement', 50, rowY);
                doc.setFont('helvetica', 'bold');
                safeText(fmt(p.amount), pageWidth - 14, rowY, { align: 'right' });
            });
            
            const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const balance = grandTotal - totalPaid;
            const balanceY = historyY + 10 + (payments.length * 8) + 5;
            doc.setFontSize(10);
            doc.setTextColor(balance > 0.01 ? 200 : 50, balance > 0.01 ? 50 : 150, balance > 0.01 ? 50 : 50);
            if (balance > 0.01) {
                safeText(`SOLDE DÛ : ${fmt(balance)}`, pageWidth - 14, balanceY, { align: 'right' });
            } else {
                safeText('✓ FACTURE PAYÉE EN TOTALITÉ', pageWidth - 14, balanceY, { align: 'right' });
            }
        }

        // 9. FOOTER
        const footerY = pageHeight - 20;
        doc.setFont('times', 'normal');
        doc.setFontSize(16);
        doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
        safeText('AUCLAIRE', pageWidth / 2, footerY, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(ZINC_400[0], ZINC_400[1], ZINC_400[2]);
        safeText('BIJOUX SUR MESURE CONÇUS AVEC SOIN, PRÉCISION ET ÉLÉGANCE.', pageWidth / 2, footerY + 5, { align: 'center', charSpace: 2 });

        // SAVE
        const clientName = (invoice.project?.client?.full_name || 'Client').replace(/\s+/g, '_');
        doc.save(`Facture_AUCLAIRE_${invoiceNum}_${clientName}.pdf`);

    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('Erreur lors de la génération du PDF style luxe.');
    }
};
