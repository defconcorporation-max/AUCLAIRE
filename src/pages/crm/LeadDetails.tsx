import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Phone, Mail, Clock, Calendar, MessageSquare, Play, PhoneIncoming, PhoneOutgoing, Edit, Save, X } from 'lucide-react';
import Dialer from '@/components/crm/Dialer';
import { mockLeads } from './LeadsDashboard';

// Mock Call History Data
const mockCallHistory = [
    { id: 1, type: 'outgoing', duration: '5m 23s', timestamp: '2026-02-26T10:30:00Z', notes: 'Discussed the 2ct Radiant Cut. Client is very interested.', hasRecording: true },
    { id: 2, type: 'incoming', duration: '2m 10s', timestamp: '2026-02-25T14:15:00Z', notes: 'Missed call. Left a voicemail.', hasRecording: false },
    { id: 3, type: 'outgoing', duration: '12m 45s', timestamp: '2026-02-20T09:20:00Z', notes: 'Initial consultation and budget qualification.', hasRecording: true },
];

export default function LeadDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    // Using a simple state based on mock data to allow local editing
    const [lead, setLead] = useState(mockLeads.find(l => l.id === id));
    const [isDialerOpen, setIsDialerOpen] = useState(false);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(lead ? { name: lead.name, email: lead.email, phone: lead.phone, value: lead.value?.toString() || '' } : null);

    if (!lead || !editForm) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-serif text-red-500">Lead Not Found</h2>
                <Button onClick={() => navigate('/dashboard/leads')} className="mt-4">Go Back</Button>
            </div>
        );
    }

    const handleCall = () => {
        setIsDialerOpen(true);
    };

    const handleSave = () => {
        // In a real app we would call the DB API here
        setLead({
            ...lead,
            name: editForm.name,
            email: editForm.email,
            phone: editForm.phone,
            value: editForm.value ? parseInt(editForm.value) : undefined
        });

        // Also update the global mock so Dashboard sees it
        const leadIndex = mockLeads.findIndex(l => l.id === lead.id);
        if (leadIndex > -1) {
            mockLeads[leadIndex] = {
                ...mockLeads[leadIndex],
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
                value: editForm.value ? parseInt(editForm.value) : undefined
            }
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditForm({ name: lead.name, email: lead.email, phone: lead.phone, value: lead.value?.toString() || '' });
        setIsEditing(false);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/leads')} className="hover:bg-black/5 dark:hover:bg-white/5">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        {isEditing ? (
                            <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="text-xl font-serif font-bold text-luxury-gold h-10 w-64 bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                            />
                        ) : (
                            <h2 className="text-3xl font-serif font-bold tracking-tight text-luxury-gold flex items-center gap-3">
                                {lead.name}
                                <span className="text-[10px] bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 px-2 py-1 rounded-full uppercase tracking-widest font-sans font-semibold">
                                    {lead.status}
                                </span>
                            </h2>
                        )}
                        <p className="text-muted-foreground mt-1 text-sm bg-black/5 dark:bg-white/5 px-3 py-1 rounded-md inline-block">
                            Source: <span className="capitalize">{lead.source}</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={handleCall} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all border-none">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Lead
                    </Button>
                    <Button variant="outline" className="border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Contact Info & Quick Actions */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-white to-gray-50/50 dark:from-black dark:to-[#050505] shadow-sm border-black/5 dark:border-white/5">
                        <CardHeader className="pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-serif">Contact Information</CardTitle>
                            {isEditing ? (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                        <Save className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-muted-foreground hover:text-luxury-gold">
                                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5 transition-all">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="h-7 mt-1 text-sm bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium truncate">{lead.phone}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5 transition-all">
                                <div className="w-10 h-10 shrink-0 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                                    {isEditing ? (
                                        <Input
                                            value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="h-7 mt-1 text-sm bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium truncate">{lead.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0A0A0A] rounded-lg border border-black/5 dark:border-white/5">
                                <div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Created In CRM</p>
                                    <p className="text-sm font-medium truncate">{new Date(lead.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/80 dark:bg-black/60 backdrop-blur-md shadow-sm border-black/5 dark:border-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg font-serif">Pipeline Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-serif text-luxury-gold">$</span>
                                    <Input
                                        type="number"
                                        value={editForm.value}
                                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                                        className="text-2xl font-serif text-luxury-gold h-12 w-32 bg-transparent border-black/20 dark:border-white/20 focus-visible:ring-1 focus-visible:ring-luxury-gold/50"
                                    />
                                </div>
                            ) : (
                                <div className="text-4xl font-serif text-luxury-gold tracking-tight">
                                    ${lead.value ? lead.value.toLocaleString() : 'N/A'}
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">Estimated Deal Value</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Communication History (Calls, Notes, SMS, Emails, FB Msgs) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md border border-black/5 dark:border-white/5 shadow-md flex flex-col">
                        <CardHeader className="border-b border-black/5 dark:border-white/5 pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl font-serif flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-luxury-gold" />
                                    Communication History
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-black dark:hover:text-white">All</Button>
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider text-blue-500 hover:bg-blue-500/10">Calls</Button>
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider text-purple-500 hover:bg-purple-500/10">Notes</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-6 space-y-6">

                            {/* Timeline Items */}
                            {mockCallHistory.map((call) => (
                                <div key={call.id} className="relative pl-8 before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-luxury-gold/20 last:before:bottom-auto last:before:h-full">
                                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0A0A0A] ${call.type === 'outgoing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                        {call.type === 'outgoing' ? <PhoneOutgoing className="w-3 h-3" /> : <PhoneIncoming className="w-3 h-3" />}
                                    </div>

                                    <div className="bg-white dark:bg-black rounded-xl p-4 border border-black/5 dark:border-white/5 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold text-sm capitalize flex items-center gap-2">
                                                    {call.type} Call
                                                    <span className="text-xs font-normal text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                                        {call.duration}
                                                    </span>
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {new Date(call.timestamp).toLocaleString()}
                                                </p>
                                            </div>

                                            {call.hasRecording && (
                                                <Button variant="outline" size="sm" className="h-8 gap-2 text-xs border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10">
                                                    <Play className="w-3 h-3" /> Play Recording
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-black/5 dark:bg-white/5 p-3 rounded-lg border-l-2 border-luxury-gold">
                                            {call.notes}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Mock FB Message */}
                            <div className="relative pl-8 before:absolute before:inset-y-0 before:left-[15px] before:w-[2px] before:bg-luxury-gold/20">
                                <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0A0A0A] bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                                    <MessageSquare className="w-3 h-3" />
                                </div>
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-500/20 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                Facebook Lead Form Submitted
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(lead.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm italic text-gray-700 dark:text-gray-300 mt-2">
                                        "I'm interested in the 2ct Radiant Cut Ring."
                                    </p>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialer
                isOpen={isDialerOpen}
                onClose={() => setIsDialerOpen(false)}
                contactName={lead.name}
                phoneNumber={lead.phone}
            />
        </div>
    );
}
