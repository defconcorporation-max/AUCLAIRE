import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiSuppliers, Supplier } from '@/services/apiSuppliers';
import { apiActivities } from '@/services/apiActivities';
import { apiUsers, UserProfile } from '@/services/apiUsers';
import { apiProjects } from '@/services/apiProjects';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, Pencil, Star, Factory, Briefcase, ArrowUpDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

function StarRating({ value }: { value?: number }) {
    const rating = Math.min(5, Math.max(0, value ?? 0));
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${i <= rating ? 'fill-luxury-gold text-luxury-gold' : 'text-zinc-500/50'}`}
                />
            ))}
        </div>
    );
}

export default function SuppliersList() {
    const { t } = useTranslation();
    const { profile } = useAuth();

    const supplierTypeOptions = useMemo(
        () =>
            [
                { value: 'diamantaire' as const, label: t('suppliersPage.type_diamantaire') },
                { value: 'fondeur' as const, label: t('suppliersPage.type_fondeur') },
                { value: 'sertisseur' as const, label: t('suppliersPage.type_sertisseur') },
                { value: 'graveur' as const, label: t('suppliersPage.type_graveur') },
                { value: 'other' as const, label: t('suppliersPage.type_other') },
            ],
        [t]
    );

    const supplierTypeLabel = (type: string) =>
        t(`suppliersPage.type_${type}` as 'suppliersPage.type_other', { defaultValue: type });
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [filterType, setFilterType] = useState('');
    const [sortField, setSortField] = useState<'name' | 'type' | 'rating'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        type: 'other',
        contact_name: '',
        email: '',
        phone: '',
        notes: '',
        rating: 0,
    });

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'other',
            contact_name: '',
            email: '',
            phone: '',
            notes: '',
            rating: 0,
        });
        setEditingSupplier(null);
    };

    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: apiSuppliers.getAll,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll,
    });

    const { data: projects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll,
    });

    const manufacturers = users.filter((u: UserProfile) => u.role === 'manufacturer');
    const getManufacturerProjects = (mId: string) => projects.filter(p => p.manufacturer_id === mId);
    const getActiveCount = (mId: string) => getManufacturerProjects(mId).filter(p => !['completed', 'cancelled'].includes(p.status)).length;
    const getCompletedCount = (mId: string) => getManufacturerProjects(mId).filter(p => p.status === 'completed').length;

    const createMutation = useMutation({
        mutationFn: apiSuppliers.create,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            apiActivities.log({
                user_id: profile?.id || 'admin',
                user_name: profile?.full_name || 'Admin',
                action: 'create',
                details: `Added supplier: ${variables.name}`,
            });
            setIsAddOpen(false);
            resetForm();
        },
        onError: (error) => {
            console.error('Failed to create supplier:', error);
            toast({ title: t('common.error'), description: (error as Error).message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Supplier> }) =>
            apiSuppliers.update(id, updates),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            apiActivities.log({
                user_id: profile?.id || 'admin',
                user_name: profile?.full_name || 'Admin',
                action: 'update',
                details: `Updated supplier: ${variables.updates.name}`,
            });
            setEditingSupplier(null);
            resetForm();
        },
        onError: (error) => {
            console.error('Failed to update supplier:', error);
            toast({ title: t('common.error'), description: (error as Error).message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: apiSuppliers.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            apiActivities.log({
                user_id: profile?.id || 'admin',
                user_name: profile?.full_name || 'Admin',
                action: 'delete',
                details: 'Deleted a supplier',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            updateMutation.mutate({
                id: editingSupplier.id,
                updates: {
                    ...formData,
                    rating: formData.rating ?? 0,
                },
            });
        } else {
            createMutation.mutate({
                ...formData,
                rating: formData.rating ?? 0,
            });
        }
    };

    const openEdit = (s: Supplier) => {
        setEditingSupplier(s);
        setFormData({
            name: s.name,
            type: s.type,
            contact_name: s.contact_name ?? '',
            email: s.email ?? '',
            phone: s.phone ?? '',
            notes: s.notes ?? '',
            rating: s.rating ?? 0,
        });
    };

    const handleSort = (field: 'name' | 'type' | 'rating') => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const filteredSuppliers = suppliers
        ?.filter((s) =>
            (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.type?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterType === '' || s.type === filterType)
        )
        ?.sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            if (sortField === 'name') {
                return dir * (a.name || '').localeCompare(b.name || '');
            }
            if (sortField === 'type') {
                return dir * (a.type || '').localeCompare(b.type || '');
            }
            return dir * ((a.rating ?? 0) - (b.rating ?? 0));
        });

    const totalPages = Math.ceil((filteredSuppliers?.length || 0) / ITEMS_PER_PAGE);
    const paginatedSuppliers = filteredSuppliers?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const isFormOpen = isAddOpen || !!editingSupplier;
    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-luxury-gold">{t('suppliersPage.title')}</h1>
                    <p className="text-muted-foreground">{t('suppliersPage.subtitle')}</p>
                </div>

                <Button
                    className="bg-luxury-gold text-black hover:bg-luxury-gold/90 gap-2"
                    onClick={() => {
                        resetForm();
                        setIsAddOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4" /> {t('suppliersPage.addSupplier')}
                </Button>
            </div>

            {/* Manufacturers (Ateliers) Section */}
            {manufacturers.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-serif text-luxury-gold flex items-center gap-2">
                        <Factory className="w-5 h-5" /> {t('suppliersPage.workshopsTitle')}
                    </h2>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {manufacturers.map((m: UserProfile) => {
                            const active = getActiveCount(m.id);
                            const completed = getCompletedCount(m.id);
                            return (
                                <Card key={m.id} className="glass-card border-white/10 hover:border-luxury-gold/30 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold font-serif text-lg font-bold">
                                                {m.full_name?.[0] || 'M'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{m.full_name}</p>
                                                {m.email && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <Briefcase className="w-3 h-3 text-amber-400" />
                                                <span className="text-muted-foreground">{t('suppliersPage.active')}</span>
                                                <span className="font-bold">{active}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-muted-foreground">{t('suppliersPage.completed')}</span>
                                                <span className="font-bold text-green-400">{completed}</span>
                                            </div>
                                        </div>
                                        {m.specialty && m.specialty.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {m.specialty.map((s, i) => (
                                                    <Badge key={i} variant="outline" className="text-[10px] border-luxury-gold/20 text-luxury-gold/80">{s}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="flex gap-2 items-center glass-card p-2 rounded-lg border border-white/5 dark:border-white/5">
                <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                    value={filterType}
                    onChange={e => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                    }}
                >
                    <option value="">{t('suppliersPage.filterAll')}</option>
                    {supplierTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <Search className="w-4 h-4 text-muted-foreground ml-2" />
                <Input
                    placeholder={t('suppliersPage.searchPlaceholder')}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Suppliers Table */}
            <Card className="glass-card border-none overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent">
                                <TableHead className="text-luxury-gold/80 cursor-pointer select-none" onClick={() => handleSort('name')}>
                                    <span className="inline-flex items-center gap-1">
                                        {t('suppliersPage.colName')}
                                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'name' ? 'text-luxury-gold' : 'text-muted-foreground/50'}`} />
                                    </span>
                                </TableHead>
                                <TableHead className="text-luxury-gold/80 cursor-pointer select-none" onClick={() => handleSort('type')}>
                                    <span className="inline-flex items-center gap-1">
                                        {t('suppliersPage.colType')}
                                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'type' ? 'text-luxury-gold' : 'text-muted-foreground/50'}`} />
                                    </span>
                                </TableHead>
                                <TableHead className="text-luxury-gold/80">{t('suppliersPage.colContact')}</TableHead>
                                <TableHead className="text-luxury-gold/80">{t('suppliersPage.colEmailPhone')}</TableHead>
                                <TableHead className="text-luxury-gold/80 cursor-pointer select-none" onClick={() => handleSort('rating')}>
                                    <span className="inline-flex items-center gap-1">
                                        {t('suppliersPage.colRating')}
                                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'rating' ? 'text-luxury-gold' : 'text-muted-foreground/50'}`} />
                                    </span>
                                </TableHead>
                                <TableHead className="w-[100px] text-luxury-gold/80"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        {t('suppliersPage.loading')}
                                    </TableCell>
                                </TableRow>
                            ) : filteredSuppliers?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        {t('suppliersPage.empty')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedSuppliers?.map((supplier) => (
                                    <TableRow
                                        key={supplier.id}
                                        className="border-white/5 hover:bg-white/5 dark:hover:bg-white/5"
                                    >
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="capitalize border-luxury-gold/30 text-luxury-gold/90 bg-luxury-gold/5"
                                            >
                                                {supplierTypeLabel(supplier.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{supplier.contact_name || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                {supplier.email && (
                                                    <span className="text-muted-foreground">{supplier.email}</span>
                                                )}
                                                {supplier.phone && (
                                                    <span>{supplier.phone}</span>
                                                )}
                                                {!supplier.email && !supplier.phone && '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StarRating value={supplier.rating} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-luxury-gold/80 hover:text-luxury-gold hover:bg-luxury-gold/10"
                                                    onClick={() => openEdit(supplier)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500/80 hover:text-red-500 hover:bg-red-500/10"
                                                    onClick={() => setDeleteTarget({ id: supplier.id, name: supplier.name })}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                        {t('suppliersPage.pageOf', { current: currentPage, total: totalPages, count: filteredSuppliers?.length ?? 0 })}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                            {t('common.previous')}
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                            if (page < 1 || page > totalPages) return null;
                            return (
                                <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm" className={page === currentPage ? 'bg-luxury-gold text-black' : ''} onClick={() => setCurrentPage(page)}>
                                    {page}
                                </Button>
                            );
                        })}
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                            {t('common.next')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <Sheet
                open={isFormOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddOpen(false);
                        setEditingSupplier(null);
                        resetForm();
                    }
                }}
            >
                <SheetContent className="overflow-y-auto border-l border-luxury-gold/20 bg-background">
                    <SheetHeader>
                        <SheetTitle className="text-luxury-gold">
                            {editingSupplier ? t('suppliersPage.sheetEdit') : t('suppliersPage.sheetNew')}
                        </SheetTitle>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                        <div className="space-y-2">
                            <Label>{t('suppliersPage.nameRequired')}</Label>
                            <Input
                                required
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('suppliersPage.namePlaceholder')}
                                className="border-white/10 focus-visible:ring-luxury-gold/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('suppliersPage.type')}</Label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({ ...formData, type: e.target.value as Supplier['type'] })
                                }
                            >
                                {supplierTypeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('suppliersPage.contact')}</Label>
                            <Input
                                value={formData.contact_name || ''}
                                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                placeholder={t('suppliersPage.contactPlaceholder')}
                                className="border-white/10 focus-visible:ring-luxury-gold/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('suppliersPage.email')}</Label>
                            <Input
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder={t('suppliersPage.emailPlaceholder')}
                                className="border-white/10 focus-visible:ring-luxury-gold/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('suppliersPage.phone')}</Label>
                            <Input
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder={t('suppliersPage.phonePlaceholder')}
                                className="border-white/10 focus-visible:ring-luxury-gold/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('suppliersPage.ratingLabel')}</Label>
                            <div className="flex gap-2 items-center">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: i })}
                                        className="p-1 rounded hover:bg-luxury-gold/10 transition-colors"
                                    >
                                        <Star
                                            className={`w-6 h-6 ${
                                                i <= (formData.rating ?? 0)
                                                    ? 'fill-luxury-gold text-luxury-gold'
                                                    : 'text-zinc-500/50'
                                            }`}
                                        />
                                    </button>
                                ))}
                                <span className="text-sm text-muted-foreground ml-2">
                                    {(formData.rating ?? 0)} / 5
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('suppliersPage.notes')}</Label>
                            <textarea
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder={t('suppliersPage.notesPlaceholder')}
                                rows={3}
                                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-luxury-gold text-black hover:bg-luxury-gold/90"
                            disabled={isPending}
                        >
                            {isPending
                                ? t('expensesPage.saving')
                                : editingSupplier
                                  ? t('suppliersPage.submitUpdate')
                                  : t('suppliersPage.submitSave')}
                        </Button>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{t('suppliersPage.deleteTitle')}</DialogTitle>
                        <DialogDescription>
                            {deleteTarget ? t('suppliersPage.deleteDesc', { name: deleteTarget.name }) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={() => { deleteMutation.mutate(deleteTarget!.id); setDeleteTarget(null); }}>{t('common.delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
