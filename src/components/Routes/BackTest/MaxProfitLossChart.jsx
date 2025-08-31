import React, { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const filterOptions = ["Top 10", "Top 20", "Top 30", "All"];

const MaxProfitLossChart = ({
  scriptDetailList = [],
  scriptSummaryList = [],
}) => {
  const [activeFilter, setActiveFilter] = useState("Top 10");

  // Normalize and flatten trades supporting multiple possible shapes
  // Shapes supported:
  // A) scriptSummaryList = overallResult.ScriptDetailList (array of detail objects each containing ScriptWiseTransactionDetailList)
  // B) scriptSummaryList = array of objects each having ScriptDetailList (nested)
  // C) scriptSummaryList = object with ScriptDetailList property (not array prop passed incorrectly)
  const allTrades = useMemo(() => {
    let baseArray = [];
    // Prefer explicit scriptDetailList prop if provided
    if (Array.isArray(scriptDetailList) && scriptDetailList.length) {
      baseArray = scriptDetailList;
    } else if (Array.isArray(scriptSummaryList)) {
      baseArray = scriptSummaryList; // legacy
    } else if (
      scriptSummaryList &&
      Array.isArray(scriptSummaryList.ScriptDetailList)
    ) {
      baseArray = scriptSummaryList.ScriptDetailList; // legacy object shape
    }

    const trades = [];
    baseArray.forEach((level1) => {
      // If this level already has transactions
      if (Array.isArray(level1.ScriptWiseTransactionDetailList)) {
        level1.ScriptWiseTransactionDetailList.forEach((t) => {
          trades.push({
            TradingSymbol:
              t.TradingSymbol || level1.TradingSymbol || t.UnderlyingScript,
            UnderlyingScript: t.UnderlyingScript || level1.TradingSymbol,
            PNL: t.PNL ?? t.pnl ?? 0,
          });
        });
      }
      // If this level has nested ScriptDetailList (older shape)
      if (Array.isArray(level1.ScriptDetailList)) {
        level1.ScriptDetailList.forEach((detail) => {
          (detail.ScriptWiseTransactionDetailList || []).forEach((t) => {
            trades.push({
              TradingSymbol:
                t.TradingSymbol || detail.TradingSymbol || level1.TradingSymbol,
              UnderlyingScript:
                t.UnderlyingScript ||
                detail.TradingSymbol ||
                level1.TradingSymbol,
              PNL: t.PNL ?? t.pnl ?? 0,
            });
          });
        });
      }
    });
    return trades;
  }, [scriptSummaryList]);

  // Chronological ordering (date-wise). Filtering only changes count, not order.
  const { filteredTrades, avgProfit, avgLoss } = useMemo(() => {
    if (!allTrades.length)
      return { filteredTrades: [], avgProfit: 0, avgLoss: 0 };

    // Attach date object for robust sort
    const tradesWithDate = allTrades.map((t) => {
      const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
      return { ...t, __date: time ? new Date(time) : new Date() };
    });
    // Sort ascending (oldest first)
    tradesWithDate.sort((a, b) => a.__date - b.__date);

    let count = 10;
    if (activeFilter === "Top 20") count = 20;
    else if (activeFilter === "Top 30") count = 30;
    else if (activeFilter === "All") count = tradesWithDate.length;

    const slice = tradesWithDate
      .slice(0, count)
      .map(({ __date, ...rest }) => rest);

    const profitTrades = slice.filter((t) => t.PNL > 0);
    const lossTrades = slice.filter((t) => t.PNL < 0);
    const avgProfit = profitTrades.length
      ? profitTrades.reduce((s, t) => s + t.PNL, 0) / profitTrades.length
      : 0;
    const avgLoss = lossTrades.length
      ? lossTrades.reduce((s, t) => s + t.PNL, 0) / lossTrades.length
      : 0;

    return { filteredTrades: slice, avgProfit, avgLoss };
  }, [allTrades, activeFilter]);

  const data = {
    labels: filteredTrades.map((t) => {
      const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
      if (!time) return "";
      const d = new Date(time);
      const day = String(d.getDate()).padStart(2, "0");
      const mon = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
      return `${day}-${mon}`; // e.g., 07-AUG
    }),
    datasets: [
      {
        label: "Profit/Loss",
        data: filteredTrades.map((t) => t.PNL),
        backgroundColor: (ctx) => (ctx.raw >= 0 ? "#22C55E" : "#EF4444"),
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const formatNumber = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1_00_00_000) return (n / 1_00_00_000).toFixed(2) + "Cr";
    if (abs >= 1_00_000) return (n / 1_00_000).toFixed(2) + "L";
    if (abs >= 1_000) return (n / 1_000).toFixed(2) + "k";
    return n.toFixed(2);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "#888" },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: "#888",
          callback: (val) => formatNumber(val),
        },
        grid: { color: "#eee" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw >= 0 ? "+" : ""}${ctx.raw.toFixed(2)}`,
        },
      },
    },
  };

  return (
    <div className="w-full bg-white dark:bg-darkbg rounded-2xl mb-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Max Profit and Loss
          </h2>
          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            Avg Profit:{" "}
            <span className="text-green-600 font-medium">
              {avgProfit.toFixed(2)}
            </span>{" "}
            | Avg Loss:{" "}
            <span className="text-red-500 font-medium">
              {avgLoss.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
          {filterOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="filter"
                value={opt}
                checked={activeFilter === opt}
                onChange={() => setActiveFilter(opt)}
                className="accent-[#0096FF]"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-[320px] w-full">
        {filteredTrades.length ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No trade data available
          </div>
        )}
      </div>
    </div>
  );
};

export default MaxProfitLossChart;
