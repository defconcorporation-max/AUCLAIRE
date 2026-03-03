import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function SalesProcess() {
    const navigate = useNavigate();

    const steps = [
        {
            id: 1,
            title: "Entrée du lead",
            stage: "Nouveau lead",
            roles: ["Système / Vendeur"],
            details: [
                "Un lead entre dans le système (pub, DM, site web, recommandation).",
                "Il est automatiquement ajouté dans le pipeline.",
                "Il est assigné à un vendeur."
            ],
            hint: "👉 À partir de là, le vendeur prend le contrôle.",
            emoji: "👋",
            images: ["/images/process/phase-1.png"]
        },
        {
            id: 2,
            title: "Qualification par le vendeur",
            stage: "En discussion",
            roles: ["Vendeur"],
            details: [
                "Contacte le client.",
                "Comprend son besoin (bague, budget, délai, type de pierre, inspiration).",
                "Valide que le projet est sérieux."
            ],
            objective: "S’assurer que le client est prêt à avancer vers un design et donner une estimation du prix final, valider le design et le budget.",
            emoji: "🎯",
            images: ["/images/process/phase-2.png"]
        },
        {
            id: 3,
            title: "Envoi de la fiche design",
            stage: "Design a faire",
            roles: ["Vendeur", "Secrétaire"],
            details: [
                "Quand le projet est clair, le vendeur envoie une fiche design complète.",
                "Détail : modèle, taille, pierre, métal, références (ex: engagement ring / size 7 / white gold 14k / center stone : oval cut 2ct / pave round cut (half band) / engraving : 20/06/1985).",
                "Faire la fiche dans les task de GHL, assigné aux client et secretaire."
            ],
            hint: "👉 La fiche passe ensuite à la secrétaire.",
            emoji: "📝",
            images: ["/images/process/phase-3.png"]
        },
        {
            id: 4,
            title: "Transmission au manufacturier (phase CAD)",
            stage: "Design a faire",
            roles: ["Secrétaire", "Manufacturier"],
            details: [
                "La secrétaire vérifie que la fiche est complète et la complète dans le système interne.",
                "Transmet le lien au manufacturier.",
                "Le manufacturier crée le CAD et calcule le prix final réel.",
                "Il renvoie le CAD + prix à la secrétaire."
            ],
            hint: "👉 La secrétaire renvoie ensuite au vendeur.",
            emoji: "💻",
            images: ["/images/process/phase-4-1.png", "/images/process/phase-4-2.png"]
        },
        {
            id: 5,
            title: "Présentation au client + Closing",
            stage: "Design en approbation",
            roles: ["Vendeur", "Client"],
            details: [
                "Le vendeur présente le CAD au client.",
                "Explique les détails, ajuste si nécessaire.",
                "Envoie le devis."
            ],
            objective: "Closer la vente.",
            emoji: "🤝",
            images: ["/images/process/phase-5.png"]
        },
        {
            id: 6,
            title: "Dépôt ou paiement complet",
            stage: "Production",
            roles: ["Client", "Secrétaire"],
            details: [
                "Quand le client accepte, il paie un dépôt ou le total.",
                "La secrétaire confirme le paiement.",
                "Elle envoie le projet en production au manufacturier."
            ],
            emoji: "💳",
            images: ["/images/process/phase-6.png"]
        },
        {
            id: 7,
            title: "Production",
            stage: "Production",
            roles: ["Manufacturier", "Secrétaire", "Vendeur"],
            details: [
                "Le manufacturier lance la production et fabrique la pièce.",
                "Une fois terminé, il informe la secrétaire.",
                "La secrétaire informe le vendeur."
            ],
            emoji: "🔨",
            images: ["/images/process/phase-7.png"]
        },
        {
            id: 8,
            title: "Livraison + Paiement final",
            stage: "Close won",
            roles: ["Vendeur"],
            details: [
                "Le vendeur organise la livraison.",
                "Encaisse le solde si nécessaire.",
                "S’assure que le client est satisfait."
            ],
            emoji: "📦"
        },
        {
            id: 9,
            title: "Post-vente",
            stage: "Close won",
            roles: ["Community Manager"],
            details: [
                "Après livraison, le community manager contacte le client.",
                "Demande un avis.",
                "Collecte photos / témoignage."
            ],
            objective: "Créer de la preuve sociale, alimenter le marketing, augmenter la réputation d’Auclaire.",
            emoji: "📸"
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
            <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/resources')}
                className="mb-4 text-gray-400 hover:text-white"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux Ressources
            </Button>

            <header className="mb-12 border-b border-black/10 dark:border-white/10 pb-8 text-center md:text-left relative">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-luxury-gold/5 rounded-full blur-[60px] pointer-events-none -z-10" />
                <h1 className="text-3xl md:text-5xl font-serif text-black dark:text-white tracking-wide mb-4">
                    Processus de Vente Auclaire
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Guide complet pour toute l'équipe. De la capture du lead à la fidélisation.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full border border-black/5 dark:border-white/10">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Résumé du Flow :
                    </span>
                    <span className="text-xs text-luxury-gold italic">
                        Lead → Vendeur → Qualification → Fiche design → Secrétaire → Manufacturier (CAD+prix) → Vendeur → Close → Paiement → Production → Livraison → Avis client
                    </span>
                </div>
            </header>

            <div className="relative border-l-2 border-luxury-gold/20 ml-4 md:ml-8 pl-8 md:pl-12 space-y-12">
                {steps.map((step) => (
                    <div key={step.id} className="relative group">
                        {/* Circle Bullet */}
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
                                            Stage GHL: {step.stage}
                                        </span>
                                        {step.roles.map(r => (
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
                                        <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block mb-1">Objectif Principal</span>
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
                                            <img src={img} alt={`Illustration Phase ${step.id}`} className="w-full h-auto object-cover" />
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
