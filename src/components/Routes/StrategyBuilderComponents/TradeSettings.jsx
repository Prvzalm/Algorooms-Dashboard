import React, { useState, useEffect } from "react";
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
  const { setValue } = useFormContext();
  const [transactionType, setTransactionType] = useState("Both Side");
  const [chartType, setChartType] = useState("Candle");
  const [interval, setInterval] = useState("1 min");

  // mapping helpers
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

  // push to form whenever user changes
  useEffect(() => {
    setValue("TransactionType", transactionMap[transactionType], {
      shouldDirty: true,
    });
  }, [transactionType, setValue]);

  useEffect(() => {
    setValue("ChartType", chartTypeMap[chartType], { shouldDirty: true });
  }, [chartType, setValue]);

  useEffect(() => {
    setValue("Interval", intervalMap(interval), { shouldDirty: true });
  }, [interval, setValue]);

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
            <FiInfo className="text-gray-400 text-xs" />
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {transactionOptions.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setTransactionType(option)}
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
                onClick={() => setChartType(type)}
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
              onClick={() => setInterval(intvl)}
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
