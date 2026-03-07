import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { apiClients } from '@/services/apiClients';
import { apiInvoices } from '@/services/apiInvoices';
import { apiUsers } from '@/services/apiUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Banknote, Briefcase, Trophy, ChevronUp } from 'lucide-react';

export default function AnalyticsDashboard() {
    const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ['projects'], queryFn: apiProjects.getAll });
    const { data: clients = [], isLoading: cLoad } = useQuery({ queryKey: ['clients'], queryFn: apiClients.getAll });
    const { data: invoices = [], isLoading: iLoad } = useQuery({ queryKey: ['invoices'], queryFn: apiInvoices.getAll });
    const { data: users = [], isLoading: uLoad } = useQuery({ queryKey: ['users'], queryFn: apiUsers.getAll });

    if (pLoad || cLoad || iLoad || uLoad) {
        return <div className="p-8 text-center text-luxury-gold animate-pulse font-serif">Loading Analytics Data...</div>;
    }

    // 1. Global KPIs
    const totalVolume = projects.reduce((sum, p) => sum + (p.financials?.selling_price || p.budget || 0), 0);
    const totalCollected = invoices.reduce((sum, i) => sum + ((i.amount_paid && i.amount_paid > 0) ? i.amount_paid : (i.status === 'paid' ? i.amount : 0)), 0);
    const activeClients = clients.length;

    // 2. Monthly Revenue Chart (Paid Invoices)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map(m => ({ month: m, collected: 0, volume: 0 }));

    invoices.forEach(inv => {
        const dateStr = inv.paid_at || inv.created_at;
        const date = new Date(dateStr);
        // Cast inv as any or check valid statuses since types differ slightly per query
        if (date.getFullYear() === currentYear && (inv as any).status !== 'cancelled') {
            const paid = (inv.amount_paid && inv.amount_paid > 0) ? inv.amount_paid : (inv.status === 'paid' ? inv.amount : 0);
            if (paid > 0) monthlyData[date.getMonth()].collected += paid;
        }
    });

    projects.forEach(p => {
        const date = new Date(p.created_at);
        if (date.getFullYear() === currentYear) {
            monthlyData[date.getMonth()].volume += (p.financials?.selling_price || p.budget || 0);
        }
    });

    // 3. Seller/Affiliate Leaderboard
    // We attribute project volume and commissions to either sales_agent_id or affiliate_id
    const sellerStats: Record<string, { id: string, name: string, projectCount: number, volume: number, commissions: number }> = {};

    users.filter(u => u.role === 'affiliate' || u.role === 'admin').forEach(u => {
        sellerStats[u.id] = { id: u.id, name: u.full_name, projectCount: 0, volume: 0, commissions: 0 };
    });

    projects.forEach(p => {
        const responsibleId = p.sales_agent_id || p.affiliate_id;
        if (responsibleId && sellerStats[responsibleId]) {
            const salePrice = p.financials?.selling_price || p.budget || 0;
            const comRate = p.affiliate_commission_rate || 0;
            const commission = p.affiliate_commission_type === 'fixed' ? comRate : (salePrice * comRate) / 100;

            sellerStats[responsibleId].projectCount++;
            sellerStats[responsibleId].volume += salePrice;
            sellerStats[responsibleId].commissions += commission;
        }
    });

    const leaderboard = Object.values(sellerStats)
        .filter(s => s.projectCount > 0) // Only show active sellers
        .sort((a, b) => b.volume - a.volume);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-serif text-black dark:text-white tracking-wide">Business Analytics</h1>
                    <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">Global performance & seller leaderboard.</p>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">Volume Généré Total</CardTitle>
                        <Briefcase className="h-4 w-4 text-luxury-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-black dark:text-white">${totalVolume.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">Cash Encaissé Total</CardTitle>
                        <Banknote className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-black dark:text-white">${totalCollected.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 border-black/10 dark:border-white/10 relative overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium uppercase tracking-widest text-gray-500">Clients Actifs</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-serif text-black dark:text-white">{activeClients}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Double Chart Layout */}
            <div className="grid gap-6 md:grid-cols-3">

                {/* Chart */}
                <Card className="md:col-span-2 border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-serif text-xl">Croissance Annuelle ({currentYear})</CardTitle>
                        <CardDescription>Volume généré vs. Cash réellement encaissé</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#A68A56" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#A68A56" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <Tooltip
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(210,181,123,0.3)', color: '#fff' }}
                                    />
                                    <Area type="monotone" name="Volume ($)" dataKey="volume" stroke="#A68A56" fillOpacity={1} fill="url(#colorVolume)" />
                                    <Area type="monotone" name="Encaissé ($)" dataKey="collected" stroke="#22c55e" fillOpacity={1} fill="url(#colorCollected)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Mini Top Seller */}
                <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-xl flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-luxury-gold" />
                            Meilleur Vendeur
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center h-[300px] mt-4">
                        {leaderboard.length > 0 ? (
                            <div className="text-center space-y-6">
                                <div className="inline-flex items-center justify-center p-6 bg-luxury-gold/10 rounded-full ring-2 ring-luxury-gold/30">
                                    <Trophy className="w-12 h-12 text-luxury-gold" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-serif text-black dark:text-white">{leaderboard[0].name}</h3>
                                    <p className="text-luxury-gold mt-1 uppercase tracking-widest text-sm font-semibold">
                                        ${leaderboard[0].volume.toLocaleString()} Générés
                                    </p>
                                    <p className="text-gray-500 text-xs mt-2">{leaderboard[0].projectCount} Projets signés</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">Aucun projet attribué.</div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* Leaderboard Table */}
            <Card className="border-black/10 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md shadow-xl overflow-hidden mt-8">
                <CardHeader>
                    <CardTitle className="font-serif text-2xl tracking-wide">Palmarès Ambassadeurs & Vendeurs</CardTitle>
                    <CardDescription>Classement par volume de projets apportés.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-black/5 dark:bg-white/5">
                            <TableRow className="border-black/5 dark:border-white/5">
                                <TableHead className="w-16 text-center font-bold text-luxury-gold">Rang</TableHead>
                                <TableHead>Nom du Vendeur</TableHead>
                                <TableHead className="text-center">Projets</TableHead>
                                <TableHead className="text-right">Volume Apporté</TableHead>
                                <TableHead className="text-right text-purple-600/70 dark:text-purple-400">Commissions (Est/Payées)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leaderboard.map((seller, idx) => (
                                <TableRow key={seller.id} className="border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <TableCell className="text-center font-serif text-lg text-gray-500">
                                        {idx === 0 ? <span className="text-luxury-gold">1</span> : idx + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-black dark:text-white text-base">
                                        {seller.name}
                                        {idx === 0 && <ChevronUp className="inline-block w-4 h-4 ml-2 text-green-500" />}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="border-luxury-gold/30 text-luxury-gold bg-transparent">
                                            {seller.projectCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-serif text-lg font-bold">
                                        ${seller.volume.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-purple-600 dark:text-purple-400 font-medium">
                                        ${seller.commissions.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {leaderboard.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Aucune donnée de vente pour le moment.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
