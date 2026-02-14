import React, { useState, useMemo, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, ReferenceLine, LabelList
} from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { type DataPoint, type ReportMeta } from '../utils/parser';
import { calculateStats } from '../utils/statistics';
import { setLotSize } from '../store/simulationSlice';
import type { RootState } from '../store/store';
import Statistics from './Statistics';

interface SimulationProps {
    data: DataPoint[];
    initialDeposit: number;
    reportMeta: ReportMeta;
}

const Simulation: React.FC<SimulationProps> = ({ data, initialDeposit, reportMeta: originalMeta }) => {
    const dispatch = useDispatch();
    const storedLotSize = useSelector((state: RootState) => state.simulation.lotSize);

    // We use a local state for immediate input feedback, but sync with Redux
    // Actually, dispatching on every keystroke is fine for this app size.
    // But to handle the "uncontrolled -> controlled" transition or initialization properly:
    // We'll trust `storedLotSize` as the source of truth.

    const [perfView, setPerfView] = useState('monthly');
    const [viewMode, setViewMode] = useState('percentage');

    const { isFixedLot, originalLotSize } = useMemo(() => {
        if (data.length === 0) return { isFixedLot: false, originalLotSize: 0 };
        const trades = data.filter(d => d.volume > 0);
        if (trades.length === 0) return { isFixedLot: false, originalLotSize: 0 };

        const firstVol = trades[0].volume;
        const allSame = trades.every(d => d.volume === firstVol);
        return { isFixedLot: allSame, originalLotSize: firstVol };
    }, [data]);

    // Initialize lot size from original if not already set in Redux
    useEffect(() => {
        if (isFixedLot && originalLotSize > 0 && storedLotSize === 0) {
            dispatch(setLotSize(originalLotSize));
        }
    }, [isFixedLot, originalLotSize, storedLotSize, dispatch]);

    const currentLotSize = storedLotSize || 0.1; // Fallback to avoid issues

    const { simulatedData, simulatedMeta, chartStats, comparison } = useMemo(() => {
        if (data.length === 0 || !isFixedLot) {
            return {
                simulatedData: [],
                simulatedMeta: { totalTrades: 0, totalNetProfit: "0.00" } as ReportMeta,
                chartStats: { monthly: [], yearly: [] },
                comparison: { original: 0, simulated: 0, diff: 0, diffPercent: 0 }
            };
        }

        let currentBalance = initialDeposit;

        const simData = data.map(deal => {
            let simulatedProfit = deal.profit;

            if (deal.volume > 0) {
                // Profit = Volume * Points * ValuePerPoint
                // SimProfit = NewLot * (Profit / OldVolume)
                simulatedProfit = (deal.profit / deal.volume) * currentLotSize;
            }

            currentBalance += simulatedProfit;

            return {
                ...deal,
                simulatedBalance: currentBalance,
                simulatedProfit
            };
        });

        // Prepare data for stats calculation (mapping simulated fields to standard fields)
        const statsInput = simData.map(d => ({ ...d, profit: d.simulatedProfit, balance: d.simulatedBalance }));
        const simMeta = calculateStats(statsInput, initialDeposit);

        // Ensure period is set correctly for Statistics component to calculate monthly gain
        if (data.length > 0) {
            const start = data[0].date;
            const end = data[data.length - 1].date;
            const formatDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '.');
            simMeta.period = `Simulated (${formatDate(start)} - ${formatDate(end)})`;
        }

        // Chart Stats (Monthly/Yearly)
        const mSub: Record<string, { label: string; profit: number; startBal: number }> = {};
        const ySub: Record<string, { label: string; profit: number; startBal: number }> = {};
        let runningBal = initialDeposit;

        statsInput.forEach(deal => {
            const year = deal.date.getFullYear();
            const month = deal.date.toLocaleString('default', { month: 'short' });
            const mKey = `${year}-${month}`;

            if (!mSub[mKey]) mSub[mKey] = { label: mKey, profit: 0, startBal: runningBal };
            if (!ySub[year]) ySub[year] = { label: year.toString(), profit: 0, startBal: runningBal };

            // Only count TRADES for performance stats (exclude deposits/withdrawals)
            if (deal.volume > 0) {
                mSub[mKey].profit += deal.profit;
                ySub[year].profit += deal.profit;
            }

            // Balance tracks everything including deposits
            runningBal += deal.profit;
        });

        const format = (obj: any) => Object.values(obj).map((v: any) => ({
            ...v,
            val: parseFloat((viewMode === 'percentage' ? (v.profit / v.startBal) * 100 : v.profit).toFixed(2))
        }));

        const cStats = { monthly: format(mSub), yearly: format(ySub) };

        // Comparison
        const origProfit = parseFloat((originalMeta.totalNetProfit || '0').replace(/\s/g, '').replace(/,/g, ''));
        const simProfit = parseFloat(simMeta.totalNetProfit || '0');
        const diff = simProfit - origProfit;
        const diffPercent = origProfit !== 0 ? (diff / Math.abs(origProfit)) * 100 : 0;

        return {
            simulatedData: simData,
            simulatedMeta: simMeta,
            chartStats: cStats,
            comparison: { original: origProfit, simulated: simProfit, diff, diffPercent }
        };

    }, [data, initialDeposit, currentLotSize, isFixedLot, viewMode, originalMeta]);

    const avgPerWeek = useMemo(() => {
        if (data.length === 0) return 0;
        const firstDate = new Date(data[0].date);
        const lastDate = new Date(data[data.length - 1].date);
        const diffWeeks = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        return (simulatedMeta.totalTrades / diffWeeks).toFixed(2);
    }, [data, simulatedMeta.totalTrades]);

    const handleLotSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            dispatch(setLotSize(val));
        }
    };

    if (!isFixedLot && data.length > 0) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-700 border-2 border-dashed border-slate-900 rounded-[40px] bg-[#11141d]/20 text-center p-8">
                <p className="text-xl font-bold uppercase tracking-widest text-indigo-400 mb-2">Simulation Unavailable</p>
                <p className="text-slate-500">Simulation is only available for strategies with a fixed lot size across all trades.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-[#11141d] p-8 rounded-3xl border border-slate-800 shadow-sm">
                <div className="flex flex-wrap gap-8 items-end mb-8">
                    <div className="flex flex-col gap-2">
                        <label className="text-slate-500 text-xs font-bold uppercase tracking-widest">Fixed Lot Size</label>
                        <div className="flex flex-col">
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={currentLotSize}
                                onChange={handleLotSizeChange}
                                className="bg-[#080a0f] border border-slate-700 text-white rounded-xl px-4 py-3 w-40 font-mono focus:border-indigo-500 focus:outline-none transition-colors"
                            />
                            {originalLotSize > 0 && <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 ml-1">Original: {originalLotSize}</span>}
                        </div>
                    </div>
                </div>

                {/* Comparison Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-[#080a0f] p-6 rounded-2xl border border-slate-800/50">
                    <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Original Net Profit</p>
                        <p className={`text-xl font-bold ${comparison.original >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${comparison.original.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Simulated Net Profit</p>
                        <p className={`text-xl font-bold ${comparison.simulated >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${comparison.simulated.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Difference</p>
                        <div className="flex items-baseline gap-2">
                            <p className={`text-xl font-bold ${comparison.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{comparison.diff >= 0 ? '+' : ''}{comparison.diff.toFixed(2)}</p>
                            <span className={`text-xs font-bold ${comparison.diff >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>({comparison.diff >= 0 ? '+' : ''}{comparison.diffPercent.toFixed(2)}%)</span>
                        </div>
                    </div>
                </div>

                <div className="h-[400px] w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={simulatedData}>
                            <CartesianGrid strokeDasharray="5 5" stroke="#1c212c" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ background: '#11141d', border: '1px solid #334155', borderRadius: '12px' }}
                                labelStyle={{ color: '#94a3b8', marginBottom: '8px' }}
                                formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, name === 'balance' ? 'Original Balance' : 'Simulated Balance']}
                            />
                            <Line
                                name="Original Balance"
                                type="stepAfter"
                                dataKey="balance"
                                stroke="#475569"
                                strokeWidth={1}
                                dot={false}
                                strokeDasharray="5 5"
                            />
                            <Line
                                name="Simulated Balance"
                                type="stepAfter"
                                dataKey="simulatedBalance"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Charts Section */}
                <div className="bg-[#11141d] p-8 rounded-3xl border border-slate-800 shadow-sm mb-8">
                    <div className="flex justify-between items-center mb-10">
                        <select value={perfView} onChange={(e) => setPerfView(e.target.value)} className="bg-transparent text-xl font-black text-white outline-none cursor-pointer">
                            <option value="monthly" className="bg-[#11141d]">MONTHLY GAINS (SIMULATED)</option>
                            <option value="yearly" className="bg-[#11141d]">YEARLY GAINS (SIMULATED)</option>
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

                <Statistics reportMeta={simulatedMeta} avgPerWeek={avgPerWeek} initialDeposit={initialDeposit} />
            </div>
        </div>
    );
};

export default Simulation;
