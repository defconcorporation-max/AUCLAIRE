import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from './apiSettings';
import { Invoice } from './apiInvoices';

export const generateInvoicePDF = (invoice: Invoice, settings: CompanySettings) => {
    const doc = new jsPDF();

    // -- Header --
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text(settings.company_name, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(settings.address_line1, 14, 28);
    doc.text(`${settings.city}, ${settings.country}`, 14, 32);
    doc.text(`Tax ID: ${settings.tax_rate}%`, 14, 36);

    // -- Invoice Info --
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dateStr = new Date().toLocaleDateString();
    doc.text(`Invoice #: ${invoice.id.substring(0, 8).toUpperCase()}`, 140, 22);
    doc.text(`Date: ${dateStr}`, 140, 26);
    doc.text(`Due Date: ${invoice.due_date}`, 140, 30);

    // -- Bill To --
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("Bill To:", 14, 50);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(invoice.project?.client?.full_name || "Client Name", 14, 55);
    doc.text(`Project: ${invoice.project?.title || "Project Title"}`, 14, 59);

    // -- Table --
    const tableColumn = ["Description", "Amount"];
    const tableRows = [
        [
            "Custom Jewelry Design & Production",
            `${settings.currency_symbol}${invoice.amount.toLocaleString()}`
        ]
    ];

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'striped',
        headStyles: { fillColor: [212, 175, 55] }, // Goldish color
        styles: { fontSize: 10 },
    });

    // -- Total --
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Subtotal: ${settings.currency_symbol}${invoice.amount.toLocaleString()}`, 140, finalY);

    const taxAmount = invoice.amount * (settings.tax_rate / 100);
    doc.text(`Tax (${settings.tax_rate}%): ${settings.currency_symbol}${taxAmount.toLocaleString()}`, 140, finalY + 5);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${settings.currency_symbol}${(invoice.amount + taxAmount).toLocaleString()}`, 140, finalY + 12);

    // -- Footer --
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business!", 14, finalY + 30);

    // Save
    doc.save(`Invoice_${invoice.id.substring(0, 8)}.pdf`);
};
