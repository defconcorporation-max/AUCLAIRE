import { UserProfile } from '@/services/apiUsers';

import { useAuth, type Profile } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiUsers } from "@/services/apiUsers";
import { User, X } from "lucide-react";

export function RoleSwitcher() {
    const {
        role,
        switchRole,
        user,
        originalProfile,
        impersonate,
        stopImpersonating,
        impersonatedProfile,
    } = useAuth();

    const roles: UserRole[] = ['admin', 'manufacturer', 'client', 'affiliate', 'secretary'];

    const isRealAdmin = originalProfile?.role === 'admin';
    const showUserPicker = role === 'manufacturer' || role === 'affiliate' || role === 'secretary';

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll,
        enabled: isRealAdmin && showUserPicker && !!user,
    });

    if (!isRealAdmin) return null;

    const filteredUsers = (users as UserProfile[]).filter((u) => u.role === role);

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 border border-white/10 rounded-xl shadow-2xl p-2.5 flex flex-col gap-2 z-50 backdrop-blur-md min-w-[260px]">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Demo Mode</span>
            </div>


            {/* Role switcher buttons — always shown since only admins reach this point */}
                <div className="flex gap-1.5 flex-wrap">
                    {roles.map(r => (
                        <Button
                            key={r}
                            size="sm"
                            variant={role === r ? "default" : "outline"}
                            className={`text-xs h-7 px-2.5 ${role === r ? "bg-luxury-gold text-black border-luxury-gold" : "border-white/15 text-white/60 hover:text-white hover:border-white/30"}`}
                            onClick={() => switchRole(r)}
                        >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </Button>
                    ))}
                </div>


            {/* User picker — shown when role is manufacturer or affiliate */}
            {showUserPicker && user && (
                <div className="border-t border-white/10 pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1">
                            <User className="w-3 h-3" /> View as
                        </span>
                        {impersonatedProfile && (
                            <button
                                onClick={stopImpersonating}
                                className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
                            >
                                <X className="w-2.5 h-2.5" /> Reset
                            </button>
                        )}
                    </div>
                    {filteredUsers.length === 0 ? (
                        <p className="text-[10px] text-white/30 italic">No {role} users found.</p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filteredUsers.map((u: UserProfile) => (
                                <button
                                    key={u.id}
                                    onClick={() => impersonate({
                                        id: u.id,
                                        full_name: u.full_name ?? null,
                                        role: u.role,
                                        avatar_url: null,
                                        monthly_goal: u.monthly_goal,
                                    } satisfies Profile)}
                                    className={`text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors duration-150 ${impersonatedProfile?.id === u.id
                                        ? 'bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent'
                                        }`}
                                >
                                    <span className="font-medium">{u.full_name}</span>
                                    <span className="text-[9px] text-white/30 ml-1">{u.email}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
