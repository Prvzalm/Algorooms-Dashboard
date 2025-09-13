import React, { useState } from "react";
import {
  useUserReports,
  getDefaultDateRange,
  formatCurrency,
} from "../../hooks/reportsHooks";
import StrategyReportDetails from "./StrategyReportDetails";
import DonutChart from "./ui/DonutChart";
import Heatmap from "./ui/Heatmap";
import StrategyCard from "./ui/StrategyCard";

const Reports = () => {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [activeTab, setActiveTab] = useState("Report");
  const [strategyMode, setStrategyMode] = useState("live"); // 'live' | 'forward'

  const effectiveMode = strategyMode === "forward" ? "paper" : "live";

  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useUserReports({
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    brokerClientFilter: "all",
    strategyMode: effectiveMode,
  });

  const formatDateForInput = (dateString) =>
    new Date(dateString).toISOString().split("T")[0];
  const handleDateChange = (field, value) =>
    setDateRange((prev) => ({
      ...prev,
      [field]: new Date(value).toISOString(),
    }));
  const handleStrategyClick = (s) => setSelectedStrategy(s);
  const handleBack = () => setSelectedStrategy(null);

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

  const strategies = reportsData?.ListOfStrategies || [];
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
  const donutSegments = strategies.map((s, i) => ({
    id: s.StrategyId,
    value: Math.abs(s.pnlStrategyWise || 0),
    color: colorPalette[i % colorPalette.length],
  }));

  // Heatmap data (sorted by date ascending) from DictionaryOfDateWisePnl
  const heatmapData = reportsData?.DictionaryOfDateWisePnl
    ? Object.entries(reportsData.DictionaryOfDateWisePnl)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  // Monthly totals now rendered inside Heatmap (withMonthlyTotals)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-5 space-y-4 shadow-sm">
      {/* Tabs */}
      <div className="flex gap-10 text-[13px] font-medium pl-2 border-b border-slate-200 dark:border-slate-700">
        {["Report", "Trade Engine Logs"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-3 text-slate-500 ${
              activeTab === tab
                ? "text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[#0096FF]"
                : "hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">From</span>
          <input
            type="date"
            value={formatDateForInput(dateRange.fromDate)}
            onChange={(e) => handleDateChange("fromDate", e.target.value)}
            className="h-8 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-[12px] focus:outline-none dark:text-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">To</span>
          <input
            type="date"
            value={formatDateForInput(dateRange.toDate)}
            onChange={(e) => handleDateChange("toDate", e.target.value)}
            className="h-8 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-[12px] focus:outline-none dark:text-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Select Broker</span>
          <select className="h-8 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-[12px] focus:outline-none min-w-[120px] dark:text-slate-200">
            <option value="all">All</option>
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex border border-slate-200 dark:border-slate-600 rounded-md overflow-hidden">
            <button
              onClick={() => {
                setStrategyMode("live");
                refetch();
              }}
              className={`px-4 py-1 text-[12px] font-medium ${
                strategyMode === "live"
                  ? "bg-[#0096FF]/10 text-[#0096FF]"
                  : "text-slate-500"
              }`}
            >
              Live
            </button>
            <button
              onClick={() => {
                setStrategyMode("forward");
                refetch();
              }}
              className={`px-4 py-1 text-[12px] font-medium ${
                strategyMode === "forward"
                  ? "bg-[#0096FF]/10 text-[#0096FF]"
                  : "text-slate-500"
              }`}
            >
              Forward
            </button>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 px-5 rounded-md bg-[#0096FF] text-white text-[12px] font-semibold disabled:opacity-60"
          >
            {isLoading ? "Loading..." : "Get Reports"}
          </button>
        </div>
      </div>

      {/* Top Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex gap-6 items-center bg-white dark:bg-slate-800">
          <div>
            <h4 className="text-[12px] font-medium text-slate-600 mb-3">
              Strategy Breakdown
            </h4>
            <DonutChart size={140} stroke={20} segments={donutSegments} />
          </div>
          <ul className="space-y-2 text-[11px] font-medium max-h-[160px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar w-44">
            {strategies.map((s, i) => (
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
                  className={`text-[10px] font-semibold ${
                    (s.pnlStrategyWise || 0) >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {formatCurrency(s.pnlStrategyWise)}
                </span>
              </li>
            ))}
            {!strategies.length && (
              <li className="text-slate-400 dark:text-slate-500 text-[10px]">
                No data
              </li>
            )}
          </ul>
        </div>
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3 bg-white dark:bg-slate-800">
          <Heatmap data={heatmapData} withMonthlyTotals />
        </div>
      </div>

      {/* Strategies List */}
      <div className="space-y-4">
        {error && <div className="text-rose-600 text-sm">{error.message}</div>}
        {isLoading && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Loading strategies...
          </div>
        )}
        {!isLoading && !strategies.length && (
          <div className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
            No strategies found.
          </div>
        )}
        {strategies.map((s) => (
          <StrategyCard
            key={s.StrategyId}
            strategy={s}
            onSelect={handleStrategyClick}
          />
        ))}
      </div>
    </div>
  );
};

export default Reports;
