export type MetalPanel = {
    heading: string;
    pros: string[];
    cons: string[];
    pitch?: string;
    recommendationTitle?: string;
    recommendationBody?: string;
};

const FR: Record<string, MetalPanel> = {
    platine: {
        heading: '⬜ Platine (Pt950)',
        pros: ['Naturellement blanc', 'Hypoallergénique total', 'Extrêmement dense et solide', 'Ne nécessite aucun rhodiage'],
        cons: ['Prix plus élevé', '"Patine" gris mat avec le temps', 'Plus lourd sur le doigt'],
        pitch: '"Le platine est le métal le plus noble et le plus sécuritaire pour les peaux sensibles. C\'est le choix d\'excellence."',
    },
    'or-blanc': {
        heading: '🤍 Or Blanc (14K / 18K)',
        pros: ['Look moderne et brillant', 'Plus abordable que le platine', 'Très populaire en Amérique du Nord'],
        cons: ['Re-rhodiage tous les 1-2 ans', 'Or jaune réapparaît avec le temps', 'Peut contenir du nickel (allergies)'],
        pitch: '"L\'or blanc offre cet éclat miroir grâce au rhodium. C\'est notre option la plus populaire pour un look contemporain."',
    },
    'or-jaune': {
        heading: '💛 Or Jaune (10K / 14K / 18K)',
        pros: ['Classique intemporel', 'Hypoallergénique (18K)', 'Aucun entretien spécial requis', 'Absorbe le ton chaud du diamant'],
        cons: ['10K plus pâle (moins de prestige)', 'Se raye avec le temps'],
        pitch: '"L\'or jaune 18K offre une saturation riche et une teinte chaude qui sublime les diamants de couleur G-H. C\'est le prestige européen."',
    },
    'or-rose': {
        heading: '🩷 Or Rose',
        pros: ['Look romantique et tendance', 'Alliage robuste (cuivre)', 'Couleur chaude unique'],
        cons: ['Léger risque d\'allergie au cuivre', 'Moins traditionnel'],
        pitch: '"L\'or rose est le métal le plus en vogue. Il apporte une douceur romantique qui attire les personnalités modernes et audacieuses."',
    },
    argent: {
        heading: '🩶 Argent Sterling 925',
        pros: ['Très abordable', 'Éclat blanc brillant'],
        cons: ['S\'oxyde et noircit', 'Très malléable, se raye facilement', 'Déconseillé pour fiançailles'],
        recommendationTitle: '🚫 Recommandation',
        recommendationBody: 'Déconseillé pour une bague de fiançailles portée au quotidien. Réservé aux bijoux fantaisie.',
    },
};

const EN: Record<string, MetalPanel> = {
    platine: {
        heading: '⬜ Platinum (Pt950)',
        pros: ['Naturally white', 'Fully hypoallergenic', 'Very dense and strong', 'No rhodium plating needed'],
        cons: ['Higher price', 'Develops a soft gray patina over time', 'Heavier on the finger'],
        pitch: '"Platinum is the noblest and safest metal for sensitive skin — the excellence choice."',
    },
    'or-blanc': {
        heading: '🤍 White gold (14K / 18K)',
        pros: ['Modern bright look', 'More affordable than platinum', 'Very popular in North America'],
        cons: ['Re-rhodium every 1–2 years', 'Yellow gold can show through over time', 'May contain nickel (allergies)'],
        pitch: '"White gold gives that mirror shine thanks to rhodium — our top pick for a contemporary look."',
    },
    'or-jaune': {
        heading: '💛 Yellow gold (10K / 14K / 18K)',
        pros: ['Timeless classic', 'Hypoallergenic at 18K', 'No special upkeep', 'Warm tone flatters many diamonds'],
        cons: ['10K looks paler (less prestige)', 'Scratches over time'],
        pitch: '"18K yellow gold has rich saturation and warmth that flatters G–H diamonds — European prestige."',
    },
    'or-rose': {
        heading: '🩷 Rose gold',
        pros: ['Romantic on-trend look', 'Strong alloy (copper)', 'Unique warm color'],
        cons: ['Slight copper allergy risk for a few clients', 'Less traditional'],
        pitch: '"Rose gold is trending — soft romance for modern, bold personalities."',
    },
    argent: {
        heading: '🩶 Sterling silver 925',
        pros: ['Very affordable', 'Bright white luster'],
        cons: ['Tarnishes', 'Soft, scratches easily', 'Not ideal for engagement rings'],
        recommendationTitle: '🚫 Recommendation',
        recommendationBody: 'Not recommended for a daily-wear engagement ring — better for fashion jewellery.',
    },
};

export function getMetalPanel(lang: string, id: string): MetalPanel {
    const map = lang.startsWith('en') ? EN : FR;
    return map[id] ?? FR.platine;
}

export const METAL_SELECTOR = [
    { id: 'platine', labelFr: 'Platine', labelEn: 'Platinum', emoji: '⬜', color: 'from-gray-300 to-gray-500' },
    { id: 'or-blanc', labelFr: 'Or Blanc', labelEn: 'White gold', emoji: '🤍', color: 'from-gray-200 to-white' },
    { id: 'or-jaune', labelFr: 'Or Jaune', labelEn: 'Yellow gold', emoji: '💛', color: 'from-yellow-400 to-amber-500' },
    { id: 'or-rose', labelFr: 'Or Rose', labelEn: 'Rose gold', emoji: '🩷', color: 'from-pink-300 to-rose-500' },
    { id: 'argent', labelFr: 'Argent 925', labelEn: 'Silver 925', emoji: '🩶', color: 'from-slate-300 to-slate-500' },
] as const;

export function metalLabel(lang: string, id: string): string {
    const m = METAL_SELECTOR.find((x) => x.id === id);
    if (!m) return id;
    return lang.startsWith('en') ? m.labelEn : m.labelFr;
}
