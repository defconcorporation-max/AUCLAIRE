import type { QuizOption } from './processusExtras';

export type SectionQuiz = { title: string; prompt: string; options: QuizOption[] };

const GEM_FR: SectionQuiz = {
    title: '🧠 Quelle pierre recommander ?',
    prompt: 'Un client veut offrir une bague avec une pierre de couleur. Sa partenaire est infirmière et travaille avec ses mains. Que recommandez-vous ?',
    options: [
        { id: 1, text: 'Émeraude — la plus jolie des pierres vertes', isCorrect: false, feedback: '❌ L\'Émeraude (7.5-8 Mohs) est trop fragile pour un usage quotidien actif.' },
        { id: 2, text: 'Saphir — dureté 9/10, disponible en plusieurs couleurs', isCorrect: true, feedback: '✅ Le Saphir (dureté 9/10) est le choix expert : résistant et disponible en bleu, rose, jaune...' },
        { id: 3, text: 'Diamant coloré de synthèse', isCorrect: false, feedback: '❌ Le client a demandé une pierre de couleur naturelle, pas un diamant de synthèse.' },
    ],
};

const GEM_EN: SectionQuiz = {
    title: '🧠 Which stone to recommend?',
    prompt: 'A client wants a colored stone. His partner is a nurse and works with her hands. What do you recommend?',
    options: [
        { id: 1, text: 'Emerald — the prettiest green stone', isCorrect: false, feedback: '❌ Emerald (7.5–8 Mohs) is too fragile for active daily wear.' },
        { id: 2, text: 'Sapphire — 9/10 hardness, many colors', isCorrect: true, feedback: '✅ Sapphire (9/10) is the expert pick: durable, available in blue, pink, yellow…' },
        { id: 3, text: 'Lab-grown colored diamond', isCorrect: false, feedback: '❌ The client asked for a natural colored stone, not lab diamond.' },
    ],
};

const SET_FR: SectionQuiz = {
    title: '🧠 Quel setting recommander ?',
    prompt: 'Un client avec un budget serré veut que la bague paraisse la plus grosse possible. Quel setting ?',
    options: [
        { id: 1, text: 'Three-Stone — trois pierres c\'est plus gros', isCorrect: false, feedback: '❌ Le Three-Stone divise le budget et ne maximise pas l\'apparence d\'une seule pierre.' },
        { id: 2, text: 'Halo — couronne de diamants agrandit la pierre', isCorrect: true, feedback: '✅ Le Halo maximise l\'impact visuel. Un 0.8ct en Halo rivalise avec un 1.2ct solitaire.' },
        { id: 3, text: 'Solitaire — classique et gros impact', isCorrect: false, feedback: '❌ Le Solitaire montre la pierre telle quelle. Avec un petit budget, pas d\'illusion d\'optique.' },
    ],
};

const SET_EN: SectionQuiz = {
    title: '🧠 Which setting?',
    prompt: 'A tight budget client wants the ring to look as big as possible. Which setting?',
    options: [
        { id: 1, text: 'Three-stone — three stones looks bigger', isCorrect: false, feedback: '❌ Three-stone splits the budget and doesn’t maximize one center stone.' },
        { id: 2, text: 'Halo — diamond halo enlarges the center', isCorrect: true, feedback: '✅ Halo maximizes visual impact. 0.8 ct in halo can rival 1.2 ct solitaire.' },
        { id: 3, text: 'Solitaire — classic big impact', isCorrect: false, feedback: '❌ Solitaire shows the stone as-is. On a small budget, no optical boost.' },
    ],
};

const ALL_FR: SectionQuiz = {
    title: '🧠 Stratégie de vente croisée',
    prompt: 'À quel moment idéal proposez-vous les alliances au client ?',
    options: [
        { id: 1, text: 'Dès le début, avant même la bague de fiançailles', isCorrect: false, feedback: '❌ Trop tôt ! Le client sera submergé et risque de repousser la décision.' },
        { id: 2, text: 'Après le closing de la bague, quand le client est engagé', isCorrect: true, feedback: '✅ L\'euphorie du closing est le moment parfait. Le client est déjà mentalement engagé et ouvert à compléter le set.' },
        { id: 3, text: 'Jamais — les alliances se vendent séparément plus tard', isCorrect: false, feedback: '❌ Opportunité manquée ! La plupart des couples achètent rarement les alliances eux-mêmes sans qu\'on leur propose.' },
    ],
};

const ALL_EN: SectionQuiz = {
    title: '🧠 Cross-sell strategy',
    prompt: 'When is the best time to offer wedding bands?',
    options: [
        { id: 1, text: 'Up front, before the engagement ring', isCorrect: false, feedback: '❌ Too early — the client may feel overwhelmed.' },
        { id: 2, text: 'After the engagement ring close, when they’re committed', isCorrect: true, feedback: '✅ Post-close euphoria is ideal — they’re mentally committed to completing the set.' },
        { id: 3, text: 'Never — bands sell separately later', isCorrect: false, feedback: '❌ Missed opportunity — couples rarely buy bands unprompted.' },
    ],
};

const FOUR_FR: SectionQuiz = {
    title: '🧠 Challenge Les 4C',
    prompt: 'Client budget 5 000$ veut le plus gros diamant possible avec max de brillance. Votre stratégie ?',
    options: [
        { id: 1, text: 'Gros Carat (1.5ct) quitte à réduire le Cut', isCorrect: false, feedback: '❌ Jamais sacrifier le Cut ! Un gros diamant mal taillé paraîtra terne.' },
        { id: 2, text: 'Excellent Cut, Color H, Clarity SI1, Carat 0.90ct', isCorrect: true, feedback: '✅ Parfait ! Excellent Cut = brillance max. H quasi-incolore, SI1 eye-clean. 0.90ct évite le palier de prix du 1ct.' },
        { id: 3, text: 'Diamant IF/D même si 0.5ct', isCorrect: false, feedback: '❌ Un D/IF de 0.5ct sera microscopique. La pureté extrême est invisible à l\'œil nu.' },
    ],
};

const FOUR_EN: SectionQuiz = {
    title: '🧠 4C challenge',
    prompt: 'A $5,000 client wants the largest diamond possible with maximum brilliance. Your strategy?',
    options: [
        { id: 1, text: 'Big carat (1.5 ct) even if cut suffers', isCorrect: false, feedback: '❌ Never sacrifice cut — a large dull diamond looks lifeless.' },
        { id: 2, text: 'Excellent cut, H color, SI1 clarity, 0.90 ct', isCorrect: true, feedback: '✅ Perfect: excellent cut = max sparkle; H faces white; SI1 eye-clean; 0.90 avoids 1 ct price jump.' },
        { id: 3, text: 'D/IF even if only 0.5 ct', isCorrect: false, feedback: '❌ D/IF at 0.5 ct looks tiny; extreme clarity isn’t visible to the naked eye.' },
    ],
};

const METAL_FR: SectionQuiz = {
    title: 'Quiz Express : Lequel choisir ?',
    prompt: '',
    options: [
        { id: 1, text: 'Or Blanc 14K — c\'est le plus populaire et le plus brillant', isCorrect: false, feedback: '❌ Attention ! L\'Or Blanc 14K contient souvent du nickel qui peut provoquer des réactions allergiques. C\'est un piège fréquent.' },
        { id: 2, text: 'Platine (Pt950) — naturellement blanc et hypoallergénique', isCorrect: true, feedback: '✅ Excellent ! Le Platine est le choix parfait : naturellement blanc (pas de rhodiage nécessaire) ET hypoallergénique. C\'est la réponse d\'un expert.' },
        { id: 3, text: 'Argent Sterling 925 — abordable et blanc', isCorrect: false, feedback: '❌ L\'Argent est trop fragile pour une bague de fiançailles quotidienne. Il s\'oxyde et se raye facilement. Jamais recommandé pour cet usage.' },
    ],
};

const METAL_EN: SectionQuiz = {
    title: 'Quick quiz: which one?',
    prompt: '',
    options: [
        { id: 1, text: '14K white gold — most popular and brightest', isCorrect: false, feedback: '❌ 14K white gold often contains nickel — a common allergy trap.' },
        { id: 2, text: 'Platinum (Pt950) — naturally white and hypoallergenic', isCorrect: true, feedback: '✅ Platinum is ideal: naturally white (no rhodium) and hypoallergenic — expert answer.' },
        { id: 3, text: 'Sterling silver 925 — affordable and white', isCorrect: false, feedback: '❌ Silver is too soft for daily engagement wear; it tarnishes and scratches.' },
    ],
};

export function getGemstonesQuiz(lang: string): SectionQuiz {
    return lang.startsWith('en') ? GEM_EN : GEM_FR;
}
export function getSettingsQuiz(lang: string): SectionQuiz {
    return lang.startsWith('en') ? SET_EN : SET_FR;
}
export function getAlliancesQuiz(lang: string): SectionQuiz {
    return lang.startsWith('en') ? ALL_EN : ALL_FR;
}
export function getFourCQuiz(lang: string): SectionQuiz {
    return lang.startsWith('en') ? FOUR_EN : FOUR_FR;
}
export function getMetalQuiz(lang: string): SectionQuiz {
    return lang.startsWith('en') ? METAL_EN : METAL_FR;
}
