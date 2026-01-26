
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export type UserRole = 'admin' | 'sales' | 'manufacturer' | 'client';

interface Profile {
    id: string;
    full_name: string | null;
    role: UserRole;
    avatar_url: string | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    // Shared Mode State
    const [isSharedMode, setIsSharedMode] = useState(false);

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

        // Check if previously unlocked (persisted in session storage or similar?)
        // For now, simple state.

        return () => subscription.unsubscribe();
    }, []);

    // Fetch profile only if user exists OR in Shared Mode
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile', user?.id, isSharedMode],
        queryFn: async () => {
            if (isSharedMode) {
                return {
                    id: 'details-admin', // Shared Admin ID
                    full_name: 'Auclaire Admin',
                    role: 'admin',
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
        // We simulate a user so protected routes don't redirect
        // But we DON'T use Supabase Auth. We use Anon key + RLS policies.
        const mockUser = { id: 'shared-admin', email: 'admin@auclaire.com' } as User;
        setUser(mockUser);
    };

    const value = {
        session,
        user,
        profile: profile ?? null,
        isLoading: isLoadingSession || (!!user && isLoadingProfile),
        isAdmin: isSharedMode || (profile?.role as string) === 'admin',
        role: profile?.role,
        signOut: async () => {
            // Just lock the app
            setIsSharedMode(false);
            setUser(null);
            await supabase.auth.signOut();
        },
        signInAsDev: unlockApp, // Alias for compatibility during refactor
        unlockApp,
        switchRole: () => { } // Remove demo role switching in shared mode
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
