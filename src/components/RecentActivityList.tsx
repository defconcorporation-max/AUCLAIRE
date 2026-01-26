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
                    <div key={activity.id} className="flex gap-3 text-sm border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex-1 space-y-1">
                            <p className="font-medium text-xs">
                                <span className="font-bold">{activity.user_name}</span>
                                <span className="text-muted-foreground ml-1">
                                    {activity.action === 'status_change' ? 'changed status' :
                                        activity.action === 'update' ? 'updated details' :
                                            activity.action}
                                </span>
                            </p>
                            <p className="text-muted-foreground text-xs line-clamp-1">{activity.details}</p>
                            <p className="text-[10px] text-zinc-400">
                                {new Date(activity.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
