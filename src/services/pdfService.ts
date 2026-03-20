import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from './apiSettings';
import { Invoice } from './apiInvoices';
import { calculateCanadianTax, type CanadianProvince } from '@/utils/taxUtils';

/**
 * Generates a professional PDF invoice for Auclaire Jewelry.
 * Highly robust against null/undefined values and API variations.
 */
export const generateInvoicePDF = (invoice: Invoice, settings: CompanySettings) => {
    try {
        console.log('Starting PDF Generation for invoice:', invoice.id);
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth() || 210;

        // ── Brand Colors ──
        const gold: [number, number, number] = [212, 175, 55];
        const dark: [number, number, number] = [40, 40, 40];
        const muted: [number, number, number] = [120, 120, 120];

        // ── Helpers ──
        const fmt = (n: any) => {
            const num = Number(n) || 0;
            return num.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
        };

        const safeText = (text: any, x: number, y: number, options?: any) => {
            if (isNaN(x) || isNaN(y)) return;
            const str = String(text ?? '');
            if (!str) return;
            try {
                // Ensure options is a valid object or undefined
                const opts = (options && typeof options === 'object') ? options : undefined;
                doc.text(str, x, y, opts);
            } catch (e) {
                console.warn('jsPDF.text failed for:', str, e);
            }
        };

        // ── Header: Company Info ──
        doc.setFontSize(22);
        doc.setTextColor(...dark);
        safeText(settings.company_name || 'Auclaire Jewelry', 14, 22);

        doc.setFontSize(9);
        doc.setTextColor(...muted);
        safeText(settings.address_line1 || '', 14, 28);
        
        const hasAddr2 = !!settings.address_line2;
        if (hasAddr2) {
            safeText(settings.address_line2, 14, 32);
        }
        
        const cityCountryY = hasAddr2 ? 36 : 32;
        safeText(`${settings.city || ''}, ${settings.country || ''}`, 14, cityCountryY);
        
        const emailY = hasAddr2 ? 40 : 36;
        if (settings.contact_email) {
            safeText(settings.contact_email, 14, emailY);
        }
        
        const phoneY = hasAddr2 ? 44 : 40;
        if (settings.phone) {
            safeText(settings.phone, 14, phoneY);
        }

        // ── Header: Invoice Info (right side) ──
        doc.setFontSize(16);
        doc.setTextColor(...gold);
        safeText('FACTURE', pageWidth - 14, 22, { align: 'right' });

        doc.setFontSize(9);
        doc.setTextColor(...muted);
        const invoiceNum = (invoice.id || '00000000').substring(0, 8).toUpperCase();
        safeText(`No: #${invoiceNum}`, pageWidth - 14, 28, { align: 'right' });
        
        const dateStr = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
        safeText(`Date: ${dateStr}`, pageWidth - 14, 32, { align: 'right' });
        
        if (invoice.due_date) {
            const dueStr = new Date(invoice.due_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
            safeText(`Échéance: ${dueStr}`, pageWidth - 14, 36, { align: 'right' });
        }

        // ── Gold separator line ──
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.5);
        doc.line(14, 48, pageWidth - 14, 48);

        // ── Bill To ──
        doc.setFontSize(10);
        doc.setTextColor(...gold);
        safeText('Facturer à:', 14, 56);

        doc.setFontSize(11);
        doc.setTextColor(...dark);
        safeText(invoice.project?.client?.full_name || 'Client', 14, 62);

        doc.setFontSize(9);
        doc.setTextColor(...muted);
        safeText(`Projet: ${invoice.project?.title || 'Projet'}`, 14, 67);

        // ── Table: Line Items ──
        const taxProvince = invoice.project?.financials?.tax_province as CanadianProvince | undefined;
        const netAmount = Number(invoice.amount) || 0;

        const tableRows = [
            [
                'Design et production de bijoux sur mesure',
                '1',
                fmt(netAmount),
                fmt(netAmount),
            ],
        ];

        // Build tax rows
        let taxTotal = 0;
        const taxRows: string[][] = [];
        if (taxProvince) {
            try {
                const taxes = calculateCanadianTax(netAmount, taxProvince);
                taxTotal = taxes.total || 0;
                if (taxes.gst > 0) taxRows.push(['TPS (5%)', fmt(taxes.gst)]);
                if (taxes.pst > 0) {
                    const pstLabel = taxProvince === 'QC' ? 'TVQ (9,975%)' : `TVP (${taxProvince})`;
                    taxRows.push([pstLabel, fmt(taxes.pst)]);
                }
                if (taxes.hst > 0) taxRows.push([`TVH (${taxProvince})`, fmt(taxes.hst)]);
            } catch (te) {
                console.error('Tax calc error:', te);
            }
        } else {
            const rate = Number(settings.tax_rate) || 0;
            if (rate > 0) {
                taxTotal = netAmount * (rate / 100);
                taxRows.push([`Taxe (${rate}%)`, fmt(taxTotal)]);
            }
        }

        const grandTotal = netAmount + taxTotal;

        autoTable(doc, {
            head: [['Description', 'Qté', 'Prix unitaire', 'Montant']],
            body: tableRows,
            startY: 74,
            theme: 'grid',
            headStyles: {
                fillColor: gold,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: {
                fontSize: 9,
                textColor: dark,
            },
            columnStyles: {
                0: { cellWidth: 90 },
                1: { halign: 'center', cellWidth: 20 },
                2: { halign: 'right', cellWidth: 35 },
                3: { halign: 'right', cellWidth: 35 },
            },
            margin: { left: 14, right: 14 },
        });

        // ── Get final Y position after table ──
        const lastTable = (doc as any).lastAutoTable;
        let yPos = (lastTable && typeof lastTable.finalY === 'number' ? lastTable.finalY : 90) + 10;

        // ── Totals Section ──
        const totalsX = pageWidth - 14;

        doc.setFontSize(9);
        doc.setTextColor(...muted);
        safeText(`Sous-total:`, totalsX - 50, yPos);
        doc.setTextColor(...dark);
        safeText(fmt(netAmount), totalsX, yPos, { align: 'right' });

        taxRows.forEach(([label, value]) => {
            yPos += 6;
            doc.setTextColor(...muted);
            safeText(label + ':', totalsX - 50, yPos);
            doc.setTextColor(...dark);
            safeText(value, totalsX, yPos, { align: 'right' });
        });

        // Total line
        yPos += 3;
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.3);
        doc.line(totalsX - 70, yPos, totalsX, yPos);

        yPos += 7;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...gold);
        safeText('TOTAL:', totalsX - 50, yPos);
        safeText(fmt(grandTotal), totalsX, yPos, { align: 'right' });

        // ── Payment History ──
        const payments = invoice.payment_history || [];
        if (payments.length > 0) {
            yPos += 14;
            doc.setFontSize(10);
            doc.setTextColor(...gold);
            doc.setFont('helvetica', 'bold');
            safeText('Historique des paiements', 14, yPos);
            doc.setFont('helvetica', 'normal');

            const paymentRows = payments.map((p, idx) => [
                String(idx + 1),
                p.date ? new Date(p.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A',
                fmt(p.amount),
                p.note || '-',
            ]);

            autoTable(doc, {
                head: [['#', 'Date', 'Montant', 'Note']],
                body: paymentRows,
                startY: yPos + 4,
                theme: 'striped',
                headStyles: {
                    fillColor: [80, 80, 80],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                },
                bodyStyles: { fontSize: 8, textColor: dark },
                columnStyles: {
                    0: { cellWidth: 12, halign: 'center' },
                    1: { cellWidth: 50 },
                    2: { cellWidth: 35, halign: 'right' },
                    3: { cellWidth: 60 },
                },
                margin: { left: 14, right: 14 },
            });

            const lastPayTable = (doc as any).lastAutoTable;
            yPos = (lastPayTable && typeof lastPayTable.finalY === 'number' ? lastPayTable.finalY : yPos) + 8;

            // Balance
            const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const balance = grandTotal - totalPaid;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...muted);
            safeText(`Total payé: ${fmt(totalPaid)}`, 14, yPos);

            if (balance > 0.01) {
                doc.setTextColor(200, 50, 50);
                safeText(`Solde dû: ${fmt(balance)}`, totalsX, yPos, { align: 'right' });
            } else {
                doc.setTextColor(50, 150, 50);
                safeText('PAYÉE EN TOTALITÉ', totalsX, yPos, { align: 'right' });
            }
        }

        // ── Status badge ──
        yPos += 15;
        if (invoice.status === 'paid') {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 150, 50);
            safeText('✓ PAYÉE', pageWidth / 2, yPos, { align: 'center' });
        } else if (invoice.status === 'partial') {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(200, 150, 0);
            safeText('PAIEMENT PARTIEL', pageWidth / 2, yPos, { align: 'center' });
        }

        // ── Footer ──
        const footerY = doc.internal.pageSize.getHeight() - 20;
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.3);
        doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...muted);
        safeText('Merci pour votre confiance!', pageWidth / 2, footerY, { align: 'center' });
        safeText(
            `${settings.company_name || 'Auclaire Jewelry'} • ${settings.contact_email || ''} • ${settings.phone || ''}`,
            pageWidth / 2,
            footerY + 4,
            { align: 'center' }
        );

        // ── Save ──
        const clientNameRaw = (invoice.project?.client?.full_name || 'Client');
        const clientName = String(clientNameRaw).replace(/\s+/g, '_');
        const fileName = `Facture_${invoiceNum}_${clientName}.pdf`;
        doc.save(fileName);
        console.log('PDF Generation Complete:', fileName);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('Erreur lors de la génération du PDF. Échec critique.');
    }
};
