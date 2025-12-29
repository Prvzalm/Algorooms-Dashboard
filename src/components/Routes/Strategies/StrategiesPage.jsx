import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";
import StrategyTemplates from "../Dashboard/StrategyTemplates";
import {
  useChangeDeployedStrategyTradeMode,
  useSquareOffStrategyMutation,
  useRemoveStrategyDeployment,
} from "../../../hooks/strategyHooks";
import {
  useBrokerwiseStrategies,
  useUserBrokerData,
} from "../../../hooks/dashboardHooks";
import { useStartStopTradeEngine } from "../../../hooks/brokerHooks";
import MyStrategiesList from "./MyStrategiesList";
import DeployedStrategiesList from "./DeployedStrategiesList";
import { useLivePnlData } from "../../../hooks/useLivePnlData";
import ConfirmModal from "../../ConfirmModal";
import StopTradeEngineModal from "../../StopTradeEngineModal";
import DeployStrategyModal from "./DeployStrategyModal";

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
    isFetching: deployedFetching,
    refetch: refetchDeployed,
  } = useBrokerwiseStrategies("Date");

  const { data: userBrokers = [], isFetching: userBrokersFetching } =
    useUserBrokerData();

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
  const [stopConfirmForBrokerItem, setStopConfirmForBrokerItem] =
    useState(null);
  const mutatingRef = useRef(false);
  const { mutate: mutateTradeEngine, isPending: enginePending } =
    useStartStopTradeEngine();
  // Strategy trade mode mutation
  const { mutate: mutateStrategyMode, isPending: strategyModePending } =
    useChangeDeployedStrategyTradeMode();
  const { mutate: mutateSquareOff } = useSquareOffStrategyMutation();
  const { mutate: mutateRemoveDeployment } = useRemoveStrategyDeployment();
  const [strategyOverrides, setStrategyOverrides] = useState({}); // compositeKey -> {running,isLiveMode}
  const [squareOffPendingIds, setSquareOffPendingIds] = useState(new Set()); // composite keys currently squaring off
  const [removingDeploymentIds, setRemovingDeploymentIds] = useState(new Set());
  const [removingBrokerIds, setRemovingBrokerIds] = useState(new Set());
  const [removeDeploymentTarget, setRemoveDeploymentTarget] = useState(null);
  const [removeBrokerTarget, setRemoveBrokerTarget] = useState(null);
  const [editDeploymentTarget, setEditDeploymentTarget] = useState(null);

  const toggleExpand = (code) => {
    setExpandedBrokerIds((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Convert store data to format expected by DeployedStrategiesList
  const userBrokerMap = userBrokers.reduce((acc, broker) => {
    acc[broker.BrokerClientId] = broker;
    return acc;
  }, {});

  const live = {
    brokers: storeBrokers.map((b) => {
      const userBroker = userBrokerMap[b.broker.code];
      return {
        ...b,
        broker: {
          ...b.broker,
          tradeEngineStatus:
            userBroker?.TradeEngineStatus ||
            b.broker.tradeEngineStatus ||
            "Stopped",
          tradeEngineName:
            userBroker?.TradeEngineName ||
            userBroker?.TradeEngine ||
            b.broker.tradeEngineName,
        },
        totalPnl: b.brokerPNL, // Add for backwards compatibility
      };
    }),
    grandTotalPnl,
  };

  const deployedRefreshing = deployedFetching && !deployedLoading;

  const handleManualRefreshDeployed = () => {
    refetchDeployed();
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
    const originalRunning = strategy.running;
    updateStrategyOverride(brokerItem, strategy, { running: nextRunning });
    mutateStrategyMode(
      {
        StrategyId: String(strategy.id),
        BrokerClientId: brokerItem.broker.code,
        BrokerId: brokerItem.raw?.BrokerId,
        isLiveMode: effective.isLiveMode, // send current live mode
        ActionType: actionType,
      },
      {
        onError: () => {
          // Revert optimistic update on error
          updateStrategyOverride(brokerItem, strategy, {
            running: originalRunning,
          });
        },
      }
    );
  };

  const handleStrategyToggleLiveForward = (brokerItem, strategy, toLive) => {
    const actionType = toLive ? "Live" : "Paper";
    const originalIsLiveMode = strategy.isLiveMode;
    updateStrategyOverride(brokerItem, strategy, { isLiveMode: toLive });
    const effective = getStrategyEffective(brokerItem, strategy);
    mutateStrategyMode(
      {
        StrategyId: String(strategy.id),
        BrokerClientId: brokerItem.broker.code,
        BrokerId: brokerItem.raw?.BrokerId,
        isLiveMode: toLive,
        ActionType: actionType,
        // running state remains whatever it was
      },
      {
        onError: () => {
          // Revert optimistic update on error
          updateStrategyOverride(brokerItem, strategy, {
            isLiveMode: originalIsLiveMode,
          });
        },
      }
    );
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

  const handleRequestEditDeployment = (
    brokerItem,
    rawStrategy,
    effectiveStrategy
  ) => {
    setEditDeploymentTarget({
      brokerItem,
      rawStrategy,
      effectiveStrategy,
    });
  };

  const handleRequestRemoveDeployment = (
    brokerItem,
    rawStrategy,
    effectiveStrategy
  ) => {
    setRemoveDeploymentTarget({
      brokerItem,
      rawStrategy,
      effectiveStrategy,
    });
  };

  const handleRequestRemoveBroker = (brokerItem) => {
    if (!brokerItem) return;
    setRemoveBrokerTarget(brokerItem);
  };

  const confirmRemoveDeployment = () => {
    if (!removeDeploymentTarget) return;
    const { brokerItem, rawStrategy } = removeDeploymentTarget;
    if (!rawStrategy?.id || !brokerItem?.broker?.code) {
      setRemoveDeploymentTarget(null);
      return;
    }

    const compositeKey = computeStrategyKey(brokerItem, rawStrategy);
    const brokerId =
      rawStrategy.brokerId ||
      brokerItem.broker.brokerId ||
      brokerItem.raw?.BrokerId ||
      "";

    setRemovingDeploymentIds((prev) => {
      const next = new Set(prev);
      next.add(compositeKey);
      return next;
    });

    mutateRemoveDeployment(
      {
        StrategyId: String(rawStrategy.id),
        BrokerClientId: brokerItem.broker.code,
        BrokerId: String(brokerId),
        RemoveDeploymentType: "strategy",
      },
      {
        onSuccess: () => {
          setStrategyOverrides((prev) => {
            if (!prev[compositeKey]) return prev;
            const next = { ...prev };
            delete next[compositeKey];
            return next;
          });
        },
        onSettled: () => {
          setRemovingDeploymentIds((prev) => {
            const next = new Set(prev);
            next.delete(compositeKey);
            return next;
          });
          setRemoveDeploymentTarget(null);
        },
      }
    );
  };

  const confirmRemoveBrokerDeployment = () => {
    if (!removeBrokerTarget) return;
    const brokerCode = removeBrokerTarget?.broker?.code;
    if (!brokerCode) {
      setRemoveBrokerTarget(null);
      return;
    }

    if (removingBrokerIds.has(brokerCode)) return;

    const brokerId =
      removeBrokerTarget?.broker?.brokerId ||
      removeBrokerTarget?.raw?.BrokerId ||
      "";

    setRemovingBrokerIds((prev) => {
      const next = new Set(prev);
      next.add(brokerCode);
      return next;
    });

    mutateRemoveDeployment(
      {
        BrokerClientId: brokerCode,
        BrokerId: String(brokerId),
        RemoveDeploymentType: "broker",
      },
      {
        onSuccess: () => {
          setStrategyOverrides((prev) => {
            const keys = Object.keys(prev);
            if (!keys.length) return prev;
            let changed = false;
            const next = { ...prev };
            keys.forEach((key) => {
              if (key.startsWith(`${brokerCode}_`)) {
                delete next[key];
                changed = true;
              }
            });
            return changed ? next : prev;
          });
        },
        onSettled: () => {
          setRemovingBrokerIds((prev) => {
            const next = new Set(prev);
            next.delete(brokerCode);
            return next;
          });
          setRemoveBrokerTarget(null);
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
          // No optimistic update
        },
        onError: () => {
          // No revert
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
    // For stop, show stop modal
    setStopConfirmForBrokerItem(brokerItem);
  };

  // Render helpers moved to extracted components

  const removeCompositeKey = removeDeploymentTarget
    ? computeStrategyKey(
        removeDeploymentTarget.brokerItem,
        removeDeploymentTarget.rawStrategy
      )
    : null;

  const removalPendingForTarget = removeCompositeKey
    ? removingDeploymentIds.has(removeCompositeKey)
    : false;

  const removeStrategyName =
    removeDeploymentTarget?.rawStrategy?.name ||
    removeDeploymentTarget?.effectiveStrategy?.name ||
    "this strategy";
  const removeBrokerName =
    removeDeploymentTarget?.brokerItem?.broker?.name || "this broker";
  const removeBrokerModalName =
    removeBrokerTarget?.broker?.name || "this broker";

  const brokerRemovalPending = removeBrokerTarget?.broker?.code
    ? removingBrokerIds.has(removeBrokerTarget.broker.code)
    : false;

  const editModalStrategy = editDeploymentTarget
    ? {
        StrategyId: editDeploymentTarget.rawStrategy?.id,
        StrategyName: editDeploymentTarget.rawStrategy?.name,
      }
    : null;

  const editInitialDeployment = editDeploymentTarget
    ? {
        isLiveMode: !!editDeploymentTarget.effectiveStrategy?.isLiveMode,
        qtyMultiplier:
          editDeploymentTarget.effectiveStrategy?.qtyMultiplier ??
          editDeploymentTarget.rawStrategy?.qtyMultiplier ??
          "",
        maxProfit:
          editDeploymentTarget.effectiveStrategy?.maxProfit ??
          editDeploymentTarget.rawStrategy?.maxProfit ??
          "",
        maxLoss:
          editDeploymentTarget.effectiveStrategy?.maxLoss ??
          editDeploymentTarget.rawStrategy?.maxLoss ??
          "",
        autoSquareOffTime:
          editDeploymentTarget.effectiveStrategy?.autoSquareOffTime ??
          editDeploymentTarget.rawStrategy?.autoSquareOffTime ??
          "",
        maxTradeCycle:
          editDeploymentTarget.effectiveStrategy?.maxTradeCycle ??
          editDeploymentTarget.rawStrategy?.maxTradeCycle,
        brokerClientIds: [editDeploymentTarget.brokerItem.broker.code],
      }
    : null;

  return (
    <div className="w-full h-full md:p-6 text-[#2E3A59] dark:text-white">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex border-b border-gray-200 dark:border-[#2D2F36] overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
          {mainTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 pb-2 font-medium md:text-base text-sm flex-shrink-0 ${
                activeTab === tab
                  ? "text-[#1B44FE] border-b-2 border-[#1B44FE]"
                  : "text-[#718EBF] dark:text-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Deployed Strategies" ? (
          <button
            type="button"
            onClick={handleManualRefreshDeployed}
            className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-[#1B44FE] hover:text-[#1636c8] disabled:opacity-60 flex-shrink-0"
            disabled={deployedRefreshing || deployedLoading}
            aria-label="Refresh deployed strategies"
            title="Refresh deployed strategies"
          >
            <FiRefreshCw className={deployedRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        ) : null}
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
          onEditStrategy={handleRequestEditDeployment}
          onDeleteStrategy={handleRequestRemoveDeployment}
          removingDeploymentIds={removingDeploymentIds}
          onRemoveBroker={handleRequestRemoveBroker}
          removingBrokerIds={removingBrokerIds}
          refreshing={deployedRefreshing}
          userBrokersFetching={userBrokersFetching}
          onRefresh={handleManualRefreshDeployed}
        />
      )}
      {activeTab === "Strategy Templates" && (
        <StrategyTemplates pageSize={10} showSeeAll={false} />
      )}

      <ConfirmModal
        open={!!removeBrokerTarget}
        title="Remove Broker Deployments?"
        message={`Removing all deployments under ${removeBrokerModalName} will stop every strategy associated with this broker. Continue?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        loading={brokerRemovalPending}
        onCancel={() => {
          if (brokerRemovalPending) return;
          setRemoveBrokerTarget(null);
        }}
        onConfirm={confirmRemoveBrokerDeployment}
      />

      <ConfirmModal
        open={!!removeDeploymentTarget}
        title="Remove Deployment?"
        message={`Removing ${removeStrategyName} from ${removeBrokerName} will stop it from running under this broker. Continue?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        loading={removalPendingForTarget}
        onCancel={() => {
          if (removalPendingForTarget) return;
          setRemoveDeploymentTarget(null);
        }}
        onConfirm={confirmRemoveDeployment}
      />

      {editDeploymentTarget && editModalStrategy ? (
        <DeployStrategyModal
          open
          strategy={editModalStrategy}
          onClose={() => setEditDeploymentTarget(null)}
          initialDeployment={editInitialDeployment}
        />
      ) : null}

      <ConfirmModal
        open={!!confirmForBrokerId}
        title="Start Trade Engine?"
        message={
          "This will start executing live trades for the selected broker.\nMake sure your strategies and margins are configured."
        }
        confirmLabel="OK"
        cancelLabel="Cancel"
        loading={enginePending}
        onCancel={() => setConfirmForBrokerId(null)}
        onConfirm={() => {
          const brokerItem = live.brokers.find(
            (b) => b.broker.code === confirmForBrokerId
          );
          setConfirmForBrokerId(null);
          if (brokerItem) performToggleTradeEngine(brokerItem, "Start");
        }}
      />

      <StopTradeEngineModal
        open={!!stopConfirmForBrokerItem}
        title="Stop Trade Engine?"
        message="Choose how to stop the trade engine."
        cancelLabel="Cancel"
        stopLabel="Stop"
        stopSquareOffLabel="Stop & Square Off"
        loading={enginePending}
        onCancel={() => setStopConfirmForBrokerItem(null)}
        onStop={() => {
          setStopConfirmForBrokerItem(null);
          performToggleTradeEngine(stopConfirmForBrokerItem, "Stop");
        }}
        onStopSquareOff={() => {
          setStopConfirmForBrokerItem(null);
          performToggleTradeEngine(stopConfirmForBrokerItem, "StopNSquareOff");
        }}
      />
    </div>
  );
};

export default StrategiesPage;
