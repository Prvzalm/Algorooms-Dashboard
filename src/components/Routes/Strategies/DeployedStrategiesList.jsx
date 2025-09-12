import React, { useState } from "react";
import ConfirmModal from "../../ConfirmModal";
import { emptyDeployedStrategy, notificationGeneral } from "../../../assets";
import { FiChevronDown, FiMoreVertical } from "react-icons/fi";
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
}) => {
  const { brokers: deployedStrategies } = live || { brokers: [] };
  const [expandedStrategyKeys, setExpandedStrategyKeys] = useState(new Set());

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
                    Deployed {String(brokerItem.deployedCount).padStart(2, "0")}
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
                    <div className="flex flex-col justify-center items-end">
                      <span className="text-[#212121] opacity-50 dark:text-gray-400 text-xs">
                        PnL
                      </span>
                      <span
                        className={`font-semibold tabular-nums inline-block text-right whitespace-nowrap w-[11ch] ${
                          brokerItem.totalPnl >= 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                        title={`₹${brokerItem.brokerPNL.toFixed(2)}`}
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
                    const strategyExpanded =
                      expandedStrategyKeys.has(compositeKey);
                    return (
                      <div key={compositeKey} className="space-y-2">
                        {/* Strategy Card */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-[#E4EAF0] dark:border-[#2D2F36] px-4 py-3 bg-[#F9FBFC] dark:bg-[#1B1D22]">
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
                                  s.strategyPNL >= 0
                                    ? "text-green-600"
                                    : "text-red-500"
                                }`}
                              >
                                <span
                                  className="tabular-nums inline-block text-right whitespace-nowrap w-[11ch]"
                                  title={`₹${s.strategyPNL.toFixed(2)}`}
                                >
                                  ₹{s.strategyPNL.toFixed(2)}
                                </span>
                              </p>
                            </div>
                            {/* Expand/Collapse Positions */}
                            <button
                              onClick={() => toggleStrategyExpand(compositeKey)}
                              className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition ${
                                strategyExpanded ? "rotate-180" : ""
                              }`}
                              aria-label={
                                strategyExpanded
                                  ? "Collapse positions"
                                  : "Expand positions"
                              }
                            >
                              <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                            </button>
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
                                      const entryTs = p.EntryTimeStamp
                                        ? `IN : ${p.EntryTimeStamp}`
                                        : "";
                                      const exitTs = p.ExitTimeStamp
                                        ? ` EXIT : ${p.ExitTimeStamp}`
                                        : "";
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
                                          <td className="px-3 py-2 whitespace-nowrap text-[#718EBF] dark:text-gray-400">
                                            {entryTs}
                                            {exitTs}
                                          </td>
                                          <td className="px-3 py-2 text-right tabular-nums">
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
