import { useState, useEffect } from "react";
import { apiSettings, CompanySettings } from "@/services/apiSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, Save } from "lucide-react";

export default function Settings() {
    const [settings, setSettings] = useState<CompanySettings>(apiSettings.get());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSettings(apiSettings.get());
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
            alert("Settings saved successfully!");
        }, 500);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-serif text-foreground">Company Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" /> Company Profile
                    </CardTitle>
                    <CardDescription>
                        This information will appear on all your invoices and client communications.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Company Name</label>
                            <Input
                                value={settings.company_name}
                                onChange={(e) => handleChange('company_name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                value={settings.contact_email}
                                onChange={(e) => handleChange('contact_email', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <Input
                                value={settings.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold mb-3">Address</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Line 1</label>
                                <Input
                                    value={settings.address_line1}
                                    onChange={(e) => handleChange('address_line1', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Line 2</label>
                                <Input
                                    value={settings.address_line2 || ''}
                                    onChange={(e) => handleChange('address_line2', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">City</label>
                                <Input
                                    value={settings.city}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Country</label>
                                <Input
                                    value={settings.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold mb-3">Financials</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Currency Symbol</label>
                                <Input
                                    className="w-20"
                                    value={settings.currency_symbol}
                                    onChange={(e) => handleChange('currency_symbol', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tax Rate (%)</label>
                                <Input
                                    className="w-20"
                                    type="number"
                                    value={settings.tax_rate}
                                    onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold mb-3">Data Management</h3>
                        <div className="flex items-center justify-between p-4 border rounded-md bg-zinc-50 dark:bg-zinc-900">
                            <div>
                                <h4 className="font-medium text-sm">Export Data</h4>
                                <p className="text-xs text-muted-foreground">Download all your data as CSV files.</p>
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
                                    alert("Export downloaded successfully!");
                                }}
                            >
                                Download CSV
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="bg-luxury-gold hover:bg-amber-600 text-black">
                            {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
