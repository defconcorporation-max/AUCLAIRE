export type GoldRow = { k: string; desc: string; imgs: string[] };

const FR: GoldRow[] = [
    { k: '10K', desc: 'Jaune plus pâle, durable, très économique', imgs: ['/images/education/metals/gold_10k.png'] },
    { k: '14K', desc: 'Jaune équilibré, standard luxe nord-américain', imgs: ['/images/education/metals/gold_14k.png'] },
    { k: '18K', desc: 'Jaune profond, saturation élevée, prestige européen', imgs: ['/images/education/metals/gold_18k.png'] },
];

const EN: GoldRow[] = [
    { k: '10K', desc: 'Paler yellow, durable, most economical', imgs: ['/images/education/metals/gold_10k.png'] },
    { k: '14K', desc: 'Balanced yellow — North American luxury standard', imgs: ['/images/education/metals/gold_14k.png'] },
    { k: '18K', desc: 'Deep yellow, rich saturation — European prestige', imgs: ['/images/education/metals/gold_18k.png'] },
];

export function getGoldKaratRows(lang: string): GoldRow[] {
    return lang.startsWith('en') ? EN : FR;
}
