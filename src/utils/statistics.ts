import { DataPoint, ReportMeta } from './parser';

export const calculateStats = (simulatedData: DataPoint[], initialDeposit: number): ReportMeta => {
  if (simulatedData.length === 0) return { totalTrades: 0 };

  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;
  let losses = 0;
  let maxProfit = 0;
  let maxLoss = 0;
  let totalProfitSum = 0;
  let totalLossSum = 0;

  // Streaks
  let currentWins = 0;
  let currentLosses = 0;
  let maxConsecWinsCount = 0;
  let maxConsecLossesCount = 0;
  let maxConsecWins$ = 0;
  let maxConsecLosses$ = 0;
  let currentWin$ = 0;
  let currentLoss$ = 0;

  // Drawdowns
  let peakBalance = initialDeposit;
  let maxDDVal = 0;
  let maxDDRel = 0;

  // Trades only (filter out deposits/withdrawals if volume > 0)
  // Assuming volume > 0 means a trade in this context.
  const trades = simulatedData.filter(d => d.volume > 0);
  
  // Dealing with all balance operations for Drawdown
  // simulatedData includes all balance updates.
  // We need to iterate chronologically. data is sorted by time? Yes, likely.
  // parser.ts sorts deals by date.

  let runningBalance = initialDeposit;

  simulatedData.forEach(d => {
    // Determine if it's a profit or loss trade
    // Note: The simulatedData needs to have `simulatedProfit` property?
    // The parser returns DataPoint, which has profit.
    // But calculateStats will be called on simulated data, which effectively replaces 'profit' with 'simulatedProfit' in the object?
    // Wait, DataPoint interface has `profit`.
    // In Simulation.tsx, we map `deal` to `{ ...deal, simulatedProfit, simulatedBalance }`.
    // So the input to this function should probably be an extended DataPoint or just DataPoint where profit is the simulated profit.
    // Let's assume we map simulatedProfit -> profit before calling this, or handle it.
    // The clean way is to ensure `simulatedData` passed here has the correct `profit` field or use a generic accessor.
    // For now, let's assume `profit` holds the simulated value (since that's what we care about stats for).
    
    // BUT Simulation.tsx returns an object with `simulatedProfit` separate from `profit`.
    // I should create a type `SimulatedDataPoint` extending `DataPoint`.
    
    const profit = (d as any).simulatedProfit ?? d.profit;
    const balance = (d as any).simulatedBalance ?? d.balance;

    if (d.volume > 0) {
      if (profit >= 0) {
        grossProfit += profit;
        wins++;
        maxProfit = Math.max(maxProfit, profit);
        totalProfitSum += profit;
        
        currentWins++;
        currentWin$ += profit;
        
        currentLosses = 0;
        currentLoss$ = 0;
      } else {
        grossLoss += Math.abs(profit);
        losses++;
        maxLoss = Math.min(maxLoss, profit); // maxLoss is usually negative in raw value, but we track magnitude?
        // standard defines "Largest loss trade" usually as the negative number.
        totalLossSum += profit;

        currentLosses++;
        currentLoss$ += profit;
        
        currentWins = 0;
        currentWin$ = 0;
      }

      maxConsecWinsCount = Math.max(maxConsecWinsCount, currentWins);
      maxConsecLossesCount = Math.max(maxConsecLossesCount, currentLosses);
      maxConsecWins$ = Math.max(maxConsecWins$, currentWin$);
      maxConsecLosses$ = Math.min(maxConsecLosses$, currentLoss$); // tracked as sum of losses (negative)
    }
    
    // Drawdown Calculation on Balance
    if (balance > peakBalance) {
      peakBalance = balance;
    } else {
      const ddVal = peakBalance - balance;
      const ddRel = (ddVal / peakBalance) * 100;
      maxDDVal = Math.max(maxDDVal, ddVal);
      maxDDRel = Math.max(maxDDRel, ddRel);
    }
    
    runningBalance = balance;
  });

  const totalTrades = trades.length;
  const netProfit = grossProfit - grossLoss;
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  
  const avgProfit = wins > 0 ? totalProfitSum / wins : 0;
  const avgLoss = losses > 0 ? totalLossSum / losses : 0;

  // Return formatted strings as ReportMeta expects string | number usually (string for display)
  return {
    totalNetProfit: netProfit.toFixed(2),
    grossProfit: grossProfit.toFixed(2),
    grossLoss: (-grossLoss).toFixed(2), // usually displayed as negative
    profitFactor: profitFactor.toFixed(2),
    sharpeRatio: "0.00", // placeholder, complex to calc
    
    balanceDDMax: `${maxDDVal.toFixed(2)} (${((maxDDVal/peakBalance)*100).toFixed(2)}%)`, // Approx format
    equityDDMax: "0.00 (0.00%)", // No equity data
    balanceDDRel: `${maxDDRel.toFixed(2)}% (${maxDDVal.toFixed(2)})`,
    equityDDRel: "0.00% (0.00)",

    totalTrades: totalTrades,
    profitTrades: `${wins} (${((wins/totalTrades)*100).toFixed(2)}%)`,
    lossTrades: `${losses} (${((losses/totalTrades)*100).toFixed(2)}%)`,
    shortTrades: "0 (0%)", // Not tracking direction
    longTrades: "0 (0%)", // Not tracking direction

    largestProfit: maxProfit.toFixed(2),
    largestLoss: maxLoss.toFixed(2),
    avgProfit: avgProfit.toFixed(2),
    avgLoss: avgLoss.toFixed(2),

    maxConsecWins$: maxConsecWins$.toFixed(2),
    maxConsecLosses$: maxConsecLosses$.toFixed(2),
    maxConsecProfitCount: maxConsecWinsCount.toString(),
    maxConsecLossCount: maxConsecLossesCount.toString(),
    avgConsecWins: "0", // Need more complex logic for averages
    avgConsecLosses: "0",
    
    period: "Simulated"
  };
};
