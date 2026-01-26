
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
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-luxury-gold">{client.full_name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="uppercase text-xs tracking-wider">Client Profile</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>{client.status.toUpperCase()}</Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span>{client.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{client.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>No address on file</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Client since {new Date(client.created_at).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{client.notes || 'No private notes added.'}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
