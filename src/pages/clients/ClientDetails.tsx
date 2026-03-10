
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClients } from '@/services/apiClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiUsers } from '@/services/apiUsers';

export default function ClientDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { role } = useAuth();

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClients.getAll
    });

    const client = clients?.find(c => c.id === id) || clients?.[0];

    if (!client) return <div>Client not found</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-black dark:text-white tracking-wide">{client.full_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-luxury-gold mt-1">
                        <span className="uppercase text-[10px] tracking-[0.2em] font-medium">Client Profile</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {role === 'admin' && (
                        <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 border-luxury-gold/50 text-luxury-gold hover:bg-luxury-gold hover:text-black">
                                    <KeyRound className="w-4 h-4" /> Reset Password
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Reset Client Password</DialogTitle>
                                    <DialogDescription>
                                        Enter a new password for {client.full_name}. They will be able to log in immediately with this new password.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Input
                                            id="new_password"
                                            type="text"
                                            placeholder="Enter new password (min 6 chars)..."
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        disabled={newPassword.length < 6 || isUpdatingPassword}
                                        onClick={async () => {
                                            if (!id) return;
                                            setIsUpdatingPassword(true);
                                            try {
                                                await apiUsers.adminUpdatePassword(id, newPassword);
                                                alert("Password updated successfully!");
                                                setIsPasswordModalOpen(false);
                                                setNewPassword('');
                                            } catch (err) {
                                                alert("Failed to update password. Did you run the Supabase RPC script? Error: " + err.message);
                                            } finally {
                                                setIsUpdatingPassword(false);
                                            }
                                        }}
                                    >
                                        {isUpdatingPassword ? 'Saving...' : 'Save Password'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                    <Badge variant="outline" className={`border-luxury-gold/50 tracking-widest uppercase text-[10px] ${client.status === 'active' ? 'bg-luxury-gold/10 text-luxury-gold' : 'text-gray-500 dark:text-gray-400 border-black/10 dark:border-white/10'}`}>
                        {client.status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-md border-black/10 dark:border-white/10 hover:border-luxury-gold/30 dark:hover:border-luxury-gold/30 transition-colors duration-500 shadow-xl group">
                    <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5">
                        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-luxury-gold">Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                        <div className="flex items-center gap-4 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{client.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Phone className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">{client.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">No address on file</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-black dark:group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-600 dark:text-gray-300">Created {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 to-transparent pointer-events-none" />
                    <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 relative z-10">
                        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-luxury-gold">Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-serif leading-relaxed italic">{client.notes || 'No private notes added.'}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
