import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase' // Use directly for Auth
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function Login() {
    const { t } = useTranslation()
    const location = useLocation()
    
    // Check if we arrived here via a password reset redirect
    const queryParams = new URLSearchParams(location.search)
    const initialMode = queryParams.get('mode') === 'update-password' ? 'update-password' : 'login'

    // Mode: 'login' | 'register' | 'forgot' | 'magic-link' | 'update-password'
    const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'magic-link' | 'update-password'>(initialMode)

    // Form State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(
        initialMode === 'update-password' ? { type: 'success', text: t('auth.enterNewPassword', 'Veuillez entrer votre nouveau mot de passe.') } : null
    )

    const navigate = useNavigate()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            if (mode === 'update-password') {
                const { error } = await supabase.auth.updateUser({ password })
                if (error) throw error
                setMessage({ type: 'success', text: t('auth.passwordUpdated', 'Mot de passe mis à jour avec succès.') })
                setTimeout(() => navigate('/dashboard'), 2000)
            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/login`
                })
                if (error) throw error
                setMessage({ type: 'success', text: t('auth.resetEmailSent') })
            } else if (mode === 'register') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                })
                if (error) throw error
                setMessage({ type: 'success', text: t('auth.accountCreated') })
            } else if (mode === 'magic-link') {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        // Redirect to the client portal after they click the link
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                })
                if (error) throw error
                setMessage({ type: 'success', text: t('auth.magicLinkSent') })
            } else {
                // Login
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                // Success - redirect handled by AuthContext or manual
                navigate('/dashboard')
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : t('auth.unexpectedError');
            setMessage({ type: 'error', text: msg })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 relative">
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>
            <div className="hidden lg:flex flex-col justify-center items-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/luxury_jewelry_workshop_bg_1775758304091.png" 
                        alt="Luxury Workshop" 
                        className="w-full h-full object-cover scale-110 animate-pulse-slow opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-black/40 to-transparent" />
                </div>
                <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
                    <h1 className="text-6xl font-serif tracking-[0.3em] text-white">AUCLAIRE</h1>
                    <div className="h-px w-24 bg-luxury-gold mx-auto" />
                    <p className="text-luxury-gold italic font-light tracking-[0.4em] uppercase text-xs">{t('auth.tagline')}</p>
                </div>
            </div>

            <div className="flex items-center justify-center p-8 bg-[#0a0a0a] relative overflow-hidden">
                {/* Background glow for mobile/form side */}
                <div className="absolute top-1/4 right-0 w-64 h-64 bg-luxury-gold/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 left-0 w-64 h-64 bg-amber-500/5 blur-[120px] rounded-full" />

                <Card className="w-full max-w-md border border-white/10 shadow-3xl bg-black/40 backdrop-blur-2xl p-4 overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-luxury-gold to-transparent opacity-50" />
                    
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-3xl font-serif mb-6 tracking-widest text-white">BIENVENUE</CardTitle>
                        <div className="flex justify-center p-1 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-muted-foreground w-fit mx-auto">
                            <button
                                onClick={() => { setMode('login'); setMessage(null); }}
                                className={`px-6 py-2 rounded-full transition-all duration-300 ${mode === 'login' ? 'bg-luxury-gold text-black shadow-lg' : 'hover:text-white'}`}
                            >
                                {t('auth.login')}
                            </button>
                            <button
                                onClick={() => { setMode('register'); setMessage(null); }}
                                className={`px-6 py-2 rounded-full transition-all duration-300 ${mode === 'register' ? 'bg-luxury-gold text-black shadow-lg' : 'hover:text-white'}`}
                            >
                                {t('auth.register')}
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleAuth} className="space-y-4">
                            {mode === 'register' && (
                                <Input
                                    placeholder={t('auth.fullName')}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            )}
                            {mode !== 'update-password' && (
                                <Input
                                    type="email"
                                    placeholder={t('auth.email')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            )}
                            {(mode === 'login' || mode === 'register' || mode === 'update-password') && (
                                <Input
                                    type="password"
                                    placeholder={mode === 'update-password' ? t('auth.newPassword', 'Nouveau mot de passe') : t('auth.password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            )}

                            <Button type="submit" className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-black font-bold h-12 rounded-xl shimmer-luxury shadow-lg shadow-luxury-gold/10 transition-transform active:scale-95" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'login' ? t('auth.signIn') : mode === 'register' ? t('auth.createAccount') : mode === 'magic-link' ? t('auth.sendAccessLink') : mode === 'update-password' ? t('auth.updatePassword', 'Mettre à jour') : t('auth.sendResetLink')}
                            </Button>

                            {mode === 'login' && (
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('magic-link'); setMessage(null); }}
                                        className="w-full mt-2 p-2 border border-luxury-gold text-luxury-gold rounded-md hover:bg-luxury-gold hover:text-black transition-colors text-sm font-medium"
                                    >
                                        {t('auth.clientMagicLink')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('forgot'); setMessage(null); }}
                                        className="w-full text-center text-xs text-muted-foreground hover:text-luxury-gold transition-colors block mt-4"
                                    >
                                        {t('auth.forgotPassword')}
                                    </button>
                                </div>
                            )}
                            {(mode === 'forgot' || mode === 'magic-link') && (
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setMessage(null); }}
                                    className="w-full text-center text-xs text-muted-foreground hover:text-luxury-gold transition-colors"
                                >
                                    {t('auth.backToLogin')}
                                </button>
                            )}
                        </form>

                        {message && (
                            <div className={`mt-4 text-sm p-3 rounded text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message.text}
                            </div>
                        )}
                    </CardContent>
                    <div className="p-6 pt-0 text-center text-xs text-muted-foreground">
                        {t('auth.affiliatePrompt')} <br />
                        <Link to="/affiliate/register" className="text-luxury-gold hover:underline">{t('auth.becomeAmbassador')}</Link>
                    </div>
                </Card>
            </div>
        </div>
    )
}
