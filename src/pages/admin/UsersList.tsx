import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUsers } from '@/services/apiUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Shield, Briefcase, UserCircle, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function UsersList() {
    const { profile: currentProfile } = useAuth();
    const queryClient = useQueryClient();

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
                    <CardDescription>
                        Note: Due to security settings, email addresses are private. Identify users by Name.
                    </CardDescription>
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
                                        <div className="text-xs text-muted-foreground font-mono">ID: {user.id.slice(0, 8)}...</div>
                                    </div>
                                </div>

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
                            </div>
                        ))}

                        {users?.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">No users found.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
