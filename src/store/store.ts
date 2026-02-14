import { configureStore } from '@reduxjs/toolkit';
import simulationReducer from './simulationSlice';

export const store = configureStore({
  reducer: {
    simulation: simulationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Dates in DataPoint might cause issues, disable check or serialize dates
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
