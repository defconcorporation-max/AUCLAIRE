import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCatalog } from '@/services/apiCatalog';
import { useAuth } from '@/context/AuthContext';
import { 
    Search, 
    Plus, 
    ArrowLeft, 
    ShoppingBag, 
    Info, 
    Tag,
    ChevronRight,
    Loader2,
    Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProductCatalog() {
    const navigate = useNavigate();
    const { role, isAdmin } = useAuth();
    const queryClient = useQueryClient();
    const canManage = isAdmin || role === 'secretary' || role === 'admin';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Queries
    const { data: categories = [] } = useQuery({
        queryKey: ['catalog-categories'],
        queryFn: apiCatalog.getCategories
    });

    const { data: items = [], isLoading: isLoadingItems } = useQuery({
        queryKey: ['catalog-items', selectedCategory],
        queryFn: () => apiCatalog.getItems(selectedCategory === 'all' ? undefined : selectedCategory)
    });

    // Mutations
    const addItemMutation = useMutation({
        mutationFn: apiCatalog.createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalog-items'] });
            setIsAddDialogOpen(false);
            setNewItem({
                name: '',
                description: '',
                base_price: 0,
                category_id: '',
                image_url: '',
                specs: {}
            });
        }
    });

    // Form State
    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        base_price: 0,
        category_id: '',
        image_url: '',
        specs: {}
    });

    const filteredItems = items.filter((item: any) => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddItem = () => {
        addItemMutation.mutate(newItem);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/dashboard/resources')}
                    className="w-fit text-muted-foreground hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </Button>

                <div className="flex items-center gap-3">
                    {canManage && (
                        <Button 
                            onClick={() => setIsAddDialogOpen(true)}
                            className="bg-luxury-gold hover:bg-yellow-600 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Ajouter un Modèle
                        </Button>
                    )}
                </div>
            </div>

            <header className="relative">
                <div className="absolute -top-10 -left-10 w-48 h-48 bg-luxury-gold/5 rounded-full blur-[60px] -z-10" />
                <h1 className="text-4xl font-serif text-white flex items-center gap-3">
                    <ShoppingBag className="text-luxury-gold" />
                    Catalogue & Estimations
                </h1>
                <p className="text-muted-foreground mt-2 font-serif italic">
                    Explorez les modèles Auclaire et estimez les prix pour vos clients.
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="w-full lg:w-64 space-y-6">
                    <div className="space-y-4">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Recherche</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                placeholder="Nom, description..." 
                                className="pl-9 bg-white/5 border-white/10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Catégories</Label>
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                    selectedCategory === 'all' 
                                    ? 'bg-luxury-gold/20 text-luxury-gold font-bold' 
                                    : 'hover:bg-white/5 text-muted-foreground'
                                }`}
                            >
                                Tous les produits
                                <ChevronRight className={`w-4 h-4 ${selectedCategory === 'all' ? 'opacity-100' : 'opacity-0'}`} />
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                                        selectedCategory === cat.id 
                                        ? 'bg-luxury-gold/20 text-luxury-gold font-bold' 
                                        : 'hover:bg-white/5 text-muted-foreground'
                                    }`}
                                >
                                    {cat.name}
                                    <ChevronRight className={`w-4 h-4 ${selectedCategory === cat.id ? 'opacity-100' : 'opacity-0'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="flex-1">
                    {isLoadingItems ? (
                        <div className="flex h-64 items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-serif">Aucun modèle trouvé</h3>
                            <p className="text-muted-foreground text-sm mt-1">Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredItems.map((item: any) => (
                                <Card key={item.id} className="group overflow-hidden bg-white/5 border-white/10 hover:border-luxury-gold/30 transition-all duration-500 shadow-xl">
                                    <div className="aspect-square relative overflow-hidden bg-zinc-900 flex items-center justify-center">
                                        {item.image_url ? (
                                            <img 
                                                src={item.image_url} 
                                                alt={item.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                                                <ImageIcon className="w-12 h-12" />
                                                <span className="text-[10px] uppercase tracking-widest">Image à venir</span>
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-luxury-gold font-serif">
                                                {item.category?.name}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="p-4 pb-2">
                                        <CardTitle className="font-serif text-xl group-hover:text-luxury-gold transition-colors">
                                            {item.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-4">
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {item.description || "Aucune description fournie."}
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">À partir de</span>
                                                <span className="text-lg font-bold font-serif text-luxury-gold">
                                                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(item.base_price)}
                                                </span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10">
                                                <Info className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Item Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-white">Ajouter un Modèle</DialogTitle>
                        <DialogDescription>Remplissez les détails pour ajouter un nouveau modèle au catalogue.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 px-4 overflow-y-auto max-h-[70vh]">
                        <div className="space-y-2">
                            <Label>Nom du Modèle</Label>
                            <Input 
                                placeholder="ex: Solitaire Classique" 
                                value={newItem.name}
                                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Catégorie</Label>
                            <Select 
                                onValueChange={(val) => setNewItem({ ...newItem, category_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea 
                                placeholder="Détails, matériaux, style..." 
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Prix de Base (CAD)</Label>
                                <Tag className="w-3 h-3 text-luxury-gold" />
                            </div>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={newItem.base_price}
                                onChange={(e) => setNewItem({ ...newItem, base_price: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL de l'Image</Label>
                            <Input 
                                placeholder="https://..." 
                                value={newItem.image_url}
                                onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-4">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                        <Button 
                            className="bg-luxury-gold text-white"
                            onClick={handleAddItem}
                            disabled={addItemMutation.isPending || !newItem.name || !newItem.category_id}
                        >
                            {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
