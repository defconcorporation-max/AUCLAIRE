import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import RingViewer from "@/components/3d/RingViewer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { apiProjects } from "@/services/apiProjects"
import { useNavigate } from "react-router-dom"
import { RingProvider, useRing, MetalType, ProfileType } from "@/context/RingContext"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Save, Undo, Redo, Share2, Layers, Diamond, Cuboid, Camera } from "lucide-react"

const RING_PRESETS = [
    { name: 'Solitaire Classique', profile: 'comfort', width: 2.5, height: 1.8, gemCount: 1, gemSize: 5 },
    { name: 'Alliance Simple', profile: 'comfort', width: 3, height: 1.5, gemCount: 0, gemSize: 0 },
    { name: 'Halo', profile: 'comfort', width: 3, height: 2, gemCount: 12, gemSize: 2 },
    { name: 'Trois Pierres', profile: 'flat', width: 3, height: 2, gemCount: 3, gemSize: 4 },
    { name: 'Éternité', profile: 'knife', width: 2, height: 1.8, gemCount: 20, gemSize: 1.5 },
]

// --- SUB-COMPONENTS FOR PRO UI ---

const PropertyPanel = () => {
    const { ringConfig, updateRing } = useRing()

    return (
        <Card className="h-full border-l rounded-none border-0 shadow-none bg-background/50 backdrop-blur-sm overflow-auto">
            <CardContent className="p-6 space-y-8">
                <div>
                    <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                        <Diamond className="w-4 h-4 text-luxury-gold" />
                        Center Stone
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Shape</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {["Round", "Princess", "Oval", "Emerald", "Marquise", "Pear"].map(s => (
                                    <Button
                                        key={s}
                                        variant={ringConfig.gem.shape === s ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => updateRing({ gem: { shape: s } })}
                                    >
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Carat Size</Label>
                                <span className="text-xs font-mono">{ringConfig.gem.size.toFixed(2)} ct</span>
                            </div>
                            <input
                                type="range"
                                min="0.5" max="3.0" step="0.05"
                                value={ringConfig.gem.size}
                                onChange={(e) => updateRing({ gem: { size: parseFloat(e.target.value) } })}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-luxury-gold"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                    <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                        <Cuboid className="w-4 h-4 text-luxury-gold" />
                        Band (Shank)
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Profile</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {["Court", "Flat", "D-Shape", "Knife-Edge"].map(p => (
                                    <Button
                                        key={p}
                                        variant={ringConfig.shank.profile === p ? "secondary" : "ghost"}
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => updateRing({ shank: { profile: p as ProfileType } })}
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Width</Label>
                                <span className="text-xs font-mono">{ringConfig.shank.width.toFixed(1)} mm</span>
                            </div>
                            <input
                                type="range"
                                min="1.5" max="6.0" step="0.1"
                                value={ringConfig.shank.width}
                                onChange={(e) => updateRing({ shank: { width: parseFloat(e.target.value) } })}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-luxury-gold"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Thickness</Label>
                                <span className="text-xs font-mono">{ringConfig.shank.thickness.toFixed(1)} mm</span>
                            </div>
                            <input
                                type="range"
                                min="1.2" max="3.0" step="0.1"
                                value={ringConfig.shank.thickness}
                                onChange={(e) => updateRing({ shank: { thickness: parseFloat(e.target.value) } })}
                                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-luxury-gold"
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                <div>
                    <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-luxury-gold" />
                        Metal Alloy
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {["Gold (18k)", "Rose Gold", "Agrippa (White Gold)", "Platinum"].map(m => (
                            <Button
                                key={m}
                                variant={ringConfig.metal === m ? "secondary" : "ghost"}
                                size="sm"
                                className="h-8 text-xs justify-start"
                                onClick={() => updateRing({ metal: m as MetalType })}
                            >
                                <div className={`w-3 h-3 rounded-full mr-2 ${m.includes("Rose") ? "bg-rose-300" : m.includes("White") || m.includes("Platinum") ? "bg-slate-200" : "bg-yellow-400"}`} />
                                {m.split(" ")[0]}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const StudioContent = () => {
    const { ringConfig, updateRing } = useRing()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [lighting, setLighting] = useState(1.5)
    const [hasChanges, setHasChanges] = useState(false)
    const initialRender = useRef(true)

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false
            return
        }
        setHasChanges(true)
    }, [ringConfig, lighting])

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handler)
        return () => window.removeEventListener('beforeunload', handler)
    }, [hasChanges])

    const handleScreenshot = () => {
        const canvas = document.querySelector('canvas')
        if (canvas) {
            const link = document.createElement('a')
            link.download = `auclaire-design-${Date.now()}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        }
    }

    const applyPreset = (preset: typeof RING_PRESETS[number]) => {
        const profileMap: Record<string, ProfileType> = {
            comfort: 'Court',
            flat: 'Flat',
            knife: 'Knife-Edge',
        }
        updateRing({
            shank: {
                profile: profileMap[preset.profile] || 'Court',
                width: preset.width,
                thickness: preset.height,
            },
            gem: {
                size: preset.gemSize,
            },
            head: {
                style: preset.gemCount === 3 ? 'Three-Stone' : preset.gemCount >= 10 ? 'Halo' : 'Solitaire',
            },
            sideStones: {
                active: preset.gemCount > 3,
                size: preset.gemSize,
                length: preset.gemCount >= 20 ? 1.0 : 0.5,
            },
        })
    }

    // Save Logic
    const [isSaveOpen, setIsSaveOpen] = useState(false)
    const [projectTitle, setProjectTitle] = useState("")
    const [projectNotes, setProjectNotes] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveOpen = () => {
        setProjectTitle(`${ringConfig.gem.size}ct ${ringConfig.gem.shape} Ring`)
        setIsSaveOpen(true)
    }

    const handleSaveProject = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const designSummary = `
                Metal: ${ringConfig.metal}
                Gem: ${ringConfig.gem.shape} (${ringConfig.gem.size}ct)
                Shank: ${ringConfig.shank.style} (${ringConfig.shank.width}mm)
            `;

            await apiProjects.create({
                title: projectTitle,
                description: projectNotes + "\n\n--- DESIGN SPEC ---\n" + designSummary,
                status: 'designing',
                client_id: user.id,
                stage_details: {
                    design_notes: JSON.stringify(ringConfig),
                    client_notes: projectNotes
                }
            });
            setIsSaveOpen(false);
            navigate('/dashboard/projects');
        } catch (error) {
            console.error("Failed to save design", error);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden">
            {/* LEFT: 3D VIEWPORT */}
            <div className="flex-1 relative bg-gray-100 dark:bg-zinc-950 flex flex-col">
                {/* TOOLBAR */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <Button variant="secondary" size="icon" className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur shadow-sm">
                        <Undo className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur shadow-sm">
                        <Redo className="w-4 h-4" />
                    </Button>
                    <div className="h-full w-px bg-border mx-2" />
                    <Button variant="secondary" size="icon" className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur shadow-sm" onClick={handleScreenshot} title="Capture screenshot">
                        <Camera className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur shadow-sm">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* LIGHTING CONTROL (Overlay) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-64 bg-white/80 dark:bg-zinc-900/80 backdrop-blur p-3 rounded-full shadow-lg border flex items-center gap-3">
                    <Label className="text-xs font-bold w-16">Exposure</Label>
                    <input
                        type="range"
                        min="0.5" max="3.0" step="0.1"
                        value={lighting}
                        onChange={(e) => setLighting(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-gray-300 dark:bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                    />
                </div>

                <div className="flex-1 relative">
                    <RingViewer config={ringConfig} intensity={lighting} />
                </div>
            </div>

            {/* RIGHT: PROPERTY PANEL */}
            <div className="w-full md:w-[350px] lg:w-[400px] border-l bg-background flex flex-col">
                <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-zinc-900 z-20 shadow-sm">
                    <span className="font-serif font-bold text-lg">Auclaire Studio <span className="text-xs bg-luxury-gold text-white px-1 rounded ml-1">PRO</span></span>
                    <Button size="sm" onClick={handleSaveOpen} className="bg-luxury-gold hover:bg-yellow-600 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Save Design
                    </Button>
                </div>
                <div className="flex-1 overflow-auto">
                    <div className="p-4 border-b space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Presets</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {RING_PRESETS.map((preset) => (
                                <Button
                                    key={preset.name}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => applyPreset(preset)}
                                >
                                    {preset.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <PropertyPanel />
                </div>
            </div>

            {/* Save Dialog */}
            <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Your Design</DialogTitle>
                        <DialogDescription>
                            Save this detailed specification to your projects.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Design Name</Label>
                            <Input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                                placeholder="Special instructions..."
                                value={projectNotes}
                                onChange={(e) => setProjectNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSaveOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProject} disabled={isSaving} className="bg-luxury-gold text-white">
                            {isSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                            Create Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function Studio() {
    return (
        <RingProvider>
            <StudioContent />
        </RingProvider>
    )
}
