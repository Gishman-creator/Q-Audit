import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type DataPoint, type ReportMeta } from '../utils/parser';

interface SimulatedDataPoint extends DataPoint {
  simulatedBalance: number;
  simulatedProfit: number;
}

interface SimulationState {
  data: SimulatedDataPoint[];
  meta: ReportMeta;
  lotSize: number;
  initialDeposit: number;
}

const initialState: SimulationState = {
  data: [],
  meta: { totalTrades: 0 },
  lotSize: 0,
  initialDeposit: 0
};

const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    setSimulationResults: (state, action: PayloadAction<{ data: SimulatedDataPoint[], meta: ReportMeta, lotSize: number, initialDeposit: number }>) => {
      state.data = action.payload.data;
      state.meta = action.payload.meta;
      state.lotSize = action.payload.lotSize;
      state.initialDeposit = action.payload.initialDeposit;
    },
    setLotSize: (state, action: PayloadAction<number>) => {
      state.lotSize = action.payload;
    },
    clearSimulation: (state) => {
      state.data = [];
      state.meta = { totalTrades: 0 };
      state.lotSize = 0;
      state.initialDeposit = 0;
    }
  }
});

export const { setSimulationResults, setLotSize, clearSimulation } = simulationSlice.actions;
export default simulationSlice.reducer;
export type { SimulatedDataPoint };
