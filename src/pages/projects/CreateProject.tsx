
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Link, Calendar as CalendarIcon } from 'lucide-react';
import { apiProjects } from '@/services/apiProjects';
import { apiClients } from '@/services/apiClients';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ClientForm } from '@/components/forms/ClientForm';

export default function CreateProject() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [openNewClient, setOpenNewClient] = useState(false);

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClients.getAll
    });

    const [formData, setFormData] = useState({
        title: '',
        client_id: '',
        deadline: '',
        priority: 'normal'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newProject = await apiProjects.create({
                ...formData,
                priority: formData.priority as 'normal' | 'rush',
                deadline: formData.deadline ? formData.deadline : null,
                status: 'designing'
            });

            // Invalidate query to refresh list
            await queryClient.invalidateQueries({ queryKey: ['projects'] });

            navigate(`/dashboard/projects/${newProject.id}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred";
            toast({ title: "Failed to create project", description: message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-luxury-gold">New Project</h1>
                    <p className="text-sm text-muted-foreground">Start a new design journey.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                    <CardDescription>Define the scope and client.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Project Title</label>
                            <Input
                                name="title"
                                placeholder="e.g. Engage Ring for Sarah"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Client</label>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="h-auto p-0 text-xs text-luxury-gold"
                                    onClick={() => setOpenNewClient(true)}
                                >
                                    + New Client
                                </Button>
                            </div>
                            <div className="relative">
                                <Link className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <select
                                    className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    name="client_id"
                                    value={formData.client_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Client...</option>
                                    {clients?.map(c => (
                                        <option key={c.id} value={c.id}>{c.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Dialog open={openNewClient} onOpenChange={setOpenNewClient}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Client</DialogTitle>
                                    <DialogDescription>
                                        Create a new client profile instantly.
                                    </DialogDescription>
                                </DialogHeader>
                                <ClientForm
                                    onSuccess={async (newClient) => {
                                        setOpenNewClient(false);
                                        await queryClient.invalidateQueries({ queryKey: ['clients'] });
                                        setFormData(prev => ({ ...prev, client_id: newClient.id }));
                                    }}
                                />
                            </DialogContent>
                        </Dialog>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Deadline</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        type="date"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority</label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="rush">Rush 🚨</option>
                                </select>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-luxury-gold text-black hover:bg-luxury-gold-dark" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Project'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
