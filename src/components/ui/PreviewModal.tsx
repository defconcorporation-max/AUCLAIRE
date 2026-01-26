// import React from 'react' // Unused with new JSX transform
import { Icons } from './Icons' /** Icons import might need adjustment based on where icons are located, usually ../ui/Icons */
/** actually Icons is exported from ./Icons.tsx in the same folder usually or ../ui/Icons */
/** The file path for Icons is F:/Entreprises/Auclaire/Auclaire APP/src/components/ui/Icons.tsx */
/** So from F:/Entreprises/Auclaire/Auclaire APP/src/components/ui/PreviewModal.tsx it is ./Icons */

interface PreviewModalProps {
    config: any; // RingConfig
    materials: any; // RingMaterials
    onClose: () => void;
}

export default function PreviewModal({ config, materials, onClose }: PreviewModalProps) {

    // Mock Price Calculation
    const basePrice = 800; // Gold band
    const gemPrices: Record<string, number> = {
        'Round': 1000, 'Princess': 1100, 'Emerald': 1200, 'Oval': 1150,
        'Pear': 1150, 'Cushion': 1100, 'Radiant': 1250, 'Asscher': 1300,
        'Heart': 1400, 'Marquise': 1200
    }

    const gemFactor = (config.gemSize || 1.0) * (config.gemSize || 1.0); // Exponential price for carat
    const gemPrice = (gemPrices[config.gemShape || 'Round'] || 1000) * gemFactor;

    // Settings Logic
    const headPrice = config.headType === 'Halo' ? 400 : (config.headType === 'Three-Stone' ? 600 : 0)
    const shankPrice = config.shankType === 'Split' ? 200 : (config.shankType === 'Twist' ? 150 : (config.shankType === 'Cathedral' ? 100 : 0))
    const pavePrice = (config.coverage || 0) * 800; // Pave usually adds up

    const totalPrice = Math.round(basePrice + gemPrice + headPrice + shankPrice + pavePrice);

    const handleDownloadSpec = () => {
        alert("Downloading Spec Sheet (PDF)...\n\n[STUB] This feature would generate a PDF with technical drawings and specs.")
    }

    const handleExportModel = () => {
        alert("Exporting 3D Model (STL)...\n\n[STUB] This feature would trigger a GLTF/STL export of the current scene.")
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[500px] bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="h-12 bg-[#222] border-b border-[#333] flex items-center justify-between px-4">
                    <span className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Icons.Select className="w-4 h-4 text-[#40a9ff]" />
                        Design Preview
                    </span>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <Icons.Close className="w-5 h-5" />
                        {/* Note: Check if Close icon exists, if not use X */}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-6">

                    {/* Summary Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Center Stone</span>
                            <div className="text-white text-sm font-medium">{config.gemShape || 'Round'} Diamond</div>
                            <div className="text-[#40a9ff] text-xs font-mono">{config.gemSize || 1.0} Carat</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Metal</span>
                            <div className="text-white text-sm font-medium">{materials.metal || 'Gold (18k)'}</div>
                            <div className="text-gray-400 text-xs text-xs">High Polish Finish</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Setting Style</span>
                            <div className="text-white text-sm font-medium">{config.headType || 'Solitaire'}</div>
                            <div className="text-gray-400 text-xs">{config.settingStyle || '4-Prong'}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Band Style</span>
                            <div className="text-white text-sm font-medium">{config.shankType || 'Classic'}</div>
                            <div className="text-gray-400 text-xs">{config.profile || 'Court'} Profile</div>
                        </div>
                    </div>

                    {/* Price Estimate */}
                    <div className="p-4 bg-[#111] border border-[#333] rounded flex items-center justify-between">
                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Estimated Value</span>
                        <span className="text-xl text-[#40a9ff] font-mono font-bold">${totalPrice.toLocaleString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-2">
                        <button onClick={handleDownloadSpec} className="flex-1 py-3 bg-[#333] hover:bg-[#444] text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                            Spec Sheet
                        </button>
                        <button onClick={handleExportModel} className="flex-1 py-3 bg-[#40a9ff] hover:bg-[#3090ef] text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                            Download model
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
