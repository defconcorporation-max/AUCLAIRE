import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiProjects } from '@/services/apiProjects';
import { apiClients } from '@/services/apiClients';
import { apiInvoices } from '@/services/apiInvoices';
import { formatCurrency } from '@/utils/taxUtils';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { apiNotifications } from '@/services/apiNotifications';

interface QuoteItem {
    id: string;
    title: string;
    description: string;
    details: string[];
    price: number;
}

export default function ClientQuote() {
    const navigate = useNavigate();
    const { projectId } = useParams<{ projectId: string }>();
    const [isSending, setIsSending] = useState(false);

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
    const totalInvoiced = projectInvoices.reduce((s, inv) => s + Number(inv.amount || 0), 0);
    const totalPaid = projectInvoices.reduce((s, inv) => s + Number(inv.amount_paid || 0), 0);

    const handlePrint = () => window.print();

    const handleSendToClient = async () => {
        if (!project || !client) return;
        setIsSending(true);
        try {
            await apiNotifications.create({
                user_id: project.client_id,
                title: 'Nouvelle soumission disponible',
                message: `Une soumission pour le projet "${project.title}" est prête à consulter.`,
                type: 'info',
                link: `/dashboard/projects/${project.id}`,
            });
            toast({ title: 'Soumission envoyée', description: `${client.full_name} recevra une notification.` });
        } catch {
            toast({ title: 'Erreur', description: "Impossible d'envoyer la notification.", variant: 'destructive' });
        } finally {
            setIsSending(false);
        }
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
                <p className="text-muted-foreground">Projet introuvable.</p>
                <Button variant="ghost" onClick={() => navigate(-1)}>Retour</Button>
            </div>
        );
    }

    const sellingPrice = project.financials?.selling_price || project.budget || 0;
    const costItems = project.financials?.cost_items || [];
    const discount = 0;
    const finalTotal = sellingPrice - discount;
    const today = new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' });
    const refNumber = project.reference_number || `SL-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;

    const designFiles = [
        ...(project.stage_details?.design_files || []),
        ...(project.stage_details?.sketch_files || []),
        ...(project.stage_details?.design_versions || []).flatMap(v => v.files || []),
    ].filter((url, i, arr) => arr.indexOf(url) === i);

    const quoteItems: QuoteItem[] = costItems.length > 0
        ? costItems.map((ci, idx) => ({
            id: ci.id,
            title: ci.detail,
            description: '',
            details: [],
            price: ci.amount,
        }))
        : [{
            id: 'main',
            title: project.title,
            description: project.description || '',
            details: [],
            price: sellingPrice,
        }];

    return (
        <div className="min-h-screen bg-zinc-950 p-4 md:p-8 pb-20 print:bg-white print:p-0">
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </Button>
                <div className="flex gap-2">
                    <Button
                        onClick={handleSendToClient}
                        disabled={isSending || !client}
                        variant="outline"
                        className="border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/10"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Envoyer au client
                    </Button>
                    <Button onClick={handlePrint} className="bg-luxury-gold hover:bg-yellow-600 text-white font-bold">
                        <Printer className="w-4 h-4 mr-2" /> Imprimer / PDF
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white text-zinc-900 shadow-2xl rounded-sm overflow-hidden print:shadow-none print:rounded-none min-h-[11in]">
                <div className="h-2 bg-luxury-gold w-full" />

                <div className="p-12 md:p-16">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
                        <div>
                            <h1 className="text-5xl font-serif tracking-tighter text-zinc-900 mb-2">AUCLAIRE</h1>
                            <p className="text-xs uppercase tracking-[0.4em] text-luxury-gold font-bold">Bijouterie sur mesure</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-serif text-zinc-800 uppercase tracking-widest mb-1">Soumission</h2>
                            <p className="text-zinc-500 font-mono text-sm">Date : {today}</p>
                            <p className="text-zinc-500 font-mono text-sm">Ref : #{refNumber}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 border-t border-b border-zinc-100 py-10">
                        <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold mb-4">Préparé pour</h3>
                            <div className="space-y-1">
                                <p className="font-serif text-xl text-zinc-900">{client?.full_name || 'Client'}</p>
                                {client?.phone && <p className="text-zinc-600 text-sm">{client.phone}</p>}
                                {client?.email && <p className="text-zinc-600 text-sm">{client.email}</p>}
                            </div>
                        </div>
                        <div className="md:text-right">
                            <h3 className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold mb-4">De la part de</h3>
                            <div className="space-y-1">
                                <p className="font-serif text-xl text-zinc-900">AUCLAIRE</p>
                                <p className="text-zinc-600 text-sm italic">Soin, précision et élégance</p>
                                <p className="text-zinc-600 text-sm">Quebec, Canada</p>
                                <p className="text-zinc-600 text-sm">www.auclaire.com</p>
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
                        <h3 className="text-sm uppercase tracking-widest text-zinc-900 font-bold border-b border-zinc-900 pb-2">Détails du projet</h3>

                        {quoteItems.map((item, idx) => (
                            <div key={item.id} className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${idx > 0 ? 'pt-8 border-t border-zinc-50' : ''}`}>
                                <div className="col-span-2">
                                    <h4 className="font-serif text-2xl text-zinc-900 mb-4">{idx + 1}. {item.title}</h4>
                                    {item.description && (
                                        <p className="text-zinc-700 text-sm italic mb-2">{item.description}</p>
                                    )}
                                    {item.details.length > 0 && (
                                        <ul className="space-y-2 text-zinc-700 text-sm list-disc list-inside marker:text-luxury-gold">
                                            {item.details.map((d, i) => <li key={i}>{d}</li>)}
                                        </ul>
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
                            <h3 className="text-sm uppercase tracking-widest text-zinc-900 font-bold border-b border-zinc-900 pb-2 mb-8">Design & Visuels</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {designFiles.slice(0, 4).map((url, idx) => (
                                    <div key={idx} className="aspect-square bg-zinc-50 rounded border border-zinc-100 overflow-hidden">
                                        <img src={url} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-400 mt-4 italic">Les rendus ci-dessus sont des représentations fidèles de la conception finale.</p>
                        </div>
                    )}

                    <div className="bg-zinc-950 text-white p-12 rounded-sm mb-16 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-1">
                            {costItems.length > 1 && (
                                <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
                                    Sous-total : {formatCurrency(costItems.reduce((s, c) => s + c.amount, 0))}
                                </p>
                            )}
                            {discount > 0 && (
                                <p className="text-sm uppercase tracking-[0.3em] text-luxury-gold">
                                    Rabais AUCLAIRE : {formatCurrency(discount)}
                                </p>
                            )}
                            {totalPaid > 0 && (
                                <p className="text-sm uppercase tracking-[0.3em] text-green-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Déjà payé : {formatCurrency(totalPaid)}
                                </p>
                            )}
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Total à payer</p>
                            <p className="text-5xl font-serif text-luxury-gold">{formatCurrency(finalTotal)}</p>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-2">Taxes en sus</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-[11px] text-zinc-500 leading-relaxed uppercase tracking-widest">
                        <div>
                            <h4 className="text-zinc-900 font-bold mb-3 border-b border-zinc-100 pb-1">Modalités de paiement</h4>
                            <ul className="space-y-2">
                                <li className="flex justify-between">
                                    <span>Dépôt de 50 %</span>
                                    <span className="font-bold text-zinc-700">À la signature</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Solde restant</span>
                                    <span className="font-bold text-zinc-700">48h avant livraison</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-zinc-900 font-bold mb-3 border-b border-zinc-100 pb-1">Conditions</h4>
                            <p className="mb-2 italic">Les prix indiqués dans ce devis sont valables pour une période de 24 heures suivant son envoi.</p>
                            <p>Passé ce délai, les prix peuvent être sujets à changement selon le cours des métaux et pierres.</p>
                        </div>
                    </div>

                    <div className="mt-20 pt-10 border-t border-zinc-100 text-center">
                        <p className="text-luxury-gold font-serif text-xl mb-2">AUCLAIRE</p>
                        <p className="text-[9px] uppercase tracking-[0.5em] text-zinc-400 font-bold">Bijoux sur mesure conçus avec soin, précision et élégance.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
