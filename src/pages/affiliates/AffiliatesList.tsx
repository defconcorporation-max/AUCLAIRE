import { useQuery } from '@tanstack/react-query';
import { apiAffiliates } from '@/services/apiAffiliates';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, ChevronRight } from 'lucide-react';

export default function AffiliatesList() {
    const navigate = useNavigate();
    const { data: affiliates, isLoading } = useQuery({
        queryKey: ['affiliates-stats'],
        queryFn: apiAffiliates.getAllAffiliatesWithStats
    });

    if (isLoading) return <div className="p-8 text-center">Loading ambassador data...</div>;

    const totalPending = affiliates?.reduce((sum, a) => sum + a.stats.commissionPending, 0) || 0;

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif text-luxury-gold">Ambassadors & Affiliates</h1>
                    <p className="text-muted-foreground mt-1">Track partner performance and commission payouts.</p>
                </div>
                {totalPending > 0 && (
                    <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-lg border border-amber-500/20 flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span className="font-bold">Total Pending: ${totalPending.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <div className="grid gap-4">
                {affiliates?.length === 0 ? (
                    <Card className="bg-zinc-50/50 dark:bg-zinc-900/50 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <Users size={48} className="mb-4 opacity-20" />
                            <p>No ambassadors found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    affiliates?.map((affiliate) => (
                        <Card
                            key={affiliate.id}
                            className="bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer group"
                            onClick={() => navigate(`/dashboard/affiliates/${affiliate.id}`)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-luxury-gold/10 text-luxury-gold flex items-center justify-center font-serif text-xl font-bold">
                                            {affiliate.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{affiliate.full_name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Badge variant="secondary" className="text-xs bg-zinc-100 dark:bg-zinc-800">
                                                    {affiliate.role}
                                                </Badge>
                                                <span>• {affiliate.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden md:block">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Sales</div>
                                            <div className="font-bold text-zinc-700 dark:text-zinc-300">
                                                ${affiliate.stats.totalSales.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Earned</div>
                                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                                ${affiliate.stats.commissionEarned.toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="text-right min-w-[100px]">
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending Payout</div>
                                            <div className={`font-bold text-xl ${affiliate.stats.commissionPending > 0 ? 'text-amber-500' : 'text-zinc-400'}`}>
                                                ${affiliate.stats.commissionPending.toLocaleString()}
                                            </div>
                                        </div>

                                        <ChevronRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
