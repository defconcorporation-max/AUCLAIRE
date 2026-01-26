import { Outlet, NavLink } from "react-router-dom"
import { LayoutDashboard, Users, Gem, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

function Sidebar() {
    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: Users, label: "CRM & Leads", href: "/leads" },
        { icon: Gem, label: "Jewel Studio", href: "/studio" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ]

    return (
        <aside className="w-64 bg-luxury-charcoal text-luxury-pearl border-r border-luxury-gold-dark/20 flex flex-col h-screen fixed left-0 top-0 z-20">
            <div className="p-6 border-b border-luxury-gold-dark/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-luxury-gold flex items-center justify-center text-luxury-black font-serif font-bold">
                    A
                </div>
                <span className="font-serif text-xl font-bold tracking-wide">Auclaire</span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group",
                                isActive
                                    ? "bg-luxury-gold text-luxury-black shadow-lg shadow-luxury-gold/20 font-medium"
                                    : "hover:bg-luxury-gold/10 hover:text-luxury-gold"
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-luxury-gold-dark/20">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-left text-sm text-muted-foreground">
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    )
}

function Header() {
    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ml-64 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
                {/* Breadcrumb or Title placeholder */}
                <h2 className="text-sm font-medium text-muted-foreground">Welcome back, Artisan</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden border border-input">
                    {/* Avatar Placeholder */}
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">JD</div>
                </div>
            </div>
        </header>
    )
}

export default function Layout() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <Sidebar />
            <Header />
            <main className="ml-64 p-8 animate-in fade-in duration-500">
                <Outlet />
            </main>
        </div>
    )
}
