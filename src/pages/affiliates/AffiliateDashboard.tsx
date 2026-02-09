
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiAffiliates, AffiliateStats } from '@/services/apiAffiliates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, Briefcase, TrendingUp } from 'lucide-react';


export default function AffiliateDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            if (profile?.id) {
                try {
                    const data = await apiAffiliates.getAffiliateStats(profile.id);
                    setStats(data);
                } catch (error) {
                    console.error("Failed to load affiliate stats", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadStats();
    }, [profile?.id]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    const { totalSales = 0, commissionEarned = 0, activeProjects = 0, projects = [] } = stats || {};

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
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 text-white shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">
                            Commissions Totales
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-luxury-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-luxury-gold">
                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(commissionEarned)}
                        </div>
                        <p className="text-xs text-gray-500">
                            Revenus générés à ce jour
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Ventes Totales
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(totalSales)}
                        </div>
                        <p className="text-xs text-gray-500">
                            Volume de ventes apporté
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">
                            Projets Actifs
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {activeProjects}
                        </div>
                        <p className="text-xs text-gray-500">
                            En cours de production
                        </p>
                    </CardContent>
                </Card>
            </div>

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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                                            Aucun projet assigné pour le moment.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    projects.map((project: any) => {
                                        const price = project.sale_price || 0;
                                        // Calc commission display
                                        let com = 0;
                                        let rateDisplay = '';
                                        if (project.affiliate_commission_type === 'fixed') {
                                            com = project.affiliate_commission_rate || 0;
                                            rateDisplay = 'Fixe';
                                        } else {
                                            const rate = project.affiliate_commission_rate || 0;
                                            com = (price * rate) / 100;
                                            rateDisplay = `${rate}%`;
                                        }

                                        return (
                                            <TableRow key={project.id}>
                                                <TableCell className="font-medium">
                                                    {project.title || 'Projet sans titre'}
                                                    <div className="text-xs text-gray-400">ID: {project.id.slice(0, 8)}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {project.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(price)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-luxury-gold">
                                                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(com)}
                                                    <span className="text-[10px] text-gray-400 block font-normal">({rateDisplay})</span>
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
