import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

import { useQuery } from "@tanstack/react-query"
import { apiProjects } from "@/services/apiProjects"

export function RevenueChart() {
    const { data: revenueData } = useQuery({
        queryKey: ['revenueStats'],
        queryFn: apiProjects.getRevenueStats
    });
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
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
        </ResponsiveContainer>
    )
}
