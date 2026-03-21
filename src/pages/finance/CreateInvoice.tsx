
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiInvoices } from '@/services/apiInvoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, DollarSign, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { apiActivities } from '@/services/apiActivities';
import { useAuth } from '@/context/AuthContext';

function getDefaultDueDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
}

export default function CreateInvoice() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [projectId, setProjectId] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentLink, setPaymentLink] = useState('');
    const [dueDate, setDueDate] = useState(getDefaultDueDate);

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: apiProjects.getAll
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const selectedProject = projects?.find(p => p.id === projectId);
        await apiInvoices.create({
            project_id: projectId,
            amount: parseFloat(amount),
            stripe_payment_link: paymentLink,
            due_date: dueDate
        });
        apiActivities.log({
            project_id: projectId,
            user_id: user?.id || 'admin',
            user_name: user?.user_metadata?.full_name || 'Admin',
            action: 'invoice',
            details: t('createInvoicePage.activityDetails', {
                amount,
                title: selectedProject?.title || t('invoicesPage.unknownProject'),
            }),
        });
        setLoading(false);
        navigate(-1);
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-serif font-bold text-luxury-gold">{t('createInvoicePage.title')}</h1>
                    <p className="text-sm text-muted-foreground">{t('createInvoicePage.subtitle')}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('createInvoicePage.cardTitle')}</CardTitle>
                    <CardDescription>{t('createInvoicePage.cardDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('createInvoicePage.project')}</label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                required
                            >
                                <option value="">{t('createInvoicePage.selectProject')}</option>
                                {projects?.map(p => (
                                    <option key={p.id} value={p.id}>{p.title} - {p.client?.full_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('createInvoicePage.amount')}</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t('createInvoicePage.paymentLink')}{' '}
                                <span className="text-muted-foreground font-normal">{t('createInvoicePage.optional')}</span>
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    type="url"
                                    placeholder={t('createInvoicePage.paymentLinkPlaceholder')}
                                    value={paymentLink}
                                    onChange={(e) => setPaymentLink(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('createInvoicePage.dueDate')}</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    type="date"
                                    required
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-luxury-gold text-black hover:bg-luxury-gold-dark" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('createInvoicePage.submit')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
