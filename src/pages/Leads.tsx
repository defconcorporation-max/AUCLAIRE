import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Leads() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-serif font-bold tracking-tight text-luxury-gold">Leads & CRM</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Leads Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Kanban board will go here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
