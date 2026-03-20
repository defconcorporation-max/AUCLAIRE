import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from './apiSettings';
import { Invoice } from './apiInvoices';
import { calculateCanadianTax, type CanadianProvince } from '@/utils/taxUtils';

/**
 * Generates a professional PDF invoice for Auclaire Jewelry.
 * Supports Canadian tax breakdowns, payment history, and bilingual formatting.
 */
export const generateInvoicePDF = (invoice: Invoice, settings: CompanySettings) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // ── Brand Colors ──
        const gold: [number, number, number] = [212, 175, 55];
        const dark: [number, number, number] = [40, 40, 40];
        const muted: [number, number, number] = [120, 120, 120];

        // ── Helper: format currency ──
        const fmt = (n: number) =>
            n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

        // ── Header: Company Info ──
        doc.setFontSize(22);
        doc.setTextColor(...dark);
        doc.text(settings.company_name, 14, 22);

        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text(settings.address_line1, 14, 28);
        if (settings.address_line2) {
            doc.text(settings.address_line2, 14, 32);
        }
        doc.text(`${settings.city}, ${settings.country}`, 14, settings.address_line2 ? 36 : 32);
        if (settings.contact_email) {
            doc.text(settings.contact_email, 14, settings.address_line2 ? 40 : 36);
        }
        if (settings.phone) {
            doc.text(settings.phone, 14, settings.address_line2 ? 44 : 40);
        }

        // ── Header: Invoice Info (right side) ──
        doc.setFontSize(16);
        doc.setTextColor(...gold);
        doc.text('FACTURE', pageWidth - 14, 22, { align: 'right' });

        doc.setFontSize(9);
        doc.setTextColor(...muted);
        const invoiceNum = `#${invoice.id.substring(0, 8).toUpperCase()}`;
        doc.text(`No: ${invoiceNum}`, pageWidth - 14, 28, { align: 'right' });
        doc.text(
            `Date: ${new Date(invoice.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}`,
            pageWidth - 14,
            32,
            { align: 'right' }
        );
        if (invoice.due_date) {
            doc.text(
                `Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                pageWidth - 14,
                36,
                { align: 'right' }
            );
        }

        // ── Gold separator line ──
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.5);
        doc.line(14, 48, pageWidth - 14, 48);

        // ── Bill To ──
        doc.setFontSize(10);
        doc.setTextColor(...gold);
        doc.text('Facturer à:', 14, 56);

        doc.setFontSize(11);
        doc.setTextColor(...dark);
        doc.text(invoice.project?.client?.full_name || 'Client', 14, 62);

        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text(`Projet: ${invoice.project?.title || 'Projet'}`, 14, 67);

        // ── Table: Line Items ──
        const taxProvince = invoice.project?.financials?.tax_province as CanadianProvince | undefined;
        const netAmount = invoice.amount;

        const tableRows: string[][] = [
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
            const taxes = calculateCanadianTax(netAmount, taxProvince);
            taxTotal = taxes.total;
            if (taxes.gst > 0) {
                taxRows.push(['TPS (5%)', fmt(taxes.gst)]);
            }
            if (taxes.pst > 0) {
                // Quebec uses TVQ label; other provinces use TVP
                const pstLabel = taxProvince === 'QC' ? 'TVQ (9,975%)' : `TVP (${taxProvince})`;
                taxRows.push([pstLabel, fmt(taxes.pst)]);
            }
            if (taxes.hst > 0) {
                taxRows.push([`TVH (${taxProvince})`, fmt(taxes.hst)]);
            }
        } else if (settings.tax_rate > 0) {
            taxTotal = netAmount * (settings.tax_rate / 100);
            taxRows.push([`Taxe (${settings.tax_rate}%)`, fmt(taxTotal)]);
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
        // jspdf-autotable v5 stores info on the doc instance via (doc as any).lastAutoTable
        const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
        let yPos = (lastTable?.finalY ?? 90) + 10;

        // ── Totals Section ──
        const totalsX = pageWidth - 14;

        doc.setFontSize(9);
        doc.setTextColor(...muted);
        doc.text(`Sous-total:`, totalsX - 50, yPos);
        doc.setTextColor(...dark);
        doc.text(fmt(netAmount), totalsX, yPos, { align: 'right' });

        taxRows.forEach(([label, value]) => {
            yPos += 6;
            doc.setTextColor(...muted);
            doc.text(label + ':', totalsX - 50, yPos);
            doc.setTextColor(...dark);
            doc.text(value, totalsX, yPos, { align: 'right' });
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
        doc.text('TOTAL:', totalsX - 50, yPos);
        doc.text(fmt(grandTotal), totalsX, yPos, { align: 'right' });

        // ── Payment History ──
        const payments = invoice.payment_history || [];
        if (payments.length > 0) {
            yPos += 14;
            doc.setFontSize(10);
            doc.setTextColor(...gold);
            doc.setFont('helvetica', 'bold');
            doc.text('Historique des paiements', 14, yPos);
            doc.setFont('helvetica', 'normal');

            const paymentRows = payments.map((p, idx) => [
                String(idx + 1),
                new Date(p.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }),
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

            const lastPayTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
            yPos = (lastPayTable?.finalY ?? yPos) + 8;

            // Balance
            const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const balance = grandTotal - totalPaid;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...muted);
            doc.text(`Total payé: ${fmt(totalPaid)}`, 14, yPos);

            if (balance > 0) {
                doc.setTextColor(200, 50, 50);
                doc.text(`Solde dû: ${fmt(balance)}`, totalsX, yPos, { align: 'right' });
            } else {
                doc.setTextColor(50, 150, 50);
                doc.text('PAYÉE EN TOTALITÉ', totalsX, yPos, { align: 'right' });
            }
        }

        // ── Status badge ──
        yPos += 15;
        if (invoice.status === 'paid') {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 150, 50);
            doc.text('✓ PAYÉE', pageWidth / 2, yPos, { align: 'center' });
        } else if (invoice.status === 'partial') {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(200, 150, 0);
            doc.text('PAIEMENT PARTIEL', pageWidth / 2, yPos, { align: 'center' });
        }

        // ── Footer ──
        const footerY = doc.internal.pageSize.getHeight() - 20;
        doc.setDrawColor(...gold);
        doc.setLineWidth(0.3);
        doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...muted);
        doc.text('Merci pour votre confiance!', pageWidth / 2, footerY, { align: 'center' });
        doc.text(
            `${settings.company_name} • ${settings.contact_email} • ${settings.phone}`,
            pageWidth / 2,
            footerY + 4,
            { align: 'center' }
        );

        // ── Save ──
        const clientName = (invoice.project?.client?.full_name || 'Client').replace(/\s+/g, '_');
        const fileName = `Facture_${invoiceNum.replace('#', '')}_${clientName}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        alert('Erreur lors de la génération du PDF. Veuillez vérifier la console pour plus de détails.');
    }
};
