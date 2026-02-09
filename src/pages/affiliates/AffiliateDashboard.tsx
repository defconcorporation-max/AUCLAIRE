import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
// import { apiAffiliates, AffiliateStats } from '@/services/apiAffiliates'; // Commented out to isolate
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AffiliateDashboard() {
    const { profile } = useAuth();
    // const [stats, setStats] = useState<any>(null); // Simplified type
    // const [isLoading, setIsLoading] = useState(true);

    // useEffect(() => {
    //     // Commenting out fetch to test if CRASH is in the fetch or render
    //     // setIsLoading(false);
    // }, []);

    // if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-serif text-gray-900 dark:text-white">
                    Bonjour, {profile?.full_name?.split(' ')[0]} (DEBUG MODE)
                </h1>
                <p className="text-gray-500">
                    Niveau: <span className="text-luxury-gold font-bold uppercase">{profile?.affiliate_level || 'Starter'}</span>
                </p>
                <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
                    If you see this, the basic component render works. The crash is likely in the Stats or Table.
                </div>
            </div>
        </div>
    );
}
