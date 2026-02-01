import {
    Dialog,
    DialogContent,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X, ZoomIn, ZoomOut, Maximize } from "lucide-react"
import { useState, useEffect } from "react"

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    title?: string;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, title = "Image Preview" }: ImagePreviewModalProps) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Reset state when opening new image
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen, imageUrl]);

    if (!imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001; // Sensitivity
        const newScale = Math.min(Math.max(0.5, scale + delta), 4); // Min 0.5x, Max 4x
        setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden bg-black/95 border-zinc-800 flex flex-col">
                <div className="relative flex-1 w-full h-full overflow-hidden flex flex-col">
                    {/* Header / Close */}
                    <div className="absolute top-2 right-2 z-50 flex gap-2">
                        {/* Controls Overlay */}
                        <div className="bg-black/50 backdrop-blur rounded-lg p-1 flex gap-1 border border-zinc-800">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setScale(Math.min(scale + 0.5, 4))}>
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}>
                                <Maximize className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setScale(Math.max(0.5, scale - 0.5))}>
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                        </div>

                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full bg-black/50 border border-zinc-800">
                                <X className="w-5 h-5" />
                            </Button>
                        </DialogClose>
                    </div>

                    {/* Image Container with Pan/Zoom */}
                    <div
                        className="flex-1 overflow-hidden flex items-center justify-center cursor-move"
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img
                            src={imageUrl}
                            alt={title}
                            draggable={false}
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                maxWidth: '100%',
                                maxHeight: '100%',
                            }}
                            className="object-contain"
                        />
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-4 bg-black/50 backdrop-blur-sm border-t border-zinc-800 flex justify-between items-center z-50">
                        <span className="text-sm text-zinc-400">{title}</span>
                        <span className="text-xs text-zinc-600 font-mono">
                            {Math.round(scale * 100)}% | Scroll to Zoom | Drag to Pan
                        </span>
                        <Button onClick={handleDownload} variant="outline" className="gap-2 border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:text-white">
                            <Download className="w-4 h-4" /> Download
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
