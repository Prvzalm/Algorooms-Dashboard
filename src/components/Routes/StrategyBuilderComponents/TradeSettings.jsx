import React from "react";
import { FiInfo } from "react-icons/fi";
import { useFormContext } from "react-hook-form";

const transactionOptions = ["Both Side", "Only Long", "Only Short"];
const chartTypes = ["Candle", "Heikin Ashi"];
const intervals = [
  "1 min",
  "3 min",
  "5 min",
  "10 min",
  "15 min",
  "30 min",
  "1H",
];

const TradeSettings = () => {
  const { setValue, watch } = useFormContext();

  // Use form values directly
  const formTransactionType = watch("TransactionType") ?? 0;
  const formChartType = watch("ChartType") ?? 1;
  const formInterval = watch("Interval") ?? 1;

  // Mapping helpers
  const transactionMap = {
    "Both Side": 0,
    "Only Long": 1,
    "Only Short": 2,
  };
  const chartTypeMap = {
    Candle: 1,
    "Heikin Ashi": 2,
  };
  const intervalMap = (val) => {
    if (val === "1H") return 60;
    const num = parseInt(val, 10);
    return isNaN(num) ? 0 : num;
  };

  // Reverse mapping for display
  const transactionReverseMap = {
    0: "Both Side",
    1: "Only Long",
    2: "Only Short",
  };
  const chartTypeReverseMap = {
    1: "Candle",
    2: "Heikin Ashi",
  };
  const intervalReverseMap = (num) => {
    if (num === 60) return "1H";
    if (num === 1) return "1 min";
    if (num === 3) return "3 min";
    if (num === 5) return "5 min";
    if (num === 10) return "10 min";
    if (num === 15) return "15 min";
    if (num === 30) return "30 min";
    return "1 min";
  };

  // Derive display values from form
  const transactionType =
    transactionReverseMap[formTransactionType] || "Both Side";
  const chartType = chartTypeReverseMap[formChartType] || "Candle";
  const interval = intervalReverseMap(formInterval);

  // Direct handlers without local state
  const handleTransactionChange = (value) => {
    setValue("TransactionType", transactionMap[value], { shouldDirty: true });
  };

  const handleChartTypeChange = (value) => {
    setValue("ChartType", chartTypeMap[value], { shouldDirty: true });
  };

  const handleIntervalChange = (value) => {
    setValue("Interval", intervalMap(value), { shouldDirty: true });
  };

  const baseBtn =
    "px-3 py-2 rounded border text-xs transition whitespace-nowrap";

  return (
    <div className="sbg-white dark:bg-[#1E2027] rounded-xl w-full space-y-6">
      <div className="flex items-center overflow-x-auto w-full space-x-8">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-gray-500 dark:text-gray-400 block text-xs">
              Transaction Type
            </label>
            <span className="relative group inline-flex">
              <button
                type="button"
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center text-[10px] bg-white dark:bg-[#1E2027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B44FE]"
                aria-label="Transaction type information"
              >
                <FiInfo className="text-[10px]" />
              </button>
              <span
                className="pointer-events-none absolute right-0 top-full mt-2 w-48 max-w-xs text-[10px] leading-relaxed text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2027] border border-gray-200 dark:border-[#2A2D35] rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition"
                role="tooltip"
              >
                Choose whether the strategy can place both long and short legs
                or restrict execution to a single direction.
              </span>
            </span>
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {transactionOptions.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => handleTransactionChange(option)}
                className={`${baseBtn} ${
                  transactionType === option
                    ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-[#0F3F62]"
                    : "bg-white text-gray-500 border-gray-300 dark:bg-[#1E2027] dark:text-gray-400 dark:border-[#2C2F36]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-gray-500 dark:text-gray-400 block text-xs mb-1">
            Chart Type
          </label>
          <div className="flex space-x-2 overflow-x-auto">
            {chartTypes.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => handleChartTypeChange(type)}
                className={`${baseBtn} ${
                  chartType === type
                    ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-[#0F3F62]"
                    : "bg-white text-gray-500 border-gray-300 dark:bg-[#1E2027] dark:text-gray-400 dark:border-[#2C2F36]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-gray-500 dark:text-gray-400 block text-xs mb-1">
          Interval
        </label>
        <div className="flex gap-2 overflow-x-auto w-full">
          {intervals.map((intvl) => (
            <button
              type="button"
              key={intvl}
              onClick={() => handleIntervalChange(intvl)}
              className={`${baseBtn} ${
                interval === intvl
                  ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-[#0F3F62]"
                  : "bg-white text-gray-500 border-gray-300 dark:bg-[#1E2027] dark:text-gray-400 dark:border-[#2C2F36]"
              }`}
            >
              {intvl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradeSettings;
