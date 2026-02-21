export interface DataPoint {
  time: string;
  balance: number;
  profit: number;
  volume: number;
  date: Date;
  type?: string;
  swap?: number;
  commission?: number;
  rawProfit?: number;
}

export interface ReportMeta {
  totalNetProfit?: string;
  grossProfit?: string;
  grossLoss?: string;
  profitFactor?: string;
  sharpeRatio?: string;
  balanceDDMax?: string;
  equityDDMax?: string;
  balanceDDRel?: string;
  equityDDRel?: string;
  totalTrades: number;
  shortTrades?: string;
  longTrades?: string;
  profitTrades?: string;
  lossTrades?: string;
  largestProfit?: string;
  largestLoss?: string;
  largestProfitLoss?: string; // added to match similar structure if needed
  avgProfit?: string;
  avgLoss?: string;
  maxConsecWins$?: string;
  maxConsecLosses$?: string;
  maxConsecProfitCount?: string;
  maxConsecLossCount?: string;
  avgConsecWins?: string;
  avgConsecLosses?: string;
  fixedLotSize?: number;
  period?: string;
  [key: string]: any;
}

export interface ParsedResult {
  data: DataPoint[];
  initialDeposit: number;
  reportMeta: ReportMeta;
}

export const processData = (htmlContent: string): ParsedResult => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const cells = Array.from(doc.querySelectorAll('td'));
  
  const getVal = (label: string) => {
    const idx = cells.findIndex(c => c.textContent?.trim().startsWith(label));
    return idx !== -1 ? cells[idx + 1]?.textContent?.trim() : '0';
  };

  // --- SCRAPING ENGINE ---
  const meta: ReportMeta = {
    // Performance
    totalNetProfit: getVal('Total Net Profit:'),
    grossProfit: getVal('Gross Profit:'),
    grossLoss: getVal('Gross Loss:'),
    profitFactor: getVal('Profit Factor:'),
    sharpeRatio: getVal('Sharpe Ratio:'),
    
    // Drawdowns
    balanceDDMax: getVal('Balance Drawdown Maximal:'),
    equityDDMax: getVal('Equity Drawdown Maximal:'),
    balanceDDRel: getVal('Balance Drawdown Relative:'),
    equityDDRel: getVal('Equity Drawdown Relative:'),
    
    // Trade Stats
    totalTrades: parseInt(getVal('Total Trades:') || '0') || 0,
    shortTrades: getVal('Short Trades (won %):'),
    longTrades: getVal('Long Trades (won %):'),
    profitTrades: getVal('Profit Trades (% of total):'),
    lossTrades: getVal('Loss Trades (% of total):'),
    
    // Averages
    largestProfit: getVal('Largest profit trade:'),
    largestLoss: getVal('Largest loss trade:'),
    avgProfit: getVal('Average profit trade:'),
    avgLoss: getVal('Average loss trade:'),
    
    // Streaks
    maxConsecWins$: getVal('Maximum consecutive wins ($):'),
    maxConsecLosses$: getVal('Maximum consecutive losses ($):'),
    maxConsecProfitCount: getVal('Maximal consecutive profit (count):'),
    maxConsecLossCount: getVal('Maximal consecutive loss (count):'),
    avgConsecWins: getVal('Average consecutive wins:'),
    avgConsecLosses: getVal('Average consecutive losses:'),
    
    period: getVal('Period:'),
  };
  
  const depositIdx = cells.findIndex(td => td.textContent?.includes('Initial Deposit:'));
  const deposit = parseFloat(cells[depositIdx + 1]?.textContent?.replace(/\s/g, '') || "0") || 0;
  
  // Parse Deals for Graphs
  const deals: DataPoint[] = [];
  const allRows = Array.from(doc.querySelectorAll('tr'));
  
  // Dynamic Column Detection
  let volIdx = 5;
  let profitIdx = 10;
  let balIdx = 11;
  let timeIdx = 0;
  let typeIdx = 2;
  let swapIdx = -1;
  let commIdx = -1;

  // Strict check: Header MUST strictly contain 'profit' to target the deals/results table
  const headerRow = allRows.find(row => {
    const text = row.textContent?.toLowerCase() || '';
    return text.includes('time') && text.includes('profit');
  });

  if (headerRow) {
    const hCells = Array.from(headerRow.querySelectorAll('th, td')).map(c => c.textContent?.trim().toLowerCase() || '');
    
    // Helper to find index with flexible matching
    const findIdx = (keywords: string[]) => hCells.findIndex(h => keywords.some(k => h === k || h.includes(k)));

    const v = findIdx(['volume', 'size', 'lots', 'amount', 'qty']);
    const p = findIdx(['profit', 'gain']);
    const b = findIdx(['balance']);
    const t = findIdx(['time', 'date']);
    const ty = findIdx(['type', 'direction']);
    const s = findIdx(['swap']);
    const cm = findIdx(['commission', 'taxes', 'fee']);

    if (v !== -1) volIdx = v;
    if (p !== -1) profitIdx = p;
    if (b !== -1) balIdx = b;
    if (t !== -1) timeIdx = t;
    if (ty !== -1) typeIdx = ty;
    if (s !== -1) swapIdx = s;
    if (cm !== -1) commIdx = cm;
  }

  allRows.forEach(row => {
    const c = Array.from(row.querySelectorAll('td'));
    // Ensure row has enough columns for the indices we need
    if (c.length > Math.max(volIdx, profitIdx, balIdx, typeIdx)) {
      const timeStr = c[timeIdx].textContent?.trim();
      if (timeStr && /^\d{4}\.\d{2}\.\d{2}/.test(timeStr)) {
        // Robust parsing handling spaces, commas, and negative signs
        const cleanVal = (txt: string | undefined) => {
            if (!txt) return 0;
            // Remove spaces and normalize minus signs (en-dash, em-dash, minus sign to hyphen)
            let clean = txt.trim().replace(/\s/g, '').replace(/[\u2013\u2014\u2212]/g, '-');
            
            // Convert comma decimal separator (common in EU reports) to dot
            if (clean.includes(',') && !clean.includes('.')) {
                clean = clean.replace(',', '.');
            } else {
                clean = clean.replace(/,/g, '');
            }
            const val = parseFloat(clean);
            return isFinite(val) ? val : 0;
        };
        
        const volume = cleanVal(c[volIdx].textContent);
        const rawProfit = cleanVal(c[profitIdx].textContent);
        const balance = cleanVal(c[balIdx].textContent);
        const type = c[typeIdx].textContent?.trim().toLowerCase();
        
        const swap = swapIdx !== -1 ? cleanVal(c[swapIdx].textContent) : 0;
        const commission = commIdx !== -1 ? cleanVal(c[commIdx].textContent) : 0;
        
        // Add swap (can be negative) and commission (usually negative) to net profit
        // This ensures Total Net Profit matches the report exactly regardless of sign
        const profit = rawProfit + swap + commission;
        
        deals.push({ time: timeStr, balance, profit, volume, date: new Date(timeStr.replace(/\./g, '-')), type, swap, commission, rawProfit });
      }
    }
  });

  const data = deals.length > 0 ? deals.sort((a, b) => a.date.getTime() - b.date.getTime()) : [];

  // Calculate Net Profit from data (Sum of all profits excluding deposits/withdrawals)
  data.reduce((sum, d) => {
      const isNonTrade = d.type 
         ? ['balance', 'deposit', 'withdrawal'].some(t => d.type?.includes(t))
         : d.volume === 0;
      return isNonTrade ? sum : sum + d.profit;
  }, 0);


  // Check for Fixed Lot Size
  const trades = deals.filter(d => d.volume > 0);
  if (trades.length > 0) {
    const firstVol = trades[0].volume;
    const isFixed = trades.every(d => d.volume === firstVol);
    if (isFixed) {
      meta.fixedLotSize = firstVol;
    }
  }

  return { data, initialDeposit: deposit, reportMeta: meta };
};
