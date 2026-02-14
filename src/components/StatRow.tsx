import React from 'react';

interface StatRowProps {
    label: string;
    value: string | number | undefined;
    highlight?: boolean;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, highlight = false }) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/40 last:border-0">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</span>
        <span className={`text-sm font-semibold ${highlight ? 'text-indigo-400' : 'text-slate-200'}`}>{value}</span>
    </div>
);

export default StatRow;
