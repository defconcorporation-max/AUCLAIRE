
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
            className="cursor-pointer hover:border-luxury-gold transition-colors group"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-serif group-hover:text-luxury-gold transition-colors">
                            {project.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {project.client?.full_name}
                        </CardDescription>
                    </div>
                    <StatusBadge status={project.status} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    {project.budget && role !== 'manufacturer' && role !== 'client' && (
                        <div className="font-mono text-foreground font-medium">
                            ${project.budget.toLocaleString()}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
