import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiMarketing } from '@/services/apiMarketing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sparkles, Users, Map, Globe, AtSign, Megaphone, Loader2,
    ArrowRight, Lightbulb, Video, Camera, Film, BookOpen,
    CheckCircle2, Circle, Target, Calendar, TrendingUp, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const STATUS_COLORS: Record<string, string> = {
    // ideas
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    scripted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    filming: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    editing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    // collabs
    prospect: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    contacted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    negotiating: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    declined: 'bg-red-500/10 text-red-400 border-red-500/20',
    // campaigns
    idea: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    // website
    todo: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const TYPE_ICONS: Record<string, any> = {
    video: Video, photo: Camera, reel: Film, story: BookOpen, other: Lightbulb,
};

const CAMPAIGN_EMOJI: Record<string, string> = {
    collaboration: '🤝', ad: '📢', contest: '🎁', launch: '🚀', event: '🎉', other: '📋',
};

export default function MarketingHub() {
    const { t, i18n } = useTranslation();
    const dfLocale = i18n.language.startsWith('en') ? enUS : fr;
    const navigate = useNavigate();

    const { data: ideas = [], isLoading: ideasLoading } = useQuery({
        queryKey: ['marketing-ideas'], queryFn: apiMarketing.getIdeas,
    });
    const { data: collabs = [], isLoading: collabsLoading } = useQuery({
        queryKey: ['marketing-collabs'], queryFn: apiMarketing.getCollaborations,
    });
    const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
        queryKey: ['marketing-campaigns'], queryFn: apiMarketing.getCampaigns,
    });
    const { data: websiteTasks = [], isLoading: webLoading } = useQuery({
        queryKey: ['website-tasks'], queryFn: apiMarketing.getWebsiteTasks,
    });
    const { data: accounts = [], isLoading: acctLoading } = useQuery({
        queryKey: ['marketing-accounts'], queryFn: apiMarketing.getAccounts,
    });

    const isLoading = ideasLoading || collabsLoading || campaignsLoading || webLoading || acctLoading;

    // Computed data
    const recentIdeas = ideas.slice(0, 4);
    const activeCollabs = collabs.filter(c => ['contacted', 'negotiating', 'active'].includes(c.status));
    const activeCampaigns = campaigns.filter(c => ['planning', 'active'].includes(c.status));
    const pendingWebTasks = websiteTasks.filter(t2 => t2.status !== 'done');

    // KPI data
    const kpis = [
        { label: t('marketing.hub.kpiIdeas'), value: ideas.length, icon: Sparkles, gradient: 'from-amber-500/20 to-orange-500/20', color: 'text-amber-400', href: '/dashboard/marketing/creative' },
        { label: t('marketing.hub.kpiCollabs'), value: activeCollabs.length, icon: Users, gradient: 'from-pink-500/20 to-purple-500/20', color: 'text-pink-400', href: '/dashboard/marketing/collaborations' },
        { label: t('marketing.hub.kpiCampaigns'), value: activeCampaigns.length, icon: Target, gradient: 'from-emerald-500/20 to-teal-500/20', color: 'text-emerald-400', href: '/dashboard/marketing/roadmap' },
        { label: t('marketing.hub.kpiWebTasks'), value: pendingWebTasks.length, icon: Globe, gradient: 'from-blue-500/20 to-cyan-500/20', color: 'text-blue-400', href: '/dashboard/marketing/website' },
        { label: t('marketing.hub.kpiAccounts'), value: accounts.length, icon: AtSign, gradient: 'from-violet-500/20 to-indigo-500/20', color: 'text-violet-400', href: '/dashboard/marketing/accounts' },
    ];

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-luxury-gold tracking-wide flex items-center gap-3">
                        <Megaphone className="w-7 h-7" /> {t('marketing.hub.title')}
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">{t('marketing.hub.subtitle')}</p>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {kpis.map((kpi, i) => (
                    <Card
                        key={i}
                        onClick={() => navigate(kpi.href)}
                        className="group cursor-pointer border-none ring-1 ring-black/5 dark:ring-white/5 hover:ring-luxury-gold/30 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-20 group-hover:opacity-40 transition-opacity`} />
                        <CardContent className="p-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
                                    <p className={`text-3xl font-serif font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
                                </div>
                                <kpi.icon className={`w-6 h-6 ${kpi.color} opacity-40`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Grid — 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── LEFT COLUMN ── */}
                <div className="space-y-6">

                    {/* Recent Ideas */}
                    <Card className="border-none ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between p-5 pb-0">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-luxury-gold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> {t('marketing.hub.recentIdeas')}
                                </h3>
                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-luxury-gold" onClick={() => navigate('/dashboard/marketing/creative')}>
                                    {t('marketing.hub.seeAll')} <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                            {recentIdeas.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Lightbulb className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">{t('marketing.hub.noIdeasYet')}</p>
                                    <Button variant="ghost" size="sm" className="mt-2 text-luxury-gold text-xs" onClick={() => navigate('/dashboard/marketing/creative')}>
                                        <Plus className="w-3 h-3 mr-1" /> {t('marketing.creative.newIdea')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                    {recentIdeas.map(idea => {
                                        const Icon = TYPE_ICONS[idea.type] || Lightbulb;
                                        return (
                                            <div key={idea.id} onClick={() => navigate('/dashboard/marketing/creative')}
                                                className="flex items-center gap-3 p-4 hover:bg-luxury-gold/5 cursor-pointer transition-colors">
                                                <div className="w-9 h-9 rounded-lg bg-luxury-gold/10 flex items-center justify-center shrink-0">
                                                    <Icon className="w-4 h-4 text-luxury-gold" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{idea.title}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase">{t(`marketing.creative.type_${idea.type}`)}</p>
                                                </div>
                                                <Badge variant="outline" className={`text-[9px] shrink-0 ${STATUS_COLORS[idea.status]}`}>{t(`marketing.creative.status_${idea.status}`)}</Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Collaborations */}
                    <Card className="border-none ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between p-5 pb-0">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-pink-400 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> {t('marketing.hub.activeCollabs')}
                                </h3>
                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-luxury-gold" onClick={() => navigate('/dashboard/marketing/collaborations')}>
                                    {t('marketing.hub.seeAll')} <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                            {activeCollabs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">{t('marketing.hub.noCollabsYet')}</p>
                                    <Button variant="ghost" size="sm" className="mt-2 text-luxury-gold text-xs" onClick={() => navigate('/dashboard/marketing/collaborations')}>
                                        <Plus className="w-3 h-3 mr-1" /> {t('marketing.collabs.addCollab')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                    {activeCollabs.slice(0, 5).map(collab => (
                                        <div key={collab.id} onClick={() => navigate('/dashboard/marketing/collaborations')}
                                            className="flex items-center gap-3 p-4 hover:bg-pink-500/5 cursor-pointer transition-colors">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20 flex items-center justify-center text-pink-400 font-serif text-sm shrink-0">
                                                {collab.name?.[0] || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{collab.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase">{t(`marketing.collabs.type_${collab.type}`)}</p>
                                            </div>
                                            <Badge variant="outline" className={`text-[9px] shrink-0 ${STATUS_COLORS[collab.status]}`}>{t(`marketing.collabs.status_${collab.status}`)}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Social Accounts Preview */}
                    <Card className="border-none ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between p-5 pb-0">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-violet-400 flex items-center gap-2">
                                    <AtSign className="w-4 h-4" /> {t('marketing.hub.accountsTitle')}
                                </h3>
                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-luxury-gold" onClick={() => navigate('/dashboard/marketing/accounts')}>
                                    {t('marketing.hub.seeAll')} <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                            {accounts.length === 0 ? (
                                <div className="p-8 text-center">
                                    <AtSign className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">{t('marketing.hub.noAccountsYet')}</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 p-5 pt-3">
                                    {accounts.map(acct => (
                                        <div key={acct.id} className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg px-3 py-1.5 text-xs">
                                            <span className="font-bold capitalize text-violet-400">{acct.platform}</span>
                                            <span className="text-muted-foreground">@{acct.username}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="space-y-6">

                    {/* Active Campaigns */}
                    <Card className="border-none ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between p-5 pb-0">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                    <Map className="w-4 h-4" /> {t('marketing.hub.activeCampaigns')}
                                </h3>
                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-luxury-gold" onClick={() => navigate('/dashboard/marketing/roadmap')}>
                                    {t('marketing.hub.seeAll')} <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                            {activeCampaigns.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Target className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">{t('marketing.hub.noCampaignsYet')}</p>
                                    <Button variant="ghost" size="sm" className="mt-2 text-luxury-gold text-xs" onClick={() => navigate('/dashboard/marketing/roadmap')}>
                                        <Plus className="w-3 h-3 mr-1" /> {t('marketing.roadmap.newCampaign')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                    {activeCampaigns.map(campaign => {
                                        const tasksDone = (campaign.tasks || []).filter(t2 => t2.done).length;
                                        const tasksTotal = (campaign.tasks || []).length;
                                        const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
                                        return (
                                            <div key={campaign.id} onClick={() => navigate('/dashboard/marketing/roadmap')}
                                                className="p-4 hover:bg-emerald-500/5 cursor-pointer transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-xl">{CAMPAIGN_EMOJI[campaign.type] || '📋'}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-medium text-foreground truncate">{campaign.name}</p>
                                                            <Badge variant="outline" className={`text-[9px] shrink-0 ml-2 ${STATUS_COLORS[campaign.status]}`}>{t(`marketing.roadmap.status_${campaign.status}`)}</Badge>
                                                        </div>
                                                        {campaign.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{campaign.description}</p>}
                                                        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                                                            {campaign.start_date && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" /> {format(new Date(campaign.start_date), 'PP', { locale: dfLocale })}
                                                                </span>
                                                            )}
                                                            {tasksTotal > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" /> {tasksDone}/{tasksTotal}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {tasksTotal > 0 && (
                                                            <div className="mt-2 w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                                                                    style={{ width: `${progress}%` }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Website Tasks Mini-Kanban */}
                    <Card className="border-none ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between p-5 pb-0">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> {t('marketing.hub.websiteTitle')}
                                </h3>
                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-luxury-gold" onClick={() => navigate('/dashboard/marketing/website')}>
                                    {t('marketing.hub.seeAll')} <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                            {websiteTasks.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Globe className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">{t('marketing.hub.noWebTasksYet')}</p>
                                </div>
                            ) : (
                                <div className="p-5 pt-3">
                                    {/* Mini status bar */}
                                    <div className="flex gap-1 mb-4">
                                        {['todo', 'in_progress', 'review', 'done'].map(status => {
                                            const count = websiteTasks.filter(t2 => t2.status === status).length;
                                            const pct = websiteTasks.length > 0 ? (count / websiteTasks.length) * 100 : 0;
                                            const colors: Record<string, string> = {
                                                todo: 'bg-gray-400', in_progress: 'bg-blue-400', review: 'bg-amber-400', done: 'bg-emerald-400'
                                            };
                                            return pct > 0 ? (
                                                <div key={status} className={`h-2 rounded-full ${colors[status]} transition-all`} style={{ width: `${pct}%` }}
                                                    title={`${t(`marketing.website.col_${status}`)}: ${count}`} />
                                            ) : null;
                                        })}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center mb-4">
                                        {['todo', 'in_progress', 'review', 'done'].map(status => {
                                            const count = websiteTasks.filter(t2 => t2.status === status).length;
                                            return (
                                                <div key={status}>
                                                    <p className="text-lg font-serif font-bold text-foreground">{count}</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{t(`marketing.website.col_${status}`)}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Top pending tasks */}
                                    <div className="space-y-1.5">
                                        {pendingWebTasks.slice(0, 4).map(task => (
                                            <div key={task.id} className="flex items-center gap-2 text-xs">
                                                {task.status === 'done'
                                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                    : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                                                }
                                                <span className="truncate text-muted-foreground">{task.title}</span>
                                                <Badge variant="outline" className={`text-[8px] ml-auto shrink-0 ${STATUS_COLORS[task.status]}`}>{t(`marketing.website.col_${task.status}`)}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pipeline Summary — all campaigns by status */}
                    <Card className="border-none ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        <CardContent className="p-5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-luxury-gold flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4" /> {t('marketing.hub.pipelineTitle')}
                            </h3>
                            <div className="space-y-3">
                                {['idea', 'planning', 'active', 'paused', 'completed'].map(status => {
                                    const count = campaigns.filter(c => c.status === status).length;
                                    const pct = campaigns.length > 0 ? (count / campaigns.length) * 100 : 0;
                                    const barColors: Record<string, string> = {
                                        idea: 'bg-gray-400', planning: 'bg-blue-400', active: 'bg-emerald-400', paused: 'bg-amber-400', completed: 'bg-purple-400',
                                    };
                                    return (
                                        <div key={status} className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 text-right shrink-0">
                                                {t(`marketing.roadmap.status_${status}`)}
                                            </span>
                                            <div className="flex-1 h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full ${barColors[status]} rounded-full transition-all duration-700`}
                                                    style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground w-6 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
