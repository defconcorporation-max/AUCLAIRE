import { useNavigate } from 'react-router-dom';
import { BookOpen, Map, GraduationCap, Tag, Calculator, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ResourcesHub() {
    const navigate = useNavigate();
    const { role } = useAuth();
    const { t } = useTranslation();
    const canAccessFlashQuote = role !== 'manufacturer';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <header className="mb-10 text-center relative">
                {/* Decorative background blur */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-luxury-gold/5 rounded-full blur-[60px] -z-10" />
                <h1 className="text-4xl md:text-5xl font-serif text-white tracking-wide mb-4 flex items-center justify-center gap-4">
                    <BookOpen className="w-8 h-8 text-luxury-gold" />
                    {t('resourcesHub.title')}
                </h1>
                <p className="text-gray-400 font-serif italic max-w-2xl mx-auto">
                    {t('resourcesHub.subtitle')}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Processus de Vente Card */}
                <button
                    onClick={() => navigate('/dashboard/resources/sales-process')}
                    className="group relative bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/10 p-8 rounded-2xl hover:border-luxury-gold/50 transition-all duration-300 text-left overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-500" />
                    <div className="w-14 h-14 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center mb-6">
                        <Map className="w-7 h-7 text-luxury-gold" />
                    </div>
                    <h2 className="text-2xl font-serif text-black dark:text-white mb-3 group-hover:text-luxury-gold transition-colors">
                        {t('resourcesHub.salesProcess')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        {t('resourcesHub.salesProcessBody')}
                    </p>
                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        {t('resourcesHub.openGuide')} <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>

                {/* Formation Academy Card (Expertise) */}
                <button
                    onClick={() => navigate('/formation')}
                    className="group relative bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/10 p-8 rounded-2xl hover:border-luxury-gold/50 transition-all duration-300 text-left overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-500" />
                    <div className="w-14 h-14 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center mb-6">
                        <GraduationCap className="w-7 h-7 text-luxury-gold" />
                    </div>
                    <h2 className="text-2xl font-serif text-black dark:text-white mb-3 group-hover:text-luxury-gold transition-colors">
                        Academy Expertise
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        Maîtrisez les métaux, les gemmes et l'anatomie des bijoux Maison Auclaire.
                    </p>
                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        Ouvrir l'Académie <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>

                {/* Formation Marketing Card */}
                <button
                    onClick={() => navigate('/formation/marketing')}
                    className="group relative bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/10 p-8 rounded-2xl hover:border-luxury-gold/50 transition-all duration-300 text-left overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-500" />
                    <div className="w-14 h-14 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center mb-6">
                        <TrendingUp className="w-7 h-7 text-luxury-gold" />
                    </div>
                    <h2 className="text-2xl font-serif text-black dark:text-white mb-3 group-hover:text-luxury-gold transition-colors">
                        Marketing Training
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        Guide stratégique et workflow pour le Marketing Manager : Social Media & Influence.
                    </p>
                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        Débuter la formation <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>

                {/* Formation Programme Partenaire */}
                <button
                    onClick={() => navigate('/formation/partenaires')}
                    className="group relative bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/10 p-8 rounded-2xl hover:border-luxury-gold/50 transition-all duration-300 text-left overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-500" />
                    <div className="w-14 h-14 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center mb-6">
                        <Handshake className="w-7 h-7 text-luxury-gold" />
                    </div>
                    <h2 className="text-2xl font-serif text-black dark:text-white mb-3 group-hover:text-luxury-gold transition-colors">
                        Programme Partenaires
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        Détails des paliers, primes et commissions pour nos Ambassadeurs et Affiliés.
                    </p>
                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        Ouvrir le document <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>

                {/* Flash Calculator */}
                {canAccessFlashQuote && (
                <button
                    onClick={() => navigate('/dashboard/resources/calculator')}
                    className="group relative bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/10 p-8 rounded-2xl hover:border-luxury-gold/50 transition-all duration-300 text-left overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-500" />
                    <div className="w-14 h-14 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center mb-6">
                        <Calculator className="w-7 h-7 text-luxury-gold" />
                    </div>
                    <h2 className="text-2xl font-serif text-black dark:text-white mb-3 group-hover:text-luxury-gold transition-colors">
                        {t('resourcesHub.flashQuote')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        {t('resourcesHub.flashQuoteBody')}
                    </p>
                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        {t('resourcesHub.openCalculator')} <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>
                )}

                {/* Catalogue & Pricing Card */}
                <button
                    onClick={() => navigate('/dashboard/resources/catalog')}
                    className="group relative bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/10 p-8 rounded-2xl hover:border-luxury-gold/50 transition-all duration-300 text-left overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-500" />
                    <div className="w-14 h-14 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center mb-6">
                        <Tag className="w-7 h-7 text-luxury-gold" />
                    </div>
                    <h2 className="text-2xl font-serif text-black dark:text-white mb-3 group-hover:text-luxury-gold transition-colors">
                        {t('resourcesHub.catalog')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        {t('resourcesHub.catalogBody')}
                    </p>
                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        {t('resourcesHub.openCatalog')} <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
