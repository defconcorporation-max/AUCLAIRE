import React, { useState } from 'react';
import { Lock, X, ChevronDown, ChevronRight, CheckCircle2, Search, BrainCircuit, Target, Diamond, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
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
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        objectives: true,
        cuts: true,
        diamonds4c: true,
        anatomy: true,
        metals: true,
        gold: true,
        consultation: true,
        process: true,
        rules: true
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

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
                <header className="text-center mb-16 border-b border-white/10 pb-16">
                    <h2 className="text-[#D2B57B] text-xs md:text-sm uppercase tracking-[0.3em] mb-6 font-semibold inline-block px-5 py-2 border border-[#D2B57B]/30 rounded-full bg-[#D2B57B]/10 shadow-[0_0_20px_rgba(210,181,123,0.2)]">Auclaire Academy</h2>
                    <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-white to-[#D2B57B] bg-clip-text text-transparent font-serif leading-tight">Formation Closer Expert</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-serif italic">
                        Bague de Fiançailles — L'art de l'accompagnement d'élite.
                    </p>
                </header>

                <Tabs defaultValue="processus" className="w-full">
                    <TabsList className="w-full grid grid-cols-3 bg-black/40 border border-white/10 p-1 rounded-xl mb-12">
                        <TabsTrigger value="processus" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <BookOpen className="w-4 h-4 mr-2" /> Processus & Accompagnement
                        </TabsTrigger>
                        <TabsTrigger value="expertise" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <Diamond className="w-4 h-4 mr-2" /> Expertise
                        </TabsTrigger>
                        <TabsTrigger value="qcm" className="data-[state=active]:bg-[#D2B57B] data-[state=active]:text-black rounded-lg py-3">
                            <GraduationCap className="w-4 h-4 mr-2" /> QCM Officiel
                        </TabsTrigger>
                    </TabsList>

                    {/* ONGLET 1 : PROCESSUS ET ACCOMPAGNEMENT */}
                    <TabsContent value="processus" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
                        {/* OBJECTIFS */}
                        <section>
                            <SectionHeader id="objectives" emoji="⭐" title="Objectifs du Document" expanded={expandedSections.objectives} toggleSection={toggleSection} />
                            {expandedSections.objectives && (
                                <div className="bg-[#D2B57B]/10 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-4">
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
                            )}
                        </section>

                        {/* SECTION CONSULTATION CLIENT */}
                        <section>
                            <SectionHeader id="consultation" emoji="🗣️" title="Diagnostic & Consultation Patient" expanded={expandedSections.consultation} toggleSection={toggleSection} />
                            {expandedSections.consultation && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                        <h3 className="text-xl font-serif text-[#D2B57B] mb-4">Rassurer sur le budget</h3>
                                        <ul className="space-y-3 text-sm text-gray-300">
                                            <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Normaliser le budget du client sans jugement.</span></li>
                                            <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Expliquer les compromis intelligents pour maximiser le rendu.</span></li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                        <h3 className="text-xl font-serif text-[#D2B57B] mb-4">Identifier le style de la partenaire</h3>
                                        <ul className="space-y-3 text-sm text-gray-300">
                                            <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Analyser ses bijoux actuels et son style vestimentaire.</span></li>
                                            <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Comprendre sa personnalité et son lifestyle (sport, travail manuel).</span></li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                        <h3 className="text-xl font-serif text-[#D2B57B] mb-4">Vendre l'émotion</h3>
                                        <ul className="space-y-3 text-sm text-gray-300">
                                            <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Aider le client à se projeter dans le moment de la demande.</span></li>
                                            <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Mettre en valeur la symbolique de l'engagement (héritage émotionnel).</span></li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#D2B57B]/40 transition-colors">
                                        <h3 className="text-xl font-serif text-[#D2B57B] mb-4">Guider vers la bague idéale</h3>
                                        <ul className="space-y-3 text-sm text-gray-300">
                                            <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Comprendre la partenaire et le budget pour identifier les priorités.</span></li>
                                            <li className="flex items-start gap-2"><span className="text-[#D2B57B]/50 mt-1">▪</span><span>Éduquer, proposer des options, rassurer et valider jusqu'au closing.</span></li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* PROCESSUS 12 PHASES */}
                        <section>
                            <SectionHeader id="process" emoji="🧭" title="Processus & Accompagnement (12 Phases)" expanded={expandedSections.process} toggleSection={toggleSection} />
                            {expandedSections.process && (
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent animate-in fade-in slide-in-from-top-4">
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
                            )}
                        </section>

                        {/* RULES */}
                        <section>
                            <SectionHeader id="rules" emoji="📜" title="Règles d'Or Auclaire" expanded={expandedSections.rules} toggleSection={toggleSection} />
                            {expandedSections.rules && (
                                <div className="bg-gradient-to-r from-[#D2B57B]/20 to-[#D2B57B]/5 border border-[#D2B57B]/30 rounded-2xl p-8 relative overflow-hidden text-center shadow-[0_0_30px_rgba(210,181,123,0.15)] animate-in fade-in slide-in-from-top-4">
                                    <div className="max-w-2xl mx-auto space-y-4 text-left">
                                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B] transition-colors">
                                            <span className="text-2xl">⚖️</span>
                                            <p className="text-gray-200 font-medium">Toujours poser <span className="text-[#D2B57B]">1 question émotionnelle</span> pour <span className="text-[#D2B57B]">1 question technique</span></p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B] transition-colors">
                                            <span className="text-2xl">🌟</span>
                                            <p className="text-gray-200 font-medium">Toujours <span className="text-[#D2B57B]">sur-servir le client</span> avec une attention au détail extrème</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B] transition-colors">
                                            <span className="text-2xl">✅</span>
                                            <p className="text-gray-200 font-medium">Toujours <span className="text-[#D2B57B]">valider la compréhension</span> à chaque étape cruciale</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B] transition-colors">
                                            <span className="text-2xl">🛡️</span>
                                            <p className="text-gray-200 font-medium">Toujours <span className="text-[#D2B57B]">rassurer et soutenir</span>, l'achat diamantaire crée de l'anxiété</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 hover:border-[#D2B57B] transition-colors">
                                            <span className="text-2xl">🧭</span>
                                            <p className="text-gray-200 font-medium">Toujours <span className="text-[#D2B57B]">guider</span> - vous êtes le médecin, il est le patient</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </TabsContent>

                    {/* ONGLET 2 : EXPERTISE */}
                    <TabsContent value="expertise" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
                        {/* SECTION COUPES DE DIAMANTS */}
                        <section>
                            <SectionHeader id="cuts" emoji="💎" title="Guide des Coupes (Diamants)" expanded={expandedSections.cuts} toggleSection={toggleSection} />
                            {expandedSections.cuts && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg group">
                                        <div className="flex h-32 overflow-hidden bg-black/50">
                                            <ImageWithPreview src="https://images.openai.com/static-rsc-3/xp59ldulbErVwr1UHOWmLjJEgcTO4fwyjg6DgAUY5K6qHykOzcLHXIA4svHqkAi20_6lYqAOmkZ2Ad4-pR_-n2FlryQX_P47ii0vc1n_ack?purpose=fullsize&v=1" />
                                            <ImageWithPreview src="https://images.openai.com/static-rsc-3/RJ6e4JkTqds8DIGMLf8-l5ng8zXpryNYaXbpss6jZpaemUwKRKiiJmExE73FX5a74YfkeDNhdfOOn6qEo4CwY7pi7DAYcx-pfnTF8COdPZk?purpose=fullsize&v=1" />
                                            <ImageWithPreview src="https://i.etsystatic.com/16544137/r/il/1ccc36/3168700913/il_1080xN.3168700913_tto5.jpg" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-xl font-serif text-white mb-3">Round <span className="text-[10px] font-sans tracking-widest text-[#D2B57B] block mt-1 uppercase">Brillance maximale</span></h3>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-400">La coupe ronde maximise la réflexion de la lumière grâce à une géométrie optimisée.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Brillance maximale</span>
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Intemporel</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                        <div className="flex h-32 overflow-hidden bg-black/50">
                                            <ImageWithPreview src="https://www.jewelove.in/cdn/shop/files/jewelove-30-pointer-oval-cut-solitaire-18k-rose-gold-ring-jl-au-19004r-women-s-band-only-vs-j-38879168725233_2000x.jpg?v=1685082593" />
                                            <ImageWithPreview src="https://www.jared.com/productimages/processed/V-961438900_1_800.jpg?pristine=true" />
                                            <ImageWithPreview src="https://i.etsystatic.com/36057419/r/il/3737b5/5387076943/il_fullxfull.5387076943_t3z7.jpg" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-xl font-serif text-white mb-3">Oval <span className="text-[10px] font-sans tracking-widest text-[#D2B57B] block mt-1 uppercase">Illusion taille</span></h3>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-400">Forme allongée augmentant la surface visible du diamant.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Effet carat+</span>
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Doigt allongé</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                        <div className="flex h-32 overflow-hidden bg-black/50">
                                            <ImageWithPreview src="https://sites.jewelfeed.com/si688/catalog/items/96d47101-0bdf-4bf4-8dbd-d175753af0a2.jpg.800x800_q85_background.jpg" />
                                            <ImageWithPreview src="https://images.openai.com/static-rsc-3/M0PhtLnyhC6GRhYlnrZTmkDLfRwvMlUUCbTii1GJfawL0inTZitbMiEQfhSQhXeLthQPL27l8yw3kixaStuO9mivyLvEQOvvJ0t6quGQ2Bw?purpose=fullsize&v=1" />
                                            <ImageWithPreview src="https://media.tiffany.com/is/image/Tiffany/EcomItemL2/tiffany-novo-princess-cut-engagement-ring-with-a-pav-set-diamond-band-in-platinum-60767173_996218_ED_M.jpg?%24cropN=0.1%2C0.1%2C0.8%2C0.8&defaultImage=NoImageAvailableInternal&op_usm=1.75%2C1.0%2C6.0" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-xl font-serif text-white mb-3">Princess <span className="text-[10px] font-sans tracking-widest text-[#D2B57B] block mt-1 uppercase">Moderne structuré</span></h3>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-400">Forme carrée avec brillance importante.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Look moderne</span>
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Structure nette</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                        <div className="flex h-32 overflow-hidden bg-black/50">
                                            <ImageWithPreview src="https://i.etsystatic.com/28887394/r/il/006bab/5523396783/il_1080xN.5523396783_bick.jpg" />
                                            <ImageWithPreview src="https://images.openai.com/static-rsc-3/OsQgxlKW7BCFrNCnxpZmpk0OeTc3E0BvQvVGkBFgQy8khDKlRq0VjAqBqY-UgvaoxOzU-kmxu5jsUiosnsJjPAql8QKD9QVqnSqgT-lFPXk?purpose=fullsize&v=1" />
                                            <ImageWithPreview src="https://www.goodstoneinc.com/cdn/shop/files/DSC01022_1200x.jpg?v=1746540144" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-xl font-serif text-white mb-3">Cushion <span className="text-[10px] font-sans tracking-widest text-[#D2B57B] block mt-1 uppercase">Romantique vintage</span></h3>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-400">Coins arrondis et style antique.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Romantique</span>
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Douceur visuelle</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                        <div className="flex h-32 overflow-hidden bg-black/50">
                                            <ImageWithPreview src="https://images.openai.com/static-rsc-3/11AWox_-MO0DQva5018ge3MjqJaad5nTG9ae_z8fWfLGRWWkR4FlHwFyfFzU3Rr2Zusn-qGjfkUpUcQhXjCr1uVZyGBRneHZX0Z2_JAzgIU?purpose=fullsize&v=1" />
                                            <ImageWithPreview src="https://images.openai.com/static-rsc-3/CYXPopbwiRSi3FlUy4V0buwh1ivy5nWKVoAg9SyKGxycFa4IiQqAWeCR1aeGNjUVIKo8AHhkooUAmDZKZhsuTrIndI-ZuGVbD4Unt2AHM1o?purpose=fullsize&v=1" />
                                            <ImageWithPreview src="https://i.etsystatic.com/17551371/r/il/32495a/4580417301/il_fullxfull.4580417301_8s0u.jpg" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-xl font-serif text-white mb-3">Emerald <span className="text-[10px] font-sans tracking-widest text-[#D2B57B] block mt-1 uppercase">Élégance minimaliste</span></h3>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-400">Facettes larges créant un effet miroir.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Sophistication</span>
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Chic</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                        <div className="flex h-32 overflow-hidden bg-black/50">
                                            <ImageWithPreview src="https://i.etsystatic.com/6690489/r/il/1388ef/3911868638/il_570xN.3911868638_bpdn.jpg" />
                                            <ImageWithPreview src="https://www.kingofjewelry.com/cdn/shop/products/Pearcuthalo120gvs1DSC_016223571s7-ea1_1800x1800.jpg?v=1714584870" />
                                            <ImageWithPreview src="https://prouddiamond.com/cdn/shop/files/PearCutPaveRing_E.jpg?v=1700771323&width=1445" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-xl font-serif text-white mb-3">Pear <span className="text-[10px] font-sans tracking-widest text-[#D2B57B] block mt-1 uppercase">Original féminin</span></h3>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-400">Forme hybride ronde + marquise.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Originalité</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* RADIANT CUT */}
                                    <div className="bg-gradient-to-br from-[#D2B57B]/20 to-transparent border border-[#D2B57B]/30 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-[0_0_15px_rgba(210,181,123,0.15)] group relative">
                                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md border border-[#D2B57B]/50 z-10">
                                            <span className="text-[10px] uppercase font-bold text-[#D2B57B] tracking-wider">NEW</span>
                                        </div>
                                        <div className="flex h-32 overflow-hidden bg-black/50">
                                            <ImageWithPreview src="https://i.etsystatic.com/13550478/r/il/f53ebd/3052822471/il_1080xN.3052822471_b5y3.jpg" />
                                            <ImageWithPreview src="https://i.etsystatic.com/13550478/r/il/a765ea/3005118742/il_1080xN.3005118742_r41u.jpg" />
                                            <ImageWithPreview src="https://i.etsystatic.com/26422736/r/il/3decc6/3792617658/il_1080xN.3792617658_4ty5.jpg" />
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-xl font-serif text-white mb-3">Radiant <span className="text-[10px] font-sans tracking-widest text-[#D2B57B] block mt-1 uppercase">Hybride Brillant</span></h3>
                                            <div className="mb-4">
                                                <p className="text-xs text-gray-400">Mélange de la forme Emerald avec les facettes de la coupe Round, offrant un maximum d'éclat.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Pétillant</span>
                                                <span className="px-2 py-1 bg-[#D2B57B]/10 border border-[#D2B57B]/20 rounded text-[10px] uppercase tracking-wider text-[#D2B57B]">Moderne</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* SECTION LES 4C DU DIAMANT */}
                        <section>
                            <SectionHeader id="diamonds4c" emoji="🔍" title="Les 4C du Diamant" expanded={expandedSections.diamonds4c} toggleSection={toggleSection} />
                            {expandedSections.diamonds4c && (
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
                            )}
                        </section>

                        {/* SECTION ANATOMIE */}
                        <section>
                            <SectionHeader id="anatomy" emoji="💍" title="Anatomie d'une Bague" expanded={expandedSections.anatomy} toggleSection={toggleSection} />
                            {expandedSections.anatomy && (
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
                                            <div className="w-full aspect-square bg-[#D2B57B]/5 rounded-xl border border-[#D2B57B]/20 flex items-center justify-center p-4">
                                                <img src="https://i.ibb.co/3Wb0kC3/anatomy.png" alt="Anatomie Bague" className="max-h-full opacity-80 mix-blend-screen" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-gray-500 text-sm">Schéma d\'anatomie (Tête, Griffes, Shank)</span>'; }} />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest">Maîtriser ce lexique établit instantanément votre autorité d'expert joaillier.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* SECTION METAUX AVANCES */}
                        <section>
                            <SectionHeader id="metals" emoji="✨" title="Expertise Métaux & Allergies" expanded={expandedSections.metals} toggleSection={toggleSection} />
                            {expandedSections.metals && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                        <h3 className="text-xl font-serif text-white mb-4 border-b border-white/10 pb-2">Platine vs Or Blanc</h3>
                                        <ul className="space-y-4 text-sm text-gray-300">
                                            <li>
                                                <strong className="text-[#D2B57B] block mb-1">Le Platine (Pt950) :</strong>
                                                Naturellement blanc, hypoallergénique, et extrêmement dense (lourd). Il ne perd pas sa couleur blanche, mais se "patine" avec le temps (devient légèrement gris mat). Il est idéal pour la sécurité des pierres.
                                            </li>
                                            <li>
                                                <strong className="text-[#D2B57B] block mb-1">L'Or Blanc (14K ou 18K) :</strong>
                                                L'or pur est jaune. Pour devenir blanc, il est allié à du nickel, zinc ou palladium, puis recouvert d'une fine couche de Rhodium (Rhodiage). Avec les frottements, l'or jaune réapparait et nécessite un entretien (re-rhodiage) tous les 1-2 ans.
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                        <h3 className="text-xl font-serif text-white mb-4 border-b border-white/10 pb-2">Alliages & Hypoallergénique</h3>
                                        <div className="space-y-4 text-sm text-gray-300">
                                            <p><strong className="text-white">Or Rose :</strong> Obtenu par l'ajout de cuivre. C'est l'alliage le plus robuste après le platine.</p>
                                            <p><strong className="text-white">Or Jaune :</strong> Obtenu par un mélange d'argent et de cuivre avec l'or pur.</p>
                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mt-4">
                                                <h4 className="text-red-400 font-bold mb-2">Attention aux allergies (Nickel)</h4>
                                                <p className="text-xs">Certaines femmes sont allergiques au nickel contenu dans beaucoup d'alliages d'Or Blanc commercial. Si la cliente est sensible, orientez SYSTEMATIQUEMENT vers :</p>
                                                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                                                    <li>Du Platine (Hypoallergénique total).</li>
                                                    <li>De l'Or Jaune ou Or Rose 18K.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section>
                            <SectionHeader id="gold" emoji="⚖️" title="Différence Visuelle Or Jaune" expanded={expandedSections.gold} toggleSection={toggleSection} />
                            {expandedSections.gold && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
                                    {[
                                        { k: '10K', pale: true, desc: 'Jaune plus pâle, durable, très économique', imgs: ['https://missfoxine.com/cdn/shop/files/Love-Bird-10k-Gold-Platinum-Diamond-Engagement-Ring-7.jpg?v=1739460326&width=554', 'https://i.etsystatic.com/7267337/r/il/6ce691/944946620/il_570xN.944946620_c8j2.jpg', 'https://i.shgcdn.com/ff732080-cdeb-48d6-a4a4-720eef4d8187/-/format/auto/-/preview/3000x3000/-/quality/lighter/'] },
                                        { k: '14K', pale: false, desc: 'Jaune équilibré, standard luxe nord-américain', imgs: ['https://www.linjer.co/cdn/shop/files/graduated-diamond-ring-14k-yellow-gold-dahlia-linjer-jewelry_1080x.jpg?v=1761547368', 'https://www.miraljewelers.com/cdn/shop/files/130-0083201-_1.png?v=1752042191', 'https://images.openai.com/static-rsc-3/DBA2EobkSyo2x6WaMEa-iQ2SRV8t46XczeXATcVATK3LYS-7WXDIPvoFchjqVezIL5TH5lKEmxdtcUWmBOaWZPI24_hlQatiXPdzUq8mOOw?purpose=fullsize&v=1'] },
                                        { k: '18K', pale: false, desc: 'Jaune profond, saturation élevée, prestige européen', imgs: ['https://trumpetandhorn.com/cdn/shop/files/34622_3013624_2048x.jpg?v=1770447967', 'https://www.josephjewelry.com/images/rings-engagement/Custom-Two-Tone-Yellow-and-White-Diamond-Halo-Engagement-Ring-Y-3qtr-103270.jpg', 'https://images.openai.com/static-rsc-3/DBA2EobkSyo2x6WaMEa-iQ2SRV8t46XczeXATcVATK3LYS-7WXDIPvoFchjqVezIL5TH5lKEmxdtcUWmBOaWZPI24_hlQatiXPdzUq8mOOw?purpose=fullsize&v=1'] }
                                    ].map(gold => (
                                        <div key={gold.k} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#D2B57B]/50 transition-colors shadow-lg">
                                            <div className="flex h-32 overflow-hidden bg-black/50">
                                                <ImageWithPreview src={gold.imgs[0]} />
                                                <ImageWithPreview src={gold.imgs[1]} />
                                                <ImageWithPreview src={gold.imgs[2]} />
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-2xl font-serif text-white mb-2">Or <span className="text-[#D2B57B]">{gold.k}</span></h3>
                                                <p className="text-sm text-gray-400">{gold.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
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
        </div>
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
