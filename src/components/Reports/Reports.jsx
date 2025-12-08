import React, { useState, useMemo } from "react";
import {
  useUserReports,
  getDefaultDateRange,
  formatCurrency,
} from "../../hooks/reportsHooks";
import { useTradeEngineLogs } from "../../hooks/notificationHooks";
import StrategyReportDetails from "./StrategyReportDetails";
import DonutChart from "./ui/DonutChart";
import Heatmap from "./ui/Heatmap";
import StrategyCard from "./ui/StrategyCard";
import ReportsSkeleton from "./ReportsSkeleton";
import PrimaryButton from "../common/PrimaryButton";

const Reports = () => {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [activeTab, setActiveTab] = useState("Report");
  const [strategyMode, setStrategyMode] = useState("live"); // 'live' | 'forward'
  const [selectedBroker, setSelectedBroker] = useState("all");

  const effectiveMode = strategyMode === "forward" ? "paper" : "live";

  const reportParams = useMemo(
    () => ({
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate,
      brokerClientFilter: "all",
      strategyMode: effectiveMode,
    }),
    [dateRange.fromDate, dateRange.toDate, effectiveMode]
  );

  const {
    data: reportsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useUserReports(reportParams);

  const {
    data: tradeEngineLogs,
    isLoading: isLogsLoading,
    error: logsError,
  } = useTradeEngineLogs();

  const formatDateForInput = (dateString) =>
    new Date(dateString).toISOString().split("T")[0];
  const handleDateChange = (field, value) =>
    setDateRange((prev) => ({
      ...prev,
      [field]: new Date(value).toISOString(),
    }));
  const handleStrategyClick = (s) => setSelectedStrategy(s);
  const handleBack = () => setSelectedStrategy(null);

  const strategies = reportsData?.ListOfStrategies || [];

  // Filter strategies based on selected broker
  const filteredStrategies = useMemo(() => {
    if (selectedBroker === "all" || !strategies.length) {
      return strategies;
    }

    return strategies
      .map((strategy) => {
        // Filter transactions within each strategy based on selected broker
        const filteredTransactions =
          strategy.ListOfTransactionsPerStrategy?.filter(
            (transaction) => transaction.Brokerclientid === selectedBroker
          ) || [];

        // If no transactions for this broker, return null
        if (filteredTransactions.length === 0) {
          return null;
        }

        // Calculate filtered PnL for this strategy with selected broker
        const filteredPnl = filteredTransactions.reduce(
          (sum, transaction) => sum + (transaction.pnlPerTransaction || 0),
          0
        );

        // Filter DateWiseReportList as well
        const filteredDateWiseReports =
          strategy.DateWiseReportList?.map((dateReport) => {
            const filteredDayTransactions =
              dateReport.StrategyWiseTransactionDetailList?.filter(
                (transaction) => transaction.Brokerclientid === selectedBroker
              ) || [];

            // Recalculate daily PnL based on filtered transactions
            const filteredDayPnl = filteredDayTransactions.reduce(
              (sum, transaction) => sum + (transaction.pnlPerTransaction || 0),
              0
            );

            return {
              ...dateReport,
              StrategyWiseTransactionDetailList: filteredDayTransactions,
              pnlDayWise: filteredDayPnl,
              pnlDayWiseGraph: filteredDayPnl,
            };
          }).filter(
            (dateReport) =>
              dateReport.StrategyWiseTransactionDetailList.length > 0
          ) || [];

        // Calculate wins and losses for filtered transactions
        const wins = filteredTransactions.filter(
          (t) => (t.pnlPerTransaction || 0) > 0
        );
        const losses = filteredTransactions.filter(
          (t) => (t.pnlPerTransaction || 0) < 0
        );

        // Calculate average gain and loss
        const avgGain =
          wins.length > 0
            ? wins.reduce((sum, t) => sum + (t.pnlPerTransaction || 0), 0) /
              wins.length
            : 0;
        const avgLoss =
          losses.length > 0
            ? losses.reduce((sum, t) => sum + (t.pnlPerTransaction || 0), 0) /
              losses.length
            : 0;

        return {
          ...strategy,
          pnlStrategyWise: filteredPnl,
          ListOfTransactionsPerStrategy: filteredTransactions,
          DateWiseReportList: filteredDateWiseReports,
          TotalTrade: filteredTransactions.length,
          NoOfWins: wins.length,
          NoOfLosses: losses.length,
          AvgGain: avgGain,
          AvgLoss: avgLoss,
          // Ensure all required fields exist with defaults
          StrategyName: strategy.StrategyName || "",
          StrategyId: strategy.StrategyId || 0,
        };
      })
      .filter((strategy) => strategy !== null);
  }, [strategies, selectedBroker]);
  const colorPalette = [
    "#FFB020",
    "#2563EB",
    "#F59E0B",
    "#10B981",
    "#6366F1",
    "#EC4899",
    "#F97316",
    "#0EA5E9",
    "#84CC16",
    "#D946EF",
  ];
  const donutSegments = filteredStrategies.map((s, i) => ({
    id: s.StrategyId,
    value: Math.abs(s.pnlStrategyWise || 0),
    color: colorPalette[i % colorPalette.length],
  }));

  // Heatmap data (sorted by date ascending) from DictionaryOfDateWisePnl
  // Filter heatmap data based on selected broker
  const heatmapData = useMemo(() => {
    if (selectedBroker === "all") {
      return reportsData?.DictionaryOfDateWisePnl
        ? Object.entries(reportsData.DictionaryOfDateWisePnl)
            .map(([date, value]) => ({ date, value }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        : [];
    }

    // Calculate broker-specific heatmap data
    const brokerSpecificPnl = {};
    filteredStrategies.forEach((strategy) => {
      strategy.DateWiseReportList?.forEach((dateReport) => {
        const date = dateReport.Date.split("T")[0]; // Get date part only
        const dayPnl =
          dateReport.StrategyWiseTransactionDetailList?.filter(
            (transaction) => transaction.Brokerclientid === selectedBroker
          )?.reduce(
            (sum, transaction) => sum + (transaction.pnlPerTransaction || 0),
            0
          ) || 0;

        if (brokerSpecificPnl[date]) {
          brokerSpecificPnl[date] += dayPnl;
        } else {
          brokerSpecificPnl[date] = dayPnl;
        }
      });
    });

    return Object.entries(brokerSpecificPnl)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [
    reportsData?.DictionaryOfDateWisePnl,
    selectedBroker,
    filteredStrategies,
  ]);

  // Handle selected strategy view AFTER all hooks are called
  if (selectedStrategy) {
    return (
      <StrategyReportDetails
        strategy={selectedStrategy}
        dateRange={dateRange}
        onBack={handleBack}
        strategyMode={strategyMode}
        setStrategyMode={setStrategyMode}
        refetchParent={refetch}
      />
    );
  }

  // Monthly totals now rendered inside Heatmap (withMonthlyTotals)

  if (isLoading && !reportsData) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-[#1E2027] rounded-2xl border border-slate-200 dark:border-[#2D2F36] p-4 md:p-5 space-y-4 shadow-sm">
      {/* Tabs */}
      <div className="flex gap-10 text-base font-medium pl-2 border-b border-slate-200 dark:border-[#2D2F36]">
        {["Report", "Trade Engine Logs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-3 text-slate-500 dark:text-slate-400 ${
              activeTab === tab
                ? "text-slate-900 dark:text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[#0096FF]"
                : "hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Row - Only show for Report tab */}
      {activeTab === "Report" && (
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium bg-slate-50 dark:bg-[#15171C] rounded-lg px-3 py-3 border border-transparent dark:border-[#2D2F36]">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">From</span>
            <input
              type="date"
              value={formatDateForInput(dateRange.fromDate)}
              onChange={(e) => handleDateChange("fromDate", e.target.value)}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-sm focus:outline-none dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">To</span>
            <input
              type="date"
              value={formatDateForInput(dateRange.toDate)}
              onChange={(e) => handleDateChange("toDate", e.target.value)}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-sm focus:outline-none dark:text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">
              Select Broker
            </span>
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-sm focus:outline-none min-w-[120px] dark:text-slate-200"
            >
              <option value="all">All</option>
              {reportsData?.DistinctBrokerClientId?.map((brokerId) => (
                <option key={brokerId} value={brokerId}>
                  {brokerId}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex border border-slate-200 dark:border-[#2D2F36] rounded-md overflow-hidden bg-white dark:bg-[#1E2027]">
              <button
                onClick={() => {
                  setStrategyMode("live");
                }}
                className={`px-4 py-1 text-sm font-medium ${
                  strategyMode === "live"
                    ? "bg-[#0096FF]/10 text-[#0096FF]"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Live
              </button>
              <button
                onClick={() => {
                  setStrategyMode("forward");
                }}
                className={`px-4 py-1 text-sm font-medium ${
                  strategyMode === "forward"
                    ? "bg-[#0096FF]/10 text-[#0096FF]"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Forward
              </button>
            </div>
            <PrimaryButton
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-8 px-5 text-sm"
            >
              {isLoading ? "Loading..." : "Get Reports"}
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* Conditional Content Based on Active Tab */}
      {activeTab === "Report" && (
        <>
          {/* Top Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-slate-200 dark:border-[#2D2F36] rounded-xl p-4 flex gap-6 items-center bg-white dark:bg-[#15171C]">
              <div>
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">
                  Strategy Breakdown
                </h4>
                <DonutChart size={140} stroke={20} segments={donutSegments} />
              </div>
              <ul className="space-y-2 text-sm font-medium max-h-[160px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar w-44">
                {filteredStrategies.map((s, i) => (
                  <li key={s.StrategyId} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded"
                      style={{
                        background: colorPalette[i % colorPalette.length],
                      }}
                    ></span>
                    <div
                      className="flex-1 truncate text-slate-500 dark:text-slate-300"
                      title={s.StrategyName}
                    >
                      {s.StrategyName}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        (s.pnlStrategyWise || 0) >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {formatCurrency(s.pnlStrategyWise)}
                    </span>
                  </li>
                ))}
                {!filteredStrategies.length && (
                  <li className="text-slate-400 dark:text-slate-500 text-xs">
                    No data
                  </li>
                )}
              </ul>
            </div>
            <div className="border border-slate-200 dark:border-[#2D2F36] rounded-xl p-4 flex flex-col gap-3 bg-white dark:bg-[#15171C]">
              <Heatmap data={heatmapData} withMonthlyTotals />
            </div>
          </div>

          {/* Strategies List */}
          <div className="space-y-4">
            {error && (
              <div className="text-rose-600 text-base">{error.message}</div>
            )}
            {isLoading && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Loading strategies...
              </div>
            )}
            {!isLoading && !filteredStrategies.length && (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                No strategies found.
              </div>
            )}
            {filteredStrategies.map((s) => (
              <StrategyCard
                key={s.StrategyId}
                strategy={s}
                onSelect={handleStrategyClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Trade Engine Logs Tab Content */}
      {activeTab === "Trade Engine Logs" && (
        <div className="space-y-4">
          {logsError && (
            <div className="text-rose-600 text-base">{logsError.message}</div>
          )}
          {isLogsLoading && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Loading trade engine logs...
            </div>
          )}

          {!isLogsLoading && tradeEngineLogs && tradeEngineLogs.length > 0 && (
            <div className="border border-slate-200 dark:border-[#2D2F36] rounded-xl overflow-hidden bg-white dark:bg-[#15171C]">
              <div className="p-5 pb-3">
                <h4 className="font-medium text-base text-slate-800 dark:text-slate-100">
                  Trade Engine Logs
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-[#1E2027]">
                      <th className="text-left px-5 py-2 font-medium">
                        User ID
                      </th>
                      <th className="text-left px-5 py-2 font-medium">
                        Broker Client ID
                      </th>
                      <th className="text-left px-5 py-2 font-medium">
                        Trade Engine Name
                      </th>
                      <th className="text-left px-5 py-2 font-medium">
                        Start Time
                      </th>
                      <th className="text-left px-5 py-2 font-medium">
                        Stop Time
                      </th>
                      <th className="text-left px-5 py-2 font-medium">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeEngineLogs.map((log, index) => (
                      <tr
                        key={`${log.TradeEngineName}-${index}`}
                        className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <td className="px-5 py-2">{log.UserId}</td>
                        <td className="px-5 py-2">{log.BrokerClientId}</td>
                        <td className="px-5 py-2">{log.TradeEngineName}</td>
                        <td className="px-5 py-2">
                          {log.TradeEngineStartTime || "-"}
                        </td>
                        <td className="px-5 py-2">
                          {log.TradeEngineStopTime || "-"}
                        </td>
                        <td className="px-5 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.Message.includes("started")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : log.Message.includes("stopped")
                                ? "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                                : "bg-slate-50 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400"
                            }`}
                          >
                            {log.Message}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLogsLoading &&
            (!tradeEngineLogs || tradeEngineLogs.length === 0) && (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                No trade engine logs found.
              </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Reports;
