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
    Trash2,
    Pencil
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
import { Textarea } from '@/components/ui/textarea';

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
        description: '',
        image_url: '',
        price: 0,
        sort_order: 0,
        specs: {}
    });

    const nextType = getNextType(currentPath.length);

    // Edit Node state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<CatalogNode | null>(null);

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
            type: nextType
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog-nodes', currentParentId] });
            setIsAddDialogOpen(false);
            setNewNode({ label: '', description: '', image_url: '', price: 0, sort_order: 0, specs: {} });
        }
    });

    const updateNodeMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<CatalogNode> }) => 
            apiCatalog.updateNode(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog-nodes', currentParentId] });
            setIsEditDialogOpen(false);
            setEditingNode(null);
        }
    });

    const deleteNodeMutation = useMutation({
        mutationFn: apiCatalog.deleteNode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog-nodes', currentParentId] });
        }
    });

    const handleEditClick = (e: React.MouseEvent, node: CatalogNode) => {
        e.stopPropagation();
        setEditingNode(node);
        setIsEditDialogOpen(true);
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
                        {currentPath.length === 0 ? 'Ajouter une Catégorie' : `Ajouter : ${nextType}`}
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
                {currentPath.length > 0 && currentPath[currentPath.length - 1].description && (
                    <p className="text-muted-foreground mt-2 font-serif italic text-sm">
                        {currentPath[currentPath.length - 1].description}
                    </p>
                )}
                <p className="text-luxury-gold/60 mt-2 font-serif italic text-xs uppercase tracking-widest">
                    {currentPath.length === 0 
                        ? "Sélectionnez une catégorie pour commencer l'estimation." 
                        : `Choisissez l'étape suivante : ${nextType}`
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
                                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <Button 
                                        variant="secondary" 
                                        size="icon" 
                                        className="h-8 w-8 bg-zinc-800 border-white/10 hover:bg-zinc-700"
                                        onClick={(e) => handleEditClick(e, node)}
                                    >
                                        <Pencil className="w-4 h-4 text-white" />
                                    </Button>
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
                                {node.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 italic mt-1">
                                        {node.description}
                                    </p>
                                )}
                                {node.price && node.price > 0 ? (
                                    <div className="mt-2 text-xl font-bold font-serif text-luxury-gold">
                                        {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(node.price)}
                                    </div>
                                ) : (
                                    <div className="mt-1 text-[10px] uppercase tracking-widest text-luxury-gold/40">
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
                <DialogContent className="max-w-md bg-zinc-950 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-white">
                            Ajouter {currentPath.length === 0 ? 'une Catégorie' : `un(e) ${nextType}`}
                        </DialogTitle>
                        <DialogDescription>
                            Cet élément sera ajouté sous : <span className="text-luxury-gold font-bold">{currentParentId ? currentPath[currentPath.length - 1].label : 'Racine'}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4 px-2 overflow-y-auto max-h-[60vh]">
                        <div className="space-y-2">
                            <Label>Nom / Label</Label>
                            <Input 
                                placeholder={nextType === 'carat' ? 'ex: 1.5ct' : 'ex: Or 18k, Oval Cut...'} 
                                value={newNode.label}
                                onChange={(e) => setNewNode({...newNode, label: e.target.value})}
                            />
                        </div>

                        {/* Description field for everything except metals */}
                        {nextType !== 'metal' && (
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea 
                                    placeholder="Détails descriptifs..." 
                                    className="bg-white/5 border-white/10"
                                    value={newNode.description}
                                    onChange={(e) => setNewNode({...newNode, description: e.target.value})}
                                />
                            </div>
                        )}

                        {/* Image field for everything except categories */}
                        {nextType !== 'category' && (
                            <div className="space-y-2">
                                <Label>URL de l'Image (optionnel)</Label>
                                <Input 
                                    placeholder="https://..." 
                                    value={newNode.image_url}
                                    onChange={(e) => setNewNode({...newNode, image_url: e.target.value})}
                                />
                            </div>
                        )}

                        {/* Price field only for leaf nodes (metals) */}
                        {nextType === 'metal' && (
                            <div className="space-y-2">
                                <Label>Prix (CAD)</Label>
                                <Input 
                                    type="number"
                                    placeholder="0.00" 
                                    value={newNode.price}
                                    onChange={(e) => setNewNode({...newNode, price: parseFloat(e.target.value)})}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-2">
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
            {/* Edit Node Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl">
                            Modifier {editingNode?.label}
                        </DialogTitle>
                        <DialogDescription>
                            Type : <span className="text-luxury-gold uppercase tracking-widest text-xs font-bold">{editingNode?.type}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingNode && (
                        <div className="space-y-4 py-4 px-2 overflow-y-auto max-h-[60vh]">
                            <div className="space-y-2">
                                <Label>Nom / Label</Label>
                                <Input 
                                    className="bg-white/5 border-white/10"
                                    value={editingNode.label}
                                    onChange={(e) => setEditingNode({...editingNode, label: e.target.value})}
                                />
                            </div>

                            {editingNode.type !== 'metal' && (
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea 
                                        className="bg-white/5 border-white/10"
                                        value={editingNode.description || ''}
                                        onChange={(e) => setEditingNode({...editingNode, description: e.target.value})}
                                    />
                                </div>
                            )}

                            {editingNode.type !== 'category' && (
                                <div className="space-y-2">
                                    <Label>URL de l'Image</Label>
                                    <Input 
                                        className="bg-white/5 border-white/10"
                                        placeholder="https://..." 
                                        value={editingNode.image_url || ''}
                                        onChange={(e) => setEditingNode({...editingNode, image_url: e.target.value})}
                                    />
                                </div>
                            )}

                            {editingNode.type === 'metal' && (
                                <div className="space-y-2">
                                    <Label>Prix (CAD)</Label>
                                    <Input 
                                        className="bg-white/5 border-white/10"
                                        type="number"
                                        value={editingNode.price}
                                        onChange={(e) => setEditingNode({...editingNode, price: parseFloat(e.target.value)})}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="px-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
                        <Button 
                            className="bg-luxury-gold text-white"
                            onClick={() => editingNode && updateNodeMutation.mutate({ id: editingNode.id, updates: editingNode })}
                            disabled={!editingNode?.label || updateNodeMutation.isPending}
                        >
                            {updateNodeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Enregistrer les modifications
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function getNextType(depth: number): 'category' | 'model' | 'style' | 'carat' | 'metal' {
    const types: Array<'category' | 'model' | 'style' | 'carat' | 'metal'> = ['category', 'model', 'style', 'carat', 'metal'];
    return types[Math.min(depth, types.length - 1)];
}
