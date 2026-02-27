import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Phone, Mail, Facebook, Filter } from 'lucide-react';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: LeadStatus;
    source: 'facebook' | 'manual' | 'website';
    created_at: string;
    value?: number;
}

// Mock Data
export const mockLeads: Lead[] = [
    { id: '1', name: 'Alice Dupont', email: 'alice@example.com', phone: '+33 6 12 34 56 78', status: 'new', source: 'facebook', created_at: '2026-02-26T10:00:00Z', value: 1500 },
    { id: '2', name: 'Jean Martin', email: 'jean@example.com', phone: '+33 6 98 76 54 32', status: 'contacted', source: 'website', created_at: '2026-02-25T14:30:00Z', value: 2500 },
    { id: '3', name: 'Sophie Bernard', email: 'sophie@example.com', phone: '+33 6 11 22 33 44', status: 'qualified', source: 'manual', created_at: '2026-02-20T09:15:00Z', value: 3000 },
    { id: '4', name: 'Luc Petit', email: 'luc@example.com', phone: '+33 6 55 44 33 22', status: 'won', source: 'facebook', created_at: '2026-02-15T16:45:00Z', value: 1750 },
    { id: '5', name: 'Emma Roux', email: 'emma@example.com', phone: '+33 6 99 88 77 66', status: 'new', source: 'website', created_at: '2026-02-26T11:20:00Z' },
];

const parseStatus = (status: LeadStatus) => {
    switch (status) {
        case 'new': return { label: 'New Lead', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
        case 'contacted': return { label: 'Contacted', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
        case 'qualified': return { label: 'Qualified', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
        case 'won': return { label: 'Won', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
        case 'lost': return { label: 'Lost', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
        default: return { label: 'Unknown', color: 'bg-gray-500/10 text-gray-500' };
    }
};

const parseSourceIcon = (source: string) => {
    switch (source) {
        case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
        case 'website': return <Filter className="w-4 h-4 text-purple-500" />;
        default: return <Plus className="w-4 h-4 text-gray-500" />;
    }
};

export default function LeadsDashboard() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const navigate = useNavigate();

    const filteredLeads = mockLeads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-luxury-gold">CRM & Leads</h2>
                    <p className="text-muted-foreground mt-1">Manage your incoming leads from Facebook and active conversations.</p>
                </div>
                <Button className="bg-luxury-gold text-black hover:bg-luxury-gold/90 transition-all shadow-md">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5 backdrop-blur-md">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search leads by name, email, or phone..."
                        className="pl-10 bg-white dark:bg-[#0A0A0A] border-black/10 dark:border-white/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    {['all', 'new', 'contacted', 'qualified', 'won'].map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                            className={filterStatus === status ? "bg-luxury-gold text-black" : "border-black/10 dark:border-white/10"}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLeads.map((lead) => {
                    const statusInfo = parseStatus(lead.status);
                    return (
                        <Card
                            key={lead.id}
                            className="group hover:border-luxury-gold/50 transition-all duration-300 cursor-pointer bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-sm shadow-sm hover:shadow-xl"
                            onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
                        >
                            <CardContent className="p-6 relative">
                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                    <div className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full border ${statusInfo.color}`}>
                                        {statusInfo.label}
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full" title={`Source: ${lead.source}`}>
                                        {parseSourceIcon(lead.source)}
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <h3 className="font-serif text-xl font-medium text-gray-900 dark:text-gray-100 group-hover:text-luxury-gold transition-colors">
                                        {lead.name}
                                    </h3>
                                    {lead.value && (
                                        <p className="text-sm font-semibold text-luxury-gold mt-1">Est. Value: ${lead.value.toLocaleString()}</p>
                                    )}
                                </div>

                                <div className="mt-6 flex flex-col gap-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span>{lead.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="truncate">{lead.email}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredLeads.length === 0 && (
                <div className="text-center py-20 bg-white/20 dark:bg-black/20 rounded-xl border border-dashed border-black/10 dark:border-white/10">
                    <p className="text-muted-foreground font-serif text-lg">No leads found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}
