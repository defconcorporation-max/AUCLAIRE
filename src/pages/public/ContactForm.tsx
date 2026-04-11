import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiLeads } from '@/services/apiLeads';
import { JEWELRY_TYPES } from '@/services/apiProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    Loader2, 
    Send, 
    MessageCircle, 
    User, 
    Mail, 
    Phone, 
    Gem, 
    DollarSign,
    ArrowRight,
    Star
} from 'lucide-react';

export default function ContactForm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const affId = searchParams.get('aff');
    const affSrc = searchParams.get('src') || 'direct';
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        jewelryType: '',
        budget: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const notes = `Type: ${formData.jewelryType}\nBudget Target: ${formData.budget}\n\nMessage: ${formData.message}`;
            
            await apiLeads.create({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                status: 'new',
                source: 'website',
                notes: notes,
                affiliate_id: affId,
                affiliate_source: affSrc,
                value: parseFloat(formData.budget) || 0
            });
            
            navigate('/thank-you');
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] relative flex items-center justify-center p-4 md:p-8 font-sans overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/assets/images/workshop-bg.png" 
                    alt="Workshop Background" 
                    className="w-full h-full object-cover opacity-30 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-[#D2B57B]/10" />
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-10 right-10 w-64 h-64 bg-[#D2B57B]/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#D2B57B]/5 rounded-full blur-3xl" />

            {/* Form Card */}
            <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-5 gap-0 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in fade-in zoom-in duration-700">
                
                {/* Brand Side */}
                <div className="md:col-span-2 bg-[#D2B57B] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent scale-150" />
                    </div>
                    
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-black tracking-tighter leading-none mb-4">
                            AUCLAIRE
                        </h1>
                        <p className="text-black/60 text-xs uppercase tracking-[0.3em] font-semibold mb-12">
                            Maison de Joaillerie
                        </p>
                        
                        <div className="space-y-8">
                            <div className="flex items-start gap-4 text-black">
                                <Star className="w-5 h-5 mt-1 fill-black/20" />
                                <div>
                                    <h3 className="font-serif font-bold text-lg leading-tight">Expertise Sur-Mesure</h3>
                                    <p className="text-sm text-black/70 italic">Transformez votre vision en une pièce d'exception.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 text-black">
                                <Gem className="w-5 h-5 mt-1 fill-black/20" />
                                <div>
                                    <h3 className="font-serif font-bold text-lg leading-tight">Pierres Certifiées</h3>
                                    <p className="text-sm text-black/70 italic">Sélection rigoureuse des plus beaux diamants.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 border-t border-black/10">
                        <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold">
                            Auclaire Empire Hub &copy; 2026
                        </p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="md:col-span-3 bg-zinc-950/40 p-8 md:p-12">
                    <div className="mb-8">
                        <h2 className="text-2xl font-serif text-white mb-2 tracking-tight">Commencez Votre Projet</h2>
                        <p className="text-zinc-500 text-sm">Parlez-nous de la pièce de vos rêves.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#D2B57B]/80 ml-1">Nom Complet</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#D2B57B] transition-colors" />
                                    <Input 
                                        required
                                        placeholder="Jean Dupont"
                                        className="pl-10 bg-white/5 border-white/10 focus:border-[#D2B57B]/50 h-11 transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#D2B57B]/80 ml-1">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#D2B57B] transition-colors" />
                                    <Input 
                                        required
                                        type="email"
                                        placeholder="jean@exemple.com"
                                        className="pl-10 bg-white/5 border-white/10 focus:border-[#D2B57B]/50 h-11 transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#D2B57B]/80 ml-1">Téléphone</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#D2B57B] transition-colors" />
                                    <Input 
                                        required
                                        placeholder="+1 (514) 000-0000"
                                        className="pl-10 bg-white/5 border-white/10 focus:border-[#D2B57B]/50 h-11 transition-all"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#D2B57B]/80 ml-1">Type de bijou</label>
                                <div className="relative group">
                                    <Gem className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#D2B57B] transition-colors" />
                                    <select 
                                        required
                                        className="flex h-11 w-full rounded-md border border-white/10 bg-white/5 px-10 py-2 text-sm text-white focus:outline-none focus:border-[#D2B57B]/50 transition-all appearance-none"
                                        value={formData.jewelryType}
                                        onChange={e => setFormData({...formData, jewelryType: e.target.value})}
                                    >
                                        <option value="" disabled className="bg-zinc-900">Sélectionnez...</option>
                                        {JEWELRY_TYPES.map(type => (
                                            <option key={type} value={type} className="bg-zinc-900">{type}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600">
                                        <ArrowRight className="w-3 h-3 rotate-90" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#D2B57B]/80 ml-1">Budget estimé ($)</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-[#D2B57B] transition-colors" />
                                <Input 
                                    type="number"
                                    placeholder="Ex: 5000"
                                    className="pl-10 bg-white/5 border-white/10 focus:border-[#D2B57B]/50 h-11 transition-all"
                                    value={formData.budget}
                                    onChange={e => setFormData({...formData, budget: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#D2B57B]/80 ml-1">Votre Message / Détails</label>
                            <div className="relative group">
                                <MessageCircle className="absolute left-3 top-4 w-4 h-4 text-zinc-600 group-focus-within:text-[#D2B57B] transition-colors" />
                                <Textarea 
                                    placeholder="Décrivez votre idée, les matériaux souhaités, etc..."
                                    className="pl-10 pt-3 bg-white/5 border-white/10 focus:border-[#D2B57B]/50 min-h-[100px] transition-all"
                                    value={formData.message}
                                    onChange={e => setFormData({...formData, message: e.target.value})}
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full h-12 bg-[#D2B57B] hover:bg-[#E5C98A] text-black font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_10px_30px_rgba(210,181,123,0.2)] hover:shadow-[0_15px_40px_rgba(210,181,123,0.3)] hover:-translate-y-0.5 active:translate-y-0 group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    Envoyer le projet <Send className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
            
            {/* Attribution Badge - Subtle invisible tracking indicator */}
            <div className="fixed bottom-4 right-4 text-[8px] text-white/5 pointer-events-none uppercase tracking-[0.5em]">
                REF: {affId || 'DIRECT'} / {affSrc}
            </div>
        </div>
    );
}
