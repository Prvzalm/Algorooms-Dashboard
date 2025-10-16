// Example: How to migrate StrategiesPage to use centralized PNL store

// BEFORE - Using local state (Current StrategiesPage.jsx)
/*
import { useState, useEffect, useRef } from "react";
import { calculatePnlRow } from "../../../services/utils/calc";
import { getExchangeCode } from "../../../services/utils/exchanges";
import octopusInstance from "../../../services/WebSockets/feeds/octopusInstance";

const StrategiesPage = () => {
  const [live, setLive] = useState({ brokers: [], grandTotalPnl: 0 });
  const wsHandlersRef = useRef([]);
  
  useEffect(() => {
    // 100+ lines of WebSocket subscription code
    // Duplicate logic from Dashboard
  }, [deployedData]);
  
  return (
    <DeployedStrategiesList live={live} ... />
  );
};
*/

// AFTER - Using centralized store (Recommended approach)

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import StrategyTemplates from "../Dashboard/StrategyTemplates";
import {
    useChangeDeployedStrategyTradeMode,
    useSquareOffStrategyMutation,
} from "../../../hooks/strategyHooks";
import { useBrokerwiseStrategies } from "../../../hooks/dashboardHooks";
import { useStartStopTradeEngine } from "../../../hooks/brokerHooks";
import MyStrategiesList from "./MyStrategiesList";
import DeployedStrategiesList from "./DeployedStrategiesList";
import { usePnlStore } from "../../../stores/pnlStore";

const mainTabs = ["My Strategies", "Deployed Strategies", "Strategy Templates"];

const StrategiesPage = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(
        location?.state?.activeTab || "My Strategies"
    );
    const [activeSubTab, setActiveSubTab] = useState("Strategies");

    // TanStack Query for API data
    const {
        data: deployedData = [],
        isLoading: deployedLoading,
        isError: deployedError,
    } = useBrokerwiseStrategies("Date");

    // Zustand store for live PNL
    const subscribeToLiveUpdates = usePnlStore(
        (state) => state.subscribeToLiveUpdates
    );
    const unsubscribeFromLiveUpdates = usePnlStore(
        (state) => state.unsubscribeFromLiveUpdates
    );
    const brokers = usePnlStore((state) => state.brokers);
    const grandTotalPnl = usePnlStore((state) => state.grandTotalPnl);

    // Subscribe to live updates
    useEffect(() => {
        if (!deployedData || deployedLoading || deployedError) return;

        subscribeToLiveUpdates(deployedData);

        return () => {
            unsubscribeFromLiveUpdates();
        };
    }, [
        deployedData,
        deployedLoading,
        deployedError,
        subscribeToLiveUpdates,
        unsubscribeFromLiveUpdates,
    ]);

    // Rest of your component logic (trade engine, strategy mode, etc.)
    const [expandedBrokerIds, setExpandedBrokerIds] = useState([]);
    const [engineStatusOverrides, setEngineStatusOverrides] = useState({});
    const [pendingBrokerId, setPendingBrokerId] = useState(null);
    const [confirmForBrokerId, setConfirmForBrokerId] = useState(null);
    const [strategyOverrides, setStrategyOverrides] = useState({});
    const [squareOffPendingIds, setSquareOffPendingIds] = useState(new Set());

    const { mutate: mutateTradeEngine, isPending: enginePending } =
        useStartStopTradeEngine();
    const { mutate: mutateStrategyMode, isPending: strategyModePending } =
        useChangeDeployedStrategyTradeMode();
    const { mutate: mutateSquareOff, isPending: squareOffPending } =
        useSquareOffStrategyMutation();

    const toggleExpand = (code) => {
        setExpandedBrokerIds((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );
    };

    // Convert store data to format expected by DeployedStrategiesList
    const live = {
        brokers: brokers.map((b) => ({
            broker: b.broker,
            runningCount: b.runningCount,
            deployedCount: b.deployedCount,
            strategies: b.strategies,
            brokerPNL: b.brokerPNL,
            totalPnl: b.brokerPNL, // Add for backwards compatibility
            raw: b.raw,
        })),
        grandTotalPnl,
    };

    // Helper functions (keep your existing logic)
    const getEffectiveTradeEngineStatus = (brokerItem) => {
        const override = engineStatusOverrides[brokerItem.broker.code];
        return override || brokerItem.broker.tradeEngineStatus;
    };

    const computeStrategyKey = (brokerItem, strategy) =>
        `${brokerItem.broker.code}_${strategy.id}`;

    const getStrategyEffective = (brokerItem, strategy) => {
        const key = computeStrategyKey(brokerItem, strategy);
        const o = strategyOverrides[key];
        if (!o) return strategy;
        return { ...strategy, ...o };
    };

    const updateStrategyOverride = (brokerItem, strategy, patch) => {
        const key = computeStrategyKey(brokerItem, strategy);
        setStrategyOverrides((prev) => ({
            ...prev,
            [key]: { ...(prev[key] || {}), ...patch },
        }));
    };

    const handleStrategyToggleRunning = (brokerItem, strategy, nextRunning) => {
        const effective = getStrategyEffective(brokerItem, strategy);
        const actionType = nextRunning ? "Start" : "Stop";
        updateStrategyOverride(brokerItem, strategy, { running: nextRunning });
        mutateStrategyMode({
            StrategyId: String(strategy.id),
            BrokerClientId: brokerItem.broker.code,
            BrokerId: brokerItem.raw?.BrokerId,
            isLiveMode: effective.isLiveMode,
            ActionType: actionType,
        });
    };

    const handleStrategyToggleLiveForward = (brokerItem, strategy, toLive) => {
        const actionType = toLive ? "Live" : "Paper";
        updateStrategyOverride(brokerItem, strategy, { isLiveMode: toLive });
        mutateStrategyMode({
            StrategyId: String(strategy.id),
            BrokerClientId: brokerItem.broker.code,
            BrokerId: brokerItem.raw?.BrokerId,
            isLiveMode: toLive,
            ActionType: actionType,
        });
    };

    const handleStrategySquareOff = (brokerItem, strategy) => {
        const compositeKey = computeStrategyKey(brokerItem, strategy);
        setSquareOffPendingIds((prev) => new Set(prev).add(compositeKey));
        mutateSquareOff(
            {
                StrategyId: String(strategy.id),
                BrokerClientId: brokerItem.broker.code,
                BrokerId: brokerItem.broker.brokerId || brokerItem.raw?.BrokerId,
            },
            {
                onSettled: () => {
                    setSquareOffPendingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(compositeKey);
                        return next;
                    });
                },
            }
        );
    };

    const performToggleTradeEngine = (brokerItem, nextAction) => {
        if (!brokerItem || enginePending) return;
        setPendingBrokerId(brokerItem.broker.code);
        mutateTradeEngine(
            {
                TradeEngineName: brokerItem.broker.tradeEngineName,
                BrokerClientId: brokerItem.broker.code,
                ConnectOptions: nextAction,
            },
            {
                onSuccess: () => {
                    setEngineStatusOverrides((prev) => ({
                        ...prev,
                        [brokerItem.broker.code]:
                            nextAction === "Start" ? "Running" : "Stopped",
                    }));
                },
                onSettled: () => {
                    setPendingBrokerId(null);
                    setConfirmForBrokerId(null);
                },
            }
        );
    };

    const handleToggleTradeEngine = (brokerItem) => {
        if (!brokerItem || enginePending) return;
        const currentStatus = getEffectiveTradeEngineStatus(brokerItem);
        const nextAction = currentStatus === "Running" ? "Stop" : "Start";
        if (nextAction === "Start") {
            setConfirmForBrokerId(brokerItem.broker.code);
            return;
        }
        performToggleTradeEngine(brokerItem, nextAction);
    };

    return (
        <div className="w-full h-full md:p-6 text-[#2E3A59] dark:text-white">
            <div className="flex mb-6 border-b border-gray-200 dark:border-[#2D2F36] overflow-x-auto whitespace-nowrap no-scrollbar">
                {mainTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 pb-2 font-medium md:text-base text-sm flex-shrink-0 ${activeTab === tab
                                ? "text-[#0096FF] border-b-2 border-[#0096FF]"
                                : "text-[#718EBF] dark:text-gray-400"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "My Strategies" && (
                <MyStrategiesList
                    activeSubTab={activeSubTab}
                    setActiveSubTab={setActiveSubTab}
                />
            )}
            {activeTab === "Deployed Strategies" && (
                <DeployedStrategiesList
                    live={live}
                    expandedBrokerIds={expandedBrokerIds}
                    toggleExpand={toggleExpand}
                    getEffectiveTradeEngineStatus={getEffectiveTradeEngineStatus}
                    handleToggleTradeEngine={handleToggleTradeEngine}
                    pendingBrokerId={pendingBrokerId}
                    enginePending={enginePending}
                    confirmForBrokerId={confirmForBrokerId}
                    setConfirmForBrokerId={setConfirmForBrokerId}
                    performToggleTradeEngine={performToggleTradeEngine}
                    getStrategyEffective={getStrategyEffective}
                    strategyModePending={strategyModePending}
                    squareOffPendingIds={squareOffPendingIds}
                    handleStrategyToggleLiveForward={handleStrategyToggleLiveForward}
                    handleStrategyToggleRunning={handleStrategyToggleRunning}
                    handleStrategySquareOff={handleStrategySquareOff}
                    loading={deployedLoading}
                    error={deployedError}
                />
            )}
            {activeTab === "Strategy Templates" && (
                <StrategyTemplates pageSize={10} showSeeAll={false} />
            )}
        </div>
    );
};

export default StrategiesPage;

/* 
BENEFITS OF THIS MIGRATION:
1. ✅ Removed 100+ lines of duplicate WebSocket logic
2. ✅ Single source of truth for PNL data
3. ✅ Automatic cleanup handled by store
4. ✅ Better performance with optimized selectors
5. ✅ Easier to test and maintain
6. ✅ No prop drilling needed
7. ✅ Consistent PNL data across Dashboard and Strategies pages
*/
