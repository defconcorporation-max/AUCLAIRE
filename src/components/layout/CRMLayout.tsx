

import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { LucideIcon } from 'lucide-react'
import type { Profile } from '@/context/AuthContext'
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
    BookOpen,
    BarChart3,
    Eye,
    MessageSquarePlus,
    MessageCircle,
    Calendar,
    Truck,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    CheckSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import NotificationBell from '@/components/NotificationBell'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from 'lucide-react'
import DailyReportSheet from '../analytics/DailyReportSheet'
import FeedbackWidget from '../FeedbackWidget'
import { GlobalSearch } from '@/components/GlobalSearch'
import { OnboardingTour } from '@/components/OnboardingTour'
import { OfflineIndicator } from '@/components/OfflineIndicator'

interface NavSection {
    section: string;
    items: { label: string; href: string; icon: LucideIcon; roles: string[] }[];
}

const navSections: NavSection[] = [
    {
        section: '',
        items: [
            { label: 'My Portal', href: '/dashboard/my-portal', icon: Eye, roles: ['client'] },
        ],
    },
    {
        section: 'Principal',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { label: 'Messages', href: '/dashboard/messages', icon: MessageCircle, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { label: 'Projects', href: '/dashboard/projects', icon: Briefcase, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { label: 'Tâches', href: '/dashboard/tasks', icon: CheckSquare, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { label: 'Production', href: '/dashboard/production', icon: Calendar, roles: ['admin', 'manufacturer', 'secretary'] },
        ],
    },
    {
        section: 'CRM',
        items: [
            { label: 'Clients', href: '/dashboard/clients', icon: Users, roles: ['admin', 'affiliate', 'secretary'] },
            { label: 'Ambassadeurs', href: '/dashboard/affiliates', icon: Users, roles: ['admin', 'secretary'] },
            { label: 'Fournisseurs', href: '/dashboard/suppliers', icon: Truck, roles: ['admin', 'secretary'] },
        ],
    },
    {
        section: 'Finance',
        items: [
            { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'secretary'] },
            { label: 'Trésorerie', href: '/dashboard/cash-flow', icon: TrendingUp, roles: ['admin', 'secretary'] },
            { label: 'Factures', href: '/dashboard/invoices', icon: FileText, roles: ['admin', 'affiliate', 'secretary'] },
            { label: 'Dépenses', href: '/dashboard/finance/expenses', icon: Banknote, roles: ['admin', 'secretary'] },
        ],
    },
    {
        section: 'Outils',
        items: [
            { label: 'Design Studio', href: '/dashboard/studio', icon: Gem, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { label: 'Ressources', href: '/dashboard/resources', icon: BookOpen, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { label: 'QCM Academy', href: '/dashboard/qcm', icon: GraduationCap, roles: ['admin'] },
        ],
    },
    {
        section: 'Admin',
        items: [
            { label: 'Utilisateurs', href: '/dashboard/users', icon: Users, roles: ['admin', 'secretary'] },
            { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'secretary'] },
            { label: 'Beta Feedback', href: '/dashboard/feedback', icon: MessageSquarePlus, roles: ['admin'] },
        ],
    },
]

const Sidebar = ({ role, profile, signOut, setIsMobileOpen, collapsed = false, onToggleCollapse }: {
    role: string, profile: Profile | null, signOut: () => void, setIsMobileOpen: (v: boolean) => void,
    collapsed?: boolean, onToggleCollapse?: () => void
}) => (
    <div className="flex flex-col h-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border-r border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300">
        <div className={collapsed ? 'p-4 flex justify-center' : 'p-8'}>
            {collapsed ? (
                <span className="text-xl font-serif text-luxury-gold tracking-widest">A</span>
            ) : (
                <>
                    <h1 className="text-2xl font-serif text-luxury-gold tracking-widest drop-shadow-sm">AUCLAIRE</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-2">Management</p>
                </>
            )}
        </div>

        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-4 overflow-y-auto space-y-4`}>
            {navSections.map((section) => {
                const visibleItems = section.items.filter(item => !item.roles || (role && item.roles.includes(role)));
                if (visibleItems.length === 0) return null;
                return (
                    <div key={section.section || '_client'}>
                        {section.section && !collapsed && (
                            <p className="text-[9px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-600 font-bold px-4 mb-1.5">
                                {section.section}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {visibleItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={({ isActive }) => `
                                        group relative flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-lg transition-all duration-300 text-sm font-medium
                                        ${isActive
                                            ? 'bg-gradient-to-r from-luxury-gold/15 to-transparent text-luxury-gold shadow-[inset_2px_0_0_0_#D2B57B]'
                                            : 'hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'}
                                    `}
                                    onClick={() => setIsMobileOpen(false)}
                                >
                                    <item.icon className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                    {item.href === '/dashboard/messages' && (
                                        collapsed
                                            ? <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            : <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                );
            })}
            {!collapsed && <FeedbackWidget />}
        </nav>

        <div className={`border-t border-black/5 dark:border-white/5 ${collapsed ? 'p-3' : 'p-6'}`}>
            {collapsed ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-luxury-gold/30 to-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold font-serif text-lg shadow-sm">
                        {profile?.full_name?.[0] || 'U'}
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => signOut()} title="Sign Out">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <>
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
                </>
            )}
            {onToggleCollapse && (
                <button
                    onClick={onToggleCollapse}
                    className={`w-full ${collapsed ? 'mt-2' : 'mt-3'} p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground flex items-center justify-center`}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            )}
        </div>
    </div>
)

export default function CRMLayout({ children }: { children?: React.ReactNode }) {
    const { signOut, profile, role } = useAuth()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const { theme, setTheme, accent, setAccent } = useTheme()

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-luxury-gold/30 selection:text-luxury-gold">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/60 backdrop-blur-lg fixed w-full z-50 transition-colors">
                <span className="font-serif text-xl tracking-widest text-luxury-gold drop-shadow-sm">AUCLAIRE</span>
                <div className="flex items-center gap-2">
                    <OfflineIndicator />
                    <GlobalSearch />
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
                <aside className={`hidden lg:block ${sidebarCollapsed ? 'w-[68px]' : 'w-[280px]'} shrink-0 relative z-40 transition-all duration-300`}>
                    <Sidebar role={role} profile={profile} signOut={signOut} setIsMobileOpen={setIsMobileOpen} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Subtle top gradient for depth */}
                    <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-luxury-gold/5 to-transparent pointer-events-none -z-10" />

                    <header className="hidden lg:flex items-center justify-end px-8 py-4 z-30 gap-3">
                        <DailyReportSheet />
                        <GlobalSearch />
                        <OfflineIndicator />
                        <Button variant="outline" size="icon" onClick={toggleTheme} className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white rounded-full">
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                        <div className="flex items-center gap-1 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-full px-2 py-1">
                            {([
                                { key: 'gold', color: '#D2B57B', label: 'Or' },
                                { key: 'silver', color: '#A8B5C0', label: 'Argent' },
                                { key: 'rose-gold', color: '#C9958A', label: 'Rose' },
                            ] as const).map(opt => (
                                <button
                                    key={opt.key}
                                    title={opt.label}
                                    onClick={() => setAccent(opt.key)}
                                    className={`w-5 h-5 rounded-full border-2 transition-all ${accent === opt.key ? 'border-foreground scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    style={{ backgroundColor: opt.color }}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-4 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-full px-2 py-1 shadow-sm">
                            <NotificationBell />
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto p-6 lg:p-10 lg:pt-4 z-0 scroll-smooth">
                        <div className="max-w-[1800px] w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
            <OnboardingTour />
        </div>
    )
}
