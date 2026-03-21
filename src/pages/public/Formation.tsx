import React, { useState, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { X, ChevronDown, ChevronRight, CheckCircle2, Search, BrainCircuit, Target, Diamond, BookOpen, GraduationCap, ArrowRight, FileText, TrendingUp, Handshake, Euro, Users, AlertCircle, ShieldCheck, Scale, Award, Gem, Heart, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { qcmProcessus, qcmExpertise } from '../../data/qcmData';
import {
    FORMATION_PHASES_FR,
    FORMATION_PHASES_EN,
    getDiamondCutsData,
    getProcessusConsultation,
    getDocumentGoals,
    getGoldenRules,
    getGemstoneCards,
    getGemstonesQuiz,
    getSettingsQuiz,
    getAlliancesQuiz,
    getFourCQuiz,
    getMetalQuiz,
    getFourCCards,
    getAnatomyBlocks,
    getMetalPanel,
    METAL_SELECTOR,
    metalLabel,
    getGoldKaratRows,
    getSettingsCards,
    getBandStyleCards,
    getBandSettingCards,
    getProngsCards,
    getHisHersCards,
} from '@/data/formation';

export default function Formation() {
    return <FormationContent />;
}

const COMMISSION_TIER_BORDER = ['border-orange-700/50', 'border-gray-400/50', 'border-yellow-500/50', 'border-[#D2B57B]/80 bg-[#D2B57B]/10'] as const;

function SectionHeader({ id, icon: Icon, title, emoji, expanded, toggleSection }: { id: string, icon?: LucideIcon, title: string, emoji?: string, expanded: boolean, toggleSection: (id: string) => void }) {
    return (
        <button
            onClick={() => toggleSection(id)}
            className="w-full flex items-center justify-between text-left pb-4 border-b border-white/10 group mb-8"
        >
            <div className="flex items-center gap-4">
                {emoji && <span className="text-3xl">{emoji}</span>}
                {Icon && <Icon className="w-8 h-8 text-[#D2B57B]" />}
                <h2 className="text-3xl font-serif text-white group-hover:text-[#D2B57B] transition-colors">{title}</h2>
            </div>
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-[#D2B57B]/20 transition-colors">
                {expanded ? <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#D2B57B]" /> : <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#D2B57B]" />}
            </div>
        </button>
    );
}

function FormationContent() {
    const { t, i18n } = useTranslation();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const expertiseSteps = [
        { id: 'cuts' as const, emoji: '💎' },
        { id: 'gemstones' as const, emoji: '🌈' },
        { id: 'settings' as const, emoji: '💍' },
        { id: 'bandStyle' as const, emoji: '➖' },
        { id: 'bandSetting' as const, emoji: '🛡️' },
        { id: 'prongs' as const, emoji: '🦅' },
        { id: 'hisHers' as const, emoji: '🎎' },
        { id: 'diamonds4c' as const, emoji: '🔍' },
        { id: 'anatomy' as const, emoji: '💍' },
        { id: 'metals' as const, emoji: '✨' },
        { id: 'gold' as const, emoji: '⚖️' }
    ];
    const [currentExpertiseStep, setCurrentExpertiseStep] = useState(0);

    const processusSteps = [
        { id: 'phases' as const, emoji: '🧭' },
        { id: 'consultation' as const, emoji: '🗣️' },
        { id: 'mindset' as const, emoji: '📜' }
    ];
    const [currentProcessusStep, setCurrentProcessusStep] = useState(0);

    const [simPrice, setSimPrice] = useState<number>(3000);
    const [simType, setSimType] = useState<'apporteur' | 'vente_complete'>('vente_complete');

    // Scénario interactif
    const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

    // Sélecteur interactif des métaux
    const [selectedMetal, setSelectedMetal] = useState<string>('platine');
    const [metalQuizAnswered, setMetalQuizAnswered] = useState<number | null>(null);

    // Quiz contextuels pour chaque section Expertise
    const [sectionQuizAnswers, setSectionQuizAnswers] = useState<Record<string, number | null>>({});
    const answerSectionQuiz = (sectionId: string, answerId: number) => {
        setSectionQuizAnswers(prev => ({ ...prev, [sectionId]: answerId }));
    };

    // Baromètre de Confiance (Processus)
    const [completedProcessusSteps, setCompletedProcessusSteps] = useState<number[]>([]);
    const toggleStepCompletion = (stepIndex: number) => {
        setCompletedProcessusSteps(prev =>
            prev.includes(stepIndex) ? prev.filter(i => i !== stepIndex) : [...prev, stepIndex]
        );
    };

    // Baromètre de Confiance (Expertise)
    const [completedExpertiseSteps, setCompletedExpertiseSteps] = useState<number[]>([]);
    const toggleExpertiseStepCompletion = (stepIndex: number) => {
        setCompletedExpertiseSteps(prev =>
            prev.includes(stepIndex) ? prev.filter(i => i !== stepIndex) : [...prev, stepIndex]
        );
    };

    // Calcul de la Progression Globale
    const totalSteps = 14; // 3 Processus + 11 Expertise
    const completedSteps = completedProcessusSteps.length + completedExpertiseSteps.length;
    const progressPercent = Math.round((completedSteps / totalSteps) * 100);

    const getBadgeInfo = () => {
        if (progressPercent === 100) return { titleKey: 'formationPage.badgeExpert' as const, icon: "👑", color: "from-yellow-400 to-[#D2B57B]", glow: "shadow-[0_0_30px_rgba(210,181,123,0.6)]" };
        if (progressPercent >= 70) return { titleKey: 'formationPage.badgeCloser' as const, icon: "💎", color: "from-blue-400 to-indigo-500", glow: "shadow-[0_0_20px_rgba(99,102,241,0.4)]" };
        if (progressPercent >= 30) return { titleKey: 'formationPage.badgeJunior' as const, icon: "🌟", color: "from-emerald-400 to-green-600", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" };
        return { titleKey: 'formationPage.badgeNovice' as const, icon: "🌱", color: "from-gray-400 to-gray-600", glow: "shadow-none" };
    };
    const badge = getBadgeInfo();

    // Calcul de la commission
    const getCommissionRate = () => simType === 'apporteur' ? 0.05 : 0.15;
    const estimatedCommission = simPrice * getCommissionRate();

    const ImageWithPreview = ({ src }: { src: string }) => (
        <img
            src={src}
            alt={t('formationPage.imagePreview')}
            onClick={() => setSelectedImage(src)}
            className="w-1/3 object-cover border-r border-white/10 cursor-pointer hover:opacity-75 transition-opacity"
        />
    );

    const phases = useMemo(() => {
        const src = i18n.language?.startsWith('en') ? FORMATION_PHASES_EN : FORMATION_PHASES_FR;
        return src.map((p, idx) => ({ id: idx + 1, ...p }));
    }, [i18n.language]);

    const diamondCutsData = useMemo(() => getDiamondCutsData(i18n.language || 'fr'), [i18n.language]);

    const consultationContent = useMemo(() => getProcessusConsultation(i18n.language || 'fr'), [i18n.language]);
    const documentGoals = useMemo(() => getDocumentGoals(i18n.language || 'fr'), [i18n.language]);
    const goldenRules = useMemo(() => getGoldenRules(i18n.language || 'fr'), [i18n.language]);
    const gemstoneCards = useMemo(() => getGemstoneCards(i18n.language || 'fr'), [i18n.language]);
    const gemstonesQuiz = useMemo(() => getGemstonesQuiz(i18n.language || 'fr'), [i18n.language]);
    const settingsQuiz = useMemo(() => getSettingsQuiz(i18n.language || 'fr'), [i18n.language]);
    const alliancesQuiz = useMemo(() => getAlliancesQuiz(i18n.language || 'fr'), [i18n.language]);
    const fourCQuiz = useMemo(() => getFourCQuiz(i18n.language || 'fr'), [i18n.language]);
    const metalQuizContent = useMemo(() => getMetalQuiz(i18n.language || 'fr'), [i18n.language]);
    const fourCCards = useMemo(() => getFourCCards(i18n.language || 'fr'), [i18n.language]);
    const anatomyBlocks = useMemo(() => getAnatomyBlocks(i18n.language || 'fr'), [i18n.language]);
    const metalDetailPanel = useMemo(() => getMetalPanel(i18n.language || 'fr', selectedMetal), [i18n.language, selectedMetal]);
    const goldKaratRows = useMemo(() => getGoldKaratRows(i18n.language || 'fr'), [i18n.language]);
    const settingsCards = useMemo(() => getSettingsCards(i18n.language || 'fr'), [i18n.language]);
    const bandStyleCards = useMemo(() => getBandStyleCards(i18n.language || 'fr'), [i18n.language]);
    const bandSettingCards = useMemo(() => getBandSettingCards(i18n.language || 'fr'), [i18n.language]);
    const prongsCards = useMemo(() => getProngsCards(i18n.language || 'fr'), [i18n.language]);
    const hisHersCards = useMemo(() => getHisHersCards(i18n.language || 'fr'), [i18n.language]);

    const locale = i18n.language?.startsWith('en') ? 'en-CA' : 'fr-CA';
    const guidesCommissionTiers = useMemo(() => {
        const tiers = t('formationPage.guides.commissionTiers', { returnObjects: true }) as { title: string; icon: string; sales: string; com: string }[];
        return tiers.map((tier, i) => ({ ...tier, color: COMMISSION_TIER_BORDER[i] ?? 'border-white/10' }));
    }, [t, i18n.language]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans selection:bg-[#D2B57B] selection:text-black pb-20 overflow-x-hidden relative">
            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-[#D2B57B] hover:text-black transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <img src={selectedImage} alt={t('formationPage.imageExpanded')} className="max-w-full max-h-[90vh] object-contain rounded-lg border border-white/20 shadow-2xl" />
                </div>
            )}

            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#D2B57B]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#D2B57B]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
                <header className="text-center mb-16 border-b border-white/10 pb-16 relative">
                    {/* Badge System */}
                    <div className="absolute top-0 right-0 hidden md:flex flex-col items-end">
                        <div className={`px-4 py-2 rounded-2xl bg-gradient-to-r ${badge.color} text-black font-bold flex items-center gap-2 ${badge.glow} transition-all duration-500`}>
                            <span className="text-xl">{badge.icon}</span> {t(badge.titleKey)}
                        </div>
                    </div>

                    <h2 className="text-[#D2B57B] text-xs md:text-sm uppercase tracking-[0.3em] mb-6 font-semibold inline-block px-5 py-2 border border-[#D2B57B]/30 rounded-full bg-[#D2B57B]/10 shadow-[0_0_20px_rgba(210,181,123,0.2)]">{t('formationPage.academyBadge')}</h2>
                    <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-[#D2B57B] bg-clip-text text-transparent font-serif leading-tight">{t('formationPage.mainTitle')}</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-serif italic mb-8">
                        {t('formationPage.mainSubtitle')}
                    </p>

                    {/* Progress Bar */}
                    <div className="max-w-xl mx-auto bg-black/50 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-300">{t('formationPage.globalProgress')}</span>
                            <span className="text-sm font-bold text-[#D2B57B]">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#D2B57B]/50 to-[#D2B57B] transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </header>

                <Tabs defaultValue="processus" className="w-full">
                    <TabsList className="w-full grid grid-cols-4 bg-black/40 border border-white/10 p-1 rounded-xl mb-12">
                        <TabsTrigger value="processus" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <BookOpen className="w-4 h-4 mr-2" /> {t('formationPage.tabProcessus')}
                        </TabsTrigger>
                        <TabsTrigger value="expertise" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <Diamond className="w-4 h-4 mr-2" /> {t('formationPage.tabExpertise')}
                        </TabsTrigger>
                        <TabsTrigger value="qcm" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <GraduationCap className="w-4 h-4 mr-2" /> {t('formationPage.tabQcm')}
                        </TabsTrigger>
                        <TabsTrigger value="guides" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <FileText className="w-4 h-4 mr-2" /> {t('formationPage.tabGuides')}
                        </TabsTrigger>
                    </TabsList>

                    {/* ONGLET 4 : GUIDES ET RESSOURCES */}
                    <TabsContent value="guides" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
                        {/* SECTION A : LE PLAN AMBASSADEURS */}
                        <section>
                            <SectionHeader id="plan-ambassadeur" emoji="💎" title={t('formationPage.guides.planSectionTitle')} expanded={true} toggleSection={() => { }} />

                            <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-4">
                                {/* Philosophie */}
                                <div className="bg-[#D2B57B]/5 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2B57B]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                                    <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-3">
                                        <Handshake className="w-5 h-5" /> {t('formationPage.guides.philosophyTitle')}
                                    </h3>
                                    <blockquote className="border-l-2 border-[#D2B57B] pl-6 py-2 my-6">
                                        <p className="text-2xl font-serif text-white italic">{t('formationPage.guides.philosophyQuote')}</p>
                                    </blockquote>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {t('formationPage.guides.philosophyBody')}
                                    </p>
                                </div>

                                {/* Profils */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-green-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent to-green-500/50"></div>
                                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" /> {t('formationPage.guides.profileSoughtTitle')}
                                        </h4>
                                        <ul className="space-y-3">
                                            {(t('formationPage.guides.profileSoughtItems', { returnObjects: true }) as string[]).map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></span>
                                                    <span className="text-sm text-gray-300">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-white/5 border border-red-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent to-red-500/50"></div>
                                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-red-500" /> {t('formationPage.guides.profileExcludedTitle')}
                                        </h4>
                                        <ul className="space-y-3">
                                            {(t('formationPage.guides.profileExcludedItems', { returnObjects: true }) as string[]).map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2 shrink-0"></span>
                                                    <span className="text-sm text-gray-300">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Commissions */}
                                <div>
                                    <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                                        <Euro className="w-5 h-5 text-[#D2B57B]" /> {t('formationPage.guides.commissionTiersTitle')}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {guidesCommissionTiers.map((tier, i) => (
                                            <div key={i} className={`bg-black/50 border ${tier.color} rounded-xl p-5 text-center flex flex-col items-center justify-center relative overflow-hidden transition-transform hover:-translate-y-1`}>
                                                <span className="text-3xl mb-2">{tier.icon}</span>
                                                <h4 className="font-bold text-white text-lg">{tier.title}</h4>
                                                <p className="text-xs text-gray-400 mt-1 mb-3 bg-white/5 px-2 py-1 rounded-full">{tier.sales}</p>
                                                <p className="text-[#D2B57B] font-bold text-xl">{tier.com}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Rôles & Engagements Mutuels */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
                                    <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                                        <Scale className="w-5 h-5 text-[#D2B57B]" /> {t('formationPage.guides.rolesMutualTitle')}
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-[#D2B57B] font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> {t('formationPage.guides.roleAmbassadorTitle')}</h4>
                                            <ul className="space-y-3">
                                                {(t('formationPage.guides.roleAmbassadorItems', { returnObjects: true }) as string[]).map((line, idx, arr) => (
                                                    <li key={idx} className={`flex items-start gap-2 text-sm text-gray-300 ${idx === arr.length - 1 ? 'italic max-w-sm' : ''}`}>
                                                        <span className="text-[#D2B57B] mt-1">•</span> {line}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#D2B57B]" /> {t('formationPage.guides.roleAuclaireTitle')}</h4>
                                            <ul className="space-y-3">
                                                {(t('formationPage.guides.roleAuclaireItems', { returnObjects: true }) as string[]).map((line, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                                        <span className="text-[#D2B57B] mt-1">•</span> {line}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Simulateur Interactif */}
                                <div className="mt-12 bg-black/60 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(210,181,123,0.1)]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D2B57B]/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none"></div>
                                    <h3 className="text-2xl font-serif text-[#D2B57B] mb-2 flex items-center gap-3">
                                        <TrendingUp className="w-6 h-6" /> {t('formationPage.guides.simulatorTitle')}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-8">{t('formationPage.guides.simulatorIntro')}</p>

                                    <div className="grid md:grid-cols-2 gap-12 items-center">
                                        <div className="space-y-6">
                                            {/* Input Prix */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">{t('formationPage.guides.simulatorPriceLabel')}</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D2B57B] font-bold">$</span>
                                                    <Input
                                                        type="number"
                                                        value={simPrice}
                                                        onChange={(e) => setSimPrice(Number(e.target.value))}
                                                        className="h-14 pl-10 bg-black/50 border-white/10 text-xl font-bold text-white focus:border-[#D2B57B] rounded-xl"
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1500" max="25000" step="100"
                                                    value={simPrice}
                                                    onChange={(e) => setSimPrice(Number(e.target.value))}
                                                    className="w-full mt-4 accent-[#D2B57B]"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                                                    <span>{t('formationPage.guides.simulatorMin')}</span>
                                                    <span>{t('formationPage.guides.simulatorAvg')}</span>
                                                    <span>{t('formationPage.guides.simulatorMax')}</span>
                                                </div>
                                            </div>

                                            {/* Toggle Role */}
                                            <div className="bg-black/40 p-1.5 rounded-xl border border-white/5 grid grid-cols-2 gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setSimType('apporteur')}
                                                    className={`py-3 rounded-lg text-sm font-medium transition-all ${simType === 'apporteur' ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    {t('formationPage.guides.simTypeApporteur')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSimType('vente_complete')}
                                                    className={`py-3 rounded-lg text-sm font-medium transition-all ${simType === 'vente_complete' ? 'bg-[#D2B57B] text-black shadow-md shadow-[#D2B57B]/20' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    {t('formationPage.guides.simTypeVenteComplete')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Resultat */}
                                        <div className="flex flex-col items-center justify-center p-8 border border-white/5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent relative">
                                            <p className="text-gray-400 text-sm uppercase tracking-widest font-medium mb-4">{t('formationPage.guides.estimatedCommissionLabel')}</p>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-5xl md:text-7xl font-bold font-serif text-white animate-in zoom-in duration-300" key={estimatedCommission}>
                                                    {estimatedCommission.toLocaleString(locale, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                            <p className="text-[#D2B57B] text-sm mt-4 flex items-center gap-2 bg-[#D2B57B]/10 px-4 py-2 rounded-full border border-[#D2B57B]/20">
                                                <Award className="w-4 h-4" />
                                                {simType === 'apporteur' ? t('formationPage.guides.simFootnoteApporteur') : t('formationPage.guides.simFootnoteVente')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION B : GUIDE OPÉRATIONNEL */}
                        <section>
                            <SectionHeader id="guide-op" emoji="🗺️" title={t('formationPage.guides.operationalGuideTitle')} expanded={true} toggleSection={() => { }} />

                            <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-4">
                                {/* Incarner l'excellence : Règles d'or */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-10 shadow-lg">
                                    <h3 className="text-xl font-serif text-[#D2B57B] mb-6 flex items-center gap-3">
                                        <Diamond className="w-5 h-5" /> {t('formationPage.guides.excellenceTitle')}
                                    </h3>
                                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                                        {t('formationPage.guides.excellenceBody')}
                                    </p>
                                    <p className="text-white italic font-serif text-sm mb-8">{t('formationPage.guides.excellenceQuote')}</p>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-green-500/30 pb-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" /> {t('formationPage.guides.goldenRulesTitle')}
                                            </h4>
                                            <ul className="space-y-3">
                                                {(t('formationPage.guides.goldenRulesItems', { returnObjects: true }) as string[]).map((line, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-500">✓</span> {line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-red-500/30 pb-2">
                                                <AlertCircle className="w-4 h-4 text-red-500" /> {t('formationPage.guides.forbiddenTitle')}
                                            </h4>
                                            <ul className="space-y-3">
                                                {(t('formationPage.guides.forbiddenItems', { returnObjects: true }) as string[]).map((line, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300"><span className="text-red-500">⨯</span> {line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Atout 3D & Avantage Ambassadeur */}
                                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                                        <div className="bg-black/30 border border-white/5 rounded-xl p-5">
                                            <h5 className="font-bold text-[#D2B57B] mb-2 flex items-center gap-2">{t('formationPage.guides.studio3dTitle')}</h5>
                                            <p className="text-xs text-gray-400">{t('formationPage.guides.studio3dBody')}</p>
                                        </div>
                                        <div className="bg-black/30 border border-[#D2B57B]/20 rounded-xl p-5 relative overflow-hidden">
                                            <div className="absolute -right-4 -bottom-4"><Gem className="w-16 h-16 text-[#D2B57B]/10" /></div>
                                            <h5 className="font-bold text-white mb-2 flex items-center gap-2">{t('formationPage.guides.ambassadorAdvantageTitle')}</h5>
                                            <p className="text-xs text-gray-400">
                                                <Trans i18nKey="formationPage.guides.ambassadorAdvantageBody" components={{ strong: <strong className="text-white" /> }} />
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg hover:border-[#D2B57B]/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-2xl font-serif text-white">{t('formationPage.guides.apporteurTitle')}</h4>
                                            <span className="bg-white/10 text-white font-bold px-3 py-1 rounded-full text-sm">{t('formationPage.guides.apporteurRange')}</span>
                                        </div>
                                        <p className="text-sm text-[#D2B57B] uppercase tracking-widest mb-6">{t('formationPage.guides.apporteurSubtitle')}</p>
                                        <p className="text-gray-400 text-sm mb-6 min-h-[2.5rem]">{t('formationPage.guides.apporteurDesc')}</p>
                                        <ol className="space-y-4 text-sm text-gray-300">
                                            {(t('formationPage.guides.apporteurSteps', { returnObjects: true }) as string[]).map((step, idx) => (
                                                <li key={idx} className="flex gap-3"><span className="text-[#D2B57B] font-bold">{idx + 1}.</span> {step}</li>
                                            ))}
                                        </ol>
                                        <div className="mt-8 pt-4 border-t border-white/10 hidden md:block">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest">{t('formationPage.guides.exampleRingLabel')}</p>
                                            <p className="text-lg font-bold text-white mt-1">
                                                {t('formationPage.guides.earnApproxLabel')}{' '}
                                                <span className="text-[#D2B57B]">{t('formationPage.guides.exampleApporteurAmount')}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-[#D2B57B]/5 border border-[#D2B57B]/30 rounded-2xl p-8 shadow-lg hover:border-[#D2B57B]/60 transition-colors relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2B57B]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-2xl font-serif text-[#D2B57B]">{t('formationPage.guides.venteCompleteTitle')}</h4>
                                            <span className="bg-[#D2B57B] text-black font-bold px-3 py-1 rounded-full text-sm">{t('formationPage.guides.venteCompleteBadge')}</span>
                                        </div>
                                        <p className="text-sm text-white uppercase tracking-widest mb-6 font-medium">{t('formationPage.guides.venteCompleteSubtitle')}</p>
                                        <p className="text-gray-400 text-sm mb-6 min-h-[2.5rem]">{t('formationPage.guides.venteCompleteDesc')}</p>
                                        <ol className="space-y-4 text-sm text-gray-300 relative z-10">
                                            {(t('formationPage.guides.venteCompleteSteps', { returnObjects: true }) as string[]).map((step, idx) => (
                                                <li key={idx} className="flex gap-3"><span className="text-[#D2B57B] font-bold">{idx + 1}.</span> {step}</li>
                                            ))}
                                        </ol>
                                        <div className="mt-8 pt-4 border-t border-[#D2B57B]/20 relative z-10 hidden md:block">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest">{t('formationPage.guides.exampleRingLabel')}</p>
                                            <p className="text-lg font-bold text-white mt-1">
                                                {t('formationPage.guides.earnApproxLabel')}{' '}
                                                <span className="text-[#D2B57B]">{t('formationPage.guides.exampleVenteAmount')}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Strategies d'acquisition */}
                                <div>
                                    <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                                        <TrendingUp className="w-5 h-5 text-[#D2B57B]" /> {t('formationPage.guides.acquisitionTitle')}
                                    </h3>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                                        <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                            <Users className="w-5 h-5 text-[#D2B57B]" /> {t('formationPage.guides.nailSalonTitle')}
                                        </h4>
                                        <p className="text-gray-400 text-sm mb-4">
                                            {t('formationPage.guides.nailSalonBody')}
                                        </p>
                                        <div className="bg-black/50 p-4 rounded-lg text-sm text-gray-300 border border-white/5">
                                            <ul className="space-y-2">
                                                {(t('formationPage.guides.nailSalonItems', { returnObjects: true }) as string[]).map((line, idx) => (
                                                    <li key={idx}><span className="text-[#D2B57B] mr-2">✓</span> {line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                            <h4 className="text-lg font-bold text-white mb-3">{t('formationPage.guides.socialTitle')}</h4>
                                            <ul className="space-y-2 text-sm text-gray-400">
                                                {(t('formationPage.guides.socialItems', { returnObjects: true }) as string[]).map((line, idx) => (
                                                    <li key={idx}>• {line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                            <h4 className="text-lg font-bold text-white mb-3">{t('formationPage.guides.marketplaceTitle')}</h4>
                                            <ul className="space-y-2 text-sm text-gray-400">
                                                {(t('formationPage.guides.marketplaceItems', { returnObjects: true }) as string[]).map((line, idx) => (
                                                    <li key={idx}>• {line}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </TabsContent>

                    {/* ONGLET 1 : PROCESSUS ET ACCOMPAGNEMENT */}
                    <TabsContent value="processus" className="animate-in fade-in zoom-in-95 duration-500">
                        {/* Stepper Header */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-8 no-scrollbar border-b border-white/5 snap-x">
                            {processusSteps.map((step, idx) => {
                                const isCompleted = completedProcessusSteps.includes(idx);
                                const isCurrent = currentProcessusStep === idx;
                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => setCurrentProcessusStep(idx)}
                                        className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border snap-start relative ${isCurrent
                                            ? 'bg-[#D2B57B] text-black border-[#D2B57B] shadow-[0_0_15px_rgba(210,181,123,0.3)]'
                                            : isCompleted
                                                ? 'bg-[#D2B57B]/10 text-[#D2B57B] border-[#D2B57B]/50 hover:bg-[#D2B57B]/20'
                                                : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <span className="mr-2 opacity-80">{step.emoji}</span>
                                            {t(`formationPage.processusSteps.${step.id}`)}
                                            {isCompleted && <CheckCircle2 className="w-4 h-4 ml-2 text-green-500 shrink-0 animate-in zoom-in" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="min-h-[600px] pb-12">
                            {currentProcessusStep === 0 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🧭</span> {t('formationPage.processSectionTitle')}
                                    </h2>
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                        {phases.map((phase) => (
                                            <div key={phase.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#0a0a0a] group-hover:bg-[#D2B57B] transition-colors shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-[#D2B57B] group-hover:text-black font-serif font-bold text-sm">
                                                    {phase.id}
                                                </div>
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                                    <h3 className="text-2xl font-serif text-white mb-1">{t('formationPage.phaseHeading', { n: phase.id, title: phase.title })}</h3>
                                                    <p className="text-[#D2B57B] text-[10px] uppercase tracking-[0.2em] mb-4">{phase.subtitle}</p>
                                                    <div className="mb-4">
                                                        <h5 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 flex items-center gap-2"><Target className="w-3 h-3" /> {t('formationPage.labelObjective')}</h5>
                                                        <p className="text-sm text-gray-300">{phase.objectif}</p>
                                                    </div>
                                                    {phase.mindset && (
                                                        <div className="mb-4">
                                                            <h5 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 flex items-center gap-2"><BrainCircuit className="w-3 h-3" /> {t('formationPage.labelMindsetCloser')}</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {phase.mindset.map(m => <span key={m} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 capitalize">{m}</span>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {phase.questions && (
                                                        <div className="bg-black/30 rounded-lg p-4 mb-2 border border-white/5">
                                                            <h5 className="text-[10px] uppercase tracking-[0.2em] text-[#D2B57B] mb-2">{t('formationPage.labelSuggestedQuestions')}</h5>
                                                            <ul className="list-disc text-sm space-y-2 text-gray-300 ml-4">
                                                                {phase.questions.map(q => <li key={q}>{q}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {phase.hint && <p className="text-xs text-[#D2B57B] italic opacity-80 mt-3 pt-3 border-t border-white/5">👉 {phase.hint}</p>}
                                                    {phase.detection && (
                                                        <div className="mt-4 pt-3 border-t border-white/5">
                                                            <h5 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 flex items-center gap-2"><Search className="w-3 h-3" /> {t('formationPage.labelDetectMust')}</h5>
                                                            <div className="flex flex-wrap gap-2 text-xs">
                                                                {phase.detection.map(d => <span key={d} className="text-gray-400">• {d}</span>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>


                                </section>
                            )}

                            {currentProcessusStep === 1 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🗣️</span> {consultationContent.sectionTitle}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {consultationContent.cards.map((card, cardIdx) => (
                                            <div key={cardIdx} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors shadow-lg">
                                                <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-2">
                                                    {cardIdx === 0 && <Target className="w-5 h-5" />}
                                                    {cardIdx === 1 && <Search className="w-5 h-5" />}
                                                    {cardIdx === 2 && <Heart className="w-5 h-5" />}
                                                    {cardIdx === 3 && <Gem className="w-5 h-5" />}
                                                    {card.title}
                                                </h3>
                                                <ul className="space-y-3 text-sm text-gray-300">
                                                    {card.bullets.map((line, i) => (
                                                        <li key={i} className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>{line}</span></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 bg-black/40 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_20px_rgba(210,181,123,0.1)]">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2B57B]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                                        <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-3">
                                            <BrainCircuit className="w-6 h-6" /> {consultationContent.quiz.title}
                                        </h3>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                                            <p className="text-gray-200 italic font-medium leading-relaxed">{consultationContent.quiz.scenario}</p>
                                        </div>
                                        <div className="space-y-3">
                                            {consultationContent.quiz.options.map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => setQuizAnswered(option.id)}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all ${quizAnswered === option.id
                                                        ? option.isCorrect
                                                            ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                                            : 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                                        : 'bg-black/50 border-white/10 hover:border-[#D2B57B]/50 hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-200 pr-4">{option.text}</span>
                                                        {quizAnswered === option.id && (
                                                            option.isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <X className="w-5 h-5 text-red-500 shrink-0" />
                                                        )}
                                                    </div>
                                                    {quizAnswered === option.id && (
                                                        <div className="mt-3 pt-3 border-t border-white/10 text-sm font-medium animate-in slide-in-from-top-2">
                                                            <span className={option.isCorrect ? 'text-green-500' : 'text-red-500'}>{option.feedback}</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>


                                </section>
                            )}

                            {currentProcessusStep === 2 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-12">
                                    <div>
                                        <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                            <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">⭐</span> {documentGoals.title}
                                        </h2>
                                        <div className="bg-[#D2B57B]/10 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden shadow-lg">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D2B57B]/5 rounded-full blur-[50px] -mr-20 -mt-20 pointer-events-none"></div>
                                            <p className="text-gray-300 mb-6 font-medium">{documentGoals.intro}</p>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {documentGoals.goals.map((g, i) => (
                                                    <div key={i} className="flex items-center gap-3"><CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" /><span className="text-gray-200">{g}</span></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                            <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">📜</span> {goldenRules.title}
                                        </h2>
                                        <div className="bg-gradient-to-r from-[#D2B57B]/20 to-[#D2B57B]/5 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden text-center shadow-[0_0_30px_rgba(210,181,123,0.15)]">
                                            <div className="max-w-2xl mx-auto space-y-4 text-left">
                                                {goldenRules.rules.map((rule, ri) => (
                                                    <div key={ri} className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B]/30 transition-colors">
                                                        <span className="text-2xl">{rule.emoji}</span>
                                                        <p className="text-gray-200 font-medium">
                                                            {rule.segments.map((seg, si) => (
                                                                <span key={si} className={seg.accent ? 'text-[#D2B57B]' : undefined}>{seg.text}</span>
                                                            ))}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Component UI pour valider la section Processus courante */}
                            <div className="mt-16 flex justify-center pb-8 border-t border-white/5 pt-12">
                                <button
                                    onClick={() => toggleStepCompletion(currentProcessusStep)}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-serif text-lg transition-all duration-300 border ${completedProcessusSteps.includes(currentProcessusStep)
                                        ? 'bg-[#D2B57B] text-black border-[#D2B57B] shadow-[0_0_20px_rgba(210,181,123,0.4)]'
                                        : 'bg-black/50 text-gray-400 border-white/20 hover:border-[#D2B57B]/50 hover:text-white'
                                        }`}
                                >
                                    {completedProcessusSteps.includes(currentProcessusStep) ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-current opacity-50"></div>}
                                    {t('formationPage.sectionAssimilated')}
                                </button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ONGLET 2 : EXPERTISE */}
                    <TabsContent value="expertise" className="animate-in fade-in zoom-in-95 duration-500">
                        {/* Stepper Header */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-8 no-scrollbar border-b border-white/5 snap-x">
                            {expertiseSteps.map((step, idx) => {
                                const isCompleted = completedExpertiseSteps.includes(idx);
                                const isCurrent = currentExpertiseStep === idx;
                                return (
                                    <button
                                        key={step.id}
                                        onClick={() => setCurrentExpertiseStep(idx)}
                                        className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border snap-start relative ${isCurrent
                                            ? 'bg-[#D2B57B] text-black border-[#D2B57B] shadow-[0_0_15px_rgba(210,181,123,0.3)]'
                                            : isCompleted
                                                ? 'bg-[#D2B57B]/10 text-[#D2B57B] border-[#D2B57B]/50 hover:bg-[#D2B57B]/20'
                                                : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <span className="mr-2 opacity-80">{step.emoji}</span>
                                            {t(`formationPage.expertiseSteps.${step.id}`)}
                                            {isCompleted && <CheckCircle2 className="w-4 h-4 ml-2 text-green-500 shrink-0 animate-in zoom-in" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="min-h-[600px] pb-12">
                            {/* SECTION COUPES DE DIAMANTS */}
                            {currentExpertiseStep === 0 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">💎</span> {t('formationPage.edu.cutsGuideTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {diamondCutsData.map((cut, idx) => (
                                            <div key={idx} className="w-full h-80 group [perspective:1000px] cursor-pointer">
                                                <div className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)]">

                                                    {/* RECTO */}
                                                    <div className="absolute inset-0 [backface-visibility:hidden] bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4">
                                                        {cut.isNew && (
                                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-[#D2B57B]/80 to-[#D2B57B] text-black px-2 py-0.5 rounded-md shadow-lg z-10">
                                                                <span className="text-[10px] uppercase font-bold tracking-wider">{t('formationPage.edu.badgeNew')}</span>
                                                            </div>
                                                        )}
                                                        <div className="w-32 h-32 mb-6 rounded-full overflow-hidden border border-[#D2B57B]/30 p-2 bg-black/60 shadow-[inset_0_0_20px_rgba(210,181,123,0.1)] flex items-center justify-center relative">
                                                            <ImageWithPreview src={cut.img} />
                                                        </div>
                                                        <h3 className="text-2xl font-serif text-white">{cut.name}</h3>
                                                        <p className="text-[10px] text-[#D2B57B] uppercase tracking-widest mt-3 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"><ArrowRight className="w-3 h-3" /> {t('formationPage.edu.revealDetails')}</p>
                                                    </div>

                                                    {/* VERSO */}
                                                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-black/90 border border-[#D2B57B] rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(210,181,123,0.2)]">
                                                        <h3 className="text-xl font-serif text-white mb-2">{cut.name}</h3>
                                                        <span className="text-[10px] font-sans tracking-widest text-[#D2B57B] block mb-4 uppercase">{cut.subtitle}</span>
                                                        <p className="text-sm text-gray-300 leading-relaxed mb-6">{cut.desc}</p>
                                                        <div className="flex flex-wrap justify-center gap-2 mt-auto">
                                                            {cut.tags.map((tag, i) => (
                                                                <span key={i} className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* SECTION TYPES DE GEMMES */}
                            {currentExpertiseStep === 1 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🌈</span> {t('formationPage.edu.gemstonesTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {gemstoneCards.map(item => (
                                            <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
                                                <div className="flex h-32 overflow-hidden bg-black/50">
                                                    <ImageWithPreview src={item.imgs[0]} />
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="text-xl font-serif text-white mb-2">{item.title}</h3>
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto">
                                                        {item.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 bg-[#D2B57B]/5 border border-[#D2B57B]/20 rounded-2xl p-6">
                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-3 flex items-center gap-2">
                                            <Gem className="w-4 h-4" /> {t('formationPage.edu.gemstonesTipTitle')}
                                        </h4>
                                        <p className="text-xs text-gray-300 leading-relaxed">{t('formationPage.edu.gemstonesTipBody')}</p>
                                    </div>

                                    <div className="mt-6 bg-black/40 border border-[#D2B57B]/30 rounded-2xl p-6">
                                        <h4 className="text-white font-serif text-lg mb-4">{gemstonesQuiz.title}</h4>
                                        <p className="text-sm text-gray-300 italic mb-4">{gemstonesQuiz.prompt}</p>
                                        <div className="space-y-2">
                                            {gemstonesQuiz.options.map(o => (
                                                <button key={o.id} onClick={() => answerSectionQuiz('gemmes', o.id)} disabled={sectionQuizAnswers['gemmes'] != null}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${sectionQuizAnswers['gemmes'] === o.id ? (o.isCorrect ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50') : sectionQuizAnswers['gemmes'] != null && o.isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-black/50 border-white/10 hover:border-[#D2B57B]/50'}`}>
                                                    <span className="text-gray-200">{o.text}</span>
                                                    {sectionQuizAnswers['gemmes'] === o.id && <p className="mt-2 text-xs text-gray-400 border-t border-white/5 pt-2">{o.feedback}</p>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* SECTION TYPES DE SETTINGS */}
                            {currentExpertiseStep === 2 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">💍</span> {t('formationPage.edu.settingsTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {settingsCards.map(item => (
                                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
                                                <div className="flex h-32 overflow-hidden bg-black/50">
                                                    <ImageWithPreview src={item.imgs[0]} />
                                                    <ImageWithPreview src={item.imgs[1]} />
                                                    <ImageWithPreview src={item.imgs[2]} />
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="text-xl font-serif text-white mb-2">{item.title}</h3>
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto">
                                                        {item.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 bg-[#D2B57B]/5 border border-[#D2B57B]/20 rounded-2xl p-6">
                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-3 flex items-center gap-2">
                                            <Diamond className="w-4 h-4" /> {t('formationPage.edu.settingsTipTitle')}
                                        </h4>
                                        <p className="text-xs text-gray-300 leading-relaxed">{t('formationPage.edu.settingsTipBody')}</p>
                                    </div>

                                    <div className="mt-6 bg-black/40 border border-[#D2B57B]/30 rounded-2xl p-6">
                                        <h4 className="text-white font-serif text-lg mb-4">{settingsQuiz.title}</h4>
                                        <p className="text-sm text-gray-300 italic mb-4">{settingsQuiz.prompt}</p>
                                        <div className="space-y-2">
                                            {settingsQuiz.options.map(o => (
                                                <button key={o.id} onClick={() => answerSectionQuiz('montures', o.id)} disabled={sectionQuizAnswers['montures'] != null}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${sectionQuizAnswers['montures'] === o.id ? (o.isCorrect ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50') : sectionQuizAnswers['montures'] != null && o.isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-black/50 border-white/10 hover:border-[#D2B57B]/50'}`}>
                                                    <span className="text-gray-200">{o.text}</span>
                                                    {sectionQuizAnswers['montures'] === o.id && <p className="mt-2 text-xs text-gray-400 border-t border-white/5 pt-2">{o.feedback}</p>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* SECTION TYPES DE JONC */}
                            {currentExpertiseStep === 3 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">➖</span> {t('formationPage.edu.bandStyleTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {bandStyleCards.map(item => (
                                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
                                                <div className="flex h-32 overflow-hidden bg-black/50">
                                                    <ImageWithPreview src={item.imgs[0]} />
                                                    <ImageWithPreview src={item.imgs[1]} />
                                                    <ImageWithPreview src={item.imgs[2]} />
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="text-xl font-serif text-white mb-2">{item.title}</h3>
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto">
                                                        {item.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* SECTION TYPES DE SERTISSAGE DU JONC */}
                            {currentExpertiseStep === 4 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🛡️</span> {t('formationPage.edu.bandSettingTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {bandSettingCards.map(item => (
                                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
                                                <div className="flex h-32 overflow-hidden bg-black/50">
                                                    <ImageWithPreview src={item.imgs[0]} />
                                                    <ImageWithPreview src={item.imgs[1]} />
                                                    <ImageWithPreview src={item.imgs[2]} />
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="text-xl font-serif text-white mb-2">{item.title}</h3>
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto">
                                                        {item.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* SECTION TYPES DE PRONGS */}
                            {currentExpertiseStep === 5 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🦅</span> {t('formationPage.edu.prongsTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {prongsCards.map(item => (
                                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
                                                <div className="flex h-32 overflow-hidden bg-black/50">
                                                    <ImageWithPreview src={item.imgs[0]} />
                                                    <ImageWithPreview src={item.imgs[1]} />
                                                    <ImageWithPreview src={item.imgs[2]} />
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="text-xl font-serif text-white mb-2">{item.title}</h3>
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto">
                                                        {item.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* SECTION BAGUES HIS & HERS */}
                            {currentExpertiseStep === 6 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🎎</span> {t('formationPage.edu.hisHersTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {hisHersCards.map(item => (
                                            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
                                                <div className="flex h-32 overflow-hidden bg-black/50">
                                                    <ImageWithPreview src={item.imgs[0]} />
                                                    <ImageWithPreview src={item.imgs[1]} />
                                                    <ImageWithPreview src={item.imgs[2]} />
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="text-xl font-serif text-white mb-2">{item.title}</h3>
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-auto">
                                                        {item.tags.map(tag => (
                                                            <span key={tag} className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 bg-[#D2B57B]/5 border border-[#D2B57B]/20 rounded-2xl p-6">
                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-3 flex items-center gap-2">
                                            <Heart className="w-4 h-4" /> {t('formationPage.edu.hisHersTipTitle')}
                                        </h4>
                                        <p className="text-xs text-gray-300 leading-relaxed">{t('formationPage.edu.hisHersTipBody')}</p>
                                    </div>

                                    <div className="mt-6 bg-black/40 border border-[#D2B57B]/30 rounded-2xl p-6">
                                        <h4 className="text-white font-serif text-lg mb-4">{alliancesQuiz.title}</h4>
                                        <p className="text-sm text-gray-300 italic mb-4">{alliancesQuiz.prompt}</p>
                                        <div className="space-y-2">
                                            {alliancesQuiz.options.map(o => (
                                                <button key={o.id} onClick={() => answerSectionQuiz('alliances', o.id)} disabled={sectionQuizAnswers['alliances'] != null}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${sectionQuizAnswers['alliances'] === o.id ? (o.isCorrect ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50') : sectionQuizAnswers['alliances'] != null && o.isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-black/50 border-white/10 hover:border-[#D2B57B]/50'}`}>
                                                    <span className="text-gray-200">{o.text}</span>
                                                    {sectionQuizAnswers['alliances'] === o.id && <p className="mt-2 text-xs text-gray-400 border-t border-white/5 pt-2">{o.feedback}</p>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* SECTION LES 4C DU DIAMANT */}
                            {currentExpertiseStep === 7 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🔍</span> {t('formationPage.edu.fourCTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {fourCCards.map((c) => (
                                            <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                                <h3 className="text-xl font-serif text-white mb-2">{c.title} <span className="text-[#D2B57B] text-sm">{c.subtitle}</span></h3>
                                                <p className="text-gray-400 text-sm mb-4">{c.body}</p>
                                                <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                    <p className="text-xs text-[#D2B57B]">💬 <b>{c.pitchLabel}</b> {c.pitch}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 bg-[#D2B57B]/5 border border-[#D2B57B]/20 rounded-2xl p-6">
                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-3 flex items-center gap-2">
                                            <Search className="w-4 h-4" /> {t('formationPage.edu.fourCStrategyTitle')}
                                        </h4>
                                        <p className="text-xs text-gray-300 leading-relaxed mb-3">{t('formationPage.edu.fourCStrategyBody')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400">{t('formationPage.edu.fourCTagCut')}</span>
                                            <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">{t('formationPage.edu.fourCTagCarat')}</span>
                                            <span className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-400">{t('formationPage.edu.fourCTagColor')}</span>
                                            <span className="px-3 py-1.5 bg-gray-500/10 border border-gray-500/20 rounded-full text-xs text-gray-400">{t('formationPage.edu.fourCTagClarity')}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-black/40 border border-[#D2B57B]/30 rounded-2xl p-6">
                                        <h4 className="text-white font-serif text-lg mb-4">{fourCQuiz.title}</h4>
                                        <p className="text-sm text-gray-300 italic mb-4">{fourCQuiz.prompt}</p>
                                        <div className="space-y-2">
                                            {fourCQuiz.options.map(o => (
                                                <button key={o.id} onClick={() => answerSectionQuiz('4c', o.id)} disabled={sectionQuizAnswers['4c'] != null}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${sectionQuizAnswers['4c'] === o.id ? (o.isCorrect ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50') : sectionQuizAnswers['4c'] != null && o.isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-black/50 border-white/10 hover:border-[#D2B57B]/50'}`}>
                                                    <span className="text-gray-200">{o.text}</span>
                                                    {sectionQuizAnswers['4c'] === o.id && <p className="mt-2 text-xs text-gray-400 border-t border-white/5 pt-2">{o.feedback}</p>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}
                            {currentExpertiseStep === 8 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">💍</span> {t('formationPage.edu.anatomyTitle')}
                                    </h2>
                                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-8 animate-in fade-in slide-in-from-top-4">
                                        <div className="grid md:grid-cols-2 gap-8 items-center">
                                            <div className="space-y-6">
                                                {anatomyBlocks.map((block, bi) => (
                                                    <div key={bi} className="border-l-2 border-[#D2B57B] pl-4">
                                                        <h4 className="text-white font-serif text-lg mb-1">{block.title}</h4>
                                                        <p className="text-sm text-gray-400">{block.body}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-black/50 border border-white/10 rounded-xl p-6 text-center">
                                                <div className="w-full rounded-xl border border-white/10 overflow-hidden cursor-zoom-in group" onClick={() => setSelectedImage('/anatomie-bague.png')}>
                                                    <img src="/anatomie-bague.png" alt={t('formationPage.edu.anatomyTitle')} className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<span class="text-gray-500 text-sm p-8 block">${t('formationPage.edu.anatomyImageMissing')}</span>`; }} />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest">{t('formationPage.edu.anatomyLexicon')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* SECTION METAUX AVANCES - INTERACTIF */}
                            {currentExpertiseStep === 9 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">✨</span> {t('formationPage.edu.metalsTitle')}
                                    </h2>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                                        {METAL_SELECTOR.map(metal => (
                                            <button
                                                key={metal.id}
                                                onClick={() => setSelectedMetal(metal.id)}
                                                className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-center group ${selectedMetal === metal.id
                                                    ? 'border-[#D2B57B] bg-[#D2B57B]/10 shadow-[0_0_20px_rgba(210,181,123,0.3)] scale-105'
                                                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:scale-102'
                                                    }`}
                                            >
                                                <span className="text-2xl block mb-2">{metal.emoji}</span>
                                                <span className={`text-sm font-semibold ${selectedMetal === metal.id ? 'text-[#D2B57B]' : 'text-gray-300'
                                                    }`}>{metalLabel(i18n.language || 'fr', metal.id)}</span>
                                                {selectedMetal === metal.id && (
                                                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r ${metal.color}`}></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-300" key={selectedMetal}>
                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-serif text-white flex items-center gap-3">{metalDetailPanel.heading}</h3>
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                    <h4 className="text-green-400 font-bold text-sm mb-2">✅ {t('formationPage.edu.advantages')}</h4>
                                                    <ul className="text-xs text-gray-300 space-y-1">
                                                        {metalDetailPanel.pros.map((line, i) => <li key={i}>• {line}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                                    <h4 className="text-red-400 font-bold text-sm mb-2">⚠️ {t('formationPage.edu.disadvantages')}</h4>
                                                    <ul className="text-xs text-gray-300 space-y-1">
                                                        {metalDetailPanel.cons.map((line, i) => <li key={i}>• {line}</li>)}
                                                    </ul>
                                                </div>
                                                {metalDetailPanel.pitch ? (
                                                    <div className="bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded-xl p-4">
                                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-2">💬 {t('formationPage.edu.pitchSeller')}</h4>
                                                        <p className="text-xs text-gray-300 italic">{metalDetailPanel.pitch}</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                                        <h4 className="text-red-400 font-bold text-sm mb-2">{metalDetailPanel.recommendationTitle}</h4>
                                                        <p className="text-xs text-gray-300 italic">{metalDetailPanel.recommendationBody}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                                        <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5" /> {t('formationPage.edu.metalsAllergyTitle')}
                                        </h4>
                                        <p className="text-sm text-gray-300 mb-3">{t('formationPage.edu.metalsAllergyBody')}</p>
                                        <div className="flex flex-wrap gap-3">
                                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">{t('formationPage.edu.allergyPlatinumChip')}</span>
                                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">{t('formationPage.edu.allergyYellowGoldChip')}</span>
                                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">{t('formationPage.edu.allergyRoseGoldChip')}</span>
                                        </div>
                                    </div>

                                    <div className="mt-10 bg-black/40 border border-[#D2B57B]/30 rounded-2xl p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="text-3xl">🧠</span>
                                            <div>
                                                <h3 className="text-xl font-serif text-white">{t('formationPage.edu.metalsQuizTitle')}</h3>
                                                <p className="text-xs text-gray-400 mt-1">{t('formationPage.edu.metalsQuizSubtitle')}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
                                            <p className="text-sm text-gray-200 italic">🎯 <strong className="text-white">{t('formationPage.edu.scenarioLabel')}</strong> {t('formationPage.edu.metalsQuizScenario')}</p>
                                        </div>
                                        <div className="space-y-3">
                                            {metalQuizContent.options.map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => setMetalQuizAnswered(option.id)}
                                                    disabled={metalQuizAnswered !== null}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${metalQuizAnswered === option.id
                                                        ? option.isCorrect
                                                            ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                                            : 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                                        : metalQuizAnswered !== null && option.isCorrect
                                                            ? 'bg-green-500/5 border-green-500/30'
                                                            : 'bg-black/50 border-white/10 hover:border-[#D2B57B]/50 hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-200 pr-4">{option.text}</span>
                                                        {metalQuizAnswered === option.id && (
                                                            <span className="text-lg shrink-0">{option.isCorrect ? '✅' : '❌'}</span>
                                                        )}
                                                        {metalQuizAnswered !== null && metalQuizAnswered !== option.id && option.isCorrect && (
                                                            <span className="text-lg shrink-0">✅</span>
                                                        )}
                                                    </div>
                                                    {metalQuizAnswered === option.id && (
                                                        <p className="mt-3 text-xs text-gray-400 border-t border-white/5 pt-3">{option.feedback}</p>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* SECTION OR JAUNE */}
                            {currentExpertiseStep === 10 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">⚖️</span> {t('formationPage.edu.goldVisualTitle')}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {goldKaratRows.map(gold => (
                                            <div key={gold.k} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                                <div className="flex h-32 overflow-hidden bg-black/50">
                                                    <ImageWithPreview src={gold.imgs[0]} />
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="text-2xl font-serif text-white mb-2">{t('formationPage.edu.goldKaratLabel', { k: gold.k })}</h3>
                                                    <p className="text-sm text-gray-400">{gold.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Component UI pour valider la section Expertise courante */}
                            <div className="mt-16 flex justify-center pb-8 border-t border-white/5 pt-12">
                                <button
                                    onClick={() => toggleExpertiseStepCompletion(currentExpertiseStep)}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-full font-serif text-lg transition-all duration-300 border ${completedExpertiseSteps.includes(currentExpertiseStep)
                                        ? 'bg-[#D2B57B] text-black border-[#D2B57B] shadow-[0_0_20px_rgba(210,181,123,0.4)]'
                                        : 'bg-black/50 text-gray-400 border-white/20 hover:border-[#D2B57B]/50 hover:text-white'
                                        }`}
                                >
                                    {completedExpertiseSteps.includes(currentExpertiseStep) ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-current opacity-50"></div>}
                                    {t('formationPage.sectionAssimilated')}
                                </button>
                            </div>
                        </div>

                        {/* Stepper Footer Navigation */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-8">
                            <button
                                onClick={() => setCurrentExpertiseStep(Math.max(0, currentExpertiseStep - 1))}
                                disabled={currentExpertiseStep === 0}
                                className={`px-6 py-3 rounded-xl font-medium transition-all ${currentExpertiseStep === 0 ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-500' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {t('formationPage.previous')}
                            </button>

                            <div className="flex gap-2">
                                {expertiseSteps.map((_, idx) => (
                                    <div key={idx} className={`h-2 rounded-full transition-all ${currentExpertiseStep === idx ? 'w-8 bg-[#D2B57B]' : 'w-2 bg-white/10'}`} />
                                ))}
                            </div>

                            {currentExpertiseStep < expertiseSteps.length - 1 ? (
                                <button
                                    onClick={() => setCurrentExpertiseStep(Math.min(expertiseSteps.length - 1, currentExpertiseStep + 1))}
                                    className="px-6 py-3 rounded-xl font-medium bg-[#D2B57B] text-black hover:bg-[#D2B57B]/90 transition-all shadow-[0_0_20px_rgba(210,181,123,0.3)] hover:shadow-[0_0_30px_rgba(210,181,123,0.5)]"
                                >
                                    {t('formationPage.next')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        const qcmTabsTrigger = document.querySelector('[value="qcm"]') as HTMLElement;
                                        if (qcmTabsTrigger) qcmTabsTrigger.click();
                                    }}
                                    className="px-6 py-3 rounded-xl font-medium bg-green-500 text-black hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] flex items-center gap-2"
                                >
                                    {t('formationPage.goToQcm')} <CheckCircle2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </TabsContent>

                    {/* ONGLET 3 : QCM OFFICIEL */}
                    <TabsContent value="qcm" className="animate-in fade-in zoom-in-95 duration-500">
                        <QCMSection />
                    </TabsContent>
                </Tabs>

                <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="text-[#D2B57B] font-serif text-2xl italic tracking-widest mb-2">{t('formationPage.footerBrand')}</div>
                    <p className="text-gray-600 text-xs uppercase tracking-widest">{t('formationPage.footerTagline')}</p>
                </footer>
            </div>
        </div >
    );
}

function QCMSection() {
    const { t } = useTranslation();
    const [salespersonName, setSalespersonName] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [answersProcessus, setAnswersProcessus] = useState<Record<number, number>>({});
    const [answersExpertise, setAnswersExpertise] = useState<Record<number, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<{ proc: number, exp: number } | null>(null);

    const getGrade = (total: number) => {
        if (total >= 190) return { titleKey: 'formationPage.qcmGradeElite' as const, color: 'text-[#D2B57B]' };
        if (total >= 160) return { titleKey: 'formationPage.qcmGradeCloser' as const, color: 'text-green-400' };
        if (total >= 120) return { titleKey: 'formationPage.qcmGradeJunior' as const, color: 'text-yellow-400' };
        return { titleKey: 'formationPage.qcmGradeNovice' as const, color: 'text-red-400' };
    };

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (salespersonName.trim()) setHasStarted(true);
    };

    const calculateScore = () => {
        let processScore = 0;
        let expertiseScore = 0;

        qcmProcessus.forEach(q => { if (answersProcessus[q.id] === q.correctAnswer) processScore += q.points; });
        qcmExpertise.forEach(q => { if (answersExpertise[q.id] === q.correctAnswer) expertiseScore += q.points; });

        return { processScore, expertiseScore };
    };

    const handleSubmit = async () => {
        // Validate all answers are filled
        if (Object.keys(answersProcessus).length < qcmProcessus.length || Object.keys(answersExpertise).length < qcmExpertise.length) {
            alert(t('formationPage.qcmAlertAllQuestions'));
            return;
        }

        setIsSubmitting(true);
        const { processScore, expertiseScore } = calculateScore();

        try {
            const { error } = await supabase.from('formation_results').insert({
                salesperson_name: salespersonName,
                score_processus: processScore,
                score_expertise: expertiseScore,
                total_score: processScore + expertiseScore,
                answers_processus: answersProcessus,
                answers_expertise: answersExpertise,
            });

            if (error) {
                console.error("Error saving QCM to Supabase:", error);
                alert(t('formationPage.qcmSaveError', { message: error.message }));
            } else {
                setResults({ proc: processScore, exp: expertiseScore });
                setIsSubmitted(true);
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (e) {
            console.error("Unknown error:", e);
            alert(t('formationPage.qcmUnexpectedError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hasStarted) {
        return (
            <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm mt-12 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-[#D2B57B]/10 rounded-full border border-[#D2B57B]/30">
                        <Target className="w-8 h-8 text-[#D2B57B]" />
                    </div>
                </div>
                <h2 className="text-3xl font-serif text-white text-center mb-4">{t('formationPage.qcmOfficialTitle')}</h2>
                <p className="text-gray-400 text-center text-sm mb-8">{t('formationPage.qcmIntro')}</p>

                <form onSubmit={handleStart} className="space-y-6">
                    <div>
                        <label className="text-xs text-[#D2B57B] uppercase tracking-wider mb-2 block font-semibold">{t('formationPage.qcmFullNameLabel')}</label>
                        <Input
                            value={salespersonName}
                            onChange={(e) => setSalespersonName(e.target.value)}
                            placeholder={t('formationPage.qcmNamePlaceholder')}
                            className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-[#D2B57B] h-12"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full bg-[#D2B57B] text-black hover:bg-[#D2B57B]/90 h-12 font-medium">
                        {t('formationPage.qcmStartEvaluation')} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            </div>
        );
    }

    if (isSubmitted && results) {
        return (
            <div className="max-w-2xl mx-auto bg-gradient-to-b from-[#D2B57B]/20 to-transparent border border-[#D2B57B]/30 rounded-2xl p-12 backdrop-blur-sm mt-12 shadow-[0_0_30px_rgba(210,181,123,0.15)] text-center animate-in fade-in zoom-in">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="w-16 h-16 text-[#D2B57B]" />
                </div>
                <h2 className="text-4xl font-serif text-white mb-6">{t('formationPage.qcmEvaluationComplete')}</h2>
                <p className="text-gray-300 text-lg mb-8">{t('formationPage.qcmThanksSaved', { name: salespersonName })}</p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{t('formationPage.qcmLabelProcessus')}</p>
                        <p className="text-4xl font-serif text-[#D2B57B]">{results.proc} <span className="text-lg text-gray-500">{t('formationPage.qcmOutOf100')}</span></p>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{t('formationPage.qcmLabelExpertise')}</p>
                        <p className="text-4xl font-serif text-[#D2B57B]">{results.exp} <span className="text-lg text-gray-500">{t('formationPage.qcmOutOf100')}</span></p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-2xl font-serif text-white mb-2">{t('formationPage.qcmTotalScore', { score: results.proc + results.exp })} <span className="text-sm text-gray-400">{t('formationPage.qcmOutOf200')}</span></p>
                    {(() => {
                        const grade = getGrade(results.proc + results.exp);
                        return <p className={`text-xl font-bold uppercase tracking-widest ${grade.color}`}>{t(grade.titleKey)}</p>;
                    })()}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-8 relative">
            <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md p-4 border-b border-white/10 mb-8 flex justify-between items-center rounded-xl">
                <p className="text-sm text-gray-300">{t('formationPage.qcmCandidate')}: <span className="text-[#D2B57B] font-medium">{salespersonName}</span></p>
                <div className="flex gap-4 text-xs font-mono text-gray-400">
                    <span className={Object.keys(answersProcessus).length === qcmProcessus.length ? 'text-green-400' : ''}>{t('formationPage.qcmStickyProcessus', { answered: Object.keys(answersProcessus).length, total: qcmProcessus.length })}</span>
                    <span className={Object.keys(answersExpertise).length === qcmExpertise.length ? 'text-green-400' : ''}>{t('formationPage.qcmStickyExpertise', { answered: Object.keys(answersExpertise).length, total: qcmExpertise.length })}</span>
                </div>
            </div>

            <div className="space-y-12">
                <div>
                    <h3 className="text-2xl font-serif text-[#D2B57B] mb-8 flex items-center gap-3"><BookOpen className="w-6 h-6" /> {t('formationPage.qcmPart1Title')}</h3>
                    <div className="space-y-8">
                        {qcmProcessus.map((q) => (
                            <div key={`proc_${q.id}`} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-[#D2B57B]/30 transition-colors">
                                <p className="text-lg text-white mb-4"><span className="text-[#D2B57B] font-serif mr-2">{q.id}.</span> {q.question} <span className="text-xs text-gray-500 ml-2">{t('formationPage.qcmPoints', { points: q.points })}</span></p>
                                <div className="space-y-3">
                                    {q.options.map((opt, idx) => (
                                        <label
                                            key={idx}
                                            onClick={() => setAnswersProcessus({ ...answersProcessus, [q.id]: idx })}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answersProcessus[q.id] === idx ? 'bg-[#D2B57B]/20 border-[#D2B57B]' : 'border-white/5 bg-black/40 hover:bg-white/5'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${answersProcessus[q.id] === idx ? 'border-[#D2B57B]' : 'border-gray-500'}`}>
                                                {answersProcessus[q.id] === idx && <div className="w-2 h-2 rounded-full bg-[#D2B57B]" />}
                                            </div>
                                            <span className="text-sm text-gray-300">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-serif text-[#D2B57B] mb-8 flex items-center gap-3"><Diamond className="w-6 h-6" /> {t('formationPage.qcmPart2Title')}</h3>
                    <div className="space-y-8">
                        {qcmExpertise.map((q) => (
                            <div key={`exp_${q.id}`} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-[#D2B57B]/30 transition-colors">
                                <p className="text-lg text-white mb-4"><span className="text-[#D2B57B] font-serif mr-2">{q.id}.</span> {q.question} <span className="text-xs text-gray-500 ml-2">{t('formationPage.qcmPoints', { points: q.points })}</span></p>
                                <div className="space-y-3">
                                    {q.options.map((opt, idx) => (
                                        <label
                                            key={idx}
                                            onClick={() => setAnswersExpertise({ ...answersExpertise, [q.id]: idx })}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answersExpertise[q.id] === idx ? 'bg-[#D2B57B]/20 border-[#D2B57B]' : 'border-white/5 bg-black/40 hover:bg-white/5'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${answersExpertise[q.id] === idx ? 'border-[#D2B57B]' : 'border-gray-500'}`}>
                                                {answersExpertise[q.id] === idx && <div className="w-2 h-2 rounded-full bg-[#D2B57B]" />}
                                            </div>
                                            <span className="text-sm text-gray-300">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 pb-20">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-[#D2B57B] to-[#b39b65] text-black hover:opacity-90 h-16 text-lg font-serif"
                    >
                        {isSubmitting ? t('formationPage.qcmSubmitting') : t('formationPage.qcmSubmit')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
