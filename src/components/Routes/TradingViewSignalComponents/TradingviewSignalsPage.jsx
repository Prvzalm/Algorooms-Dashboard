import { useState, useEffect } from "react";
import StrategyBuilderLeg from "../StrategyBuilderComponents/Leg1";
import OrderType from "../StrategyBuilderComponents/OrderType";
import RiskAndAdvance from "../StrategyBuilderComponents/RiskAndAdvance";

const TradingviewSignalsPage = ({ data }) => {
  const [selectedSignals, setSelectedSignals] = useState([]);

  const sampleData = {
    signalTypes: [
      "TradingView Indicators",
      "TradingView Strategy (Pinescript)",
      "Chartink",
      "Multi Stocks from Chartink",
    ],
    strategyTypes: ["Time Based", "Indicator Based", "Price Action Based"],
  };

  const handleSignalToggle = (signal) => {
    setSelectedSignals((prev) =>
      prev.includes(signal)
        ? prev.filter((s) => s !== signal)
        : [...prev, signal]
    );
  };

  return (
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-200 px-4 md:px-0 overflow-hidden">
      <div className="p-4 border rounded-xl space-y-4 dark:bg-[#15171C] dark:border-[#1E2027]">
        <h2 className="font-semibold dark:text-white">Select Signal From</h2>
        <div className="flex flex-wrap gap-4">
          {sampleData.signalTypes.map((signal, i) => (
            <label key={i} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedSignals.includes(signal)}
                onChange={() => handleSignalToggle(signal)}
              />
              <span>{signal}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-xl space-y-4 dark:bg-[#15171C] dark:border-[#1E2027]">
              <h2 className="font-semibold dark:text-white">Strategy Type</h2>
              {sampleData.strategyTypes.map((type, i) => (
                <label key={i} className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>{type}</span>
                </label>
              ))}
            </div>

            <div className="p-4 border rounded-xl space-y-4 dark:bg-[#15171C] dark:border-[#1E2027]">
              <h2 className="font-semibold dark:text-white">
                Select Instruments
              </h2>
              <div className="border-dashed border dark:border-[#1E2027] rounded-lg min-h-[6rem] flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">+ Add</span>
              </div>
            </div>
          </div>

          <OrderType />
        </div>

        <div className="overflow-x-hidden">
          <StrategyBuilderLeg />
        </div>
      </div>

      <div className="overflow-x-hidden">
        <RiskAndAdvance />
      </div>
    </div>
  );
};

export default TradingviewSignalsPage;
