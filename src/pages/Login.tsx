
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase' // Use directly for Auth
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function Login() {
    // Mode: 'login' | 'register' | 'forgot'
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')

    // Form State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const navigate = useNavigate()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/login`
                })
                if (error) throw error
                setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' })
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
                setMessage({ type: 'success', text: 'Account created! Please check your email to confirm.' })
            } else if (mode === 'magic-link') {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        // Redirect to the client portal after they click the link
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                })
                if (error) throw error
                setMessage({ type: 'success', text: 'Check your email for the magic link! You can close this window.' })
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
            const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
            setMessage({ type: 'error', text: msg })
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col justify-center items-center bg-black text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-black" />
                </div>
                <div className="z-10 text-center space-y-6">
                    <h1 className="text-4xl font-serif tracking-wider">AUCLAIRE</h1>
                    <p className="text-luxury-gold/80 italic font-light tracking-widest uppercase text-sm">Fine Jewelry Manufacturing</p>
                </div>
            </div>

            <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-serif mb-2">A U C L A I R E</CardTitle>
                        <div className="flex justify-center gap-4 text-sm font-medium text-muted-foreground">
                            <button
                                onClick={() => { setMode('login'); setMessage(null); }}
                                className={`pb-1 border-b-2 transition-colors ${mode === 'login' ? 'text-luxury-gold border-luxury-gold' : 'border-transparent hover:text-foreground'}`}
                            >
                                Login
                            </button>
                            <button
                                onClick={() => { setMode('register'); setMessage(null); }}
                                className={`pb-1 border-b-2 transition-colors ${mode === 'register' ? 'text-luxury-gold border-luxury-gold' : 'border-transparent hover:text-foreground'}`}
                            >
                                Register
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleAuth} className="space-y-4">
                            {mode === 'register' && (
                                <Input
                                    placeholder="Full Name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            )}
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            {(mode === 'login' || mode === 'register') && (
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            )}

                            <Button type="submit" className="w-full bg-luxury-gold hover:bg-luxury-gold-dark text-black" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : mode === 'magic-link' ? 'Send Access Link' : 'Send Reset Link'}
                            </Button>

                            {mode === 'login' && (
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('magic-link'); setMessage(null); }}
                                        className="w-full mt-2 p-2 border border-luxury-gold text-luxury-gold rounded-md hover:bg-luxury-gold hover:text-black transition-colors text-sm font-medium"
                                    >
                                        Client? Get a Login Link (No Password)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('forgot'); setMessage(null); }}
                                        className="w-full text-center text-xs text-muted-foreground hover:text-luxury-gold transition-colors block mt-4"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            )}
                            {(mode === 'forgot' || mode === 'magic-link') && (
                                <button
                                    type="button"
                                    onClick={() => { setMode('login'); setMessage(null); }}
                                    className="w-full text-center text-xs text-muted-foreground hover:text-luxury-gold transition-colors"
                                >
                                    Back to Login
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
                        Vous souhaitez collaborer avec nous ? <br />
                        <Link to="/affiliate/register" className="text-luxury-gold hover:underline">Devenir Ambassadeur</Link>
                    </div>
                </Card>
            </div>
        </div>
    )
}
