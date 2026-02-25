import React, { useState } from 'react';
import { Lock, X, ChevronDown, ChevronRight, CheckCircle2, Search, BrainCircuit, Target, Diamond, BookOpen, GraduationCap, ArrowRight, FileText, TrendingUp, Handshake, Euro, Users, AlertCircle, ShieldCheck, Scale, Award, Gem, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { qcmProcessus, qcmExpertise } from '../../data/qcmData';

export default function Formation() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'auclaireformation') {
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-[#D2B57B] selection:text-black">
                <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#D2B57B]/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-[#D2B57B]/10 rounded-full border border-[#D2B57B]/30">
                            <Lock className="w-8 h-8 text-[#D2B57B]" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-serif text-white text-center mb-2">Accès Sécurisé</h1>
                    <p className="text-gray-400 text-center text-sm mb-8">Veuillez entrer le mot de passe pour accéder à la Formation Closer Expert Auclaire.</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mot de passe"
                                className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-[#D2B57B] h-12"
                            />
                            {error && <p className="text-red-500 text-xs mt-2 text-center">Mot de passe incorrect.</p>}
                        </div>
                        <Button type="submit" className="w-full bg-[#D2B57B] text-black hover:bg-[#D2B57B]/90 h-12 font-medium">
                            Déverrouiller l'accès
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    return <FormationContent />;
}

function SectionHeader({ id, icon: Icon, title, emoji, expanded, toggleSection }: { id: string, icon?: any, title: string, emoji?: string, expanded: boolean, toggleSection: (id: string) => void }) {
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const expertiseSteps = [
        { id: 'cuts', title: 'Coupes', emoji: '💎', fullTitle: 'Guide des Coupes (Diamants)' },
        { id: 'gemstones', title: 'Gemmes', emoji: '🌈', fullTitle: 'Types de Gemmes' },
        { id: 'settings', title: 'Montures', emoji: '💍', fullTitle: 'Types de Settings (Montures)' },
        { id: 'bandStyle', title: 'Joncs', emoji: '➖', fullTitle: 'Types de Jonc (Band Style)' },
        { id: 'bandSetting', title: 'Sertissages', emoji: '🛡️', fullTitle: 'Types de Sertissage du Jonc' },
        { id: 'prongs', title: 'Griffes', emoji: '🦅', fullTitle: 'Types de Prongs (Griffes)' },
        { id: 'hisHers', title: 'Alliances', emoji: '🎎', fullTitle: 'Bagues His & Hers (Alliances)' },
        { id: 'diamonds4c', title: 'Les 4C', emoji: '🔍', fullTitle: 'Les 4C du Diamant' },
        { id: 'anatomy', title: 'Anatomie', emoji: '💍', fullTitle: 'Anatomie d\'une Bague' },
        { id: 'metals', title: 'Métaux', emoji: '✨', fullTitle: 'Expertise Métaux & Allergies' },
        { id: 'gold', title: 'Or Jaune', emoji: '⚖️', fullTitle: 'Différence Visuelle Or Jaune' }
    ];
    const [currentExpertiseStep, setCurrentExpertiseStep] = useState(0);

    const processusSteps = [
        { id: 'phases', title: 'Les 12 Phases', emoji: '🧭', fullTitle: 'Le Processus (12 Phases)' },
        { id: 'consultation', title: 'Consultation', emoji: '🗣️', fullTitle: 'Diagnostic & Consultation' },
        { id: 'mindset', title: 'Mindset & Règles', emoji: '📜', fullTitle: 'Objectifs & Règles d\'Or' }
    ];
    const [currentProcessusStep, setCurrentProcessusStep] = useState(0);

    const [simPrice, setSimPrice] = useState<number>(3000);
    const [simType, setSimType] = useState<'apporteur' | 'vente_complete'>('vente_complete');

    // Scénario interactif
    const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

    // Sélecteur interactif des métaux
    const [selectedMetal, setSelectedMetal] = useState<string>('platine');
    const [metalQuizAnswered, setMetalQuizAnswered] = useState<number | null>(null);

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
        if (progressPercent === 100) return { title: "Expert Diamantaire", icon: "👑", color: "from-yellow-400 to-[#D2B57B]", glow: "shadow-[0_0_30px_rgba(210,181,123,0.6)]" };
        if (progressPercent >= 70) return { title: "Closer Confirmé", icon: "💎", color: "from-blue-400 to-indigo-500", glow: "shadow-[0_0_20px_rgba(99,102,241,0.4)]" };
        if (progressPercent >= 30) return { title: "Conseiller Junior", icon: "🌟", color: "from-emerald-400 to-green-600", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" };
        return { title: "Novice", icon: "🌱", color: "from-gray-400 to-gray-600", glow: "shadow-none" };
    };
    const badge = getBadgeInfo();

    // Calcul de la commission
    const getCommissionRate = () => simType === 'apporteur' ? 0.05 : 0.15;
    const estimatedCommission = simPrice * getCommissionRate();

    const ImageWithPreview = ({ src }: { src: string }) => (
        <img
            src={src}
            alt="Preview"
            onClick={() => setSelectedImage(src)}
            className="w-1/3 object-cover border-r border-white/10 cursor-pointer hover:opacity-75 transition-opacity"
        />
    );

    const phases = [
        { id: 1, title: 'Prise de Contact', subtitle: 'Confiance & Positionnement', objectif: 'Créer un climat de sécurité et installer la posture de consultant.', mindset: ['humain', 'posé', 'rassurant', 'curieux'], questions: ['Qu’est-ce qui t’amène aujourd’hui à chercher une bague ?', 'Depuis combien de temps êtes-vous ensemble ?', 'Comment s’est passée votre rencontre ?', 'Est-ce que la demande est déjà planifiée ou en réflexion ?'], hint: 'Ces questions servent à entrer dans l’histoire.', detection: ['sérieux de la démarche', 'timeline', 'niveau émotionnel', 'pression'] },
        { id: 2, title: 'Découverte Profonde', subtitle: 'Histoire & Dynamique Couple', objectif: 'Comprendre la relation pour guider la bague idéale.', questions: ['Comment décrirais-tu sa personnalité ?', 'Quel type de bijoux porte-t-elle habituellement ?', 'A-t-elle déjà mentionné une bague de rêve ?', 'Est-elle minimaliste ou expressive ?', 'Quel est son mode de vie (travail manuel, sport, etc.) ?', 'Quelle importance accorde-t-elle aux symboles ?'], hint: 'Le closer comprend la partenaire sans qu’elle soit présente.', detection: ['style bague', 'sensibilité émotionnelle', 'importance symbolique', 'lifestyle impact bague'] },
        { id: 3, title: 'Découverte Budget', subtitle: 'Sans créer de pression', objectif: 'Comprendre la zone de confort financière.', questions: ['As-tu une idée de budget dans lequel tu te sentirais à l’aise ?', 'Préfères-tu prioriser taille, brillance ou symbolique ?', 'Est-ce important pour toi de maximiser l’impact visuel ?'], hint: 'Le closer doit normaliser le budget.', detection: ['anxiété financière', 'priorités réelles', 'flexibilité'] },
        { id: 4, title: 'Éducation Client', subtitle: 'Positionnement Expert', objectif: 'Enlever la confusion et rassurer.', questions: ['As-tu déjà entendu parler des 4C ?', 'Qu’est-ce qui compte le plus pour toi visuellement ?', 'Préfères-tu une bague classique ou distinctive ?'], hint: 'Le closer adapte son niveau technique.' },
        { id: 5, title: 'Création Vision Émotionnelle', subtitle: 'Faire vivre le moment', objectif: 'Faire vivre mentalement la demande.', questions: ['As-tu imaginé le moment de la demande ?', 'Où penses-tu la faire ?', 'Quel type de réaction aimerais-tu provoquer ?', 'Quelle émotion veux-tu transmettre ?'], hint: 'Le closer connecte bague ↔ moment.' },
        { id: 6, title: 'Proposition Bague Idéale', subtitle: 'Offrir une guidance claire', objectif: 'Offrir guidance claire.', questions: ['Entre ces options, laquelle te parle instinctivement ?', 'Qu’est-ce que tu ressens en regardant celle-ci ?', 'Peux-tu imaginer cette bague sur sa main ?'], hint: 'Le closer valide l\'intuition du client.' },
        { id: 7, title: 'Gestion des Objections', subtitle: 'Rassurer sans confronter', objectif: 'Rassurer sans confronter.', questions: ['Qu’est-ce qui te fait hésiter ?', 'As-tu une inquiétude particulière ?', 'Qu’est-ce qui te ferait être 100% confiant ?'], hint: 'Le closer transforme les objections en clarifications.' },
        { id: 8, title: 'Validation & Closing Naturel', subtitle: 'Créer la certitude', objectif: 'Créer la certitude.', questions: ['Si la demande était aujourd’hui, serais-tu confiant avec ce choix ?', 'Cette bague représente-t-elle ce que tu veux lui dire ?', 'Te vois-tu vivre ce moment avec cette bague ?'], hint: 'Le closer valide l\'émotion.' },
        { id: 9, title: 'Confirmation Commande', subtitle: 'Sécuriser l\'expérience', objectif: 'Sécuriser l\'expérience post-achat.', questions: ['Es-tu confortable avec les spécifications ?', 'As-tu des inquiétudes sur le délai ?', 'Y a-t-il un détail que tu veux ajuster ?'] },
        { id: 10, title: 'Suivi Production', subtitle: 'Maintenir l\'excitation', objectif: 'Maintenir l\'excitation.', questions: ['Comment te sens-tu dans l’attente ?', 'Veux-tu des updates réguliers ?', 'As-tu déjà planifié la demande ?'] },
        { id: 11, title: 'Livraison', subtitle: 'Amplifier le moment', objectif: 'Amplifier le moment final.', questions: ['As-tu imaginé comment présenter la bague ?', 'Veux-tu des conseils pour le moment de la demande ?'] },
        { id: 12, title: 'Post-Vente & Relation', subtitle: 'Relation long terme', objectif: 'Créer une relation long terme.', questions: ['Comment s’est passée la demande ?', 'Quelle a été sa réaction ?', 'Puis-je voir une photo du moment ?', 'As-tu besoin d’accompagnement pour alliances ?'] }
    ];

    const diamondCutsData = [
        { name: "Round", subtitle: "Brillance maximale", desc: "La coupe ronde maximise la réflexion de la lumière grâce à une géométrie optimisée.", tags: ["Brillance maximale", "Intemporel"], img: "https://i.etsystatic.com/16544137/r/il/1ccc36/3168700913/il_1080xN.3168700913_tto5.jpg" },
        { name: "Oval", subtitle: "Illusion taille", desc: "Forme allongée augmentant la surface visible du diamant.", tags: ["Effet carat+", "Doigt allongé"], img: "https://i.etsystatic.com/36057419/r/il/3737b5/5387076943/il_fullxfull.5387076943_t3z7.jpg" },
        { name: "Princess", subtitle: "Moderne structuré", desc: "Forme carrée avec brillance importante.", tags: ["Look moderne", "Structure nette"], img: "https://media.tiffany.com/is/image/Tiffany/EcomItemL2/tiffany-novo-princess-cut-engagement-ring-with-a-pav-set-diamond-band-in-platinum-60767173_996218_ED_M.jpg?%24cropN=0.1%2C0.1%2C0.8%2C0.8&defaultImage=NoImageAvailableInternal&op_usm=1.75%2C1.0%2C6.0" },
        { name: "Cushion", subtitle: "Romantique vintage", desc: "Coins arrondis et style antique.", tags: ["Romantique", "Douceur visuelle"], img: "https://i.etsystatic.com/28887394/r/il/006bab/5523396783/il_1080xN.5523396783_bick.jpg" },
        { name: "Emerald", subtitle: "Élégance minimaliste", desc: "Facettes larges créant un effet miroir.", tags: ["Sophistication", "Chic"], img: "https://i.etsystatic.com/17551371/r/il/32495a/4580417301/il_fullxfull.4580417301_8s0u.jpg" },
        { name: "Pear", subtitle: "Original féminin", desc: "Forme hybride ronde + marquise.", tags: ["Originalité"], img: "https://prouddiamond.com/cdn/shop/files/PearCutPaveRing_E.jpg?v=1700771323&width=1445" },
        { name: "Radiant", subtitle: "Hybride Brillant", desc: "Mélange de la forme Emerald avec les facettes de la coupe Round, offrant un maximum d'éclat.", tags: ["Pétillant", "Moderne"], img: "/images/education/cuts/radiant.png", isNew: true },
        { name: "Marquise", subtitle: "Royale et fine", desc: "Taille allongée avec deux pointes, créant l'illusion d'une pierre plus large sur le doigt.", tags: ["Vintage", "Allongeant"], img: "/images/education/cuts/marquise.png" },
        { name: "Asscher", subtitle: "Art Déco", desc: "Coupe carrée avec des steps (marches) très géométriques à la manière de l'émeraude, mais carrée.", tags: ["Art Déco", "Élégant"], img: "/images/education/cuts/asscher.png" },
        { name: "Heart", subtitle: "Romance absolue", desc: "Le symbole ultime de l'amour, diamant très complexe.", tags: ["Romantique", "Unique"], img: "/images/education/cuts/heart.png" }
    ];

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
                    <img src={selectedImage} alt="Expanded preview" className="max-w-full max-h-[90vh] object-contain rounded-lg border border-white/20 shadow-2xl" />
                </div>
            )}

            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#D2B57B]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#D2B57B]/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
                <header className="text-center mb-16 border-b border-white/10 pb-16 relative">
                    {/* Badge System */}
                    <div className="absolute top-0 right-0 hidden md:flex flex-col items-end">
                        <div className={`px-4 py-2 rounded-2xl bg-gradient-to-r ${badge.color} text-black font-bold flex items-center gap-2 ${badge.glow} transition-all duration-500`}>
                            <span className="text-xl">{badge.icon}</span> {badge.title}
                        </div>
                    </div>

                    <h2 className="text-[#D2B57B] text-xs md:text-sm uppercase tracking-[0.3em] mb-6 font-semibold inline-block px-5 py-2 border border-[#D2B57B]/30 rounded-full bg-[#D2B57B]/10 shadow-[0_0_20px_rgba(210,181,123,0.2)]">Auclaire Academy</h2>
                    <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-[#D2B57B] bg-clip-text text-transparent font-serif leading-tight">Formation Closer Expert</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-serif italic mb-8">
                        Bague de Fiançailles — L'art de l'accompagnement d'élite.
                    </p>

                    {/* Progress Bar */}
                    <div className="max-w-xl mx-auto bg-black/50 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-300">Progression Globale</span>
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
                            <BookOpen className="w-4 h-4 mr-2" /> Processus & Accompagnement
                        </TabsTrigger>
                        <TabsTrigger value="expertise" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <Diamond className="w-4 h-4 mr-2" /> Expertise
                        </TabsTrigger>
                        <TabsTrigger value="qcm" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <GraduationCap className="w-4 h-4 mr-2" /> QCM Officiel
                        </TabsTrigger>
                        <TabsTrigger value="guides" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <FileText className="w-4 h-4 mr-2" /> Guides & Ressources
                        </TabsTrigger>
                    </TabsList>

                    {/* ONGLET 4 : GUIDES ET RESSOURCES */}
                    <TabsContent value="guides" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
                        {/* SECTION A : LE PLAN AMBASSADEURS */}
                        <section>
                            <SectionHeader id="plan-ambassadeur" emoji="💎" title="Plan Ambassadeurs (Vision Stratégique)" expanded={true} toggleSection={() => { }} />

                            <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-4">
                                {/* Philosophie */}
                                <div className="bg-[#D2B57B]/5 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2B57B]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                                    <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-3">
                                        <Handshake className="w-5 h-5" /> Philosophie Centrale
                                    </h3>
                                    <blockquote className="border-l-2 border-[#D2B57B] pl-6 py-2 my-6">
                                        <p className="text-2xl font-serif text-white italic">"On mange tous à la même table."</p>
                                    </blockquote>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Cette philosophie implique une réussite collective, une culture saine sans compétition toxique, des règles claires et un engagement mutuel. Les ambassadeurs gagnent bien parce que la marque gagne bien. Ce n'est pas un programme d'affiliation ouvert, c'est un levier de croissance maîtrisé.
                                    </p>
                                </div>

                                {/* Profils */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-green-500/20 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent to-green-500/50"></div>
                                        <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" /> Profil Recherché
                                        </h4>
                                        <ul className="space-y-3">
                                            {[
                                                "Image soignée et positionnement luxe discret",
                                                "Communication respectueuse",
                                                "Mentalité long terme",
                                                "Crédibilité relationnelle"
                                            ].map((item, i) => (
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
                                            <AlertCircle className="w-5 h-5 text-red-500" /> Profils Exclus
                                        </h4>
                                        <ul className="space-y-3">
                                            {[
                                                "Spam massif sur Marketplace",
                                                "Vente agressive ou pushy",
                                                "Recherche de cash rapide au détriment de l'image",
                                                "Négociation des règles de la Maison"
                                            ].map((item, i) => (
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
                                        <Euro className="w-5 h-5 text-[#D2B57B]" /> Stades Commissionnels (Vente Complète)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { title: "Starter", icon: "🥉", sales: "0 à 9 ventes", com: "10% à 14%", color: "border-orange-700/50" },
                                            { title: "Confirmé", icon: "🥈", sales: "10 à 29 ventes", com: "12% à 16%", color: "border-gray-400/50" },
                                            { title: "Élite", icon: "🥇", sales: "30 à 74 ventes", com: "15% à 18%", color: "border-yellow-500/50" },
                                            { title: "Partenaire", icon: "💎", sales: "75+ ventes", com: "20% flat", color: "border-[#D2B57B]/80 bg-[#D2B57B]/10" }
                                        ].map((tier, i) => (
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
                                        <Scale className="w-5 h-5 text-[#D2B57B]" /> Rôles & Engagements Mutuels
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-[#D2B57B] font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Rôle de l'Ambassadeur</h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-[#D2B57B] mt-1">•</span> La prospection (Réseau, Facebook, DM).</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-[#D2B57B] mt-1">•</span> La qualification du besoin et du budget.</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-[#D2B57B] mt-1">•</span> La transmission du lead ou la configuration 3D.</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300 italic max-w-sm">Vous représentez la marque, mais vous n'êtes pas obligé d'être un expert technique.</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#D2B57B]" /> L'Engagement d'Auclaire</h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-[#D2B57B] mt-1">•</span> Fourniture des visuels officiels et du cadre d'image Luxe.</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-[#D2B57B] mt-1">•</span> Accès aux outils : site web, studio 3D.</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-[#D2B57B] mt-1">•</span> Prise en charge intégrale de la fabrication, livraison, garanties, closing.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Simulateur Interactif */}
                                <div className="mt-12 bg-black/60 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(210,181,123,0.1)]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#D2B57B]/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none"></div>
                                    <h3 className="text-2xl font-serif text-[#D2B57B] mb-2 flex items-center gap-3">
                                        <TrendingUp className="w-6 h-6" /> Simulateur de Gains
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-8">Découvrez combien vous pouvez gagner sur une seule vente selon votre niveau d'implication.</p>

                                    <div className="grid md:grid-cols-2 gap-12 items-center">
                                        <div className="space-y-6">
                                            {/* Input Prix */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">Prix de la bague vendue ($)</label>
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
                                                    <span>Min (1 500 $)</span>
                                                    <span>Moyenne (3 000 $)</span>
                                                    <span>Max (25 000 $)</span>
                                                </div>
                                            </div>

                                            {/* Toggle Role */}
                                            <div className="bg-black/40 p-1.5 rounded-xl border border-white/5 grid grid-cols-2 gap-1">
                                                <button
                                                    onClick={() => setSimType('apporteur')}
                                                    className={`py-3 rounded-lg text-sm font-medium transition-all ${simType === 'apporteur' ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    Apporteur (5%)
                                                </button>
                                                <button
                                                    onClick={() => setSimType('vente_complete')}
                                                    className={`py-3 rounded-lg text-sm font-medium transition-all ${simType === 'vente_complete' ? 'bg-[#D2B57B] text-black shadow-md shadow-[#D2B57B]/20' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    Vente Complète (15%)
                                                </button>
                                            </div>
                                        </div>

                                        {/* Resultat */}
                                        <div className="flex flex-col items-center justify-center p-8 border border-white/5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent relative">
                                            <p className="text-gray-400 text-sm uppercase tracking-widest font-medium mb-4">Votre Commission Estimée</p>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-5xl md:text-7xl font-bold font-serif text-white animate-in zoom-in duration-300" key={estimatedCommission}>
                                                    {estimatedCommission.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                                                </span>
                                            </div>
                                            <p className="text-[#D2B57B] text-sm mt-4 flex items-center gap-2 bg-[#D2B57B]/10 px-4 py-2 rounded-full border border-[#D2B57B]/20">
                                                <Award className="w-4 h-4" />
                                                {simType === 'apporteur' ? "Rôle de connecteur sans effort technique" : "Vous gérez la vente de A à Z (Studio 3D)"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION B : GUIDE OPÉRATIONNEL */}
                        <section>
                            <SectionHeader id="guide-op" emoji="🗺️" title="Guide Opérationnel (Action Terrain)" expanded={true} toggleSection={() => { }} />

                            <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-4">
                                {/* Incarner l'excellence : Règles d'or */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-10 shadow-lg">
                                    <h3 className="text-xl font-serif text-[#D2B57B] mb-6 flex items-center gap-3">
                                        <Diamond className="w-5 h-5" /> Incarner l'Excellence Auclaire
                                    </h3>
                                    <p className="text-gray-300 text-sm mb-8 leading-relaxed">
                                        Être Ambassadeur Auclaire, ce n'est pas seulement vendre des bijoux. C'est représenter une Maison de joaillerie qui prône le sur-mesure, le luxe accessible et la qualité intransigeante. <span className="text-white italic font-serif">"Nous ne vendons pas des produits, nous créons des héritages."</span>
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-green-500/30 pb-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" /> Les Règles d'Or (À Faire)
                                            </h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-500">✓</span> Utiliser les visuels officiels haute définition.</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-500">✓</span> Adopter un ton professionnel, courtois et expert.</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-500">✓</span> Mettre en avant la personnalisation ultime (Studio 3D).</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-green-500">✓</span> Être transparent sur les délais de fabrication (Artisanat).</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-red-500/30 pb-2">
                                                <AlertCircle className="w-4 h-4 text-red-500" /> Les Interdits (À Éviter)
                                            </h4>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-red-500">⨯</span> Spammer les groupes Facebook sans contexte.</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-red-500">⨯</span> Utiliser des photos floues ou non professionnelles.</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-red-500">⨯</span> Promettre des délais irréalistes (ex: "Livré demain").</li>
                                                <li className="flex items-start gap-2 text-sm text-gray-300"><span className="text-red-500">⨯</span> Dévaloriser la marque par des négociations agressives.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Atout 3D & Avantage Ambassadeur */}
                                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                                        <div className="bg-black/30 border border-white/5 rounded-xl p-5">
                                            <h5 className="font-bold text-[#D2B57B] mb-2 flex items-center gap-2">💻 Votre Atout Majeur : Le Studio 3D</h5>
                                            <p className="text-xs text-gray-400">Contrairement aux bijouteries classiques, vous avez accès à notre outil de configuration 3D. Utilisez-le pour prouver au client qu'il peut créer sa pièce unique en temps réel.</p>
                                        </div>
                                        <div className="bg-black/30 border border-[#D2B57B]/20 rounded-xl p-5 relative overflow-hidden">
                                            <div className="absolute -right-4 -bottom-4"><Gem className="w-16 h-16 text-[#D2B57B]/10" /></div>
                                            <h5 className="font-bold text-white mb-2 flex items-center gap-2">🎁 L'Avantage Ambassadeur Privé</h5>
                                            <p className="text-xs text-gray-400">Accès au <strong>Prix Ambassadeur</strong> préférentiel pour un usage purement personnel. Effet de levier énorme pour votre propre bague (Ex: Bague à 2500$ au public → 1650$ pour vous).</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-lg hover:border-[#D2B57B]/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-2xl font-serif text-white">L'Apporteur</h4>
                                            <span className="bg-white/10 text-white font-bold px-3 py-1 rounded-full text-sm">3% à 5%</span>
                                        </div>
                                        <p className="text-sm text-[#D2B57B] uppercase tracking-widest mb-6">Le Connecteur</p>
                                        <p className="text-gray-400 text-sm mb-6 h-10">Idéal si vous manquez de temps ou d'expertise technique. Transférez le lead, on gère le reste.</p>
                                        <ol className="space-y-4 text-sm text-gray-300">
                                            <li className="flex gap-3"><span className="text-[#D2B57B] font-bold">1.</span> Le client est intéressé par vos contenus.</li>
                                            <li className="flex gap-3"><span className="text-[#D2B57B] font-bold">2.</span> Vous remplissez le formulaire "Nouveau Lead".</li>
                                            <li className="flex gap-3"><span className="text-[#D2B57B] font-bold">3.</span> L'équipe Auclaire prend le relais (Design, Devis, Closing).</li>
                                            <li className="flex gap-3"><span className="text-[#D2B57B] font-bold">4.</span> S'il achète, vous touchez votre commission.</li>
                                        </ol>
                                        <div className="mt-8 pt-4 border-t border-white/10 hidden md:block">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest">Exemple (Bague à 3000$)</p>
                                            <p className="text-lg font-bold text-white mt-1">Vous gagnez ~ <span className="text-[#D2B57B]">150 $</span></p>
                                        </div>
                                    </div>

                                    <div className="bg-[#D2B57B]/5 border border-[#D2B57B]/30 rounded-2xl p-8 shadow-lg hover:border-[#D2B57B]/60 transition-colors relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2B57B]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-2xl font-serif text-[#D2B57B]">Vente Complète</h4>
                                            <span className="bg-[#D2B57B] text-black font-bold px-3 py-1 rounded-full text-sm">Jusqu'à 18%+</span>
                                        </div>
                                        <p className="text-sm text-white uppercase tracking-widest mb-6 font-medium">Le Conseiller Expert</p>
                                        <p className="text-gray-400 text-sm mb-6 h-10">Pour ceux qui veulent maximiser leurs revenus et maîtriser l'art de la vente sur-mesure de A à Z.</p>
                                        <ol className="space-y-4 text-sm text-gray-300 relative z-10">
                                            <li className="flex gap-3"><span className="text-[#D2B57B] font-bold">1.</span> Vous configurez le bijou avec le client (Studio 3D).</li>
                                            <li className="flex gap-3"><span className="text-[#D2B57B] font-bold">2.</span> Vous confirmez les spécifications et les matériaux.</li>
                                            <li className="flex gap-3"><span className="text-[#D2B57B] font-bold">3.</span> Vous donnez l'estimation de prix précise au client.</li>
                                            <li className="flex gap-3"><span className="text-[#D2B57B] font-bold">4.</span> Vous validez la commande (Le Closing).</li>
                                        </ol>
                                        <div className="mt-8 pt-4 border-t border-[#D2B57B]/20 relative z-10 hidden md:block">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest">Exemple (Bague à 3000$)</p>
                                            <p className="text-lg font-bold text-white mt-1">Vous gagnez ~ <span className="text-[#D2B57B]">450 $</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Strategies d'acquisition */}
                                <div>
                                    <h3 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
                                        <TrendingUp className="w-5 h-5 text-[#D2B57B]" /> Tactiques d'Acquisition (La Méthode Concierge)
                                    </h3>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                                        <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                            <Users className="w-5 h-5 text-[#D2B57B]" /> Partenariats Locaux (Salons de Manucure & Barbiers)
                                        </h4>
                                        <p className="text-gray-400 text-sm mb-4">
                                            C'est une stratégie très lucrative. Dans un salon de manucure, les clientes regardent leurs mains pendant une heure. C'est le moment idéal pour leur faire essayer virtuellement ou voir des modèles de bagues.
                                        </p>
                                        <div className="bg-black/50 p-4 rounded-lg text-sm text-gray-300 border border-white/5">
                                            <ul className="space-y-2">
                                                <li><span className="text-[#D2B57B] mr-2">✓</span> Proposez au gérant de laisser un présentoir ou des cartes de visite luxe (QR Code).</li>
                                                <li><span className="text-[#D2B57B] mr-2">✓</span> Offrez une commission de parrainage au gérant sur chaque vente (partage de commission).</li>
                                                <li><span className="text-[#D2B57B] mr-2">✓</span> Le gérant devient votre apporteur d'affaires, vous devenez son joaillier partenaire.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                            <h4 className="text-lg font-bold text-white mb-3">📱 Réseaux Sociaux (TikTok/Insta)</h4>
                                            <ul className="space-y-2 text-sm text-gray-400">
                                                <li>• Montrez les designs 3D qui tournent en vidéo (effet Wahou).</li>
                                                <li>• Partagez des témoignages ou des processus de création.</li>
                                                <li>• Ciblez par tags: Votre ville + #Fiancailles #SurMesure #Luxe</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                            <h4 className="text-lg font-bold text-white mb-3">🛒 Marketplaces (Kijiji/Facebook)</h4>
                                            <ul className="space-y-2 text-sm text-gray-400">
                                                <li>• Utilisez une localisation précise (quartiers aisés).</li>
                                                <li>• Titre : "Bague de Fiançailles Sur-Mesure - Diamant Certifié".</li>
                                                <li>• Dirigez rapidement la conversation texte vers un Call ou 3D Démo.</li>
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
                                            {step.title}
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
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🧭</span> Processus & Accompagnement (12 Phases)
                                    </h2>
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                        {phases.map((phase) => (
                                            <div key={phase.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#0a0a0a] group-hover:bg-[#D2B57B] transition-colors shadow-lg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-[#D2B57B] group-hover:text-black font-serif font-bold text-sm">
                                                    {phase.id}
                                                </div>
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                                    <h3 className="text-2xl font-serif text-white mb-1">Phase {phase.id} — {phase.title}</h3>
                                                    <p className="text-[#D2B57B] text-[10px] uppercase tracking-[0.2em] mb-4">{phase.subtitle}</p>
                                                    <div className="mb-4">
                                                        <h5 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 flex items-center gap-2"><Target className="w-3 h-3" /> Objectif</h5>
                                                        <p className="text-sm text-gray-300">{phase.objectif}</p>
                                                    </div>
                                                    {phase.mindset && (
                                                        <div className="mb-4">
                                                            <h5 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 flex items-center gap-2"><BrainCircuit className="w-3 h-3" /> Mindset Closer</h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {phase.mindset.map(m => <span key={m} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 capitalize">{m}</span>)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {phase.questions && (
                                                        <div className="bg-black/30 rounded-lg p-4 mb-2 border border-white/5">
                                                            <h5 className="text-[10px] uppercase tracking-[0.2em] text-[#D2B57B] mb-2">💬 Questions clés suggérées</h5>
                                                            <ul className="list-disc text-sm space-y-2 text-gray-300 ml-4">
                                                                {phase.questions.map(q => <li key={q}>{q}</li>)}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {phase.hint && <p className="text-xs text-[#D2B57B] italic opacity-80 mt-3 pt-3 border-t border-white/5">👉 {phase.hint}</p>}
                                                    {phase.detection && (
                                                        <div className="mt-4 pt-3 border-t border-white/5">
                                                            <h5 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2 flex items-center gap-2"><Search className="w-3 h-3" /> À détecter absolument</h5>
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
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🗣️</span> Diagnostic & Consultation Patient
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors shadow-lg">
                                            <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-2">
                                                <Target className="w-5 h-5" /> Rassurer sur le budget
                                            </h3>
                                            <ul className="space-y-3 text-sm text-gray-300">
                                                <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Normaliser le budget du client sans jugement.</span></li>
                                                <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Expliquer les compromis intelligents pour maximiser le rendu.</span></li>
                                            </ul>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors shadow-lg">
                                            <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-2">
                                                <Search className="w-5 h-5" /> Identifier le style de la partenaire
                                            </h3>
                                            <ul className="space-y-3 text-sm text-gray-300">
                                                <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Analyser ses bijoux actuels et son style vestimentaire.</span></li>
                                                <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Comprendre sa personnalité et son lifestyle (sport, travail manuel).</span></li>
                                            </ul>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors shadow-lg">
                                            <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-2">
                                                <Heart className="w-5 h-5" /> Vendre l'émotion
                                            </h3>
                                            <ul className="space-y-3 text-sm text-gray-300">
                                                <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Aider le client à se projeter dans le moment de la demande.</span></li>
                                                <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Mettre en valeur la symbolique de l'engagement (héritage émotionnel).</span></li>
                                            </ul>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors shadow-lg">
                                            <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-2">
                                                <Gem className="w-5 h-5" /> Guider vers la bague idéale
                                            </h3>
                                            <ul className="space-y-3 text-sm text-gray-300">
                                                <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Comprendre la partenaire et le budget pour identifier les priorités.</span></li>
                                                <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Éduquer, proposer des options, rassurer et valider jusqu'au closing.</span></li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Mini Quiz de Rôle */}
                                    <div className="mt-12 bg-black/40 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_20px_rgba(210,181,123,0.1)]">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2B57B]/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none"></div>
                                        <h3 className="text-xl font-serif text-[#D2B57B] mb-4 flex items-center gap-3">
                                            <BrainCircuit className="w-6 h-6" /> Test Express : Scénario Client
                                        </h3>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                                            <p className="text-gray-200 italic font-medium leading-relaxed">"Bonjour, je cherche une bague pour ma conjointe. Elle est infirmière, très active et sportive, mais elle adore les gros diamants qui brillent de mille feux. Quel style de bague devrais-je privilégier ?"</p>
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { id: 1, text: "Un gros diamant rond monté haut sur un solitaire fin pour maximiser la brillance.", isCorrect: false, feedback: "❌ Mauvais choix : Monté haut, le diamant va s'accrocher partout pendant son travail (risque de casse ou de gêne avec les gants)." },
                                                { id: 2, text: "Un diamant taille Princesse avec des griffes très fines pour dégager la pierre.", isCorrect: false, feedback: "❌ Risqué : Les coins pointus de la taille Princesse sont très fragiles pour une personne active ou manuelle." },
                                                { id: 3, text: "Un diamant rond brillant, mais en serti clos (bezel) ou serti bas pour la sécuriser.", isCorrect: true, feedback: "✅ Excellent ! Le serti clos ou bas protège la pierre des chocs tout en permettant à la coupe ronde d'exprimer toute sa brillance." }
                                            ].map(option => (
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
                                            <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">⭐</span> Objectifs du Document
                                        </h2>
                                        <div className="bg-[#D2B57B]/10 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden shadow-lg">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D2B57B]/5 rounded-full blur-[50px] -mr-20 -mt-20 pointer-events-none"></div>
                                            <p className="text-gray-300 mb-6 font-medium">Après cette formation, le closer doit être capable de :</p>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" /><span className="text-gray-200">Reconnaître toutes les coupes</span></div>
                                                <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" /><span className="text-gray-200">Associer coupe à personnalité cliente</span></div>
                                                <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" /><span className="text-gray-200">Expliquer or & karatage visuellement</span></div>
                                                <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" /><span className="text-gray-200">Rassurer sur le budget</span></div>
                                                <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" /><span className="text-gray-200">Guider la consultation de bout en bout</span></div>
                                                <div className="flex items-center gap-3"><CheckCircle2 className="text-green-500 w-5 h-5 shrink-0" /><span className="text-gray-200">Agir comme consultant bague idéale</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                            <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">📜</span> Règles d'Or Auclaire
                                        </h2>
                                        <div className="bg-gradient-to-r from-[#D2B57B]/20 to-[#D2B57B]/5 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden text-center shadow-[0_0_30px_rgba(210,181,123,0.15)]">
                                            <div className="max-w-2xl mx-auto space-y-4 text-left">
                                                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B]/30 transition-colors">
                                                    <span className="text-2xl">⚖️</span>
                                                    <p className="text-gray-200 font-medium">Toujours poser <span className="text-[#D2B57B]">1 question émotionnelle</span> pour <span className="text-[#D2B57B]">1 question technique</span></p>
                                                </div>
                                                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B]/30 transition-colors">
                                                    <span className="text-2xl">🌟</span>
                                                    <p className="text-gray-200 font-medium">Toujours <span className="text-[#D2B57B]">sur-servir le client</span> avec une attention au détail extrème</p>
                                                </div>
                                                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B]/30 transition-colors">
                                                    <span className="text-2xl">✅</span>
                                                    <p className="text-gray-200 font-medium">Toujours <span className="text-[#D2B57B]">valider la compréhension</span> à chaque étape cruciale</p>
                                                </div>
                                                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B]/30 transition-colors">
                                                    <span className="text-2xl">🛡️</span>
                                                    <p className="text-gray-200 font-medium">Toujours <span className="text-[#D2B57B]">rassurer et soutenir</span>, l'achat diamantaire crée de l'anxiété</p>
                                                </div>
                                                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B]/30 transition-colors">
                                                    <span className="text-2xl">🧭</span>
                                                    <p className="text-gray-200 font-medium">Toujours <span className="text-[#D2B57B]">guider</span> - vous êtes le médecin, il est le patient</p>
                                                </div>
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
                                    J'ai assimilé cette partie
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
                                            {step.title}
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
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">💎</span> Guide des Coupes (Diamants)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {diamondCutsData.map((cut, idx) => (
                                            <div key={idx} className="w-full h-80 group [perspective:1000px] cursor-pointer">
                                                <div className="relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)]">

                                                    {/* RECTO */}
                                                    <div className="absolute inset-0 [backface-visibility:hidden] bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col items-center justify-center p-4">
                                                        {cut.isNew && (
                                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-[#D2B57B]/80 to-[#D2B57B] text-black px-2 py-0.5 rounded-md shadow-lg z-10">
                                                                <span className="text-[10px] uppercase font-bold tracking-wider">NEW</span>
                                                            </div>
                                                        )}
                                                        <div className="w-32 h-32 mb-6 rounded-full overflow-hidden border border-[#D2B57B]/30 p-2 bg-black/60 shadow-[inset_0_0_20px_rgba(210,181,123,0.1)] flex items-center justify-center relative">
                                                            <ImageWithPreview src={cut.img} />
                                                        </div>
                                                        <h3 className="text-2xl font-serif text-white">{cut.name}</h3>
                                                        <p className="text-[10px] text-[#D2B57B] uppercase tracking-widest mt-3 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"><ArrowRight className="w-3 h-3" /> Révéler les détails</p>
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
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🌈</span> Les Pierres Précieuses (Gemmes)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {[
                                            { title: 'Diamant', desc: "La pierre précieuse suprême. Note de 10/10 sur l'échelle de Mohs (la plus dure au monde). Brillance incomparable et durabilité parfaite pour le quotidien.", imgs: ['/images/education/diamond.jpg'], tags: ['Dureté 10', 'Éclat absolu'] },
                                            { title: 'Saphir', desc: "Le saphir bleu est le plus populaire, mais existe dans toutes les couleurs sauf le rouge. Note de 9/10 sur l'échelle de Mohs. Très robuste et élégant.", imgs: ['/images/education/sapphire.jpg'], tags: ['Dureté 9', 'Royauté'] },
                                            { title: 'Rubis', desc: "Même famille que le saphir (Corindon) mais de couleur rouge intense due au chrome. Note de 9/10 sur l'échelle de Mohs. Symbole de passion.", imgs: ['/images/education/ruby.jpg'], tags: ['Dureté 9', 'Passion'] },
                                            { title: 'Émeraude', desc: "Magnifique couleur verte mais plus délicate (7.5 - 8/10 sur Mohs). Elle contient des 'jardins' (inclusions naturelles). Sensible aux chocs violents.", imgs: ['/images/education/emerald.jpg'], tags: ['Dureté 8', 'Délicat'] },
                                        ].map(item => (
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
                                </section>
                            )}

                            {/* SECTION TYPES DE SETTINGS */}
                            {currentExpertiseStep === 2 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">💍</span> Types de Settings (Montures)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {[
                                            { title: 'Solitaire', desc: "Le style classique et épuré. Une seule pierre centrale montée sur un anneau lisse, mettant en évidence la beauté pure du diamant.", imgs: ['https://images.openai.com/static-rsc-3/jLLpW5twc-nrlOekGSf8X7XYNrp0yl2m_g_3DVPldpgyE8B44bmLR_XxLpzGZTTacm5Onbu6AwgVLOPNDNtP74VbOiWPA3F4RQg1K8UBxtY?purpose=fullsize&v=1', 'https://eragem.com/media/catalog/product/cache/e4507427afc9429093d76362a19cfadc/7/5/75925a.jpg', 'https://i.etsystatic.com/8918992/r/il/d53bd8/3427360428/il_570xN.3427360428_6m39.jpg'], tags: ['une pierre centrale', 'accent sur diamant', 'intemporel'] },
                                            { title: 'Halo', desc: "La pierre centrale est entourée d'une (ou de plusieurs) rangées de petits diamants, ajoutant un éclat majeur et grossissant la taille perçue.", imgs: ['https://images.openai.com/static-rsc-3/RJ6e4JkTqds8DIGMLf8-l5ng8zXpryNYaXbpss6jZpaemUwKRKiiJmExE73FX5a74YfkeDNhdfOOn6qEo4CwY7pi7DAYcx-pfnTF8COdPZk?purpose=fullsize&v=1', 'https://i.etsystatic.com/10959784/r/il/5f7605/3397691302/il_fullxfull.3397691302_sgom.jpg', 'https://images.openai.com/static-rsc-3/OsQgxlKW7BCFrNCnxpZmpk0OeTc3E0BvQvVGkBFgQy8khDKlRq0VjAqBqY-UgvaoxOzU-kmxu5jsUiosnsJjPAql8QKD9QVqnSqgT-lFPXk?purpose=fullsize&v=1'], tags: ['petits diamants entourent pierre', 'illusion taille', 'brillance'] },
                                            { title: 'Hidden Halo', desc: "Une couronne de diamants cachée sous la base de la pierre centrale. Visible uniquement de profil pour une touche de luxe secrète.", imgs: ['https://www.kingofjewelry.com/cdn/shop/products/330ctroundwithhiddenhalosize475omidfriend-003_480x.jpg?v=1652139175', 'https://www.kingofjewelry.com/cdn/shop/products/DSC_0717_0002_1800x1800.jpg?v=1714585598', 'https://i.etsystatic.com/6659792/r/il/f4b5c7/5408917526/il_fullxfull.5408917526_8rcc.jpg'], tags: ['halo sous la pierre', 'luxe subtil'] },
                                            { title: 'Pavé', desc: "L'anneau est incrusté de multiples petits diamants scintillants. L'effet de brillance ne s'arrête jamais, peu importe l'angle.", imgs: ['https://images.openai.com/static-rsc-3/wI_AVGI4Xmqvb6GmSevcys37OcQbw_YkbzTaTcQyMDPH3tG7LAx0rThe1NYFieY3HzNnZ9oNTZpEoYeDGqT7adBYJ3GAukndvvIdtGopOTA?purpose=fullsize&v=1', 'https://www.goodstoneinc.com/cdn/shop/products/image_bf834f80-17b3-4ce7-84c3-339515eb7637_1200x.jpg?v=1737402864', 'https://www.laurenbjewelry.com/media/catalog/product/cache/1/image/720x720/9df78eab33525d08d6e5fb8d27136e95/r/o/round_diamond_yellow_gold_ring.jpg'], tags: ['diamants sur jonc', 'éclat continu'] },
                                            { title: 'Three-Stone', desc: "Une pierre centrale flanquée de deux pierres plus petites. Symbolique très prisée évoquant le passé, le présent et le futur du couple.", imgs: ['https://bhjewelers.com/cdn/shop/products/3-50-carat-center-3-stone-round-brilliant-cut-diamond-engagement-ring.jpg?v=1605573760', 'https://www.goodstoneinc.com/cdn/shop/products/image_9b522719-5623-4dac-9b11-1af8fda8f8e0_1200x.jpg?v=1695308605', 'https://appelts.ca/cdn/shop/files/Gabriel-14K-Yellow-Gold-Round-Three-Stone-Diamond-Engagement-Ring_ER14745R4Y44JJ-1.webp?v=1717686368&width=2048'], tags: ['symbolique passé-présent-futur'] },
                                        ].map(item => (
                                            <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
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

                            {/* SECTION TYPES DE JONC */}
                            {currentExpertiseStep === 3 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">➖</span> Types de Jonc (Band Style)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {[
                                            { title: 'Jonc classique', desc: "Un anneau en métal pur (or ou platine). Simple et robuste, il attire 100% de l'attention sur la pierre du dessus.", imgs: ['https://lilyarkwright.com/cdn/shop/files/PetitePlainWeddingRing1.65mm18kYellowGoldLilyArkwrightFront_1600x.webp?v=1716475838', 'https://i.etsystatic.com/15510683/r/il/b13cee/4604554620/il_1080xN.4604554620_t6gh.jpg', 'https://i.etsystatic.com/5121484/r/il/2b6481/5244534768/il_570xN.5244534768_mqer.jpg'], tags: ['minimaliste', 'intemporel'] },
                                            { title: 'Pavé band', desc: "Des diamants s'étendent sur le dessus du jonc. Procure une esthétique très féminine et multiplie les flashs de lumière.", imgs: ['https://images.openai.com/static-rsc-3/wI_AVGI4Xmqvb6GmSevcys37OcQbw_YkbzTaTcQyMDPH3tG7LAx0rThe1NYFieY3HzNnZ9oNTZpEoYeDGqT7adBYJ3GAukndvvIdtGopOTA?purpose=fullsize&v=1', 'https://www.artemerstudio.com/cdn/shop/products/Arced-Diamond-Pave-Wedding-Band-CLOSEUP_2400x.jpg?v=1660653561', 'https://www.goodstoneinc.com/cdn/shop/products/image_bf834f80-17b3-4ce7-84c3-339515eb7637_1200x.jpg?v=1737402864'], tags: ['brillance', 'luxe'] },
                                            { title: 'Tapered band', desc: "Le profil de l'anneau s'affine progressivement en s'approchant de la tête. Ce pincement crée une illusion dramatique agrandissant le rubis ou le diamant central.", imgs: ['https://i.etsystatic.com/9792770/r/il/7cb61f/2445852991/il_1080xN.2445852991_lg2m.jpg', 'https://spencediamonds.com/assets/products/1596-A.jpg', 'https://i.etsystatic.com/15275469/r/il/cc3034/3994108020/il_1080xN.3994108020_ie14.jpg'], tags: ['accent pierre centrale'] },
                                            { title: 'Split shank', desc: "L'anneau se sépare en deux (ou trois) brins formant une fourche avant d'atteindre la pierre principale. Donne un design architectural audacieux.", imgs: ['https://rusticandmain.com/cdn/shop/files/Round-Diamond-Solitaire-Engagement-Ring-Art-Nouveau-Inspired-Split-Shank-Setting-The-Selwyn-Rustic-And-Main_9_800x.jpg?v=1747784784', 'https://berlingerjewelry.com/cdn/shop/files/SplitShankOvalDiamondSolitaire_0006_P2620545_1500x.jpg?v=1727475257', 'https://www.kingofjewelry.com/cdn/shop/products/101ctcushionhalogvs1c6799405DSC_0138_0001s9-ea2_1800x1800.jpg?v=1714585746'], tags: ['design moderne', 'originalité'] },
                                        ].map(item => (
                                            <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
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
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🛡️</span> Types de Sertissage du Jonc
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {[
                                            { title: 'Pavé serti', desc: "Des dizaines de micro-griffes retiennent les petits diamants. Offre la brillance maximale car il dissimule presque totalement le métal.", imgs: ['https://images.openai.com/static-rsc-3/cfN_HgiCnRv94cjCVljC3P3aAbcdOSIDXKa-as6MfVPDJgEWEv2XASN0MnRP3B_MXLjmXPCzKFhIeI5bag47qCHRjd_uiA3QlQK-SuPD04E?purpose=fullsize&v=1', 'https://images.openai.com/static-rsc-3/wI_AVGI4Xmqvb6GmSevcys37OcQbw_YkbzTaTcQyMDPH3tG7LAx0rThe1NYFieY3HzNnZ9oNTZpEoYeDGqT7adBYJ3GAukndvvIdtGopOTA?purpose=fullsize&v=1', 'https://images.openai.com/static-rsc-3/cFWTZW55KEkH_zjLqnTDV06LQ3VOpCnJExQBWUiTmMh44XripfGq2E_fuIdjTg8wnFP5GVZ6ZjSAf___6qSC5vPJ2-Dve7jdlBsClKW3qOE?purpose=fullsize&v=1'], tags: ['très rapprochés', 'effet continu'] },
                                            { title: 'Channel setting', desc: "Les pierreries sont coincées (glissées) entre deux longues traverses de métal parallèles. Apporte un ruban de brillance lisse et protège fortement la pierre.", imgs: ['https://zoom.jewelryimages.net/edge/diamondsdirect/images/edge/110-00896-02.jpg', 'https://cavaliergastown.com/cdn/shop/files/Round_Diamond_Channel_Set_Band_2.7mm_5.jpg?v=1727892693&width=1080', 'https://media.tiffany.com/is/image/Tiffany/EcomItemL2/the-tiffany-setting-engagement-ring-with-a-channel-set-diamond-band-in-platinum-26208149_996005_ED_M.jpg?%24cropN=0.1%2C0.1%2C0.8%2C0.8&defaultImage=NoImageAvailableInternal&op_usm=1.75%2C1.0%2C6.0'], tags: ['encastrés', 'protection élevée'] },
                                            { title: 'Bezel setting', desc: "Un collet (cercle fin de métal) entoure intégralement les petits et les gros brillants. L'option la plus robuste pour une personne à la vie active (pas d'accrochage).", imgs: ['https://www.goodstoneinc.com/cdn/shop/files/5stonehalfwaybezelweddingbandsovalsYG_1200x.png?v=1719003102', 'https://fluidjewellery.com/cdn/shop/files/Bezel-Solitaire-ring-yellow-gold.jpg?v=1712173656', 'https://www.goodstoneinc.com/cdn/shop/files/image_fcc79266-7ebe-4fc3-8ba6-645a07fa7e25_1200x.jpg?v=1740065395'], tags: ['entouré de métal', 'sécurité maximale'] },
                                            { title: 'Shared prong band', desc: "Chaque griffe maintient fermement une partie de deux pierres adjacentes. Réduit l'utilisation de métal par rapport au perlage standard.", imgs: ['https://www.starlingjewelry.com/cdn/shop/files/shared-prong-2.jpg?v=1684274030&width=1090', 'https://image.brilliantearth.com/media/product_new_images/7D/BE2PD14R40_white_top.jpg', 'https://ferkosfinejewelry.com/cdn/shop/files/R11646LS_1x1_2ef6c8d9-76ed-41e8-84a3-732f294d9604_635x_crop_center%402x.jpg?v=1699105555'], tags: ['maximise lumière'] },
                                        ].map(item => (
                                            <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
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
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🦅</span> Types de Prongs (Griffes)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {[
                                            { title: '4 prongs', desc: "Design aéré utilisant quatre griffes (souvent N, S, E, O). Laisse passer la lumière au maximum, créant un profil de diamant légèrement carré.", imgs: ['https://images.openai.com/static-rsc-3/16a7zUVD7iGVnNTb88znrb_nb8kF6wgsq7mczlkQ4C5nC-gxnKq2Y5U5yzUTFCEf7y1w5mdn4xth7rIJNmwZpfqdZKG3l1fgcD0e-dMfeLA?purpose=fullsize&v=1', 'https://assets.vrai.com/25216/1683871270-petite-4-prong-solitaire-ring-oval-1-50-ct-plain-upright-yellow.jpg?ar=1%253A1&auto=format%2C+compress&crop=focalpoint&fit=crop&q=60&w=1440', 'https://spencediamonds.com/assets/products/8082-B.jpg'], tags: ['expose plus pierre', 'minimaliste'] },
                                            { title: '6 prongs', desc: "La structure 'Tiffany setting' classique confère une rondeur impeccable et sécurise grandement le centre. Symbole universel du chic.", imgs: ['https://www.diamondmansion.com/media/catalog/product/design/SOL-6272/colorless/white/round/1573500246-Classic-Round-Cut-Knife-Edge-6-Prong-Solitaire-Diamond-Engagement-Ring-White-Gold-Platinum-Front-View.jpg', 'https://images.openai.com/static-rsc-3/X9kZ1qUDpFCOxVyQ5gfOPuH2B5rzpHU7cTQakXEzfTlbmlY92nQV3FJ4Sygs840Y196rMU2YikfLcbccf-xiAG-isdDR42YYJiXnj7pcP9g?purpose=fullsize&v=1', 'https://www.whiteflash.com/photos/2020/01/th500/Valoria-Petite-Six-Prong-Solitaire-Engagement-Ring_gi_11843_b-174662.jpg'], tags: ['sécurité maximale', 'look classique'] },
                                            { title: 'Claw prongs', desc: "Les extrémités des tenons sont limées pour devenir affinées (en forme de serre gracieuse). Dissimule le métal vu du dessus et apporte une légèreté exquise.", imgs: ['https://www.moissaniteco.com/cache/media/products-media-large/enr139ov_89765.jpg', 'https://i.etsystatic.com/19986056/r/il/e21290/5996294278/il_570xN.5996294278_kns0.jpg', 'https://www.whiteflash.com/articlefiles/prong-sample/whiteflash-4-prong-sample-petite-claw-prong.jpg'], tags: ['look luxueux', 'finesse'] },
                                            { title: 'Double prongs', desc: "Des fourches dédoublées souvent postées aux angles des diamants carrés (Cushion, Radiant, Emerald). Solidité accrue alliée à un style historique fort.", imgs: ['https://www.peoplesjewellers.com/productimages/processed/V-20300938_0_800.jpg', 'https://i.etsystatic.com/19986056/r/il/e21290/5996294278/il_1080xN.5996294278_kns0.jpg', 'https://www.geoffreysdiamonds.com/cdn/shop/products/84958.side_1080x.jpg?v=1677991605'], tags: ['design distinctif', 'sécurité & style'] },
                                        ].map(item => (
                                            <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
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
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🎎</span> Bagues His & Hers (Alliances)
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {[
                                            { title: 'Classique', desc: "L'anneau massif, symbole ultime et traditionnel de fidélité. Confort incomparable, résiste aux altérations du quotidien et se patinera poliment au fil des années.", imgs: ['https://i.etsystatic.com/12694725/r/il/8aea63/5443450830/il_570xN.5443450830_2eyu.jpg', 'https://images.openai.com/static-rsc-3/1yOnuSiYlq-VKerhtC6H5fE9EGYi8RkYEOixp-3awaO_AHTeO7JJGiLSzjYiNTyJEImB57BDzK3j3g091Zbvpb6QeRJOH7gpLB8ILadCu6I?purpose=fullsize&v=1', 'https://i.etsystatic.com/32363186/r/il/013421/3489083404/il_fullxfull.3489083404_mvs8.jpg'], tags: ['harmonie', 'intemporalité'] },
                                            { title: 'Diamanté', desc: "Une alliance somptueuse incrustée de pierres (moitié ou tour complet dit Éternité). Destinée à compléter et magnifier de mille feux la parure de la mariée.", imgs: ['https://m.media-amazon.com/images/I/712FpdCYeEL._AC_UY1000_.jpg', 'https://i.etsystatic.com/24547332/r/il/1f20b8/4157656731/il_570xN.4157656731_tkox.jpg', 'https://i.etsystatic.com/12694725/r/il/1ea40a/5389665711/il_fullxfull.5389665711_qhqe.jpg'], tags: ['luxe', 'cohérence couple'] },
                                            { title: 'Personnalisé', desc: "Le choix parfait pour les personnalités uniques. Anneaux gravés, martelés ou aux détails sculpturaux cachant une signification intime à l'histoire du couple.", imgs: ['https://rusticandmain.com/cdn/shop/files/apollo-luna-set-gold-hammered-rustic-and-main.jpg?v=1692722570', 'https://i.etsystatic.com/21424441/r/il/a453f2/5936826851/il_570xN.5936826851_ko2v.jpg', 'https://i.etsystatic.com/25935622/r/il/ed4dac/6555146818/il_570xN.6555146818_g9jm.jpg'], tags: ['unicité', 'storytelling'] },
                                            { title: 'Mix métaux', desc: "Tendance contemporaine brisant la conformité absolue. Combine habilement l'or blanc, jaune ou rose afin que le marié trouve un coloris qui convienne à sa nature.", imgs: ['https://i.etsystatic.com/12694725/r/il/5c5489/1529065680/il_fullxfull.1529065680_tgwp.jpg', 'https://i.etsystatic.com/40226048/r/il/9cda7b/5818823339/il_fullxfull.5818823339_7ri9.jpg', 'https://images.openai.com/static-rsc-3/BAzGpx5wTHFLbmIDAe2Ov7ip55i7SJhtih4jxOesjA9-3wy-LtQeiE2ftesPPrAMoqbKJDDtdkGMP0xLNNzPQUadTaY1eyEGh471_UYcT5A?purpose=fullsize&v=1'], tags: ['modernité', 'contraste'] },
                                        ].map(item => (
                                            <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg flex flex-col">
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

                            {/* SECTION LES 4C DU DIAMANT */}
                            {currentExpertiseStep === 7 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">🔍</span> Les 4C du Diamant
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                            <h3 className="text-xl font-serif text-white mb-2">Cut <span className="text-[#D2B57B] text-sm">(La Taille)</span></h3>
                                            <p className="text-gray-400 text-sm mb-4">Le C le plus important. Il détermine la façon dont la lumière interagit avec le diamant (brillance, feu, scintillement). Une taille "Excellent" ou "Ideal" masquera souvent des défauts de pureté ou de couleur.</p>
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                <p className="text-xs text-[#D2B57B]">💬 <b>Pitch Vendeur :</b> "Peu importe la taille ou la couleur, si la coupe est mauvaise, le diamant paraîtra terne. C'est ici qu'on ne fait aucun compromis."</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                            <h3 className="text-xl font-serif text-white mb-2">Color <span className="text-[#D2B57B] text-sm">(La Couleur)</span></h3>
                                            <p className="text-gray-400 text-sm mb-4">Classée de D (Incolore) à Z (Jaune clair). Pour l'œil nu, les diamants de la gamme G-H-I paraissent souvent incolores, surtout montés sur de l'or jaune qui absorbe le ton chaud.</p>
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                <p className="text-xs text-[#D2B57B]">💬 <b>Pitch Vendeur :</b> "Au-delà de G-H, l'œil humain ne fait la différence que sous une loupe de gemmologue. Descendre un peu en couleur permet souvent de doubler la taille (Carat) pour le même budget."</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                            <h3 className="text-xl font-serif text-white mb-2">Clarity <span className="text-[#D2B57B] text-sm">(La Pureté)</span></h3>
                                            <p className="text-gray-400 text-sm mb-4">Les inclusions (flaws) sont les empreintes digitales du diamant. L'objectif est de trouver un diamant "Eye-Clean" (VS1/VS2 ou SI1 bien sélectionné) où les inclusions sont invisibles à l'œil nu.</p>
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                <p className="text-xs text-[#D2B57B]">💬 <b>Pitch Vendeur :</b> "Un diamant VVS1 et un diamant VS2 auront exactement le même aspect à 30cm de distance. Seul votre microscope fera la différence."</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                            <h3 className="text-xl font-serif text-white mb-2">Carat <span className="text-[#D2B57B] text-sm">(Le Poids)</span></h3>
                                            <p className="text-gray-400 text-sm mb-4">Le Carat représente un poids et non une taille physique. Une coupe Oval ou Emerald d'1 Carat paraîtra plus grande qu'une coupe Round d'1 Carat en surface visible.</p>
                                            <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                                                <p className="text-xs text-[#D2B57B]">💬 <b>Pitch Vendeur :</b> "Plutôt que de viser le chiffre rond de 1.00 Carat, visez 0.90 ou 0.95. Visuellement identique, mais le prix chute drastiquement sous le seuil psychologique du Carat."</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* SECTION ANATOMIE */}
                            {currentExpertiseStep === 8 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">💍</span> Anatomie d'une Bague
                                    </h2>
                                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-8 animate-in fade-in slide-in-from-top-4">
                                        <div className="grid md:grid-cols-2 gap-8 items-center">
                                            <div className="space-y-6">
                                                <div className="border-l-2 border-[#D2B57B] pl-4">
                                                    <h4 className="text-white font-serif text-lg mb-1">La Tête (Center Setting)</h4>
                                                    <p className="text-sm text-gray-400">La partie métallique qui maintient la pierre centrale. Elle impacte fortement la hauteur de la bague (High-profile vs Low-profile).</p>
                                                </div>
                                                <div className="border-l-2 border-[#D2B57B] pl-4">
                                                    <h4 className="text-white font-serif text-lg mb-1">Les Griffes (Prongs)</h4>
                                                    <p className="text-sm text-gray-400">Généralement au nombre de 4 ou 6. 4 griffes montrent plus de la pierre mais sont plus carrées visuellement. 6 griffes protègent mieux et gardent l'aspect rond.</p>
                                                </div>
                                                <div className="border-l-2 border-[#D2B57B] pl-4">
                                                    <h4 className="text-white font-serif text-lg mb-1">Le Pont (Gallery & Bridge)</h4>
                                                    <p className="text-sm text-gray-400">L'architecture sous la pierre centrale. C'est ici qu'on ajoute souvent un Hidden Halo (Halo caché) pour une touche de brillance latérale discrète.</p>
                                                </div>
                                                <div className="border-l-2 border-[#D2B57B] pl-4">
                                                    <h4 className="text-white font-serif text-lg mb-1">Le Corps de Bague (Shank / Band)</h4>
                                                    <p className="text-sm text-gray-400">L'anneau lui-même. Largeur recommandée : de 1.8mm à 2.2mm pour la solidité et l'esthétique finale.</p>
                                                </div>
                                            </div>
                                            <div className="bg-black/50 border border-white/10 rounded-xl p-6 text-center">
                                                <div className="w-full rounded-xl border border-white/10 overflow-hidden cursor-zoom-in group" onClick={() => setSelectedImage('/anatomie-bague.png')}>
                                                    <img src="/anatomie-bague.png" alt="Anatomie Bague" className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-500 text-sm p-8 block">Image introuvable. Veuillez placer anatomie-bague.png dans le dossier public.</span>'; }} />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest">Maîtriser ce lexique établit instantanément votre autorité d'expert joaillier.</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* SECTION METAUX AVANCES - INTERACTIF */}
                            {currentExpertiseStep === 9 && (
                                <section className="animate-in fade-in slide-in-from-right-8 duration-500">
                                    <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">✨</span> Expertise Métaux & Allergies
                                    </h2>

                                    {/* Sélecteur Interactif des Métaux */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                                        {[
                                            { id: 'platine', label: 'Platine', emoji: '⬜', color: 'from-gray-300 to-gray-500' },
                                            { id: 'or-blanc', label: 'Or Blanc', emoji: '🤍', color: 'from-gray-200 to-white' },
                                            { id: 'or-jaune', label: 'Or Jaune', emoji: '💛', color: 'from-yellow-400 to-amber-500' },
                                            { id: 'or-rose', label: 'Or Rose', emoji: '🩷', color: 'from-pink-300 to-rose-500' },
                                            { id: 'argent', label: 'Argent 925', emoji: '🩶', color: 'from-slate-300 to-slate-500' },
                                        ].map(metal => (
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
                                                    }`}>{metal.label}</span>
                                                {selectedMetal === metal.id && (
                                                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r ${metal.color}`}></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Détails du métal sélectionné */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-300" key={selectedMetal}>
                                        {selectedMetal === 'platine' && (
                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-serif text-white flex items-center gap-3">⬜ Platine (Pt950)</h3>
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                        <h4 className="text-green-400 font-bold text-sm mb-2">✅ Avantages</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• Naturellement blanc</li><li>• Hypoallergénique total</li><li>• Extrêmement dense et solide</li><li>• Ne nécessite aucun rhodiage</li></ul>
                                                    </div>
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                                        <h4 className="text-red-400 font-bold text-sm mb-2">⚠️ Inconvénients</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• Prix plus élevé</li><li>• "Patine" gris mat avec le temps</li><li>• Plus lourd sur le doigt</li></ul>
                                                    </div>
                                                    <div className="bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded-xl p-4">
                                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-2">💬 Pitch Vendeur</h4>
                                                        <p className="text-xs text-gray-300 italic">"Le platine est le métal le plus noble et le plus sécuritaire pour les peaux sensibles. C'est le choix d'excellence."</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedMetal === 'or-blanc' && (
                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-serif text-white flex items-center gap-3">🤍 Or Blanc (14K / 18K)</h3>
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                        <h4 className="text-green-400 font-bold text-sm mb-2">✅ Avantages</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• Look moderne et brillant</li><li>• Plus abordable que le platine</li><li>• Très populaire en Amérique du Nord</li></ul>
                                                    </div>
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                                        <h4 className="text-red-400 font-bold text-sm mb-2">⚠️ Inconvénients</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• Re-rhodiage tous les 1-2 ans</li><li>• Or jaune réapparaît avec le temps</li><li>• Peut contenir du nickel (allergies)</li></ul>
                                                    </div>
                                                    <div className="bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded-xl p-4">
                                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-2">💬 Pitch Vendeur</h4>
                                                        <p className="text-xs text-gray-300 italic">"L'or blanc offre cet éclat miroir grâce au rhodium. C'est notre option la plus populaire pour un look contemporain."</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedMetal === 'or-jaune' && (
                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-serif text-white flex items-center gap-3">💛 Or Jaune (10K / 14K / 18K)</h3>
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                        <h4 className="text-green-400 font-bold text-sm mb-2">✅ Avantages</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• Classique intemporel</li><li>• Hypoallergénique (18K)</li><li>• Aucun entretien spécial requis</li><li>• Absorbe le ton chaud du diamant</li></ul>
                                                    </div>
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                                        <h4 className="text-red-400 font-bold text-sm mb-2">⚠️ Inconvénients</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• 10K plus pâle (moins de prestige)</li><li>• Se raye avec le temps</li></ul>
                                                    </div>
                                                    <div className="bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded-xl p-4">
                                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-2">💬 Pitch Vendeur</h4>
                                                        <p className="text-xs text-gray-300 italic">"L'or jaune 18K offre une saturation riche et une teinte chaude qui sublime les diamants de couleur G-H. C'est le prestige européen."</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedMetal === 'or-rose' && (
                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-serif text-white flex items-center gap-3">🩷 Or Rose</h3>
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                        <h4 className="text-green-400 font-bold text-sm mb-2">✅ Avantages</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• Look romantique et tendance</li><li>• Alliage robuste (cuivre)</li><li>• Couleur chaude unique</li></ul>
                                                    </div>
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                                        <h4 className="text-red-400 font-bold text-sm mb-2">⚠️ Inconvénients</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• Léger risque d'allergie au cuivre</li><li>• Moins traditionnel</li></ul>
                                                    </div>
                                                    <div className="bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded-xl p-4">
                                                        <h4 className="text-[#D2B57B] font-bold text-sm mb-2">💬 Pitch Vendeur</h4>
                                                        <p className="text-xs text-gray-300 italic">"L'or rose est le métal le plus en vogue. Il apporte une douceur romantique qui attire les personnalités modernes et audacieuses."</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedMetal === 'argent' && (
                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-serif text-white flex items-center gap-3">🩶 Argent Sterling 925</h3>
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                                        <h4 className="text-green-400 font-bold text-sm mb-2">✅ Avantages</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• Très abordable</li><li>• Éclat blanc brillant</li></ul>
                                                    </div>
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                                        <h4 className="text-red-400 font-bold text-sm mb-2">⚠️ Inconvénients</h4>
                                                        <ul className="text-xs text-gray-300 space-y-1"><li>• S'oxyde et noircit</li><li>• Très malléable, se raye facilement</li><li>• Déconseillé pour fiançailles</li></ul>
                                                    </div>
                                                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                                                        <h4 className="text-red-400 font-bold text-sm mb-2">🚫 Recommandation</h4>
                                                        <p className="text-xs text-gray-300 italic">Déconseillé pour une bague de fiançailles portée au quotidien. Réservé aux bijoux fantaisie.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Alerte Allergies */}
                                    <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                                        <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5" /> Attention aux Allergies (Nickel)
                                        </h4>
                                        <p className="text-sm text-gray-300 mb-3">Certaines clientes sont allergiques au nickel (présent dans beaucoup d'Or Blanc commercial). Si la cliente est sensible, orientez <strong className="text-white">systématiquement</strong> vers :</p>
                                        <div className="flex flex-wrap gap-3">
                                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">✅ Platine (Hypoallergénique total)</span>
                                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">✅ Or Jaune 18K</span>
                                            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-medium">✅ Or Rose 18K</span>
                                        </div>
                                    </div>

                                    {/* Mini Quiz : Lequel Choisir ? */}
                                    <div className="mt-10 bg-black/40 border border-[#D2B57B]/30 rounded-2xl p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="text-3xl">🧠</span>
                                            <div>
                                                <h3 className="text-xl font-serif text-white">Quiz Express : Lequel choisir ?</h3>
                                                <p className="text-xs text-gray-400 mt-1">Testez vos connaissances sur les métaux</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10">
                                            <p className="text-sm text-gray-200 italic">🎯 <strong className="text-white">Scénario :</strong> Une cliente vous dit qu'elle a la peau très sensible et qu'elle fait souvent des réactions allergiques aux bijoux. Elle veut une bague blanche et brillante. Quel métal lui recommandez-vous ?</p>
                                        </div>
                                        <div className="space-y-3">
                                            {[
                                                { id: 1, text: "Or Blanc 14K — c'est le plus populaire et le plus brillant", isCorrect: false, feedback: "❌ Attention ! L'Or Blanc 14K contient souvent du nickel qui peut provoquer des réactions allergiques. C'est un piège fréquent." },
                                                { id: 2, text: "Platine (Pt950) — naturellement blanc et hypoallergénique", isCorrect: true, feedback: "✅ Excellent ! Le Platine est le choix parfait : naturellement blanc (pas de rhodiage nécessaire) ET hypoallergénique. C'est la réponse d'un expert." },
                                                { id: 3, text: "Argent Sterling 925 — abordable et blanc", isCorrect: false, feedback: "❌ L'Argent est trop fragile pour une bague de fiançailles quotidienne. Il s'oxyde et se raye facilement. Jamais recommandé pour cet usage." }
                                            ].map(option => (
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
                                        <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">⚖️</span> Différence Visuelle Or Jaune
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                                        {[
                                            { k: '10K', pale: true, desc: 'Jaune plus pâle, durable, très économique', imgs: ['/images/education/metals/gold_10k.png'] },
                                            { k: '14K', pale: false, desc: 'Jaune équilibré, standard luxe nord-américain', imgs: ['/images/education/metals/gold_14k.png'] },
                                            { k: '18K', pale: false, desc: 'Jaune profond, saturation élevée, prestige européen', imgs: ['/images/education/metals/gold_18k.png'] }
                                        ].map(gold => (
                                            <div key={gold.k} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                                <div className="flex h-32 overflow-hidden bg-black/50">
                                                    <ImageWithPreview src={gold.imgs[0]} />
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="text-2xl font-serif text-white mb-2">Or <span className="text-[#D2B57B]">{gold.k}</span></h3>
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
                                    J'ai assimilé cette partie
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
                                ← Précédent
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
                                    Suivant →
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        const qcmTabsTrigger = document.querySelector('[value="qcm"]') as HTMLElement;
                                        if (qcmTabsTrigger) qcmTabsTrigger.click();
                                    }}
                                    className="px-6 py-3 rounded-xl font-medium bg-green-500 text-black hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] flex items-center gap-2"
                                >
                                    Passer au QCM <CheckCircle2 className="w-5 h-5" />
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
                    <div className="text-[#D2B57B] font-serif text-2xl italic tracking-widest mb-2">Auclaire</div>
                    <p className="text-gray-600 text-xs uppercase tracking-widest">Le Guide Interne de Vente • Confidentiel</p>
                </footer>
            </div>
        </div >
    );
}

function QCMSection() {
    const [salespersonName, setSalespersonName] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [answersProcessus, setAnswersProcessus] = useState<Record<number, number>>({});
    const [answersExpertise, setAnswersExpertise] = useState<Record<number, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState<{ proc: number, exp: number } | null>(null);

    const getGrade = (total: number) => {
        if (total >= 190) return { title: "Expert Élite", color: "text-[#D2B57B]" };
        if (total >= 160) return { title: "Closer Confirmé", color: "text-green-400" };
        if (total >= 120) return { title: "Junior - À coacher", color: "text-yellow-400" };
        return { title: "Novice - Formation requise", color: "text-red-400" };
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
            alert("Veuillez répondre à toutes les questions avant de soumettre.");
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
                alert(`Erreur lors de la sauvegarde: ${error.message}\n\n⚠️ As-tu bien exécuté le script SQL dans Supabase pour créer la table "formation_results" ?`);
            } else {
                setResults({ proc: processScore, exp: expertiseScore });
                setIsSubmitted(true);
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (e) {
            console.error("Unknown error:", e);
            alert("Erreur inattendue.");
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
                <h2 className="text-3xl font-serif text-white text-center mb-4">QCM Officiel Auclaire</h2>
                <p className="text-gray-400 text-center text-sm mb-8">Test de validation des acquis : 100 points Processus / 100 points Expertise. Les résultats seront envoyés au pole Management.</p>

                <form onSubmit={handleStart} className="space-y-6">
                    <div>
                        <label className="text-xs text-[#D2B57B] uppercase tracking-wider mb-2 block font-semibold">Votre Nom complet</label>
                        <Input
                            value={salespersonName}
                            onChange={(e) => setSalespersonName(e.target.value)}
                            placeholder="John Doe"
                            className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-[#D2B57B] h-12"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full bg-[#D2B57B] text-black hover:bg-[#D2B57B]/90 h-12 font-medium">
                        Commencer l'évaluation <ArrowRight className="w-4 h-4 ml-2" />
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
                <h2 className="text-4xl font-serif text-white mb-6">Évaluation Terminée</h2>
                <p className="text-gray-300 text-lg mb-8">Merci <strong className="text-white">{salespersonName}</strong>, vos résultats ont bien été sauvegardés.</p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Processus</p>
                        <p className="text-4xl font-serif text-[#D2B57B]">{results.proc} <span className="text-lg text-gray-500">/ 100</span></p>
                    </div>
                    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Expertise</p>
                        <p className="text-4xl font-serif text-[#D2B57B]">{results.exp} <span className="text-lg text-gray-500">/ 100</span></p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <p className="text-2xl font-serif text-white mb-2">Score Total : {results.proc + results.exp} <span className="text-sm text-gray-400">/ 200</span></p>
                    {(() => {
                        const grade = getGrade(results.proc + results.exp);
                        return <p className={`text-xl font-bold uppercase tracking-widest ${grade.color}`}>{grade.title}</p>;
                    })()}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto mt-8 relative">
            <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md p-4 border-b border-white/10 mb-8 flex justify-between items-center rounded-xl">
                <p className="text-sm text-gray-300">Candidat: <span className="text-[#D2B57B] font-medium">{salespersonName}</span></p>
                <div className="flex gap-4 text-xs font-mono text-gray-400">
                    <span className={Object.keys(answersProcessus).length === qcmProcessus.length ? 'text-green-400' : ''}>Processus: {Object.keys(answersProcessus).length}/{qcmProcessus.length}</span>
                    <span className={Object.keys(answersExpertise).length === qcmExpertise.length ? 'text-green-400' : ''}>Expertise: {Object.keys(answersExpertise).length}/{qcmExpertise.length}</span>
                </div>
            </div>

            <div className="space-y-12">
                <div>
                    <h3 className="text-2xl font-serif text-[#D2B57B] mb-8 flex items-center gap-3"><BookOpen className="w-6 h-6" /> Partie 1 : Processus & Accompagnement</h3>
                    <div className="space-y-8">
                        {qcmProcessus.map((q) => (
                            <div key={`proc_${q.id}`} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-[#D2B57B]/30 transition-colors">
                                <p className="text-lg text-white mb-4"><span className="text-[#D2B57B] font-serif mr-2">{q.id}.</span> {q.question} <span className="text-xs text-gray-500 ml-2">({q.points} pts)</span></p>
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
                    <h3 className="text-2xl font-serif text-[#D2B57B] mb-8 flex items-center gap-3"><Diamond className="w-6 h-6" /> Partie 2 : Expertise Bague de Fiançailles</h3>
                    <div className="space-y-8">
                        {qcmExpertise.map((q) => (
                            <div key={`exp_${q.id}`} className="bg-white/5 border border-white/10 p-6 rounded-xl hover:border-[#D2B57B]/30 transition-colors">
                                <p className="text-lg text-white mb-4"><span className="text-[#D2B57B] font-serif mr-2">{q.id}.</span> {q.question} <span className="text-xs text-gray-500 ml-2">({q.points} pts)</span></p>
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
                        {isSubmitting ? 'Validation en cours...' : 'Soumettre mon évaluation'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
