import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
    Pencil,
    Upload,
    X,
    Calculator,
    Info,
    Search,
    Layers
} from 'lucide-react';
import { uploadImage } from '@/utils/storage';
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

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
}

function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        try {
            setIsUploading(true);
            const url = await uploadImage(file, 'catalog');
            onChange(url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('L\'envoi de l\'image a échoué.');
        } finally {
            setIsUploading(false);
        }
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleUpload(file);
        }
    };

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}
            <div 
                className={`relative aspect-video rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden ${
                    value ? 'border-luxury-gold/50 bg-luxury-gold/5' : 'border-white/10 bg-white/5 hover:border-luxury-gold/30 hover:bg-white/10'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                    }}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
                        <span className="text-xs text-muted-foreground animate-pulse">Envoi en cours...</span>
                    </div>
                ) : value ? (
                    <>
                        <img src={value} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/20">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <button 
                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 p-1 rounded-full text-white transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange('');
                            }}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="p-3 bg-white/5 rounded-full border border-white/10">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-white font-medium">Glisser une image ici</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">ou cliquez pour parcourir</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

interface TreeItemProps {
    node: CatalogNode;
    allNodes: CatalogNode[];
    currentId: string | null;
    onSelect: (path: CatalogNode[]) => void;
    onAdd?: (node: CatalogNode) => void;
    onBulkAdd?: (node: CatalogNode) => void;
    level?: number;
}

function TreeItem({ node, allNodes, currentId, onSelect, onAdd, onBulkAdd, level = 0 }: TreeItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const children = allNodes.filter(n => n.parent_id === node.id);
    const isActive = currentId === node.id;
    const hasChildren = children.length > 0;

    const findPath = (targetNode: CatalogNode): CatalogNode[] => {
        const path = [targetNode];
        let current = targetNode;
        while (current.parent_id) {
            const parent = allNodes.find(n => n.id === current.parent_id);
            if (!parent) break;
            path.unshift(parent);
            current = parent;
        }
        return path;
    };

    return (
        <div className="select-none">
            <div 
                className={cn(
                    "group flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition-all border border-transparent",
                    isActive ? "bg-luxury-gold/10 border-luxury-gold/20 text-luxury-gold" : "hover:bg-white/5 text-muted-foreground hover:text-white"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onSelect(findPath(node))}
            >
                <div onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="p-0.5 hover:bg-white/10 rounded">
                    {hasChildren ? (
                        <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-90")} />
                    ) : (
                        <div className="w-3" />
                    )}
                </div>
                <span className={cn("text-xs font-medium truncate", isActive && "font-bold")}>{node.label}</span>
                <span className="opacity-0 group-hover:opacity-40 text-[8px] uppercase tracking-tighter ml-auto">{node.type}</span>
                
                {/* QUICK ADD ICON */}
                {onAdd && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAdd(node); }}
                        title="Ajouter un enfant"
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-luxury-gold hover:text-white rounded transition-all ml-1"
                    >
                        <Plus className="w-2.5 h-2.5" />
                    </button>
                )}

                {/* BULK ADD ICON */}
                {onBulkAdd && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onBulkAdd(node); }}
                        title={`Bulk Add (Children: ${children.length})`}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-600 hover:text-white rounded transition-all ml-1 flex items-center gap-1"
                    >
                        <Layers className="w-2.5 h-2.5" />
                        <span className="text-[6px] font-bold">BULK ({children.length})</span>
                    </button>
                )}
            </div>
            
            {isExpanded && hasChildren && (
                <div className="animate-in slide-in-from-left-1 duration-200">
                    {children.map(child => (
                        <TreeItem 
                            key={child.id} 
                            node={child} 
                            allNodes={allNodes} 
                            currentId={currentId} 
                            onSelect={onSelect}
                            onAdd={onAdd}
                            onBulkAdd={onBulkAdd}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ProductCatalog() {
    const navigate = useNavigate();
    const { role, isAdmin } = useAuth();
    const queryClient = useQueryClient();
    const canManage = isAdmin || role === 'secretary' || role === 'admin';

    // Navigation and Search state
    const [currentPath, setCurrentPath] = useState<CatalogNode[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const currentId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

    // Queries
    const { data: allNodes = [], isLoading: isFullLoading } = useQuery({
        queryKey: ['catalog-full-tree'],
        queryFn: () => apiCatalog.getFullTree(),
        enabled: canManage
    });

    const filteredSearch = allNodes.filter(node => 
        searchTerm.length > 1 && node.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Debug log for allNodes
    React.useEffect(() => {
        if (allNodes.length > 0) {
            console.log(`[ProductCatalog] Loaded ${allNodes.length} nodes for the tree.`);
        }
    }, [allNodes.length]);

    const currentParentId = currentId;
    const { data: nodes = [], isLoading } = useQuery({
        queryKey: ['catalog-nodes', currentParentId],
        queryFn: () => apiCatalog.getNodes(currentParentId)
    });

    // Add Node state
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newNode, setNewNode] = useState({
        label: '',
        type: '',
        description: '',
        image_url: '',
        price: 0,
        sort_order: 0,
        specs: {}
    });
    const [propagateAll, setPropagateAll] = useState(false);

    // Edit Node state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<CatalogNode | null>(null);

    // Bulk Add state
    const [bulkParentNodes, setBulkParentNodes] = useState<CatalogNode[]>([]);
    const isBulkMode = bulkParentNodes.length > 0;

    // Mutations
    const addNodeMutation = useMutation({
        mutationFn: (data: any) => {
            if (isBulkMode) {
                return apiCatalog.bulkCreateNode(bulkParentNodes.map(n => n.id), data);
            }
            return apiCatalog.createNode({
                ...data,
                parent_id: currentParentId
            });
        },
        onSuccess: async (data: any) => {
            if (propagateAll) {
                const nodeToPropagateId = Array.isArray(data) ? data[0]?.id : data?.id;
                if (nodeToPropagateId) {
                    try {
                        await apiCatalog.propagateNode(nodeToPropagateId);
                    } catch (err) {
                        console.error("Propagation failed:", err);
                        alert("L'ajout a réussi, mais la synchronisation globale a échoué.");
                    }
                }
            }
            queryClient.invalidateQueries({ queryKey: ['catalog-nodes', currentParentId] });
            queryClient.invalidateQueries({ queryKey: ['catalog-full-tree'] });
            setIsAddDialogOpen(false);
            setBulkParentNodes([]);
            setNewNode({ label: '', type: '', description: '', image_url: '', price: 0, sort_order: 0, specs: {} });
            setPropagateAll(false);
        }
    });

    const updateNodeMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<CatalogNode> }) => 
            apiCatalog.updateNode(id, updates),
        onSuccess: async (_, { id }) => {
            if (propagateAll) {
                try {
                    await apiCatalog.propagateNode(id);
                } catch (err) {
                    console.error("Propagation failed:", err);
                    alert("La modification a réussi, mais la synchronisation aux autres modèles a échoué.");
                }
            }
            queryClient.invalidateQueries({ queryKey: ['catalog-nodes', currentParentId] });
            queryClient.invalidateQueries({ queryKey: ['catalog-full-tree'] });
            setIsEditDialogOpen(false);
            setEditingNode(null);
            setPropagateAll(false);
        }
    });

    const deleteNodeMutation = useMutation({
        mutationFn: apiCatalog.deleteNode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog-nodes', currentParentId] });
            queryClient.invalidateQueries({ queryKey: ['catalog-full-tree'] });
        }
    });

    const handleEditClick = (e: React.MouseEvent, node: CatalogNode) => {
        e.stopPropagation();
        setEditingNode(node);
        setIsEditDialogOpen(true);
    };

    const handleQuickAdd = (node: CatalogNode) => {
        // Find path to this node to set it as current context
        const path = [node];
        let current = node;
        while (current.parent_id) {
            const parent = allNodes.find(n => n.id === current.parent_id);
            if (!parent) break;
            path.unshift(parent);
            current = parent;
        }
        setCurrentPath(path);
        setBulkParentNodes([]); // Ensure not in bulk mode
        setIsAddDialogOpen(true);
    };

    const handleBulkAdd = (parentCategoryNode: CatalogNode) => {
        const childrenNodes = allNodes.filter(n => n.parent_id === parentCategoryNode.id);
        if (childrenNodes.length === 0) {
            alert("Cette catégorie n'a pas d'enfants. Utilisez l'ajout classique (+).");
            return;
        }
        setBulkParentNodes(childrenNodes);
        setIsAddDialogOpen(true);
    };

    const handleNavigate = (node: CatalogNode) => {
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
                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/dashboard/resources')}
                        className="w-fit text-muted-foreground hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Menu Ressources
                    </Button>
                    <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-mono">v3.4.7</span>
                </div>

                <div className="flex gap-2">
                    <Button 
                        variant="outline"
                        onClick={() => navigate('/dashboard/resources/calculator')}
                        className="border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10"
                    >
                        <Calculator className="w-4 h-4 mr-2" /> Flash Quote
                    </Button>

                    {canManage && (
                        <Button 
                            onClick={() => setIsAddDialogOpen(true)}
                            className="bg-luxury-gold hover:bg-yellow-600 text-white shadow-lg shadow-luxury-gold/10"
                        >
                            <Plus className="w-4 h-4 mr-2" /> 
                            Ajouter option
                        </Button>
                    )}
                </div>
            </div>

            {/* Layout Wrapper */}
            <div className="flex gap-8 relative min-h-[70vh]">
                
                {/* SIDEBAR TREE */}
                <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden h-fit sticky top-24">
                    <div className="flex items-center justify-between items-center mb-6 px-1">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-luxury-gold" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Explorateur</h2>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="relative">
                            <Input 
                                placeholder="Rechercher..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border-white/10 text-xs h-9 pl-8"
                            />
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[50vh]">
                        {isFullLoading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-4 h-4 animate-spin text-luxury-gold/40" />
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {allNodes.filter(n => !n.parent_id).map(root => (
                                    <TreeItem 
                                        key={root.id} 
                                        node={root} 
                                        allNodes={allNodes} 
                                        currentId={currentId} 
                                        onSelect={setCurrentPath}
                                        onAdd={handleQuickAdd}
                                        onBulkAdd={handleBulkAdd}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {searchTerm.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-luxury-gold mb-2 font-bold">Résultats</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredSearch.map(res => (
                                    <button 
                                        key={res.id}
                                        onClick={() => {
                                            const path = [res];
                                            let current = res;
                                            while (current.parent_id) {
                                                const parent = allNodes.find(n => n.id === current.parent_id);
                                                if (!parent) break;
                                                path.unshift(parent);
                                                current = parent;
                                            }
                                            setCurrentPath(path);
                                            setSearchTerm('');
                                        }}
                                        className="w-full text-left text-[11px] py-1.5 px-2 hover:bg-white/5 rounded text-muted-foreground hover:text-white truncate flex items-center gap-2"
                                    >
                                        <div className="w-1 h-1 rounded-full bg-luxury-gold/50" />
                                        {res.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 space-y-6">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center flex-wrap gap-2 text-sm bg-white/5 border border-white/10 p-2 rounded-xl">
                        <button 
                            onClick={() => handleBreadcrumb('home')}
                            className={`flex items-center gap-1 hover:text-luxury-gold transition-colors ${currentPath.length === 0 ? 'text-luxury-gold font-bold' : 'text-muted-foreground'}`}
                        >
                            <Home className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-widest">Catalogue</span>
                        </button>
                        {currentPath.map((node, i) => (
                            <div key={node.id} className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                                <button 
                                    onClick={() => handleBreadcrumb(i)}
                                    className={`text-xs uppercase tracking-widest hover:text-luxury-gold transition-colors ${i === currentPath.length - 1 ? 'text-luxury-gold font-bold underline decoration-luxury-gold/30 underline-offset-4' : 'text-muted-foreground'}`}
                                >
                                    {node.label}
                                </button>
                            </div>
                        ))}
                    </nav>

                    <header className="relative">
                        <div className="absolute -top-10 -left-10 w-48 h-48 bg-luxury-gold/5 rounded-full blur-[60px] -z-10" />
                        <h1 className="text-4xl font-serif text-white flex items-center gap-3 lowercase first-letter:uppercase">
                            {currentPath.length === 0 ? "Nos Produits" : currentPath[currentPath.length - 1].label}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            {currentPath.length > 0 && (
                                <span className="bg-luxury-gold/10 text-luxury-gold px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-luxury-gold/20">
                                    {currentPath[currentPath.length - 1].type}
                                </span>
                            )}
                            <p className="text-muted-foreground italic text-sm font-serif">
                                {currentPath.length === 0 
                                    ? "Sélectionnez une catégorie pour commencer" 
                                    : currentPath[currentPath.length - 1].description || "Aucune description"
                                }
                            </p>
                        </div>
                    </header>

                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {isLoading ? (
                            <div className="col-span-full flex h-64 items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
                            </div>
                        ) : nodes.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <Plus className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                <h3 className="text-xl font-serif text-muted-foreground">Cette section est vide</h3>
                                {canManage && <p className="text-sm text-muted-foreground mt-2">Cliquez sur "Ajouter option" pour garnir ce niveau.</p>}
                            </div>
                        ) : (
                            nodes.map((node) => (
                                <Card 
                                    key={node.id} 
                                    onClick={() => handleNavigate(node)}
                                    className="group relative overflow-hidden bg-white/5 border-white/5 hover:border-luxury-gold/30 transition-all duration-500 cursor-pointer shadow-none hover:shadow-2xl hover:shadow-luxury-gold/5"
                                >
                                    {/* Actions Overlay */}
                                    {canManage && (
                                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <Button 
                                                variant="secondary" 
                                                size="icon" 
                                                className="h-8 w-8 bg-black/60 backdrop-blur-md border-white/10 hover:bg-white/10"
                                                onClick={(e) => handleEditClick(e, node)}
                                            >
                                                <Pencil className="w-3.5 h-3.5 text-white" />
                                            </Button>
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                className="h-8 w-8 bg-red-500/80 hover:bg-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(confirm('Supprimer cet élément et tous ses sous-éléments?')) deleteNodeMutation.mutate(node.id);
                                                }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )}

                                    <div className="aspect-[4/3] relative flex items-center justify-center bg-zinc-900/40">
                                        {node.image_url ? (
                                            <img 
                                                src={node.image_url} 
                                                alt={node.label} 
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground/20">
                                                <ImageIcon className="w-8 h-8" />
                                                <span className="text-[8px] uppercase tracking-[0.3em]">{node.type}</span>
                                            </div>
                                        )}
                                        
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                                        <div className="absolute bottom-4 left-4">
                                            <span className="text-[8px] uppercase tracking-[0.2em] text-luxury-gold font-bold">
                                                {node.type}
                                            </span>
                                        </div>
                                    </div>

                                    <CardHeader className="p-5">
                                        <CardTitle className="font-serif text-xl text-white/90 group-hover:text-luxury-gold transition-colors flex items-center justify-between">
                                            {node.label}
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                        </CardTitle>
                                        
                                        <div className="flex items-center justify-between mt-4">
                                            {node.price && node.price > 0 ? (
                                                <div className="text-lg font-serif text-luxury-gold/90">
                                                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(node.price)}
                                                </div>
                                            ) : (
                                                <div className="h-6" />
                                            )}
                                            
                                            <div className="flex gap-1">
                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <div className="w-1 h-1 rounded-full bg-white/30" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Add Node Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) setBulkParentNodes([]);
            }}>
                <DialogContent className="max-w-md bg-zinc-950 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-white">
                            Ajouter une variation
                        </DialogTitle>
                        <DialogDescription>
                            {isBulkMode ? (
                                <div className="bg-blue-600/10 border border-blue-600/20 p-2 rounded-lg mt-2">
                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Layers className="w-3 h-3" /> Mode Groupé (Bulk)
                                    </p>
                                    <p className="text-xs text-blue-200 mt-1">
                                        Cet élément sera ajouté à <strong>{bulkParentNodes.length}</strong> modèles enfants.
                                    </p>
                                </div>
                            ) : (
                                <>Cet élément sera ajouté sous : <span className="text-luxury-gold font-bold">{currentParentId ? currentPath[currentPath.length - 1].label : 'Racine'}</span></>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4 px-2 overflow-y-auto max-h-[60vh]">
                        <div className="space-y-2">
                            <Label>Nom / Label</Label>
                            <Input 
                                placeholder="ex: 1.5ct, Or 18k, Oval Cut..." 
                                value={newNode.label}
                                onChange={(e) => setNewNode({...newNode, label: e.target.value})}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="flex items-center justify-between">
                                Type de variation
                                <span className="text-[10px] text-luxury-gold uppercase tracking-tighter">Crucial</span>
                            </Label>
                            <Input 
                                placeholder="ex: style, carat, metal, model..." 
                                value={newNode.type}
                                onChange={(e) => setNewNode({...newNode, type: e.target.value.toLowerCase()})}
                                className="bg-white/5 border-white/10"
                            />
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {['model', 'style', 'carat', 'metal', 'color'].map(t => (
                                    <button 
                                        key={t}
                                        type="button"
                                        onClick={() => setNewNode({...newNode, type: t})}
                                        className={cn(
                                            "px-2 py-1 rounded-md text-[9px] uppercase tracking-widest border transition-all",
                                            newNode.type === t ? "bg-luxury-gold/20 border-luxury-gold text-luxury-gold" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground italic leading-tight">
                                Le type définit le nom de la ligne dans le calculateur. Utilisez des minuscules et des underscores (ex: `metal_color`).
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea 
                                placeholder="Détails descriptifs (optionnel)..." 
                                className="bg-white/5 border-white/10"
                                value={newNode.description}
                                onChange={(e) => setNewNode({...newNode, description: e.target.value})}
                            />
                        </div>

                        {/* Image Uploader for all types */}
                        <ImageUploader 
                            label="Image de l'élément"
                            value={newNode.image_url}
                            onChange={(url) => setNewNode({...newNode, image_url: url})}
                        />

                        {/* Price field for all types */}
                        <div className="space-y-2">
                            <Label>Prix par défaut (CAD)</Label>
                            <Input 
                                type="number"
                                placeholder="0.00" 
                                value={newNode.price}
                                onChange={(e) => setNewNode({...newNode, price: parseFloat(e.target.value) || 0})}
                            />
                            <p className="text-[10px] text-muted-foreground italic">
                                Ce prix sera cumulé dans le Flash Quote.
                            </p>
                        </div>

                        {/* Bulk Propagation Checkbox */}
                        {currentPath.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-luxury-gold/5 rounded-xl border border-luxury-gold/20">
                                <input 
                                    type="checkbox" 
                                    id="propagateAdd"
                                    checked={propagateAll}
                                    onChange={(e) => setPropagateAll(e.target.checked)}
                                    className="w-4 h-4 accent-luxury-gold"
                                />
                                <Label htmlFor="propagateAdd" className="cursor-pointer text-xs font-bold text-luxury-gold uppercase tracking-widest">
                                    Synchroniser cet élément avec les autres parents du même type
                                </Label>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-2">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                        <Button 
                            className="bg-luxury-gold text-white"
                            onClick={() => addNodeMutation.mutate(newNode)}
                            disabled={!newNode.label || !newNode.type || addNodeMutation.isPending}
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
                        <DialogDescription className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span>Type : <span className="text-luxury-gold uppercase tracking-widest text-xs font-bold">{editingNode?.type}</span></span>
                            </div>
                            <div className="bg-luxury-gold/5 p-3 rounded-lg border border-luxury-gold/10">
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                    <Info className="w-3 h-3 text-luxury-gold" />
                                    Le "Type" détermine comment cet élément est groupé et nommé dans le calculateur.
                                </p>
                            </div>
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

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea 
                                    className="bg-white/5 border-white/10"
                                    value={editingNode.description || ''}
                                    onChange={(e) => setEditingNode({...editingNode, description: e.target.value})}
                                />
                            </div>

                             {/* Image Uploader for all types */}
                             <ImageUploader 
                                 label="Image de l'élément"
                                 value={editingNode.image_url}
                                 onChange={(url) => setEditingNode({...editingNode, image_url: url})}
                             />

                            {/* Price field for all types */}
                            <div className="space-y-2">
                                <Label>Prix par défaut (CAD)</Label>
                                <Input 
                                    className="bg-white/5 border-white/10"
                                    type="number"
                                    value={editingNode.price || 0}
                                    onChange={(e) => setEditingNode({...editingNode, price: parseFloat(e.target.value) || 0})}
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Ce prix sera cumulé dans le Flash Quote.
                                </p>
                            </div>

                            {/* Bulk Propagation Checkbox */}
                            {currentPath.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-luxury-gold/5 rounded-xl border border-luxury-gold/20">
                                    <input 
                                        type="checkbox" 
                                        id="propagateEdit"
                                        checked={propagateAll}
                                        onChange={(e) => setPropagateAll(e.target.checked)}
                                        className="w-4 h-4 accent-luxury-gold"
                                    />
                                    <Label htmlFor="propagateEdit" className="cursor-pointer text-xs font-bold text-luxury-gold uppercase tracking-widest">
                                        Synchroniser ce changement sur les éléments similaires
                                    </Label>
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

