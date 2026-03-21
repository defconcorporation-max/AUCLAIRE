import React, { useState, Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import { useRing, ToolType, MetalType, ProfileType, type GemType, type RingConfig } from '../../context/RingContext'
import { Icons } from '../ui/Icons'
const Viewport3D = lazy(() => import('../3d/Viewport3D'))
import PreviewModal from '../ui/PreviewModal'
import SaveLoadModal from '../ui/SaveLoadModal'
import { generateSpecSheet } from '../../utils/pdfGenerator'
import { CAD_SHAPE_KEYS, CAD_METAL_KEYS, CAD_GEM_KEYS, CAD_PROFILE_KEYS } from './cadLayoutLabels'

// --- HELPER COMPONENTS ---

const TOOL_I18N: Record<ToolType, string> = {
    select: 'toolSelect',
    move: 'toolMove',
    scale: 'toolScale',
    rotate: 'toolRotate',
    sculpt: 'toolSculpt',
    prongs: 'toolProngs',
    stones: 'toolStones',
    shank: 'toolShank',
    render: 'toolRender',
}

const ToolButton = ({ toolLabel, active, onClick, icon: IconComp }: { toolLabel: string, active: boolean, onClick: () => void, icon: React.ElementType }) => (
    <button
        onClick={onClick}
        className={`w-10 h-10 flex flex-col items-center justify-center rounded-md transition-colors ${active ? 'bg-[#40a9ff] text-white' : 'text-gray-400 hover:bg-[#333] hover:text-white'}`}
        title={toolLabel}
    >
        {React.createElement(IconComp as React.ComponentType<React.SVGProps<SVGSVGElement>>, { className: 'w-5 h-5 mb-[1px]' })}
        <span className="text-[8px] uppercase font-bold tracking-tighter opacity-70">{toolLabel}</span>
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
    const { t } = useTranslation()
    const {
        currentTool, setTool,
        ringConfig, updateRing,
        materials, updateMaterials
    } = useRing()

    const [showPreview, setShowPreview] = useState(false)
    const [showSaveLoad, setShowSaveLoad] = useState(false)

    const handleExport = () => {
        // 1. Capture Canvas
        const canvas = document.querySelector('canvas')
        const imageUrl = canvas ? canvas.toDataURL('image/png') : ''

        // 2. Generate PDF
        generateSpecSheet(ringConfig, materials, imageUrl, t('cadLayout.pdfDesignName'))
    }

    const tools: { id: ToolType, icon: React.ElementType }[] = [
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

    type MockCatalogComponent = {
        id: number;
        nameKey: string;
        type: 'head' | 'shank';
        value: string;
    };

    const mockComponents: MockCatalogComponent[] = [
        { id: 1, nameKey: 'mockSolitaireHead', type: 'head', value: 'Solitaire' },
        { id: 2, nameKey: 'mockHaloHead', type: 'head', value: 'Halo' },
        { id: 3, nameKey: 'mockThreeStone', type: 'head', value: 'Three-Stone' },
        { id: 4, nameKey: 'mockSplitShank', type: 'shank', value: 'Split' },
        { id: 5, nameKey: 'mockTwistShank', type: 'shank', value: 'Twist' },
        { id: 6, nameKey: 'mockBezelHead', type: 'head', value: 'Bezel Head' },
        { id: 7, nameKey: 'mockPaveShank', type: 'shank', value: 'Pave' },
        { id: 8, nameKey: 'mockVintageHead', type: 'head', value: 'Vintage' },
    ]

    const handleComponentClick = (comp: MockCatalogComponent) => {
        if (comp.type === 'head') {
            updateRing({ head: { style: comp.value as RingConfig['head']['style'] } })
        } else if (comp.type === 'shank') {
            if (comp.value === 'Pave') {
                updateRing({ sideStones: { active: true } })
            } else {
                updateRing({ shank: { style: comp.value as RingConfig['shank']['style'] } })
            }
        }
    }

    return (
        <div className="w-screen h-screen bg-[#111] text-gray-200 flex flex-col font-sans overflow-hidden selection:bg-[#40a9ff] selection:text-white">

            {/* 1. TOP BAR */}
            {showPreview && <PreviewModal config={ringConfig} materials={materials} onClose={() => setShowPreview(false)} />}
            {showSaveLoad && <SaveLoadModal onClose={() => setShowSaveLoad(false)} />}

            <header className="h-10 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-2 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 px-2">
                        {(['menuFile', 'menuEdit', 'menuView', 'menuTools'] as const).map(m => (
                            <button key={m} className="px-3 py-1 text-[11px] text-gray-400 hover:bg-[#333] hover:text-white rounded transition-colors">{t(`cadLayout.${m}`)}</button>
                        ))}
                    </div>
                    {/* SAVE / LOAD BUTTON */}
                    <button
                        onClick={() => setShowSaveLoad(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-[#222] hover:bg-[#333] border border-[#333] rounded text-[10px] text-gray-300 font-bold uppercase tracking-wider transition-colors"
                    >
                        <Icons.Save className="w-3 h-3 text-[#40a9ff]" />
                        {t('cadLayout.saveLoad')}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="px-3 py-1.5 text-[10px] font-bold text-luxury-gold border border-luxury-gold/30 hover:bg-luxury-gold/10 rounded mr-2 transition-colors uppercase tracking-wider"
                    >
                        {t('cadLayout.management')}
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white"><Icons.Bell className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-400 hover:text-white"><Icons.User className="w-4 h-4" /></button>
                    <button className="ml-2 px-4 py-1.5 bg-[#40a9ff] hover:bg-[#3090ef] text-white text-[11px] font-bold rounded flex items-center gap-2">
                        <Icons.Render className="w-3 h-3" />
                        {t('cadLayout.render')}
                    </button>
                    <span className="text-[9px] text-gray-600 font-mono ml-2">v1.1</span>
                    <button
                        onClick={() => { localStorage.removeItem('auclaire_designs'); window.location.reload() }}
                        className="text-[9px] text-red-900 hover:text-red-500 ml-1"
                        title={t('cadLayout.resetTitle')}
                    >
                        {t('cadLayout.reset')}
                    </button>
                </div>
            </header>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex overflow-hidden">

                {/* 2. LEFT TOOLBOX */}
                <aside className="w-14 bg-[#1a1a1a] border-r border-[#333] flex flex-col items-center py-2 gap-1 shrink-0 z-10">
                    {tools.map(tool => (
                        <ToolButton
                            key={tool.id}
                            toolLabel={t(`cadLayout.${TOOL_I18N[tool.id]}`)}
                            active={currentTool === tool.id}
                            onClick={() => setTool(tool.id)}
                            icon={tool.icon}
                        />
                    ))}
                </aside>

                {/* 3. CENTER VIEWPORT */}
                <main className="flex-1 relative bg-[#050505] flex flex-col min-w-0">
                    {/* 3D View */}
                    <div className="flex-1 relative">
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-[#40a9ff] text-[10px] font-mono tracking-widest animate-pulse">{t('cadLayout.initEngine')}</div>}>
                            <Viewport3D />
                        </Suspense>
                    </div>

                    {/* 4. BOTTOM TRAY (Components) */}
                    <div className="h-32 bg-[#1a1a1a] border-t border-[#333] flex flex-col shrink-0">
                        <div className="px-4 py-1.5 bg-[#222] border-b border-[#333] flex gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span className="text-white border-b-2 border-[#40a9ff]">{t('cadLayout.tabShanks')}</span>
                            <span className="hover:text-white cursor-pointer">{t('cadLayout.tabHeads')}</span>
                            <span className="hover:text-white cursor-pointer">{t('cadLayout.tabSideStones')}</span>
                            <span className="hover:text-white cursor-pointer">{t('cadLayout.tabDecoration')}</span>
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
                                    <span className={`text-[8px] font-mono text-center leading-tight px-1 ${(ringConfig.head.style === c.value || ringConfig.shank.style === c.value) ? 'text-[#40a9ff] font-bold' : 'text-gray-500'}`}>{t(`cadLayout.${c.nameKey}`)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* 5. RIGHT PROPERTIES */}
                <aside className="w-72 bg-[#1a1a1a] border-l border-[#333] flex flex-col shrink-0 overflow-y-auto z-10 custom-scrollbar">

                    {/* A. GEMSTONE LIBRARY */}
                    <SectionHeader title={t('cadLayout.sectionCenterStone')} />
                    <div className="p-3 grid grid-cols-3 gap-2">
                        {gemShapes.map(s => (
                            <button
                                key={s}
                                onClick={() => updateRing({ gem: { ...ringConfig.gem, shape: s } })}
                                className={`flex flex-col items-center p-2 rounded border ${ringConfig.gem.shape === s ? 'bg-[#40a9ff]/20 border-[#40a9ff]' : 'border-[#333] hover:bg-[#333]'}`}
                            >
                                <Icons.Diamond className={`w-6 h-6 mb-1 ${ringConfig.gem.shape === s ? 'text-[#40a9ff]' : 'text-gray-500'}`} />
                                <span className="text-[8px] uppercase">{t(`cadLayout.${CAD_SHAPE_KEYS[s]}`)}</span>
                            </button>
                        ))}
                    </div>



                    {/* A3. THREE-STONE CONFIG */}
                    {ringConfig.head.style === 'Three-Stone' && (
                        <>
                            <SectionHeader title={t('cadLayout.sectionSideGems3')} />
                            <div className="p-3 grid grid-cols-3 gap-2">
                                {['Pear', 'Round', 'Princess', 'Bagquette', 'Oval'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateRing({ threeStone: { shape: s } })}
                                        className={`flex flex-col items-center p-2 rounded border ${ringConfig.threeStone?.shape === s ? 'bg-[#40a9ff]/20 border-[#40a9ff]' : 'border-[#333] hover:bg-[#333]'}`}
                                    >
                                        <Icons.Diamond className={`w-3 h-3 mb-1 ${ringConfig.threeStone?.shape === s ? 'text-[#40a9ff]' : 'text-gray-500'}`} />
                                        <span className="text-[7px] uppercase">{t(`cadLayout.${CAD_SHAPE_KEYS[s]}`)}</span>
                                    </button>
                                ))}
                            </div>
                            <PropRow label={t('cadLayout.propSideSize')} value={`${ringConfig.threeStone?.size || 0.5}x`}>
                                <input type="range" min="0.2" max="1.0" step="0.05" value={ringConfig.threeStone?.size || 0.5} onChange={e => updateRing({ threeStone: { size: parseFloat(e.target.value) } })} className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-[#40a9ff]" />
                            </PropRow>
                        </>
                    )}

                    {/* A2. SIDE STONES (PAVE) */}
                    <SectionHeader title={t('cadLayout.sectionSideStones')} />
                    <div className="p-3 grid grid-cols-3 gap-2">
                        {['Round', 'Princess', 'Pear', 'Marquise', 'Oval'].map(s => (
                            <button
                                key={s}
                                onClick={() => updateRing({ sideStones: { ...ringConfig.sideStones, style: s, active: true } })}
                                className={`flex flex-col items-center p-2 rounded border ${ringConfig.sideStones.style === s ? 'bg-[#40a9ff]/20 border-[#40a9ff]' : 'border-[#333] hover:bg-[#333]'}`}
                            >
                                <Icons.Diamond className={`w-3 h-3 mb-1 ${ringConfig.sideStones.style === s ? 'text-[#40a9ff]' : 'text-gray-500'}`} />
                                <span className="text-[7px] uppercase">{t(`cadLayout.${CAD_SHAPE_KEYS[s]}`)}</span>
                            </button>
                        ))}
                    </div>

                    {/* B. STONE SETTINGS */}
                    <SectionHeader title={t('cadLayout.sectionStoneSettings')} />
                    <PropRow label={t('cadLayout.propSizeCt')} value={`${ringConfig.gem.size}ct`}>
                        <input type="range" min="0.5" max="5.0" step="0.1" value={ringConfig.gem.size} onChange={e => updateRing({ gem: { ...ringConfig.gem, size: parseFloat(e.target.value) } })} className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-[#40a9ff]" />
                    </PropRow>
                    <PropRow label={t('cadLayout.propProngs')}>
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
                            <option value="4-Prong">{t('cadLayout.prong4')}</option>
                            <option value="6-Prong">{t('cadLayout.prong6')}</option>
                            <option value="Bezel">{t('cadLayout.bezel')}</option>
                        </select>
                    </PropRow>
                    <PropRow label={t('cadLayout.propGallery')}>
                        <select
                            value={ringConfig.head.gallery || 'Rail'}
                            onChange={(e) => updateRing({ head: { ...ringConfig.head, gallery: e.target.value as 'Rail' | 'Basket' | 'Trellis' | 'None' } })}
                            className="w-full bg-[#111] border border-[#333] text-xs p-1 rounded text-gray-300 outline-none focus:border-[#40a9ff]"
                        >
                            <option value="Rail">{t('cadLayout.rail')}</option>
                            <option value="Basket">{t('cadLayout.basket')}</option>
                            <option value="Trellis">{t('cadLayout.trellis')}</option>
                            <option value="None">{t('cadLayout.none')}</option>
                        </select>
                    </PropRow>

                    {/* C. SHANK PROPERTIES */}
                    <SectionHeader title={t('cadLayout.sectionShankProps')} />
                    <PropRow label={t('cadLayout.propProfile')}>
                        <div className="flex gap-1">
                            {(["Court", "Flat", "D-Shape"] as const).map(p => (
                                <button key={p} onClick={() => updateRing({ shank: { ...ringConfig.shank, profile: p as ProfileType } })} className={`flex-1 text-[9px] py-1 border rounded ${ringConfig.shank.profile === p ? 'bg-[#40a9ff] border-[#40a9ff] text-white' : 'border-[#333] text-gray-400'}`}>{t(`cadLayout.${CAD_PROFILE_KEYS[p]}`)}</button>
                            ))}
                        </div>
                    </PropRow>
                    <PropRow label={t('cadLayout.propBandWidth')} value={`${ringConfig.shank.width}mm`}>
                        <input type="range" min="1.5" max="6.0" step="0.1" value={ringConfig.shank.width} onChange={e => updateRing({ shank: { ...ringConfig.shank, width: parseFloat(e.target.value) } })} className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-[#40a9ff]" />
                    </PropRow>
                    <PropRow label={t('cadLayout.propBandThickness')} value={`${ringConfig.shank.thickness}mm`}>
                        <input type="range" min="1.0" max="3.0" step="0.1" value={ringConfig.shank.thickness} onChange={e => updateRing({ shank: { ...ringConfig.shank, thickness: parseFloat(e.target.value) } })} className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-[#40a9ff]" />
                    </PropRow>
                    <PropRow label={t('cadLayout.propPaveStones')} value={ringConfig.sideStones.active ? t('cadLayout.on') : t('cadLayout.off')}>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={ringConfig.sideStones.active} onChange={e => updateRing({ sideStones: { ...ringConfig.sideStones, active: e.target.checked } })} className="w-4 h-4 accent-[#40a9ff]" />
                            {ringConfig.sideStones.active && (
                                <input type="range" min="0.1" max="1.0" step="0.1" value={ringConfig.sideStones.length} onChange={e => updateRing({ sideStones: { ...ringConfig.sideStones, length: parseFloat(e.target.value) } })} className="flex-1 h-1 bg-gray-700 rounded-full appearance-none accent-purple-500" />
                            )}
                        </div>
                    </PropRow>

                    {/* C2. ENGRAVING */}
                    <SectionHeader title={t('cadLayout.sectionEngraving')} />
                    <div className="p-3 space-y-2">
                        <PropRow label={t('cadLayout.propText')}>
                            <input
                                type="text"
                                placeholder={t('cadLayout.engravingPlaceholder')}
                                value={ringConfig.engraving?.text || ''}
                                onChange={e => updateRing({ engraving: { text: e.target.value } })}
                                className="w-full bg-[#111] border border-[#333] text-xs p-1 rounded text-gray-300 outline-none focus:border-[#40a9ff]"
                            />
                        </PropRow>
                        {ringConfig.engraving?.text && (
                            <PropRow label={t('cadLayout.propSize')}>
                                <input
                                    type="range"
                                    min="0.3"
                                    max="1.0"
                                    step="0.1"
                                    value={ringConfig.engraving?.size || 0.5}
                                    onChange={e => updateRing({ engraving: { size: parseFloat(e.target.value) } })}
                                    className="w-full h-1 bg-gray-700 rounded-full appearance-none accent-[#40a9ff]"
                                />
                            </PropRow>
                        )}
                    </div>

                    {/* D. MATERIALS */}
                    <SectionHeader title={t('cadLayout.sectionMaterials')} />
                    <div className="p-3 grid grid-cols-2 gap-2">
                        {metals.map(m => (
                            <Card
                                key={m.id}
                                label={t(`cadLayout.${CAD_METAL_KEYS[m.id]}`)}
                                color={m.color}
                                active={materials.metal === m.id}
                                onClick={() => updateMaterials({ metal: m.id })}
                            />
                        ))}
                    </div>

                    <div className="px-4 py-1 text-[9px] font-bold text-gray-500 uppercase">{t('cadLayout.gemStoneLabel')}</div>
                    <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                        {[
                            { id: 'Diamond', color: '#f0f0f0' },
                            { id: 'Sapphire', color: '#0f52ba' },
                            { id: 'Ruby', color: '#e0115f' },
                            { id: 'Emerald', color: '#50c878' }
                        ].map(g => (
                            <Card
                                key={g.id}
                                label={t(`cadLayout.${CAD_GEM_KEYS[g.id]}`)}
                                color={g.color}
                                active={materials.gem === (g.id as GemType)}
                                onClick={() => updateMaterials({ gem: g.id as GemType })}
                            />
                        ))}
                    </div>

                    <div className="flex-1" /> {/* Spacer */}

                    {/* EXPORT ACTION */}
                    <div className="p-4 border-t border-[#333]">
                        <button onClick={handleExport} className="w-full py-3 bg-[#40a9ff] hover:bg-[#3090ef] text-white font-bold rounded shadow-lg shadow-blue-900/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                            <Icons.Select className="w-4 h-4" />
                            {t('cadLayout.previewExportPdf')}
                        </button>
                    </div>

                </aside>
            </div >
        </div >
    )
}
