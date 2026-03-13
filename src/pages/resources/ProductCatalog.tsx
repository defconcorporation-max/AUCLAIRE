import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCatalog, CatalogNode } from '@/services/apiCatalog';
import { useAuth } from '@/context/AuthContext';
import { 
    Plus, 
    ArrowLeft, 
    ShoppingBag, 
    ChevronRight,
    Loader2,
    Image as ImageIcon,
    Home,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function ProductCatalog() {
    const navigate = useNavigate();
    const { role, isAdmin } = useAuth();
    const queryClient = useQueryClient();
    const canManage = isAdmin || role === 'secretary' || role === 'admin';

    // Navigation state
    const [currentPath, setCurrentPath] = useState<CatalogNode[]>([]);
    const currentParentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

    // Add Node state
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newNode, setNewNode] = useState({
        label: '',
        image_url: '',
        price: 0,
        sort_order: 0,
        specs: {}
    });

    // Queries
    const { data: nodes = [], isLoading } = useQuery({
        queryKey: ['catalog-nodes', currentParentId],
        queryFn: () => apiCatalog.getNodes(currentParentId)
    });

    // Mutations
    const addNodeMutation = useMutation({
        mutationFn: (data: any) => apiCatalog.createNode({
            ...data,
            parent_id: currentParentId,
            type: getNextType(currentPath.length)
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog-nodes', currentParentId] });
            setIsAddDialogOpen(false);
            setNewNode({ label: '', image_url: '', price: 0, sort_order: 0, specs: {} });
        }
    });

    const deleteNodeMutation = useMutation({
        mutationFn: apiCatalog.deleteNode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog-nodes', currentParentId] });
        }
    });

    const getNextType = (depth: number): any => {
        const types = ['category', 'model', 'style', 'carat', 'metal'];
        return types[Math.min(depth, types.length - 1)];
    };

    const handleNavigate = (node: CatalogNode) => {
        if (node.type === 'metal') return; // Leaf node
        setCurrentPath([...currentPath, node]);
    };

    const handleBreadcrumb = (index: number | 'home') => {
        if (index === 'home') {
            setCurrentPath([]);
        } else {
            setCurrentPath(currentPath.slice(0, index + 1));
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/dashboard/resources')}
                    className="w-fit text-muted-foreground hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Menu Ressources
                </Button>

                {canManage && (
                    <Button 
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-luxury-gold hover:bg-yellow-600 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" /> 
                        {currentPath.length === 0 ? 'Ajouter une Catégorie' : `Ajouter : ${getNextType(currentPath.length)}`}
                    </Button>
                )}
            </div>

            {/* Breadcrumbs */}
            <nav className="flex items-center flex-wrap gap-2 text-sm">
                <button 
                    onClick={() => handleBreadcrumb('home')}
                    className={`flex items-center gap-1 hover:text-luxury-gold transition-colors ${currentPath.length === 0 ? 'text-luxury-gold font-bold' : 'text-muted-foreground'}`}
                >
                    <Home className="w-4 h-4" />
                    Catalogue
                </button>
                {currentPath.map((node, i) => (
                    <div key={node.id} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <button 
                            onClick={() => handleBreadcrumb(i)}
                            className={`hover:text-luxury-gold transition-colors ${i === currentPath.length - 1 ? 'text-luxury-gold font-bold' : 'text-muted-foreground'}`}
                        >
                            {node.label}
                        </button>
                    </div>
                ))}
            </nav>

            <header className="relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-luxury-gold/5 rounded-full blur-[60px] -z-10" />
                <h1 className="text-4xl font-serif text-white flex items-center gap-3 lowercase first-letter:uppercase">
                    <ShoppingBag className="text-luxury-gold" />
                    {currentPath.length === 0 ? "Nos Produits" : currentPath[currentPath.length - 1].label}
                </h1>
                <p className="text-muted-foreground mt-2 font-serif italic text-sm">
                    {currentPath.length === 0 
                        ? "Sélectionnez une catégorie pour commencer l'estimation." 
                        : `Choisissez ${getNextType(currentPath.length)} pour continuer.`
                    }
                </p>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex h-64 items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
                    </div>
                ) : nodes.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Plus className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-xl font-serif text-muted-foreground">Cette section est vide</h3>
                        {canManage && <p className="text-sm text-muted-foreground mt-2">Cliquez sur le bouton ci-dessus pour ajouter des éléments.</p>}
                    </div>
                ) : (
                    nodes.map((node) => (
                        <Card 
                            key={node.id} 
                            onClick={() => handleNavigate(node)}
                            className={`group relative overflow-hidden bg-white/5 border-white/10 hover:border-luxury-gold/50 transition-all duration-500 cursor-pointer ${node.type === 'metal' ? 'cursor-default ring-1 ring-luxury-gold/20' : ''}`}
                        >
                            {/* Actions Overlay */}
                            {canManage && (
                                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(confirm('Supprimer cet élément et tous ses sous-éléments?')) deleteNodeMutation.mutate(node.id);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            <div className="aspect-square relative flex items-center justify-center bg-zinc-900/50">
                                {node.image_url ? (
                                    <img 
                                        src={node.image_url} 
                                        alt={node.label} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                                        <ImageIcon className="w-10 h-10" />
                                        <span className="text-[10px] uppercase tracking-widest">{node.type}</span>
                                    </div>
                                )}
                                
                                {node.type !== 'metal' && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="px-4 py-2 border border-white/20 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-widest text-white shadow-xl">
                                            Explorer
                                        </div>
                                    </div>
                                )}
                            </div>

                            <CardHeader className="p-4">
                                <CardTitle className="font-serif text-lg group-hover:text-luxury-gold transition-colors flex items-center justify-between">
                                    {node.label}
                                    {node.type !== 'metal' && <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />}
                                </CardTitle>
                                {node.price && node.price > 0 ? (
                                    <div className="mt-2 text-xl font-bold font-serif text-luxury-gold">
                                        {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(node.price)}
                                    </div>
                                ) : (
                                    <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                                        {node.type}
                                    </div>
                                )}
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>

            {/* Add Node Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">
                            Ajouter {currentPath.length === 0 ? 'une Catégorie' : `un(e) ${getNextType(currentPath.length)}`}
                        </DialogTitle>
                        <DialogDescription>
                            Cet élément sera ajouté sous : <span className="text-luxury-gold font-bold">{currentParentId ? currentPath[currentPath.length - 1].label : 'Racine'}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nom / Label</Label>
                            <Input 
                                placeholder="ex: 1.5ct, Or 18k, Oval Cut..." 
                                value={newNode.label}
                                onChange={(e) => setNewNode({...newNode, label: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL de l'Image (optionnel)</Label>
                            <Input 
                                placeholder="https://..." 
                                value={newNode.image_url}
                                onChange={(e) => setNewNode({...newNode, image_url: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Prix (seulement pour l'étape finale)</Label>
                            <Input 
                                type="number"
                                placeholder="0.00" 
                                value={newNode.price}
                                onChange={(e) => setNewNode({...newNode, price: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                        <Button 
                            className="bg-luxury-gold text-white"
                            onClick={() => addNodeMutation.mutate(newNode)}
                            disabled={!newNode.label || addNodeMutation.isPending}
                        >
                            {addNodeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
