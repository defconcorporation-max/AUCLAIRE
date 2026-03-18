import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const STEPS = [
    {
        title: 'Bienvenue chez AUCLAIRE',
        description: 'Ce guide vous présente les fonctionnalités clés de votre CRM. Cliquez "Suivant" pour commencer.',
        position: 'center' as const,
    },
    {
        title: 'Dashboard',
        description: 'Votre tableau de bord affiche les KPIs essentiels : revenus, projets en cours, et pipeline de production.',
        position: 'center' as const,
    },
    {
        title: 'Projets',
        description: 'Créez et gérez vos projets de bijouterie. Chaque projet suit un workflow : Design → Approbation → Production → Livraison.',
        position: 'center' as const,
    },
    {
        title: 'Factures',
        description: 'Gérez vos factures avec l\'historique de paiements multiples (acomptes + solde). Exportez en CSV pour votre comptabilité.',
        position: 'center' as const,
    },
    {
        title: 'Recherche Rapide',
        description: 'Utilisez Ctrl+K (ou ⌘K sur Mac) pour rechercher instantanément un projet, client ou facture.',
        position: 'center' as const,
    },
    {
        title: 'Messages',
        description: 'Communiquez avec votre équipe directement dans le CRM, organisé par projet.',
        position: 'center' as const,
    },
    {
        title: 'Personnalisation',
        description: 'Changez le thème (clair/sombre) et la couleur d\'accent (or, argent, rose) depuis l\'en-tête.',
        position: 'center' as const,
    },
    {
        title: 'Prêt à commencer!',
        description: 'Explorez l\'application à votre rythme. Vous pouvez relancer ce guide depuis les paramètres.',
        position: 'center' as const,
    },
];

const STORAGE_KEY = 'auclaire_onboarding_complete';

export function OnboardingTour() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    const next = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
        else dismiss();
    };

    const prev = () => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    if (!isVisible) return null;

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
            <div className="relative bg-white dark:bg-zinc-900 border border-luxury-gold/30 rounded-2xl shadow-2xl shadow-luxury-gold/10 max-w-md w-full mx-4 animate-in zoom-in-95 fade-in duration-300">
                <div className="absolute -top-3 -right-3">
                    <button onClick={dismiss} className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-luxury-gold" />
                        <span className="text-[10px] uppercase tracking-widest text-luxury-gold font-bold">
                            Étape {currentStep + 1} / {STEPS.length}
                        </span>
                    </div>
                    <h3 className="text-xl font-serif font-bold mt-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.description}</p>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                    <div className="flex gap-1">
                        {STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-luxury-gold' : idx < currentStep ? 'bg-luxury-gold/40' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button variant="ghost" size="sm" onClick={prev}>
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Retour
                            </Button>
                        )}
                        <Button size="sm" className="bg-luxury-gold text-black hover:bg-luxury-gold/90" onClick={next}>
                            {currentStep === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                            {currentStep < STEPS.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function resetOnboarding() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
}
