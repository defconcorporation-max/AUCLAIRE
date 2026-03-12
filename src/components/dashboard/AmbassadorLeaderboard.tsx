import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface SellerStat {
    id: string;
    name: string;
    volume: number;
    projectCount: number;
    marginPercent: number;
}

interface AmbassadorLeaderboardProps {
    leaderboard: SellerStat[];
}

export function AmbassadorLeaderboard({ leaderboard }: AmbassadorLeaderboardProps) {
    const topThreeColors = [
        "from-amber-400 to-yellow-600 shadow-amber-500/20",
        "from-gray-300 to-gray-500 shadow-gray-400/20",
        "from-amber-700 to-amber-900 shadow-amber-800/20",
    ];

    return (
        <Card className="glass-card overflow-hidden relative">
            <CardHeader className="py-4 border-b border-white/5">
                <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Classement Ambassadeurs
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest">Performance & Rentabilité</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                    {leaderboard.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <p className="text-xs uppercase tracking-widest">Aucune vente enregistrée</p>
                        </div>
                    ) : (
                        leaderboard.slice(0, 6).map((seller, idx) => (
                            <div
                                key={seller.id}
                                className="group flex items-center gap-4 p-4 hover:bg-white/5 transition-all animate-in fade-in slide-in-from-right-2"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="relative flex-shrink-0">
                                    {idx < 3 ? (
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shadow-lg ${topThreeColors[idx]}`}>
                                            {idx + 1}
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                            {idx + 1}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-serif text-sm truncate capitalize group-hover:text-luxury-gold transition-colors">{seller.name}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                            {seller.projectCount} Projets
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <span className="text-[10px] text-green-500 font-bold tabular-nums">
                                            ${seller.volume.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold min-w-[50px] text-center shadow-inner transition-colors ${
                                        seller.marginPercent > 30 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                        seller.marginPercent > 15 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                        seller.marginPercent > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                        {Math.round(seller.marginPercent)}%
                                        <span className="block text-[8px] opacity-70 font-medium uppercase tracking-tighter mt-0.5">Marge</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {leaderboard.length > 6 && (
                    <div className="p-3 bg-black/5 dark:bg-black/20 text-center">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground">Et {leaderboard.length - 6} autres ambassadeurs</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
