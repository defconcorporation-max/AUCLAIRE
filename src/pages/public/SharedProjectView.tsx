import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiProjects } from '@/services/apiProjects';
import { apiInvoices } from '@/services/apiInvoices';
import { Loader2, AlertCircle, MessageCircle, PenTool, ThumbsUp, Hammer, Sparkles, CreditCard, Gem, Ruler, Info, Clock } from 'lucide-react';
import { useState } from 'react';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import type { StageDetails } from '@/services/apiProjects';

// Timeline steps (labels via i18n: sharedProjectPage.timeline_<id>)
const TIMELINE_STEPS = [
    { id: 'consultation', statuses: ['designing'] },
    { id: 'design', statuses: ['3d_model', 'design_ready', 'design_modification', 'waiting_for_approval'] },
    { id: 'approval', statuses: ['approved_for_production'] },
    { id: 'production', statuses: ['production'] },
    { id: 'delivery', statuses: ['delivery', 'completed'] },
] as const;

function getStepIndex(status: string | undefined): number {
    if (!status) return 0;
    for (let i = 0; i < TIMELINE_STEPS.length; i++) {
        if ((TIMELINE_STEPS[i].statuses as readonly string[]).includes(status)) return i;
    }
    if (status === 'completed') return 4;
    return 0;
}

export default function SharedProjectView() {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language?.startsWith('fr') ? 'fr-CA' : 'en-CA';
    const { token } = useParams<{ token: string }>();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data: project, isLoading, error } = useQuery({
        queryKey: ['shared-project', token],
        queryFn: () => apiProjects.getByToken(token!),
        enabled: !!token
    });

    const { data: invoices = [] } = useQuery({
        queryKey: ['shared-invoices', token],
        queryFn: () => apiInvoices.getByProjectToken(token!),
        enabled: !!token && !!project
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#D2B57B]" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-6">
                <AlertCircle className="w-16 h-16 text-red-400/80" />
                <h1 className="text-2xl font-serif text-white">{t('sharedProjectPage.invalidLink')}</h1>
                <p className="text-zinc-500 text-center max-w-md">{t('sharedProjectPage.invalidLinkDesc')}</p>
            </div>
        );
    }

    const details = (project.stage_details || {}) as StageDetails & Record<string, unknown>;
    const designFiles = details.design_files || [];
    const sketchFiles = details.sketch_files || [];
    const versionFiles = (details.design_versions || []).flatMap((v: { files?: string[] }) => v.files || []);
    
    const initialDesignImages = sketchFiles;
    const threeDDesignImages = [...designFiles, ...versionFiles];

    const currentStepIndex = getStepIndex(project.status);

    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.stripe_payment_link);
    const totalDue = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.amount_paid || 0)), 0);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">
            {/* Header */}
            <header className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-[#D2B57B]/10 via-transparent to-transparent" />
                <div className="relative max-w-5xl mx-auto px-6 py-8">
                    <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#D2B57B] tracking-[0.2em]">
                        AUCLAIRE
                    </h1>
                    <p className="text-xs text-zinc-500 uppercase tracking-[0.3em] mt-1">{t('sharedProjectPage.brandTagline')}</p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">
                {/* Project title & status */}
                <section className="page-fade-in">
                    {project.status === 'cancelled' && (
                        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-400/90 text-sm">
                            {t('sharedProjectPage.projectCancelled')}
                        </div>
                    )}
                    <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">{project.title}</h2>
                    {project.description && (
                        <p className="text-zinc-400 max-w-2xl">{project.description}</p>
                    )}
                </section>

                {/* Project status timeline - horizontal */}
                <section className="page-fade-in">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D2B57B]/80 mb-6">
                        {t('sharedProjectPage.progressTitle')}
                    </h3>
                    <div className="flex flex-wrap gap-2 md:gap-0 md:flex-nowrap md:justify-between relative">
                        <div className="absolute top-5 left-0 right-0 h-px bg-zinc-800 hidden md:block" style={{ top: '1.25rem' }} />
                        {TIMELINE_STEPS.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const isPending = index > currentStepIndex;
                            return (
                                <div key={step.id} className="relative flex flex-col items-center gap-2 z-10 animate-in fade-in duration-500" style={{ animationDelay: `${index * 80}ms` }}>
                                    <div
                                        className={`
                                            w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                            ${isCompleted ? 'bg-emerald-600/80 border-emerald-500 text-white' : ''}
                                            ${isCurrent ? 'bg-[#D2B57B] border-[#D2B57B] text-black shadow-[0_0_20px_rgba(210,181,123,0.4)]' : ''}
                                            ${isPending ? 'bg-zinc-900/80 border-zinc-700 text-zinc-500' : ''}
                                        `}
                                    >
                                        {index === 0 && <MessageCircle className="w-4 h-4" />}
                                        {index === 1 && <PenTool className="w-4 h-4" />}
                                        {index === 2 && <ThumbsUp className="w-4 h-4" />}
                                        {index === 3 && <Hammer className="w-4 h-4" />}
                                        {index === 4 && <Gem className="w-4 h-4" />}
                                    </div>
                                    <span
                                        className={`text-[10px] font-medium uppercase tracking-wider text-center max-w-[80px] ${
                                            isCurrent ? 'text-[#D2B57B]' : isCompleted ? 'text-emerald-400/80' : 'text-zinc-500'
                                        }`}
                                    >
                                        {t(`sharedProjectPage.timeline_${step.id}`)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mt-8">
                        {(project.deadline || project.stage_details?.delivery_date) && (
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-luxury-gold" />
                                <span>
                                    {t('sharedProjectPage.estimatedDeliveryPrefix')}{' '}
                                    <strong className="text-white">
                                        {new Date(project.stage_details?.delivery_date || project.deadline!).toLocaleDateString(localeTag, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </strong>
                                </span>
                            </div>
                        )}
                        {project.updated_at && (
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-gray-500" />
                                <span>
                                    {t('sharedProjectPage.lastUpdated', {
                                        date: new Date(project.updated_at).toLocaleDateString(localeTag, { year: 'numeric', month: 'long', day: 'numeric' }),
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* 1. Initial Design Showcase */}
                {initialDesignImages.length > 0 && (
                    <section className="page-fade-in">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D2B57B]/80 mb-6 flex items-center gap-2">
                            <PenTool className="w-4 h-4" /> {t('sharedProjectPage.creationsTitleInitial')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {initialDesignImages.map((url: string, idx: number) => (
                                <div
                                    key={idx}
                                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-zinc-900/50 backdrop-blur-sm hover:border-[#D2B57B]/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                                >
                                    <img
                                        src={url}
                                        alt={t('sharedProjectPage.designAlt', { n: idx + 1 })}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                                        onClick={() => setPreviewUrl(url)}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. 3D Design Showcase */}
                {threeDDesignImages.length > 0 && (
                    <section className="page-fade-in">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D2B57B]/80 mb-6 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> {t('sharedProjectPage.creationsTitle3D')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {threeDDesignImages.map((url: string, idx: number) => (
                                <div
                                    key={idx}
                                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-zinc-900/50 backdrop-blur-sm hover:border-[#D2B57B]/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                                >
                                    <img
                                        src={url}
                                        alt={t('sharedProjectPage.designAlt', { n: idx + 1 })}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                                        onClick={() => setPreviewUrl(url)}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Work In Progress */}
                {project.stage_details?.vault_files && project.stage_details.vault_files.length > 0 && (
                    <section className="page-fade-in space-y-4">
                        <h2 className="text-xl font-serif text-center">{t('sharedProjectPage.wipTitle')}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {project.stage_details.vault_files.map((url: string, idx: number) => (
                                <div
                                    key={idx}
                                    className="aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                    onClick={() => setPreviewUrl(url)}
                                >
                                    <img src={url} alt={t('sharedProjectPage.wipAlt', { n: idx + 1 })} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Project specs */}
                <section className="page-fade-in">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D2B57B]/80 mb-6 flex items-center gap-2">
                        <Info className="w-4 h-4" /> {t('sharedProjectPage.detailsTitle')}
                    </h3>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 space-y-4">
                        {details.design_notes && (
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">{t('sharedProjectPage.designNotes')}</span>
                                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{details.design_notes}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(details as Record<string, unknown>).ring_size && (
                                <div className="flex items-center gap-3">
                                    <Ruler className="w-4 h-4 text-[#D2B57B]" />
                                    <div>
                                        <span className="text-[10px] text-zinc-500 uppercase">{t('sharedProjectPage.size')}</span>
                                        <p className="text-sm font-medium">{(details as Record<string, unknown>).ring_size as string}</p>
                                    </div>
                                </div>
                            )}
                            {((details as Record<string, unknown>).metal_type || (details as Record<string, unknown>).metal) && (
                                <div className="flex items-center gap-3">
                                    <Gem className="w-4 h-4 text-[#D2B57B]" />
                                    <div>
                                        <span className="text-[10px] text-zinc-500 uppercase">{t('sharedProjectPage.metal')}</span>
                                        <p className="text-sm font-medium">
                                            {((details as Record<string, unknown>).metal_type || (details as Record<string, unknown>).metal) as string}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {((details as Record<string, unknown>).gemstone || (details as Record<string, unknown>).gemstones || (details as Record<string, unknown>).stone_type) && (
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-4 h-4 text-[#D2B57B]" />
                                    <div>
                                        <span className="text-[10px] text-zinc-500 uppercase">{t('sharedProjectPage.stone')}</span>
                                        <p className="text-sm font-medium">
                                            {((details as Record<string, unknown>).gemstone || (details as Record<string, unknown>).gemstones || (details as Record<string, unknown>).stone_type) as string}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {project.deadline && (
                            <div className="pt-4 border-t border-white/5">
                                <span className="text-[10px] text-zinc-500 uppercase">{t('sharedProjectPage.deadlineExpected')}</span>
                                <p className="text-sm text-[#D2B57B]">{new Date(project.deadline).toLocaleDateString(localeTag, { dateStyle: 'long' })}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Payment CTA */}
                {unpaidInvoices.length > 0 && (
                    <section className="page-fade-in">
                        <div className="rounded-2xl border border-[#D2B57B]/20 bg-gradient-to-br from-[#D2B57B]/10 to-transparent p-8 text-center">
                            <CreditCard className="w-10 h-10 text-[#D2B57B] mx-auto mb-4" />
                            <h3 className="text-lg font-serif text-white mb-2">{t('sharedProjectPage.balanceTitle')}</h3>
                            <p className="text-3xl font-serif font-semibold text-[#D2B57B] mb-6">
                                {totalDue.toLocaleString(localeTag, { style: 'currency', currency: 'CAD' })}
                            </p>
                            <a
                                href={unpaidInvoices[0].stripe_payment_link!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-[#D2B57B] text-black font-semibold uppercase tracking-wider rounded-lg hover:bg-[#E5C98A] transition-all duration-300 shadow-[0_0_25px_rgba(210,181,123,0.3)] hover:shadow-[0_0_35px_rgba(210,181,123,0.4)]"
                            >
                                {t('sharedProjectPage.payNow')}
                            </a>
                        </div>
                    </section>
                )}

                {/* Client info note */}
                <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                    <p className="text-sm text-zinc-500 text-center">
                        {t('sharedProjectPage.readOnlyNote')}
                    </p>
                </section>
            </main>

            {/* Footer */}
            <footer className="mt-16 border-t border-white/5 py-10">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-xl font-serif text-[#D2B57B] tracking-[0.15em]">AUCLAIRE</h2>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] mt-2">{t('sharedProjectPage.footerCraft')}</p>
                </div>
            </footer>

            <ImagePreviewModal
                isOpen={!!previewUrl}
                imageUrl={previewUrl}
                onClose={() => setPreviewUrl(null)}
                title={t('sharedProjectPage.previewTitle')}
            />
        </div>
    );
}
