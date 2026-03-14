import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Clock, TrendingUp, HandCoins } from 'lucide-react';

interface DashboardStatsProps {
    totalCollected: number;
    totalInvoiced: number;
    potentialRevenue: number;
    totalProfit: number;
    projectedProfit: number;
    expectedCashPipeline: number;
    waitingCollection: number;
}

export function DashboardStats({
    totalCollected,
    totalInvoiced,
    potentialRevenue,
    totalProfit,
    projectedProfit,
    expectedCashPipeline,
    waitingCollection
}: DashboardStatsProps) {
    const stats = [
        {
            title: "Total Encaissé",
            value: totalCollected,
            sub: "Cash Reçu",
            icon: Banknote,
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            title: "En Attente de Collection",
            value: waitingCollection,
            sub: "Prêt à être encaissé",
            icon: HandCoins,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Total Facturé",
            value: totalInvoiced,
            sub: `A Encaisser: $${(totalInvoiced - totalCollected).toLocaleString()}`,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            title: "Revenu Potentiel",
            value: potentialRevenue,
            sub: "Pipeline non-facturé",
            detail: `Exp: ~$${Math.round(expectedCashPipeline).toLocaleString()}`,
            icon: Clock,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Marge Actualisée",
            value: totalProfit,
            sub: "Revenu Net",
            detail: `/ $${projectedProfit.toLocaleString()} Proj.`,
            icon: TrendingUp,
            color: "text-luxury-gold",
            bg: "bg-luxury-gold/10",
            highlight: true
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, index) => (
                <div
                    key={stat.title}
                    className="animate-in fade-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <Card className={`glass-card overflow-hidden group border-none ${stat.highlight ? 'luxury-shadow' : ''}`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-serif mb-1 ${stat.highlight ? 'text-luxury-gold' : 'text-foreground'}`}>
                                ${stat.value.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                    {stat.sub}
                                </span>
                                {stat.detail && (
                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-bold whitespace-nowrap">
                                        {stat.detail}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                        {stat.highlight && (
                            <div className="h-1 w-full bg-gradient-to-r from-transparent via-luxury-gold to-transparent opacity-30" />
                        )}
                    </Card>
                </div>
            ))}
        </div>
    );
}
