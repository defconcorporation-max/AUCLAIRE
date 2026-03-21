export type AnatomyBlock = { title: string; body: string };

const FR: AnatomyBlock[] = [
    { title: 'La Tête (Center Setting)', body: 'La partie métallique qui maintient la pierre centrale. Elle impacte fortement la hauteur de la bague (High-profile vs Low-profile).' },
    { title: 'Les Griffes (Prongs)', body: 'Généralement au nombre de 4 ou 6. 4 griffes montrent plus de la pierre mais sont plus carrées visuellement. 6 griffes protègent mieux et gardent l\'aspect rond.' },
    { title: 'Le Pont (Gallery & Bridge)', body: 'L\'architecture sous la pierre centrale. C\'est ici qu\'on ajoute souvent un Hidden Halo (Halo caché) pour une touche de brillance latérale discrète.' },
    { title: 'Le Corps de Bague (Shank / Band)', body: 'L\'anneau lui-même. Largeur recommandée : de 1,8mm à 2,2mm pour la solidité et l\'esthétique finale.' },
];

const EN: AnatomyBlock[] = [
    { title: 'Head (center setting)', body: 'The metal structure holding the center stone. It strongly affects ring height (high vs low profile).' },
    { title: 'Prongs', body: 'Usually 4 or 6. Four prongs show more diamond but look squarer; six prongs protect better and keep a rounder look.' },
    { title: 'Gallery & bridge', body: 'The architecture under the center stone — often where a hidden halo adds discreet side sparkle.' },
    { title: 'Shank / band', body: 'The ring itself. Recommended width: about 1.8–2.2 mm for strength and aesthetics.' },
];

export function getAnatomyBlocks(lang: string): AnatomyBlock[] {
    return lang.startsWith('en') ? EN : FR;
}
