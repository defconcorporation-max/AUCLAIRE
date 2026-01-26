// @ts-nocheck
import React, { createContext, useContext, useState, ReactNode } from 'react'

// --- TYPES ---
export type ToolType = 'select' | 'move' | 'scale' | 'rotate' | 'sculpt' | 'prongs' | 'stones' | 'shank' | 'render'
export type ViewMode = 'perspective' | 'ortho' | 'top' | 'front'
export type MetalType = 'White Gold' | 'Yellow Gold' | 'Rose Gold' | 'Platinum'
export type GemType = 'Diamond' | 'Sapphire' | 'Ruby' | 'Emerald'
export type ProfileType = "Court" | "D-Shape" | "Flat" | "Knife-Edge"

interface RingConfig {
    profile: ProfileType
    width: number
    thickness: number
    taper: number
    coverage: number // Pave
    gemSize: number
    gemShape: string
    settingStyle: '4-Prong' | '6-Prong' | 'Bezel'
    headType: 'Solitaire' | 'Halo' | 'Three-Stone' | 'Vintage'
    shankType: 'Classic' | 'Cathedral' | 'Split' | 'Twist'
    sideGemShape: string
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
    updateRing: (updates: Partial<RingConfig>) => void
    updateMaterials: (updates: Partial<MaterialConfig>) => void
}

// --- DEFAULTS ---
const defaultConfig: RingConfig = {
    profile: "Court",
    width: 3.0,
    thickness: 1.8,
    taper: 1.0,
    coverage: 0.0,
    gemSize: 1.0,
    gemShape: 'Round',
    settingStyle: '4-Prong',
    headType: 'Solitaire',
    shankType: 'Classic',
    sideGemShape: 'Round'
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

    const updateRing = (updates: Partial<RingConfig>) => {
        setRingConfig(prev => ({ ...prev, ...updates }))
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
