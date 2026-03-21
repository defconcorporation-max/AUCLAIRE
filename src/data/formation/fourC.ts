export type FourCCard = {
    id: string;
    title: string;
    subtitle: string;
    body: string;
    pitchLabel: string;
    pitch: string;
};

const FR: FourCCard[] = [
    {
        id: 'cut',
        title: 'Cut',
        subtitle: '(La Taille)',
        body: 'Le C le plus important. Il détermine la façon dont la lumière interagit avec le diamant (brillance, feu, scintillement). Une taille "Excellent" ou "Ideal" masquera souvent des défauts de pureté ou de couleur.',
        pitchLabel: 'Pitch Vendeur :',
        pitch: '"Peu importe la taille ou la couleur, si la coupe est mauvaise, le diamant paraîtra terne. C\'est ici qu\'on ne fait aucun compromis."',
    },
    {
        id: 'color',
        title: 'Color',
        subtitle: '(La Couleur)',
        body: 'Classée de D (Incolore) à Z (Jaune clair). Pour l\'œil nu, les diamants de la gamme G-H-I paraissent souvent incolores, surtout montés sur de l\'or jaune qui absorbe le ton chaud.',
        pitchLabel: 'Pitch Vendeur :',
        pitch: '"Au-delà de G-H, l\'œil humain ne fait la différence que sous une loupe de gemmologue. Descendre un peu en couleur permet souvent de doubler la taille (Carat) pour le même budget."',
    },
    {
        id: 'clarity',
        title: 'Clarity',
        subtitle: '(La Pureté)',
        body: 'Les inclusions (flaws) sont les empreintes digitales du diamant. L\'objectif est de trouver un diamant "Eye-Clean" (VS1/VS2 ou SI1 bien sélectionné) où les inclusions sont invisibles à l\'œil nu.',
        pitchLabel: 'Pitch Vendeur :',
        pitch: '"Un diamant VVS1 et un diamant VS2 auront exactement le même aspect à 30cm de distance. Seul votre microscope fera la différence."',
    },
    {
        id: 'carat',
        title: 'Carat',
        subtitle: '(Le Poids)',
        body: 'Le Carat représente un poids et non une taille physique. Une coupe Oval ou Emerald d\'1 Carat paraîtra plus grande qu\'une coupe Round d\'1 Carat en surface visible.',
        pitchLabel: 'Pitch Vendeur :',
        pitch: '"Plutôt que de viser le chiffre rond de 1.00 Carat, visez 0.90 ou 0.95. Visuellement identique, mais le prix chute drastiquement sous le seuil psychologique du Carat."',
    },
];

const EN: FourCCard[] = [
    {
        id: 'cut',
        title: 'Cut',
        subtitle: '(Cut grade)',
        body: 'The most important C. It drives how light interacts with the diamond (brilliance, fire, scintillation). An Excellent or Ideal cut often hides clarity or color issues.',
        pitchLabel: 'Sales pitch:',
        pitch: '"No matter size or color, if the cut is poor the diamond looks dull. This is where we never compromise."',
    },
    {
        id: 'color',
        title: 'Color',
        subtitle: '(Color grade)',
        body: 'Graded D (colorless) to Z (light yellow). To the naked eye, G–H–I often face white, especially set in yellow gold which absorbs warm tone.',
        pitchLabel: 'Sales pitch:',
        pitch: '"Beyond G–H the eye only sees differences under a loupe. Dropping slightly in color often doubles carat for the same budget."',
    },
    {
        id: 'clarity',
        title: 'Clarity',
        subtitle: '(Clarity grade)',
        body: 'Inclusions are the diamond’s fingerprints. Aim for “eye-clean” (VS1/VS2 or a well-chosen SI1) where flaws aren’t visible without magnification.',
        pitchLabel: 'Sales pitch:',
        pitch: '"A VVS1 and a VS2 look identical at arm’s length — only a microscope tells them apart."',
    },
    {
        id: 'carat',
        title: 'Carat',
        subtitle: '(Weight)',
        body: 'Carat is weight, not face-up size. A 1 ct oval or emerald often looks larger than a 1 ct round.',
        pitchLabel: 'Sales pitch:',
        pitch: '"Instead of chasing 1.00 ct exactly, consider 0.90–0.95 ct — often identical visually with a big price drop under the psychological 1 ct mark."',
    },
];

export function getFourCCards(lang: string): FourCCard[] {
    return lang.startsWith('en') ? EN : FR;
}
