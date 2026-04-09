import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Facebook, 
  TrendingUp, 
  Users, 
  Video, 
  Star, 
  Target, 
  LucideIcon,
  Gift,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Section {
  id: string;
  title: string;
  duration: string;
  icon: LucideIcon;
  emoji: string;
  tasks: string[];
  color: string;
}

export default function MarketingFormation() {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>(['part1']);

  const sections: Section[] = [
    {
      id: 'part1',
      title: 'Partie 1 : Heat up / Check up Meta & TikTok',
      duration: '1H',
      emoji: '🔥',
      icon: Facebook,
      color: 'text-blue-500',
      tasks: [
        'Facebook Invites : Aller dans Meta Business Suite et descendre tout en bas dans les invitations et inviter toutes les dernières personnes qui ont fait une interaction.',
        'Répondre aux commentaires Facebook (dans la mesure du possible).',
        'Vérifier notre avancement dans les Meta Challenge (nombre de publications, progression, etc.).',
        'Heat up Facebook / Instagram : Scroller et interagir avec la communauté et les influenceurs suivis par notre clientèle.',
        'TikTok : Commentaires et Heat up.'
      ]
    },
    {
      id: 'part2',
      title: 'Partie 2 : Other Social Checkup',
      duration: '30min',
      emoji: '📊',
      icon: TrendingUp,
      color: 'text-emerald-500',
      tasks: [
        'Faire un tour de tous les autres réseaux sociaux.',
        'Vérifier les interactions et les analytics pour identifier les plateformes qui sortent du lot.',
        'Identifier les tendances à pousser plus que les autres.'
      ]
    },
    {
      id: 'part3',
      title: 'Partie 3 : Outreach Influenceur / Affiliate',
      duration: '1H',
      emoji: '🤝',
      icon: Users,
      color: 'text-pink-500',
      tasks: [
        'Chercher de nouveaux influenceurs pertinents pour la marque.',
        'Contacter les influenceurs pour des collaborations.',
        'Chercher des partenaires "affiliate" locaux (salons de manucure, barbiers, etc.).'
      ]
    },
    {
      id: 'part4',
      title: 'Partie 4 : Marketing / Promo / Opportunités',
      duration: '1H - 1H30',
      emoji: '🎁',
      icon: Gift,
      color: 'text-amber-500',
      tasks: [
        'Créer des codes promos ou offres spécifiques pour les affiliés.',
        'Rechercher les dates clés (Fête des mères, Fête des pères, etc.) et préparer les promos.',
        'Contacter des photographes pour organiser les futurs contenus.'
      ]
    },
    {
      id: 'part5',
      title: 'Partie 5 : Content Creation',
      duration: '2H',
      emoji: '🎬',
      icon: Video,
      color: 'text-purple-500',
      tasks: [
        'Organisation des shoots (lieux, modèles, bijoux).',
        'Montage vidéo (Reels, TikTok).',
        'Recherche de hooks et analyse de vidéos virales pour inspiration.'
      ]
    },
    {
      id: 'part6',
      title: 'Partie 6 : Review & Réputation',
      duration: '30min',
      emoji: '⭐',
      icon: Star,
      color: 'text-luxury-gold',
      tasks: [
        'Répondre aux avis clients (Google, Facebook, Instagram).',
        'Chercher de nouveaux clients à qui demander un avis pour renforcer la preuve sociale.'
      ]
    }
  ];

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20 selection:bg-luxury-gold selection:text-black">
      {/* Header Background Effect */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-luxury-gold/10 to-transparent pointer-events-none -z-10" />
      
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/resources')}
          className="mb-8 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour Ressources
        </Button>

        <header className="mb-16 text-center md:text-left">
          <Badge className="mb-4 bg-luxury-gold/20 text-luxury-gold border-luxury-gold/30 px-4 py-1 text-xs tracking-widest uppercase">
            Formation Interne
          </Badge>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
            Marketing Manager <span className="text-luxury-gold">Training</span>
          </h1>
          <p className="text-gray-400 text-lg font-serif italic">
            Guide opérationnel et workflow quotidien pour la stratégie marketing de Maison Auclaire.
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <div 
              key={section.id}
              className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-luxury-gold/30 transition-all duration-500"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-luxury-gold/50 transition-colors`}>
                    <section.icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{section.emoji}</span>
                      <h3 className="text-xl font-serif font-bold group-hover:text-luxury-gold transition-colors">
                        {section.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-gray-500">
                        {section.duration}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  {expandedSections.includes(section.id) ? (
                    <ChevronDown className="w-6 h-6 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedSections.includes(section.id) && (
                <div className="px-6 pb-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="pl-16 space-y-4">
                    {section.tasks.map((task, tidx) => (
                      <div key={tidx} className="flex gap-4 group/item">
                        <CheckCircle2 className="w-5 h-5 text-luxury-gold opacity-30 group-hover/item:opacity-100 transition-opacity shrink-0 mt-0.5" />
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {task}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-luxury-gold/10 to-transparent border border-luxury-gold/20 text-center">
            <Target className="w-10 h-10 text-luxury-gold mx-auto mb-4" />
            <h4 className="text-xl font-serif font-bold text-white mb-2">Objectif Excellence</h4>
            <p className="text-sm text-gray-400 max-w-lg mx-auto italic">
              "Le marketing n'est pas seulement une question de visibilité, c'est l'art de raconter l'histoire de Maison Auclaire et d'élever chaque interaction client."
            </p>
        </div>

        <footer className="mt-16 text-center text-gray-600 text-[10px] uppercase tracking-[0.3em]">
          Confidentiel • Maison Auclaire Inc • {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
