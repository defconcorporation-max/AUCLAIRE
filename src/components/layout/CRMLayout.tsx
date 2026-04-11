import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
    CheckSquare,
    Megaphone,
    Zap,
    Target
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
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

type NavItemDef = { labelKey: string; href: string; icon: LucideIcon; roles: string[] }
type NavSectionDef = { sectionKey: string; items: NavItemDef[] }

const NAV_SECTIONS: NavSectionDef[] = [
    {
        sectionKey: '',
        items: [
            { labelKey: 'nav.items.myPortal', href: '/dashboard/my-portal', icon: Eye, roles: ['client'] },
        ],
    },
    {
        sectionKey: 'nav.sections.main',
        items: [
            { labelKey: 'nav.items.dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.messages', href: '/dashboard/messages', icon: MessageCircle, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.projects', href: '/dashboard/projects', icon: Briefcase, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.tasks', href: '/dashboard/tasks', icon: CheckSquare, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.production', href: '/dashboard/production', icon: Calendar, roles: ['admin', 'manufacturer', 'secretary'] },
        ],
    },
    {
        sectionKey: 'nav.sections.crm',
        items: [
            { labelKey: 'nav.items.leads', href: '/dashboard/leads', icon: MessageSquarePlus, roles: ['admin', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.clients', href: '/dashboard/clients', icon: Users, roles: ['admin', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.affiliates', href: '/dashboard/affiliates', icon: Users, roles: ['admin', 'secretary'] },
            { labelKey: 'nav.items.suppliers', href: '/dashboard/suppliers', icon: Truck, roles: ['admin', 'secretary'] },
        ],
    },
    {
        sectionKey: 'nav.sections.finance',
        items: [
            { labelKey: 'nav.items.analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin', 'secretary'] },
            { labelKey: 'nav.items.cashFlow', href: '/dashboard/cash-flow', icon: TrendingUp, roles: ['admin', 'secretary'] },
            { labelKey: 'nav.items.invoices', href: '/dashboard/invoices', icon: FileText, roles: ['admin', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.expenses', href: '/dashboard/finance/expenses', icon: Banknote, roles: ['admin', 'secretary'] },
        ],
    },
    {
        sectionKey: 'nav.sections.tools',
        items: [
            { labelKey: 'nav.items.designStudio', href: '/dashboard/studio', icon: Gem, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.resources', href: '/dashboard/resources', icon: BookOpen, roles: ['admin', 'manufacturer', 'affiliate', 'secretary'] },
            { labelKey: 'nav.items.qcmAcademy', href: '/dashboard/qcm', icon: GraduationCap, roles: ['admin'] },
        ],
    },
    {
        sectionKey: 'nav.sections.marketing',
        items: [
            { labelKey: 'nav.items.marketingHub', href: '/dashboard/marketing', icon: Megaphone, roles: ['admin', 'secretary'] },
            { labelKey: 'nav.items.affiliatePortal', href: '/dashboard/affiliate-portal', icon: Target, roles: ['admin', 'affiliate', 'secretary'] },
        ],
    },
    {
        sectionKey: 'nav.sections.admin',
        items: [
            { labelKey: 'nav.items.adminPanel', href: '/dashboard/admin-panel', icon: Zap, roles: ['admin'] },
            { labelKey: 'nav.items.users', href: '/dashboard/users', icon: Users, roles: ['admin', 'secretary'] },
            { labelKey: 'nav.items.settings', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'secretary'] },
            { labelKey: 'nav.items.betaFeedback', href: '/dashboard/feedback', icon: MessageSquarePlus, roles: ['admin'] },
        ],
    },
]

function Sidebar({ role, profile, signOut, setIsMobileOpen, collapsed = false, onToggleCollapse }: {
    role: string, profile: Profile | null, signOut: () => void, setIsMobileOpen: (v: boolean) => void,
    collapsed?: boolean, onToggleCollapse?: () => void
}) {
    const { t } = useTranslation()
    return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border-r border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300">
        <div className={collapsed ? 'p-4 flex justify-center' : 'p-8'}>
            {collapsed ? (
                <span className="text-xl font-serif text-luxury-gold tracking-widest">A</span>
            ) : (
                <>
                    <h1 className="text-2xl font-serif text-luxury-gold tracking-widest drop-shadow-sm">{t('layout.brand')}</h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mt-2">{t('layout.managementTagline')}</p>
                </>
            )}
        </div>

        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-4'} py-4 overflow-y-auto space-y-4`}>
            {NAV_SECTIONS.map((section) => {
                const visibleItems = section.items.filter(item => !item.roles || (role && item.roles.includes(role)));
                if (visibleItems.length === 0) return null;
                return (
                    <div key={section.sectionKey || '_client'}>
                        {section.sectionKey && !collapsed && (
                            <p className="text-[9px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-600 font-bold px-4 mb-1.5">
                                {t(section.sectionKey)}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {visibleItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    title={collapsed ? t(item.labelKey) : undefined}
                                    className={({ isActive }) => `
                                        group relative flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-2.5 rounded-xl transition-all duration-300 text-sm font-medium
                                        ${isActive
                                             ? 'bg-luxury-gold text-black shadow-lg shadow-luxury-gold/20 scale-[1.02] border border-white/20'
                                             : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                     `}
                                    onClick={() => setIsMobileOpen(false)}
                                >
                                    <item.icon className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                                    {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
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
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => signOut()} title={t('layout.signOutTitle')}>
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
                            <p className="text-sm font-medium text-black dark:text-white truncate">{profile?.full_name || t('common.user')}</p>
                            <p className="text-xs text-luxury-gold/70 capitalize">{profile?.role}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={() => signOut()}
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        {t('layout.signOut')}
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
}

export default function CRMLayout({ children }: { children?: React.ReactNode }) {
    const { signOut, profile, role, isAdmin } = useAuth()
    console.log("CRMLayout: Role check", { role, isAdmin });
    const { t } = useTranslation()
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
                    <LanguageSwitcher className="h-9 w-9 p-0 border-black/10 dark:border-white/10" />
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
                    {/* Sublime mesh background for depth */}
                    <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-luxury-gold/5 via-transparent to-transparent" />
                        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-luxury-gold/[0.03] blur-[150px] rounded-full" />
                        <div className="absolute bottom-0 left-1/4 w-[800px] h-[800px] bg-amber-500/[0.02] blur-[180px] rounded-full" />
                    </div>

                    <header className="hidden lg:flex items-center justify-end px-8 py-4 z-30 gap-3">
                        <DailyReportSheet />
                        <LanguageSwitcher />
                        <GlobalSearch />
                        <OfflineIndicator />
                        <Button variant="outline" size="icon" onClick={toggleTheme} className="bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white rounded-full">
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                        <div className="flex items-center gap-1 bg-white/40 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-full px-2 py-1">
                            {([
                                { key: 'gold', color: '#D2B57B', labelKey: 'common.accentGold' as const },
                                { key: 'silver', color: '#A8B5C0', labelKey: 'common.accentSilver' as const },
                                { key: 'rose-gold', color: '#C9958A', labelKey: 'common.accentRose' as const },
                            ] as const).map(opt => (
                                <button
                                    key={opt.key}
                                    title={t(opt.labelKey)}
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
