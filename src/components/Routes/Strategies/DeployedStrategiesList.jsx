import React, { useEffect, useState } from "react";
import ConfirmModal from "../../ConfirmModal";
import { emptyDeployedStrategy } from "../../../assets";
import { getPnlTextClass } from "../../../services/utils/formatters";
import {
  FiChevronDown,
  FiEdit2,
  FiMoreVertical,
  FiTrash2,
} from "react-icons/fi";
import DeployedSkeleton from "./DeployedSkeleton";

const DeployedStrategiesList = ({
  live,
  expandedBrokerIds,
  toggleExpand,
  getEffectiveTradeEngineStatus,
  handleToggleTradeEngine,
  pendingBrokerId,
  enginePending,
  confirmForBrokerId,
  setConfirmForBrokerId,
  performToggleTradeEngine,
  getStrategyEffective,
  strategyModePending,
  squareOffPendingIds,
  handleStrategyToggleLiveForward,
  handleStrategyToggleRunning,
  handleStrategySquareOff,
  loading,
  error,
  onEditStrategy,
  onDeleteStrategy,
  removingDeploymentIds,
  onRemoveBroker,
  removingBrokerIds,
  refreshing,
  userBrokersFetching,
}) => {
  const { brokers: deployedStrategies } = live || { brokers: [] };
  const [expandedStrategyKeys, setExpandedStrategyKeys] = useState(new Set());
  const [openBrokerMenu, setOpenBrokerMenu] = useState(null);
  const [openStrategyMenu, setOpenStrategyMenu] = useState(null);

  useEffect(() => {
    const handleOutside = () => {
      setOpenBrokerMenu(null);
      setOpenStrategyMenu(null);
    };
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  const toggleBrokerMenu = (code, event) => {
    event?.stopPropagation?.();
    setOpenStrategyMenu(null);
    setOpenBrokerMenu((prev) => (prev === code ? null : code));
  };

  const toggleStrategyMenu = (key, event) => {
    event?.stopPropagation?.();
    setOpenBrokerMenu(null);
    setOpenStrategyMenu((prev) => (prev === key ? null : key));
  };

  const toggleStrategyExpand = (key) => {
    setExpandedStrategyKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) return <DeployedSkeleton rows={3} strategiesPerRow={2} />;
  if (error)
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load deployed strategies.
      </div>
    );

  return (
    <div className="space-y-4 relative w-full overflow-hidden">
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

      {refreshing ? (
        <DeployedSkeleton rows={3} strategiesPerRow={2} />
      ) : deployedStrategies?.length === 0 ? (
        <div className="flex h-[50vh] items-center justify-center">
          <img src={emptyDeployedStrategy} alt="No deployed strategies" />
        </div>
      ) : (
        deployedStrategies.map((brokerItem) => {
          const expanded = expandedBrokerIds.includes(brokerItem.broker.code);
          const tradeEngineStatus = getEffectiveTradeEngineStatus(brokerItem);
          const rowPending =
            pendingBrokerId === brokerItem.broker.code && enginePending;
          const removingBroker = removingBrokerIds?.has?.(
            brokerItem.broker.code
          );
          return (
            <div
              key={brokerItem.broker.code}
              className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C] w-full overflow-hidden"
            >
              <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative">
                <div className="flex items-start justify-between gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-3 lg:min-w-[200px]">
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
                  <div className="flex items-center gap-2 lg:hidden">
                    <button
                      onClick={() => toggleExpand(brokerItem.broker.code)}
                      className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition flex-shrink-0 ${
                        expanded ? "rotate-180" : ""
                      }`}
                      disabled={removingBroker}
                      aria-label="Toggle strategies"
                    >
                      <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] flex-shrink-0"
                      onClick={(event) =>
                        toggleBrokerMenu(brokerItem.broker.code, event)
                      }
                      disabled={removingBroker}
                      aria-label="Broker actions"
                    >
                      <FiMoreVertical className="text-xl text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 lg:gap-6 items-stretch lg:items-center flex-wrap w-full lg:w-auto">
                  <div className="bg-[#F5F8FA] dark:bg-[#2A2A2E] text-sm rounded-md px-4 py-1 text-[#718EBF] dark:text-gray-400 whitespace-nowrap w-full sm:w-auto lg:w-auto text-center sm:text-left">
                    Running {String(brokerItem.runningCount).padStart(2, "0")}
                  </div>
                  <div className="bg-[#F5F8FA] dark:bg-[#2A2A2E] text-sm rounded-md px-4 py-1 text-[#718EBF] dark:text-gray-400 whitespace-nowrap w-full sm:w-auto lg:w-auto text-center sm:text-left">
                    Deployed {String(brokerItem.deployedCount).padStart(2, "0")}
                  </div>
                  <div className="flex flex-col gap-1 min-w-[200px] w-full sm:w-auto">
                    <div className="flex items-center justify-between sm:justify-start gap-2 text-[11px] uppercase tracking-wide text-[#718EBF] dark:text-gray-500">
                      Trade Engine
                      {(rowPending ||
                        removingBroker ||
                        userBrokersFetching) && (
                        <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                      )}
                    </div>
                    <div className="flex bg-[#E4EAF0] dark:bg-[#2D2F36] rounded-full p-0.5 text-xs font-semibold">
                      {[
                        {
                          label: "Stopped",
                          value: false,
                          accent: "text-red-500 dark:text-red-400",
                        },
                        {
                          label: "Running",
                          value: true,
                          accent: "text-green-600 dark:text-green-400",
                        },
                      ].map(({ label, value, accent }) => {
                        const engineActive = tradeEngineStatus === "Running";
                        const active = engineActive === value;
                        const disabled =
                          rowPending || removingBroker || userBrokersFetching;
                        return (
                          <button
                            key={label}
                            type="button"
                            className={`flex-1 px-3 py-1 rounded-full transition ${
                              active
                                ? `bg-white dark:bg-[#1B1D22] ${accent} shadow`
                                : "text-[#718EBF] dark:text-gray-400"
                            } ${
                              disabled
                                ? "cursor-not-allowed opacity-60"
                                : "hover:text-[#1B44FE]"
                            }`}
                            onClick={() => {
                              if (disabled || active) return;
                              handleToggleTradeEngine(brokerItem);
                            }}
                            disabled={disabled}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 lg:gap-6 lg:ml-auto w-full lg:w-auto justify-between lg:justify-end">
                  <div className="flex flex-col justify-center items-end w-full lg:w-auto">
                    <span className="text-[#212121] opacity-50 dark:text-gray-400 text-xs whitespace-nowrap">
                      PnL
                    </span>
                    <span
                      className={`font-semibold tabular-nums inline-block text-right whitespace-nowrap min-w-[100px] ${getPnlTextClass(
                        brokerItem.brokerPNL
                      )}`}
                      title={`₹${brokerItem.brokerPNL.toFixed(2)}`}
                    >
                      ₹{brokerItem.brokerPNL.toFixed(2)}
                    </span>
                  </div>
                  <div className="hidden lg:flex items-center gap-4 lg:gap-6">
                    <button
                      onClick={() => toggleExpand(brokerItem.broker.code)}
                      className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition flex-shrink-0 ${
                        expanded ? "rotate-180" : ""
                      }`}
                      disabled={removingBroker}
                      aria-label="Toggle strategies"
                    >
                      <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] flex-shrink-0"
                      onClick={(event) =>
                        toggleBrokerMenu(brokerItem.broker.code, event)
                      }
                      disabled={removingBroker}
                      aria-label="Broker actions"
                    >
                      <FiMoreVertical className="text-xl text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  {openBrokerMenu === brokerItem.broker.code && (
                    <div
                      className="absolute right-5 top-16 z-30 min-w-[200px] rounded-lg border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] shadow-lg text-xs py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36] flex items-center gap-2 text-red-500"
                        onClick={() => {
                          onRemoveBroker?.(brokerItem);
                          setOpenBrokerMenu(null);
                        }}
                        disabled={removingBroker}
                      >
                        {removingBroker ? (
                          <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                        ) : (
                          <FiTrash2 className="text-sm" />
                        )}
                        Remove Broker Deployments
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {expanded && brokerItem.strategies.length > 0 && (
                <div className="border-t border-[#E4EAF0] dark:border-[#2D2F36] px-5 py-4 space-y-4 overflow-x-auto">
                  {brokerItem.strategies.map((rawS) => {
                    const s = getStrategyEffective(brokerItem, rawS);
                    const compositeKey = `${brokerItem.broker.code}_${rawS.id}`;
                    const strategyExpanded =
                      expandedStrategyKeys.has(compositeKey);
                    const removingDeployment =
                      removingDeploymentIds?.has?.(compositeKey);
                    const controlDisabled =
                      removingDeployment || strategyModePending;
                    const squareOffPending =
                      squareOffPendingIds.has(compositeKey);
                    const squareOffDisabled =
                      !s.running ||
                      controlDisabled ||
                      squareOffPending ||
                      removingDeployment;
                    return (
                      <div
                        key={compositeKey}
                        className="space-y-2 w-full max-w-full"
                      >
                        {/* Strategy Card */}
                        <div className="flex flex-col xl:flex-row xl:items-center gap-3 rounded-xl border border-[#E4EAF0] dark:border-[#2D2F36] px-4 py-3 bg-[#F9FBFC] dark:bg-[#1B1D22] w-full">
                          {/* Strategy Name & Badge */}
                          <div className="flex items-center justify-between gap-3 xl:min-w-[280px]">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-sm font-medium truncate text-[#2E3A59] dark:text-white">
                                {s.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-md whitespace-nowrap flex-shrink-0 w-[60px] text-center ${
                                  s.isLiveMode
                                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : "bg-gray-200 dark:bg-[#2D2F36] text-gray-500 dark:text-gray-300"
                                }`}
                              >
                                {s.isLiveMode ? "Live" : "Paper"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 xl:hidden">
                              <button
                                onClick={() =>
                                  toggleStrategyExpand(compositeKey)
                                }
                                className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition flex-shrink-0 ${
                                  strategyExpanded ? "rotate-180" : ""
                                }`}
                                aria-label={
                                  strategyExpanded
                                    ? "Collapse positions"
                                    : "Expand positions"
                                }
                                disabled={removingDeployment}
                              >
                                <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={(event) =>
                                  toggleStrategyMenu(compositeKey, event)
                                }
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition flex-shrink-0"
                                aria-label="Strategy actions"
                                disabled={removingDeployment}
                              >
                                <FiMoreVertical className="text-gray-500 dark:text-gray-400" />
                              </button>
                            </div>
                          </div>

                          {/* Max Profit/Loss */}
                          <div className="flex gap-6 text-xs text-[#718EBF] dark:text-gray-400 xl:min-w-[180px] w-full sm:w-auto min-w-0">
                            <div className="min-w-[80px]">
                              <p className="mb-0.5">Max Profit</p>
                              <p className="font-semibold text-[#2E3A59] dark:text-white">
                                {s.maxProfit ?? "-"}
                              </p>
                            </div>
                            <div className="min-w-[80px]">
                              <p className="mb-0.5">Max Loss</p>
                              <p className="font-semibold text-[#2E3A59] dark:text-white">
                                {s.maxLoss ?? "-"}
                              </p>
                            </div>
                          </div>

                          {/* Controls Section */}
                          <div className="flex items-stretch gap-3 flex-wrap xl:flex-wrap xl:items-center xl:ml-auto relative w-full max-w-full">
                            {/* Mode Toggle */}
                            <div className="flex flex-col gap-1 min-w-[160px] w-full sm:w-auto">
                              <span className="text-[11px] uppercase tracking-wide text-[#718EBF] dark:text-gray-500">
                                Mode
                              </span>
                              <div className="flex bg-[#E4EAF0] dark:bg-[#2D2F36] rounded-full p-0.5 text-xs font-semibold">
                                {[
                                  { label: "Paper", value: false },
                                  { label: "Live", value: true },
                                ].map(({ label, value }) => {
                                  const active = !!s.isLiveMode === value;
                                  return (
                                    <button
                                      key={label}
                                      type="button"
                                      className={`flex-1 px-3 py-1 rounded-full transition ${
                                        active
                                          ? "bg-white dark:bg-[#1B1D22] text-[#1B44FE] shadow"
                                          : "text-[#718EBF] dark:text-gray-400"
                                      } ${
                                        controlDisabled
                                          ? "cursor-not-allowed opacity-70"
                                          : "hover:text-[#1B44FE]"
                                      }`}
                                      onClick={() => {
                                        if (controlDisabled || active) return;
                                        handleStrategyToggleLiveForward(
                                          brokerItem,
                                          rawS,
                                          value
                                        );
                                      }}
                                      disabled={controlDisabled}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Run Status Toggle */}
                            <div className="flex flex-col gap-1 min-w-[160px] w-full sm:w-auto">
                              <span className="text-[11px] uppercase tracking-wide text-[#718EBF] dark:text-gray-500">
                                Status
                              </span>
                              <div className="flex bg-[#E4EAF0] dark:bg-[#2D2F36] rounded-full p-0.5 text-xs font-semibold">
                                {[
                                  { label: "Paused", value: false },
                                  { label: "Running", value: true },
                                ].map(({ label, value }) => {
                                  const active = !!s.running === value;
                                  const activeColor = value
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-amber-600 dark:text-amber-400";
                                  return (
                                    <button
                                      key={label}
                                      type="button"
                                      className={`flex-1 px-3 py-1 rounded-full transition ${
                                        active
                                          ? `bg-white dark:bg-[#1B1D22] ${activeColor} shadow`
                                          : "text-[#718EBF] dark:text-gray-400"
                                      } ${
                                        controlDisabled
                                          ? "cursor-not-allowed opacity-70"
                                          : "hover:text-green-600"
                                      }`}
                                      onClick={() => {
                                        if (controlDisabled || active) return;
                                        handleStrategyToggleRunning(
                                          brokerItem,
                                          rawS,
                                          value
                                        );
                                      }}
                                      disabled={controlDisabled}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Square Off Button */}
                            <button
                              className="px-4 py-2 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
                              disabled={squareOffDisabled}
                              onClick={() =>
                                handleStrategySquareOff(brokerItem, rawS)
                              }
                              title={
                                !s.running
                                  ? "Resume the strategy to square off positions"
                                  : undefined
                              }
                            >
                              {squareOffPending && (
                                <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                              )}
                              {squareOffPending
                                ? "Squaring"
                                : !s.running
                                ? "Resume to Square"
                                : "Square Off"}
                            </button>

                            {/* PnL Display */}
                            <div className="flex items-center gap-2 xl:min-w-[120px] w-full sm:w-auto justify-between sm:justify-end">
                              <div className="text-right">
                                <p className="text-xs text-[#718EBF] dark:text-gray-400 whitespace-nowrap">
                                  PnL
                                </p>
                                <p
                                  className={`text-sm font-semibold ${getPnlTextClass(
                                    s.strategyPNL
                                  )}`}
                                >
                                  <span
                                    className="tabular-nums inline-block text-right whitespace-nowrap min-w-[100px]"
                                    title={`₹${s.strategyPNL.toFixed(2)}`}
                                  >
                                    ₹{s.strategyPNL.toFixed(2)}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Expand/Collapse Positions */}
                            <div className="hidden xl:flex items-center gap-2">
                              <button
                                onClick={() =>
                                  toggleStrategyExpand(compositeKey)
                                }
                                className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition flex-shrink-0 ${
                                  strategyExpanded ? "rotate-180" : ""
                                }`}
                                aria-label={
                                  strategyExpanded
                                    ? "Collapse positions"
                                    : "Expand positions"
                                }
                                disabled={removingDeployment}
                              >
                                <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                              </button>
                              <button
                                onClick={(event) =>
                                  toggleStrategyMenu(compositeKey, event)
                                }
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition flex-shrink-0"
                                aria-label="Strategy actions"
                                disabled={removingDeployment}
                              >
                                <FiMoreVertical className="text-gray-500 dark:text-gray-400" />
                              </button>
                            </div>
                            {openStrategyMenu === compositeKey && (
                              <div
                                className="absolute right-0 top-full mt-2 z-30 min-w-[180px] rounded-lg border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] shadow-lg text-xs py-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36] flex items-center gap-2"
                                  onClick={() => {
                                    onEditStrategy?.(brokerItem, rawS, s);
                                    setOpenStrategyMenu(null);
                                  }}
                                  disabled={removingDeployment}
                                >
                                  <FiEdit2 className="text-sm" />
                                  Edit Deployment
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36] flex items-center gap-2 text-red-500"
                                  onClick={() => {
                                    onDeleteStrategy?.(brokerItem, rawS, s);
                                    setOpenStrategyMenu(null);
                                  }}
                                  disabled={removingDeployment}
                                >
                                  {removingDeployment ? (
                                    <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin" />
                                  ) : (
                                    <FiTrash2 className="text-sm" />
                                  )}
                                  Remove Deployment
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Positions Panel - below the card */}
                        {strategyExpanded && (
                          <div className="rounded-xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C]">
                            {s.positions && s.positions.length > 0 ? (
                              <div className="px-4 pt-3 text-sm font-semibold text-orange-500">
                                Positions
                              </div>
                            ) : null}
                            {s.positions && s.positions.length > 0 ? (
                              <div className="overflow-x-auto px-2 pb-3">
                                <table className="min-w-full text-xs md:text-sm">
                                  <thead>
                                    <tr className="text-[#718EBF] dark:text-gray-400">
                                      <th className="px-3 py-2 text-left">
                                        Script
                                      </th>
                                      <th className="px-3 py-2 text-left">
                                        Transaction
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Entry Price
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        SL
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Target
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Exit Price
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        LTP
                                      </th>
                                      <th className="px-3 py-2 text-left">
                                        Time Stamp
                                      </th>
                                      <th className="px-3 py-2 text-left">
                                        Entry Time
                                      </th>
                                      <th className="px-3 py-2 text-left">
                                        Exit Time
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        PNL
                                      </th>
                                      <th className="px-3 py-2 text-left">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#E4EAF0] dark:divide-[#2D2F36]">
                                    {s.positions.map((p, idx) => {
                                      const isBuy =
                                        (p.TransactionType ||
                                          p.orderRequest?._transactionType) ===
                                        "BUY";
                                      const script =
                                        p.TickerTradingSymbol ||
                                        p.TradingSymbol ||
                                        p.orderRequest?._tradingSymbol ||
                                        "-";
                                      const status = `${(p.OrderStatus || "")
                                        .toString()
                                        .toUpperCase()}${
                                        p.OrderExitType
                                          ? " " +
                                            p.OrderExitType.toString()
                                              .replace(/-/g, " ")
                                              .toUpperCase()
                                          : ""
                                      }`.trim();
                                      return (
                                        <tr
                                          key={
                                            p.OrderDetailId || p.OrderId || idx
                                          }
                                          className="text-[#2E3A59] dark:text-white"
                                        >
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {script}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            <span
                                              className={`font-medium ${
                                                isBuy
                                                  ? "text-green-600"
                                                  : "text-red-500"
                                              }`}
                                            >
                                              {isBuy ? "BUY" : "SELL"}{" "}
                                              {p.Qty ?? ""}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums">
                                            {Number(p.EntryPrice ?? 0).toFixed(
                                              2
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums">
                                            {Number(p.StopLoss ?? 0).toFixed(2)}
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums">
                                            {Number(p.Target ?? 0).toFixed(2)}
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums">
                                            {Number(p.ExitPrice ?? 0).toFixed(
                                              2
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums">
                                            {Number(p.LTP ?? 0).toFixed(2)}
                                          </td>
                                          <td className="px-3 py-2 text-[#718EBF] dark:text-gray-400 text-xs whitespace-nowrap">
                                            {p.TimeStamp
                                              ? new Date(
                                                  p.TimeStamp
                                                ).toLocaleDateString("en-GB")
                                              : "-"}
                                          </td>
                                          <td className="px-3 py-2 text-[#718EBF] dark:text-gray-400 text-xs whitespace-nowrap">
                                            {p.EntryTimeStamp || "-"}
                                          </td>
                                          <td className="px-3 py-2 text-[#718EBF] dark:text-gray-400 text-xs whitespace-nowrap">
                                            {p.ExitTimeStamp || "-"}
                                          </td>
                                          <td
                                            className={`px-3 py-2 text-right tabular-nums ${getPnlTextClass(
                                              p.PNL
                                            )}`}
                                          >
                                            {Number(p.PNL ?? 0).toFixed(2)}
                                          </td>
                                          <td className="px-3 py-2 whitespace-nowrap">
                                            {status || "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-sm text-[#718EBF] dark:text-gray-400 py-4 text-center">
                                No transactions
                              </div>
                            )}
                          </div>
                        )}
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

export default DeployedStrategiesList;
