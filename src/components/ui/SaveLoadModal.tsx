import React, { useState } from 'react'
import { useRing, SavedDesign } from '../../context/RingContext'
import { Icons } from '../ui/Icons'

export default function SaveLoadModal({ onClose }: { onClose: () => void }) {
    const { ringConfig, savedDesigns, saveDesign, loadDesign, deleteDesign } = useRing()
    const [mode, setMode] = useState<'save' | 'load'>('load')
    const [saveName, setSaveName] = useState('')

    const handleSave = () => {
        if (!saveName.trim()) return
        saveDesign(saveName)
        setSaveName('')
        setMode('load') // Switch to load view to see it
    }

    const handleLoad = (design: SavedDesign) => {
        if (confirm(`Load design "${design.name}"? Unsaved changes will be lost.`)) {
            loadDesign(design)
            onClose()
        }
    }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm("Are you sure you want to delete this design?")) {
            deleteDesign(id)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[500px] bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#222]">
                    <div className="flex gap-4 text-sm font-bold uppercase tracking-wider">
                        <button
                            onClick={() => setMode('load')}
                            className={`${mode === 'load' ? 'text-[#40a9ff]' : 'text-gray-500 hover:text-white'} transition-colors`}
                        >
                            Load Design
                        </button>
                        <button
                            onClick={() => setMode('save')}
                            className={`${mode === 'save' ? 'text-[#40a9ff]' : 'text-gray-500 hover:text-white'} transition-colors`}
                        >
                            Save As...
                        </button>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto">

                    {mode === 'save' && (
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-[#111] border border-[#333] rounded">
                                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Current Design</h3>
                                <div className="text-white text-sm">
                                    {ringConfig.gem.size}ct {ringConfig.gem.shape} {ringConfig.gem.type} <br />
                                    {ringConfig.metal} • {ringConfig.head.style} • {ringConfig.shank.style}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-gray-400">Design Name</label>
                                <input
                                    type="text"
                                    value={saveName}
                                    onChange={e => setSaveName(e.target.value)}
                                    placeholder="e.g. Vintage Rose Gold Oval"
                                    className="bg-[#111] border border-[#333] p-2 rounded text-white focus:border-[#40a9ff] outline-none"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={!saveName.trim()}
                                className="mt-2 py-2 bg-[#40a9ff] hover:bg-[#3090ef] text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                SAVE DESIGN
                            </button>
                        </div>
                    )}

                    {mode === 'load' && (
                        <div className="flex flex-col gap-2">
                            {savedDesigns.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 text-sm">
                                    No saved designs found.
                                </div>
                            ) : (
                                savedDesigns.map(design => (
                                    <div
                                        key={design.id}
                                        onClick={() => handleLoad(design)}
                                        className="group p-3 bg-[#111] border border-[#333] hover:border-[#40a9ff] rounded cursor-pointer flex justify-between items-center transition-all"
                                    >
                                        <div>
                                            <div className="text-white font-bold text-sm group-hover:text-[#40a9ff]">{design.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(design.date).toLocaleDateString()} • {design.config.gem.size}ct {design.config.gem.shape}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(design.id, e)}
                                            className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
