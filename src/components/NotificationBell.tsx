import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiNotifications } from '@/services/apiNotifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

export default function NotificationBell() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, role } = useAuth();
    const prevCountRef = useRef<number>(0);

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', user?.id, role],
        queryFn: () => apiNotifications.getAll(user?.id, role),
        refetchInterval: 5000, // Poll every 5s for new alerts
        enabled: !!user || !!role
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Toast on new notification arrival
    useEffect(() => {
        if (unreadCount > prevCountRef.current && prevCountRef.current !== 0) {
            // A new notification arrived
            const newest = notifications.find(n => !n.is_read);
            if (newest) {
                toast({
                    title: newest.title,
                    description: newest.message,
                    variant: 'default',
                });
            }
        }
        prevCountRef.current = unreadCount;
    }, [unreadCount, notifications]);

    const handleMarkAllRead = async () => {
        await apiNotifications.markAllRead(user?.id, role);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleMarkOneRead = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent dropdown item click / navigation
        await apiNotifications.markOneRead(notificationId);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-red-600 rounded-full border-2 border-background text-[10px] text-white font-bold px-1">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-6 px-2 text-xs font-normal">
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.is_read ? 'bg-muted/50' : ''}`}
                                onSelect={() => {
                                    // Mark as read when clicked
                                    if (!notification.is_read) {
                                        apiNotifications.markOneRead(notification.id).then(() => {
                                            queryClient.invalidateQueries({ queryKey: ['notifications'] });
                                        });
                                    }
                                    if (notification.link) {
                                        setTimeout(() => navigate(notification.link!), 0);
                                    }
                                }}
                            >
                                <div className="flex w-full justify-between items-start">
                                    <span className="font-medium text-sm">{notification.title}</span>
                                    <div className="flex items-center gap-1 ml-2">
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </span>
                                        {!notification.is_read && (
                                            <button
                                                onClick={(e) => handleMarkOneRead(notification.id, e)}
                                                className="p-0.5 rounded hover:bg-muted"
                                                title="Mark as read"
                                            >
                                                <Check className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </p>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
