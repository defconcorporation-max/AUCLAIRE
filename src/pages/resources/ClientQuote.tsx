import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Printer, Send, CheckCircle2, Loader2, Plus, Trash2, Percent } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { apiClients } from '@/services/apiClients';
import { apiInvoices } from '@/services/apiInvoices';
import { formatCurrency } from '@/utils/taxUtils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/use-toast';
import { apiNotifications } from '@/services/apiNotifications';
import { generateQuotePDF } from '@/services/pdfService';
import { apiSettings } from '@/services/apiSettings';

interface QuoteLineItem {
    id: string;
    title: string;
    description: string;
    price: number;
}

export default function ClientQuote() {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('fr') ? 'fr-CA' : 'en-CA';
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const [isSending, setIsSending] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [customItems, setCustomItems] = useState<QuoteLineItem[]>([]);
    const [editMode, setEditMode] = useState(false);

    const { data: project, isLoading: loadingProject } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const all = await apiProjects.getAll();
            return all.find(p => p.id === projectId) || null;
        },
        enabled: !!projectId,
    });

    const { data: client } = useQuery({
        queryKey: ['client', project?.client_id],
        queryFn: () => apiClients.getById(project!.client_id),
        enabled: !!project?.client_id,
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['invoices'],
        queryFn: apiInvoices.getAll,
    });

    const projectInvoices = invoices.filter(inv => inv.project_id === projectId);
    const totalPaid = projectInvoices.reduce((s, inv) => s + Number(inv.amount_paid || 0), 0);

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: apiSettings.get,
    });

    const handlePrint = async () => {
        if (!project || !settings) return;
        
        // Prepare items for PDF
        const itemsToPrint = displayItems.map(i => ({
            title: i.title,
            description: i.description,
            price: i.price
        }));

        await generateQuotePDF(project, settings, itemsToPrint, discount);
    };

    const handleSendToClient = async () => {
        if (!project || !client) return;
        setIsSending(true);
        try {
            await apiNotifications.create({
                user_id: project.client_id,
                title: t('clientQuotePage.notifTitle'),
                message: t('clientQuotePage.notifMessage', { title: project.title }),
                type: 'info',
                link: `/dashboard/projects/${project.id}`,
            });
            toast({ title: t('clientQuotePage.toastSentTitle'), description: t('clientQuotePage.toastSentDesc', { name: client.full_name }) });
        } catch {
            toast({ title: t('clientQuotePage.toastErrTitle'), description: t('clientQuotePage.toastErrDesc'), variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
    };

    const addItem = () => {
        setCustomItems(prev => [...prev, { id: crypto.randomUUID(), title: '', description: '', price: 0 }]);
        setEditMode(true);
    };

    const removeItem = (id: string) => setCustomItems(prev => prev.filter(i => i.id !== id));

    const updateItem = (id: string, field: keyof QuoteLineItem, value: string | number) => {
        setCustomItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    if (loadingProject) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{t('clientQuotePage.notFound')}</p>
                <Button variant="ghost" onClick={() => navigate(-1)}>{t('clientQuotePage.back')}</Button>
            </div>
        );
    }

    const sellingPrice = project.financials?.selling_price || project.budget || 0;
    const today = new Date().toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' });
    const refNumber = project.reference_number || `SL-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;

    const designFiles = [
        ...(project.stage_details?.design_files || []),
        ...(project.stage_details?.sketch_files || []),
        ...(project.stage_details?.design_versions || []).flatMap(v => v.files || []),
    ].filter((url, i, arr) => arr.indexOf(url) === i);

    const defaultItems: QuoteLineItem[] = [{
        id: 'main',
        title: project.title,
        description: project.description || '',
        price: sellingPrice,
    }];

    const displayItems = customItems.length > 0 ? customItems : defaultItems;
    const subtotal = displayItems.reduce((s, i) => s + (Number(i.price) || 0), 0);
    const finalTotal = subtotal - discount;

    return (
        <div className="min-h-screen bg-zinc-950 p-4 md:p-8 pb-20 print:bg-white print:p-0">
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" /> {t('clientQuotePage.back')}
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}
                        className="border-white/20 text-muted-foreground hover:text-white">
                        {editMode ? t('clientQuotePage.doneEdit') : t('clientQuotePage.editItems')}
                    </Button>
                    <Button onClick={handleSendToClient} disabled={isSending || !client} variant="outline"
                        className="border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10">
                        {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        {t('clientQuotePage.sendClient')}
                    </Button>
                    <Button onClick={handlePrint} className="bg-luxury-gold hover:bg-yellow-600 text-white font-bold">
                        <Printer className="w-4 h-4 mr-2" /> {t('clientQuotePage.printPdf')}
                    </Button>
                </div>
            </div>

            {/* Edit panel */}
            {editMode && (
                <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl border border-luxury-gold/20 bg-luxury-gold/5 space-y-3 print:hidden">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-luxury-gold">{t('clientQuotePage.quoteItems')}</p>
                        <Button size="sm" onClick={addItem} className="bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30">
                            <Plus className="w-4 h-4 mr-1" /> {t('clientQuotePage.addItem')}
                        </Button>
                    </div>
                    {customItems.map(item => (
                        <div key={item.id} className="flex gap-2 items-start">
                            <Input placeholder={t('clientQuotePage.phTitle')} value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} className="flex-1 h-9" />
                            <Input placeholder={t('clientQuotePage.phDescription')} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} className="flex-1 h-9" />
                            <Input type="number" placeholder={t('clientQuotePage.phPrice')} value={item.price || ''} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} className="w-28 h-9" />
                            <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-red-400 h-9 w-9 p-0">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <Percent className="w-4 h-4 text-luxury-gold" />
                        <span className="text-sm text-muted-foreground">{t('clientQuotePage.discountLabel')}</span>
                        <Input type="number" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-28 h-9" placeholder="0" />
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto bg-white text-zinc-900 shadow-2xl rounded-sm overflow-hidden print:shadow-none print:rounded-none min-h-[11in]">
                <div className="h-2 bg-luxury-gold w-full" />

                <div className="p-12 md:p-16">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
                        <div>
                            <h1 className="text-5xl font-serif tracking-tighter text-zinc-900 mb-2">MAISON AUCLAIRE</h1>
                            <p className="text-xs uppercase tracking-[0.4em] text-luxury-gold font-bold">{t('clientQuotePage.tagline')}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-serif text-zinc-800 uppercase tracking-widest mb-1">{t('clientQuotePage.quoteTitle')}</h2>
                            <p className="text-zinc-500 font-mono text-sm">{t('clientQuotePage.dateLabel', { date: today })}</p>
                            <p className="text-zinc-500 font-mono text-sm">{t('clientQuotePage.refLabel', { ref: refNumber })}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 border-t border-b border-zinc-100 py-10">
                        <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold mb-4">{t('clientQuotePage.preparedFor')}</h3>
                            <div className="space-y-1">
                                <p className="font-serif text-xl text-zinc-900">{client?.full_name || t('clientQuotePage.clientFallback')}</p>
                                {client?.phone && <p className="text-zinc-600 text-sm">{client.phone}</p>}
                                {client?.email && <p className="text-zinc-600 text-sm">{client.email}</p>}
                            </div>
                        </div>
                        <div className="md:text-right">
                            <h3 className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold mb-4">{t('clientQuotePage.fromUs')}</h3>
                            <div className="space-y-1">
                                <p className="font-serif text-xl text-zinc-900">MAISON AUCLAIRE INC</p>
                                <p className="text-zinc-600 text-sm italic">{t('clientQuotePage.fromTagline')}</p>
                                <p className="text-zinc-600 text-sm">{t('clientQuotePage.fromLocation')}</p>
                                <p className="text-zinc-600 text-sm">www.maisonauclaire.ca</p>
                            </div>
                        </div>
                    </div>

                    {project.description && (
                        <div className="mb-12">
                            <p className="text-zinc-700 leading-relaxed font-serif text-lg italic">
                                "{project.description}"
                            </p>
                        </div>
                    )}

                    <div className="space-y-12 mb-16">
                        <h3 className="text-sm uppercase tracking-widest text-zinc-900 font-bold border-b border-zinc-900 pb-2">{t('clientQuotePage.projectDetails')}</h3>

                        {displayItems.map((item, idx) => (
                            <div key={item.id} className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${idx > 0 ? 'pt-8 border-t border-zinc-50' : ''}`}>
                                <div className="col-span-2">
                                    <h4 className="font-serif text-2xl text-zinc-900 mb-4">{idx + 1}. {item.title || t('clientQuotePage.lineFallback')}</h4>
                                    {item.description && (
                                        <p className="text-zinc-700 text-sm italic mb-2">{item.description}</p>
                                    )}
                                </div>
                                <div className="text-right flex flex-col justify-end">
                                    <p className="text-luxury-gold font-serif text-2xl">{formatCurrency(item.price)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {designFiles.length > 0 && (
                        <div className="mb-16 print:break-before-page">
                            <h3 className="text-sm uppercase tracking-widest text-zinc-900 font-bold border-b border-zinc-900 pb-2 mb-8">{t('clientQuotePage.designVisuals')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {designFiles.slice(0, 4).map((url, idx) => (
                                    <div key={idx} className="aspect-square bg-zinc-50 rounded border border-zinc-100 overflow-hidden">
                                        <img src={url} alt={t('clientQuotePage.designAlt', { n: idx + 1 })} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-4 italic">{t('clientQuotePage.rendersNote')}</p>
                        </div>
                    )}

                    <div className="bg-zinc-950 text-white p-12 rounded-sm mb-16 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-1">
                            {displayItems.length > 1 && (
                                <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                                    {t('clientQuotePage.subtotal', { amount: formatCurrency(subtotal) })}
                                </p>
                            )}
                            {discount > 0 && (
                                <p className="text-sm uppercase tracking-[0.3em] text-luxury-gold">
                                    {t('clientQuotePage.discountLine', { amount: formatCurrency(discount) })}
                                </p>
                            )}
                            {totalPaid > 0 && (
                                <p className="text-sm uppercase tracking-[0.3em] text-green-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> {t('clientQuotePage.alreadyPaid', { amount: formatCurrency(totalPaid) })}
                                </p>
                            )}
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{t('clientQuotePage.totalDue')}</p>
                            <p className="text-5xl font-serif text-luxury-gold">{formatCurrency(finalTotal)}</p>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2">{t('clientQuotePage.taxesExtra')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[11px] text-zinc-500 leading-relaxed uppercase tracking-widest">
                        <div>
                            <h4 className="text-zinc-900 font-bold mb-3 border-b border-zinc-100 pb-1">{t('clientQuotePage.paymentTerms')}</h4>
                            <ul className="space-y-2">
                                <li className="flex justify-between">
                                    <span>{t('clientQuotePage.deposit50')}</span>
                                    <span className="font-bold text-zinc-700">{t('clientQuotePage.depositWhen')}</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>{t('clientQuotePage.balance')}</span>
                                    <span className="font-bold text-zinc-700">{t('clientQuotePage.balanceWhen')}</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-zinc-900 font-bold mb-3 border-b border-zinc-100 pb-1">{t('clientQuotePage.conditions')}</h4>
                            <p className="mb-2 italic">{t('clientQuotePage.conditionsP1')}</p>
                            <p className="mb-4">{t('clientQuotePage.conditionsP2')}</p>
                            <h4 className="text-zinc-900 font-bold mb-3 border-b border-zinc-100 pb-1 mt-6">Garantie & Certifications</h4>
                            <p className="leading-normal normal-case">Nous garantissons la manufacture de la bague pendant 90 jours en cas de bris dû à une erreur de fabrication. Les diamants de plus de 1ct sont certifiés par IGI. Nous garantissons la pureté de l'or selon les standards de l'industrie.</p>
                        </div>
                    </div>

                    <div className="mt-20 pt-10 border-t border-zinc-100 text-center">
                        <p className="text-luxury-gold font-serif text-xl mb-2">MAISON AUCLAIRE INC</p>
                        <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-400 font-bold">{t('clientQuotePage.footerLine')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
