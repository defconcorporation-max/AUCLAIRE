
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClients } from '@/services/apiClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MapPin, Calendar } from 'lucide-react';

export default function ClientDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: apiClients.getAll
    });

    const client = clients?.find(c => c.id === id) || clients?.[0];

    if (!client) return <div>Client not found</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white tracking-wide">{client.full_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-luxury-gold mt-1">
                        <span className="uppercase text-[10px] tracking-[0.2em] font-medium">Client Profile</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Badge variant="outline" className={`border-luxury-gold/50 tracking-widest uppercase text-[10px] ${client.status === 'active' ? 'bg-luxury-gold/10 text-luxury-gold' : 'text-gray-500 border-white/10'}`}>
                        {client.status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-luxury-gold/30 transition-colors duration-500 shadow-xl group">
                    <CardHeader className="pb-4 border-b border-white/5">
                        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-luxury-gold">Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                        <div className="flex items-center gap-4 text-sm group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Mail className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-300">{client.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Phone className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-300">{client.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-300">No address on file</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm group-hover:text-white transition-colors">
                            <div className="p-2 rounded-full bg-white/5 text-luxury-gold/70 group-hover:bg-luxury-gold/10 group-hover:text-luxury-gold transition-colors">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-300">Created {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 bg-black/40 backdrop-blur-md border-white/5 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 to-transparent pointer-events-none" />
                    <CardHeader className="pb-4 border-b border-white/5 relative z-10">
                        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-luxury-gold">Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 relative z-10">
                        <p className="text-sm text-gray-400 font-serif leading-relaxed italic">{client.notes || 'No private notes added.'}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
