import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

interface AmbassadorReportData {
    name: string;
    level: string;
    period: string;
    totalSales: number;
    salesCount: number;
    commissionEarned: number;
    commissionPending: number;
    conversionRate: number;
    projects: {
        title: string;
        client: string;
        amount: number;
        commission: number;
        status: string;
    }[];
    monthlySales: { label: string; amount: number }[];
}

export function generateAmbassadorReportPDF(data: AmbassadorReportData) {
    const doc = new jsPDF();
    const gold = [210, 181, 123];
    const dark = [5, 5, 5];
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AUCLAIRE', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport Ambassadeur', pageWidth / 2, 28, { align: 'center' });

    doc.setTextColor(180, 180, 180);
    doc.setFontSize(8);
    doc.text(data.period, pageWidth / 2, 35, { align: 'center' });

    // Ambassador Info
    let y = 55;
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.name, 14, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(`Niveau: ${data.level}`, 14, y + 8);

    // KPI Summary
    y += 22;
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 10;

    const kpis = [
        { label: 'Volume Total', value: `$${data.totalSales.toLocaleString()}` },
        { label: 'Ventes', value: String(data.salesCount) },
        { label: 'Commissions Gagnées', value: `$${data.commissionEarned.toLocaleString()}` },
        { label: 'Commissions En Attente', value: `$${data.commissionPending.toLocaleString()}` },
        { label: 'Taux de Conversion', value: `${data.conversionRate}%` },
    ];

    const colWidth = (pageWidth - 28) / kpis.length;
    kpis.forEach((kpi, i) => {
        const x = 14 + i * colWidth;
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(kpi.label, x + colWidth / 2, y, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(gold[0], gold[1], gold[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.value, x + colWidth / 2, y + 8, { align: 'center' });
    });

    // Monthly Sales
    y += 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text('Ventes Mensuelles', 14, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        head: [['Mois', 'Montant']],
        body: data.monthlySales.map(m => [m.label, `$${m.amount.toLocaleString()}`]),
        theme: 'grid',
        headStyles: { fillColor: [dark[0], dark[1], dark[2]], textColor: [gold[0], gold[1], gold[2]], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
    });

    // Projects Table
    y = ((doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? y) + 12;
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text('Détail des Projets', 14, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        head: [['Projet', 'Client', 'Montant', 'Commission', 'Statut']],
        body: data.projects.map(p => [
            p.title,
            p.client,
            `$${p.amount.toLocaleString()}`,
            `$${p.commission.toLocaleString()}`,
            p.status.replace(/_/g, ' ')
        ]),
        theme: 'grid',
        headStyles: { fillColor: [dark[0], dark[1], dark[2]], textColor: [gold[0], gold[1], gold[2]], fontStyle: 'bold' },
        styles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
    });

    // Footer
    const finalY = ((doc as JsPdfWithAutoTable).lastAutoTable?.finalY ?? 240) + 15;
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.setLineWidth(0.3);
    doc.line(14, finalY, pageWidth - 14, finalY);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-CA')} — MAISON AUCLAIRE`, pageWidth / 2, finalY + 5, { align: 'center' });

    doc.save(`rapport_ambassadeur_${data.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
}
