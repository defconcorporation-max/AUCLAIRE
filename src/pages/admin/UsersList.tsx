import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Briefcase, UserCircle, Clock, Trash2, KeyRound, Zap, Factory, Search } from 'lucide-react';
import { useAuth, type UserRole } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from '@/components/ui/use-toast';

const USER_ROLE_I18N_KEYS: Record<string, string> = {
    pending: 'usersListPage.role_pending',
    client: 'usersListPage.role_client',
    manufacturer: 'usersListPage.role_manufacturer',
    secretary: 'usersListPage.role_secretary',
    admin: 'usersListPage.role_admin',
    sales: 'usersListPage.role_sales',
    affiliate: 'usersListPage.role_affiliate',
};

export default function UsersList() {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language?.startsWith('fr') ? 'fr-CA' : 'en-CA';
    const { profile: currentProfile } = useAuth();
    const queryClient = useQueryClient();

    const [passwordModalUserId, setPasswordModalUserId] = useState<string | null>(null);
    const [passwordModalUserName, setPasswordModalUserName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');

    const [roleChangeTarget, setRoleChangeTarget] = useState<{ id: string; name: string; newRole: string } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [goalTarget, setGoalTarget] = useState<{ id: string; name: string; goal: number; inputRef: HTMLInputElement | null } | null>(null);

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) => apiUsers.updateRole(id, role as UserRole),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            toast({ title: t('common.error'), description: error.message, variant: "destructive" });
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => apiUsers.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const updateCapacitiesMutation = useMutation({
        mutationFn: ({ id, design, production }: { id: string; design: number; production: number }) =>
            apiUsers.updateCapacities(id, design, production),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            toast({ title: t('common.error'), description: error.message, variant: "destructive" });
        }
    });

    const updateMonthlyGoalMutation = useMutation({
        mutationFn: ({ id, goal }: { id: string; goal: number }) => apiUsers.updateMonthlyGoal(id, goal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            toast({ title: t('common.error'), description: error.message, variant: "destructive" });
        }
    });

    if (isLoading) return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-serif text-luxury-gold">{t('usersListPage.loadingTitle')}</h1></div>
            <Card><CardContent className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-muted" />
                            <div className="space-y-2"><div className="h-4 w-32 bg-muted rounded" /><div className="h-3 w-48 bg-muted rounded" /></div>
                        </div>
                        <div className="h-9 w-32 bg-muted rounded" />
                    </div>
                ))}
            </CardContent></Card>
        </div>
    );

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
            case 'manufacturer': return <Briefcase className="w-4 h-4 text-blue-500" />;
            case 'secretary': return <UserCircle className="w-4 h-4 text-purple-500" />;
            case 'client': return <User className="w-4 h-4 text-green-500" />;
            case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
            default: return <UserCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const filteredUsers = users?.filter(u => {
        const matchSearch = !searchTerm || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = !filterRole || u.role === filterRole;
        return matchSearch && matchRole;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif text-luxury-gold">{t('usersListPage.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('usersListPage.subtitle')}</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('usersListPage.searchPlaceholder')} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="">{t('usersListPage.filterAllRoles')}</option>
                    <option value="admin">{t('usersListPage.role_admin')}</option>
                    <option value="manufacturer">{t('usersListPage.role_manufacturer')}</option>
                    <option value="secretary">{t('usersListPage.role_secretary')}</option>
                    <option value="affiliate">{t('usersListPage.role_affiliate')}</option>
                    <option value="client">{t('usersListPage.role_client')}</option>
                    <option value="pending">{t('usersListPage.role_pending')}</option>
                </select>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('usersListPage.cardTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredUsers?.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                        {getRoleIcon(user.role)}
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {user.full_name || t('usersListPage.noName')}
                                            {user.role === 'pending' && <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">{t('usersListPage.pendingBadge')}</Badge>}
                                            {user.id === currentProfile?.id && <Badge variant="outline" className="text-xs">{t('usersListPage.youBadge')}</Badge>}
                                        </div>
                                        <div className="text-sm text-neutral-500">{user.email || t('usersListPage.noEmail')}</div>
                                        <div className="text-xs text-muted-foreground font-mono">ID: {user.id.slice(0, 8)}...</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 pr-4">
                                    {user.role === 'manufacturer' && (
                                        <div className="flex flex-col gap-2 mb-2 w-full max-w-[200px]">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                    <Zap className="w-2.5 h-2.5 text-luxury-gold" /> {t('usersListPage.designCap')}
                                                </span>
                                                <input
                                                    type="number"
                                                    className="h-7 w-16 rounded-md border border-input bg-background px-2 py-1 text-[10px] shadow-sm font-mono"
                                                    defaultValue={user.design_capacity || 1}
                                                    onBlur={(e) => {
                                                        const newVal = Number(e.target.value);
                                                        if (!isNaN(newVal) && newVal !== user.design_capacity) {
                                                            updateCapacitiesMutation.mutate({
                                                                id: user.id,
                                                                design: newVal,
                                                                production: user.production_capacity || 3
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                    <Factory className="w-2.5 h-2.5 text-blue-400" /> {t('usersListPage.prodCap')}
                                                </span>
                                                <input
                                                    type="number"
                                                    className="h-7 w-16 rounded-md border border-input bg-background px-2 py-1 text-[10px] shadow-sm font-mono"
                                                    defaultValue={user.production_capacity || 3}
                                                    onBlur={(e) => {
                                                        const newVal = Number(e.target.value);
                                                        if (!isNaN(newVal) && newVal !== user.production_capacity) {
                                                            updateCapacitiesMutation.mutate({
                                                                id: user.id,
                                                                design: user.design_capacity || 1,
                                                                production: newVal
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {user.role === 'affiliate' && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">{t('usersListPage.monthlyGoal')}</span>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                                                <input
                                                    type="number"
                                                    className="h-8 w-24 rounded-md border border-input bg-background pl-5 pr-2 py-1 text-xs shadow-sm font-mono"
                                                    defaultValue={user.monthly_goal || 50000}
                                                    onBlur={(e) => {
                                                        const newVal = Number(e.target.value);
                                                        if (!isNaN(newVal) && newVal !== user.monthly_goal) {
                                                            setGoalTarget({ id: user.id, name: user.full_name || t('usersListPage.noName'), goal: newVal, inputRef: e.target });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground mr-2">{t('usersListPage.roleLabel')}</span>
                                        <select
                                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                            value={user.role || 'client'}
                                            onChange={(e) => {
                                                if (user.id === currentProfile?.id) {
                                                    toast({ title: t('usersListPage.toastCantChangeOwnRole'), description: t('usersListPage.toastCantChangeOwnRoleDesc'), variant: "destructive" });
                                                    return;
                                                }
                                                setRoleChangeTarget({ id: user.id, name: user.full_name || t('usersListPage.noName'), newRole: e.target.value });
                                            }}
                                            disabled={user.id === currentProfile?.id}
                                        >
                                              <option value="pending">{t('usersListPage.role_pending')}</option>
                                            <option value="client">{t('usersListPage.role_client')}</option>
                                            <option value="manufacturer">{t('usersListPage.role_manufacturer')}</option>
                                            <option value="secretary">{t('usersListPage.role_secretary')}</option>
                                            <option value="admin">{t('usersListPage.role_admin')}</option>
                                            <option value="affiliate">{t('usersListPage.role_affiliate')}</option>
                                        </select>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                                            onClick={() => {
                                                if (user.id === currentProfile?.id) return;
                                                setDeleteTarget({ id: user.id, name: user.full_name || t('usersListPage.noName') });
                                            }}
                                            disabled={user.id === currentProfile?.id}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 h-7 text-xs w-full mt-1 border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold hover:text-black"
                                        onClick={() => {
                                            setPasswordModalUserId(user.id);
                                            setPasswordModalUserName(user.full_name || t('usersListPage.noName'));
                                        }}
                                    >
                                        <KeyRound className="w-3 h-3" /> {t('usersListPage.resetPassword')}
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {filteredUsers?.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">{t('usersListPage.empty')}</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Password Reset Modal */}
            <Dialog
                open={!!passwordModalUserId}
                onOpenChange={(open) => {
                    if (!open) {
                        setPasswordModalUserId(null);
                        setNewPassword('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('usersListPage.passwordTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('usersListPage.passwordDesc', { name: passwordModalUserName })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Input
                                id="new_password"
                                type="password"
                                placeholder={t('usersListPage.passwordPlaceholder')}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            disabled={newPassword.length < 6 || isUpdatingPassword}
                            onClick={async () => {
                                if (!passwordModalUserId) return;
                                setIsUpdatingPassword(true);
                                try {
                                    await apiUsers.adminUpdatePassword(passwordModalUserId, newPassword);
                                    toast({ title: t('usersListPage.toastSuccess'), description: t('usersListPage.passwordSuccess') });
                                    setPasswordModalUserId(null);
                                    setNewPassword('');
                                } catch (err: unknown) {
                                    toast({ title: t('common.error'), description: err instanceof Error ? err.message : t('common.error'), variant: "destructive" });
                                } finally {
                                    setIsUpdatingPassword(false);
                                }
                            }}
                        >
                            {isUpdatingPassword ? t('usersListPage.saving') : t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Role Change Confirmation Dialog */}
            <Dialog open={!!roleChangeTarget} onOpenChange={(open) => { if (!open) setRoleChangeTarget(null); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('usersListPage.roleConfirmTitle')}</DialogTitle>
                        <DialogDescription>
                            {roleChangeTarget &&
                                t('usersListPage.roleConfirmDesc', {
                                    name: roleChangeTarget.name,
                                    role: t(USER_ROLE_I18N_KEYS[roleChangeTarget.newRole] ?? 'usersListPage.role_client'),
                                })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleChangeTarget(null)}>{t('common.cancel')}</Button>
                        <Button onClick={() => {
                            if (roleChangeTarget) {
                                updateRoleMutation.mutate({ id: roleChangeTarget.id, role: roleChangeTarget.newRole });
                            }
                            setRoleChangeTarget(null);
                        }}>{t('usersListPage.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('usersListPage.deleteTitle')}</DialogTitle>
                        <DialogDescription>
                            {deleteTarget && t('usersListPage.deleteDesc', { name: deleteTarget.name })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={() => {
                            if (deleteTarget) {
                                deleteUserMutation.mutate(deleteTarget.id);
                            }
                            setDeleteTarget(null);
                        }}>{t('common.delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Monthly Goal Confirmation Dialog */}
            <Dialog open={!!goalTarget} onOpenChange={(open) => {
                if (!open) {
                    if (goalTarget?.inputRef) {
                        const user = users?.find(u => u.id === goalTarget.id);
                        goalTarget.inputRef.value = String(user?.monthly_goal || 50000);
                    }
                    setGoalTarget(null);
                }
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('usersListPage.goalTitle')}</DialogTitle>
                        <DialogDescription>
                            {goalTarget &&
                                t('usersListPage.goalDesc', {
                                    name: goalTarget.name,
                                    amount: goalTarget.goal.toLocaleString(localeTag, { style: 'currency', currency: 'CAD' }),
                                })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            if (goalTarget?.inputRef) {
                                const user = users?.find(u => u.id === goalTarget.id);
                                goalTarget.inputRef.value = String(user?.monthly_goal || 50000);
                            }
                            setGoalTarget(null);
                        }}>{t('common.cancel')}</Button>
                        <Button onClick={() => {
                            if (goalTarget) {
                                updateMonthlyGoalMutation.mutate({ id: goalTarget.id, goal: goalTarget.goal });
                            }
                            setGoalTarget(null);
                        }}>{t('usersListPage.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
