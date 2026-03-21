import { RingConfig, MaterialConfig } from '@/context/RingContext';
import { useTranslation } from 'react-i18next';
// import React from 'react' // Unused with new JSX transform
import { Icons } from './Icons' /** Icons import might need adjustment based on where icons are located, usually ../ui/Icons */
/** actually Icons is exported from ./Icons.tsx in the same folder usually or ../ui/Icons */
/** The file path for Icons is F:/Entreprises/Auclaire/Auclaire APP/src/components/ui/Icons.tsx */
/** So from F:/Entreprises/Auclaire/Auclaire APP/src/components/ui/PreviewModal.tsx it is ./Icons */

interface PreviewModalProps {
    config: RingConfig;
    materials: MaterialConfig;
    onClose: () => void;
}

export default function PreviewModal({ config, materials, onClose }: PreviewModalProps) {
    const { t } = useTranslation();

    // Mock Price Calculation
    const basePrice = 800; // Gold band
    const gemPrices: Record<string, number> = {
        'Round': 1000, 'Princess': 1100, 'Emerald': 1200, 'Oval': 1150,
        'Pear': 1150, 'Cushion': 1100, 'Radiant': 1250, 'Asscher': 1300,
        'Heart': 1400, 'Marquise': 1200
    }

    const gemFactor = (config.gem.size || 1.0) * (config.gem.size || 1.0); // Exponential price for carat
    const gemPrice = (gemPrices[config.gem.shape || 'Round'] || 1000) * gemFactor;

    // Settings Logic
    const headPrice = config.head.style === 'Halo' ? 400 : (config.head.style === 'Three-Stone' ? 600 : 0)
    const shankPrice = config.shank.style === 'Split' ? 200 : (config.shank.style === 'Twist' ? 150 : (config.shank.style === 'Cathedral' ? 100 : 0))
    const pavePrice = (config.sideStones.active ? 1 : 0) * 800; // Pave usually adds up

    const totalPrice = Math.round(basePrice + gemPrice + headPrice + shankPrice + pavePrice);

    const handleDownloadSpec = () => {
        alert(t('previewModal.alertPdfStub'))
    }

    const handleExportModel = () => {
        alert(t('previewModal.alertModelStub'))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[500px] bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="h-12 bg-[#222] border-b border-[#333] flex items-center justify-between px-4">
                    <span className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Icons.Select className="w-4 h-4 text-[#40a9ff]" />
                        {t('previewModal.title')}
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
                            <span className="text-[10px] text-gray-400 uppercase font-bold">{t('previewModal.centerStone')}</span>
                            <div className="text-white text-sm font-medium">{t('previewModal.diamondLine', { shape: config.gem.shape || 'Round' })}</div>
                            <div className="text-[#40a9ff] text-xs font-mono">{t('previewModal.caratLine', { ct: config.gem.size || 1.0 })}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">{t('previewModal.metal')}</span>
                            <div className="text-white text-sm font-medium">{materials.metal || t('previewModal.defaultMetal')}</div>
                            <div className="text-gray-300 text-xs">{t('previewModal.highPolish')}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">{t('previewModal.settingStyle')}</span>
                            <div className="text-white text-sm font-medium">{config.head.style || 'Solitaire'}</div>
                            <div className="text-gray-300 text-xs">{config.head.prongStyle || '4-Prong'}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">{t('previewModal.bandStyle')}</span>
                            <div className="text-white text-sm font-medium">{config.shank.style || 'Classic'}</div>
                            <div className="text-gray-300 text-xs">{t('previewModal.profileLine', { profile: config.shank.profile || 'Court' })}</div>
                        </div>
                    </div>

                    {/* Price Estimate */}
                    <div className="p-4 bg-[#111] border border-[#333] rounded flex items-center justify-between">
                        <span className="text-xs text-gray-300 uppercase font-bold tracking-wider">{t('previewModal.estimatedValue')}</span>
                        <span className="text-xl text-[#40a9ff] font-mono font-bold">${totalPrice.toLocaleString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-2">
                        <button onClick={handleDownloadSpec} className="flex-1 py-3 bg-[#333] hover:bg-[#444] text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                            {t('previewModal.specSheet')}
                        </button>
                        <button onClick={handleExportModel} className="flex-1 py-3 bg-[#40a9ff] hover:bg-[#3090ef] text-white font-bold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
                            {t('previewModal.downloadModel')}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
