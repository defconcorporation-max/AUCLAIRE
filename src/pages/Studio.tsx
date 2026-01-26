import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import RingViewer from "@/components/3d/RingViewer"
import { Button } from "@/components/ui/button"

export default function Studio() {
    const [config, setConfig] = useState({
        metal: "Gold (18k)",
        gem: "Diamond",
        type: "Solitaire",
        shape: "Round"
    })

    const metals = ["Gold (18k)", "Rose Gold", "Agrippa (White Gold)", "Platinum"]
    const gems = ["Diamond", "Sapphire", "Ruby", "Emerald"]
    const shapes = ["Round", "Princess", "Oval", "Emerald"]

    return (
        <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 relative bg-black/5 rounded-xl border-2 border-dashed border-luxury-gold/20 flex items-center justify-center overflow-hidden">
                <RingViewer config={config} />
            </div>

            <div className="flex flex-col gap-4">
                <Card className="flex-1 overflow-auto">
                    <CardContent className="pt-6 space-y-6">
                        <h3 className="font-serif text-xl font-bold mb-4 text-luxury-gold">Configuration</h3>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">Metal Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {metals.map(m => (
                                    <Button
                                        key={m}
                                        variant={config.metal === m ? "luxury" : "outline"}
                                        size="sm"
                                        onClick={() => setConfig({ ...config, metal: m })}
                                    >
                                        {m.split(" ")[0]}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">Stone Shape</label>
                            <div className="grid grid-cols-2 gap-2">
                                {shapes.map(s => (
                                    <Button
                                        key={s}
                                        variant={config.shape === s ? "luxury" : "outline"}
                                        size="sm"
                                        onClick={() => setConfig({ ...config, shape: s })}
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">Gemstone</label>
                            <div className="grid grid-cols-2 gap-2">
                                {gems.map(g => (
                                    <Button
                                        key={g}
                                        variant={config.gem === g ? "luxury" : "outline"}
                                        size="sm"
                                        onClick={() => setConfig({ ...config, gem: g })}
                                    >
                                        {g}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t">
                            <Button className="w-full bg-secondary text-secondary-foreground">Save Design to Quote</Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
