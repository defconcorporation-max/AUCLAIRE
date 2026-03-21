import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function RegisterAffiliate() {
    const { t } = useTranslation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    // const navigate = useNavigate()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'affiliate', // Important: Set role metadata
                        affiliate_status: 'pending' // pending approval
                    },
                },
            })

            if (error) throw error

            setMessage({
                type: 'success',
                text: t('registerAffiliatePage.successMessage')
            })
            // Optional: Redirect after delay or just show message
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
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
                    <h1 className="text-4xl font-serif tracking-wider text-luxury-gold">AMBASSADEUR</h1>
                    <p className="text-gray-300 italic font-light tracking-widest uppercase text-sm">{t('registerAffiliatePage.heroSubtitle')}</p>
                </div>
            </div>

            <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    <CardHeader className="text-center pb-2">
                        <Link to="/login" className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <CardTitle className="text-2xl font-serif mb-2 text-luxury-gold">{t('registerAffiliatePage.cardTitle')}</CardTitle>
                        <CardDescription>{t('registerAffiliatePage.cardDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleRegister} className="space-y-4">
                            <Input
                                placeholder={t('registerAffiliatePage.placeholderName')}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                            <Input
                                type="email"
                                placeholder={t('registerAffiliatePage.placeholderEmail')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background/50"
                            />
                            <Input
                                type="password"
                                placeholder={t('registerAffiliatePage.placeholderPassword')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background/50"
                            />

                            <Button type="submit" className="w-full bg-luxury-gold hover:bg-luxury-gold/90 text-black font-medium" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('registerAffiliatePage.submit')}
                            </Button>
                        </form>

                        {message && (
                            <div className={`mt-4 text-sm p-4 rounded border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            {t('registerAffiliatePage.alreadyAccount')}{' '}
                            <Link to="/login" className="text-luxury-gold hover:underline">{t('registerAffiliatePage.signIn')}</Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
