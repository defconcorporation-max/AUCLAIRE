import React from 'react'

// Simple SVG Icon Wrapper
export const Icon = ({ path, className = "w-5 h-5", fill = "none", stroke = "currentColor" }: { path: React.ReactNode, className?: string, fill?: string, stroke?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {path}
    </svg>
)

// --- ICONS (Lucide Style) ---

export const Icons = {
    Select: (props: any) => <Icon {...props} path={<><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></>} />,
    Move: (props: any) => <Icon {...props} path={<><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><polyline points="19 9 22 12 19 15" /><polyline points="15 19 12 22 9 19" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></>} />,
    Rotate: (props: any) => <Icon {...props} path={<path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />} />,
    Scale: (props: any) => <Icon {...props} path={<><path d="M21 3l-6 6" /><path d="M21 3v6" /><path d="M21 3h-6" /><path d="M3 21l6-6" /><path d="M3 21v-6" /><path d="M3 21h-6" /><path d="M14.5 9.5L9.5 14.5" /></>} />,
    Sculpt: (props: any) => <Icon {...props} path={<><path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z" /><path d="M9 7l-7 7v7h7l7-7" /></>} />,
    Prong: (props: any) => <Icon {...props} path={<><circle cx="12" cy="12" r="3" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" /></>} />,
    Diamond: (props: any) => <Icon {...props} path={<path d="M6 3h12l4 6-10 13L2 9z" />} />,
    Ring: (props: any) => <Icon {...props} path={<circle cx="12" cy="12" r="7" />} />,
    Render: (props: any) => <Icon {...props} path={<><path d="M12 20v-6M6 20V10M18 20V4" /></>} />, // Bar chart ish

    // UI
    Menu: (props: any) => <Icon {...props} path={<><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></>} />,
    Bell: (props: any) => <Icon {...props} path={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>} />,
    User: (props: any) => <Icon {...props} path={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />,
    Grid: (props: any) => <Icon {...props} path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></>} />,
    ChevronDown: (props: any) => <Icon {...props} path={<polyline points="6 9 12 15 18 9" />} />,
    Close: (props: any) => <Icon {...props} path={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />
}
