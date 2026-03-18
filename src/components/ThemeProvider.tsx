import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"
type AccentColor = "gold" | "silver" | "rose-gold"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    accent: AccentColor
    setAccent: (accent: AccentColor) => void
}

const ACCENT_VARS: Record<AccentColor, { main: string; light: string; dark: string; hsl: string }> = {
    'gold': { main: '#D2B57B', light: '#E9D8A6', dark: '#A68A56', hsl: '43 60% 65%' },
    'silver': { main: '#A8B5C0', light: '#CDD5DB', dark: '#7A8B98', hsl: '208 15% 70%' },
    'rose-gold': { main: '#C9958A', light: '#E0BBB3', dark: '#A06B5E', hsl: '12 35% 66%' },
};

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    accent: "gold",
    setAccent: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const [accent, setAccentState] = useState<AccentColor>(
        () => (localStorage.getItem('auclaire-accent') as AccentColor) || 'gold'
    )

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            root.classList.add(systemTheme)
            return
        }
        root.classList.add(theme)
    }, [theme])

    useEffect(() => {
        const vars = ACCENT_VARS[accent];
        const root = window.document.documentElement;
        root.style.setProperty('--luxury-gold', vars.main);
        root.style.setProperty('--luxury-gold-light', vars.light);
        root.style.setProperty('--luxury-gold-dark', vars.dark);
        root.style.setProperty('--primary', vars.hsl);
        root.style.setProperty('--accent', vars.hsl);
        root.style.setProperty('--ring', vars.hsl);
    }, [accent])

    const setAccent = (a: AccentColor) => {
        localStorage.setItem('auclaire-accent', a);
        setAccentState(a);
    };

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        accent,
        setAccent,
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")
    return context
}
