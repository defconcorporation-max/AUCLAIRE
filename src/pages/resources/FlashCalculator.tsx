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
    RotateCcw,
    TrendingUp,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function FlashCalculator() {
    const navigate = useNavigate();
    const [selections, setSelections] = useState<CatalogNode[]>([]);
    const [currentOptions, setCurrentOptions] = useState<CatalogNode[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);

    const currentParentId = selections.length > 0 ? selections[selections.length - 1].id : null;

    const { data: nodes = [], isLoading } = useQuery({
        queryKey: ['catalog-nodes', currentParentId],
        queryFn: () => apiCatalog.getNodes(currentParentId)
    });

    useEffect(() => {
        if (!isLoading) {
            setCurrentOptions(nodes);
        }
    }, [nodes, isLoading]);

    useEffect(() => {
        const total = selections.reduce((sum, node) => sum + (node.price || 0), 0);
        setTotalPrice(total);
    }, [selections]);

    const handleSelect = (node: CatalogNode) => {
        // Find existing selection at this level or deeper and replace/truncate
        const levelIndex = selections.findIndex(s => s.type === node.type);
        let newSelections;
        if (levelIndex !== -1) {
            newSelections = [...selections.slice(0, levelIndex), node];
        } else {
            newSelections = [...selections, node];
        }
        setSelections(newSelections);
    };

    const handleReset = () => {
        setSelections([]);
    };

    const handleBackStep = (index: number) => {
        setSelections(selections.slice(0, index + 1));
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

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                            ))
                        ) : currentOptions.length > 0 ? (
                            currentOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelect(option)}
                                    className={cn(
                                        "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden",
                                        "bg-white/5 border-white/10 hover:border-luxury-gold/50 hover:bg-white/10"
                                    )}
                                >
                                    <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/5 overflow-hidden shrink-0">
                                        {option.image_url ? (
                                            <img src={option.image_url} alt={option.label} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 uppercase text-[8px] font-bold">
                                                {option.type}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-serif font-bold group-hover:text-luxury-gold transition-colors truncate">
                                            {option.label}
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                            {option.type}
                                        </p>
                                        {option.price && option.price > 0 && (
                                            <p className="text-xs text-luxury-gold font-bold mt-1">
                                                +{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(option.price)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-luxury-gold/50 transition-colors">
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-luxury-gold" />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center gap-3">
                                <CheckCircle2 className="w-10 h-10 text-luxury-gold animate-bounce" />
                                <h3 className="text-xl font-serif text-white">Configuration Terminée</h3>
                                <p className="text-sm text-muted-foreground">Voici votre estimation finale pour ce projet.</p>
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
                                        <div className="text-right">
                                            <p className="text-xs font-mono font-bold text-luxury-gold">
                                                {s.price && s.price > 0 ? `+${new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(s.price)}` : 'Inclus'}
                                            </p>
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
