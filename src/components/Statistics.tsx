import React, { useMemo } from 'react';
import StatRow from './StatRow';
import { type ReportMeta } from '../utils/parser';

interface StatisticsProps {
    reportMeta: ReportMeta;
    avgPerWeek: string | number;
    initialDeposit?: number;
}

const Statistics: React.FC<StatisticsProps> = ({ reportMeta, avgPerWeek, initialDeposit }) => {
    const avgMonthlyGain = useMemo(() => {
        if (!reportMeta.period || !reportMeta.totalNetProfit) return '0.00';

        // Parse date range: "M5 (2025.01.01 - 2026.01.01)"
        const dates = reportMeta.period.match(/(\d{4})\.(\d{2})\.(\d{2})/g);
        if (dates && dates.length >= 2) {
            const d1 = new Date(dates[0].replace(/\./g, '-'));
            const d2 = new Date(dates[1].replace(/\./g, '-'));

            // Calculate months difference accurately
            let months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
            months += (d2.getDate() - d1.getDate()) / 30; // approximate partial month
            months = Math.max(months, 1); // Avoid division by zero, at least 1 month

            const netProfit = parseFloat(reportMeta.totalNetProfit.replace(/\s/g, ''));
            const dollar = netProfit / months;

            let result = `$${dollar.toFixed(2)}`;

            if (initialDeposit && initialDeposit > 0) {
                const percent = (dollar / initialDeposit) * 100;
                result += ` (${percent.toFixed(2)}%)`;
            }

            return result;
        }
        return '0.00';
    }, [reportMeta.period, reportMeta.totalNetProfit, initialDeposit]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Group 1: CORE PERFORMANCE */}
            <div className="bg-[#11141d] p-6 rounded-2xl border border-slate-800">
                <h3 className="text-indigo-500 font-bold mb-4 text-[10px] uppercase tracking-[0.2em]">Core Performance</h3>
                <StatRow label="Total Net Profit" value={reportMeta.totalNetProfit} highlight />
                <StatRow label="Gross Profit" value={reportMeta.grossProfit} />
                <StatRow label="Gross Loss" value={reportMeta.grossLoss} />
                <StatRow label="Profit Factor" value={reportMeta.profitFactor} highlight />
                <StatRow label="Sharpe Ratio" value={reportMeta.sharpeRatio} />
            </div>

            {/* Group 2: TRADE ANALYSIS */}
            <div className="bg-[#11141d] p-6 rounded-2xl border border-slate-800">
                <h3 className="text-indigo-500 font-bold mb-4 text-[10px] uppercase tracking-[0.2em]">Trade Distribution</h3>
                <StatRow label="Total Trades" value={reportMeta.totalTrades} />
                <StatRow label="Short (won %)" value={reportMeta.shortTrades} />
                <StatRow label="Long (won %)" value={reportMeta.longTrades} />
                <StatRow label="Profit Trades" value={reportMeta.profitTrades} />
                <StatRow label="Loss Trades" value={reportMeta.lossTrades} />
                <StatRow label="Weekly Average" value={avgPerWeek} highlight />
            </div>

            {/* Group 3: RISK METRICS */}
            <div className="bg-[#11141d] p-6 rounded-2xl border border-slate-800">
                <h3 className="text-indigo-500 font-bold mb-4 text-[10px] uppercase tracking-[0.2em]">Drawdown & Risk</h3>
                <StatRow label="Balance Maximal" value={reportMeta.balanceDDMax} />
                <StatRow label="Equity Maximal" value={reportMeta.equityDDMax} highlight />
                <StatRow label="Balance Relative" value={reportMeta.balanceDDRel} />
                <StatRow label="Equity Relative" value={reportMeta.equityDDRel} />
            </div>

            {/* Group 4: TRADE SIZES */}
            <div className="bg-[#11141d] p-6 rounded-2xl border border-slate-800">
                <h3 className="text-indigo-500 font-bold mb-4 text-[10px] uppercase tracking-[0.2em]">Trade Magnitudes</h3>
                <StatRow label="Largest Profit" value={reportMeta.largestProfit} />
                <StatRow label="Largest Loss" value={reportMeta.largestLoss} />
                <StatRow label="Avg Profit Trade" value={reportMeta.avgProfit} />
                <StatRow label="Avg Loss Trade" value={reportMeta.avgLoss} />
                {reportMeta.fixedLotSize && <StatRow label="Fixed Lot Size" value={reportMeta.fixedLotSize} highlight />}
            </div>

            {/* Group 5: STREAKS & CONSISTENCY */}
            <div className="bg-[#11141d] p-6 rounded-2xl border border-slate-800 col-span-1 lg:col-span-2">
                <h3 className="text-indigo-500 font-bold mb-4 text-[10px] uppercase tracking-[0.2em]">Streaks & Consistency</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <StatRow label="Max Consecutive Wins ($)" value={reportMeta.maxConsecWins$} />
                    <StatRow label="Max Consecutive Losses ($)" value={reportMeta.maxConsecLosses$} />
                    <StatRow label="Max Profit Count" value={reportMeta.maxConsecProfitCount} />
                    <StatRow label="Max Loss Count" value={reportMeta.maxConsecLossCount} />
                    <StatRow label="Avg Consecutive Wins" value={reportMeta.avgConsecWins} />
                    <StatRow label="Avg Consecutive Losses" value={reportMeta.avgConsecLosses} />
                    <StatRow label="Avg Monthly Gain" value={avgMonthlyGain} highlight />
                </div>
            </div>
        </div>
    );
};

export default Statistics;
