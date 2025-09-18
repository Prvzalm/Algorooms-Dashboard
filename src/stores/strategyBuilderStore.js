import { create } from "zustand";

// Centralized store for Strategy Builder shared state
export const useStrategyBuilderStore = create((set, get) => ({
    // Strategy mode and instruments
    selectedStrategyTypes: ["time"],
    selectedInstrument: "",
    selectedEquityInstruments: [],

    // Modals and backtest flow
    showInstrumentModal: false,
    showBacktestModal: false,
    showBacktestComponent: false,
    createdStrategyId: null,

    // Actions
    setSelectedStrategyTypes: (arr) => set({ selectedStrategyTypes: arr }),
    setSelectedInstrument: (ins) => set({ selectedInstrument: ins }),
    setSelectedEquityInstruments: (list) => set({ selectedEquityInstruments: list }),

    openInstrumentModal: () => set({ showInstrumentModal: true }),
    closeInstrumentModal: () => set({ showInstrumentModal: false }),

    openBacktestModal: () => set({ showBacktestModal: true }),
    closeBacktestModal: () => set({ showBacktestModal: false }),

    showBacktest: (flag) => set({ showBacktestComponent: !!flag }),
    setCreatedStrategyId: (id) => set({ createdStrategyId: id }),
}));
