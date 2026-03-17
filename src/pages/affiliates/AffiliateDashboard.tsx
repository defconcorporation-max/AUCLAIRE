import { Project } from '@/services/apiProjects';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiAffiliates, AffiliateStats } from '@/services/apiAffiliates';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, Briefcase, TrendingUp, Clock } from 'lucide-react';

interface PendingCommission {
    id: string;
    amount: number;
    description: string;
    date: string;
    status: 'pending' | 'paid' | 'cancelled';
    project?: { title: string };
}

export default function AffiliateDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            if (!profile?.id) return;
            try {
                // Load stats and pending commissions in parallel
                const [data, { data: expensesData }] = await Promise.all([
                    apiAffiliates.getAffiliateStats(profile.id),
                    supabase
                        .from('expenses')
                        .select('id, amount, description, date, status, project:projects(title)')
                        .eq('recipient_id', profile.id)
                        .eq('category', 'commission')
                        .order('date', { ascending: false })
                ]);

                if (isMounted) {
                    setStats(data);
                    setPendingCommissions((expensesData || []) as any[]);
                }
            } catch (error) {
                console.error("Failed to load affiliate data", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
    }, [profile?.id]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    const { commissionEarned = 0, activeProjects = 0, projects = [] } = stats || {};

    const pendingTotal = pendingCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.amount), 0);
    const paidTotal = pendingCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.amount), 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-serif text-gray-900 dark:text-white">
                    Bonjour, {profile?.full_name?.split(' ')[0]}
                </h1>
                <p className="text-gray-500">
                    Niveau: <span className="text-luxury-gold font-bold uppercase">{profile?.affiliate_level || 'Starter'}</span>
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 text-white shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Commissions Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-luxury-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-luxury-gold">
                            {formatCurrency(commissionEarned)}
                        </div>
                        <p className="text-xs text-gray-500">Revenus estimés totaux</p>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">En Attente</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400">
                            {formatCurrency(pendingTotal)}
                        </div>
                        <p className="text-xs text-amber-600/70 dark:text-amber-500/70">À recevoir bientôt</p>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Payé</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-green-600 dark:text-green-400">
                            {formatCurrency(paidTotal)}
                        </div>
                        <p className="text-xs text-green-600/70 dark:text-green-500/70">Reçu à ce jour</p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Projets Actifs</CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">{activeProjects}</div>
                        <p className="text-xs text-gray-500">En cours de production</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Commissions Section */}
            {pendingCommissions.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30">
                    <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Historique des Versements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingCommissions.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(c.date).toLocaleDateString('fr-CA')}
                                        </TableCell>
                                        <TableCell className="font-medium">{c.description}</TableCell>
                                        <TableCell>
                                            <Badge className={c.status === 'paid'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                            }>
                                                {c.status === 'paid' ? '✓ Payé' : '⏳ En attente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-luxury-gold">
                                            {formatCurrency(Number(c.amount))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Projects Table */}
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-xl font-serif">Vos Dossiers Clients</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="rounded-md border bg-white dark:bg-zinc-900 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-zinc-50 dark:bg-zinc-950">
                                    <TableHead>Dossier</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Montant Vente</TableHead>
                                    <TableHead className="text-right text-luxury-gold font-bold">Votre Com.</TableHead>
                                    <TableHead className="text-right">Commission</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                            Aucun projet assigné pour le moment.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    projects.map((project: Project) => {
                                        const price = Number(project.financials?.selling_price || project.budget || 0);
                                        const com = financialUtils.computeCommissionAmount(project as Project);
                                        const rate = project.affiliate_commission_rate || 0;
                                        const rateDisplay = project.affiliate_commission_type === 'fixed' ? 'Fixe' : `${rate}%`;

                                        const isExported = project.financials?.commission_exported_to_expenses;

                                        return (
                                            <TableRow key={project.id}>
                                                <TableCell className="font-medium">
                                                    <div>{project.title}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {project.status?.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(price)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-luxury-gold">
                                                    {formatCurrency(com)}
                                                    <span className="block text-[10px] text-gray-400 font-normal">{rateDisplay}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isExported ? (
                                                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs">
                                                            ⏳ En attente paiement
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                                            Non soumis
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
