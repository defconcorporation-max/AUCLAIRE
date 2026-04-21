import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
    status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
    const { t } = useTranslation();
    const styles: Record<string, string> = {
        designing: 'bg-white/5 text-blue-300 border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]',
        '3d_model': 'bg-white/5 text-purple-300 border-purple-500/30 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]',
        design_ready: 'bg-white/5 text-cyan-300 border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]',
        waiting_for_approval: 'bg-white/5 text-sky-300 border-sky-500/30 shadow-[inset_0_0_10px_rgba(14,165,233,0.1)]',
        design_modification: 'bg-white/5 text-orange-300 border-orange-500/30 shadow-[inset_0_0_10px_rgba(249,115,22,0.1)]',
        approved_for_production: 'bg-white/5 text-emerald-300 border-emerald-500/30 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]',
        production: 'bg-white/5 text-amber-300 border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]',
        waiting_for_dispatch: 'bg-white/5 text-teal-300 border-teal-500/30 shadow-[inset_0_0_10px_rgba(20,184,166,0.1)]',
        delivery: 'bg-white/5 text-indigo-300 border-indigo-500/30 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]',
        completed: 'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30 shadow-[inset_0_0_10px_rgba(210,181,123,0.15)]',
        cancelled: 'bg-white/5 text-red-300 border-red-500/30 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]',
    };

    const label = t(`projectStatus.${status}`, { defaultValue: status.replace(/_/g, ' ') }).toUpperCase();

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-medium tracking-widest border transition-all duration-300 ${styles[status] || 'bg-white/5 text-gray-400 border-white/10'}`}>
            {(status === 'designing' || status === 'production' || status === '3d_model') && (
                <span className="w-1 h-1 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
            )}
            {label}
        </span>
    );
};
