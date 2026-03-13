import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

import { useQuery } from "@tanstack/react-query"
import { apiProjects } from "@/services/apiProjects"

export function RevenueChart() {
    const { data: revenueData, isLoading, isError } = useQuery({
        queryKey: ['revenueStats'],
        queryFn: () => apiProjects.getRevenueStats()
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[350px] w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-gold"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center h-[350px] w-full text-red-500 font-serif">
                Impossible de charger les données de revenus.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueData || []}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' 
                    }}
                />
                <Bar dataKey="total" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
        </ResponsiveContainer>
    )
}
