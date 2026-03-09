import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Briefcase, UserCircle, Clock, Trash2, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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

export default function UsersList() {
    const { profile: currentProfile } = useAuth();
    const queryClient = useQueryClient();

    const [passwordModalUserId, setPasswordModalUserId] = useState<string | null>(null);
    const [passwordModalUserName, setPasswordModalUserName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: apiUsers.getAll
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) => apiUsers.updateRole(id, role as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            alert(`Failed to update role: ${error.message}`);
            console.error(error);
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => apiUsers.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const updateMonthlyGoalMutation = useMutation({
        mutationFn: ({ id, goal }: { id: string; goal: number }) => apiUsers.updateMonthlyGoal(id, goal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error: any) => {
            alert(`Failed to update monthly goal: ${error.message}`);
            console.error(error);
        }
    });

    if (isLoading) return <div>Loading users...</div>;

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
            case 'manufacturer': return <Briefcase className="w-4 h-4 text-blue-500" />;
            case 'client': return <User className="w-4 h-4 text-green-500" />;
            case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
            default: return <UserCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-serif text-luxury-gold">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage user roles and permissions.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users?.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                        {getRoleIcon(user.role)}
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            {user.full_name || 'Unnamed User'}
                                            {user.role === 'pending' && <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>}
                                            {user.id === currentProfile?.id && <Badge variant="outline" className="text-xs">You</Badge>}
                                        </div>
                                        <div className="text-sm text-neutral-500">{user.email || 'No Email (Check Database)'}</div>
                                        <div className="text-xs text-muted-foreground font-mono">ID: {user.id.slice(0, 8)}...</div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 pr-4">
                                    {user.role === 'affiliate' && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Goal:</span>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                                                <input
                                                    type="number"
                                                    className="h-8 w-24 rounded-md border border-input bg-background pl-5 pr-2 py-1 text-xs shadow-sm font-mono"
                                                    defaultValue={user.monthly_goal || 50000}
                                                    onBlur={(e) => {
                                                        const newVal = Number(e.target.value);
                                                        if (!isNaN(newVal) && newVal !== user.monthly_goal) {
                                                            if (confirm(`Change monthly goal for ${user.full_name} to $${newVal.toLocaleString()}?`)) {
                                                                updateMonthlyGoalMutation.mutate({ id: user.id, goal: newVal });
                                                            } else {
                                                                e.target.value = String(user.monthly_goal || 50000);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground mr-2">Role:</span>
                                        <select
                                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                                            value={user.role || 'client'}
                                            onChange={(e) => {
                                                if (user.id === currentProfile?.id) {
                                                    alert("You cannot change your own role here.");
                                                    return;
                                                }
                                                if (confirm(`Change ${user.full_name}'s role to ${e.target.value}?`)) {
                                                    updateRoleMutation.mutate({ id: user.id, role: e.target.value });
                                                }
                                            }}
                                            disabled={user.id === currentProfile?.id}
                                        >
                                            <option value="pending">Pending Approval</option>
                                            <option value="client">Client</option>
                                            <option value="manufacturer">Manufacturer</option>
                                            <option value="admin">Admin</option>
                                            <option value="sales">Sales Agent</option>
                                            <option value="affiliate">Ambassador (Affiliate)</option>
                                        </select>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                                            onClick={() => {
                                                if (user.id === currentProfile?.id) return;
                                                if (confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
                                                    deleteUserMutation.mutate(user.id);
                                                }
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
                                            setPasswordModalUserName(user.full_name || 'Unnamed User');
                                        }}
                                    >
                                        <KeyRound className="w-3 h-3" /> Reset Password
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {users?.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">No users found.</div>
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
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for {passwordModalUserName}. They will be able to log in immediately with this new password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Input
                                id="new_password"
                                type="text"
                                placeholder="Enter new password (min 6 chars)..."
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
                                    alert("Password updated successfully!");
                                    setPasswordModalUserId(null);
                                    setNewPassword('');
                                } catch (err: any) {
                                    alert("Failed to update password. Did you run the Supabase RPC script? Error: " + err.message);
                                } finally {
                                    setIsUpdatingPassword(false);
                                }
                            }}
                        >
                            {isUpdatingPassword ? 'Saving...' : 'Save Password'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
