import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiActivities, type ActivityLog } from "@/services/apiActivities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function activityActionLabel(action: ActivityLog['action'], t: (key: string) => string): string {
    const key = `activityLog.action_${action}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return action;
}

export function ActivityLogList({ projectId }: { projectId: string }) {
    const { t, i18n } = useTranslation();
    const localeTag = i18n.language.startsWith('fr') ? 'fr-CA' : 'en-CA';

    const { data: activities = [] } = useQuery({
        queryKey: ['activities', projectId],
        queryFn: () => apiActivities.getByProject(projectId)
    });

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{t('activityLog.title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('activityLog.empty')}</p>
                    ) : (
                        activities.map(activity => (
                            <div key={activity.id} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                <div className="flex-1 space-y-1">
                                    <p className="font-medium">
                                        <span className="text-luxury-gold">{activity.user_name}</span>
                                        <span className="text-muted-foreground ml-1">
                                            {activityActionLabel(activity.action, t)}
                                        </span>
                                    </p>
                                    <p className="text-muted-foreground text-xs">{activity.details}</p>
                                    <p className="text-[10px] text-zinc-400">
                                        {new Date(activity.created_at).toLocaleString(localeTag)}
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
