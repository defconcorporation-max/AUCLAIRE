import { useNavigate } from 'react-router-dom';
import { BookOpen, Map, GraduationCap, Tag } from 'lucide-react';

export default function ResourcesHub() {
    const navigate = useNavigate();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <header className="mb-10 text-center relative">
                {/* Decorative background blur */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-luxury-gold/5 rounded-full blur-[60px] -z-10" />
                <h1 className="text-4xl md:text-5xl font-serif text-white tracking-wide mb-4 flex items-center justify-center gap-4">
                    <BookOpen className="w-8 h-8 text-luxury-gold" />
                    Centre de Ressources
                </h1>
                <p className="text-gray-400 font-serif italic max-w-2xl mx-auto">
                    Centralisation des processus, de la formation et de l'accompagnement pour offrir une expérience d'élite cohérente.
                </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                        Processus de Vente A-Z
                    </h2>

                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        Le flow complet étape par étape de Maison Auclaire. De l'entrée du lead à la livraison finale, découvrez le rôle et le stade CRM correspondant à chaque action. Idéal pour se repérer dans le cycle de vie client.
                    </p>

                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        Consulter le guide <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>

                {/* Formation Academy Card */}
                <button
                    onClick={() => navigate('/formation')}
                    className="group relative bg-white/5 dark:bg-black/40 border border-black/5 dark:border-white/10 p-8 rounded-2xl hover:border-luxury-gold/50 transition-all duration-300 text-left overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(210,181,123,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-500" />

                    <div className="w-14 h-14 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center mb-6">
                        <GraduationCap className="w-7 h-7 text-luxury-gold" />
                    </div>

                    <h2 className="text-2xl font-serif text-black dark:text-white mb-3 group-hover:text-luxury-gold transition-colors">
                        Auclaire Academy
                    </h2>

                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        L'école de formation exclusive pour les Closers Experts. Découvrez les techniques d'accompagnement, validez vos connaissances via les QCM et maîtrisez l'expertise diamantaire.
                    </p>

                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        Accéder à l'Académie <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>

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
                        Catalogue & Estimations
                    </h2>

                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        Explorez le catalogue des modèles Auclaire et estimez les prix pour vos clients. Ajoutez de nouveaux modèles au fur et à mesure pour enrichir la base de connaissances.
                    </p>

                    <div className="flex items-center text-luxury-gold text-sm font-medium">
                        Ouvrir le Catalogue <span className="ml-2 transition-transform group-hover:translate-x-2">→</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
