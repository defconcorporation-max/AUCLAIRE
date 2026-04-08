import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings } from './apiSettings';
import { Invoice } from './apiInvoices';
import { Expense } from './apiExpenses';
import { Project } from './apiProjects';

type InvoiceWithMeta = Invoice & { updated_at?: string };
import { financialUtils } from '@/utils/financialUtils';

const LUXURY_GOLD: [number, number, number] = [210, 181, 123]; // #D2B57B

export interface MonthlyReportParams {
    invoices: Invoice[];
    expenses: Expense[];
    projects: Project[];
    month: Date;
    settings: CompanySettings;
}

function formatMoney(amount: number, settings: CompanySettings): string {
    return `${settings.currency_symbol}${Number(amount).toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMonthRange(month: Date): { start: Date; end: Date } {
    const start = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

function getPreviousMonthRange(month: Date): { start: Date; end: Date } {
    const prev = new Date(month.getFullYear(), month.getMonth() - 1, 1);
    return getMonthRange(prev);
}

export function generateMonthlyReportPDF(params: MonthlyReportParams): void {
    const { invoices, expenses, month, settings } = params;
    const doc = new jsPDF();
    const { start, end } = getMonthRange(month);
    const { start: prevStart, end: prevEnd } = getPreviousMonthRange(month);

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthLabel = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.setFont('helvetica', 'bold');
    doc.text('AUCLAIRE — Rapport Financier Mensuel', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'normal');
    doc.text(monthLabel, 14, 28);

    // --- Summary Section ---
    const periodInvoices = invoices.filter(inv => {
        const date = new Date(inv.created_at);
        return date >= start && date <= end && inv.status !== 'void';
    });
    const totalInvoiced = periodInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const collected = financialUtils.getCollectedFromInvoices(invoices, start, end);
    const periodExpenses = expenses.filter(exp => {
        const date = new Date(exp.date || exp.created_at);
        return date >= start && date <= end && exp.status !== 'cancelled';
    });
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const profit = collected - totalExpenses;

    // Previous month for comparison
    const prevCollected = financialUtils.getCollectedFromInvoices(invoices, prevStart, prevEnd);
    const prevInvoiced = invoices
        .filter(inv => {
            const date = new Date(inv.created_at);
            return date >= prevStart && date <= prevEnd && inv.status !== 'void';
        })
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const prevExpenses = expenses
        .filter(exp => {
            const date = new Date(exp.date || exp.created_at);
            return date >= prevStart && date <= prevEnd && exp.status !== 'cancelled';
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const prevProfit = prevCollected - prevExpenses;

    const pctChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    };

    let y = 38;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text('Résumé Financier', 14, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total facturé: ${formatMoney(totalInvoiced, settings)}`, 14, y);
    const invPct = pctChange(totalInvoiced, prevInvoiced);
    doc.text(invPct !== 0 ? ` (${invPct > 0 ? '+' : ''}${invPct}% vs mois précédent)` : '', 70, y);
    y += 6;

    doc.text(`Total encaissé: ${formatMoney(collected, settings)}`, 14, y);
    const colPct = pctChange(collected, prevCollected);
    doc.text(colPct !== 0 ? ` (${colPct > 0 ? '+' : ''}${colPct}% vs mois précédent)` : '', 70, y);
    y += 6;

    doc.text(`Total dépenses: ${formatMoney(totalExpenses, settings)}`, 14, y);
    const expPct = pctChange(totalExpenses, prevExpenses);
    doc.text(expPct !== 0 ? ` (${expPct > 0 ? '+' : ''}${expPct}% vs mois précédent)` : '', 70, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text(`Profit net: ${formatMoney(profit, settings)}`, 14, y);
    const profitPct = pctChange(profit, prevProfit);
    doc.text(profitPct !== 0 ? ` (${profitPct > 0 ? '+' : ''}${profitPct}% vs mois précédent)` : '', 70, y);
    y += 14;

    // --- Invoices Paid This Month ---
    const paidInvoices = invoices.filter((inv: InvoiceWithMeta) => {
        const paidAt = inv.paid_at || (inv.status === 'paid' ? inv.created_at : null) || (Number(inv.amount_paid) > 0 ? (inv as any).updated_at ?? inv.created_at : null);
        if (!paidAt) return false;
        const d = new Date(paidAt);
        return d >= start && d <= end;
    }).map((inv: InvoiceWithMeta) => {
        const paidValue = Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : inv.status === 'paid' ? Number(inv.amount || 0) : 0;
        const clientName = (inv.project as { client?: { full_name?: string } })?.client?.full_name || '—';
        const projectTitle = (inv.project as { title?: string })?.title || '—';
        const paidAt = inv.paid_at || inv.updated_at || inv.created_at;
        return [clientName, projectTitle, formatMoney(paidValue, settings), new Date(paidAt).toLocaleDateString('fr-CA')];
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Factures encaissées ce mois', 14, y);
    y += 6;

    if (paidInvoices.length > 0) {
        autoTable(doc, {
            head: [['Client', 'Projet', 'Montant', 'Date']],
            body: paidInvoices,
            startY: y,
            theme: 'striped',
            headStyles: { fillColor: LUXURY_GOLD },
            styles: { fontSize: 9 },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Aucune facture encaissée ce mois.', 14, y);
        y += 12;
    }

    // --- Expenses This Month ---
    const expenseRows = periodExpenses.map(exp => [
        exp.category,
        exp.description || '—',
        formatMoney(Number(exp.amount || 0), settings),
    ]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text('Dépenses ce mois', 14, y);
    y += 6;

    if (expenseRows.length > 0) {
        autoTable(doc, {
            head: [['Catégorie', 'Description', 'Montant']],
            body: expenseRows,
            startY: y,
            theme: 'striped',
            headStyles: { fillColor: LUXURY_GOLD },
            styles: { fontSize: 9 },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Aucune dépense ce mois.', 14, y);
        y += 12;
    }

    // --- Top 5 Clients by Revenue ---
    const clientRevenueMap: Record<string, number> = {};
    invoices.forEach((inv: InvoiceWithMeta) => {
        const paidAt = inv.paid_at || (inv.status === 'paid' ? inv.created_at : null) || (Number(inv.amount_paid) > 0 ? (inv as any).updated_at ?? inv.created_at : null);
        if (!paidAt) return false;
        const d = new Date(paidAt);
        if (d < start || d > end) return;
        const clientName = (inv.project as { client?: { full_name?: string } })?.client?.full_name || 'Client inconnu';
        const paidValue = Number(inv.amount_paid) > 0 ? Number(inv.amount_paid) : inv.status === 'paid' ? Number(inv.amount || 0) : 0;
        clientRevenueMap[clientName] = (clientRevenueMap[clientName] || 0) + paidValue;
    });

    const topClients = Object.entries(clientRevenueMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, amt]) => [name, formatMoney(amt, settings)]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text('Top 5 clients par revenus', 14, y);
    y += 6;

    if (topClients.length > 0) {
        autoTable(doc, {
            head: [['Client', 'Revenus']],
            body: topClients,
            startY: y,
            theme: 'striped',
            headStyles: { fillColor: LUXURY_GOLD },
            styles: { fontSize: 9 },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Aucune donnée.', 14, y);
        y += 12;
    }

    // --- Footer ---
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(settings.company_name, 14, pageHeight - 20);
    doc.text(settings.address_line1, 14, pageHeight - 16);
    doc.text(`${settings.city}, ${settings.country}`, 14, pageHeight - 12);
    doc.text(settings.contact_email, 14, pageHeight - 8);

    // Save
    const safeMonth = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    doc.save(`Rapport_Financier_${safeMonth}.pdf`);
}
