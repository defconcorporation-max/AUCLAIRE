import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFeedback, FeedbackEntry } from '@/services/apiFeedback';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, ExternalLink, Trash2, CheckCircle2, Circle, Clock, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { toast } from '@/components/ui/use-toast';

export default function BetaFeedback() {
    const queryClient = useQueryClient();
    const { data: feedbackItems, isLoading } = useQuery<FeedbackEntry[]>({
        queryKey: ['beta-feedback'],
        queryFn: () => apiFeedback.getAll()
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});

    const handleDelete = async (id: string) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce feedback ?')) return;
        try {
            await apiFeedback.delete(id);
            toast({ title: "Supprimé", description: "Le feedback a été retiré." });
            queryClient.invalidateQueries({ queryKey: ['beta-feedback'] });
        } catch (error) {
            toast({ title: "Erreur", description: "Échec de la suppression.", variant: "destructive" });
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: FeedbackEntry['status']) => {
        let newStatus: FeedbackEntry['status'] = 'pending';
        if (currentStatus === 'pending') newStatus = 'in_review';
        else if (currentStatus === 'in_review') newStatus = 'done';
        else newStatus = 'pending';

        try {
            await apiFeedback.updateStatus(id, newStatus);
            toast({ title: "Statut mis à jour", description: `Feedback marqué comme ${newStatus}.` });
            queryClient.invalidateQueries({ queryKey: ['beta-feedback'] });
        } catch (error) {
            toast({ title: "Erreur", description: "Échec de la mise à jour du statut.", variant: "destructive" });
        }
    };

    const handleAddComment = async (id: string, existingComments: any[]) => {
        const text = newCommentText[id];
        if (!text?.trim()) return;

        try {
            await apiFeedback.addComment(id, {
                user: 'Admin',
                text: text.trim(),
                date: new Date().toISOString()
            }, existingComments || []);
            
            setNewCommentText(prev => ({ ...prev, [id]: '' }));
            toast({ title: "Commentaire ajouté", description: "Votre message a été enregistré." });
            queryClient.invalidateQueries({ queryKey: ['beta-feedback'] });
        } catch (error) {
            toast({ title: "Erreur", description: "Échec de l'ajout du commentaire.", variant: "destructive" });
        }
    };

    if (isLoading) return <div className="p-8 text-center text-luxury-gold font-bold">CHARGEMENT DES FEEDBACKS (v3.8.5)...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-black dark:text-white">Feedback Beta & Support</h1>
                    <p className="text-gray-500 mt-1 uppercase text-xs tracking-widest font-bold">Mode Collaboration Activé (v3.8.5)</p>
                </div>
                <div className="bg-luxury-gold/10 px-4 py-2 rounded-full border border-luxury-gold/20 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-luxury-gold" />
                    <span className="text-sm font-medium text-luxury-gold">{feedbackItems?.length || 0} rapports</span>
                </div>
            </div>

            <Card className="border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50">
                            <TableHead className="w-[180px]">Date</TableHead>
                            <TableHead className="w-[150px]">Utilisateur</TableHead>
                            <TableHead className="w-[200px]">Page</TableHead>
                            <TableHead>Commentaire</TableHead>
                            <TableHead className="w-[120px]">Statut</TableHead>
                            <TableHead className="w-[120px]">Captures</TableHead>
                            <TableHead className="w-[60px] text-right"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!feedbackItems || feedbackItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                    Aucun feedback pour le moment.
                                </TableCell>
                            </TableRow>
                        ) : (
                            feedbackItems.map((item) => (
                                <React.Fragment key={item.id}>
                                    <TableRow 
                                        className={`
                                            border-black/5 dark:border-white/5 group transition-colors
                                            ${item.status === 'in_review' 
                                                ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                                                : item.status === 'done'
                                                    ? 'bg-green-50/30 dark:bg-green-900/5 hover:bg-green-50/50 dark:hover:bg-green-900/10'
                                                    : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}
                                        `}
                                    >
                                        <TableCell className="font-mono text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-luxury-gold/50" />
                                                {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-luxury-gold/20 flex items-center justify-center text-[10px] text-luxury-gold font-bold">
                                                    {item.user_name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <span className="text-sm font-medium">{item.user_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 max-w-[200px]">
                                                <span className="text-xs truncate text-gray-500" title={item.page_url}>
                                                    {item.page_url ? new URL(item.page_url).pathname : '/'}
                                                </span>
                                                <a 
                                                    href={item.page_url} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="text-[10px] text-luxury-gold hover:underline flex items-center gap-0.5"
                                                >
                                                    Ouvrir <ExternalLink className="w-2 h-2" />
                                                </a>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed max-w-md">
                                                {item.comment}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className={`
                                                        gap-2 text-[10px] uppercase font-bold tracking-widest px-3 py-1 h-auto rounded-full justify-start w-fit border border-black/5 dark:border-white/5
                                                        ${item.status === 'in_review'
                                                            ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                                                            : item.status === 'done'
                                                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                                                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}
                                                    `}
                                                    onClick={() => handleToggleStatus(item.id, item.status)}
                                                >
                                                    {item.status === 'in_review' ? (
                                                        <><Clock className="w-3 h-3" /> Review</>
                                                    ) : item.status === 'done' ? (
                                                        <><CheckCircle2 className="w-3 h-3" /> Done</>
                                                    ) : (
                                                        <><Circle className="w-3 h-3" /> Todo</>
                                                    )}
                                                </Button>
                                                
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[10px] text-luxury-gold font-bold hover:bg-luxury-gold/10 gap-1 h-auto px-2 py-1 justify-start rounded"
                                                    onClick={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                >
                                                    {expandedComments[item.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    {item.comments?.length || 0} COMM.
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.screenshots && item.screenshots.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.screenshots.map((url, i) => (
                                                        <button 
                                                            key={i} 
                                                            onClick={() => setPreviewImage(url)}
                                                            className="w-10 h-10 rounded border border-black/10 overflow-hidden hover:opacity-80 transition-opacity"
                                                        >
                                                            <img src={url} alt="Capture" className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                className="h-8 w-8 rounded-full p-2"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>

                                    {expandedComments[item.id] && (
                                        <TableRow className="bg-black/[0.01] dark:bg-white/[0.01] border-black/5 dark:border-white/5">
                                            <TableCell colSpan={7} className="py-4 px-6">
                                                <div className="space-y-4 max-w-2xl mx-auto p-4 bg-zinc-50 dark:bg-zinc-900 ring-1 ring-black/5 rounded-lg shadow-inner">
                                                    <div className="space-y-3">
                                                        {item.comments && item.comments.length > 0 ? (
                                                            item.comments.map((c, idx) => (
                                                                <div key={idx} className="flex flex-col gap-1 p-3 rounded bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 shadow-sm">
                                                                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                                                                        <span className="font-bold text-luxury-gold">{c.user}</span>
                                                                        <span>{format(new Date(c.date), 'MMM d, h:mm a')}</span>
                                                                    </div>
                                                                    <p className="text-sm">{c.text}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-center text-xs text-gray-400 py-2">Aucun commentaire. Commencez la discussion !</p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text"
                                                            placeholder="Écrire un message..."
                                                            className="flex-1 bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-luxury-gold/50 shadow-sm"
                                                            value={newCommentText[item.id] || ''}
                                                            onChange={(e) => setNewCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item.id, item.comments || [])}
                                                        />
                                                        <Button 
                                                            size="sm" 
                                                            className="bg-luxury-gold text-black hover:bg-luxury-gold/80 h-9 px-3 font-bold"
                                                            onClick={() => handleAddComment(item.id, item.comments || [])}
                                                        >
                                                            <Send className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <ImagePreviewModal 
                isOpen={!!previewImage} 
                onClose={() => setPreviewImage(null)} 
                imageUrl={previewImage || ''} 
            />
        </div>
    );
}
