
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Login() {
    const [password, setPassword] = useState('')
    const { unlockApp } = useAuth()
    const navigate = useNavigate()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)



    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (password === 'auclaire2468') {
            unlockApp();
            navigate('/dashboard');
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
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-serif">A U C L A I R E</CardTitle>
                        <CardDescription>Enter access code to manage system</CardDescription>
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
                            {message && (
                                <div className="text-sm p-3 rounded bg-red-100 text-red-800 text-center">
                                    {message.text}
                                </div>
                            )}
                            <Button type="submit" className="w-full bg-luxury-gold hover:bg-luxury-gold-dark text-black">
                                Enter App (Admin)
                            </Button>
                        </form>
                        <p className="text-xs text-center text-muted-foreground mt-4">
                            Shared Access Mode • All actions logged as 'Admin'
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
