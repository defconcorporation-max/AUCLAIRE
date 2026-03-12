import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Clock, TrendingUp, HandCoins } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
    totalCollected: number;
    totalPending: number;
    totalProfit: number;
    projectedProfit: number;
    expectedCashPipeline: number;
    totalCommissions: number;
}

export function DashboardStats({
    totalCollected,
    totalPending,
    totalProfit,
    projectedProfit,
    expectedCashPipeline,
    totalCommissions
}: DashboardStatsProps) {
    const stats = [
        {
            title: "Total Collected",
            value: totalCollected,
            sub: "Cash Received",
            icon: Banknote,
            color: "text-green-500",
            bg: "bg-green-500/10",
        },
        {
            title: "Pending Payment",
            value: totalPending,
            sub: "Outstanding",
            detail: `Exp: ~$${Math.round(expectedCashPipeline).toLocaleString()}`,
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            title: "Commissions",
            value: totalCommissions,
            sub: "Affiliate Payouts (Est)",
            icon: HandCoins,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Actual Profit",
            value: totalProfit,
            sub: "Net Income",
            detail: `/ $${projectedProfit.toLocaleString()} Proj.`,
            icon: TrendingUp,
            color: "text-luxury-gold",
            bg: "bg-luxury-gold/10",
            highlight: true
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
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
                </motion.div>
            ))}
        </div>
    );
}
