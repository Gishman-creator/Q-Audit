import React, { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, ReferenceLine, LabelList
} from 'recharts';
import { type DataPoint, type ReportMeta } from '../utils/parser';

interface DashboardProps {
    data: DataPoint[];
    initialDeposit: number;
    reportMeta: ReportMeta;
}

const Dashboard: React.FC<DashboardProps> = ({ data, initialDeposit, reportMeta }) => {
    const [perfView, setPerfView] = useState('monthly');
    const [viewMode, setViewMode] = useState('percentage');
    const primaryColor = '#6366f1';

    const chartStats = useMemo(() => {
        if (data.length === 0) return { monthly: [], yearly: [] };

        const mSub: Record<string, { label: string; profit: number; startBal: number }> = {};
        const ySub: Record<string, { label: string; profit: number; startBal: number }> = {};
        let runningBal = initialDeposit || data[0].balance;

        data.forEach(deal => {
            const year = deal.date.getFullYear();
            const month = deal.date.toLocaleString('default', { month: 'short' });
            const mKey = `${year}-${month}`;

            if (!mSub[mKey]) mSub[mKey] = { label: mKey, profit: 0, startBal: runningBal };
            if (!ySub[year]) ySub[year] = { label: year.toString(), profit: 0, startBal: runningBal };

            const isTrade = deal.type
                ? !['balance', 'deposit', 'withdrawal'].some(t => deal.type?.includes(t))
                : deal.volume > 0;

            if (isTrade) {
                mSub[mKey].profit += deal.profit;
                ySub[year].profit += deal.profit;
            }

            runningBal += deal.profit;
        });

        const format = (obj: any) => Object.values(obj).map((v: any) => ({
            ...v,
            val: parseFloat((viewMode === 'percentage' ? (v.profit / v.startBal) * 100 : v.profit).toFixed(2))
        }));

        return { monthly: format(mSub), yearly: format(ySub) };
    }, [data, initialDeposit, viewMode]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#11141d] p-5 rounded-2xl border border-slate-800 shadow-sm"><p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Initial Balance</p><p className="text-xl font-bold text-white">${initialDeposit}</p></div>
                <div className="bg-[#11141d] p-5 rounded-2xl border border-slate-800 shadow-sm col-span-2"><p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Test Period</p><p className="text-sm font-medium text-slate-300">{reportMeta.period}</p></div>
                <div className="bg-[#11141d] p-5 rounded-2xl border border-slate-800 shadow-sm"><p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Total Net Profit</p><p className="text-xl font-bold text-emerald-400">{reportMeta.totalNetProfit}</p></div>
            </div>

            <div className="bg-[#11141d] p-6 rounded-3xl border border-slate-800 h-[380px] shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="5 5" stroke="#1c212c" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#11141d', border: '1px solid #334155', borderRadius: '12px' }} />
                        <Line type="stepAfter" dataKey="balance" stroke={primaryColor} strokeWidth={3} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-[#11141d] p-8 rounded-3xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                    <select value={perfView} onChange={(e) => setPerfView(e.target.value)} className="bg-transparent text-xl font-black text-white outline-none cursor-pointer">
                        <option value="monthly" className="bg-[#11141d]">MONTHLY GAINS</option>
                        <option value="yearly" className="bg-[#11141d]">YEARLY GAINS</option>
                    </select>
                    <div className="flex bg-[#080a0f] p-1 rounded-lg border border-slate-800">
                        <button onClick={() => setViewMode('percentage')} className={`px-4 py-1 text-[10px] font-bold rounded ${viewMode === 'percentage' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>%</button>
                        <button onClick={() => setViewMode('money')} className={`px-4 py-1 text-[10px] font-bold rounded ${viewMode === 'money' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>$</button>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={perfView === 'monthly' ? chartStats.monthly : chartStats.yearly} margin={{ top: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1c212c" />
                            <XAxis dataKey="label" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ background: '#11141d', border: '1px solid #334155' }} />
                            <ReferenceLine y={0} stroke="#475569" />
                            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="val" position="top" fill="#94a3b8" fontSize={10} formatter={(v: any) => viewMode === 'percentage' ? `${v}%` : `$${v}`} />
                                {(perfView === 'monthly' ? chartStats.monthly : chartStats.yearly).map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
