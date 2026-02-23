import { useQuery } from "@tanstack/react-query";
import { apiActivities } from "@/services/apiActivities";
// import { ScrollArea } from "@/components/ui/scroll-area";

export function RecentActivityList() {
    const { data: activities = [] } = useQuery({
        queryKey: ['activities_all'],
        queryFn: apiActivities.getAll,
        refetchInterval: 10000 // Refresh every 10s
    });

    // Take top 10
    const recent = activities.slice(0, 10);

    return (
        <div className="space-y-4">
            {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
                recent.map(activity => (
                    <div key={activity.id} className="group flex gap-3 text-sm border-b border-white/5 pb-4 last:border-0 last:pb-0 pt-2 first:pt-0 hover:bg-white/[0.02] transition-colors -mx-4 px-4 rounded-lg">
                        <div className="flex-1 space-y-1.5">
                            <p className="font-serif text-[13px] text-gray-300">
                                <span className="font-bold text-white group-hover:text-luxury-gold transition-colors">{activity.user_name}</span>
                                <span className="text-gray-400 ml-1.5 italic">
                                    {activity.action === 'status_change' ? 'changed status' :
                                        activity.action === 'update' ? 'updated details' :
                                            activity.action}
                                </span>
                            </p>
                            <p className="text-gray-300 text-xs line-clamp-2 leading-relaxed">{activity.details}</p>
                            <p className="text-[9px] uppercase tracking-widest text-[#A68A56]/80 pt-1">
                                {new Date(activity.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
