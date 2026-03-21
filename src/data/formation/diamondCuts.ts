import type { FormationDiamondCut } from '@/data/formationLocaleTypes';

export type DiamondCutRow = FormationDiamondCut & { img: string; isNew?: boolean };

const CUT_IDS = ['round', 'oval', 'princess', 'cushion', 'emerald', 'pear', 'radiant', 'marquise', 'asscher', 'heart'] as const;

const IMG: Record<(typeof CUT_IDS)[number], string> = {
    round: 'https://i.etsystatic.com/16544137/r/il/1ccc36/3168700913/il_1080xN.3168700913_tto5.jpg',
    oval: 'https://i.etsystatic.com/36057419/r/il/3737b5/5387076943/il_fullxfull.5387076943_t3z7.jpg',
    princess: 'https://media.tiffany.com/is/image/Tiffany/EcomItemL2/tiffany-novo-princess-cut-engagement-ring-with-a-pav-set-diamond-band-in-platinum-60767173_996218_ED_M.jpg?%24cropN=0.1%2C0.1%2C0.8%2C0.8&defaultImage=NoImageAvailableInternal&op_usm=1.75%2C1.0%2C6.0',
    cushion: 'https://i.etsystatic.com/28887394/r/il/006bab/5523396783/il_1080xN.5523396783_bick.jpg',
    emerald: 'https://i.etsystatic.com/17551371/r/il/32495a/4580417301/il_fullxfull.4580417301_8s0u.jpg',
    pear: 'https://prouddiamond.com/cdn/shop/files/PearCutPaveRing_E.jpg?v=1700771323&width=1445',
    radiant: '/images/education/cuts/radiant.png',
    marquise: '/images/education/cuts/marquise.png',
    asscher: '/images/education/cuts/asscher.png',
    heart: '/images/education/cuts/heart.png',
};

const FR: Record<(typeof CUT_IDS)[number], FormationDiamondCut> = {
    round: { name: 'Round', subtitle: 'Brillance maximale', desc: 'La coupe ronde maximise la réflexion de la lumière grâce à une géométrie optimisée.', tags: ['Brillance maximale', 'Intemporel'] },
    oval: { name: 'Oval', subtitle: 'Illusion taille', desc: 'Forme allongée augmentant la surface visible du diamant.', tags: ['Effet carat+', 'Doigt allongé'] },
    princess: { name: 'Princess', subtitle: 'Moderne structuré', desc: 'Forme carrée avec brillance importante.', tags: ['Look moderne', 'Structure nette'] },
    cushion: { name: 'Cushion', subtitle: 'Romantique vintage', desc: 'Coins arrondis et style antique.', tags: ['Romantique', 'Douceur visuelle'] },
    emerald: { name: 'Emerald', subtitle: 'Élégance minimaliste', desc: 'Facettes larges créant un effet miroir.', tags: ['Sophistication', 'Chic'] },
    pear: { name: 'Pear', subtitle: 'Original féminin', desc: 'Forme hybride ronde + marquise.', tags: ['Originalité'] },
    radiant: { name: 'Radiant', subtitle: 'Hybride brillant', desc: 'Mélange de la forme Emerald avec les facettes de la coupe Round, offrant un maximum d\'éclat.', tags: ['Pétillant', 'Moderne'] },
    marquise: { name: 'Marquise', subtitle: 'Royale et fine', desc: 'Taille allongée avec deux pointes, créant l\'illusion d\'une pierre plus large sur le doigt.', tags: ['Vintage', 'Allongeant'] },
    asscher: { name: 'Asscher', subtitle: 'Art Déco', desc: 'Coupe carrée avec des steps (marches) très géométriques à la manière de l\'émeraude, mais carrée.', tags: ['Art Déco', 'Élégant'] },
    heart: { name: 'Heart', subtitle: 'Romance absolue', desc: 'Le symbole ultime de l\'amour, diamant très complexe.', tags: ['Romantique', 'Unique'] },
};

const EN: Record<(typeof CUT_IDS)[number], FormationDiamondCut> = {
    round: { name: 'Round', subtitle: 'Maximum brilliance', desc: 'The round cut maximizes light return thanks to optimized geometry.', tags: ['Maximum brilliance', 'Timeless'] },
    oval: { name: 'Oval', subtitle: 'Size illusion', desc: 'Elongated shape that increases the diamond’s visible surface.', tags: ['Carat effect+', 'Elongates the finger'] },
    princess: { name: 'Princess', subtitle: 'Modern & structured', desc: 'Square shape with strong brilliance.', tags: ['Modern look', 'Clean lines'] },
    cushion: { name: 'Cushion', subtitle: 'Romantic vintage', desc: 'Rounded corners and antique feel.', tags: ['Romantic', 'Soft look'] },
    emerald: { name: 'Emerald', subtitle: 'Minimalist elegance', desc: 'Broad facets creating a mirror effect.', tags: ['Sophistication', 'Chic'] },
    pear: { name: 'Pear', subtitle: 'Feminine & original', desc: 'Hybrid of round and marquise.', tags: ['Original'] },
    radiant: { name: 'Radiant', subtitle: 'Brilliant hybrid', desc: 'Combines emerald outline with round-style facets for maximum sparkle.', tags: ['Sparkly', 'Modern'] },
    marquise: { name: 'Marquise', subtitle: 'Regal & slender', desc: 'Elongated cut with two points, creating a larger look on the finger.', tags: ['Vintage', 'Elongating'] },
    asscher: { name: 'Asscher', subtitle: 'Art Deco', desc: 'Square step-cut with strong geometric lines.', tags: ['Art Deco', 'Elegant'] },
    heart: { name: 'Heart', subtitle: 'Ultimate romance', desc: 'The ultimate love symbol — a very complex diamond.', tags: ['Romantic', 'Unique'] },
};

export function getDiamondCutsData(lang: string): DiamondCutRow[] {
    const isEn = lang.startsWith('en');
    const text = isEn ? EN : FR;
    return CUT_IDS.map((id) => ({
        ...text[id],
        img: IMG[id],
        isNew: id === 'radiant',
    }));
}
