import React, { useMemo } from "react";
import { formatCurrency } from "../../hooks/reportsHooks";
import DonutChart from "./ui/DonutChart";
import Heatmap from "./ui/Heatmap";
import EquityCurve from "./ui/EquityCurve";
import StrategyCard from "./ui/StrategyCard";

const StrategyReportDetails = ({
  strategy,
  dateRange,
  onBack,
  strategyMode = "live",
  setStrategyMode = () => {},
  refetchParent,
}) => {
  const donutSegments = [
    // replaced static segments with dynamic strategy only (treat wins/loss as separate?) Using absolute pnl slices per date for now
    ...(strategy?.DateWiseReportList || []).map((d, i) => ({
      id: d.Date,
      value: Math.abs(d.pnlDayWise || 0),
      color: ["#FFB020", "#2563EB", "#10B981", "#6366F1", "#EC4899", "#F97316"][
        i % 6
      ],
    })),
  ];

  const equityPoints = useMemo(() => {
    if (!strategy?.DateWiseReportList) return [];
    let cumulative = 0;
    return strategy.DateWiseReportList.map((d) => {
      cumulative += d.pnlDayWise;
      return { x: d.Date, y: cumulative };
    });
  }, [strategy]);

  const heatmapData =
    strategy?.DateWiseReportList?.map((d) => ({
      date: d.Date,
      value: d.pnlDayWise,
    })).sort((a, b) => new Date(a.date) - new Date(b.date)) || [];

  // Monthly totals now rendered inside Heatmap (withMonthlyTotals)

  return (
    <div className="bg-white dark:bg-[#1E2027] rounded-2xl border border-slate-200 dark:border-[#2D2F36] p-4 md:p-5 space-y-5 shadow-sm">
      {/* Top Bar */}
      <div className="flex gap-10 text-[13px] font-medium border-b border-slate-200 dark:border-[#2D2F36]">
        <button
          onClick={onBack}
          className="pr-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
        >
          <span className="text-[16px]">&larr;</span> Back
        </button>
        <button className="relative py-3 text-slate-900 dark:text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[#0096FF]">
          Report
        </button>
        <button className="py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hidden">
          Trade Engine Logs
        </button>
        {/* Controls hidden per request; keeping date display only */}
        <div className="ml-auto flex items-center gap-4 text-[11px] pr-2">
          <div className="text-slate-500">
            From {new Date(dateRange.fromDate).toLocaleDateString("en-GB")}
          </div>
          <div className="text-slate-500">
            To {new Date(dateRange.toDate).toLocaleDateString("en-GB")}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-slate-200 dark:border-[#2D2F36] rounded-xl p-4 flex gap-6 items-center bg-white dark:bg-[#15171C]">
          <div>
            <h4 className="text-[12px] font-medium text-slate-600 dark:text-slate-300 mb-3">
              Strategy Breakdown
            </h4>
            <DonutChart size={140} stroke={20} segments={donutSegments} />
          </div>
          <ul className="space-y-2 text-[11px] font-medium max-h-[160px] overflow-y-auto pr-2 w-44">
            {(strategy?.DateWiseReportList || []).map((d, i) => (
              <li key={d.Date} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded"
                  style={{
                    background: [
                      "#FFB020",
                      "#2563EB",
                      "#10B981",
                      "#6366F1",
                      "#EC4899",
                      "#F97316",
                    ][i % 6],
                  }}
                ></span>
                <span
                  className="flex-1 truncate text-slate-500 dark:text-slate-300"
                  title={new Date(d.Date).toLocaleDateString("en-GB")}
                >
                  {new Date(d.Date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    d.pnlDayWise >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {d.pnlDayWise}
                </span>
              </li>
            ))}
            {!(strategy?.DateWiseReportList || []).length && (
              <li className="text-slate-400 dark:text-slate-500 text-[10px]">
                No data
              </li>
            )}
          </ul>
        </div>
        <div className="border border-slate-200 dark:border-[#2D2F36] rounded-xl p-4 flex flex-col gap-3 bg-white dark:bg-[#15171C]">
          <Heatmap data={heatmapData} withMonthlyTotals />
        </div>
      </div>

      {/* Strategy Expanded Card with Equity + Stats */}
      <div className="rounded-xl border border-slate-200 dark:border-[#2D2F36] overflow-hidden bg-white dark:bg-[#15171C]">
        <div className="p-5 flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-4">
              <h3 className="font-medium text-[15px] text-slate-800 dark:text-slate-100">
                {strategy.StrategyName}
              </h3>
              <div className="flex gap-6 text-[11px] font-medium">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 dark:text-slate-400">
                    Total Traders
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {strategy.TotalTrade}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-emerald-600">P&L</span>
                  <span
                    className={`font-semibold ${
                      strategy.pnlStrategyWise >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(strategy.pnlStrategyWise)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-rose-600">Losses</span>
                  <span className="text-rose-600">
                    {formatCurrency(strategy.AvgLoss || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-[190px] w-full">
              <EquityCurve points={equityPoints} />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 pr-4">
              {equityPoints.slice(0, 5).map((p) => (
                <span key={p.x}>
                  {new Date(p.x).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full max-w-[260px] grid grid-cols-2 gap-x-6 gap-y-3 text-[11px]">
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">
                Winning streak
              </div>
              <div className="font-medium text-slate-700 dark:text-slate-200">
                {strategy.NoOfWins}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">
                Losing streak
              </div>
              <div className="font-medium text-slate-700 dark:text-slate-200">
                {strategy.NoOfLosses}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">
                Max gains
              </div>
              <div className="font-medium text-emerald-600">
                {formatCurrency(strategy.AvgGain || 0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">
                Avg gain/winning trade
              </div>
              <div className="font-medium text-emerald-600">
                {formatCurrency(strategy.AvgGain || 0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">
                Avg loss/losing trade
              </div>
              <div className="font-medium text-rose-600">
                {formatCurrency(strategy.AvgLoss || 0)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 dark:text-slate-400">
                Max Drawdown
              </div>
              <div className="font-medium text-rose-600">-556</div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="border-t border-slate-200 dark:border-[#2D2F36]">
          <div className="p-5 pb-3">
            <h4 className="font-medium text-[13px] text-slate-800 dark:text-slate-100">
              Transaction Details
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-[#1E2027]">
                  <th className="text-left px-5 py-2 font-medium">Date</th>
                  <th className="text-left px-5 py-2 font-medium">Type</th>
                  <th className="text-left px-5 py-2 font-medium">Symbol</th>
                  <th className="text-left px-5 py-2 font-medium">Quantity</th>
                  <th className="text-left px-5 py-2 font-medium">
                    Trade Status
                  </th>
                  <th className="text-left px-5 py-2 font-medium">Entry</th>
                  <th className="text-left px-5 py-2 font-medium">Exit Type</th>
                  <th className="text-left px-5 py-2 font-medium">Status</th>
                  <th className="text-left px-5 py-2 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {strategy.ListOfTransactionsPerStrategy?.map((t, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <td className="px-5 py-2">
                      {new Date(t.TimeStamp).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-2 text-[#0096FF]">
                      {t.TransactionType}
                    </td>
                    <td className="px-5 py-2">{t.TradingSymbol}</td>
                    <td className="px-5 py-2">{t.Quantity}</td>
                    <td className="px-5 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#0096FF]/10 text-[#0096FF] font-medium dark:bg-[#0096FF]/20">
                        {t.OrderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-2">{t.EntryPrice}</td>
                    <td className="px-5 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          t.OrderExitType === "LONG_TARGET"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                        }`}
                      >
                        {t.OrderExitType}
                      </span>
                    </td>
                    <td className="px-5 py-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium dark:bg-emerald-500/20 dark:text-emerald-400">
                        Completed
                      </span>
                    </td>
                    <td className="px-5 py-2 font-medium">
                      <span
                        className={`${
                          t.pnlPerTransaction >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(t.pnlPerTransaction)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyReportDetails;
