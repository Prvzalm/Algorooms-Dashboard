import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  emptyDeployedStrategy,
  emptyStrategy,
  notificationGeneral,
  upStox,
} from "../../../assets";
import StrategyTemplates from "../Dashboard/StrategyTemplates";
import MyPortfolioTab from "./MyPortfolioTab";
import {
  FiChevronDown,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import CreateStrategyPopup from "./CreateStrategyPopup";
import {
  useUserStrategies,
  useChangeDeployedStrategyTradeMode,
  useSquareOffStrategyMutation,
  useDuplicateStrategy,
  useDeleteStrategy,
} from "../../../hooks/strategyHooks";
import DuplicateStrategyModal from "../../DuplicateStrategyModal";
import { useBrokerwiseStrategies } from "../../../hooks/dashboardHooks";
import { useStartStopTradeEngine } from "../../../hooks/brokerHooks";
import ConfirmModal from "../../ConfirmModal";
import { calculatePnlRow } from "../../../services/utils/calc";
import { getExchangeCode } from "../../../services/utils/exchanges";
import octopusInstance from "../../../services/WebSockets/feeds/octopusInstance";

const mainTabs = [
  "My Strategies",
  "Deployed Strategies",
  "Strategy Templates",
  "My Portfolio",
];

const subTabs = ["Strategies", "Tradingview Signals Trading"];

const mockSignalStrategies = [
  {
    name: "MACD Reversal",
    user: "AR42069",
    startTime: "10:00",
    endTime: "14:30",
    segment: "OPTION",
    strategyType: "Signal Based",
    action: "BUY NIFTY BANK ATM 0PE",
  },
];

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
  const [showStrategyPopup, setShowStrategyPopup] = useState(false);
  const navigate = useNavigate();
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [dupTarget, setDupTarget] = useState(null);
  const { mutate: mutateDuplicate, isPending: duplicating } =
    useDuplicateStrategy();
  const { mutate: mutateDelete, isPending: deleting } = useDeleteStrategy();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // pagination state for "Strategies" sub tab
  const pageSize = 10;
  const [strategyPage, setStrategyPage] = useState(1);
  useEffect(() => {
    setStrategyPage(1); // reset page on sub tab change
  }, [activeSubTab, activeTab]);

  // If navigation provides an activeTab (via location.state), ensure we pick it up
  useEffect(() => {
    if (location?.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state?.activeTab, location?.pathname]);

  const {
    data: userStrategies = [],
    isLoading: strategiesLoading,
    isError: strategiesError,
  } = useUserStrategies({
    page: strategyPage,
    pageSize,
    strategyType: activeSubTab === "Strategies" ? "created" : "subscribed",
    queryText: "",
    orderBy: "Date",
  });

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

  const renderMyStrategies = () => {
    if (strategiesLoading) return <div>Loading strategies...</div>;
    if (strategiesError) return <div>Failed to load strategies.</div>;

    return (
      <>
        <div className="flex space-x-3 mb-4">
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-3 rounded-lg text-sm font-medium ${
                activeSubTab === tab
                  ? "bg-blue-100 text-[#0096FF] border border-[#0096FF]"
                  : "bg-gray-200 dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeSubTab === "Strategies" && userStrategies.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-[#718EBF] dark:text-gray-400">
              Showing {userStrategies.length} strategies (Page {strategyPage})
            </span>
            <div className="flex items-center bg-[#F5F8FA] dark:bg-[#2D2F36] rounded-full overflow-hidden text-sm">
              <button
                onClick={() => setStrategyPage((p) => Math.max(1, p - 1))}
                disabled={strategyPage === 1 || strategiesLoading}
                className={`px-3 py-2 flex items-center ${
                  strategyPage === 1 || strategiesLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white dark:hover:bg-[#3A3D44]"
                }`}
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              <span className="px-4 py-2 font-medium select-none">
                {strategyPage}
              </span>
              <button
                onClick={() => setStrategyPage((p) => p + 1)}
                disabled={userStrategies.length < pageSize || strategiesLoading}
                className={`px-3 py-2 flex items-center ${
                  userStrategies.length < pageSize || strategiesLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white dark:hover:bg-[#3A3D44]"
                }`}
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}

        {userStrategies.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center">
            <img src={emptyStrategy} alt="Empty" className="mb-6" />
            <button
              className="px-6 py-2 bg-[#0096FF] text-white rounded-lg text-sm font-medium"
              onClick={() => setShowStrategyPopup(true)}
            >
              + Create Strategy
            </button>

            {showStrategyPopup && (
              <CreateStrategyPopup
                onClose={() => setShowStrategyPopup(false)}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStrategies.map((strategy) => (
              <div
                key={strategy.StrategyId}
                className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-5 relative"
              >
                <div className="flex justify-between items-start mb-2 relative">
                  <div>
                    <h3 className="text-base font-semibold text-[#2E3A59] dark:text-white">
                      {strategy.StrategyName}
                    </h3>
                    <p className="text-xs text-[#718EBF] dark:text-gray-400 mt-0.5">
                      By {strategy.CreatedBy}
                    </p>
                  </div>
                  <button
                    className="text-gray-400 dark:text-gray-500 text-xl px-2 py-1 hover:text-[#0096FF]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActionMenuOpenId((prev) =>
                        prev === strategy.StrategyId
                          ? null
                          : strategy.StrategyId
                      );
                    }}
                  >
                    ⋮
                  </button>
                  {actionMenuOpenId === strategy.StrategyId && (
                    <div className="absolute right-0 top-7 z-30 w-40 rounded-lg border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] shadow-lg text-xs py-2">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36]"
                        onClick={() => {
                          navigate(
                            `/trading/strategy-builder/${strategy.StrategyId}`
                          );
                          setActionMenuOpenId(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36]"
                        onClick={() => {
                          setDupTarget(strategy);
                          setDupModalOpen(true);
                          setActionMenuOpenId(null);
                        }}
                      >
                        Duplicate
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={() => {
                          setConfirmDeleteId(strategy.StrategyId);
                          setActionMenuOpenId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-y-4 text-xs text-[#718EBF] dark:text-gray-400 mt-3">
                  <div>
                    <p className="mb-1">{strategy.TradeStartTime || "-"}</p>
                    <p className="font-medium">Start Time</p>
                  </div>
                  <div>
                    <p className="mb-1">{strategy.TradeStopTime || "-"}</p>
                    <p className="font-medium">End Time</p>
                  </div>
                  <div>
                    <p className="mb-1">
                      {strategy.StrategySegmentType || "-"}
                    </p>
                    <p className="font-medium">Segment Type</p>
                  </div>
                  <div>
                    <p className="mb-1">
                      {strategy.StrategyExecutionType || "-"}
                    </p>
                    <p className="font-medium">Strategy Type</p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    disabled
                    className="w-full bg-[#F5F8FA] dark:bg-[#2D2F36] text-[#718EBF] dark:text-gray-300 text-xs font-medium py-3 rounded-md"
                  >
                    {strategy.ScriptDetails?.[0]?.ScriptName || "-"}
                  </button>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    className="flex-1 py-3 rounded-md border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] text-[#2E3A59] dark:text-white text-sm font-medium"
                    onClick={() =>
                      navigate(
                        `/backtesting/strategybacktest/${strategy.StrategyId}`
                      )
                    }
                  >
                    Backtest
                  </button>
                  <button className="flex-1 py-3 rounded-md bg-[#0096FF] hover:bg-blue-600 text-white text-sm font-medium">
                    Deploy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <DuplicateStrategyModal
          open={dupModalOpen}
          originalName={dupTarget?.StrategyName}
          loading={duplicating}
          onCancel={() => {
            setDupModalOpen(false);
            setDupTarget(null);
          }}
          onSubmit={(newName) => {
            if (!dupTarget) return;
            mutateDuplicate(
              { StrategyId: dupTarget.StrategyId, StrategyName: newName },
              {
                onSuccess: () => {
                  setDupModalOpen(false);
                  setDupTarget(null);
                },
              }
            );
          }}
        />
        <ConfirmModal
          open={!!confirmDeleteId}
          title="Delete Strategy?"
          message="This action cannot be undone. Are you sure you want to delete this strategy?"
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          cancelLabel="Cancel"
          loading={deleting}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => {
            if (!confirmDeleteId) return;
            mutateDelete(confirmDeleteId, {
              onSuccess: () => setConfirmDeleteId(null),
              onError: () => {},
            });
          }}
        />
      </>
    );
  };

  const renderDeployedStrategies = () => {
    const { brokers: deployedStrategies, grandTotalPnl } = live;
    if (deployedLoading)
      return <div className="text-center py-10">Loading...</div>;
    if (deployedError)
      return (
        <div className="text-center py-10 text-red-500">
          Failed to load deployed strategies.
        </div>
      );
    return (
      <div className="space-y-4 relative">
        <ConfirmModal
          open={!!confirmForBrokerId}
          title="Start Trade Engine?"
          message={
            "This will begin live trading for all eligible strategies under this broker. Ensure configurations are correct."
          }
          confirmLabel="OK"
          cancelLabel="Cancel"
          loading={enginePending}
          onCancel={() => setConfirmForBrokerId(null)}
          onConfirm={() => {
            const brokerItem = deployedStrategies.find(
              (b) => b.broker.code === confirmForBrokerId
            );
            setConfirmForBrokerId(null);
            if (brokerItem) performToggleTradeEngine(brokerItem, "Start");
          }}
        />
        {deployedStrategies?.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center">
            <img src={emptyDeployedStrategy} alt="No deployed strategies" />
          </div>
        ) : (
          deployedStrategies.map((brokerItem) => {
            const expanded = expandedBrokerIds.includes(brokerItem.broker.code);
            const tradeEngineStatus = getEffectiveTradeEngineStatus(brokerItem);
            const rowPending =
              pendingBrokerId === brokerItem.broker.code && enginePending;
            return (
              <div
                key={brokerItem.broker.code}
                className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C]"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={brokerItem.broker.logo}
                      alt="Broker Logo"
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <p className="text-xs text-[#718EBF] dark:text-gray-400">
                        Broker
                      </p>
                      <p className="text-sm font-semibold text-[#2E3A59] dark:text-white">
                        {brokerItem.broker.name} ({brokerItem.broker.code})
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 md:gap-8 items-center flex-wrap">
                    <div className="bg-[#F5F8FA] dark:bg-[#2A2A2E] text-sm rounded-md px-4 py-1 text-[#718EBF] dark:text-gray-400">
                      Running {String(brokerItem.runningCount).padStart(2, "0")}
                    </div>
                    <div className="bg-[#F5F8FA] dark:bg-[#2A2A2E] text-sm rounded-md px-4 py-1 text-[#718EBF] dark:text-gray-400">
                      Deployed{" "}
                      {String(brokerItem.deployedCount).padStart(2, "0")}
                    </div>
                    <button
                      onClick={() => handleToggleTradeEngine(brokerItem)}
                      disabled={rowPending}
                      className={`px-4 py-1.5 text-xs font-medium rounded-md border transition flex items-center gap-2 ${
                        tradeEngineStatus === "Running"
                          ? "bg-green-50 border-green-500 text-green-600 dark:bg-green-900/20 dark:border-green-600"
                          : "bg-[#F5F8FA] dark:bg-[#2A2A2E] border-[#E4EAF0] dark:border-[#2D2F36] text-[#2E3A59] dark:text-gray-200"
                      } ${
                        rowPending
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:brightness-105"
                      }`}
                    >
                      {rowPending && (
                        <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                      )}
                      {tradeEngineStatus === "Running"
                        ? "Stop Engine"
                        : "Start Engine"}
                    </button>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <img src={notificationGeneral} alt="notification" />
                      <div className="flex flex-col justify-center">
                        <span className="text-[#212121] opacity-50 dark:text-gray-400 text-xs">
                          PnL
                        </span>
                        <span
                          className={`font-semibold ${
                            brokerItem.totalPnl >= 0
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          ₹{brokerItem.brokerPNL.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(brokerItem.broker.code)}
                      className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition ${
                        expanded ? "rotate-180" : ""
                      }`}
                    >
                      <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35]">
                      <FiMoreVertical className="text-xl text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {expanded && brokerItem.strategies.length > 0 && (
                  <div className="border-t border-[#E4EAF0] dark:border-[#2D2F36] px-5 py-4 space-y-4">
                    {brokerItem.strategies.map((rawS) => {
                      const s = getStrategyEffective(brokerItem, rawS);
                      const compositeKey = `${brokerItem.broker.code}_${rawS.id}`;
                      return (
                        <div
                          key={compositeKey}
                          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-[#E4EAF0] dark:border-[#2D2F36] px-4 py-3 bg-[#F9FBFC] dark:bg-[#1B1D22]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                              {s.name}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-md ${
                                s.isLiveMode
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-gray-200 dark:bg-[#2D2F36] text-gray-500 dark:text-gray-300"
                              }`}
                            >
                              {s.isLiveMode ? "Live" : "Paper"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-6 text-xs text-[#718EBF] dark:text-gray-400">
                            <div>
                              <p className="mb-0.5">Max Profit</p>
                              <p className="font-semibold text-[#2E3A59] dark:text-white">
                                {s.maxProfit ?? "-"}
                              </p>
                            </div>
                            <div>
                              <p className="mb-0.5">Max Loss</p>
                              <p className="font-semibold text-[#2E3A59] dark:text-white">
                                {s.maxLoss ?? "-"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 flex-wrap">
                            {/* Mode Toggle */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] uppercase tracking-wide text-[#718EBF] dark:text-gray-500">
                                Mode
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={!!s.isLiveMode}
                                  onChange={(e) =>
                                    handleStrategyToggleLiveForward(
                                      brokerItem,
                                      rawS,
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className="w-12 h-6 bg-gray-200 dark:bg-[#2D2F36] rounded-full peer-checked:bg-blue-600 transition"></span>
                                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-6"></span>
                              </label>
                              <span
                                className={`text-xs font-medium ${
                                  s.isLiveMode
                                    ? "text-emerald-600"
                                    : "text-gray-500 dark:text-gray-300"
                                }`}
                              >
                                {s.isLiveMode ? "Live" : "Forward"}
                              </span>
                            </div>
                            {/* Run Status Toggle */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] uppercase tracking-wide text-[#718EBF] dark:text-gray-500">
                                Status
                              </span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={!!s.running}
                                  onChange={(e) =>
                                    handleStrategyToggleRunning(
                                      brokerItem,
                                      rawS,
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className="w-12 h-6 bg-gray-200 dark:bg-[#2D2F36] rounded-full peer-checked:bg-green-600 transition"></span>
                                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition peer-checked:translate-x-6"></span>
                              </label>
                              <span
                                className={`text-xs font-medium ${
                                  s.running
                                    ? "text-green-600"
                                    : "text-gray-500 dark:text-gray-300"
                                }`}
                              >
                                {s.running ? "Running" : "Paused"}
                              </span>
                            </div>
                            {/* Square Off Button */}
                            <button
                              className="px-4 py-2 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-500/20 transition disabled:opacity-50 flex items-center gap-2"
                              disabled={
                                strategyModePending ||
                                squareOffPendingIds.has(compositeKey)
                              }
                              onClick={() =>
                                handleStrategySquareOff(brokerItem, rawS)
                              }
                            >
                              {squareOffPendingIds.has(compositeKey) && (
                                <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                              )}
                              {squareOffPendingIds.has(compositeKey)
                                ? "Squaring"
                                : "Square Off"}
                            </button>
                            <div className="text-right ml-auto">
                              <p className="text-xs text-[#718EBF] dark:text-gray-400">
                                PnL
                              </p>
                              <p
                                className={`text-sm font-semibold ${
                                  s.strategyPNL >= 0 ? "text-green-600" : "text-red-500"
                                }`}
                              >
                                ₹{s.strategyPNL.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

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

      {activeTab === "My Strategies" && renderMyStrategies()}
      {activeTab === "Deployed Strategies" && renderDeployedStrategies()}
      {activeTab === "Strategy Templates" && (
        <StrategyTemplates pageSize={10} showSeeAll={false} />
      )}
      {activeTab === "My Portfolio" && <MyPortfolioTab />}
    </div>
  );
};

export default StrategiesPage;
