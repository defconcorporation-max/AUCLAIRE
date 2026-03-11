

import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
    LayoutDashboard,
    Users,
    Briefcase,
    FileText,
    LogOut,
    Gem,
    Menu,
    Settings,
    Banknote,
    GraduationCap,
    PhoneCall,
    BookOpen,
    BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import NotificationBell from '@/components/NotificationBell'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from 'lucide-react'

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'secretary'] },
    { label: 'Leads & CRM', href: '/dashboard/leads', icon: PhoneCall, roles: ['admin', 'affiliate', 'secretary'] },
    { label: 'Projects', href: '/dashboard/projects', icon: Briefcase, roles: ['admin', 'manufacturer', 'client', 'affiliate', 'secretary'] },
    { label: 'Clients', href: '/dashboard/clients', icon: Users, roles: ['admin', 'affiliate', 'secretary'] },
    { label: 'Invoices', href: '/dashboard/invoices', icon: FileText, roles: ['admin', 'affiliate', 'secretary'] },
    { label: 'Expenses', href: '/dashboard/finance/expenses', icon: Banknote, roles: ['admin', 'secretary'] },
    { label: 'Ambassadeurs', href: '/dashboard/affiliates', icon: Users, roles: ['admin', 'secretary'] },
    { label: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin', 'secretary'] },
    // Link back to the CAD tool
    { label: 'Design Studio', href: '/dashboard/studio', icon: Gem, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
    { label: 'Ressources', href: '/dashboard/resources', icon: BookOpen, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
    { label: 'QCM Academy', href: '/dashboard/qcm', icon: GraduationCap, roles: ['admin'] },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'secretary'] },
]

const Sidebar = ({ role, profile, signOut, setIsMobileOpen }: { role: string, profile: any, signOut: () => void, setIsMobileOpen: (v: boolean) => void }) => (
    <div className="flex flex-col h-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border-r border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300">
        <div className="p-8">
            <h1 className="text-2xl font-serif text-luxury-gold tracking-widest drop-shadow-sm">AUCLAIRE</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-2">Management</p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 py-4">
            {navItems
                .filter(item => !item.roles || (role && item.roles.includes(role)))
                .map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) => `
                            group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-sm font-medium
                            ${isActive
                                ? 'bg-gradient-to-r from-luxury-gold/15 to-transparent text-luxury-gold shadow-[inset_2px_0_0_0_#D2B57B]'
                                : 'hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}
                        `}
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <item.icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110`} />
                        {item.label}
                    </NavLink>
                ))}
        </nav>

        <div className="p-6 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-luxury-gold/30 to-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold font-serif text-lg shadow-sm">
                    {profile?.full_name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black dark:text-white truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-luxury-gold/70 capitalize">{profile?.role}</p>
                </div>
            </div>
            <Button
                variant="ghost"
                className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                onClick={() => signOut()}
            >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
            </Button>
        </div>
    </div>
)

export default function CRMLayout({ children }: { children?: React.ReactNode }) {
    const { signOut, profile, role } = useAuth()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const { theme, setTheme } = useTheme()

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-luxury-gold/30 selection:text-luxury-gold">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/60 backdrop-blur-lg fixed w-full z-50 transition-colors">
                <span className="font-serif text-xl tracking-widest text-luxury-gold drop-shadow-sm">AUCLAIRE</span>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5">
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                    <NotificationBell />
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r-black/5 dark:border-r-white/5 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-xl">
                            <Sidebar role={role} profile={profile} signOut={signOut} setIsMobileOpen={setIsMobileOpen} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex h-screen overflow-hidden lg:pt-0 pt-[73px]">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-[280px] shrink-0 relative z-20">
                    <Sidebar role={role} profile={profile} signOut={signOut} setIsMobileOpen={setIsMobileOpen} />
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Subtle top gradient for depth */}
                    <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-luxury-gold/5 to-transparent pointer-events-none -z-10" />

                    <header className="hidden lg:flex items-center justify-end px-8 py-4 z-10 gap-2">
                        <Button variant="outline" size="icon" onClick={toggleTheme} className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white rounded-full">
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                        <div className="flex items-center gap-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-full px-2 py-1 shadow-sm">
                            <NotificationBell />
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto p-6 lg:p-10 lg:pt-4 z-10 scroll-smooth">
                        <div className="max-w-[1800px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
