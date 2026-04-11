import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle2, 
    ArrowLeft,
    Instagram,
    Globe,
    ExternalLink
} from 'lucide-react';

export default function ThankYou() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] relative flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/assets/images/workshop-bg.png" 
                    alt="Workshop Background" 
                    className="w-full h-full object-cover opacity-20 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#D2B57B]/10 border border-[#D2B57B]/20 mb-4">
                    <CheckCircle2 className="w-10 h-10 text-[#D2B57B]" />
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">
                        Merci de votre confiance.
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-lg mx-auto italic">
                        Votre demande a été transmise à nos experts. Nous reviendrons vers vous sous 24 à 48 heures pour initier la création de votre pièce unique.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                    <Button 
                        onClick={() => window.location.href = 'https://maisonauclaire.com'} 
                        className="w-full sm:w-auto px-8 h-14 bg-[#D2B57B] hover:bg-[#E5C98A] text-black font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(210,181,123,0.2)]"
                    >
                        <Globe className="w-4 h-4 mr-2" /> Retour au site
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => window.open('https://instagram.com/maisonauclaire', '_blank')}
                        className="w-full sm:w-auto px-8 h-14 border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest rounded-xl transition-all"
                    >
                        <Instagram className="w-4 h-4 mr-2" /> Suivre sur Instagram
                    </Button>
                </div>

                <div className="pt-12 border-t border-white/5">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] font-bold mb-4">
                        Élégance & Excellence
                    </p>
                    <div className="flex items-center justify-center gap-6 text-zinc-500">
                        <span className="text-xs">Designé à Montréal</span>
                        <div className="w-1 h-1 rounded-full bg-[#D2B57B]/30" />
                        <span className="text-xs">Artisanat de Luxe</span>
                    </div>
                </div>
            </div>

            {/* Subtle Overlay Branding */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
                <span className="text-4xl font-serif font-bold text-[#D2B57B] tracking-[0.5em]">AUCLAIRE</span>
            </div>
        </div>
    );
}
