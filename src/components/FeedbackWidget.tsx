import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { apiFeedback } from '@/services/apiFeedback';
import { uploadImage } from '@/utils/storage';
import { toast } from '@/components/ui/use-toast';

export default function FeedbackWidget() {
    const { profile, user } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [comment, setComment] = useState('');
    const [screenshots, setScreenshots] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    await handleUpload(blob);
                }
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                await handleUpload(files[i]);
            }
        }
    };

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const url = await uploadImage(file, 'feedback');
            setScreenshots(prev => [...prev, url]);
        } catch (error) {
            console.error('Upload failed', error);
            toast({
                title: "Upload Failed",
                description: "Could not upload screenshot.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const removeScreenshot = (index: number) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!comment.trim()) return;

        setIsSubmitting(true);
        try {
            await apiFeedback.submit({
                user_id: user?.id || '',
                user_name: profile?.full_name || 'Anonymous',
                page_url: window.location.href,
                comment,
                screenshots
            });

            toast({
                title: "Feedback sent!",
                description: "Thank you for helping us improve.",
            });
            setComment('');
            setScreenshots([]);
            setIsOpen(false);
        } catch (error) {
            console.error('Submission failed', error);
            toast({
                title: "Error",
                description: "Failed to send feedback. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="px-4 py-2">
                    <button className="w-full aspect-square rounded-xl border border-dashed border-luxury-gold/30 bg-luxury-gold/5 hover:bg-luxury-gold/10 hover:border-luxury-gold transition-all duration-300 flex flex-col items-center justify-center gap-2 group p-2">
                        <MessageSquarePlus className="w-5 h-5 text-luxury-gold group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium text-luxury-gold uppercase tracking-wider text-center">Beta Feedback</span>
                    </button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-luxury-gold/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-luxury-gold">
                        <MessageSquarePlus className="w-5 h-5" />
                        Beta Testing Feedback
                    </DialogTitle>
                    <DialogDescription>
                        Help us improve Auclaire. Report a bug or suggest a feature.
                        Current page: <span className="text-xs font-mono text-gray-500 truncate block">{location.pathname}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Describe your feedback... (You can paste screenshots here directly)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onPaste={handlePaste}
                            className="min-h-[120px] focus-visible:ring-luxury-gold"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between overflow-hidden">
                            <span className="text-sm font-medium">Screenshots ({screenshots.length})</span>
                            <label className="cursor-pointer text-xs text-luxury-gold hover:underline flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                Attach Files
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} disabled={isSubmitting || isUploading} />
                            </label>
                        </div>

                        {screenshots.length > 0 && (
                            <div className="grid grid-cols-4 gap-2">
                                {screenshots.map((url, i) => (
                                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-black/10 dark:border-white/10 group">
                                        <img src={url} alt="Screenshot" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeScreenshot(i)}
                                            className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {isUploading && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Uploading screenshot...
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleSubmit}
                        disabled={!comment.trim() || isSubmitting || isUploading}
                        className="w-full bg-luxury-gold hover:bg-luxury-gold-dark text-black gap-2"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit Feedback
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
