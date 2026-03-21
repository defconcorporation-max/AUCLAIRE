
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClients } from '@/services/apiClients'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Plus, Search, Mail, Phone, MoreHorizontal, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export default function ClientsList() {
    const { t } = useTranslation()
    const { data: clients, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClients.getAll
    })
    const navigate = useNavigate()

    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<typeof clients extends (infer T)[] | undefined ? T : never | null>(null);
    const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', notes: '' });
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const openCreateModal = () => {
        setEditingClient(null);
        setFormData({ full_name: '', email: '', phone: '', notes: '' });
        setIsClientModalOpen(true);
    };

    const openEditModal = (client: NonNullable<typeof clients>[number]) => {
        setEditingClient(client);
        setFormData({
            full_name: client.full_name,
            email: client.email || '',
            phone: client.phone || '',
            notes: client.notes || ''
        });
        setIsClientModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await apiClients.update(editingClient.id, formData);
            } else {
                await apiClients.create(formData);
            }
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsClientModalOpen(false);
        } catch (error) {
            console.error("Failed to save client", error);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await apiClients.delete(deleteTarget.id);
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        } catch (e: unknown) {
            console.error(e);
            toast({
                title: t('common.error'),
                description: `${t('clientsPage.deleteFailed')} ${e instanceof Error ? e.message : ''}`.trim(),
                variant: "destructive"
            });
        } finally {
            setDeleteTarget(null);
        }
    };

    const filteredClients = clients?.filter(client =>
        client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalPages = Math.ceil((filteredClients?.length || 0) / ITEMS_PER_PAGE);
    const paginatedClients = filteredClients?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-luxury-gold">{t('clientsPage.title')}</h2>
                    <p className="text-muted-foreground">{t('clientsPage.subtitle')}</p>
                </div>
                <Button
                    className="bg-luxury-gold text-black hover:bg-luxury-gold-dark"
                    onClick={openCreateModal}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('clientsPage.newClient')}
                </Button>
            </div>

            <div className="flex items-center space-x-2 w-full max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('clientsPage.searchPlaceholder')}
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="shadow-sm animate-pulse">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-5 w-32 bg-muted rounded" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mt-2">
                                    <div className="h-4 w-48 bg-muted rounded" />
                                    <div className="h-4 w-36 bg-muted rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : filteredClients?.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Users className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-serif text-lg">{t('clientsPage.noClientsFound')}</p>
                        <p className="text-sm mt-1">{t('clientsPage.trySearchOrAdd')}</p>
                    </div>
                ) : paginatedClients?.map(client => (
                    <Card key={client.id} className="shadow-sm hover:border-luxury-gold transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">
                                {client.full_name}
                            </CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-luxury-gold">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => navigate(`/dashboard/clients/${client.id}`)}>{t('clientsPage.viewProfile')}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEditModal(client)}>{t('common.edit')}</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-red-500"
                                        onClick={() => setDeleteTarget({ id: client.id, name: client.full_name })}
                                    >
                                        {t('common.delete')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-gray-400 mt-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    <span>{client.email || t('common.noEmail')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    <span>{client.phone || t('common.noPhone')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                        {t('clientsPage.pageOf', { current: currentPage, total: totalPages, count: filteredClients?.length ?? 0 })}
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

            {/* Edit / Create Dialog */}
            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingClient ? t('clientsPage.editClient') : t('clientsPage.newClientDialog')}</DialogTitle>
                        <DialogDescription>
                            {editingClient ? t('clientsPage.editClientDesc') : t('clientsPage.newClientDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('clientsPage.fullName')}</Label>
                            <Input
                                id="name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('clientsPage.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">{t('clientsPage.phone')}</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)}>{t('common.cancel')}</Button>
                            <Button type="submit" className="bg-luxury-gold text-black hover:bg-luxury-gold/90">{t('common.save')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('clientsPage.confirmDeleteTitle')}</DialogTitle>
                        <DialogDescription>
                            {deleteTarget ? t('clientsPage.confirmDeleteDesc', { name: deleteTarget.name }) : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
