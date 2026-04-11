
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export type UserRole = 'admin' | 'manufacturer' | 'client' | 'pending' | 'affiliate' | 'secretary' | 'ambassador' | 'seller';
export type ParticipantType = 'affiliate' | 'ambassador' | 'seller';

export interface Profile {
    id: string;
    full_name: string | null;
    role: UserRole;
    participant_type?: ParticipantType;
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
    /** Real DB profile (not impersonated / preview) */
    originalProfile: Profile | null;
    isLoading: boolean;
    isAdmin: boolean;
    role?: UserRole;
    signOut: () => Promise<void>;
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
    /** Évite une closure périmée sur le timeout 3s (ne pas lire isLoadingSession dans l’effet) */
    const sessionLoadingRef = useRef(true);

    useEffect(() => {
        sessionLoadingRef.current = true;
        // Safety timeout — if session takes > 3s, unlock the UI
        const timeout = setTimeout(() => {
            if (sessionLoadingRef.current) {
                console.warn("Auth session loading timed out — unlocking UI");
                sessionLoadingRef.current = false;
                setIsLoadingSession(false);
            }
        }, 3000);

        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(timeout);
            sessionLoadingRef.current = false;
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoadingSession(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'PASSWORD_RECOVERY') {
                // Ensure users are redirected to the reset form. 
 // Set a localStorage flag or redirect with query parameter to let Login page know.
                window.location.href = '/login?mode=update-password';
            }
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
            // Clear any user-specific data from memory if necessary
            const w = window as Window & { currentUserRole?: string | null };
            w.currentUserRole = null;
        };
    }, []);

    // Fetch user profile
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
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
        enabled: !!user,
    });

    // Admin Preview Mode State
    const [overrideRole, setOverrideRole] = useState<UserRole | null>(null);

    // Impersonation: override profile with a real user's profile
    const [impersonatedProfile, setImpersonatedProfile] = useState<Profile | null>(null);

    // Effective Role: Admin Preview -> overrideRole, Normal -> profile.role
    // Security Fallback: If profile is missing (deleted), default to 'pending'
    const activeProfile = impersonatedProfile ?? (profile ?? null);
    const effectiveRole = overrideRole ?? (activeProfile?.role || 'pending');

    const value = {
        session,
        user,
        profile: activeProfile,
        originalProfile: profile, // <-- Export the real profile
        role: effectiveRole as UserRole,
        // isAdmin should be false if we are simulating another role
        isAdmin: effectiveRole === 'admin',
        isLoading: isLoadingSession || (!!user && isLoadingProfile),
        impersonatedProfile,
        impersonate: (p: Profile) => {
            if (profile?.role === 'admin') {
                setImpersonatedProfile(p);
            }
        },
        stopImpersonating: () => setImpersonatedProfile(null),
        signOut: async () => {
            setUser(null);
            setImpersonatedProfile(null);
            await supabase.auth.signOut();
        },
        switchRole: (role: UserRole) => {
            setImpersonatedProfile(null); // clear impersonation when switching role
            if (profile?.role === 'admin') {
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
