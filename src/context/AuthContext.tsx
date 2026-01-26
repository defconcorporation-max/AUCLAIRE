
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
    signInAsDev: () => void;
    switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const queryClient = useQueryClient();

    // Dev Mode State
    const [isDevMode, setIsDevMode] = useState(false);

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

    // Fetch profile only if user exists
    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile', user?.id, isDevMode],
        queryFn: async () => {
            if (isDevMode) {
                return {
                    id: 'dev-user',
                    full_name: 'Developer Admin',
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
                console.error('Error fetching profile:', error);
                return null;
            }
            return data as Profile;
        },
        enabled: !!user || isDevMode,
    });

    const signInAsDev = () => {
        setIsDevMode(true);
        // Mock session/user
        const mockUser = { id: 'dev-user', email: 'dev@auclaire.com' } as User;
        const mockSession = { user: mockUser, access_token: 'mock', refresh_token: 'mock' } as Session;

        setUser(mockUser);
        setSession(mockSession);
    };

    // Role Switching for Demo
    const switchRole = (role: UserRole) => {
        // if (!isDevMode) return; // Allow switching even if not strictly in "Dev Mode" state originally
        if (!isDevMode) setIsDevMode(true);


        // Mock Session Update
        const mockUser = { id: 'dev-user', email: `dev-${role}@auclaire.com` } as User;
        setUser(mockUser);

        // Force refetch of profile with new role
        queryClient.setQueryData(['profile', 'dev-user', true], {
            id: 'dev-user',
            full_name: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            role: role,
            avatar_url: null
        });
    };

    const value = {
        session,
        user,
        profile: profile ?? null,
        isLoading: isLoadingSession || (!!user && isLoadingProfile),
        isAdmin: (profile?.role as string) === 'admin' || (isDevMode && (profile?.role as string) === 'admin'),
        role: profile?.role,
        signOut: async () => {
            if (isDevMode) {
                setIsDevMode(false);
                setUser(null);
                setSession(null);
                queryClient.clear();
            } else {
                await supabase.auth.signOut()
            }
        },
        signInAsDev,
        switchRole
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
