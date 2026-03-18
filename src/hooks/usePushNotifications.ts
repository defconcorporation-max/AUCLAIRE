import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
}

export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
    const { user } = useAuth();
    const [permission, setPermission] = useState<PushPermissionState>('prompt');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            setPermission('unsupported');
            return;
        }
        setPermission(Notification.permission as PushPermissionState);

        navigator.serviceWorker.ready.then(async (registration) => {
            try {
                if (registration.pushManager) {
                    const subscription = await registration.pushManager.getSubscription();
                    setIsSubscribed(!!subscription);
                }
            } catch {
                // pushManager not available in this context
            }
        }).catch(() => {});
    }, []);

    const subscribe = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !VAPID_PUBLIC_KEY) {
            // Fallback: just request notification permission for local notifications
            const result = await Notification.requestPermission();
            setPermission(result as PushPermissionState);
            if (result === 'granted') {
                setIsSubscribed(true);
                // Store preference in Supabase for local notification polling
                if (user?.id) {
                    await supabase.from('push_subscriptions').upsert({
                        user_id: user.id,
                        subscription: JSON.stringify({ type: 'local', enabled: true }),
                        created_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' }).then(() => {});
                }
            }
            return result === 'granted';
        }

        setIsLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result as PushPermissionState);

            if (result !== 'granted') {
                setIsLoading(false);
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
            }

            if (user?.id) {
                await supabase.from('push_subscriptions').upsert({
                    user_id: user.id,
                    subscription: JSON.stringify(subscription.toJSON()),
                    created_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
            }

            setIsSubscribed(true);
            setIsLoading(false);
            return true;
        } catch (err) {
            console.error('Push subscription failed:', err);
            setIsLoading(false);
            return false;
        }
    }, [user?.id]);

    const unsubscribe = useCallback(async () => {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }

            if (user?.id) {
                await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
            }

            setIsSubscribed(false);
        } catch (err) {
            console.error('Push unsubscription failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    const sendLocalNotification = useCallback((title: string, body: string, url?: string) => {
        if (permission !== 'granted') return;
        if (document.visibilityState === 'visible') return;

        navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                data: { url: url || '/dashboard' },
                tag: `auclaire-${Date.now()}`,
            });
        });
    }, [permission]);

    return {
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
        sendLocalNotification,
        isSupported: permission !== 'unsupported',
    };
}
