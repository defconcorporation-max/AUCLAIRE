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
        if (!confirm('Are you sure you want to delete this feedback?')) return;
        try {
            await apiFeedback.delete(id);
            toast({ title: "Deleted", description: "Feedback report removed." });
            queryClient.invalidateQueries({ queryKey: ['beta-feedback'] });
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete feedback.", variant: "destructive" });
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: FeedbackEntry['status']) => {
        let newStatus: FeedbackEntry['status'] = 'pending';
        if (currentStatus === 'pending') newStatus = 'in_review';
        else if (currentStatus === 'in_review') newStatus = 'done';
        else newStatus = 'pending';

        try {
            await apiFeedback.updateStatus(id, newStatus);
            toast({ title: "Status Updated", description: `Feedback marked as ${newStatus}.` });
            queryClient.invalidateQueries({ queryKey: ['beta-feedback'] });
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
        }
    };

    const handleAddComment = async (id: string, existingComments: any[]) => {
        const text = newCommentText[id];
        if (!text?.trim()) return;

        try {
            await apiFeedback.addComment(id, {
                user: 'Admin', // In a real app, this would be the logged-in user
                text: text.trim(),
                date: new Date().toISOString()
            }, existingComments);
            
            setNewCommentText(prev => ({ ...prev, [id]: '' }));
            toast({ title: "Comment Added", description: "Your message has been saved." });
            queryClient.invalidateQueries({ queryKey: ['beta-feedback'] });
        } catch (error) {
            toast({ title: "Error", description: "Failed to add comment.", variant: "destructive" });
        }
    };

    if (isLoading) return <div className="p-8 text-center text-luxury-gold">Loading feedback...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-black dark:text-white">Beta Testing Feedback</h1>
                    <p className="text-gray-500 mt-1">Review feedback and bug reports from users.</p>
                </div>
                <div className="bg-luxury-gold/10 px-4 py-2 rounded-full border border-luxury-gold/20 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-luxury-gold" />
                    <span className="text-sm font-medium text-luxury-gold">{feedbackItems?.length || 0} Reports</span>
                </div>
            </div>

            <Card className="border-black/5 dark:border-white/5">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-black/5 dark:border-white/5">
                            <TableHead className="w-[180px]">Date</TableHead>
                            <TableHead className="w-[150px]">User</TableHead>
                            <TableHead className="w-[200px]">Page Context</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead className="w-[100px]">Status</TableHead>
                            <TableHead className="w-[120px]">Screenshots</TableHead>
                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!feedbackItems || feedbackItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                    No feedback reports yet.
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
                                                {item.user_name[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium">{item.user_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 max-w-[200px]">
                                            <span className="text-xs truncate text-gray-500" title={item.page_url}>
                                                {new URL(item.page_url).pathname}
                                            </span>
                                            <a 
                                                href={item.page_url} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-[10px] text-luxury-gold hover:underline flex items-center gap-0.5"
                                            >
                                                View Page <ExternalLink className="w-2 h-2" />
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
                                                variant="ghost"
                                                size="sm"
                                                className={`
                                                    gap-2 text-[10px] uppercase font-bold tracking-widest px-2 py-1 h-auto rounded-full justify-start w-fit
                                                    ${item.status === 'in_review'
                                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                                        : item.status === 'done'
                                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200'}
                                                `}
                                                onClick={() => handleToggleStatus(item.id, item.status)}
                                            >
                                                {item.status === 'in_review' ? (
                                                    <><Clock className="w-3 h-3" /> In Review</>
                                                ) : item.status === 'done' ? (
                                                    <><CheckCircle2 className="w-3 h-3" /> Done</>
                                                ) : (
                                                    <><Circle className="w-3 h-3" /> Todo</>
                                                )}
                                            </Button>
                                            
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] text-gray-400 hover:text-luxury-gold gap-1 h-auto p-0 justify-start"
                                                onClick={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                            >
                                                {expandedComments[item.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                {item.comments?.length || 0} Comments
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
                                                        <img src={url} alt="Screenshot" className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">No images</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-red-500 opacity-50 hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>

                                {expandedComments[item.id] && (
                                    <TableRow className="bg-black/[0.01] dark:bg-white/[0.01] border-black/5 dark:border-white/5">
                                        <TableCell colSpan={7} className="py-4 px-6">
                                            <div className="space-y-4 max-w-2xl mx-auto">
                                                <div className="space-y-3">
                                                    {item.comments && item.comments.length > 0 ? (
                                                        item.comments.map((c, idx) => (
                                                            <div key={idx} className="flex flex-col gap-1 p-3 rounded bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5">
                                                                <div className="flex justify-between items-center text-[10px] text-gray-400">
                                                                    <span className="font-bold text-luxury-gold">{c.user}</span>
                                                                    <span>{format(new Date(c.date), 'MMM d, h:mm a')}</span>
                                                                </div>
                                                                <p className="text-sm">{c.text}</p>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-center text-xs text-gray-400 py-2">No discussion yet. Start the conversation!</p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Write a comment..."
                                                        className="flex-1 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-luxury-gold/50"
                                                        value={newCommentText[item.id] || ''}
                                                        onChange={(e) => setNewCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(item.id, item.comments || [])}
                                                    />
                                                    <Button 
                                                        size="sm" 
                                                        className="bg-luxury-gold text-black hover:bg-luxury-gold/80 h-9 px-3"
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
