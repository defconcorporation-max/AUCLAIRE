
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
    Banknote
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import NotificationBell from '@/components/NotificationBell'

const navItems = [
    { label: 'Tableau de Bord', href: '/dashboard/affiliate', icon: LayoutDashboard, roles: ['affiliate'] },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manufacturer', 'sales'] },
    { label: 'Projects', href: '/dashboard/projects', icon: Briefcase, roles: ['admin', 'manufacturer', 'sales', 'client'] },
    { label: 'Clients', href: '/dashboard/clients', icon: Users, roles: ['admin', 'sales'] },
    { label: 'Invoices', href: '/dashboard/invoices', icon: FileText, roles: ['admin', 'sales'] },
    { label: 'Expenses', href: '/dashboard/finance/expenses', icon: Banknote, roles: ['admin'] },
    { label: 'Ambassadeurs', href: '/dashboard/affiliates', icon: Users, roles: ['admin'] },
    { label: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
    // Link back to the CAD tool
    { label: 'Design Studio', href: '/dashboard/studio', icon: Gem, roles: ['admin', 'sales', 'manufacturer'] },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
]

const Sidebar = ({ role, profile, signOut, setIsMobileOpen }: { role: any, profile: any, signOut: any, setIsMobileOpen: (v: boolean) => void }) => (
    <div className="flex flex-col h-full bg-[#111] text-gray-300 border-r border-[#333]">
        <div className="p-6">
            <h1 className="text-2xl font-serif text-luxury-gold tracking-widest">AUCLAIRE</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Management</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
            {navItems
                .filter(item => !item.roles || (role && item.roles.includes(role)))
                .map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-md transition-all text-sm font-medium
      ${isActive
                                ? 'bg-luxury-gold/10 text-luxury-gold border border-luxury-gold/20'
                                : 'hover:bg-white/5 hover:text-white'}
    `}
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </NavLink>
                ))}
        </nav>

        <div className="p-4 border-t border-[#333]">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-luxury-gold/20 flex items-center justify-center text-luxury-gold font-bold">
                    {profile?.full_name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                </div>
            </div>
            <Button
                variant="ghost"
                className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-900/10"
                onClick={() => signOut()}
            >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
            </Button>
        </div>
    </div>
)

export default function CRMLayout({ children }: { children?: React.ReactNode }) {
    const { signOut, profile, role } = useAuth()
    const [isMobileOpen, setIsMobileOpen] = useState(false)



    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b bg-[#111] text-white">
                <span className="font-serif text-luxury-gold">AUCLAIRE</span>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r-[#333] bg-[#111]">
                            <Sidebar role={role} profile={profile} signOut={signOut} setIsMobileOpen={setIsMobileOpen} />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex h-screen overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-72 shrink-0 relative">
                    <Sidebar role={role} profile={profile} signOut={signOut} setIsMobileOpen={setIsMobileOpen} />
                </aside>

                {/* Top Bar for Desktop (New) */}
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="hidden lg:flex items-center justify-end px-8 py-3 bg-background border-b z-10">
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                        </div>
                    </header>

                    {/* Main Content */}
                    <main className="flex-1 overflow-auto bg-zinc-50/50 dark:bg-black p-4 lg:p-8">
                        <div className="max-w-7xl mx-auto space-y-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    )
}
