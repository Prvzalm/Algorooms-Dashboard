import { create } from "zustand";

// Helper: Create default strike object
const createDefaultStrike = () => ({
    TransactionType: "SELL",
    StrikeType: "CE",
    StrikeValueType: 0,
    StrikeValue: 0,
    SLActionTypeId: "ONPRICE",
    TargetActionTypeId: "ONPRICE",
    isTrailSL: false,
    IsRecursive: true,
    IsMoveSLCTC: false,
    isExitAll: false,
    TargetType: "tgpr",
    SLType: "slpr",
    Target: 0,
    StopLoss: 30,
    Qty: 0,
    isPrePunchSL: false,
    IsPriceDiffrenceConstrant: false,
    PriceDiffrenceConstrantValue: 0,
    ExpiryType: "WEEKLY",
    reEntry: {
        isRentry: false,
        RentryType: "REN",
        TradeCycle: 0,
        RentryActionTypeId: "ON_CLOSE",
    },
    waitNTrade: {
        isWaitnTrade: false,
        isPerPt: "wt_eq",
        typeId: "wt_eq",
        MovementValue: 0,
    },
    TrailingSL: {
        TrailingType: "tslpr",
        InstrumentMovementValue: 0,
        TrailingValue: 0,
    },
    strikeTypeobj: {
        type: "ATM",
        StrikeValue: 0,
        RangeFrom: 0,
        RangeTo: 0,
    },
});

// Helper: Create default equation object
const createDefaultEquation = () => ({
    comparerId: 0,
    comparerName: "string",
    OperatorId: 0,
    OperatorName: "string",
    indicator: {
        indicatorId: 0,
        IndicatorParamList: [
            {
                ParamId: "string",
                IndicatorParamValue: "string",
            },
        ],
    },
    comparerIndicator: {
        indicatorId: 0,
        IndicatorParamList: [
            {
                ParamId: "string",
                IndicatorParamValue: "string",
            },
        ],
    },
});

// Default complete strategy payload
const getDefaultPayload = () => ({
    StrategyName: "",
    StrategyId: 0,
    Interval: 1,
    SL: 0,
    Target: 0,
    ExitWhenTotalLoss: 0,
    ExitWhenTotalProfit: 0,
    Trail_SL: 0,
    Privacy: "Private",
    Copy_Allowed: false,
    StrategyExecuterId: 0,
    OrderType: 0,
    TransactionType: 0,
    TradeStartTime: "09:16",
    TradeStopTime: "15:15",
    TpSLType: 0,
    SquareOffAllOptionLegOnSl: false,
    EntryRule: null,
    ExitRule: null,
    MinimumCapital: 0,
    LockProfit: 0,
    LockProfitAt: 0,
    TrailProfitBy: 0,
    ProfitTranches: 0,
    TrailProfitType: 0,
    strategyTag: "any",
    RiskDescription: null,
    subscriptionprice: 0,
    subscriptiondays: 0,
    ProductType: 0,
    AutoSquareOffTime: "15:15",
    MaxTrade: 0,
    MaxDD: 0,
    Roi: 0,
    isTradeOnTriggerCandle: false,
    BuyWhen: null,
    ShortWhen: null,
    IsContiniousTriggerCandle: false,
    StrategyType: "time",
    ProdType: "MIS",
    ChartType: 1,
    StrategySegmentType: "Option",
    StrategyExecutionType: "tb",
    isBtSt: false,
    EntryDaysBeforExpiry: 0,
    ExitDaysBeforExpiry: 4,
    ActiveDays: ["MON", "TUE", "WED", "THU", "FRI"],
    StrategyTagList: [],
    LongEntryEquation: [createDefaultEquation()],
    ShortEntryEquation: [createDefaultEquation()],
    Long_ExitEquation: [],
    Short_ExitEquation: [],
    StrategyScriptList: [
        {
            InstrumentToken: "",
            InstrumentName: "",
            Qty: 0,
            LongEquationoptionStrikeList: [],
            ShortEquationoptionStrikeList: [],
            StrikeTickValue: 0,
        },
    ],
    IsChartOnOptionStrike: false,
    ExternalSignalSettings: {
        Enabled: false,
        SignalSource: "",
        SignalWebhookURL: "",
        AcceptLongEntrySignal: true,
        AcceptLongExitSignal: true,
        AcceptShortEntrySignal: true,
        AcceptShortExitSignal: true,
    },
});

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

    // Centralized strategy payload (complete default)
    strategyPayload: getDefaultPayload(),

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

    // Payload management actions
    updatePayload: (updates) =>
        set((state) => ({
            strategyPayload: { ...state.strategyPayload, ...updates },
        })),

    resetPayload: (strategyType = "time") => {
        const newPayload = getDefaultPayload();
        newPayload.StrategyType = strategyType;
        newPayload.StrategySegmentType = strategyType === "time" ? "Option" : "";
        newPayload.StrategyExecutionType = strategyType === "time" ? "tb" : strategyType === "indicator" ? "ib" : "pa";
        set({ strategyPayload: newPayload });
    },

    setPayload: (payload) => set({ strategyPayload: payload }),

    // Helper to add strike to script list
    addStrikeToLeg: (scriptIndex = 0, strikeData, side = "long") => {
        const state = get();
        const scripts = [...state.strategyPayload.StrategyScriptList];
        const script = { ...scripts[scriptIndex] };

        if (side === "long") {
            script.LongEquationoptionStrikeList = [
                ...(script.LongEquationoptionStrikeList || []),
                { ...createDefaultStrike(), ...strikeData },
            ];
        } else {
            script.ShortEquationoptionStrikeList = [
                ...(script.ShortEquationoptionStrikeList || []),
                { ...createDefaultStrike(), ...strikeData },
            ];
        }

        scripts[scriptIndex] = script;
        set((state) => ({
            strategyPayload: {
                ...state.strategyPayload,
                StrategyScriptList: scripts,
            },
        }));
    },

    // Helper to update specific strike
    updateStrike: (scriptIndex = 0, strikeIndex, updates, side = "long") => {
        const state = get();
        const scripts = [...state.strategyPayload.StrategyScriptList];
        const script = { ...scripts[scriptIndex] };

        const listKey = side === "long" ? "LongEquationoptionStrikeList" : "ShortEquationoptionStrikeList";
        const strikes = [...(script[listKey] || [])];

        if (strikes[strikeIndex]) {
            strikes[strikeIndex] = { ...strikes[strikeIndex], ...updates };
        }

        script[listKey] = strikes;
        scripts[scriptIndex] = script;

        set((state) => ({
            strategyPayload: {
                ...state.strategyPayload,
                StrategyScriptList: scripts,
            },
        }));
    },

    // Helper to update equations
    updateEquation: (equationType, index, updates) => {
        const state = get();
        const equations = [...(state.strategyPayload[equationType] || [])];

        if (equations[index]) {
            equations[index] = { ...equations[index], ...updates };
        } else {
            equations[index] = { ...createDefaultEquation(), ...updates };
        }

        set((state) => ({
            strategyPayload: {
                ...state.strategyPayload,
                [equationType]: equations,
            },
        }));
    },

    // Reset everything
    resetAll: () => {
        set({
            selectedStrategyTypes: ["time"],
            selectedInstrument: "",
            selectedEquityInstruments: [],
            showBacktestComponent: false,
            createdStrategyId: null,
            strategyPayload: getDefaultPayload(),
        });
    },
}));

// Export helper functions for use in components
export { createDefaultStrike, createDefaultEquation };
