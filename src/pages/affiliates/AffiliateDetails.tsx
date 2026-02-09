
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiAffiliates, AffiliateProfile } from '@/services/apiAffiliates';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function AffiliateDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [affiliate, setAffiliate] = useState<AffiliateProfile | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editable Fields
    const [fullName, setFullName] = useState('');
    // const [email, setEmail] = useState(''); // Note: Email is tricky with Supabase Profiles vs Auth
    const [status, setStatus] = useState<string>('pending');
    const [level, setLevel] = useState<string>('starter');
    const [rate, setRate] = useState<number>(10);
    const [type, setType] = useState<string>('percent');

    useEffect(() => {
        if (!id) return;
        loadData();
    }, [id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Profile (Manual fetch from apiAffiliates or re-use getAffiliates and find?)
            // We don't have getById yet in apiAffiliates, so let's add it or just use getAffiliates for now (inefficient but works)
            // Actually, let's implement a simple direct fetch here or assuming apiAffiliates has getById
            // Since I didn't add getById to apiAffiliates, I'll fetch the list and find (temporary) OR I'll add the method.
            // Let's assume I'll add getById to apiAffiliates.ts shortly. For now, I'll implement the fetch inline to be safe.
            const list = await apiAffiliates.getAffiliates();
            const found = list.find(a => a.id === id);

            if (found) {
                setAffiliate(found);
                setFullName(found.full_name || '');
                // setEmail(found.email || ''); // If we had it
                setStatus(found.affiliate_status || 'pending');
                setLevel(found.affiliate_level || 'starter');
                setRate(found.commission_rate || 10);
                setType(found.commission_type || 'percent');

                // 2. Fetch Stats
                const statsData = await apiAffiliates.getAffiliateStats(id!);
                setStats(statsData);
            }
        } catch (error: any) {
            console.error("Failed to load affiliate", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (error) return (
        <div className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-red-500">Failed to load Affiliate Data</h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm bg-zinc-100 p-2 rounded max-w-lg mx-auto font-mono">
                Hint: Check if 'budget' or 'affiliate_id' columns exist in your database.
            </p>
            <Button onClick={loadData}>Retry</Button>
        </div>
    );
    if (!affiliate) return <div className="p-8 text-center text-red-500">Affiliate not found.</div>;

    const handleSave = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            await apiAffiliates.updateAffiliate(id, {
                full_name: fullName,
                affiliate_status: status as any,
                affiliate_level: level as any,
                commission_rate: Number(rate),
                commission_type: type as any
            });
            alert("Affiliate updated successfully!");
            loadData(); // Reload
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const { totalSales = 0, totalCommission = 0, activeProjectsCount = 0, projects = [] } = stats || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/affiliates')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                        {affiliate.full_name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline">{affiliate.role}</Badge>
                        <span className="text-luxury-gold uppercase font-bold text-xs tracking-wider">
                            {affiliate.affiliate_level}
                        </span>
                    </div>
                </div>
                <div className="ml-auto">
                    <Button onClick={handleSave} disabled={isSaving} className="bg-luxury-gold hover:bg-luxury-gold/90 text-black gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                {/* Stats Cards */}
                <Card className="bg-zinc-900 text-white border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Lifetime Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif text-luxury-gold">
                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(totalCommission)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Sales Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(totalSales)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {activeProjectsCount}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Default Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">
                            {affiliate.commission_rate}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Edit Profile Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Manage status and commission rates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="active">Active</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Level</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="starter">Starter</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="elite">Elite</option>
                                <option value="partner">Partner</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Commission</Label>
                                <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="percent">% Percent</option>
                                    <option value="fixed">$ Fixed</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assigned Projects List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Assigned Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Sale</TableHead>
                                        <TableHead className="text-right text-luxury-gold">Commission</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projects.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No projects assigned.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        projects.map((p: any) => {
                                            const price = Number(p.budget) || 0;
                                            let com = 0;
                                            if (p.affiliate_commission_type === 'fixed') {
                                                com = Number(p.affiliate_commission_rate) || 0;
                                            } else {
                                                com = (price * (Number(p.affiliate_commission_rate) || 0)) / 100;
                                            }

                                            return (
                                                <TableRow key={p.id} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900" onClick={() => navigate(`/dashboard/projects/${p.id}`)}>
                                                    <TableCell className="font-medium">
                                                        <div>{p.title || 'Untitled Project'}</div>
                                                        <div className="text-xs text-muted-foreground">ID: {p.id.slice(0, 8)} • {p.client?.full_name || 'Client'}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">{p.status.replace('_', ' ')}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(price)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-luxury-gold">
                                                        {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(com)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
