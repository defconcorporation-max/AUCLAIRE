
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export type UserRole = 'admin' | 'manufacturer' | 'client' | 'pending' | 'affiliate';

interface Profile {
    id: string;
    full_name: string | null;
    role: UserRole;
    avatar_url: string | null;
    affiliate_status?: 'pending' | 'active' | 'rejected';
    affiliate_level?: 'starter' | 'confirmed' | 'elite' | 'partner';
    commission_rate?: number;
    commission_type?: 'percent' | 'fixed';
    monthly_goal?: number;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    isAdmin: boolean;
    role?: UserRole;
    signOut: () => Promise<void>;
    unlockApp: () => void;
    signInAsDev: () => void; // Deprecated
    switchRole: (role: UserRole) => void;
    impersonate: (profile: Profile) => void;
    stopImpersonating: () => void;
    impersonatedProfile: Profile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    // Shared Mode State (Persisted)
    const [isSharedMode, setIsSharedMode] = useState(() => {
        return localStorage.getItem('isSharedMode') === 'true';
    });
    const [demoRole, setDemoRole] = useState<UserRole>(() => {
        return (localStorage.getItem('demoRole') as UserRole) || 'admin';
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoadingSession(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Persist Shared Mode
    useEffect(() => {
        localStorage.setItem('isSharedMode', isSharedMode.toString());
        localStorage.setItem('demoRole', demoRole);
    }, [isSharedMode, demoRole]);

    // Fetch profile only if user exists OR in Shared Mode
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile', user?.id, isSharedMode, demoRole],
        queryFn: async () => {
            if (isSharedMode) {
                // Return dynamic profile based on demoRole
                return {
                    id: `demo-${demoRole}`,
                    full_name: `Demo ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}`,
                    role: demoRole,
                    avatar_url: null
                } as Profile;
            }

            if (!user) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                // Return null if no profile found
                return null;
            }
            return data as Profile;
        },
        enabled: !!user || isSharedMode,
    });

    const unlockApp = () => {
        setIsSharedMode(true);
        setDemoRole('admin'); // Default start as admin
        // We simulate a user so protected routes don't redirect
        // But we DON'T use Supabase Auth. We use Anon key + RLS policies.
        const mockUser = { id: 'shared-admin', email: 'admin@auclaire.com' } as User;
        setUser(mockUser);
    };

    // Admin Preview Mode State
    const [overrideRole, setOverrideRole] = useState<UserRole | null>(null);

    // Impersonation: override profile with a real user's profile
    const [impersonatedProfile, setImpersonatedProfile] = useState<Profile | null>(null);

    // Effective Role: Shared Mode -> demoRole, Admin Preview -> overrideRole, Normal -> profile.role
    // Security Fallback: If profile is missing (deleted), default to 'pending'
    const activeProfile = impersonatedProfile ?? (profile ?? null);
    const effectiveRole = isSharedMode
        ? (impersonatedProfile ? impersonatedProfile.role : demoRole)
        : (overrideRole ?? (activeProfile?.role || 'pending'));

    const value = {
        session,
        user,
        profile: activeProfile,
        role: effectiveRole as UserRole,
        // isAdmin should be false if we are simulating another role
        isAdmin: effectiveRole === 'admin',
        isLoading: isLoadingSession || (!!user && isLoadingProfile),
        isInSharedMode: isSharedMode,
        impersonatedProfile,
        impersonate: (p: Profile) => setImpersonatedProfile(p),
        stopImpersonating: () => setImpersonatedProfile(null),
        signOut: async () => {
            setIsSharedMode(false);
            setUser(null);
            setImpersonatedProfile(null);
            await supabase.auth.signOut();
        },
        signInAsDev: unlockApp, // Alias for compatibility during refactor
        unlockApp,
        switchRole: (role: UserRole) => {
            setImpersonatedProfile(null); // clear impersonation when switching role
            if (isSharedMode) {
                setDemoRole(role);
            } else if (profile?.role === 'admin') {
                // Allow real admins to preview other roles
                setOverrideRole(role);
            }
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
