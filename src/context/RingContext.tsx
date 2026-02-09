// @ts-nocheck
import React, { createContext, useContext, useState, ReactNode } from 'react'

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

    // Side Stones
    sideStones: {
        active: boolean
        style: string // "Pave", "Channel"
        size: number
        length: number // 0.5 (half eternity)
    }
}

interface MaterialConfig {
    metal: MetalType
    gem: GemType
}

interface AppState {
    currentTool: ToolType
    viewMode: ViewMode
    ringConfig: RingConfig
    materials: MaterialConfig
    setTool: (t: ToolType) => void
    setViewMode: (v: ViewMode) => void
    updateRing: (updates: RecursivePartial<RingConfig>) => void
    updateMaterials: (updates: Partial<MaterialConfig>) => void
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

    // Recursive merge for deep updates
    const deepMerge = (target: any, source: any) => {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], deepMerge(target[key], source[key]))
            }
        }
        Object.assign(target || {}, source)
        return target
    }

    const updateRing = (updates: RecursivePartial<RingConfig>) => {
        setRingConfig(prev => {
            // Simple deep merge for 2-level depth
            const next = { ...prev }
            if (updates.gem) next.gem = { ...prev.gem, ...updates.gem }
            if (updates.head) next.head = { ...prev.head, ...updates.head }
            if (updates.shank) next.shank = { ...prev.shank, ...updates.shank }
            if (updates.sideStones) next.sideStones = { ...prev.sideStones, ...updates.sideStones }
            if (updates.metal) next.metal = updates.metal as MetalType
            return next
        })
    }

    const updateMaterials = (updates: Partial<MaterialConfig>) => {
        setMaterials(prev => ({ ...prev, ...updates }))
    }

    return (
        <RingContext.Provider value={{
            currentTool, setTool,
            viewMode, setViewMode,
            ringConfig, updateRing,
            materials, updateMaterials
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
