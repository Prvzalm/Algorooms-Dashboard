import React, { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getPnlTextClass } from "../../../services/utils/formatters";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Filler);

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
            // Preserve original time fields so later chart code can access them
            EntryTimeStamp: t.EntryTimeStamp,
            TimeStamp: t.TimeStamp,
            EntryDate: t.EntryDate,
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
              EntryTimeStamp: t.EntryTimeStamp,
              TimeStamp: t.TimeStamp,
              EntryDate: t.EntryDate,
            });
          });
        });
      }
    });
    return trades;
  }, [scriptSummaryList, scriptDetailList]);

  // Build full chronological timeline and compute which indices are selected by filter
  const { fullChrono, selectedIndexSet, avgProfit, avgLoss } = useMemo(() => {
    if (!allTrades.length)
      return {
        fullChrono: [],
        selectedIndexSet: new Set(),
        avgProfit: 0,
        avgLoss: 0,
      };

    const tradesWithDate = allTrades.map((t, idx) => {
      const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
      return { ...t, __date: time ? new Date(time) : new Date(), __idx: idx };
    });
    // Full chronological list
    tradesWithDate.sort((a, b) => a.__date - b.__date);

    // Default: select none
    let idSet = new Set();

    // For 'All' select all
    if (activeFilter === "All") {
      tradesWithDate.forEach((t) => idSet.add(t.__idx));
    } else {
      let n = 10;
      if (activeFilter === "Top 20") n = 20;
      else if (activeFilter === "Top 30") n = 30;

      const profitsSorted = [...tradesWithDate]
        .filter((t) => t.PNL > 0)
        .sort((a, b) => b.PNL - a.PNL)
        .slice(0, n);
      const lossesSorted = [...tradesWithDate]
        .filter((t) => t.PNL < 0)
        .sort((a, b) => a.PNL - b.PNL)
        .slice(0, n);

      profitsSorted.forEach((t) => idSet.add(t.__idx));
      lossesSorted.forEach((t) => idSet.add(t.__idx));
    }

    // Averages computed over selected indices only
    const selectedChrono = tradesWithDate.filter((t) => idSet.has(t.__idx));
    const profitTrades = selectedChrono.filter((t) => t.PNL > 0);
    const lossTrades = selectedChrono.filter((t) => t.PNL < 0);
    const avgProfit = profitTrades.length
      ? profitTrades.reduce((s, t) => s + t.PNL, 0) / profitTrades.length
      : 0;
    const avgLoss = lossTrades.length
      ? lossTrades.reduce((s, t) => s + t.PNL, 0) / lossTrades.length
      : 0;

    return {
      fullChrono: tradesWithDate,
      selectedIndexSet: idSet,
      avgProfit,
      avgLoss,
    };
  }, [allTrades, activeFilter]);

  // selectedChrono derived for zoom-to-selection mode
  const selectedChrono = useMemo(() => {
    if (!fullChrono || !fullChrono.length) return [];
    return fullChrono.filter((t) => selectedIndexSet.has(t.__idx));
  }, [fullChrono, selectedIndexSet]);

  // Build chart data along the full chronological timeline. Bars only shown for selected indices; others are null to keep spacing.
  const data = useMemo(() => {
    const timelineLabels = fullChrono.map((t) => {
      const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
      if (!time) return "";
      const d = new Date(time);
      const day = String(d.getDate()).padStart(2, "0");
      const mon = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
      return `${day}\n${mon}`;
    });
    const values = fullChrono.map((t) =>
      selectedIndexSet.has(t.__idx) ? t.PNL : null
    );

    // data for selection-only zoom mode
    const selLabels = selectedChrono.map((t) => {
      const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
      if (!time) return "";
      const d = new Date(time);
      const day = String(d.getDate()).padStart(2, "0");
      const mon = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
      return `${day}\n${mon}`;
    });
    const selValues = selectedChrono.map((t) => t.PNL);

    return {
      labels: timelineLabels,
      datasets: [
        {
          label: "Profit/Loss",
          data: values,
          // also prepare selection-only dataset for zoom mode
          _selection: { labels: selLabels, data: selValues },
          backgroundColor: (ctx) =>
            ctx.raw === null
              ? "transparent"
              : ctx.raw >= 0
              ? "#22C55E"
              : "#EF4444",
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    };
  }, [fullChrono, selectedIndexSet]);

  const formatNumber = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1_00_00_000) return (n / 1_00_00_000).toFixed(2) + "Cr";
    if (abs >= 1_00_000) return (n / 1_00_000).toFixed(2) + "L";
    if (abs >= 1_000) return (n / 1_000).toFixed(2) + "k";
    return n.toFixed(2);
  };

  // Month wise counts from ALL trades (not affected by top filters) so user sees real totals
  const allTradesMonthCounts = useMemo(() => {
    const map = {};
    allTrades.forEach((t) => {
      const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
      if (!time) return;
      const d = new Date(time);
      const key = d.getFullYear() + "-" + d.getMonth();
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [allTrades]);

  // Precompute month segments across the full chronological timeline so spacing reflects real counts
  const monthSegments = useMemo(() => {
    const segments = [];
    let current = null;
    fullChrono.forEach((t, idx) => {
      const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
      const d = time ? new Date(time) : null;
      if (!d) return;
      const key = d.getFullYear() + "-" + d.getMonth();
      const baseLabel = d.toLocaleString("en-US", { month: "short" });

      if (!current || current.key !== key) {
        if (current) current.end = idx - 1;
        current = { key, baseLabel, start: idx, end: idx };
        segments.push(current);
      } else {
        current.end = idx;
      }
    });
    segments.forEach((seg) => {
      seg.filteredCount = seg.end - seg.start + 1;
      seg.totalCount = allTradesMonthCounts[seg.key] || seg.filteredCount;
      seg.label = `${seg.baseLabel} (${seg.totalCount})`;
    });
    return segments;
  }, [fullChrono, allTradesMonthCounts]);

  const monthBandPlugin = {
    id: "monthBands",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const scaleX = scales.x;
      if (!scaleX || !monthSegments.length) return;
      ctx.save();
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#444";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const y = chartArea.bottom + 18; // under tick labels

      // baseline
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, chartArea.bottom + 2);
      ctx.lineTo(chartArea.right, chartArea.bottom + 2);
      ctx.stroke();

      monthSegments.forEach((seg, i) => {
        const startPixel = scaleX.getPixelForValue(seg.start);
        const endPixel = scaleX.getPixelForValue(seg.end);
        const mid = (startPixel + endPixel) / 2;

        // Draw plain month label (no box)
        ctx.fillStyle = "#333";
        ctx.fillText(seg.label, mid, y);

        // Vertical dashed separator at month boundary (except first)
        if (i > 0) {
          const prevEnd = monthSegments[i - 1].end;
          const boundaryX =
            (scaleX.getPixelForValue(prevEnd) +
              scaleX.getPixelForValue(seg.start)) /
            2;
          ctx.save();
          ctx.strokeStyle = "#bbb";
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(boundaryX, chartArea.top);
          ctx.lineTo(boundaryX, chartArea.bottom);
          ctx.stroke();
          ctx.restore();
        }
      });
      ctx.restore();
    },
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: "#555",
          callback: function (val, idx) {
            const label = this.getLabelForValue(val);
            if (!label) return "";
            const [day, mon] = label.split("\n");
            return day; // only day on tick row
          },
          maxRotation: 0,
          autoSkip: true,
        },
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
          title: (items) => {
            if (!items.length) return "";
            const idx = items[0].dataIndex;
            const val = items[0].raw;
            if (val === null || val === undefined) return "";
            const t = fullChrono[idx];
            const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
            const d = time ? new Date(time) : null;
            if (!d) return "";
            return d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          },
          label: (ctx) => {
            const val = ctx.raw;
            if (val === null || val === undefined) return "";
            const idx = ctx.dataIndex;
            const t = fullChrono[idx];
            const time = t.EntryTimeStamp || t.TimeStamp || t.EntryDate;
            const d = time ? new Date(time) : null;
            const dateStr = d
              ? d.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "";
            return ` ${dateStr}  PNL: ${val >= 0 ? "+" : ""}${val.toFixed(2)}`;
          },
        },
      },
    },
    layout: { padding: { bottom: 58 } },
  };

  const avgProfitClass = getPnlTextClass(avgProfit, {
    neutral: "text-gray-500 dark:text-gray-400",
  });
  const avgLossClass = getPnlTextClass(avgLoss, {
    neutral: "text-gray-500 dark:text-gray-400",
  });

  return (
    <div className="w-full bg-white dark:bg-darkbg rounded-2xl mb-8">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h2 className="text-lg font-semibold text-black dark:text-white">
            Max Profit and Loss
          </h2>
          <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            Avg Profit:{" "}
            <span className={`${avgProfitClass} font-medium`}>
              {avgProfit.toFixed(2)}
            </span>{" "}
            | Avg Loss:{" "}
            <span className={`${avgLossClass} font-medium`}>
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

      <div className="w-full" style={{ height: `320px` }}>
        {fullChrono && fullChrono.length ? (
          data.datasets[0]._selection.data.length && (
            <Bar
              data={{
                labels: data.datasets[0]._selection.labels,
                datasets: [
                  {
                    ...data.datasets[0],
                    data: data.datasets[0]._selection.data,
                    barPercentage: 0.6,
                  },
                ],
              }}
              options={options}
              plugins={[monthBandPlugin]}
            />
          )
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
