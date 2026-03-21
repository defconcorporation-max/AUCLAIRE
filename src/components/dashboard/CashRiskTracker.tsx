import { Project } from '@/services/apiProjects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface RiskProject {
    project: Project;
    committed: number;
    deposited: number;
    deficit: number;
}

interface CashRiskTrackerProps {
    highRiskProjects: RiskProject[];
}

export function CashRiskTracker({ highRiskProjects }: CashRiskTrackerProps) {
    const { t } = useTranslation();
    return (
        <Card className="glass-card border-l-4 border-l-red-500/50 overflow-hidden relative">
            <CardHeader className="py-4 border-b border-white/5">
                <CardTitle className="text-lg font-serif tracking-wide flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    {t('dashboard.cashRiskTitle')}
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-red-500/70 font-medium">{t('dashboard.cashRiskDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {highRiskProjects.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="w-10 h-10 text-green-500 mb-2 opacity-30" />
                        <p className="text-xs uppercase tracking-widest text-green-500/70 font-bold">{t('dashboard.cashRiskZero')}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{t('dashboard.cashRiskZeroSub')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {highRiskProjects.map((risk, idx) => (
                            <div
                                key={risk.project.id}
                                className="p-4 hover:bg-red-500/5 transition-all group relative border-l-2 border-transparent hover:border-red-500/50 animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-serif text-sm truncate group-hover:text-red-500 transition-colors">{risk.project.title}</h4>
                                            <Badge variant="outline" className="text-[8px] h-4 px-1 uppercase border-red-500/30 text-red-500">{risk.project.status.replace('_', ' ')}</Badge>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">{t('dashboard.cashRiskCommitted')}</span>
                                                <span className="text-[10px] font-bold tabular-nums">${risk.committed.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">{t('dashboard.cashRiskDeposited')}</span>
                                                <span className="text-[10px] font-bold tabular-nums text-green-500">${risk.deposited.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-serif font-bold text-red-500">-${risk.deficit.toLocaleString()}</p>
                                            <p className="text-[8px] uppercase tracking-widest font-black text-red-500/70">{t('dashboard.cashRiskDeficitLabel')}</p>
                                        </div>
                                        <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-500/20 text-[10px] uppercase font-bold" asChild>
                                            <Link to={`/dashboard/projects/${risk.project.id}`}>
                                                {t('dashboard.cashRiskResolve')} <ChevronRight className="w-3 h-3 ml-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
