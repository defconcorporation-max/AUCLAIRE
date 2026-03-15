import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFeedback, FeedbackEntry } from '@/services/apiFeedback';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, ExternalLink, Trash2 } from 'lucide-react';
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
                                <TableRow key={item.id} className="border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] group">
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
                                            className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
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
