import { useAuth } from '@/context/AuthContext';
import { apiProjects } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { Package, FileText, CreditCard, Clock, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClientPortal() {
    const { user, profile } = useAuth();

    const { data: allProjects = [] } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll,
    });

    const { data: allInvoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll,
    });

    // Filter projects for this client
    const myProjects = allProjects.filter(p => p.client_id === user?.id);
    const myInvoices = allInvoices.filter(inv => {
        const proj = myProjects.find(p => p.id === inv.project_id);
        return !!proj;
    });

    const activeProjects = myProjects.filter(p => p.status !== 'completed');
    const completedProjects = myProjects.filter(p => p.status === 'completed');
    const pendingApproval = myProjects.filter(p => p.status === 'design_ready');
    const unpaidInvoices = myInvoices.filter(inv => inv.status !== 'paid');

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
            {/* Welcome Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-serif text-luxury-gold">
                    Welcome, {profile?.full_name || 'Client'}
                </h1>
                <p className="text-muted-foreground">
                    Track your jewelry projects, approve designs, and manage payments.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-luxury-gold/10 to-transparent border-luxury-gold/20">
                    <CardContent className="p-4 text-center">
                        <Package className="w-6 h-6 mx-auto mb-2 text-luxury-gold" />
                        <div className="text-2xl font-bold">{activeProjects.length}</div>
                        <p className="text-xs text-muted-foreground">Active Projects</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                    <CardContent className="p-4 text-center">
                        <Eye className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                        <div className="text-2xl font-bold">{pendingApproval.length}</div>
                        <p className="text-xs text-muted-foreground">Pending Approval</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
                    <CardContent className="p-4 text-center">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <div className="text-2xl font-bold">{completedProjects.length}</div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                    <CardContent className="p-4 text-center">
                        <CreditCard className="w-6 h-6 mx-auto mb-2 text-red-400" />
                        <div className="text-2xl font-bold">{unpaidInvoices.length}</div>
                        <p className="text-xs text-muted-foreground">Unpaid Invoices</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Approval Banner */}
            {pendingApproval.length > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                            <Eye className="w-5 h-5 text-amber-400" />
                            Designs Awaiting Your Approval
                        </CardTitle>
                        <CardDescription>Review and approve designs to move forward with production.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pendingApproval.map(project => (
                            <Link
                                key={project.id}
                                to={`/dashboard/projects/${project.id}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-sm">{project.title}</p>
                                    <p className="text-xs text-muted-foreground">Click to review design</p>
                                </div>
                                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                                    Review Design
                                </Button>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Active Projects */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Package className="w-5 h-5 text-luxury-gold" />
                        Your Projects
                    </CardTitle>
                    <CardDescription>All your jewelry projects and their current status.</CardDescription>
                </CardHeader>
                <CardContent>
                    {myProjects.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">
                            No projects yet. Your team will create one for you soon!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {myProjects.map(project => (
                                <Link
                                    key={project.id}
                                    to={`/dashboard/projects/${project.id}`}
                                    className="flex items-center justify-between p-4 rounded-lg border border-white/5 hover:border-luxury-gold/30 hover:bg-white/[0.02] transition-all"
                                >
                                    <div className="space-y-1">
                                        <p className="font-medium font-serif">{project.title}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            Created {new Date(project.created_at).toLocaleDateString()}
                                            {project.priority === 'rush' && (
                                                <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5">RUSH</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <StatusBadge status={project.status} />
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Invoices */}
            {myInvoices.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                            <FileText className="w-5 h-5 text-luxury-gold" />
                            Invoices & Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {myInvoices.map(invoice => {
                                const proj = myProjects.find(p => p.id === invoice.project_id);
                                return (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-white/5"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">{proj?.title || 'Project'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="font-mono font-bold">${Number(invoice.amount).toLocaleString()}</p>
                                                <Badge className={
                                                    invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                                    invoice.status === 'partial' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }>
                                                    {invoice.status}
                                                </Badge>
                                            </div>
                                            {invoice.stripe_payment_link && invoice.status !== 'paid' && (
                                                <a
                                                    href={invoice.stripe_payment_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-luxury-gold text-black text-xs font-medium rounded-md hover:bg-luxury-gold/80 transition-colors"
                                                >
                                                    Pay Now
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
