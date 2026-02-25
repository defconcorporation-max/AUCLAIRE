const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/public/Formation.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add currentExpertiseStep and expertiseSteps
const stateToAdd = `
    const expertiseSteps = [
        { id: 'cuts', title: 'Coupes', emoji: '💎', fullTitle: 'Guide des Coupes (Diamants)' },
        { id: 'settings', title: 'Montures', emoji: '💍', fullTitle: 'Types de Settings (Montures)' },
        { id: 'bandStyle', title: 'Joncs', emoji: '➖', fullTitle: 'Types de Jonc (Band Style)' },
        { id: 'bandSetting', title: 'Sertissages', emoji: '🛡️', fullTitle: 'Types de Sertissage du Jonc' },
        { id: 'prongs', title: 'Griffes', emoji: '🦅', fullTitle: 'Types de Prongs (Griffes)' },
        { id: 'hisHers', title: 'Alliances', emoji: '🎎', fullTitle: 'Bagues His & Hers (Alliances)' },
        { id: 'diamonds4c', title: 'Les 4C', emoji: '🔍', fullTitle: 'Les 4C du Diamant' },
        { id: 'anatomy', title: 'Anatomie', emoji: '💍', fullTitle: 'Anatomie d\\'une Bague' },
        { id: 'metals', title: 'Métaux', emoji: '✨', fullTitle: 'Expertise Métaux & Allergies' },
        { id: 'gold', title: 'Or Jaune', emoji: '⚖️', fullTitle: 'Différence Visuelle Or Jaune' }
    ];
    const [currentExpertiseStep, setCurrentExpertiseStep] = useState(0);
`;
content = content.replace('const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({', stateToAdd + '\n    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({');

// 2. Add stepper navigation to TabsContent
const expertiseTabStart = `<TabsContent value="expertise" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">`;
const newExpertiseTabStart = `<TabsContent value="expertise" className="animate-in fade-in zoom-in-95 duration-500">
                        {/* Stepper Header */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-8 no-scrollbar border-b border-white/5 snap-x">
                            {expertiseSteps.map((step, idx) => (
                                <button 
                                    key={step.id} 
                                    onClick={() => setCurrentExpertiseStep(idx)}
                                    className={\`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border snap-start \${currentExpertiseStep === idx ? 'bg-[#D2B57B] text-black border-[#D2B57B] shadow-[0_0_15px_rgba(210,181,123,0.3)]' : 'bg-black/40 text-gray-400 border-white/5 hover:text-white hover:border-white/20'}\`}>
                                    <span className="mr-2 opacity-80">{step.emoji}</span> {step.title}
                                </button>
                            ))}
                        </div>
                        <div className="min-h-[600px] pb-12">`;
content = content.replace(expertiseTabStart, newExpertiseTabStart);

// 3. Replace each Section with logic
const sectionsPattern = /<section>[\s\S]*?<SectionHeader id="([^"]+)" emoji="([^"]+)" title="([^"]+)" expanded=\{expandedSections.[^}]+\} toggleSection=\{toggleSection\} \/>\s*\{expandedSections.[a-zA-Z0-9_]+ && \(/g;

const stepIds = ['cuts', 'settings', 'bandStyle', 'bandSetting', 'prongs', 'hisHers', 'diamonds4c', 'anatomy', 'metals', 'gold'];

content = content.replace(sectionsPattern, (match, id, emoji, title) => {
    const stepIndex = stepIds.indexOf(id);
    if (stepIndex === -1) return match; // skip if not in our stepper

    return '{currentExpertiseStep === ' + stepIndex + ' && (\n' +
        '                            <section className="animate-in fade-in slide-in-from-right-8 duration-500">\n' +
        '                                <h2 className="text-3xl font-serif text-white mb-8 border-b border-white/5 pb-6 flex items-center gap-4">\n' +
        '                                    <span className="text-4xl bg-white/5 p-3 rounded-2xl border border-white/5">' + emoji + '</span> ' + title + '\n' +
        '                                </h2>';
});

// 4. Fix closing tags for those sections
content = content.replace(/ \n\s*\)}\n\s*<\/section>/g, '\n                            </section>\n                        )}');
content = content.replace(/\s*\)}\n\s*<\/section>/g, '\n                            </section>\n                        )}');

// 5. Add Stepper Footer
const expertiseTabEnd = `                    </TabsContent>

                    {/* ONGLET 3 : QCM OFFICIEL */}`;
const stepperFooter = `                        </div>
                        
                        {/* Stepper Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 mt-4 border-t border-white/10 gap-4">
                            <button 
                                disabled={currentExpertiseStep === 0} 
                                onClick={() => {
                                    setCurrentExpertiseStep(prev => Math.max(0, prev - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3">
                                <ArrowRight className="w-5 h-5 rotate-180" /> Précédent
                            </button>
                            
                            <div className="flex gap-1">
                                {expertiseSteps.map((_, idx) => (
                                    <div key={idx} className={\`w-2 h-2 rounded-full transition-colors duration-300 \${currentExpertiseStep === idx ? 'bg-[#D2B57B]' : currentExpertiseStep > idx ? 'bg-white/30' : 'bg-white/10'}\`} />
                                ))}
                            </div>

                            {currentExpertiseStep < expertiseSteps.length - 1 ? (
                                <button 
                                    onClick={() => {
                                        setCurrentExpertiseStep(prev => Math.min(expertiseSteps.length - 1, prev + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#D2B57B] text-black font-bold hover:bg-[#D2B57B]/90 transition-colors flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(210,181,123,0.3)]">
                                    Suivant <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => {
                                        document.querySelector('[data-state="inactive"][value="qcm"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-500 text-black font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-pulse">
                                    Passer au QCM <CheckCircle2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </TabsContent>

                    {/* ONGLET 3 : QCM OFFICIEL */}`;

content = content.replace(expertiseTabEnd, stepperFooter);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactoring completed successfully.');
