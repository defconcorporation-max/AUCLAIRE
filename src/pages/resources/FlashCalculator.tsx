import { useState, useEffect } from 'react';
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
    TrendingUp
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
            "group py-6 border-b border-white/5 last:border-0 transition-all duration-500",
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
                <div className="flex-1 flex flex-wrap gap-3">
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 w-24 rounded-lg bg-white/5 animate-pulse" />
                        ))
                    ) : (
                        options.map((opt) => {
                            const isMetal = opt.type === 'metal';
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => onSelect(opt)}
                                    className={cn(
                                        "relative h-11 px-6 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-2 group/chip",
                                        isMetal && "rounded-full px-4",
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

function LevelRows({ 
    depth, 
    selections, 
    onSelect, 
    preferredLabels 
}: { 
    depth: number, 
    selections: CatalogNode[], 
    onSelect: (node: CatalogNode) => void,
    preferredLabels: Record<string, string>
}) {
    const labels = ["Catégorie", "Modèle", "Style", "Carat", "Métal"];
    const types = ["category", "model", "style", "carat", "metal"];
    const parentId = depth > 0 ? selections[depth - 1]?.id : null;
    
    const { data: options = [], isLoading } = useQuery({
        queryKey: ['catalog-nodes', parentId],
        queryFn: () => apiCatalog.getNodes(parentId),
        enabled: depth === 0 || !!parentId
    });

    const selectedId = selections[depth]?.id;
    const currentPreferredLabel = preferredLabels[types[depth]];

    // --- AUTO-SELECTION LOGIC ---
    useEffect(() => {
        if (!isLoading && options.length > 0 && !selectedId && currentPreferredLabel) {
            const match = options.find(o => o.label === currentPreferredLabel);
            if (match) {
                console.log(`Auto-selecting ${match.label} for level ${depth}`);
                onSelect(match);
            }
        }
    }, [options, selectedId, currentPreferredLabel, isLoading, onSelect, depth]);

    return (
        <>
            <SpecRow 
                label={labels[depth]} 
                type={labels[depth]} 
                options={options} 
                selectedId={selectedId}
                onSelect={onSelect}
                isLoading={isLoading}
                disabled={depth > 0 && !parentId}
            />
            {selectedId && depth < labels.length - 1 && (
                <LevelRows 
                    depth={depth + 1} 
                    selections={selections} 
                    onSelect={onSelect} 
                    preferredLabels={preferredLabels}
                />
            )}
        </>
    );
}

export default function FlashCalculator() {
    const navigate = useNavigate();
    const [selections, setSelections] = useState<CatalogNode[]>([]);
    const [preferredLabels, setPreferredLabels] = useState<Record<string, string>>({});
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        const total = selections.reduce((sum, node) => sum + (node.price || 0), 0);
        setTotalPrice(total);
    }, [selections]);

    const handleSelect = (node: CatalogNode) => {
        // Types we care about in order
        const types = ['category', 'model', 'style', 'carat', 'metal'];
        const levelIndex = types.indexOf(node.type);

        if (levelIndex !== -1) {
            // Update mapping of "what I like for this level"
            setPreferredLabels(prev => ({
                ...prev,
                [node.type]: node.label
            }));
            
            setSelections(prev => [...prev.slice(0, levelIndex), node]);
        } else {
            setSelections(prev => [...prev, node]);
        }
    };

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/dashboard/resources')}
                    className="w-fit text-muted-foreground hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour Ressources
                </Button>
                
                <Button 
                    variant="outline"
                    onClick={handleReset}
                    className="border-white/10 hover:bg-white/5"
                >
                    <RotateCcw className="w-4 h-4 mr-2" /> Réinitialiser
                </Button>
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

                    <div className="bg-zinc-900/50 rounded-3xl border border-white/10 p-8 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-luxury-gold/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                        
                        {/* Recursive Rows based on hierarchy */}
                        <div className="space-y-2">
                            {/* Level 0: Categories */}
                            <LevelRows 
                                depth={0} 
                                selections={selections} 
                                onSelect={handleSelect}
                                preferredLabels={preferredLabels}
                            />
                        </div>

                        {selections.length > 4 && (
                            <div className="mt-12 py-12 text-center bg-luxury-gold/5 rounded-2xl border border-dashed border-luxury-gold/20 flex flex-col items-center gap-3 animate-in zoom-in duration-500">
                                <CheckCircle2 className="w-12 h-12 text-luxury-gold" />
                                <h3 className="text-2xl font-serif text-white">Prêt à Chiffrer</h3>
                                <p className="text-sm text-muted-foreground">Toutes les spécifications ont été identifiées.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Summary & Quote */}
                <div className="space-y-6">
                    <Card className="glass-card border-luxury-gold/20 sticky top-6">
                        <CardHeader className="border-b border-white/5 pb-4">
                            <CardTitle className="font-serif text-xl flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-luxury-gold" />
                                Résumé de l'Estimation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-white/5">
                                {selections.map((s, i) => (
                                    <li key={i} className="p-4 flex justify-between items-center group hover:bg-white/[0.02]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 flex items-center justify-center border border-luxury-gold/20">
                                                {s.type === 'category' ? <ShoppingBag className="w-4 h-4 text-luxury-gold" /> : 
                                                 s.type === 'carat' ? <Diamond className="w-4 h-4 text-luxury-gold" /> :
                                                 <Layers className="w-4 h-4 text-luxury-gold" />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.type}</p>
                                                <p className="text-sm font-serif font-bold text-white">{s.label}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-luxury-gold font-bold opacity-50">+</span>
                                                <input 
                                                    type="number"
                                                    value={s.price || 0}
                                                    onChange={(e) => handlePriceChange(i, parseFloat(e.target.value) || 0)}
                                                    className="w-24 bg-white/5 border border-white/10 rounded px-2 pl-4 py-1 text-xs font-mono font-bold text-luxury-gold text-right focus:outline-none focus:border-luxury-gold/50 transition-colors"
                                                />
                                            </div>
                                        </div>
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
                                        {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(totalPrice)}
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
                        </CardContent>
                    </Card>
                    
                    {/* Visual Preview (Latest Image) */}
                    {[...selections].reverse().find(s => !!s.image_url) && (
                        <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-video relative group">
                            <img 
                                src={[...selections].reverse().find(s => !!s.image_url)?.image_url} 
                                alt="Visual Preview" 
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-4">
                                <p className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">Aperçu Visuel</p>
                                <p className="text-sm font-serif text-white">{[...selections].reverse().find(s => !!s.image_url)?.label}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
