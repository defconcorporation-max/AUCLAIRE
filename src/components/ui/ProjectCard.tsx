import { Project } from '@/services/apiProjects';

import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "./StatusBadge"
import { Calendar, Factory, Handshake, AlertTriangle, ImageIcon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function getProjectThumbnail(project: Project): string | null {
    const sd = project.stage_details;
    if (!sd) return null;
    const first = sd.design_files?.[0] ?? sd.sketch_files?.[0] ?? sd.vault_files?.[0]
        ?? sd.design_versions?.[0]?.files?.[0];
    return first || null;
}

interface ProjectCardProps {
    project: Project
    onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
    const { role } = useAuth()
    const isRush = project.priority === 'rush'
    const hasNoMfgCost = (role === 'admin' || role === 'secretary') && Number(project.financials?.supplier_cost || 0) === 0 && (!project.financials?.cost_items || project.financials.cost_items.length === 0);
    const thumbnail = getProjectThumbnail(project);

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
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-500 z-20" />
            )}
            
            <CardContent className="p-0">
                {/* Thumbnail Area with Overlays */}
                <div className="relative w-full h-24 overflow-hidden rounded-t-xl bg-white/5 border-b border-white/5">
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt=""
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                    )}
                    
                    {/* OVERLAYS */}
                    <div className="absolute inset-0 p-2 flex flex-col justify-between pointer-events-none z-10">
                        <div className="flex justify-between items-start">
                            {project.reference_number && (
                                <span className="bg-black/60 backdrop-blur-md text-[9px] font-mono text-luxury-gold px-1.5 py-0.5 rounded border border-luxury-gold/20 tracking-wider">
                                    {project.reference_number}
                                </span>
                            )}
                            {isRush && (
                                <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg animate-pulse uppercase tracking-tighter">
                                    ⚡ Rush
                                </span>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <div className="scale-90 origin-bottom-right">
                                <StatusBadge status={project.status} />
                            </div>
                        </div>
                    </div>
                    
                    {/* Hover gold accent bar */}
                    {!isRush && (
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-luxury-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                    )}
                </div>

                <div className="p-3 space-y-1.5">
                    {/* Top row: title + price */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <h3 className={`font-serif text-[14px] font-semibold leading-tight truncate
                                ${isRush ? 'text-red-400' : 'text-white group-hover:text-luxury-gold transition-colors duration-200'}
                            `}>
                                {project.title}
                            </h3>
                        </div>
                        
                        {/* Price badge */}
                        {(project.financials?.selling_price || project.budget) && role !== 'manufacturer' && role !== 'client' && (
                            <div className="shrink-0 font-mono text-[11px] font-bold text-luxury-gold bg-luxury-gold/5 border border-luxury-gold/20 px-1.5 py-0.5 rounded">
                                ${Number(project.financials?.selling_price || project.budget).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {/* Sub row: client name */}
                    <p className="text-[10px] text-white/30 uppercase tracking-widest truncate -mt-0.5">
                        {project.client?.full_name || '—'}
                    </p>

                    {/* Meta row: tags */}
                    {(role === 'admin' || role === 'secretary') && (project.affiliate?.full_name || project.manufacturer?.full_name || hasNoMfgCost) && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                            {hasNoMfgCost && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-tighter text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                    <AlertTriangle className="w-2 h-2" /> NO COST
                                </span>
                            )}
                            {project.affiliate?.full_name && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold uppercase tracking-tighter text-purple-300 bg-purple-500/10 border border-purple-500/10 px-1.5 py-0.5 rounded max-w-[80px] truncate">
                                    <Handshake className="w-2 h-2 shrink-0" />
                                    <span className="truncate">{project.affiliate.full_name.split(' ')[0]}</span>
                                </span>
                            )}
                            {project.manufacturer?.full_name && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold uppercase tracking-tighter text-sky-300 bg-sky-500/10 border border-sky-500/10 px-1.5 py-0.5 rounded max-w-[90px] truncate">
                                    <Factory className="w-2 h-2 shrink-0" />
                                    <span className="truncate">{project.manufacturer.full_name.split(' ')[0]}</span>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer: Date with deadline if exists */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5 mt-1">
                        <div className="flex items-center gap-3 text-[9px] text-white/20 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(project.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                            </span>
                            {project.deadline && (
                                <span className="flex items-center gap-1 text-luxury-gold/30">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {new Date(project.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
