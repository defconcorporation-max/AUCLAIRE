export type GemstoneCard = { title: string; desc: string; imgs: string[]; tags: string[] };

const FR: GemstoneCard[] = [
    { title: 'Diamant', desc: "La pierre précieuse suprême. Note de 10/10 sur l'échelle de Mohs (la plus dure au monde). Brillance incomparable et durabilité parfaite pour le quotidien.", imgs: ['/images/education/diamond.jpg'], tags: ['Dureté 10', 'Éclat absolu'] },
    { title: 'Saphir', desc: "Le saphir bleu est le plus populaire, mais existe dans toutes les couleurs sauf le rouge. Note de 9/10 sur l'échelle de Mohs. Très robuste et élégant.", imgs: ['/images/education/sapphire.jpg'], tags: ['Dureté 9', 'Royauté'] },
    { title: 'Rubis', desc: "Même famille que le saphir (Corindon) mais de couleur rouge intense due au chrome. Note de 9/10 sur l'échelle de Mohs. Symbole de passion.", imgs: ['/images/education/ruby.jpg'], tags: ['Dureté 9', 'Passion'] },
    { title: 'Émeraude', desc: "Magnifique couleur verte mais plus délicate (7.5 - 8/10 sur Mohs). Elle contient des 'jardins' (inclusions naturelles). Sensible aux chocs violents.", imgs: ['/images/education/emerald.jpg'], tags: ['Dureté 8', 'Délicat'] },
];

const EN: GemstoneCard[] = [
    { title: 'Diamond', desc: 'The ultimate gemstone. 10/10 on the Mohs scale (hardest on Earth). Unmatched brilliance and ideal for everyday wear.', imgs: ['/images/education/diamond.jpg'], tags: ['Hardness 10', 'Maximum sparkle'] },
    { title: 'Sapphire', desc: 'Blue is most popular, but sapphires exist in every color except red. 9/10 Mohs. Very durable and elegant.', imgs: ['/images/education/sapphire.jpg'], tags: ['Hardness 9', 'Royal'] },
    { title: 'Ruby', desc: 'Same family as sapphire (corundum) with intense red from chromium. 9/10 Mohs. Symbol of passion.', imgs: ['/images/education/ruby.jpg'], tags: ['Hardness 9', 'Passion'] },
    { title: 'Emerald', desc: 'Gorgeous green but more delicate (7.5–8 Mohs). Natural “gardens” (inclusions). Sensitive to hard impacts.', imgs: ['/images/education/emerald.jpg'], tags: ['Hardness 8', 'Delicate'] },
];

export function getGemstoneCards(lang: string): GemstoneCard[] {
    return lang.startsWith('en') ? EN : FR;
}
