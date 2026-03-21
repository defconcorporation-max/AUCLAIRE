import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type StepI18n = {
    title: string;
    stage: string;
    roles: string[];
    details: string[];
    hint?: string;
    objective?: string;
};

const STEP_META: Record<number, { emoji: string; images?: string[] }> = {
    1: { emoji: '👋', images: ['/images/process/phase-1.png'] },
    2: { emoji: '🎯', images: ['/images/process/phase-2.png'] },
    3: { emoji: '📝', images: ['/images/process/phase-3.png'] },
    4: { emoji: '💻', images: ['/images/process/phase-4-1.png', '/images/process/phase-4-2.png'] },
    5: { emoji: '🤝', images: ['/images/process/phase-5.png'] },
    6: { emoji: '💳', images: ['/images/process/phase-6.png'] },
    7: { emoji: '🔨', images: ['/images/process/phase-7.png'] },
    8: { emoji: '📦' },
    9: { emoji: '📸' },
};

export default function SalesProcess() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const steps = useMemo(() => {
        return ([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((id) => {
            const data = t(`salesProcessPage.step${id}`, { returnObjects: true }) as StepI18n;
            const meta = STEP_META[id];
            const hint = data.hint?.trim();
            const objective = data.objective?.trim();
            return {
                id,
                title: data.title,
                stage: data.stage,
                roles: data.roles,
                details: data.details,
                hint: hint || undefined,
                objective: objective || undefined,
                emoji: meta.emoji,
                images: meta.images,
            };
        });
    }, [t]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
            <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/resources')}
                className="mb-4 text-gray-400 hover:text-white"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('salesProcessPage.back')}
            </Button>

            <header className="mb-12 border-b border-black/10 dark:border-white/10 pb-8 text-center md:text-left relative">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-luxury-gold/5 rounded-full blur-[60px] pointer-events-none -z-10" />
                <h1 className="text-3xl md:text-5xl font-serif text-black dark:text-white tracking-wide mb-4">
                    {t('salesProcessPage.title')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {t('salesProcessPage.subtitle')}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5 dark:border-white/10">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {t('salesProcessPage.flowSummary')}
                    </span>
                    <span className="text-xs text-luxury-gold italic">
                        {t('salesProcessPage.flowLine')}
                    </span>
                </div>
            </header>

            <div className="relative border-l-2 border-luxury-gold/20 ml-4 md:ml-8 pl-8 md:pl-12 space-y-12">
                {steps.map((step) => (
                    <div key={step.id} className="relative group">
                        <div className="absolute -left-[45px] top-0 md:-left-[61px] w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-[#0a0a0a] border-4 border-[#0a0a0a] dark:border-white ring-2 ring-luxury-gold/50 flex items-center justify-center font-bold text-lg md:text-xl shadow-[0_0_15px_rgba(210,181,123,0.3)] z-10 transition-transform group-hover:scale-110">
                            {step.emoji}
                        </div>

                        <div className="bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-2xl p-6 md:p-8 hover:border-luxury-gold/50 transition-colors shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b border-black/5 dark:border-white/5">
                                <div>
                                    <h3 className="text-2xl font-serif text-black dark:text-white mb-2 group-hover:text-luxury-gold transition-colors">
                                        {step.id}️⃣ {step.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs rounded-full font-medium tracking-wider uppercase">
                                            {t('salesProcessPage.stageGhl')} {step.stage}
                                        </span>
                                        {step.roles.map((r) => (
                                            <span key={r} className="px-3 py-1 bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20 text-xs rounded-full font-medium tracking-wider uppercase">
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-6">
                                {step.details.map((detail, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                        <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">{detail}</span>
                                    </li>
                                ))}
                            </ul>

                            {step.objective && (
                                <div className="mt-6 bg-black/5 dark:bg-black/60 border border-black/10 dark:border-white/5 p-4 rounded-xl flex items-start gap-3">
                                    <span className="text-xl">🎯</span>
                                    <div>
                                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-1">{t('salesProcessPage.mainObjective')}</span>
                                        <p className="text-sm font-medium text-black dark:text-white">{step.objective}</p>
                                    </div>
                                </div>
                            )}

                            {step.hint && (
                                <div className="mt-4 text-sm font-medium text-luxury-gold italic bg-luxury-gold/5 px-4 py-3 rounded-xl inline-block border border-luxury-gold/10">
                                    {step.hint}
                                </div>
                            )}

                            {step.images && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                    {step.images.map((img, idx) => (
                                        <div key={idx} className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-lg">
                                            <img src={img} alt={t('salesProcessPage.phaseAlt', { id: step.id })} className="w-full h-auto object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
