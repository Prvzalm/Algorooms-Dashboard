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
import {
  useBacktestResult,
  useBackTestCounterDetails,
} from "../../../hooks/backTestHooks";
import { useUserStrategies } from "../../../hooks/strategyHooks";
import { useProfileQuery } from "../../../hooks/profileHooks";

const timeRanges = [
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
  "2 Years",
  "Custom Range",
];

const exportOptions = ["Download PDF", "Email PDF", "View in Browser"];

const BacktestStrategyComponent = () => {
  // selectedStrategy can come from URL (strategyId param) or user dropdown selection
  const { strategyId } = useParams();
  const navigate = useNavigate();
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [activeTimeRange, setActiveTimeRange] = useState("1 Month");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [customRange, setCustomRange] = useState([null, null]);
  const [startDate, endDate] = customRange;
  const dropdownRef = useRef(null);
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

  // when strategy or range changes, reset runToken so Run Backtest must be clicked again
  useEffect(() => {
    setRunToken(0);
  }, [selectedStrategy, activeTimeRange, startDate, endDate]);

  // initialize selected strategy from route param (once or when param changes)
  useEffect(() => {
    if (strategyId) {
      setSelectedStrategy(strategyId);
    }
  }, [strategyId]);

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

  const {
    data: backtestData,
    isFetching,
    error,
  } = useBacktestResult({
    strategyId: selectedStrategy,
    from: fromDateRFC,
    to: toDateRFC,
    userId,
    apiKey,
    // we'll only enable the hook when user clicks Run Backtest
    rangeType: "fixed",
    enabled: runToken > 0,
    runToken,
    isMarketPlaceStrategy: false,
  });

  // No-op: runToken is used to control when query runs (it is part of queryKey)

  const overall = backtestData?.OverAllResultSummary;
  const equityCurve = useMemo(() => {
    if (!backtestData?.DictionaryOfDateWisePnl)
      return { labels: [], values: [] };
    const entries = Object.entries(backtestData.DictionaryOfDateWisePnl).sort(
      (a, b) => new Date(a[0]) - new Date(b[0])
    );
    let cumulative = 0;
    const labels = entries.map(([d]) => d.slice(5)); // MM-DD
    const values = entries.map(([_, pnl]) => (cumulative += pnl));
    return { labels, values };
  }, [backtestData]);

  return (
    <div className="w-full md:p-6 text-[#2E3A59] dark:text-white">
      {strategyId ? (
        <div className="flex items-start gap-3 mb-6">
          <button
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
          <h2 className="text-lg font-semibold">Choose Strategy to Backtest</h2>
          <p className="text-sm text-gray-400 mb-6">Lorem Ipsum donor</p>
        </>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        {!strategyId && (
          <div className="w-full sm:w-1/3">
            <select
              className="w-full bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm px-4 py-3 rounded-lg text-[#2E3A59] dark:text-white"
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
            >
              <option value="">Select Strategy</option>
              {strategies?.map((s) => (
                <option key={s.StrategyId} value={s.StrategyId}>
                  {s.StrategyName || s.Name || s.StrategyId}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeClick(range)}
              className={`text-sm px-4 py-3 rounded-md border ${
                (activeTimeRange === range && range !== "Custom Range") ||
                (range === "Custom Range" && showCustomRange)
                  ? "bg-[#0096FF] text-white border-[#0096FF]"
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
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="text-sm px-4 py-3 border border-[#0096FF] rounded-md text-[#0096FF] flex items-center gap-1"
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
          <button
            className={`ml-3 text-sm px-4 py-2 rounded-md text-white ${
              isFetching ? "bg-gray-400" : "bg-[#0096FF]"
            }`}
            onClick={() => setRunToken((n) => n + 1)}
            disabled={
              isFetching || !selectedStrategy || !fromDateRFC || !toDateRFC
            }
            title={
              isFetching
                ? "Backtest running"
                : !selectedStrategy
                ? "Select a strategy"
                : "Run Backtest"
            }
          >
            {isFetching ? "Running..." : "Run Backtest"}
          </button>
        </div>
      </div>
      {error && (
        <div className="text-red-500 mb-4 text-sm">{error.message}</div>
      )}
      {isFetching && (
        <div className="mb-4 text-sm">Loading backtest data...</div>
      )}
      {backtestData && (
        <>
          <BacktestReport overall={overall} equityCurve={equityCurve} />
          <BacktestSummaryCard overall={overall} />
          <MaxProfitLossChart
            scriptDetailList={backtestData.ScriptDetailList || []}
            scriptSummaryList={overall?.ScriptSummaryList || []} // backward compatibility
          />
          <DaywiseBreakdown
            dictionaryOfDateWisePnl={backtestData.DictionaryOfDateWisePnl}
          />
          <TransactionDetails
            dateWiseDetailList={backtestData.DateWiseDetailList}
          />
        </>
      )}
    </div>
  );
};

export default BacktestStrategyComponent;
