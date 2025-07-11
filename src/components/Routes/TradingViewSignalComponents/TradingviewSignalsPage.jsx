import { useState, useEffect } from "react";
import StrategyBuilderLeg from "../StrategyBuilderComponents/Leg1";
import OrderType from "../StrategyBuilderComponents/OrderType";
import RiskAndAdvance from "../StrategyBuilderComponents/RiskAndAdvance";
import InstrumentModal from "../StrategyBuilderComponents/InstrumentModal";

const TradingviewSignalsPage = () => {
  const [selectedSignals, setSelectedSignals] = useState([]);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState("");

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
    <div className="space-y-6 text-sm text-gray-700 dark:text-gray-200 overflow-hidden">
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
              <div
                onClick={() => setShowInstrumentModal(true)}
                className="border-dashed border dark:border-[#1E2027] rounded-lg min-h-[6rem] flex items-center justify-center cursor-pointer dark:bg-[#1E2027]"
              >
                <span className="text-gray-400 dark:text-gray-500 text-xl">
                  + Add
                </span>
              </div>
              {selectedInstrument && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs break-words dark:bg-[#1E2027] dark:text-blue-400">
                    {selectedInstrument}
                  </span>
                </div>
              )}
            </div>
            <InstrumentModal
              visible={showInstrumentModal}
              onClose={() => setShowInstrumentModal(false)}
              selected={selectedInstrument}
              setSelected={setSelectedInstrument}
            />
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
