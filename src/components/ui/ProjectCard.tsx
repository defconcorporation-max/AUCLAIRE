
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./StatusBadge"
import { Calendar } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface ProjectCardProps {
    project: any // Type this properly later
    onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
    const { role } = useAuth()
    return (
        <Card
            className="cursor-pointer bg-black/40 backdrop-blur-md border-white/5 hover:border-luxury-gold/50 transition-all duration-300 group shadow-lg hover:shadow-[0_0_15px_rgba(210,181,123,0.15)] overflow-hidden relative"
            onClick={onClick}
        >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-luxury-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardHeader className="pb-3 pt-4 px-4 bg-white/[0.02]">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 min-w-0">
                        <CardTitle className="text-base font-serif text-white group-hover:text-luxury-gold transition-colors truncate">
                            {project.title}
                        </CardTitle>
                        <CardDescription className="text-xs uppercase tracking-widest text-[#A68A56] truncate">
                            {project.client?.full_name || 'No Client'}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 py-3">
                <StatusBadge status={project.status} />

                <div className="flex items-center justify-between gap-4 text-[10px] text-gray-500 uppercase tracking-widest mt-4 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-luxury-gold/50" />
                        <span>Due {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    {project.budget && role !== 'manufacturer' && role !== 'client' && (
                        <div className="font-mono text-white/90 font-medium bg-white/5 px-2 py-0.5 rounded text-xs">
                            ${project.budget.toLocaleString()}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
