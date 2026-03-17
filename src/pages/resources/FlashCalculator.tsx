import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiCatalog, CatalogNode } from '@/services/apiCatalog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Calculator, 
    ChevronRight, 
    Diamond, 
    Layers, 
    ShoppingBag, 
    ArrowLeft,
    CheckCircle2,
    Info,
    RotateCcw,
    TrendingUp,
    Sparkles,
    EyeOff,
    Coins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// --- SUB-COMPONENTS FOR PREMIUM UI ---

interface SpecRowProps {
    label: string;
    type: string;
    options: CatalogNode[];
    selectedId?: string;
    onSelect: (node: CatalogNode) => void;
    isLoading?: boolean;
    disabled?: boolean;
}

const SpecRow = ({ label, options, selectedId, onSelect, isLoading, disabled }: SpecRowProps) => {
    if (disabled && !selectedId) return null;

    return (
        <div className={cn(
            "group py-4 md:py-6 border-b border-white/5 last:border-0 transition-all duration-300",
            disabled ? "opacity-30 grayscale pointer-events-none" : "opacity-100"
        )}>
            <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Side Label */}
                <div className="w-full md:w-32 flex items-center gap-2 pt-2">
                    <Info className="w-4 h-4 text-muted-foreground/50" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70 whitespace-nowrap">
                        {label}
                    </span>
                </div>

                {/* Options Chips */}
                <div className="flex-1 flex flex-wrap gap-3 min-h-[44px]">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-11 w-24 rounded-lg bg-white/5 animate-[pulse_3s_ease-in-out_infinite]" />
                        ))
                    ) : (
                        options.map((opt) => {
                            const isMetal = opt.type === 'metal';
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => onSelect(opt)}
                                    className={cn(
                                        "relative h-10 md:h-11 px-4 md:px-6 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-2 group/chip",
                                        isMetal && "rounded-full px-3 md:px-4",
                                        selectedId === opt.id 
                                            ? "bg-luxury-gold border-luxury-gold text-white shadow-[0_0_20px_rgba(210,181,123,0.3)] ring-1 ring-luxury-gold" 
                                            : "bg-white/5 border-white/10 text-muted-foreground hover:border-luxury-gold/50 hover:bg-white/10"
                                    )}
                                >
                                    {opt.image_url && !isMetal && (
                                        <div className="w-6 h-6 rounded bg-zinc-900 border border-white/10 overflow-hidden mr-1">
                                            <img src={opt.image_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    {isMetal && (
                                        <div className={cn(
                                            "w-4 h-4 rounded-full border border-white/20",
                                            opt.label.toLowerCase().includes('jaune') || opt.label.includes('18k') ? "bg-yellow-400" : 
                                            opt.label.toLowerCase().includes('rose') ? "bg-rose-300" : 
                                            opt.label.toLowerCase().includes('blanc') || opt.label.includes('platine') ? "bg-slate-200" : "bg-zinc-400"
                                        )} />
                                    )}
                                    {opt.label}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// Stable Row Component that manages its own query
interface CalculatorRowProps {
    depth: number;
    type: string;
    parentId: string | null;
    selectedId?: string;
    onSelect: (node: CatalogNode) => void;
    preferredLabels: Record<string, string>;
}

// Utility to format type labels (e.g., 'custom_level' -> 'Custom Level')
const formatTypeLabel = (type: string) => {
    if (!type) return '';
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const CalculatorRow = ({ depth, type, parentId, selectedId, onSelect, preferredLabels }: CalculatorRowProps) => {
    const { data: options = [], isLoading } = useQuery({
        queryKey: ['catalog-nodes', parentId],
        queryFn: () => apiCatalog.getNodes(parentId),
        enabled: depth === 0 || !!parentId,
        staleTime: 1000 * 60 * 5
    });

    const rowType = options.length > 0 ? options[0].type : type;

    // --- AUTO-SELECTION LOGIC ---
    useEffect(() => {
        if (!isLoading && options.length > 0 && !selectedId) {
            const preferredLabel = preferredLabels[rowType];
            
            if (preferredLabel) {
                // Case-insensitive match for robustness
                const match = options.find(o => o.label.toLowerCase() === preferredLabel.toLowerCase());
                if (match) {
                    console.log(`[AutoSelect] Match found for ${rowType}: ${match.label}`);
                    onSelect(match);
                } else {
                    console.log(`[AutoSelect] No match for ${rowType} with preferred label: ${preferredLabel}`);
                }
            } else if (options.length === 1 && depth > 0) {
                console.log(`[AutoSelect] Single option auto-select for depth ${depth}: ${options[0].label}`);
                onSelect(options[0]);
            }
        }
    }, [options, selectedId, preferredLabels, rowType, isLoading, onSelect, depth]);

    if (options.length === 0 && !isLoading) return null;

    return (
        <SpecRow 
            label={formatTypeLabel(rowType)} 
            type={rowType} 
            options={options} 
            selectedId={selectedId}
            onSelect={onSelect}
            isLoading={isLoading}
            disabled={depth > 0 && !parentId}
        />
    );
};

export default function FlashCalculator() {
    const navigate = useNavigate();
    const [selections, setSelections] = useState<CatalogNode[]>([]);
    const [preferredLabels, setPreferredLabels] = useState<Record<string, string>>({});
    const [showroomMode, setShowroomMode] = useState(false);
    const [priceCalculated, setPriceCalculated] = useState(false);

    const totalPrice = useMemo(() => {
        return selections.reduce((sum, node) => sum + (node.price || 0), 0);
    }, [selections]);

    const handleSelect = useCallback((node: CatalogNode) => {
        console.log(`[FlashCalculator] Selecting node: ${node.label} (${node.type})`);
        setPriceCalculated(false); // Reset calculation when selection changes
        setSelections(prev => {
            if (!node.parent_id) {
                if (prev[0]?.id === node.id) return prev;
                return [node];
            }

            const parentIndex = prev.findIndex(s => s.id === node.parent_id);
            if (parentIndex !== -1) {
                const newDepth = parentIndex + 1;
                if (prev[newDepth]?.id === node.id) return prev;
                return [...prev.slice(0, newDepth), node];
            }

            return [...prev, node];
        });

        setPreferredLabels(prev => ({
            ...prev,
            [node.type]: node.label
        }));
    }, []);

    useEffect(() => {
        console.log('[FlashCalculator] Path update:', selections.map(s => s.label).join(' > '));
    }, [selections]);

    const handleReset = () => {
        setSelections([]);
    };

    const handleBackStep = (index: number) => {
        setSelections(selections.slice(0, index + 1));
    };

    const handlePriceChange = (index: number, newPrice: number) => {
        const newSelections = [...selections];
        newSelections[index] = { ...newSelections[index], price: newPrice };
        setSelections(newSelections);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/dashboard/resources')}
                    className="w-fit text-muted-foreground hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour Ressources
                </Button>
                
                <div className="flex gap-2">
                    <Button 
                        variant={showroomMode ? "default" : "outline"}
                        onClick={() => {
                            setShowroomMode(!showroomMode);
                            setPriceCalculated(false);
                        }}
                        className={cn(
                            "transition-all duration-500",
                            showroomMode 
                            ? "bg-luxury-gold text-black hover:bg-luxury-gold/90 animate-pulse-slow font-bold" 
                            : "border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10"
                        )}
                    >
                        {showroomMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {showroomMode ? "Mode Edit" : "Mode Showroom"}
                    </Button>

                    <Button 
                        variant="outline"
                        onClick={handleReset}
                        className="border-white/10 hover:bg-white/5"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" /> Réinitialiser
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Configuration Steps */}
                <div className="lg:col-span-2 space-y-6">
                    <header>
                        <h1 className="text-4xl font-serif text-white flex items-center gap-3">
                            <Calculator className="text-luxury-gold" />
                            Flash Quote
                        </h1>
                        <p className="text-muted-foreground mt-2 font-serif italic">
                            Estimez instantanément un projet sur-mesure pour votre client.
                        </p>
                    </header>

                    {/* Progress Track */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button 
                            onClick={handleReset}
                            className={cn(
                                "shrink-0 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all",
                                selections.length === 0 ? "bg-luxury-gold border-luxury-gold text-white shadow-lg" : "border-white/10 text-muted-foreground hover:border-white/30"
                            )}
                        >
                            Début
                        </button>
                        {selections.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-2 shrink-0">
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                <button 
                                    onClick={() => handleBackStep(i)}
                                    className={cn(
                                        "px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all",
                                        i === selections.length - 1 ? "bg-luxury-gold border-luxury-gold text-white shadow-lg shadow-luxury-gold/20" : "border-white/10 text-muted-foreground hover:border-white/30"
                                    )}
                                >
                                    {s.label}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-zinc-900/50 rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-8 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-gold/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                        
                        <div className="space-y-2">
                            {/* Level 0: Categories (Always visible) */}
                            <CalculatorRow 
                                depth={0}
                                type="category"
                                parentId={null}
                                selectedId={selections[0]?.id}
                                onSelect={handleSelect}
                                preferredLabels={preferredLabels}
                            />

                            {/* Dynamic Levels: Rendered based on previous selections */}
                            {selections.map((selectedNode, index) => {
                                const nextDepth = index + 1;
                                
                                // We determine the label of the row by looking at the FIRST child's type
                                // or defaulting to 'Variation' if not known yet.
                                // The label is passed down to SpecRow.
                                return (
                                    <CalculatorRow 
                                        key={`level-${nextDepth}`}
                                        depth={nextDepth}
                                        type={selections[nextDepth]?.type || 'any'}
                                        parentId={selectedNode.id}
                                        selectedId={selections[nextDepth]?.id}
                                        onSelect={handleSelect}
                                        preferredLabels={preferredLabels}
                                    />
                                );
                            })}
                        </div>

                        {selections.length > 0 && selections[selections.length - 1]?.price !== undefined && (
                            <div className="mt-12 py-12 text-center bg-luxury-gold/5 rounded-2xl border border-dashed border-luxury-gold/20 flex flex-col items-center gap-3 animate-in fade-in duration-500">
                                <CheckCircle2 className="w-12 h-12 text-luxury-gold" />
                                <h3 className="text-2xl font-serif text-white">Prêt à Chiffrer</h3>
                                <p className="text-sm text-muted-foreground">Spécifications identifiées pour {selections[selections.length-1].label}.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Summary & Quote */}
                <div className="space-y-6">
                    <Card className="glass-card border-luxury-gold/20 lg:sticky lg:top-6 mb-24 lg:mb-0">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="font-serif text-xl flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-luxury-gold" />
                                Résumé de l'Estimation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-white/5">
                                {selections.map((s, i) => (
                                    <li key={i} className="p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 group hover:bg-white/[0.02]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-luxury-gold/5 flex items-center justify-center border border-luxury-gold/10 group-hover:scale-110 transition-transform">
                                                {s.type === 'category' ? <ShoppingBag className="w-5 h-5 text-luxury-gold" /> : 
                                                 s.type === 'carat' ? <Diamond className="w-5 h-5 text-luxury-gold" /> :
                                                 <Layers className="w-5 h-5 text-luxury-gold" />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">{s.type}</p>
                                                <p className="text-sm font-serif font-bold text-white group-hover:text-luxury-gold transition-colors">{s.label}</p>
                                            </div>
                                        </div>
                                        {!showroomMode ? (
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1 md:w-32">
                                                    <input 
                                                        type="number"
                                                        value={s.price || 0}
                                                        onChange={(e) => handlePriceChange(i, parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-mono font-bold text-luxury-gold text-right focus:ring-1 focus:ring-luxury-gold/50 focus:bg-white/10 transition-all"
                                                    />
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-luxury-gold font-bold opacity-30">$</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-2">
                                                <div className="w-2 h-2 rounded-full bg-luxury-gold/20" />
                                            </div>
                                        )}
                                    </li>
                                ))}
                                {selections.length === 0 && (
                                    <li className="p-12 text-center text-muted-foreground italic text-sm">
                                        Commencez par choisir une catégorie...
                                    </li>
                                )}
                            </ul>

                             <div className="p-6 bg-luxury-gold/5 border-t border-luxury-gold/20">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">Total Estimé (HT)</div>
                                    <div className="text-4xl font-serif font-bold text-luxury-gold">
                                        {(!showroomMode || priceCalculated) ? (
                                            new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(totalPrice)
                                        ) : (
                                            <Button 
                                                onClick={() => setPriceCalculated(true)}
                                                className="bg-luxury-gold text-black hover:bg-luxury-gold/90 font-bold px-6 py-2 h-auto text-lg animate-in zoom-in-50 duration-500"
                                            >
                                                <Coins className="w-5 h-5 mr-2" /> Calculer le Prix
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[9px] text-muted-foreground italic text-center leading-relaxed">
                                    *Prix sujet à modification selon le cours des métaux et la sélection finale de la pierre.
                                </p>
                            </div>

                            <div className="p-4 flex gap-2">
                                <Button 
                                    className="flex-1 bg-luxury-gold hover:bg-yellow-600 text-white"
                                    disabled={selections.length < 3}
                                    onClick={() => navigate('/dashboard/projects/new', { 
                                        state: { 
                                            designNotes: selections.map(s => `${s.type}: ${s.label}`).join(', '),
                                            estimatedPrice: totalPrice
                                        } 
                                    })}
                                >
                                    Créer le Projet
                                </Button>
                            </div>

                            {/* Visual Preview (Latest Image) - Moved inside card for stability */}
                            {[...selections].reverse().find(s => !!s.image_url) && (
                                <div className="border-t border-white/10 overflow-hidden relative group aspect-video">
                                    <img 
                                        src={[...selections].reverse().find(s => !!s.image_url)?.image_url} 
                                        alt="Visual Preview" 
                                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4">
                                        <p className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">Aperçu Visuel</p>
                                        <p className="text-sm font-serif text-white">{[...selections].reverse().find(s => !!s.image_url)?.label}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-t border-white/10 p-4 pb-8 z-50 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">Total Estimé</span>
                    <span className="text-xl font-serif text-white">
                        {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(totalPrice)}
                    </span>
                </div>
                <Button 
                    className="bg-luxury-gold hover:bg-yellow-600 text-white font-bold h-12 px-6"
                    disabled={selections.length < 3}
                    onClick={() => navigate('/dashboard/projects/new', { 
                        state: { 
                            designNotes: selections.map(s => `${s.type}: ${s.label}`).join(', '),
                            estimatedPrice: totalPrice
                        } 
                    })}
                >
                    Créer Projet
                </Button>
            </div>
        </div>
    );
}
