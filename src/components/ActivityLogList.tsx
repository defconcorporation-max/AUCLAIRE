import { useQuery } from "@tanstack/react-query";
import { apiActivities } from "@/services/apiActivities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";

export function ActivityLogList({ projectId }: { projectId: string }) {
    const { data: activities = [] } = useQuery({
        queryKey: ['activities', projectId],
        queryFn: () => apiActivities.getByProject(projectId)
    });

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet.</p>
                    ) : (
                        activities.map(activity => (
                            <div key={activity.id} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                <div className="flex-1 space-y-1">
                                    <p className="font-medium">
                                        <span className="text-luxury-gold">{activity.user_name}</span>
                                        <span className="text-muted-foreground ml-1">
                                            {activity.action === 'status_change' ? 'changed status' :
                                                activity.action === 'update' ? 'updated details' :
                                                    activity.action}
                                        </span>
                                    </p>
                                    <p className="text-muted-foreground text-xs">{activity.details}</p>
                                    <p className="text-[10px] text-zinc-400">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
