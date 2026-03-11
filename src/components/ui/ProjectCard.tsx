import { Project } from '@/services/apiProjects';

import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "./StatusBadge"
import { Calendar, Factory, Handshake, AlertTriangle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface ProjectCardProps {
    project: Project
    onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
    const { role } = useAuth()
    const isRush = project.priority === 'rush'
    const hasNoMfgCost = (role === 'admin' || role === 'secretary') && Number(project.financials?.supplier_cost || 0) === 0 && (!project.financials?.cost_items || project.financials.cost_items.length === 0);

    return (
        <Card
            onClick={onClick}
            className={`
                cursor-pointer relative overflow-hidden transition-all duration-300 group
                bg-white/5 dark:bg-white/[0.03]
                border
                ${isRush
                    ? 'border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    : 'border-white/10 hover:border-luxury-gold/40 shadow-md hover:shadow-[0_0_16px_rgba(210,181,123,0.12)]'
                }
                backdrop-blur-sm rounded-xl
            `}
        >
            {/* Rush accent bar */}
            {isRush && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-500" />
            )}
            {/* Hover gold accent bar */}
            {!isRush && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-luxury-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}

            <CardContent className="p-4 space-y-3">

                {/* Top row: ref + title + badges */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        {project.reference_number && (
                            <span className="text-[10px] font-mono text-luxury-gold/60 tracking-wider">
                                {project.reference_number}
                            </span>
                        )}
                        <h3 className={`font-serif text-[15px] font-semibold leading-tight truncate mt-0.5
                            ${isRush ? 'text-red-400' : 'text-white group-hover:text-luxury-gold transition-colors duration-200'}
                        `}>
                            {project.title}
                        </h3>
                        <p className="text-[11px] text-white/40 uppercase tracking-widest mt-0.5 truncate">
                            {project.client?.full_name || '—'}
                        </p>
                    </div>

                    {/* Right side: price */}
                    {project.budget && role !== 'manufacturer' && role !== 'client' && (
                        <div className="shrink-0 font-mono text-sm font-semibold text-luxury-gold/90 bg-luxury-gold/8 border border-luxury-gold/15 px-2.5 py-1 rounded-lg">
                            ${Number(project.financials?.selling_price || project.budget).toLocaleString()}
                        </div>
                    )}
                </div>

                {/* Status */}
                <StatusBadge status={project.status} />

                {/* Admin tags row */}
                {(role === 'admin' || role === 'secretary') && (project.affiliate?.full_name || project.manufacturer?.full_name || isRush || hasNoMfgCost) && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {isRush && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white bg-red-600 px-2 py-0.5 rounded-full">
                                ⚡ Rush
                            </span>
                        )}
                        {hasNoMfgCost && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-2.5 h-2.5" /> No Cost
                            </span>
                        )}
                        {project.affiliate?.full_name && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/20 px-2 py-0.5 rounded-full max-w-[100px] truncate">
                                <Handshake className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{project.affiliate.full_name.split(' ')[0]}</span>
                            </span>
                        )}
                        {project.manufacturer?.full_name && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-sky-300 bg-sky-500/15 border border-sky-500/20 px-2 py-0.5 rounded-full max-w-[110px] truncate">
                                <Factory className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{project.manufacturer.full_name.split(' ')[0]}</span>
                            </span>
                        )}
                    </div>
                )}

                {/* Footer: dates */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        {project.deadline && (
                            <span className="flex items-center gap-1 text-luxury-gold/40">
                                <Calendar className="w-3 h-3" />
                                {new Date(project.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                        )}
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
