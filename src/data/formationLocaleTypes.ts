/** Types for formationPage.* JSON blobs loaded with t(key, { returnObjects: true }) */

export type FormationPhase = {
    title: string;
    subtitle: string;
    objectif: string;
    mindset?: string[];
    questions?: string[];
    hint?: string;
    detection?: string[];
};

export type FormationDiamondCut = {
    name: string;
    subtitle: string;
    desc: string;
    tags: string[];
};
