import React from 'react';
import { ShieldCheck, Target, ChevronRight, Gem, Handshake, CheckCircle2, AlertCircle, ArrowUpRight, Diamond, Award, Settings, Layers, DollarSign, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function PartnerTraining() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-sans selection:bg-[#D2B57B] selection:text-black pb-20 overflow-x-hidden relative">
            <div className="fixed top-4 left-4 z-40">
                <LanguageSwitcher className="border-white/20 hover:bg-white/10 bg-black/50 backdrop-blur-md text-[#D2B57B]" />
            </div>

            {/* Arrière plan décoratif */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#D2B57B]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#D2B57B]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto px-6 py-16 relative z-10">
                <header className="text-center mb-16 border-b border-white/10 pb-16">
                    <h2 className="text-[#D2B57B] text-xs md:text-sm uppercase tracking-[0.3em] mb-6 font-semibold inline-block px-5 py-2 border border-[#D2B57B]/30 rounded-full bg-[#D2B57B]/10 shadow-[0_0_20px_rgba(210,181,123,0.2)]">Programme Partenaire</h2>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-br from-white to-[#D2B57B] bg-clip-text text-transparent font-serif leading-tight">La structure Maison Auclaire</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-serif italic mb-8">
                        Découvrez comment évoluer à nos côtés, de vos premières recommandations jusqu'aux ventes de haute joaillerie.
                    </p>
                </header>

                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    
                    {/* INFO GENERALE SUR LES COMMISSIONS */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center gap-6 mb-12">
                        <div className="p-4 bg-[#D2B57B]/10 rounded-full border border-[#D2B57B]/30 shrink-0">
                            <Info className="w-8 h-8 text-[#D2B57B]" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white mb-2">Règle des Commissions</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Les commissions sont toujours calculées sur le <strong className="text-white font-serif">prix de vente total hors taxes</strong>. Elles deviennent <strong className="text-white border-b border-[#D2B57B]">payables dès l'instant où le client a réglé 50%</strong> ou plus de sa facture totale, vous assurant un flux de trésorerie rapide.
                            </p>
                        </div>
                    </div>

                    {/* SECTION 1: AFFILIÉ SIMPLE */}
                    <section className="relative">
                        <h2 className="text-3xl font-serif text-white mb-8 flex items-center gap-4">
                            <span className="text-3xl bg-white/5 p-3 rounded-2xl border border-white/10"><Target className="w-8 h-8 text-[#D2B57B]" /></span> L'Affilié Simple
                        </h2>
                        
                        <div className="bg-black/40 border border-[#D2B57B]/20 rounded-2xl p-8 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D2B57B]/10 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
                            
                            <p className="text-gray-300 mb-8 leading-relaxed">
                                Les affiliés parlent de l’entreprise à leur entourage ou leur audience. Vous recevez un lien d’affiliation sécurisé et un code promotionnel. Ce code offre à votre communauté <strong>un accès prioritaire exclusif</strong> et des prix entre <strong className="text-[#D2B57B]">20% et 30% moins cher</strong> que les prix du site web public.
                            </p>

                            <h3 className="text-[#D2B57B] font-bold text-lg mb-6 uppercase tracking-widest border-b border-white/10 pb-2">Les Paliers d'Évolution</h3>
                            
                            <div className="space-y-4">
                                <TierCard 
                                    level="Lancement" 
                                    sales="Départ" 
                                    reward={<><span className="text-white font-bold">3%</span> de commission de base</>} 
                                />
                                <TierCard 
                                    level="Palier 1" 
                                    sales="5 ventes accomplies" 
                                    reward={<>Prix cost sur pièces personnelles + <span className="text-[#D2B57B]">Bracelet en argent avec diamant 0.5ct</span></>} 
                                    highlight
                                />
                                <TierCard 
                                    level="Palier 2" 
                                    sales="10 ventes accomplies" 
                                    reward={<>Bonus de <span className="text-white font-bold">500$</span> en crédit Auclaire</>} 
                                />
                                <TierCard 
                                    level="Palier 3" 
                                    sales="25 ventes accomplies" 
                                    reward={<>Bonus de <span className="text-white font-bold">1 000$</span> en crédit Auclaire</>} 
                                />
                                <TierCard 
                                    level="Palier 4" 
                                    sales="50 ventes accomplies" 
                                    reward={<>Bonus de <span className="text-white font-bold">2 500$</span> en crédit + Commission de base augmentée à <span className="text-[#D2B57B] font-bold">5%</span></>} 
                                    highlight
                                />
                                <TierCard 
                                    level="Palier Ultime" 
                                    sales="100 ventes accomplies" 
                                    reward={<>Nouveau bonus de <span className="text-white font-bold">2 500$</span> en crédit + Commission de base augmentée à <span className="text-[#D2B57B] font-bold">7%</span></>} 
                                    highlight
                                />
                            </div>

                            <p className="text-xs text-gray-500 italic mt-6">* Note : Il est possible de sauter des niveaux exceptionnellement selon la taille et l'engagement initial de la communauté de l'affilié.</p>
                        </div>
                    </section>

                    {/* SECTION 2: AMBASSADEUR */}
                    <section className="relative mt-20">
                        <h2 className="text-3xl font-serif text-white mb-8 flex items-center gap-4">
                            <span className="text-3xl bg-white/5 p-3 rounded-2xl border border-[#D2B57B]/30"><Handshake className="w-8 h-8 text-[#D2B57B]" /></span> L'Ambassadeur Autonome
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-[#D2B57B]/5 border border-[#D2B57B]/30 rounded-2xl p-8 shadow-lg">
                                <h3 className="text-xl font-serif text-[#D2B57B] mb-4">Formation & Compétences</h3>
                                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                                    Les ambassadeurs possèdent déjà toutes les options de l'affilié, mais en plus, ils peuvent réaliser eux-mêmes des ventes complexes de A à Z. Cela nécessite une <strong className="text-white">formation rigoureuse à l'interne</strong> offerte par la Maison Auclaire.
                                </p>
                                <ul className="space-y-3 text-sm text-gray-400">
                                    <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Gérer sa propre clientèle cible.</li>
                                    <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Accès à la plateforme pour estimer les prix de vente.</li>
                                    <li className="flex gap-3 items-start"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> Pouvoir créer et lancer officiellement des demandes de design.</li>
                                </ul>
                            </div>

                            <div className="bg-black/60 border border-white/10 rounded-2xl p-8 shadow-lg relative overflow-hidden flex flex-col justify-center">
                                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent to-[#D2B57B]/80" />
                                <h3 className="text-xs uppercase tracking-widest text-[#D2B57B] mb-2 font-bold">Rémunération Variable</h3>
                                <h4 className="text-2xl font-serif text-white mb-6">Jusqu'à <span className="text-[#D2B57B] text-4xl">15%</span> total</h4>
                                <p className="text-sm text-gray-400 mb-2">Les ambassadeurs gardent leur rôle d'apporteur d'affaire qui suit les mêmes commissions qu'un affilié (3% initial), mais d'immenses bonus se greffent selon l'autonomie sur le dossier :</p>
                            </div>
                        </div>

                        {/* Modèle de Vente Ambassadeur */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
                                <div className="p-8 hover:bg-white/5 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6">
                                        <Layers className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Vente Partielle</h4>
                                    <div className="text-blue-400 font-serif text-2xl mb-4">+ 10% <span className="text-sm text-gray-500 font-sans tracking-wide">sur la vente totale</span></div>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Si vous avez récolté les besoins intitiaux du client et généré la mise en contact, mais que notre équipe a dû prendre le relais en consultation pour finalement conclure la vente et finaliser le design.
                                    </p>
                                </div>
                                
                                <div className="p-8 hover:bg-[#D2B57B]/5 transition-colors relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-10"><Award className="w-24 h-24 text-[#D2B57B]" /></div>
                                    <div className="w-12 h-12 rounded-full bg-[#D2B57B]/10 border border-[#D2B57B]/30 flex items-center justify-center mb-6 relative z-10">
                                        <Diamond className="w-6 h-6 text-[#D2B57B]" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2 relative z-10">Vente Autonome Totale</h4>
                                    <div className="text-[#D2B57B] font-serif text-2xl mb-4 relative z-10">+ 15% <span className="text-sm text-gray-500 font-sans tracking-wide">sur la vente totale</span></div>
                                    <p className="text-gray-300 text-sm leading-relaxed relative z-10">
                                        Si l'ambassadeur a géré tout le processus de vente de manière autonome avec son propre client (consultation, estimation, demande de design, closing), il touche le plein potentiel.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </section>
                </div>
            </div>
        </div>
    );
}

function TierCard({ level, sales, reward, highlight = false }: { level: string, sales: string, reward: React.ReactNode, highlight?: boolean }) {
    return (
        <div className={`p-4 md:p-5 rounded-xl border flex flex-col md:flex-row md:items-center gap-4 transition-colors ${highlight ? 'bg-[#D2B57B]/10 border-[#D2B57B]/30 hover:border-[#D2B57B]/60' : 'bg-black/30 border-white/10 hover:border-white/30'}`}>
            <div className="md:w-32 shrink-0">
                <span className={`text-xs uppercase tracking-widest font-bold ${highlight ? 'text-[#D2B57B]' : 'text-gray-500'}`}>{level}</span>
                <p className="font-serif text-white mt-1">{sales}</p>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/10"></div>
            <div className="flex-1">
                <p className={`text-sm md:text-base ${highlight ? 'text-gray-200' : 'text-gray-400'}`}>
                    {reward}
                </p>
            </div>
        </div>
    );
}
