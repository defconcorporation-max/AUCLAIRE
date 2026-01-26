
import {
    Dialog,
    DialogContent,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    title?: string;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, title = "Image Preview" }: ImagePreviewModalProps) {
    if (!imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image-${Date.now()}.jpg`; // Default filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden bg-black/95 border-zinc-800">
                <div className="relative w-full h-full flex flex-col">
                    {/* Header / Close */}
                    <div className="absolute top-2 right-2 z-50">
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                                <X className="w-5 h-5" />
                            </Button>
                        </DialogClose>
                    </div>

                    {/* Image Container */}
                    <div className="flex-1 overflow-hidden flex items-center justify-center p-4 min-h-[50vh]">
                        <img
                            src={imageUrl}
                            alt={title}
                            className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl"
                        />
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-4 bg-black/50 backdrop-blur-sm border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-sm text-zinc-400">{title}</span>
                        <Button onClick={handleDownload} variant="outline" className="gap-2 border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:text-white">
                            <Download className="w-4 h-4" /> Download
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
