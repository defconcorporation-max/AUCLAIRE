import React, { useState } from 'react'
import { useRing, ToolType, MetalType, ProfileType } from '../../context/RingContext'
import { Icons } from '../ui/Icons'
import Viewport3D from '../3d/Viewport3D'
import PreviewModal from '../ui/PreviewModal'

// --- HELPER COMPONENTS ---

const ToolButton = ({ tool, active, onClick, icon: IconComp }: { tool: string, active: boolean, onClick: () => void, icon: any }) => (
    <button
        onClick={onClick}
        className={`w-10 h-10 flex flex-col items-center justify-center rounded-md transition-colors ${active ? 'bg-[#40a9ff] text-white' : 'text-gray-400 hover:bg-[#333] hover:text-white'}`}
        title={tool}
    >
        <IconComp className="w-5 h-5 mb-[1px]" />
        <span className="text-[8px] uppercase font-bold tracking-tighter opacity-70">{tool}</span>
    </button>
)

const SectionHeader = ({ title }: { title: string }) => (
    <div className="w-full px-4 py-2 bg-[#252530] border-y border-[#333] flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{title}</span>
        <Icons.ChevronDown className="w-3 h-3 text-gray-500" />
    </div>
)

const PropRow = ({ label, value, children }: { label: string, value?: string, children: React.ReactNode }) => (
    <div className="flex flex-col gap-1 px-4 py-2 border-b border-[#222]">
        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
            <span>{label}</span>
            {value && <span className="text-[#40a9ff] font-mono">{value}</span>}
        </div>
        {children}
    </div>
)

const Card = ({ active, label, color, onClick }: { active: boolean, label: string, color: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`w-full aspect-video rounded flex items-end p-2 transition-all border ${active ? 'border-[#40a9ff] ring-1 ring-[#40a9ff]' : 'border-transparent hover:border-gray-600'}`}
        style={{ background: `linear-gradient(135deg, #222 0%, ${color} 100%)` }}
    >
        <span className="text-[9px] font-bold text-white shadow-black drop-shadow-md">{label}</span>
    </button>
)


// --- MAIN LAYOUT ---

export default function CADLayout() {
    const {
        currentTool, setTool,
        ringConfig, updateRing,
        materials, updateMaterials
    } = useRing()

    const [showPreview, setShowPreview] = useState(false)

    const tools: { id: ToolType, icon: any }[] = [
        { id: 'select', icon: Icons.Select },
        { id: 'move', icon: Icons.Move },
        { id: 'scale', icon: Icons.Scale },
        { id: 'rotate', icon: Icons.Rotate },
        { id: 'sculpt', icon: Icons.Sculpt },
        { id: 'prongs', icon: Icons.Prong },
        { id: 'stones', icon: Icons.Diamond },
        { id: 'shank', icon: Icons.Ring },
    ]

    const gemShapes = ['Round', 'Princess', 'Emerald', 'Oval', 'Pear', 'Cushion', 'Radiant', 'Asscher', 'Heart', 'Marquise']
    const metals: { id: MetalType, color: string }[] = [
        { id: 'White Gold', color: '#e8e8e8' },
        { id: 'Yellow Gold', color: '#e6b85e' },
        { id: 'Rose Gold', color: '#fda486' },
        { id: 'Platinum', color: '#999' }
    ]

    const mockComponents = [
        { id: 1, name: "Solitaire Head", type: 'head', value: 'Solitaire' },
        { id: 2, name: "Halo Head", type: 'head', value: 'Halo' },
        { id: 3, name: "Three-Stone", type: 'head', value: 'Three-Stone' },
        { id: 4, name: "Split Shank", type: 'shank', value: 'Split' },
        { id: 5, name: "Twist Shank", type: 'shank', value: 'Twist' },
        { id: 6, name: "Bezel Head", type: 'head', value: 'Bezel Head' }, // Note: Bezel Head mapping to style might need check if supported
        { id: 7, name: "Pave Shank", type: 'shank', value: 'Pave' }, // Special logic below
        { id: 8, name: "Vintage Head", type: 'head', value: 'Vintage' },
    ]

    const handleComponentClick = (comp: any) => {
        if (comp.type === 'head') {
            updateRing({ head: { style: comp.value } })
        } else if (comp.type === 'shank') {
            if (comp.value === 'Pave') {
                updateRing({ sideStones: { active: true } })
            } else {
                updateRing({ shank: { style: comp.value } })
            }
        }
    }

    return (
        <div className="w-screen h-screen bg-[#111] text-gray-200 flex flex-col font-sans overflow-hidden selection:bg-[#40a9ff] selection:text-white">

            {/* 1. TOP BAR */}
            {showPreview && <PreviewModal config={ringConfig} materials={materials} onClose={() => setShowPreview(false)} />}
            <header className="h-10 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-2 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 px-2">
                        {['File', 'Edit', 'View', 'Tools', 'Render'].map(m => (
                            <button key={m} className="px-3 py-1 text-[11px] text-gray-400 hover:bg-[#333] hover:text-white rounded transition-colors">{m}</button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="px-3 py-1.5 text-[10px] font-bold text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gold/10 rounded mr-2 transition-colors uppercase tracking-wider"
                    >
                        Management
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white"><Icons.Bell className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-400 hover:text-white"><Icons.User className="w-4 h-4" /></button>
                    <button className="ml-2 px-4 py-1.5 bg-[#40a9ff] hover:bg-[#3090ef] text-white text-[11px] font-bold rounded flex items-center gap-2">
                        <Icons.Render className="w-3 h-3" />
                        RENDER
                    </button>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex overflow-hidden">

                {/* 2. LEFT TOOLBOX */}
                <aside className="w-14 bg-[#1a1a1a] border-r border-[#333] flex flex-col items-center py-2 gap-1 shrink-0 z-10">
                    {tools.map(t => (
                        <ToolButton
                            key={t.id}
                            tool={t.id}
                            active={currentTool === t.id}
                            onClick={() => setTool(t.id)}
                            icon={t.icon}
                        />
                    ))}
                </aside>

                {/* 3. CENTER VIEWPORT */}
                <main className="flex-1 relative bg-[#050505] flex flex-col min-w-0">
                    {/* 3D View */}
                    <div className="flex-1 relative">
                        <Viewport3D />
                    </div>

                    {/* 4. BOTTOM TRAY (Components) */}
                    <div className="h-32 bg-[#1a1a1a] border-t border-[#333] flex flex-col shrink-0">
                        <div className="px-4 py-1.5 bg-[#222] border-b border-[#333] flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span className="text-white border-b-2 border-[#40a9ff]">Shanks</span>
                            <span className="hover:text-white cursor-pointer">Heads</span>
                            <span className="hover:text-white cursor-pointer">Side Stones</span>
                            <span className="hover:text-white cursor-pointer">Decoration</span>
                        </div>
                        <div className="flex-1 p-2 flex gap-2 overflow-x-auto no-scrollbar">
                            {/* Mock Components */}
                            {mockComponents.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => handleComponentClick(c)}
                                    className={`h-full aspect-square bg-[#111] border rounded cursor-pointer flex flex-col items-center justify-center gap-1 group transition-all
                                        ${(ringConfig.head.style === c.value || ringConfig.shank.style === c.value) ? 'border-[#40a9ff] bg-[#40a9ff]/10' : 'border-[#333] hover:border-[#40a9ff]'}
                                    `}
                                >
                                    <Icons.Ring className={`w-6 h-6 ${(ringConfig.head.style === c.value || ringConfig.shank.style === c.value) ? 'text-[#40a9ff]' : 'text-gray-600 group-hover:text-[#40a9ff]'}`} />
                                    <span className={`text-[8px] font-mono text-center leading-tight px-1 ${(ringConfig.head.style === c.value || ringConfig.shank.style === c.value) ? 'text-[#40a9ff] font-bold' : 'text-gray-500'}`}>{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* 5. RIGHT PROPERTIES */}
                <aside className="w-72 bg-[#1a1a1a] border-l border-[#333] flex flex-col shrink-0 overflow-y-auto z-10 custom-scrollbar">

                    {/* A. GEMSTONE LIBRARY */}
                    <SectionHeader title="Center Stone" />
                    <div className="p-3 grid grid-cols-3 gap-2">
                        {gemShapes.map(s => (
                            <button
                                key={s}
                                onClick={() => updateRing({ gem: { ...ringConfig.gem, shape: s } })}
                                className={`flex flex-col items-center p-2 rounded border ${ringConfig.gem.shape === s ? 'bg-[#40a9ff]/20 border-[#40a9ff]' : 'border-[#333] hover:bg-[#333]'}`}
                            >
                                <Icons.Diamond className={`w-6 h-6 mb-1 ${ringConfig.gem.shape === s ? 'text-[#40a9ff]' : 'text-gray-500'}`} />
                                <span className="text-[8px] uppercase">{s}</span>
                            </button>
                        ))}
                    </div>

                    {/* A2. SIDE STONES */}
                    <SectionHeader title="Side Stones" />
                    <div className="p-3 grid grid-cols-3 gap-2">
                        {['Round', 'Princess', 'Pear', 'Marquise', 'Oval'].map(s => (
                            <button
                                key={s}
                                onClick={() => updateRing({ sideStones: { ...ringConfig.sideStones, style: s, active: true } })}
                                className={`flex flex-col items-center p-2 rounded border ${ringConfig.sideStones.style === s ? 'bg-[#40a9ff]/20 border-[#40a9ff]' : 'border-[#333] hover:bg-[#333]'}`}
                            >
                                <Icons.Diamond className={`w-3 h-3 mb-1 ${ringConfig.sideStones.style === s ? 'text-[#40a9ff]' : 'text-gray-500'}`} />
                                <span className="text-[7px] uppercase">{s}</span>
                            </button>
                        ))}
                    </div>

                    {/* B. STONE SETTINGS */}
                    <SectionHeader title="Stone Settings" />
                    <PropRow label="Size (ct)" value={`${ringConfig.gem.size}ct`}>
                        <input type="range" min="0.5" max="5.0" step="0.1" value={ringConfig.gem.size} onChange={e => updateRing({ gem: { ...ringConfig.gem, size: parseFloat(e.target.value) } })} className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-[#40a9ff]" />
                    </PropRow>
                    <PropRow label="Prongs">
                        <select
                            value={ringConfig.head.prongCount === 6 ? "6-Prong" : "4-Prong"}
                            onChange={(e) => {
                                const val = e.target.value
                                if (val === "6-Prong") updateRing({ head: { ...ringConfig.head, prongCount: 6 } })
                                else if (val === "4-Prong") updateRing({ head: { ...ringConfig.head, prongCount: 4 } })
                                else if (val === "Bezel") updateRing({ head: { ...ringConfig.head, style: "Solitaire", prongStyle: "Tab" } }) // Approx mapping
                            }}
                            className="w-full bg-[#111] border border-[#333] text-xs p-1 rounded text-gray-300 outline-none focus:border-[#40a9ff]"
                        >
                            <option value="4-Prong">4 Prongs</option>
                            <option value="6-Prong">6 Prongs</option>
                            <option value="Bezel">Bezel</option>
                        </select>
                    </PropRow>

                    {/* C. SHANK PROPERTIES */}
                    <SectionHeader title="Shank Properties" />
                    <PropRow label="Profile">
                        <div className="flex gap-1">
                            {["Court", "Flat", "D-Shape"].map(p => (
                                <button key={p} onClick={() => updateRing({ shank: { ...ringConfig.shank, profile: p as ProfileType } })} className={`flex-1 text-[9px] py-1 border rounded ${ringConfig.shank.profile === p ? 'bg-[#40a9ff] border-[#40a9ff] text-white' : 'border-[#333] text-gray-400'}`}>{p[0]}</button>
                            ))}
                        </div>
                    </PropRow>
                    <PropRow label="Band Width" value={`${ringConfig.shank.width}mm`}>
                        <input type="range" min="1.5" max="6.0" step="0.1" value={ringConfig.shank.width} onChange={e => updateRing({ shank: { ...ringConfig.shank, width: parseFloat(e.target.value) } })} className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-[#40a9ff]" />
                    </PropRow>
                    <PropRow label="Band Thickness" value={`${ringConfig.shank.thickness}mm`}>
                        <input type="range" min="1.0" max="3.0" step="0.1" value={ringConfig.shank.thickness} onChange={e => updateRing({ shank: { ...ringConfig.shank, thickness: parseFloat(e.target.value) } })} className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-[#40a9ff]" />
                    </PropRow>
                    <PropRow label="Pave Stones" value={ringConfig.sideStones.active ? "ON" : "OFF"}>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={ringConfig.sideStones.active} onChange={e => updateRing({ sideStones: { ...ringConfig.sideStones, active: e.target.checked } })} className="w-4 h-4 accent-[#40a9ff]" />
                            {ringConfig.sideStones.active && (
                                <input type="range" min="0.1" max="1.0" step="0.1" value={ringConfig.sideStones.length} onChange={e => updateRing({ sideStones: { ...ringConfig.sideStones, length: parseFloat(e.target.value) } })} className="flex-1 h-1 bg-gray-700 rounded-full appearance-none accent-purple-500" />
                            )}
                        </div>
                    </PropRow>

                    {/* D. MATERIALS */}
                    <SectionHeader title="Materials" />
                    <div className="p-3 grid grid-cols-2 gap-2">
                        {metals.map(m => (
                            <Card
                                key={m.id}
                                label={m.id}
                                color={m.color}
                                active={materials.metal === m.id}
                                onClick={() => updateMaterials({ metal: m.id })}
                            />
                        ))}
                    </div>

                    <div className="px-4 py-1 text-[9px] font-bold text-gray-500 uppercase">Gem Stone</div>
                    <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                        {[
                            { id: 'Diamond', color: '#f0f0f0' },
                            { id: 'Sapphire', color: '#0f52ba' },
                            { id: 'Ruby', color: '#e0115f' },
                            { id: 'Emerald', color: '#50c878' }
                        ].map(g => (
                            <Card
                                key={g.id}
                                label={g.id}
                                color={g.color}
                                active={materials.gem === g.id as any}
                                onClick={() => updateMaterials({ gem: g.id as any })}
                            />
                        ))}
                    </div>

                    <div className="flex-1" /> {/* Spacer */}

                    {/* EXPORT ACTION */}
                    <div className="p-4 border-t border-[#333]">
                        <button onClick={() => setShowPreview(true)} className="w-full py-3 bg-[#40a9ff] hover:bg-[#3090ef] text-white font-bold rounded shadow-lg shadow-blue-900/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                            <Icons.Select className="w-4 h-4" />
                            Preview & Export
                        </button>
                    </div>

                </aside>
            </div>
        </div>
    )
}
