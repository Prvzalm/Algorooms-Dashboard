import { useState, useEffect, useRef } from "react";
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
import { useLivePnlData } from "../../../hooks/useLivePnlData";

const mainTabs = ["My Strategies", "Deployed Strategies", "Strategy Templates"];

const StrategiesPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    // prefer navigation state if provided
    location?.state?.activeTab || "My Strategies"
  );
  const [activeSubTab, setActiveSubTab] = useState("Strategies");
  // MyStrategiesList manages its own pagination internally

  // If navigation provides an activeTab (via location.state), ensure we pick it up
  useEffect(() => {
    if (location?.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state?.activeTab, location?.pathname]);

  const {
    data: deployedData = [],
    isLoading: deployedLoading,
    isError: deployedError,
  } = useBrokerwiseStrategies("Date");

  const [expandedBrokerIds, setExpandedBrokerIds] = useState([]);

  // Use custom hook for centralized PNL management
  const { brokers: storeBrokers, grandTotalPnl } = useLivePnlData(
    deployedData,
    deployedLoading,
    deployedError
  );

  // Trade Engine control state (similar to BrokerSection)
  const [engineStatusOverrides, setEngineStatusOverrides] = useState({}); // BrokerClientId -> "Running"|"Stopped"
  const [pendingBrokerId, setPendingBrokerId] = useState(null);
  const [confirmForBrokerId, setConfirmForBrokerId] = useState(null);
  const mutatingRef = useRef(false);
  const { mutate: mutateTradeEngine, isPending: enginePending } =
    useStartStopTradeEngine();
  // Strategy trade mode mutation
  const { mutate: mutateStrategyMode, isPending: strategyModePending } =
    useChangeDeployedStrategyTradeMode();
  const { mutate: mutateSquareOff, isPending: squareOffPending } =
    useSquareOffStrategyMutation();
  const [strategyOverrides, setStrategyOverrides] = useState({}); // compositeKey -> {running,isLiveMode}
  const [squareOffPendingIds, setSquareOffPendingIds] = useState(new Set()); // composite keys currently squaring off

  const toggleExpand = (code) => {
    setExpandedBrokerIds((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Convert store data to format expected by DeployedStrategiesList
  const live = {
    brokers: storeBrokers.map((b) => ({
      ...b,
      totalPnl: b.brokerPNL, // Add for backwards compatibility
    })),
    grandTotalPnl,
  };

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
    // Keep live mode as-is (do not force) so running toggle only affects running state.
    const effective = getStrategyEffective(brokerItem, strategy);
    const actionType = nextRunning ? "Start" : "Stop";
    updateStrategyOverride(brokerItem, strategy, { running: nextRunning });
    mutateStrategyMode({
      StrategyId: String(strategy.id),
      BrokerClientId: brokerItem.broker.code,
      BrokerId: brokerItem.raw?.BrokerId,
      isLiveMode: effective.isLiveMode, // send current live mode
      ActionType: actionType,
    });
  };

  const handleStrategyToggleLiveForward = (brokerItem, strategy, toLive) => {
    const actionType = toLive ? "Live" : "Paper";
    updateStrategyOverride(brokerItem, strategy, { isLiveMode: toLive });
    const effective = getStrategyEffective(brokerItem, strategy);
    mutateStrategyMode({
      StrategyId: String(strategy.id),
      BrokerClientId: brokerItem.broker.code,
      BrokerId: brokerItem.raw?.BrokerId,
      isLiveMode: toLive,
      ActionType: actionType,
      // running state remains whatever it was
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
    if (!brokerItem || enginePending || mutatingRef.current) return;
    mutatingRef.current = true;
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
          mutatingRef.current = false;
          setPendingBrokerId(null);
          setConfirmForBrokerId(null);
        },
      }
    );
  };

  const handleToggleTradeEngine = (brokerItem) => {
    if (!brokerItem || enginePending || mutatingRef.current) return;
    const currentStatus = getEffectiveTradeEngineStatus(brokerItem);
    const nextAction = currentStatus === "Running" ? "Stop" : "Start";
    if (nextAction === "Start") {
      setConfirmForBrokerId(brokerItem.broker.code);
      return;
    }
    performToggleTradeEngine(brokerItem, nextAction);
  };

  // Render helpers moved to extracted components

  return (
    <div className="w-full h-full md:p-6 text-[#2E3A59] dark:text-white">
      <div className="flex mb-6 border-b border-gray-200 dark:border-[#2D2F36] overflow-x-auto whitespace-nowrap no-scrollbar">
        {mainTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 pb-2 font-medium md:text-base text-sm flex-shrink-0 ${
              activeTab === tab
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
