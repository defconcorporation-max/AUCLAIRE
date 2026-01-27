
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClients } from '@/services/apiClients'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Plus, Search, Mail, Phone, MoreHorizontal } from 'lucide-react'
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

export default function ClientsList() {
    const { data: clients, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClients.getAll
    })
    const navigate = useNavigate()

    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('')
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null); // Client | null
    const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', notes: '' });

    const openCreateModal = () => {
        setEditingClient(null);
        setFormData({ full_name: '', email: '', phone: '', notes: '' });
        setIsClientModalOpen(true);
    };

    const openEditModal = (client: any) => {
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

    const filteredClients = clients?.filter(client =>
        client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-luxury-gold">Clients</h2>
                    <p className="text-muted-foreground">Manage your relationships.</p>
                </div>
                <Button
                    className="bg-luxury-gold text-black hover:bg-luxury-gold-dark"
                    onClick={openCreateModal}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Client
                </Button>
            </div>

            <div className="flex items-center space-x-2 w-full max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search clients..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div>Loading clients...</div>
                ) : filteredClients?.map(client => (
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
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => navigate(`/dashboard/clients/${client.id}`)}>View Details</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEditModal(client)}>Edit Client</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-500" onClick={async () => {
                                        if (confirm(`Are you sure you want to delete ${client.full_name}?`)) {
                                            try {
                                                await apiClients.delete(client.id);
                                                queryClient.invalidateQueries({ queryKey: ['clients'] });
                                            } catch (e) {
                                                console.error(e);
                                                alert("Failed to delete client. " + e.message);
                                            }
                                        }
                                    }}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-gray-400 mt-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    <span>{client.email || 'No email'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    <span>{client.phone || 'No phone'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>


            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingClient ? 'Edit Client' : 'New Client'}</DialogTitle>
                        <DialogDescription>
                            {editingClient ? 'Update client details below.' : 'Add a new client to your list.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsClientModalOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-luxury-gold text-black hover:bg-luxury-gold/90">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    )
}
