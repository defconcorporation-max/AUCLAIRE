import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMarketing, MarketingExecutionLog } from '@/services/apiMarketing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    ChevronLeft, 
    CheckCircle2, 
    Calendar, 
    Zap, 
    Facebook, 
    Instagram, 
    Music, 
    Target, 
    BarChart3, 
    Users, 
    ShoppingBag, 
    Sparkles,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface TaskDef {
    id: string;
    title: string;
    description: string;
    icon: any;
    frequency: 'daily' | 'weekly';
    platform?: string;
}

const TASKS: TaskDef[] = [
    // Daily
    { id: 'fb_invites', title: 'Facebook Invites', description: 'Meta Business Suite > Invitations > Inviter les interactions récentes', icon: Facebook, frequency: 'daily', platform: 'Meta' },
    { id: 'fb_comments', title: 'Réponses Facebook', description: 'Répondre aux nouveaux commentaires et messages', icon: Facebook, frequency: 'daily', platform: 'Meta' },
    { id: 'meta_challenge', title: 'Meta Challenge', description: 'Vérifier la progression des challenges Meta Suite', icon: Target, frequency: 'daily', platform: 'Meta' },
    { id: 'heat_up_social', title: 'Heat-up IG/FB', description: 'Interagir avec la communauté et les influenceurs (likes/comments)', icon: Instagram, frequency: 'daily', platform: 'Instagram' },
    { id: 'tiktok_heat', title: 'TikTok Heat-up', description: 'Scroller et interagir sur TikTok / répondre aux commentaires', icon: Music, frequency: 'daily', platform: 'TikTok' },
    { id: 'ads_check', title: 'Check Ads (Budget)', description: 'Vérifier que le coût par conversation est idéalement < 10$', icon: Target, frequency: 'daily', platform: 'Ads' },
    
    // Weekly
    { id: 'social_analytics', title: 'Social Analytics', description: 'Faire le tour des analytics pour voir quelle plateforme performe', icon: BarChart3, frequency: 'weekly' },
    { id: 'influence_outreach', title: 'Influence Outreach', description: 'Contacter de nouveaux influenceurs / suivi des relances', icon: Users, frequency: 'weekly' },
    { id: 'marketplace_sync', title: 'Marketplace & Etsy', description: 'Lister les nouveaux produits / rafraîchir les annonces', icon: ShoppingBag, frequency: 'weekly' },
    { id: 'marketing_brainstorm', title: 'Brainstorm Idées', description: 'Trouver de nouvelles idées de contenu ou promos', icon: Sparkles, frequency: 'weekly' },
];

export default function MarketingExecution() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const dfLocale = i18n.language.startsWith('en') ? enUS : fr;
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['marketing-execution', today],
        queryFn: () => apiMarketing.getExecutionLogs(today),
    });

    const mutation = useMutation({
        mutationFn: (log: Partial<MarketingExecutionLog>) => apiMarketing.logTaskExecution(log),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketing-execution', today] });
        },
    });

    const handleToggleTask = (taskId: string) => {
        const existing = logs.find(l => l.task_id === taskId);
        if (!existing) {
            mutation.mutate({
                date: today,
                task_id: taskId,
                status: 'completed'
            });
        }
    };

    const dailyTasks = TASKS.filter(t2 => t2.frequency === 'daily');
    const weeklyTasks = TASKS.filter(t2 => t2.frequency === 'weekly');

    const completedDaily = dailyTasks.filter(t2 => logs.some(l => l.task_id === t2.id)).length;
    const dailyProgress = Math.round((completedDaily / dailyTasks.length) * 100);

    if (isLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-luxury-gold" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
            {/* Header */}
            <div>
                <button onClick={() => navigate('/dashboard/marketing')} className="text-xs text-muted-foreground hover:text-luxury-gold flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-3 h-3" /> {t('marketing.backToHub')}
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-luxury-gold flex items-center gap-3">
                            <Zap className="w-7 h-7 fill-luxury-gold" /> {t('marketing.execution.title', 'Centre d\'Exécution')}
                        </h2>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" /> {format(new Date(), 'PPPP', { locale: dfLocale })}
                        </p>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 border border-luxury-gold/20 p-4 rounded-2xl min-w-[200px]">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('marketing.execution.dailyGoal', 'Objectif du jour')}</span>
                            <span className="text-lg font-serif font-bold text-luxury-gold">{dailyProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-luxury-gold/10 rounded-full overflow-hidden">
                            <div className="h-full bg-luxury-gold transition-all duration-500" style={{ width: `${dailyProgress}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-right">
                            {completedDaily} / {dailyTasks.length} {t('marketing.execution.tasksDone', 'tâches complétées')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* DAILY TASKS */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-8 bg-luxury-gold rounded-full" />
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">{t('marketing.execution.dailyRoutine', 'Routine Quotidienne')}</h3>
                    </div>
                    
                    <div className="grid gap-3">
                        {dailyTasks.map((task) => {
                            const isDone = logs.some(l => l.task_id === task.id);
                            return (
                                <Card 
                                    key={task.id} 
                                    className={`border-none ring-1 transition-all duration-300 ${
                                        isDone 
                                        ? 'bg-emerald-500/[0.03] ring-emerald-500/20 shadow-none opacity-60' 
                                        : 'bg-card ring-black/5 dark:ring-white/10 hover:ring-luxury-gold/30 hover:shadow-lg'
                                    }`}
                                    onClick={() => handleToggleTask(task.id)}
                                >
                                    <div className="p-4 flex items-center gap-4">
                                        <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
                                            isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-luxury-gold/10 text-luxury-gold'
                                        }`}>
                                            <task.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-medium ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</h4>
                                                {task.platform && (
                                                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-black/5">{task.platform}</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-luxury-gold/50'
                                            }`}>
                                                {isDone && <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* WEEKLY / OTHER */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 w-8 bg-luxury-gold/50 rounded-full" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">{t('marketing.execution.weeklyFocus', 'Focus Hebdomadaire')}</h3>
                        </div>

                        <div className="grid gap-3">
                            {weeklyTasks.map((task) => {
                                const isDone = logs.some(l => l.task_id === task.id);
                                return (
                                    <Card 
                                        key={task.id} 
                                        className={`border-none ring-1 transition-all duration-300 cursor-pointer ${
                                            isDone 
                                            ? 'bg-emerald-500/[0.03] ring-emerald-500/20 opacity-60' 
                                            : 'bg-zinc-500/[0.03] ring-black/5 dark:ring-white/10'
                                        }`}
                                        onClick={() => handleToggleTask(task.id)}
                                    >
                                        <div className="p-3 flex items-center gap-3">
                                            <div className={`p-2 rounded-lg shrink-0 ${
                                                isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                                            }`}>
                                                <task.icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-xs font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</h4>
                                            </div>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                                isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-700'
                                            }`}>
                                                {isDone && <CheckCircle2 className="w-3 h-3" />}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    <Card className="border-none ring-1 ring-luxury-gold/20 bg-gradient-to-br from-luxury-gold/10 to-transparent">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-serif">{t('marketing.execution.motivationTitle', 'Rappel Excellence')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-xs text-muted-foreground italic">
                                "La constance bat l'intensité. Chaque invitation, chaque commentaire construit la notoriété de Maison Auclaire."
                            </p>
                        </CardContent>
                    </Card>
                </div>

            </div>

            {/* Bottom Report Summary */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background/80 backdrop-blur-md border-t border-black/5 dark:border-white/5 p-4 z-40">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {logs.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-[10px] text-white font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                            ))}
                            {logs.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                                    +{logs.length - 3}
                                </div>
                            )}
                        </div>
                        <p className="text-xs font-medium">
                            {logs.length} {t('marketing.execution.completedToday', 'actions réalisées aujourd\'hui')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
