
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

// --- TYPES ---
export type ToolType = 'select' | 'move' | 'scale' | 'rotate' | 'sculpt' | 'prongs' | 'stones' | 'shank' | 'render'
export type ViewMode = 'perspective' | 'ortho' | 'top' | 'front'
export type MetalType = 'White Gold' | 'Yellow Gold' | 'Rose Gold' | 'Platinum'
export type GemType = 'Diamond' | 'Sapphire' | 'Ruby' | 'Emerald'
export type ProfileType = "Court" | "D-Shape" | "Flat" | "Knife-Edge"

export interface RingConfig {
    metal: MetalType

    // Center Stone
    gem: {
        type: GemType
        shape: string // "Round", "Princess", etc.
        size: number // Carat/mm scale (0.5 to 3.0)
        ratio: number // Length/Width ratio
    }

    // Head / Setting
    head: {
        style: 'Solitaire' | 'Halo' | 'Three-Stone' | 'Vintage'
        prongStyle: 'Claw' | 'Round' | 'Tab'
        prongCount: 4 | 6
        gallery: 'Rail' | 'Trellis' | 'Basket' | 'None'
        height: number
    }

    // Shank / Band
    shank: {
        style: 'Classic' | 'Cathedral' | 'Twist' | 'Split'
        profile: ProfileType
        width: number // mm
        thickness: number // mm
        taper: number // 0.8 to 1.2
    }

    // Side Stones (Pave)
    sideStones: {
        active: boolean
        style: string // "Pave", "Channel"
        size: number
        length: number // 0.5 (half eternity)
    }

    // Engraving
    engraving: {
        text: string
        font: string // "Serif", "Sans", "Script"
        size: number
    }

    // Three-Stone Settings
    threeStone: {
        shape: string // "Pear", "Round", "Bagouqette"
        size: number // Carat relative to center
        type: GemType
    }
}

export interface MaterialConfig {
    metal: MetalType
    gem: GemType
}

export interface SavedDesign {
    id: string
    name: string
    date: string
    config: RingConfig
    materials: MaterialConfig
    thumbnail?: string
}

interface AppState {
    currentTool: ToolType
    viewMode: ViewMode
    ringConfig: RingConfig
    materials: MaterialConfig
    savedDesigns: SavedDesign[]
    setTool: (t: ToolType) => void
    setViewMode: (v: ViewMode) => void
    updateRing: (updates: RecursivePartial<RingConfig>) => void
    updateMaterials: (updates: Partial<MaterialConfig>) => void
    saveDesign: (name: string) => void
    loadDesign: (design: SavedDesign) => void
    deleteDesign: (id: string) => void
}

type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};

// --- DEFAULTS ---
const defaultConfig: RingConfig = {
    metal: 'Yellow Gold',
    gem: {
        type: 'Diamond',
        shape: 'Round',
        size: 1.0,
        ratio: 1.0
    },
    head: {
        style: 'Solitaire',
        prongStyle: 'Claw',
        prongCount: 4,
        gallery: 'Rail',
        height: 1.0
    },
    shank: {
        style: 'Classic',
        profile: 'Court',
        width: 3.0,
        thickness: 1.8,
        taper: 1.0
    },
    sideStones: {
        active: false,
        style: 'Pave',
        size: 1.5,
        length: 0.5
    },
    threeStone: {
        shape: 'Pear',
        size: 0.5,
        type: 'Diamond'
    },
    engraving: {
        text: "",
        font: "Serif",
        size: 0.5
    }
}

const defaultMaterials: MaterialConfig = {
    metal: 'Yellow Gold',
    gem: 'Diamond'
}

// --- CONTEXT ---
const RingContext = createContext<AppState | undefined>(undefined)

export function RingProvider({ children }: { children: ReactNode }) {
    const [currentTool, setTool] = useState<ToolType>('select')
    const [viewMode, setViewMode] = useState<ViewMode>('perspective')

    const [ringConfig, setRingConfig] = useState<RingConfig>(defaultConfig)
    const [materials, setMaterials] = useState<MaterialConfig>(defaultMaterials)

    // Cleanup logic for memory management
    useEffect(() => {
        return () => {
            // Reset global window assignments if any
            if ((window as Window & { auclaireSettings?: any }).auclaireSettings) {
                delete (window as Window & { auclaireSettings?: any }).auclaireSettings;
            }
        };
    }, []);

    const MAX_SAVES = 100;

    // Load initial saves
    // Load initial saves
    const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(() => {
        try {
            const saved = localStorage.getItem('auclaire_designs')
            const parsed: SavedDesign[] = saved ? JSON.parse(saved) : []
            // Defensive: Ensure loaded configs have all new fields
            return parsed.map((d) => ({
                ...d,
                config: {
                    ...defaultConfig,
                    ...d.config,
                    // Deep merge specific objects to avoid overwriting new prop defaults with undefined
                    head: { ...defaultConfig.head, ...d.config.head },
                    sideStones: { ...defaultConfig.sideStones, ...d.config.sideStones },
                    threeStone: { ...defaultConfig.threeStone, ...d.config.threeStone },
                    engraving: { ...defaultConfig.engraving, ...d.config.engraving }
                }
            }))
        } catch (e) {
            console.error("Failed to load designs", e)
            return []
        }
    })

    const deepMerge = <T extends Record<string, any>>(target: T, source: RecursivePartial<T>): T => {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            const sourceValue = (source as any)[key];
            const targetValue = (target as any)[key];
            
            if (sourceValue instanceof Object && key in target && targetValue instanceof Object) {
                (result as any)[key] = deepMerge(targetValue, sourceValue);
            } else {
                (result as any)[key] = sourceValue;
            }
        }
        return result;
    }

    const updateRing = (updates: RecursivePartial<RingConfig>) => {
        setRingConfig(prev => {
            // Simple deep merge for 2-level depth
            const next = { ...prev }
            if (updates.gem) next.gem = { ...prev.gem, ...updates.gem }
            if (updates.head) next.head = { ...prev.head, ...updates.head }
            if (updates.shank) next.shank = { ...prev.shank, ...updates.shank }
            if (updates.sideStones) next.sideStones = { ...prev.sideStones, ...updates.sideStones }
            if (updates.threeStone) next.threeStone = { ...prev.threeStone, ...updates.threeStone }
            if (updates.engraving) next.engraving = { ...prev.engraving, ...updates.engraving }
            if (updates.metal) next.metal = updates.metal as MetalType
            return next
        })
    }

    const updateMaterials = (updates: Partial<MaterialConfig>) => {
        setMaterials(prev => ({ ...prev, ...updates }))
    }

    // --- SAVE / LOAD LOGIC ---
    const saveDesign = (name: string) => {
        const newDesign: SavedDesign = {
            id: crypto.randomUUID(),
            name,
            date: new Date().toISOString(),
            config: ringConfig,
            materials: materials
        }
        // Enforce MAX_SAVES limit to prevent localStorage bloat
        const newSaves = [newDesign, ...savedDesigns].slice(0, MAX_SAVES)
        setSavedDesigns(newSaves)
        localStorage.setItem('auclaire_designs', JSON.stringify(newSaves))
    }

    const loadDesign = (design: SavedDesign) => {
        setRingConfig(design.config)
        setMaterials(design.materials)
    }

    const deleteDesign = (id: string) => {
        const newSaves = savedDesigns.filter(d => d.id !== id)
        setSavedDesigns(newSaves)
        localStorage.setItem('auclaire_designs', JSON.stringify(newSaves))
    }

    return (
        <RingContext.Provider value={{
            currentTool, setTool,
            viewMode, setViewMode,
            ringConfig, updateRing,
            materials, updateMaterials,
            savedDesigns, saveDesign, loadDesign, deleteDesign
        }}>
            {children}
        </RingContext.Provider>
    )
}

export function useRing() {
    const context = useContext(RingContext)
    if (!context) throw new Error("useRing must be used within RingProvider")
    return context
}
