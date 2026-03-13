import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

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
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                        padding: '12px'
                    }}
                    labelStyle={{ color: '#D4AF37', fontWeight: 'bold', marginBottom: '4px', fontFamily: 'serif' }}
                    itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                />
                <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-zinc-400 text-xs uppercase tracking-widest font-sans">{value}</span>}
                />
                <Bar name="Encaissé" dataKey="collected" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar name="Facturé" dataKey="invoiced" fill="#E5E4E2" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar name="Potentiel" dataKey="potential" fill="#4B4B4B" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    )
}
