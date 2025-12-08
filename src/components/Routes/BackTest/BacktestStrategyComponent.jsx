import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiChevronDown, FiChevronLeft } from "react-icons/fi";
import BacktestReport from "./BacktestReport";
import BacktestSummaryCard from "./BacktestSummaryCard";
import MaxProfitLossChart from "./MaxProfitLossChart";
import DaywiseBreakdown from "./DaywiseBreakdown";
import TransactionDetails from "./TransactionDetails";
import { useBackTestCounterDetails } from "../../../hooks/backTestHooks";
import { useUserStrategies } from "../../../hooks/strategyHooks";
import { useProfileQuery } from "../../../hooks/profileHooks";
import { useQuery } from "@tanstack/react-query";
import { fetchBacktestResult } from "../../../api/backTestApi";
import BacktestSkeleton from "./BacktestSkeleton";
import PrimaryButton from "../../common/PrimaryButton";

const timeRanges = [
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
  "2 Years",
  "Custom Range",
];

const exportOptions = ["Download PDF", "Email PDF", "View in Browser"];

const BacktestStrategyComponent = ({
  initialStrategyId = null,
  strategyBuilder = false,
}) => {
  // selected strategies can come from URL (strategyId param) or user selection
  const { strategyId } = useParams();
  const navigate = useNavigate();
  const [selectedStrategies, setSelectedStrategies] = useState([]); // array of ids as strings
  const [activeTimeRange, setActiveTimeRange] = useState("1 Month");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [customRange, setCustomRange] = useState([null, null]);
  const [startDate, endDate] = customRange;
  const dropdownRef = useRef(null);
  const strategyDropdownRef = useRef(null);
  const [runToken, setRunToken] = useState(0);

  const handleTimeRangeClick = (range) => {
    if (range === "Custom Range") {
      // Immediately open date picker each time button clicked
      setShowCustomRange(true);
      setActiveTimeRange("Custom Range");
    } else {
      setActiveTimeRange(range);
      setShowCustomRange(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
      if (
        strategyDropdownRef.current &&
        !strategyDropdownRef.current.contains(e.target)
      ) {
        setShowStrategyList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // compute from/to based on activeTimeRange or custom (server expects RFC1123 like 'Thu, 31 Jul 2025 09:19:39 GMT')
  const { fromDateRFC, toDateRFC } = useMemo(() => {
    const end = new Date();
    let start = new Date(end);
    if (activeTimeRange === "1 Month") start.setMonth(start.getMonth() - 1);
    else if (activeTimeRange === "3 Months")
      start.setMonth(start.getMonth() - 3);
    else if (activeTimeRange === "6 Months")
      start.setMonth(start.getMonth() - 6);
    else if (activeTimeRange === "1 Year")
      start.setFullYear(start.getFullYear() - 1);
    else if (activeTimeRange === "2 Years")
      start.setFullYear(start.getFullYear() - 2);
    else if (activeTimeRange === "Custom Range" && startDate && endDate) {
      start = new Date(startDate);
      end.setTime(endDate.getTime());
    }
    const toRFC = (d) => d.toUTCString();
    return { fromDateRFC: toRFC(start), toDateRFC: toRFC(end) };
  }, [activeTimeRange, startDate, endDate]);

  // when strategies or range changes, reset runToken so Run Backtest must be clicked again
  useEffect(() => {
    setRunToken(0);
  }, [selectedStrategies, activeTimeRange, startDate, endDate]);

  // initialize selected strategies from route param or prop (once or when param/prop changes)
  useEffect(() => {
    const idToUse = strategyId || initialStrategyId;
    if (idToUse) {
      setSelectedStrategies([String(idToUse)]);
    }
  }, [strategyId, initialStrategyId]);

  // profile for userId
  const { data: profile } = useProfileQuery();
  const userId = profile?.UserId;
  const apiKey = "abc"; // assumption from sample

  // strategies list
  const { data: strategies } = useUserStrategies({
    page: 1,
    pageSize: 50,
    orderBy: "Date",
  });
  const currentStrategy = useMemo(
    () => strategies?.find((s) => String(s.StrategyId) === String(strategyId)),
    [strategies, strategyId]
  );
  // backtest credit
  const { data: counter } = useBackTestCounterDetails();

  // UI state for strategy dropdown
  const [showStrategyList, setShowStrategyList] = useState(false);

  const handleStrategyToggle = (id) => {
    setSelectedStrategies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Aggregation helper (same as MyPortfolio)
  const aggregateResults = (results) => {
    if (!results.length) return null;
    const dailyMap = {};
    const dateWiseDetailAcc = {};
    const scriptDetails = [];
    const overallAcc = {
      TotalProfitLoss: 0,
      MaxProfit: -Infinity,
      MaxLoss: Infinity,
      WinTrades: 0,
      LoseTrades: 0,
      TotalTrades: 0,
      WinTradesPer: 0,
      LoseTradesPer: 0,
      WinDays: 0,
      LoseDays: 0,
      TotalTradedDays: 0,
      WinDayPer: 0,
      LoseDayPer: 0,
      AverageProfitPerDay: 0,
      AverageLossPerDay: 0,
      CommulitiveDrawDown: 0,
      WinStreak: 0,
      LoseStreak: 0,
    };
    results.forEach((r) => {
      Object.entries(r.DictionaryOfDateWisePnl || {}).forEach(([date, pnl]) => {
        dailyMap[date] = (dailyMap[date] || 0) + pnl;
      });
      (r.DateWiseDetailList || []).forEach((d) => {
        const key = d.Date;
        if (!dateWiseDetailAcc[key]) {
          dateWiseDetailAcc[key] = {
            Date: key,
            ScriptWiseTransactionDetailList: [],
            dateWiseSummary: { TotatProfitLoss: 0 },
          };
        }
        dateWiseDetailAcc[key].ScriptWiseTransactionDetailList.push(
          ...(d.ScriptWiseTransactionDetailList || [])
        );
        dateWiseDetailAcc[key].dateWiseSummary.TotatProfitLoss +=
          d.dateWiseSummary?.TotatProfitLoss || 0;
      });
      if (Array.isArray(r.ScriptDetailList)) {
        scriptDetails.push(...r.ScriptDetailList);
      }
      const o = r.OverAllResultSummary || {};
      overallAcc.TotalProfitLoss += o.TotalProfitLoss || 0;
      if (typeof o.MaxProfit === "number")
        overallAcc.MaxProfit = Math.max(overallAcc.MaxProfit, o.MaxProfit);
      if (typeof o.MaxLoss === "number")
        overallAcc.MaxLoss = Math.min(overallAcc.MaxLoss, o.MaxLoss);
      overallAcc.WinTrades += o.WinTrades || 0;
      overallAcc.LoseTrades += o.LoseTrades || 0;
      overallAcc.TotalTrades += o.TotalTrades || 0;
      overallAcc.WinDays += o.WinDays || 0;
      overallAcc.LoseDays += o.LoseDays || 0;
      overallAcc.WinStreak = Math.max(overallAcc.WinStreak, o.WinStreak || 0);
      overallAcc.LoseStreak = Math.max(
        overallAcc.LoseStreak,
        o.LoseStreak || 0
      );
    });
    const dayEntries = Object.entries(dailyMap).sort(
      (a, b) => new Date(a[0]) - new Date(b[0])
    );
    overallAcc.TotalTradedDays = dayEntries.length;
    const positiveDays = dayEntries.filter(([, pnl]) => pnl > 0);
    const negativeDays = dayEntries.filter(([, pnl]) => pnl < 0);
    overallAcc.WinDays = positiveDays.length;
    overallAcc.LoseDays = negativeDays.length;
    overallAcc.WinDayPer = overallAcc.TotalTradedDays
      ? (overallAcc.WinDays / overallAcc.TotalTradedDays) * 100
      : 0;
    overallAcc.LoseDayPer = overallAcc.TotalTradedDays
      ? (overallAcc.LoseDays / overallAcc.TotalTradedDays) * 100
      : 0;
    overallAcc.AverageProfitPerDay = positiveDays.length
      ? positiveDays.reduce((s, [, pnl]) => s + pnl, 0) / positiveDays.length
      : 0;
    overallAcc.AverageLossPerDay = negativeDays.length
      ? negativeDays.reduce((s, [, pnl]) => s + pnl, 0) / negativeDays.length
      : 0;
    overallAcc.WinTradesPer = overallAcc.TotalTrades
      ? (overallAcc.WinTrades / overallAcc.TotalTrades) * 100
      : 0;
    overallAcc.LoseTradesPer = overallAcc.TotalTrades
      ? (overallAcc.LoseTrades / overallAcc.TotalTrades) * 100
      : 0;
    let peak = 0;
    let maxDD = 0;
    let cumulative = 0;
    dayEntries.forEach(([, pnl]) => {
      cumulative += pnl;
      if (cumulative > peak) peak = cumulative;
      const dd = cumulative - peak;
      if (dd < maxDD) maxDD = dd;
    });
    overallAcc.CommulitiveDrawDown = maxDD;
    return {
      OverAllResultSummary: overallAcc,
      DictionaryOfDateWisePnl: Object.fromEntries(dayEntries),
      DateWiseDetailList: Object.values(dateWiseDetailAcc).sort(
        (a, b) => new Date(a.Date) - new Date(b.Date)
      ),
      ScriptDetailList: scriptDetails,
    };
  };

  // Multi strategy query (aggregated) like MyPortfolio
  const {
    data: portfolioData,
    isFetching: isFetchingMulti,
    error: multiError,
  } = useQuery({
    queryKey: [
      "single-page-portfolio",
      selectedStrategies,
      fromDateRFC,
      toDateRFC,
      runToken,
    ],
    enabled:
      runToken > 0 &&
      selectedStrategies.length > 0 &&
      !!fromDateRFC &&
      !!toDateRFC &&
      !!userId &&
      !!apiKey,
    queryFn: async () => {
      const results = await Promise.all(
        selectedStrategies.map((sid) =>
          fetchBacktestResult({
            strategyId: sid,
            fromDate: fromDateRFC,
            toDate: toDateRFC,
            userId,
            apiKey,
            isMarketPlaceStrategy: false,
            rangeType: "fixed",
          }).then((data) => ({ sid, data }))
        )
      );
      const onlyData = results.map((r) => r.data).filter(Boolean);
      const aggregated = aggregateResults(onlyData);
      const nameMap = Object.fromEntries(
        (strategies || []).map((s) => [
          String(s.StrategyId),
          s.StrategyName || s.Name || s.StrategyId,
        ])
      );
      const perStrategy = results
        .filter((r) => r.data)
        .map((r) => ({
          strategyId: r.sid,
          strategyName: nameMap[r.sid] || r.sid,
          overall: r.data.OverAllResultSummary || {},
          dateWise: r.data.DateWiseDetailList || [],
          dailyPnl: r.data.DictionaryOfDateWisePnl || {},
          raw: r.data,
        }));
      return { aggregated, perStrategy };
    },
    staleTime: 1000 * 60,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const aggregatedData = portfolioData?.aggregated;
  const perStrategy = portfolioData?.perStrategy || [];

  const overall = aggregatedData?.OverAllResultSummary;
  const equityCurve = useMemo(() => {
    if (!aggregatedData?.DictionaryOfDateWisePnl)
      return { labels: [], values: [] };
    const entries = Object.entries(aggregatedData.DictionaryOfDateWisePnl).sort(
      (a, b) => new Date(a[0]) - new Date(b[0])
    );
    let cumul = 0;
    const labels = entries.map(([d]) => d.slice(5));
    const values = entries.map(([_, pnl]) => (cumul += pnl));
    return { labels, values };
  }, [aggregatedData]);

  // Transactions strategy filter
  const [transactionStrategyFilter, setTransactionStrategyFilter] =
    useState("");
  useEffect(() => {
    setTransactionStrategyFilter((prev) => {
      if (prev && selectedStrategies.includes(prev)) return prev;
      return selectedStrategies[0] || "";
    });
  }, [selectedStrategies, runToken]);

  const filteredDateWiseDetails = useMemo(() => {
    if (!transactionStrategyFilter) return [];
    const item = perStrategy.find(
      (p) => p.strategyId === transactionStrategyFilter
    );
    return item?.dateWise;
  }, [transactionStrategyFilter, perStrategy]);

  // metrics and pivot for comparison
  const metricsDefinition = useMemo(
    () => [
      { key: "TotalProfitLoss", label: "Total Cumulative PNL" },
      { key: "TotalTrades", label: "Total Trades" },
      { key: "WinTrades", label: "Win Trades" },
      { key: "LoseTrades", label: "Lose Trades" },
      { key: "TotalTradedDays", label: "Total Trading Days" },
      { key: "WinDays", label: "Winning Days" },
      { key: "LoseDays", label: "Losing Days" },
      { key: "WinDayPer", label: "Winning Day Percentage", suffix: "%" },
      { key: "LoseDayPer", label: "Losing Day Percentage", suffix: "%" },
      { key: "WinTradesPer", label: "Winning Trades Percentage", suffix: "%" },
      { key: "LoseTradesPer", label: "Losing Trades Percentage", suffix: "%" },
      { key: "MaxProfit", label: "Maximum Profit" },
      { key: "MaxLoss", label: "Maximum Loss" },
      { key: "WinStreak", label: "Win Streak" },
      { key: "LoseStreak", label: "Lose Streak" },
      { key: "AverageProfitPerDay", label: "Average Profit Per Day" },
      { key: "AverageLossPerDay", label: "Average Loss Per Day" },
      { key: "CommulitiveDrawDown", label: "Cumulative Drawdown" },
      { key: "TotalDrawDown", label: "Total Drawdown" },
    ],
    []
  );

  const pivotComparison = useMemo(() => {
    if (!perStrategy.length) return [];
    const enriched = perStrategy.map((p) => {
      const o = p.overall || {};
      const totalDrawDown =
        typeof o.TotalDrawDown === "number"
          ? o.TotalDrawDown
          : o.CommulitiveDrawDown;
      return { ...p, overall: { ...o, TotalDrawDown: totalDrawDown } };
    });
    return metricsDefinition.map((m) => ({
      key: m.key,
      label: m.label,
      suffix: m.suffix,
      values: enriched.map((p) => ({
        strategyId: p.strategyId,
        value: p.overall?.[m.key],
      })),
    }));
  }, [perStrategy, metricsDefinition]);

  const numberFmt = (n, digits = 2) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, { maximumFractionDigits: digits })
      : "--";

  const runDisabled =
    isFetchingMulti || !selectedStrategies.length || !fromDateRFC || !toDateRFC;

  const handleRunBacktestSubmit = (e) => {
    e?.preventDefault();
    if (runDisabled) return;
    setRunToken((n) => n + 1);
  };

  return (
    <form
      onSubmit={handleRunBacktestSubmit}
      className="w-full md:p-6 text-[#2E3A59] dark:text-white bg-white dark:bg-[#131419]"
    >
      {strategyId ? (
        <div className="flex items-start gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate("/strategies")}
            className="mt-1 p-2 rounded-md border border-gray-200 dark:border-[#2D2F36] hover:bg-gray-100 dark:hover:bg-[#2A2C33]"
            aria-label="Back to Strategies"
            title="Back"
          >
            <FiChevronLeft />
          </button>
          <div>
            <h2 className="text-lg font-semibold">
              {currentStrategy?.StrategyName ||
                currentStrategy?.Name ||
                "Strategy Backtest"}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Select a time range below and run the backtest.
            </p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold">
            Choose Strategies to Backtest
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Pick one or more than one of your strategies, select a time range,
            and run a backtest to view performance.
          </p>
        </>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        {/* Multi strategy selector - always visible */}
        <div className="w-full sm:w-1/3 relative" ref={strategyDropdownRef}>
          {!strategyBuilder && (
            <button
              type="button"
              className="w-full bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm px-4 py-3 rounded-lg text-left flex justify-between items-center"
              onClick={() => setShowStrategyList((p) => !p)}
            >
              {selectedStrategies.length
                ? `${selectedStrategies
                    .map((s) =>
                      (strategies || []).find(
                        (st) => String(st.StrategyId) === s
                      )
                    )
                    .filter(Boolean)
                    .map((st) => st.StrategyName || st.Name || st.StrategyId)
                    .join(", ")} Selected`
                : "Select Strategies"}
              <FiChevronDown />
            </button>
          )}
          {selectedStrategies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedStrategies.map((id) => {
                const s = (strategies || []).find(
                  (st) => String(st.StrategyId) === id
                );
                const name = s?.StrategyName || s?.Name || id;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 bg-blue-50 dark:bg-[#0F3F62] text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-[#2D2F36] px-2 py-1 rounded-md text-xs"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => handleStrategyToggle(id)}
                      aria-label={`Remove ${name}`}
                      className="leading-none hover:text-blue-900 dark:hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          {showStrategyList && (
            <div className="absolute z-20 mt-2 max-h-72 overflow-auto w-full bg-white dark:bg-[#1E2027] rounded-lg border border-gray-200 dark:border-[#2D2F36] p-2 text-sm shadow">
              {(strategies || []).length === 0 && (
                <div className="text-gray-500 py-2 text-center">
                  No strategies
                </div>
              )}
              {(strategies || []).map((s) => {
                const id = String(s.StrategyId);
                const checked = selectedStrategies.includes(id);
                return (
                  <label
                    key={id}
                    className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-[#2A2C33]"
                  >
                    <input
                      type="checkbox"
                      className="accent-[#0096FF]"
                      checked={checked}
                      onChange={() => handleStrategyToggle(id)}
                    />
                    <span className="truncate">
                      {s.StrategyName || s.Name || id}
                    </span>
                  </label>
                );
              })}
              {selectedStrategies.length > 0 && (
                <button
                  type="button"
                  className="mt-2 w-full text-xs bg-blue-600 text-white py-1 rounded"
                  onClick={() => setSelectedStrategies([])}
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeClick(range)}
              className={`text-sm px-4 py-3 rounded-md border ${
                (activeTimeRange === range && range !== "Custom Range") ||
                (range === "Custom Range" && showCustomRange)
                  ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-[#0F3F62]"
                  : "border-gray-200 dark:border-[#2D2F36] text-[#2E3A59] dark:text-gray-300"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {showCustomRange && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm">Select Date Range:</span>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setCustomRange(update)}
            isClearable
            placeholderText="Choose range"
            className="text-sm px-4 py-3 rounded-md border border-gray-300 dark:border-[#2D2F36] bg-white dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white"
          />
        </div>
      )}

      <div className="flex justify-between items-center border rounded-xl px-4 py-2 text-sm font-medium mb-4">
        <div>
          Backtest Credit:{" "}
          <span className="text-black dark:text-white">
            {counter
              ? `${
                  counter.AllowedBacktestCount - counter.RunningBacktestCount
                }/${counter.AllowedBacktestCount}`
              : "--/--"}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          {portfolioData && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="text-sm px-4 py-2 border border-[#0096FF] rounded-md text-[#0096FF] flex items-center gap-1"
              >
                Export to PDF <FiChevronDown />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-[#1E2027] border rounded shadow-md w-44 z-10">
                  {exportOptions.map((option, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2A2C33] cursor-pointer text-sm"
                      onClick={() => {
                        setShowExportMenu(false);
                        alert(`Selected: ${option}`);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <PrimaryButton
            className="ml-3 text-sm px-4 py-2"
            type="submit"
            disabled={runDisabled}
            title={
              isFetchingMulti
                ? "Backtest running"
                : !selectedStrategies.length
                ? "Select strategies"
                : "Run Backtest"
            }
          >
            {isFetchingMulti ? "Running..." : "Run Backtest"}
          </PrimaryButton>
        </div>
      </div>
      {multiError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">
            {multiError?.response?.data?.Message ||
              multiError?.message ||
              "Failed to fetch backtest result"}
          </p>
        </div>
      )}
      {isFetchingMulti && <BacktestSkeleton />}
      {aggregatedData ? (
        <>
          <BacktestReport overall={overall} equityCurve={equityCurve} />
          <BacktestSummaryCard overall={overall} />
          <MaxProfitLossChart
            scriptDetailList={aggregatedData.ScriptDetailList || []}
            scriptSummaryList={overall?.ScriptSummaryList || []}
          />
          <DaywiseBreakdown
            dictionaryOfDateWisePnl={aggregatedData.DictionaryOfDateWisePnl}
          />
          {/* Strategy Comparison (Pivot) */}
          {perStrategy.length >= 2 && (
            <div className="bg-white dark:bg-darkbg rounded-2xl w-full mb-8">
              <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
                Strategy Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-xs md:text-sm">
                  <thead>
                    <tr className="text-center text-gray-500 dark:text-gray-400 border-b">
                      <th className="py-2 pr-4 w-56">Metric</th>
                      {perStrategy.map((p) => (
                        <th
                          key={p.strategyId}
                          className="py-2 pr-4 min-w-[140px]"
                        >
                          {p.strategyName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pivotComparison.map((row) => (
                      <tr
                        key={row.key}
                        className="text-center border-b last:border-b-0"
                      >
                        <td className="py-2 pr-4 font-medium">{row.label}</td>
                        {row.values.map(({ strategyId, value }) => {
                          const isPositive = [
                            "TotalProfitLoss",
                            "WinTrades",
                            "WinDays",
                            "WinDayPer",
                            "WinTradesPer",
                            "MaxProfit",
                            "WinStreak",
                            "AverageProfitPerDay",
                          ].includes(row.key);
                          const isNegative = [
                            "MaxLoss",
                            "AverageLossPerDay",
                            "CommulativeDrawDown",
                            "TotalDrawDown",
                            "LoseTrades",
                            "LoseDays",
                            "LoseDayPer",
                            "LoseTradesPer",
                            "LoseStreak",
                          ].includes(row.key);
                          const cls =
                            typeof value === "number"
                              ? isPositive
                                ? "text-green-600"
                                : isNegative
                                ? "text-red-500"
                                : ""
                              : "";
                          const display =
                            typeof value === "number"
                              ? numberFmt(value) + (row.suffix || "")
                              : "--";
                          return (
                            <td key={strategyId} className={`py-2 pr-4 ${cls}`}>
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Transactions filter and details */}
          {perStrategy.length > 0 && (
            <div className="mb-4 flex items-center gap-3">
              {perStrategy.length > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Transactions:
                  </span>
                  <select
                    value={transactionStrategyFilter}
                    onChange={(e) =>
                      setTransactionStrategyFilter(e.target.value)
                    }
                    className="bg-[#F5F8FA] dark:bg-[#2D2F36] border border-gray-200 dark:border-[#2D2F36] rounded-md px-3 py-1 outline-none"
                  >
                    {perStrategy.map((p) => (
                      <option key={p.strategyId} value={p.strategyId}>
                        {p.strategyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          <TransactionDetails dateWiseDetailList={filteredDateWiseDetails} />
        </>
      ) : (
        !isFetchingMulti && (
          <div className="flex items-center justify-center h-[30vh]">
            <div className="text-[#718EBF] dark:text-gray-400 text-sm">
              {selectedStrategies.length
                ? "Click Run Backtest to view results"
                : "Select strategies to start"}
            </div>
          </div>
        )
      )}
    </form>
  );
};

export default BacktestStrategyComponent;
