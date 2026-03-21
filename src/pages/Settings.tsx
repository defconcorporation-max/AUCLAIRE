import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiSettings, CompanySettings } from "@/services/apiSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, Save } from "lucide-react";
import { resetOnboarding } from "@/components/OnboardingTour";
import { toast } from "@/components/ui/use-toast";

export default function Settings() {
    const { t } = useTranslation();
    // Initialize with defaults to avoid "Promise" type mismatch errors during initial render
    const [settings, setSettings] = useState<CompanySettings>({
        company_name: '',
        contact_email: '',
        phone: '',
        address_line1: '',
        city: '',
        country: '',
        tax_rate: 0,
        currency_symbol: '$',
        design_warn_days: 1,
        design_danger_days: 2,
        prod_warn_days: 10,
        prod_danger_days: 20,
        margin_warn_percent: 20,
        margin_danger_percent: 10
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Fetch async
        apiSettings.get().then(data => setSettings(data));
    }, []);

    const handleChange = (field: keyof CompanySettings, value: string | number) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API delay
        setTimeout(() => {
            apiSettings.save(settings);
            setIsSaving(false);
            toast({ title: t('settings.savedToast') });
        }, 500);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-serif text-foreground">{t('settings.title')}</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" /> {t('settings.companyProfile')}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.companyProfileDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('settings.companyName')}</label>
                            <Input
                                value={settings.company_name}
                                onChange={(e) => handleChange('company_name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('settings.email')}</label>
                            <Input
                                value={settings.contact_email}
                                onChange={(e) => handleChange('contact_email', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('settings.phone')}</label>
                            <Input
                                value={settings.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold mb-3">{t('settings.address')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('settings.line1')}</label>
                                <Input
                                    value={settings.address_line1}
                                    onChange={(e) => handleChange('address_line1', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('settings.line2')}</label>
                                <Input
                                    value={settings.address_line2 || ''}
                                    onChange={(e) => handleChange('address_line2', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('settings.city')}</label>
                                <Input
                                    value={settings.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('settings.country')}</label>
                                <Input
                                    value={settings.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                            <Building className="w-4 h-4 text-luxury-gold" /> {t('settings.healthMonitor')}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mb-4 font-mono uppercase tracking-tight">{t('settings.healthMonitorDesc')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('settings.designDelays')}</h4>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground">{t('settings.warningDays')}</label>
                                    <Input 
                                        type="number" 
                                        value={settings.design_warn_days} 
                                        onChange={(e) => handleChange('design_warn_days', parseInt(e.target.value))}
                                        className="h-8 bg-black/40 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground text-red-400">{t('settings.dangerDays')}</label>
                                    <Input 
                                        type="number" 
                                        value={settings.design_danger_days} 
                                        onChange={(e) => handleChange('design_danger_days', parseInt(e.target.value))}
                                        className="h-8 bg-black/40 border-white/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('settings.productionDelays')}</h4>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground">{t('settings.warningDays')}</label>
                                    <Input 
                                        type="number" 
                                        value={settings.prod_warn_days} 
                                        onChange={(e) => handleChange('prod_warn_days', parseInt(e.target.value))}
                                        className="h-8 bg-black/40 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground text-red-400">{t('settings.dangerDays')}</label>
                                    <Input 
                                        type="number" 
                                        value={settings.prod_danger_days} 
                                        onChange={(e) => handleChange('prod_danger_days', parseInt(e.target.value))}
                                        className="h-8 bg-black/40 border-white/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold mb-2">{t('settings.marginThresholds')}</h4>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground">{t('settings.lowMargin')}</label>
                                    <Input 
                                        type="number" 
                                        value={settings.margin_warn_percent} 
                                        onChange={(e) => handleChange('margin_warn_percent', parseInt(e.target.value))}
                                        className="h-8 bg-black/40 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground text-red-400">{t('settings.criticalMargin')}</label>
                                    <Input 
                                        type="number" 
                                        value={settings.margin_danger_percent} 
                                        onChange={(e) => handleChange('margin_danger_percent', parseInt(e.target.value))}
                                        className="h-8 bg-black/40 border-white/10"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold mb-3">{t('settings.dataManagement')}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-md bg-zinc-50 dark:bg-zinc-900">
                                <div>
                                    <h4 className="font-medium text-sm">{t('settings.exportData')}</h4>
                                    <p className="text-xs text-muted-foreground">{t('settings.exportDesc')}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        // Mock Export
                                        const mockCSV = "id,name,email\n1,Client A,a@test.com\n2,Client B,b@test.com";
                                        const blob = new Blob([mockCSV], { type: 'text/csv' });
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `auclaire_export_${new Date().toISOString().split('T')[0]}.csv`;
                                        a.click();
                                        toast({ title: t('settings.exportSuccess') });
                                    }}
                                >
                                    {t('settings.downloadCsv')}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-md bg-zinc-50 dark:bg-zinc-900">
                                <div>
                                    <h4 className="font-medium text-sm">{t('settings.onboardingGuide')}</h4>
                                    <p className="text-xs text-muted-foreground">{t('settings.onboardingDesc')}</p>
                                </div>
                                <Button variant="outline" onClick={resetOnboarding}>
                                    {t('settings.restartOnboarding')}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 dark:bg-amber-900/10 rounded-md">
                                <div>
                                    <h4 className="font-medium text-sm text-amber-900 dark:text-amber-500">{t('settings.migrateTitle')}</h4>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-500/80">
                                        {t('settings.migrateDesc')}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                    onClick={async () => {
                                        if (!confirm(t('settings.migrateConfirm'))) return;
                                        setIsSaving(true);
                                        try {
                                            const { supabase } = await import('@/lib/supabase');

                                            // 1. Clients
                                            const localClients = JSON.parse(localStorage.getItem('mock_clients') || '[]');
                                            const clientMap: Record<string, string> = {}; // OldID -> NewUUID

                                            let importedClients = 0;
                                            for (const c of localClients) {
                                                let newClientId = null;

                                                // 1. Try to FIND existing client first (to avoid duplicates)
                                                // Check by Email first (most reliable)
                                                if (c.email) {
                                                    const { data: existing } = await supabase.from('clients').select('id').eq('email', c.email).maybeSingle();
                                                    if (existing) newClientId = existing.id;
                                                }
                                                // Check by Name if strict email match failed
                                                if (!newClientId) {
                                                    const { data: existingByName } = await supabase.from('clients').select('id').eq('full_name', c.full_name).maybeSingle();
                                                    if (existingByName) newClientId = existingByName.id;
                                                }

                                                // 2. If not found, CREATE it
                                                if (!newClientId) {
                                                    const { data, error } = await supabase.from('clients').insert({
                                                        full_name: c.full_name,
                                                        email: c.email,
                                                        phone: c.phone,
                                                        notes: c.notes,
                                                        created_at: new Date().toISOString()
                                                    }).select().single();

                                                    if (data) {
                                                        newClientId = data.id;
                                                        importedClients++;
                                                    } else {
                                                        console.warn('Failed to import client:', c.full_name, error);
                                                    }
                                                }

                                                // 3. Map Old ID to New/Existing ID
                                                if (newClientId) {
                                                    clientMap[String(c.id)] = newClientId;
                                                }
                                            }

                                            // 2. Projects
                                            // Fallback to default mock project if LS is empty (User never edited anything)
                                            let localProjects = JSON.parse(localStorage.getItem('mock_projects') || '[]');
                                            if (localProjects.length === 0) {
                                                console.log("No projects in localStorage. Using DEFAULT mock project.");
                                                localProjects = [{
                                                    id: '1', title: 'Test Project - Solitaire Ring',
                                                    client_id: '1', status: 'designing',
                                                    budget: 5000, deadline: '2024-12-31',
                                                    created_at: new Date().toISOString()
                                                }];
                                            }

                                            const projectMap: Record<string, string> = {}; // OldID -> NewUUID
                                            let importedProjects = 0;
                                            let skippedProjects = 0;

                                            console.log(`Found ${localProjects.length} projects to migrate...`);

                                            for (const p of localProjects) {
                                                // Robust ID Lookup (String conversion)
                                                // Also handle the case where default project uses '1' but migration created a new UUID for client '1'
                                                const newClientId = clientMap[String(p.client_id)];

                                                if (!newClientId) {
                                                    console.warn(`Skipping project "${p.title}" - Client ID ${p.client_id} not mapped. Map keys:`, Object.keys(clientMap));
                                                    skippedProjects++;
                                                    continue;
                                                }

                                                const { data: pData, error } = await supabase.from('projects').insert({
                                                    title: p.title,
                                                    client_id: newClientId,
                                                    status: p.status,
                                                    budget: p.budget,
                                                    deadline: p.deadline,
                                                    description: p.description,
                                                    created_at: p.created_at || new Date().toISOString(),
                                                    // Map other fields if needed
                                                }).select().single();

                                                if (pData) {
                                                    projectMap[String(p.id)] = pData.id;
                                                    importedProjects++;
                                                }
                                                else console.warn('Failed to import project:', p.title, error);
                                            }

                                            // 3. Invoices
                                            const localInvoices = JSON.parse(localStorage.getItem('mock_invoices') || '[]');
                                            let importedInvoices = 0;

                                            for (const inv of localInvoices) {
                                                const newProjectId = projectMap[String(inv.project_id)];
                                                if (!newProjectId) continue;

                                                const { error } = await supabase.from('invoices').insert({
                                                    project_id: newProjectId,
                                                    amount: inv.amount,
                                                    amount_paid: inv.amount_paid || 0,
                                                    status: inv.status,
                                                    due_date: inv.due_date,
                                                    stripe_payment_link: inv.stripe_payment_link,
                                                    created_at: inv.created_at || new Date().toISOString()
                                                });

                                                if (!error) importedInvoices++;
                                            }

                                            toast({ title: t('settings.migrateDone'), description: t('settings.migrateResult', { clients: importedClients, projects: importedProjects, skipped: skippedProjects, invoices: importedInvoices }) });

                                        } catch (e) {
                                            console.error(e);
                                            toast({ title: t('settings.migrateFail'), description: t('settings.migrateFailDesc'), variant: "destructive" });
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                >
                                    {t('settings.migrateButton')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="bg-luxury-gold hover:bg-amber-600 text-black">
                            {isSaving ? t('settings.saving') : <><Save className="w-4 h-4 mr-2" /> {t('settings.saveSettings')}</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
