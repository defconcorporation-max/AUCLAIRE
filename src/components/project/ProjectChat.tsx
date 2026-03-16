import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiChats } from '@/services/apiChats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ShieldCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface ProjectChatProps {
    projectId: string;
    channel: 'internal' | 'client';
}

export const ProjectChat: React.FC<ProjectChatProps> = ({ projectId, channel }) => {
    const { user, profile, role } = useAuth();
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chats', projectId, channel],
        queryFn: () => apiChats.getByProject(projectId, channel),
        refetchInterval: 5000, // Poll every 5s for simple real-time
    });

    const mutation = useMutation({
        mutationFn: (text: string) => apiChats.send({
            project_id: projectId,
            sender_id: user?.id || '',
            sender_name: profile?.full_name || 'Utilisateur',
            sender_role: role || 'guest',
            message: text,
            channel: channel
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats', projectId, channel] });
            setNewMessage('');
        }
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            mutation.mutate(newMessage);
        }
    };

    if (isLoading) return <div className="p-4 text-center text-muted-foreground">Chargement des messages...</div>;

    return (
        <div className="flex flex-col h-[500px]">
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-luxury-gold/10"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                        <Send className="w-8 h-8" />
                        <p className="text-sm italic">Aucun message dans ce canal.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                            <div 
                                key={msg.id} 
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {msg.sender_name} 
                                        {msg.sender_role === 'admin' && <ShieldCheck className="w-3 h-3 inline ml-1 text-luxury-gold" />}
                                    </span>
                                    <span className="text-[9px] text-zinc-400">
                                        {format(new Date(msg.created_at), 'HH:mm')}
                                    </span>
                                </div>
                                <div 
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                        isMe 
                                        ? 'bg-luxury-gold text-black rounded-tr-none' 
                                        : 'bg-white/5 dark:bg-zinc-800 border border-white/10 rounded-tl-none'
                                    }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t bg-black/5 dark:bg-black/20 flex gap-2">
                <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message pour le canal ${channel === 'internal' ? 'INTERNE' : 'CLIENT'}...`}
                    className="flex-1 bg-white/5 border-white/10"
                />
                <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || mutation.isPending}
                    className="bg-luxury-gold hover:bg-luxury-gold/90 text-black"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
};
