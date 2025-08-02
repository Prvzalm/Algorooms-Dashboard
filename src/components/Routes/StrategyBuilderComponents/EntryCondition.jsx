import React, { useState } from "react";
import { FiTrash, FiInfo } from "react-icons/fi";

const initialCondition = {
  long: { left: "", comparator: "", right: "", info: "" },
  short: { left: "", comparator: "", right: "", info: "" },
};

const EntryCondition = () => {
  const [conditions, setConditions] = useState([{ ...initialCondition }]);
  const [useCombinedChart, setUseCombinedChart] = useState(false);
  const [exitConditions, setExitConditions] = useState(false);

  const handleChange = (index, type, field, value) => {
    const updated = [...conditions];
    updated[index][type][field] = value;
    setConditions(updated);
  };

  const addCondition = () => {
    setConditions([...conditions, { ...initialCondition }]);
  };

  const removeCondition = (index) => {
    const updated = [...conditions];
    updated.splice(index, 1);
    setConditions(updated);
  };

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-[#15171C]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg text-black dark:text-white">
          Entry Conditions
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={useCombinedChart}
            onChange={(e) => setUseCombinedChart(e.target.checked)}
          />
          Use Combined Chart <FiInfo className="text-gray-400" />
        </label>
      </div>

      {conditions.map((block, idx) => (
        <div
          key={idx}
          className="border border-dashed border-gray-200 rounded-xl p-4 mb-4 relative"
        >
          <p className="text-green-600 font-semibold mb-2">
            Long Entry Conditions
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-1">
            {["left", "comparator", "right"].map((field, fIdx) => (
              <select
                key={fIdx}
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                value={block.long[field]}
                onChange={(e) =>
                  handleChange(idx, "long", field, e.target.value)
                }
              >
                <option value="">
                  Select{" "}
                  {field === "left"
                    ? "Indicator"
                    : field === "right"
                    ? "Indicator"
                    : "Comparator"}
                </option>
                <option value="Moving Average">Moving Average</option>
                <option value="RSI">RSI</option>
              </select>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            MovingAverage(10) MovingAverageType(SMA) Interval(0)
          </p>

          <p className="text-red-500 font-semibold mt-6 mb-2">
            Short Entry Conditions
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-1">
            {["left", "comparator", "right"].map((field, fIdx) => (
              <select
                key={fIdx}
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                value={block.short[field]}
                onChange={(e) =>
                  handleChange(idx, "short", field, e.target.value)
                }
              >
                <option value="">
                  Select{" "}
                  {field === "left"
                    ? "Indicator"
                    : field === "right"
                    ? "Indicator"
                    : "Comparator"}
                </option>
                <option value="Moving Average">Moving Average</option>
                <option value="RSI">RSI</option>
              </select>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            MovingAverage(10) MovingAverageType(SMA) Interval(0)
          </p>

          {conditions.length > 1 && (
            <button
              onClick={() => removeCondition(idx)}
              className="absolute right-4 top-4 text-red-400 hover:text-red-600"
            >
              <FiTrash />
            </button>
          )}

          {idx < conditions.length - 1 && (
            <div className="text-center mt-4">
              <div className="inline-flex rounded-md border border-gray-300">
                <button className="px-4 py-1 bg-blue-500 text-white text-xs rounded-l">
                  AND
                </button>
                <button className="px-4 py-1 text-gray-500 text-xs">OR</button>
              </div>
            </div>
          )}
        </div>
      ))}

      <label className="flex items-center gap-2 text-sm text-gray-500 mt-4">
        <input
          type="checkbox"
          checked={exitConditions}
          onChange={(e) => setExitConditions(e.target.checked)}
        />
        Exit Conditions{" "}
        <span className="text-xs text-gray-400">(Optional)</span>
      </label>

      <div className="mt-4 text-right">
        <button
          onClick={addCondition}
          className="bg-[#0096FF] text-white text-sm px-4 py-3 rounded-lg hover:bg-blue-600"
        >
          + Add Condition
        </button>
      </div>
    </div>
  );
};

export default EntryCondition;
