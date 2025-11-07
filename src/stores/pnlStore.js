import { create } from "zustand";
import octopusInstance from "../services/WebSockets/feeds/octopusInstance";
import { calculatePnlRow } from "../services/utils/calc";
import { getExchangeCode } from "../services/utils/exchanges";

// Helper functions
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

const recomputeStrategyPnl = (strategy) => {
    const positions = strategy.positions || [];
    const pnl = sum(
        positions.map((p) => {
            const { PNL } = calculatePnlRow(p);
            return Number(PNL) || 0;
        })
    );
    return { ...strategy, strategyPNL: pnl };
};

const recomputeBrokerPnl = (brokerItem) => {
    const brokerPNL = sum(
        (brokerItem.strategies || []).map((s) => Number(s.strategyPNL) || 0)
    );
    return { ...brokerItem, brokerPNL };
};

const computeGrandTotal = (brokers) =>
    sum(brokers.map((b) => Number(b.brokerPNL) || 0));

// Build initial in-memory model from API payload
const buildLiveModelFromApi = (apiData = []) => {
    const brokers = apiData.map((b) => {
        const strategies = [];
        let runningCount = 0;
        let deployedCount = 0;

        b.DeploymentDetail?.forEach((s) => {
            s.DeploymentDetail?.forEach((d) => {
                deployedCount += 1;
                if (d.Running_Status) runningCount += 1;

                const positions = s.OrderDetails || [];
                const orders = s.OrderDetails || [];

                const strategy = {
                    id: s.strategyId,
                    name: s.StrategyName,
                    running: d.Running_Status,
                    isLiveMode: d.isLiveMode,
                    maxLoss: d.MaxLoss,
                    maxProfit: d.MaxProfit,
                    qtyMultiplier: d.QtyMultiplier,
                    autoSquareOffTime: d.AutoSquareOffTime,
                    maxTradeCycle: d.MaxTradeCycle,
                    brokerClientId: d.BrokerClientId,
                    brokerId: d.BrokerId,
                    totalPnl: d.TotalPnl ?? 0,
                    positions,
                    orders,
                    deploymentDetail: d,
                    strategyPNL: positions.length === 0 ? d.TotalPnl ?? 0 : undefined,
                };

                strategies.push(
                    positions.length === 0 ? strategy : recomputeStrategyPnl(strategy)
                );
            });
        });

        const brokerItem = {
            broker: {
                name: b.BrokerName,
                code: b.BrokerClientId,
                logo: b.brokerLogoUrl,
                brokerId: b.BrokerId,
            },
            runningCount,
            deployedCount,
            strategies,
            raw: b,
        };

        return recomputeBrokerPnl(brokerItem);
    });

    return {
        brokers,
        grandTotalPnl: computeGrandTotal(brokers),
    };
};

// Zustand Store for centralized PNL management
export const usePnlStore = create((set, get) => ({
    // State
    brokers: [],
    grandTotalPnl: 0,
    isSubscribed: false,
    wsHandlers: [],

    // Initialize data from API
    initializeFromApi: (apiData) => {
        const model = buildLiveModelFromApi(apiData);
        set({
            brokers: model.brokers,
            grandTotalPnl: model.grandTotalPnl,
        });
    },

    // Subscribe to WebSocket for live updates
    subscribeToLiveUpdates: (apiData) => {
        const state = get();

        // Cleanup existing subscriptions
        if (state.isSubscribed) {
            get().unsubscribeFromLiveUpdates();
        }

        if (!apiData || apiData.length === 0) return;

        const model = buildLiveModelFromApi(apiData);
        const handlers = [];

        // Subscribe to all positions
        model.brokers.forEach((brokerItem, i) => {
            brokerItem.strategies.forEach((stgy, j) => {
                (stgy.positions || []).forEach((pos, k) => {
                    const subscriptionLocation = `${pos.OrderId || pos.id || "pos"
                        }_${i}_${j}_${k}`;
                    const identifier = `${i}_${j}_${k}`;
                    const exchangeCode =
                        getExchangeCode(pos.exchange || pos.orderRequest?._exchange) || "-";
                    const instrumentToken =
                        pos.ExchangeToken ?? pos.instrumentToken ?? -1;

                    const handler = octopusInstance.wsHandler({
                        messageType: "CompactMarketDataMessage",
                        subscriptionLocation,
                        identifier,
                        payload: { exchangeCode, instrumentToken },
                    });

                    handlers.push(handler);

                    handler
                        .subscribe(({ msg }) => {
                            const ltp = msg?.ltp;
                            if (ltp == null) return;

                            // Update PNL using functional state update
                            set((state) => {
                                const brokers = [...state.brokers];

                                // Clone nested nodes along the path (i, j, k)
                                const b = { ...brokers[i] };
                                const strategies = [...b.strategies];
                                const s = { ...strategies[j] };
                                const positions = [...(s.positions || [])];
                                const position = { ...positions[k], LTP: ltp };

                                // Recalculate position PNL
                                position.PNL = calculatePnlRow(position).PNL;

                                positions[k] = position;
                                s.positions = positions;

                                // Recompute strategy & broker PNL
                                const sRe = recomputeStrategyPnl(s);
                                strategies[j] = sRe;
                                b.strategies = strategies;
                                const bRe = recomputeBrokerPnl(b);
                                brokers[i] = bRe;

                                return {
                                    brokers,
                                    grandTotalPnl: computeGrandTotal(brokers),
                                };
                            });
                        })
                        .catch((e) => {
                            console.error("WS subscribe error", e);
                        });
                });
            });
        });

        set({
            brokers: model.brokers,
            grandTotalPnl: model.grandTotalPnl,
            isSubscribed: true,
            wsHandlers: handlers,
        });
    },

    // Unsubscribe from WebSocket
    unsubscribeFromLiveUpdates: () => {
        const state = get();
        state.wsHandlers.forEach((h) => h?.unsubscribe?.());
        set({
            wsHandlers: [],
            isSubscribed: false,
        });
    },

    // Get broker by code
    getBrokerByCode: (brokerCode) => {
        const state = get();
        return state.brokers.find((b) => b.broker.code === brokerCode);
    },

    // Get strategies for a broker
    getStrategiesForBroker: (brokerCode) => {
        const broker = get().getBrokerByCode(brokerCode);
        return broker?.strategies || [];
    },

    // Get broker PNL
    getBrokerPnl: (brokerCode) => {
        const broker = get().getBrokerByCode(brokerCode);
        return broker?.brokerPNL ?? 0;
    },

    // Get top gainer and loser for a broker
    getTopGainerAndLoser: (brokerCode) => {
        const strategies = get().getStrategiesForBroker(brokerCode);

        if (strategies.length === 0) {
            return { topGainer: null, topLoser: null };
        }

        const topGainer = strategies.reduce((max, s) =>
            (s.strategyPNL > max.strategyPNL ? s : max),
            strategies[0]
        );

        const topLoser = strategies.reduce((min, s) =>
            (s.strategyPNL < min.strategyPNL ? s : min),
            strategies[0]
        );

        return { topGainer, topLoser };
    },

    // Reset store
    reset: () => {
        get().unsubscribeFromLiveUpdates();
        set({
            brokers: [],
            grandTotalPnl: 0,
            isSubscribed: false,
            wsHandlers: [],
        });
    },
}));

// Selector hooks for optimized re-renders
export const useBrokerPnl = (brokerCode) => {
    return usePnlStore((state) => {
        const broker = state.brokers.find((b) => b.broker.code === brokerCode);
        return broker?.brokerPNL ?? 0;
    });
};

export const useBrokerStrategies = (brokerCode) => {
    return usePnlStore((state) => {
        const broker = state.brokers.find((b) => b.broker.code === brokerCode);
        return broker?.strategies || [];
    });
};

export const useTopGainerLoser = (brokerCode) => {
    return usePnlStore((state) => {
        const strategies = state.brokers.find((b) => b.broker.code === brokerCode)?.strategies || [];

        if (strategies.length === 0) {
            return { topGainer: null, topLoser: null };
        }

        const topGainer = strategies.reduce((max, s) =>
            (s.strategyPNL > max.strategyPNL ? s : max),
            strategies[0]
        );

        const topLoser = strategies.reduce((min, s) =>
            (s.strategyPNL < min.strategyPNL ? s : min),
            strategies[0]
        );

        return { topGainer, topLoser };
    });
};

export const useGrandTotalPnl = () => {
    return usePnlStore((state) => state.grandTotalPnl);
};
