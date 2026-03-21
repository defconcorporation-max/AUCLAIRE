/** Processus tab: consultation step + mindset step — FR/EN copy */

export type ConsultationCard = { title: string; bullets: string[] };

export type QuizOption = { id: number; text: string; isCorrect: boolean; feedback: string };

export type ConsultationQuiz = {
    title: string;
    scenario: string;
    options: QuizOption[];
};

export type DocumentGoalsBlock = {
    title: string;
    intro: string;
    goals: string[];
};

export type GoldenRuleLine = { emoji: string; segments: { text: string; accent?: boolean }[] };

export type GoldenRulesBlock = {
    title: string;
    rules: GoldenRuleLine[];
};

const CONSULTATION_CARDS_FR: ConsultationCard[] = [
    { title: 'Rassurer sur le budget', bullets: ['Normaliser le budget du client sans jugement.', 'Expliquer les compromis intelligents pour maximiser le rendu.'] },
    { title: 'Identifier le style de la partenaire', bullets: ['Analyser ses bijoux actuels et son style vestimentaire.', 'Comprendre sa personnalité et son lifestyle (sport, travail manuel).'] },
    { title: 'Vendre l\'émotion', bullets: ['Aider le client à se projeter dans le moment de la demande.', 'Mettre en valeur la symbolique de l\'engagement (héritage émotionnel).'] },
    { title: 'Guider vers la bague idéale', bullets: ['Comprendre la partenaire et le budget pour identifier les priorités.', 'Éduquer, proposer des options, rassurer et valider jusqu\'au closing.'] },
];

const CONSULTATION_CARDS_EN: ConsultationCard[] = [
    { title: 'Reassure on budget', bullets: ['Normalize the client’s budget without judgement.', 'Explain smart trade-offs to maximize the look.'] },
    { title: 'Identify her style', bullets: ['Look at her current jewellery and wardrobe.', 'Understand personality and lifestyle (sports, manual work).'] },
    { title: 'Sell the emotion', bullets: ['Help the client picture the proposal moment.', 'Highlight the symbolism of the commitment.'] },
    { title: 'Guide to the ideal ring', bullets: ['Understand partner and budget to set priorities.', 'Educate, offer options, reassure and validate through the close.'] },
];

const CONSULTATION_QUIZ_FR: ConsultationQuiz = {
    title: 'Test Express : Scénario Client',
    scenario: '"Bonjour, je cherche une bague pour ma conjointe. Elle est infirmière, très active et sportive, mais elle adore les gros diamants qui brillent de mille feux. Quel style de bague devrais-je privilégier ?"',
    options: [
        { id: 1, text: 'Un gros diamant rond monté haut sur un solitaire fin pour maximiser la brillance.', isCorrect: false, feedback: '❌ Mauvais choix : Monté haut, le diamant va s\'accrocher partout pendant son travail (risque de casse ou de gêne avec les gants).' },
        { id: 2, text: 'Un diamant taille Princesse avec des griffes très fines pour dégager la pierre.', isCorrect: false, feedback: '❌ Risqué : Les coins pointus de la taille Princesse sont très fragiles pour une personne active ou manuelle.' },
        { id: 3, text: 'Un diamant rond brillant, mais en serti clos (bezel) ou serti bas pour la sécuriser.', isCorrect: true, feedback: '✅ Excellent ! Le serti clos ou bas protège la pierre des chocs tout en permettant à la coupe ronde d\'exprimer toute sa brillance.' },
    ],
};

const CONSULTATION_QUIZ_EN: ConsultationQuiz = {
    title: 'Quick test: client scenario',
    scenario: '"Hi, I’m looking for a ring for my partner. She’s a nurse, very active and sporty, but she loves big sparkly diamonds. What style should I prioritize?"',
    options: [
        { id: 1, text: 'A large round diamond set high on a thin solitaire to maximize brilliance.', isCorrect: false, feedback: '❌ Poor choice: a high setting will snag during work (risk of damage or gloves catching).' },
        { id: 2, text: 'A princess cut with very fine prongs to expose the stone.', isCorrect: false, feedback: '❌ Risky: princess corners are fragile for an active, hands-on lifestyle.' },
        { id: 3, text: 'A round brilliant in a bezel or low setting for protection.', isCorrect: true, feedback: '✅ Great! Bezel or low settings protect the stone while round brilliance still shines.' },
    ],
};

const DOC_GOALS_FR: DocumentGoalsBlock = {
    title: 'Objectifs du Document',
    intro: 'Après cette formation, le closer doit être capable de :',
    goals: [
        'Reconnaître toutes les coupes',
        'Associer coupe à personnalité cliente',
        'Expliquer or & karatage visuellement',
        'Rassurer sur le budget',
        'Guider la consultation de bout en bout',
        'Agir comme consultant bague idéale',
    ],
};

const DOC_GOALS_EN: DocumentGoalsBlock = {
    title: 'Training outcomes',
    intro: 'After this training, the closer should be able to:',
    goals: [
        'Recognize all major cuts',
        'Match cut to client personality',
        'Explain gold & karat visually',
        'Reassure on budget',
        'Run the full consultation end-to-end',
        'Act as an ideal-ring consultant',
    ],
};

const GOLDEN_FR: GoldenRulesBlock = {
    title: 'Règles d\'Or Auclaire',
    rules: [
        { emoji: '⚖️', segments: [{ text: 'Toujours poser ' }, { text: '1 question émotionnelle', accent: true }, { text: ' pour ' }, { text: '1 question technique', accent: true }] },
        { emoji: '🌟', segments: [{ text: 'Toujours ' }, { text: 'sur-servir le client', accent: true }, { text: ' avec une attention au détail extrême' }] },
        { emoji: '✅', segments: [{ text: 'Toujours ' }, { text: 'valider la compréhension', accent: true }, { text: ' à chaque étape cruciale' }] },
        { emoji: '🛡️', segments: [{ text: 'Toujours ' }, { text: 'rassurer et soutenir', accent: true }, { text: ', l\'achat diamantaire crée de l\'anxiété' }] },
        { emoji: '🧭', segments: [{ text: 'Toujours ' }, { text: 'guider', accent: true }, { text: ' — vous êtes le médecin, il est le patient' }] },
    ],
};

const GOLDEN_EN: GoldenRulesBlock = {
    title: 'Auclaire golden rules',
    rules: [
        { emoji: '⚖️', segments: [{ text: 'Always ask ' }, { text: '1 emotional question', accent: true }, { text: ' for ' }, { text: '1 technical question', accent: true }] },
        { emoji: '🌟', segments: [{ text: 'Always ' }, { text: 'over-deliver', accent: true }, { text: ' with extreme attention to detail' }] },
        { emoji: '✅', segments: [{ text: 'Always ' }, { text: 'check understanding', accent: true }, { text: ' at every critical step' }] },
        { emoji: '🛡️', segments: [{ text: 'Always ' }, { text: 'reassure and support', accent: true }, { text: ' — diamond purchases create anxiety' }] },
        { emoji: '🧭', segments: [{ text: 'Always ' }, { text: 'guide', accent: true }, { text: ' — you are the doctor, they are the patient' }] },
    ],
};

export function getProcessusConsultation(lang: string) {
    const isEn = lang.startsWith('en');
    return {
        sectionTitle: isEn ? 'Diagnosis & patient consultation' : 'Diagnostic & Consultation Patient',
        cards: isEn ? CONSULTATION_CARDS_EN : CONSULTATION_CARDS_FR,
        quiz: isEn ? CONSULTATION_QUIZ_EN : CONSULTATION_QUIZ_FR,
    };
}

export function getDocumentGoals(lang: string): DocumentGoalsBlock {
    return lang.startsWith('en') ? DOC_GOALS_EN : DOC_GOALS_FR;
}

export function getGoldenRules(lang: string): GoldenRulesBlock {
    return lang.startsWith('en') ? GOLDEN_EN : GOLDEN_FR;
}
