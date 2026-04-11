import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { apiAffiliates, type AffiliateProfile, type AffiliateStats } from '@/services/apiAffiliates';
import type { Project } from '@/services/apiProjects';
import { apiProjects } from '@/services/apiProjects';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Loader2, CheckCircle, Clock, Trash2, Briefcase, FileDown, ShieldCheck } from 'lucide-react';
import { generateAmbassadorReportPDF } from '@/services/ambassadorReportPdf';

/** Ligne `expenses` + jointure projet (commissions) */
interface CommissionExpenseUI {
    id: string;
    amount: number | string;
    description: string | null;
    date: string;
    status: string;
    project_id?: string | null;
    project?: { title?: string } | null;
}

export default function AffiliateDetails() {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('en') ? 'en-CA' : 'fr-CA';
    const fmtMoney = (n: number) => new Intl.NumberFormat(localeTag, { style: 'currency', currency: 'CAD' }).format(n);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null);
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [pendingCommissions, setPendingCommissions] = useState<CommissionExpenseUI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPayingId, setIsPayingId] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editable Fields
    const [fullName, setFullName] = useState('');
    // const [email, setEmail] = useState(''); // Note: Email is tricky with Supabase Profiles vs Auth
    const [status, setStatus] = useState<string>('pending');
    const [level, setLevel] = useState<string>('starter');
    const [rate, setRate] = useState<number>(10);
    const [type, setType] = useState<string>('percent');
    const [participantType, setParticipantType] = useState<string>('affiliate');

    const loadData = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            // 1. Fetch Profile (Manual fetch from apiAffiliates or re-use getAffiliates and find?)
            // We don't have getById yet in apiAffiliates, so let's add it or just use getAffiliates for now (inefficient but works)
            // Actually, let's implement a simple direct fetch here or assuming apiAffiliates has getById
            // Since I didn't add getById to apiAffiliates, I'll fetch the list and find (temporary) OR I'll add the method.
            // Let's assume I'll add getById to apiAffiliates.ts shortly. For now, I'll implement the fetch inline to be safe.
            const list = await apiAffiliates.getAffiliates();
            const found = list.find(a => a.id === id);

            if (found) {
                setAffiliate(found);
                setFullName(found.full_name || '');
                setStatus(found.affiliate_status || 'pending');
                setLevel(found.affiliate_level || 'starter');
                setRate(found.commission_rate ?? 10);
                setType(found.commission_type || 'percent');
                setParticipantType(found.participant_type || 'affiliate');

                // 2. Fetch Stats
                const statsData = await apiAffiliates.getAffiliateStats(id!);
                setStats(statsData);

                // 3. Fetch Pending Commissions from expenses table
                const { data: commData } = await supabase
                    .from('expenses')
                    .select('id, amount, description, date, status, project_id, project:projects(title)')
                    .eq('recipient_id', id!)
                    .eq('category', 'commission')
                    .order('date', { ascending: false });
                setPendingCommissions((commData ?? []) as CommissionExpenseUI[]);
            }
        } catch (error: unknown) {
            console.error("Failed to load affiliate", error);
            setError(error instanceof Error ? error.message : t('affiliateDetailsPage.unknownError'));
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            return;
        }
        void loadData();
    }, [id, loadData]);

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (error) return (
        <div className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-red-500">{t('affiliateDetailsPage.loadErrorTitle')}</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 p-3 rounded-lg max-w-lg mx-auto font-mono border border-zinc-200 dark:border-zinc-700">
                {t('affiliateDetailsPage.loadErrorHint')}
            </p>
            <Button onClick={loadData}>{t('affiliateDetailsPage.retry')}</Button>
        </div>
    );
    if (!affiliate) return <div className="p-8 text-center text-red-500">{t('affiliateDetailsPage.notFound')}</div>;

    const handleSave = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            await apiAffiliates.updateAffiliate(id, {
                full_name: fullName,
                affiliate_status: status as NonNullable<AffiliateProfile['affiliate_status']>,
                affiliate_level: level as NonNullable<AffiliateProfile['affiliate_level']>,
                commission_rate: Number(rate),
                commission_type: type as NonNullable<AffiliateProfile['commission_type']>,
                participant_type: participantType as any
            });
            alert(t('affiliateDetailsPage.saveSuccess'));
            loadData(); // Reload
        } catch (error) {
            console.error("Failed to save", error);
            alert(t('affiliateDetailsPage.saveFailed'));
        } finally {
            setIsSaving(false);
        }
    };

    const handlePayCommission = async (commissionId: string, amount: number) => {
        if (!confirm(t('affiliateDetailsPage.confirmMarkPaid', { amount: fmtMoney(Number(amount)) }))) return;
        setIsPayingId(commissionId);
        try {
            await supabase
                .from('expenses')
                .update({ status: 'paid' })
                .eq('id', commissionId);
            await loadData();
        } catch (err: unknown) {
            alert(t('affiliateDetailsPage.payFailed', { message: err instanceof Error ? err.message : t('common.error') }));
        } finally {
            setIsPayingId(null);
        }
    };

    const handleDeleteExpense = async (expenseId: string, projectId?: string) => {
        if (!confirm(t('affiliateDetailsPage.confirmDeleteCommission'))) return;
        try {
            // Delete the expense record
            await supabase.from('expenses').delete().eq('id', expenseId);

            // If it was linked to a project, reset the project financials
            if (projectId) {
                await apiProjects.updateFinancials(projectId, { commission_exported_to_expenses: false });
                await apiProjects.update(projectId, { affiliate_commission_rate: 0, affiliate_commission_type: 'percent' });
            }

            alert(t('affiliateDetailsPage.deleteSuccess'));
            await loadData();
        } catch (err: unknown) {
            alert(t('affiliateDetailsPage.deleteFailed', { message: err instanceof Error ? err.message : t('common.error') }));
        }
    };

    const handleGeneratePdf = async () => {
        if (!id) return;
        setIsGeneratingPdf(true);
        try {
            const monthlySales = await apiAffiliates.getMonthlySales(id);
            const projects = (stats?.projects ?? []) as Project[];
            const projectCount = projects.length || 1;

            generateAmbassadorReportPDF({
                name: affiliate?.full_name || 'Ambassadeur',
                level: affiliate?.affiliate_level || 'Starter',
                period: new Date().toLocaleDateString(localeTag, { year: 'numeric', month: 'long' }),
                totalSales: stats?.totalSales || 0,
                salesCount: stats?.salesCount || 0,
                commissionEarned: stats?.commissionEarned || 0,
                commissionPending: stats?.commissionPending ?? pendingCommissions.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0),
                conversionRate: Number(((stats?.salesCount || 0) / Math.max(projectCount, 1) * 100).toFixed(1)),
                projects: projects.map(p => {
                    const amount = Number(p.financials?.selling_price || p.budget || 0);
                    const rate = p.affiliate_commission_rate || 0;
                    const commission = affiliate?.commission_type === 'fixed' ? (affiliate?.commission_rate || 0) : amount * (rate / 100);
                    return {
                        title: p.title,
                        client: p.client?.full_name || '-',
                        amount,
                        commission,
                        status: p.status || '-'
                    };
                }),
                monthlySales: monthlySales.map(m => ({ label: m.label, amount: m.amount }))
            });
        } catch (err) {
            console.error('Failed to generate PDF', err);
            alert(t('affiliateDetailsPage.pdfError'));
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/affiliates')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                        {affiliate.full_name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline" className={`text-xs ${
                            affiliate.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                            affiliate.role === 'ambassador' ? 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/20' : 
                            'bg-zinc-100 dark:bg-zinc-800'
                        }`}>
                            {affiliate.role === 'admin' ? t('affiliatesListPage.roleAdmin') : affiliate.role === 'ambassador' ? t('affiliatesListPage.roleAmbassador') : t('affiliatesListPage.roleSeller')}
                        </Badge>
                        <span className="text-luxury-gold uppercase font-bold text-xs tracking-wider">
                            {affiliate.affiliate_level}
                        </span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGeneratePdf}
                        disabled={isGeneratingPdf}
                        className="gap-2"
                    >
                        {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        {t('affiliateDetailsPage.pdfReport')}
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {t('affiliateDetailsPage.saveChanges')}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card className="bg-zinc-900 text-white border-zinc-800">
                    <CardHeader className="pb-2 text-luxury-gold flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">{t('affiliateDetailsPage.totalSales')}</CardTitle>
                        <Briefcase className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {fmtMoney(stats?.totalSales || 0)}
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{t('affiliateDetailsPage.salesVolume', { count: stats?.salesCount || 0 })}</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 text-white border-zinc-800">
                    <CardHeader className="pb-2 text-green-500 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">{t('affiliateDetailsPage.cashCollected')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-green-400">
                            {fmtMoney(stats?.cashCollected || 0)}
                        </div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{t('affiliateDetailsPage.invoicesPaid')}</p>
                    </CardContent>
                </Card>
                {/* Stats Cards */}
                <Card className="bg-zinc-900 text-white border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">{t('affiliateDetailsPage.commissionEstimated')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-luxury-gold">
                            {fmtMoney(stats?.commissionEarned || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700">{t('affiliateDetailsPage.pendingPayment')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-amber-600">
                            {fmtMoney(
                                pendingCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">{t('affiliateDetailsPage.alreadyPaid')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-green-600">
                            {fmtMoney(
                                pendingCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0)
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">{t('affiliateDetailsPage.defaultRate')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {affiliate.commission_rate}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Edit Profile Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>{t('affiliateDetailsPage.profileSettings')}</CardTitle>
                        <CardDescription>{t('affiliateDetailsPage.profileSettingsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('affiliateDetailsPage.fullName')}</Label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('affiliateDetailsPage.status')}</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="pending">{t('affiliateDetailsPage.statusPending')}</option>
                                <option value="active">{t('affiliateDetailsPage.statusActive')}</option>
                                <option value="rejected">{t('affiliateDetailsPage.statusRejected')}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('affiliateDetailsPage.level')}</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="starter">{t('affiliateDetailsPage.levelStarter')}</option>
                                <option value="confirmed">{t('affiliateDetailsPage.levelConfirmed')}</option>
                                <option value="elite">{t('affiliateDetailsPage.levelElite')}</option>
                                <option value="partner">{t('affiliateDetailsPage.levelPartner')}</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('affiliateDetailsPage.commission')}</Label>
                                <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('affiliateDetailsPage.type')}</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                            <Label className="text-luxury-gold font-bold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                {t('affiliateDetailsPage.participantType', 'Classe de Partenaire')}
                            </Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-luxury-gold/30 bg-luxury-gold/5 px-3 py-2 text-sm font-medium"
                                value={participantType}
                                onChange={(e) => setParticipantType(e.target.value)}
                            >
                                <option value="affiliate">{t('participantType.affiliate', 'Affilié (Apporteur)')}</option>
                                <option value="ambassador">{t('participantType.ambassador', 'Ambassadeur (Vente Partielle)')}</option>
                                <option value="seller">{t('participantType.seller', 'Vendeur (Closer)')}</option>
                            </select>
                            <p className="text-[10px] text-muted-foreground italic">
                                {t('affiliateDetailsPage.participantTypeDesc', 'Détermine l\'interface du dashboard et les permissions de données.')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Commissions Panel */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            {t('affiliateDetailsPage.commissionsTitle')}
                        </CardTitle>
                        <CardDescription>{t('affiliateDetailsPage.commissionsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingCommissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">{t('affiliateDetailsPage.noCommissions')}</p>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('affiliateDetailsPage.colDescription')}</TableHead>
                                            <TableHead>{t('affiliateDetailsPage.colAmount')}</TableHead>
                                            <TableHead>{t('affiliateDetailsPage.colStatus')}</TableHead>
                                            <TableHead className="text-right">{t('affiliateDetailsPage.colAction')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingCommissions.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell className="text-sm">
                                                    <div>{c.description}</div>
                                                    <div className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString(localeTag)}</div>
                                                </TableCell>
                                                <TableCell className="font-mono font-bold text-luxury-gold">
                                                    {fmtMoney(Number(c.amount))}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={c.status === 'paid'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                                    }>
                                                        {c.status === 'paid' ? <><CheckCircle className="w-3 h-3 inline mr-1" />{t('affiliateDetailsPage.statusPaid')}</> : `⏳ ${t('affiliateDetailsPage.statusPendingShort')}`}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {c.status === 'pending' ? (
                                                        <div className="flex justify-end items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs text-red-500 hover:bg-red-50"
                                                                onClick={() => handleDeleteExpense(c.id, c.project_id)}
                                                            >
                                                                <Trash2 className="w-3 h-3 mr-1" />
                                                                {t('affiliateDetailsPage.cancel')}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                                                                disabled={isPayingId === c.id}
                                                                onClick={() => handlePayCommission(c.id, Number(c.amount))}
                                                            >
                                                                {isPayingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                                {t('affiliateDetailsPage.pay')}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">✓ {t('affiliateDetailsPage.settled')}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sales History Table (Comprehensive) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-luxury-gold" />
                        {t('affiliateDetailsPage.salesHistoryTitle')}
                    </CardTitle>
                    <CardDescription>{t('affiliateDetailsPage.salesHistoryDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats?.projects?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('affiliateDetailsPage.noAssignedProjects')}</p>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                        <TableHead>{t('affiliateDetailsPage.colProject')}</TableHead>
                                        <TableHead>{t('affiliateDetailsPage.colClient')}</TableHead>
                                        <TableHead>{t('affiliateDetailsPage.colStatus')}</TableHead>
                                        <TableHead className="text-right">{t('affiliateDetailsPage.colSalePrice')}</TableHead>
                                        <TableHead className="text-right text-luxury-gold">{t('affiliateDetailsPage.colCommPct')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {((stats?.projects ?? []) as Project[]).map((p) => {
                                        const price = Number(p.financials?.selling_price || p.budget || 0);
                                        const commRate = p.affiliate_commission_rate || 0;
                                        return (
                                            <TableRow key={p.id} className="border-zinc-100 dark:border-zinc-800">
                                                <TableCell className="font-medium">{p.title}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{p.client?.full_name || t('affiliateDetailsPage.unknownClient')}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">
                                                        {p.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold">
                                                    {fmtMoney(price)}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    <span className={commRate > 0 ? 'text-luxury-gold font-bold' : 'text-gray-400'}>
                                                        {commRate}%
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
