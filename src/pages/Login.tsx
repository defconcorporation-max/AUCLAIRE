
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const { signInAsDev } = useAuth()
    const navigate = useNavigate()

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            })

            if (error) {
                throw error
            }

            setMessage({ type: 'success', text: 'Check your email for the login link!' })
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'An error occurred' })
        } finally {
            setLoading(false)
        }
    }

    const [password, setPassword] = useState('')
    const [isUnlocked, setIsUnlocked] = useState(false)

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple client-side check as requested "just for the first connection"
        if (password === 'auclaire2468') {
            setIsUnlocked(true);
            // Optionally auto-login since there's only one main user in this demo context?
            // User said "add a password protection... for the first connection".
            // Showing the login options after unlock is safer.
        } else {
            setMessage({ type: 'error', text: 'Incorrect password' });
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="hidden lg:flex flex-col justify-center items-center bg-black text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40">
                    {/* Abstract Gold/Jewelry Background Gradient could go here */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-black" />
                </div>
                <div className="z-10 text-center space-y-6">
                    <h1 className="text-4xl font-serif tracking-wider">AUCLAIRE</h1>
                    <p className="text-luxury-gold/80 italic font-light tracking-widest uppercase text-sm">Fine Jewelry Manufacturing</p>
                </div>
            </div>

            <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    {!isUnlocked ? (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-2xl font-serif">A U C L A I R E</CardTitle>
                                <CardDescription>Enter access code to continue</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUnlock} className="space-y-4">
                                    <Input
                                        type="password"
                                        placeholder="Access Code"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="text-center tracking-widest"
                                        autoFocus
                                    />
                                    {message && !isUnlocked && (
                                        <div className="text-sm p-3 rounded bg-red-100 text-red-800 text-center">
                                            {message.text}
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full bg-luxury-gold hover:bg-luxury-gold-dark text-black">
                                        Enter
                                    </Button>
                                </form>
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-2xl font-serif">Welcome Back</CardTitle>
                                <CardDescription>
                                    Sign in to access the management portal
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Input
                                            type="email"
                                            placeholder="name@auclaire.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800"
                                        />
                                    </div>

                                    {message && (
                                        <div className={`text-sm p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full bg-luxury-gold hover:bg-luxury-gold-dark text-black font-medium" disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In with Email'}
                                    </Button>
                                </form>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white dark:bg-black px-2 text-muted-foreground">Or Development</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        signInAsDev();
                                        navigate('/dashboard');
                                    }}
                                >
                                    <span className="text-luxury-gold mr-2 font-bold">DEV</span>
                                    Bypass Login
                                </Button>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}
