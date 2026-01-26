import { useAuth } from '@/context/AuthContext';
import { apiProjects } from '@/services/apiProjects';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { RecentActivityList } from "@/components/RecentActivityList";
import { RevenueChart } from "@/components/RevenueChart";
import { Link } from 'react-router-dom';

import { Clock, AlertCircle, Banknote, TrendingUp } from 'lucide-react';

export default function Dashboard() {
    const { profile, role } = useAuth();

    // Fetch all projects for simplicity in mock (RLS would filter in real DB)
    const { data: projects, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    if (isLoading) return <div>Loading dashboard...</div>;

    // Filter projects based on role logic
    const manufacturerDesignRequests = projects?.filter(p => p.status === 'designing' || p.status === 'design_modification' || p.status === '3d_model') || [];
    const manufacturerProduction = projects?.filter(p => p.status === 'production' || p.status === 'approved_for_production') || [];

    const adminDesignReady = projects?.filter(p => p.status === 'design_ready') || [];

    const recentProjects = projects?.slice(0, 5) || [];

    // Financial calculations
    const totalSale = projects?.reduce((sum, p) => sum + (p.financials?.selling_price || p.budget || 0), 0) || 0;
    const totalCost = projects?.reduce((sum, p) => sum +
        (p.financials?.supplier_cost || 0) +
        (p.financials?.shipping_cost || 0) +
        (p.financials?.customs_fee || 0), 0) || 0;
    const totalProfit = totalSale - totalCost;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif text-luxury-gold">Welcome back, {profile?.full_name?.split(' ')[0]}</h1>
                    <p className="text-muted-foreground mt-1">Here is what needs your attention today.</p>
                </div>
                {role === 'admin' && (
                    <Button asChild className="bg-luxury-gold text-black hover:bg-luxury-gold/90">
                        <Link to="/dashboard/projects/new">New Project</Link>
                    </Button>
                )}
            </div>

            {/* MANUFACTURER DASHBOARD */}
            {role === 'manufacturer' && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* 1. DESIGN REQUESTS */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                Design Requests
                            </CardTitle>
                            <CardDescription>New ideas needing 3D design & cost estimation.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {manufacturerDesignRequests.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No pending design requests.</p>
                            ) : (
                                <div className="space-y-4">
                                    {manufacturerDesignRequests.map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                            <div>
                                                <div className="font-medium text-sm">{project.title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Status: <span className="capitalize">{project.status.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline" asChild>
                                                <Link to={`/dashboard/projects/${project.id}`}>View Request</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. PRODUCTION TO LAUNCH */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-green-500" />
                                Production to Launch
                            </CardTitle>
                            <CardDescription>Approved designs ready for manufacturing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {manufacturerProduction.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No approved production tasks.</p>
                            ) : (
                                <div className="space-y-4">
                                    {manufacturerProduction.map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                            <div>
                                                <div className="font-medium text-sm">{project.title}</div>
                                                <div className="text-xs text-muted-foreground">Deadline: {project.deadline}</div>
                                            </div>
                                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" asChild>
                                                <Link to={`/dashboard/projects/${project.id}`}>Start Production</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ADMIN DASHBOARD -KPIs & DESIGN READY SECTION */}
            {role === 'admin' && (
                <div className="grid gap-6">
                    {/* Financial KPIs */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-luxury-gold/20 to-transparent border-luxury-gold/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                <Banknote className="h-4 w-4 text-luxury-gold" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-serif">${totalSale.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Gross Revenue</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-serif text-green-600 dark:text-green-400">
                                    ${totalProfit.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">Net Income</p>
                            </CardContent>
                        </Card>
                    </div>

                    {adminDesignReady.length > 0 && (
                        <Card className="border-l-4 border-l-amber-500 bg-amber-50/10 mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-600">
                                    <AlertCircle className="w-5 h-5" />
                                    Designs Pending Approval
                                </CardTitle>
                                <CardDescription>Manufacturer has submitted these for review.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {adminDesignReady.map(project => (
                                        <div key={project.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 shadow-sm rounded-lg border">
                                            <div>
                                                <div className="font-medium">{project.title}</div>
                                                <div className="text-sm text-muted-foreground">Submitted by Manufacturer</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" asChild>
                                                    <Link to={`/dashboard/projects/${project.id}`}>Review Design</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* SHARED / DEFAULT DASHBOARD (Recent Projects) */}
            {(role === 'admin' || role === 'sales') && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Revenue Overview */}
                    <Card className="col-span-2 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <RevenueChart />
                        </CardContent>
                    </Card>

                    {/* Standard Dashboard Cards... */}
                    <Card className="col-span-2 lg:col-span-1">
                        <CardHeader>
                            <CardTitle>All Active Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentProjects.map((project) => (
                                    <div key={project.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <h3 className="font-medium">{project.title}</h3>
                                            <p className="text-sm text-muted-foreground capitalize">{project.status.replace('_', ' ')} • {project.client?.full_name}</p>
                                        </div>
                                        <Badge variant={project.status === 'completed' ? 'secondary' : 'default'} className="bg-luxury-gold text-black hover:bg-luxury-gold/80">
                                            {project.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* RECENT ACTIVITY WIDGET */}
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RecentActivityList />
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
