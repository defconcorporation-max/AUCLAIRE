import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { apiChats } from '@/services/apiChats';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectChat } from '@/components/project/ProjectChat';
import { Loader2, MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const getLastRead = (projectId: string) => {
    const stored = localStorage.getItem(`msg-read-${projectId}`);
    return stored ? new Date(stored) : new Date(0);
};

const markAsRead = (projectId: string) => {
    localStorage.setItem(`msg-read-${projectId}`, new Date().toISOString());
};

export default function MessageCenter() {
    const { t } = useTranslation();
    const statusLabel = (s: string | undefined) =>
        s ? t(`projectStatus.${s}`, { defaultValue: s.replace(/_/g, ' ') }) : '';
    const { profile, role } = useAuth();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const { data: latestMessages = {} } = useQuery({
        queryKey: ['chats-latest'],
        queryFn: apiChats.getLatestPerProject,
        refetchInterval: 15000,
    });

    useEffect(() => {
        if (selectedProjectId) {
            markAsRead(selectedProjectId);
        }
    }, [selectedProjectId]);

    if (isLoading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-luxury-gold" /></div>;
    }

    const userProjects = (projects || []).filter(p => {
        if (role === 'admin' || role === 'secretary') return true;
        if (role === 'manufacturer') return p.manufacturer_id === profile?.id;
        if (role === 'affiliate') return p.affiliate_id === profile?.id || p.sales_agent_id === profile?.id;
        if (role === 'client') return p.client_id === profile?.id;
        return false;
    }).filter(p => p.status !== 'cancelled');

    const filteredProjects = (searchTerm
        ? userProjects.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        : userProjects
    ).sort((a, b) => {
        const aTime = latestMessages[a.id] ? new Date(latestMessages[a.id]).getTime() : 0;
        const bTime = latestMessages[b.id] ? new Date(latestMessages[b.id]).getTime() : 0;
        return bTime - aTime;
    });

    const hasUnread = (projectId: string) => {
        const latest = latestMessages[projectId];
        if (!latest) return false;
        return new Date(latest) > getLastRead(projectId);
    };

    const selectedProject = projects?.find(p => p.id === selectedProjectId);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-serif text-luxury-gold">{t('messagesPage.title')}</h1>
                <p className="text-muted-foreground mt-1">{t('messagesPage.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
                {/* Project List */}
                <Card className="glass-card overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('messagesPage.searchPlaceholder')}
                                className="pl-9 bg-white/5 border-white/10"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredProjects.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">{t('messagesPage.noProjects')}</div>
                        ) : (
                            filteredProjects.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setSelectedProjectId(p.id);
                                        markAsRead(p.id);
                                    }}
                                    className={`w-full text-left p-4 border-b border-white/5 transition-colors ${
                                        selectedProjectId === p.id ? 'bg-luxury-gold/10 border-l-2 border-l-luxury-gold' : 'hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {hasUnread(p.id) && (
                                                <span className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse shrink-0" />
                                            )}
                                            <p className="font-serif text-sm font-medium truncate">{p.title}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{statusLabel(p.status)}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.client?.full_name}</p>
                                </button>
                            ))
                        )}
                    </div>
                </Card>

                {/* Chat Area */}
                <Card className="glass-card lg:col-span-2 overflow-hidden flex flex-col">
                    {selectedProject ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-white/5 flex items-center gap-3">
                                <MessageCircle className="w-5 h-5 text-luxury-gold" />
                                <div>
                                    <h3 className="font-serif font-medium">{selectedProject.title}</h3>
                                    <p className="text-xs text-muted-foreground">{selectedProject.client?.full_name}</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <ProjectChat projectId={selectedProject.id} channel="internal" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-serif text-lg">{t('messagesPage.selectProject')}</p>
                            <p className="text-sm mt-1">{t('messagesPage.selectProjectHint')}</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
