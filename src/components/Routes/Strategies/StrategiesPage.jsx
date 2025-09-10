import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { emptyDeployedStrategy } from "../../../assets";
import StrategyTemplates from "../Dashboard/StrategyTemplates";
import MyPortfolioTab from "./MyPortfolioTab";
import { FiChevronDown, FiMoreVertical } from "react-icons/fi";
import {
  useChangeDeployedStrategyTradeMode,
  useSquareOffStrategyMutation,
} from "../../../hooks/strategyHooks";
import { useBrokerwiseStrategies } from "../../../hooks/dashboardHooks";
import { useStartStopTradeEngine } from "../../../hooks/brokerHooks";
import { calculatePnlRow } from "../../../services/utils/calc";
import { getExchangeCode } from "../../../services/utils/exchanges";
import octopusInstance from "../../../services/WebSockets/feeds/octopusInstance";
import MyStrategiesList from "./MyStrategiesList";
import DeployedStrategiesList from "./DeployedStrategiesList";

const mainTabs = [
  "My Strategies",
  "Deployed Strategies",
  "Strategy Templates",
  "My Portfolio",
];

// sub-tabs state remains here, tab buttons are rendered inside MyStrategiesList

// Sum helpers
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// Recalculate from positions upward
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

        // Prefer real positions if present; otherwise fallback to counts
        const positions = s.OrderDetails || [];
        const orders = s.OrderDetails || [];

        const strategy = recomputeStrategyPnl({
          id: s.strategyId,
          name: s.StrategyName,
          running: d.Running_Status,
          isLiveMode: d.isLiveMode,
          maxLoss: d.MaxLoss,
          maxProfit: d.MaxProfit,
          tradeCycle: d.MaxTradeCycle,
          qtyMultiplier: d.QtyMultiplier,
          squareOff: d.AutoSquareOffTime,
          deploymentTime: d.deploymentTimeStamp,
          positions,
          orders,
          // if API had a cached TotalPnl but we have positions, we recomputed anyway
          strategyPNL: positions.length === 0 ? d.TotalPnl ?? 0 : undefined,
          pendingOrders: d.PendingOrdersCount,
        });

        strategies.push(
          positions.length === 0
            ? strategy // no positions; keep API pnl
            : recomputeStrategyPnl(strategy) // positions exist; ensure computed
        );
      });
    });

    const brokerItem = {
      broker: {
        name: b.BrokerName,
        code: b.BrokerClientId,
        logo: b.brokerLogoUrl,
        tradeEngineStatus: b.TradeEngineStatus,
        tradeEngineName:
          b.TradeEngineName || b.TradeEngine || b.tradeEngineName,
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

const StrategiesPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    // prefer navigation state if provided
    location?.state?.activeTab || "My Strategies"
  );
  const [activeSubTab, setActiveSubTab] = useState("Strategies");
  const navigate = useNavigate();
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

  // state to hold live, render-ready structure
  const [live, setLive] = useState({ brokers: [], grandTotalPnl: 0 });

  // keep refs to handlers so we can unsubscribe cleanly
  const wsHandlersRef = useRef([]);
  const isSubscribingRef = useRef(false);

  // Build initial live model when API payload changes
  useEffect(() => {
    if (!deployedData || deployedLoading || deployedError) return;

    // Stop any existing subscriptions before rebuilding
    wsHandlersRef.current.forEach((h) => h?.unsubscribe?.());
    wsHandlersRef.current = [];

    const model = buildLiveModelFromApi(deployedData);
    setLive(model);

    // Wire WebSocket subscriptions for all positions
    // We DO NOT depend on `live` in this effect to avoid resubscribing on every tick
    isSubscribingRef.current = true;

    console.log(model);

    model.brokers.forEach((brokerItem, i) => {
      brokerItem.strategies.forEach((stgy, j) => {
        (stgy.positions || []).forEach((pos, k) => {
          const subscriptionLocation = `${
            pos.OrderId || pos.id || "pos"
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

          wsHandlersRef.current.push(handler);

          handler
            .subscribe(({ msg }) => {
              const ltp = msg?.ltp;
              if (ltp == null) return;

              // Functional update: touch only the path we need
              setLive((prev) => {
                const brokers = [...prev.brokers];

                // clone nested nodes along the path (i, j, k)
                const b = { ...brokers[i] };
                const strategies = [...b.strategies];
                const s = { ...strategies[j] };
                const positions = [...(s.positions || [])];
                const position = { ...positions[k], LTP: ltp };

                // position PnL
                position.PNL = calculatePnlRow(position).PNL;

                positions[k] = position;
                s.positions = positions;

                // recompute strategy & broker
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
              // optional: toast/log
              console.error("WS subscribe error", e);
            });
        });
      });
    });

    isSubscribingRef.current = false;

    // cleanup when API payload changes/unmount
    return () => {
      wsHandlersRef.current.forEach((h) => h?.unsubscribe?.());
      wsHandlersRef.current = [];
    };
  }, [deployedData, deployedLoading, deployedError]);

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
      {activeTab === "My Portfolio" && <MyPortfolioTab />}
    </div>
  );
};

export default StrategiesPage;
