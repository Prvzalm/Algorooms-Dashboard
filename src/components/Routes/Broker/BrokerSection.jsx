import { useState } from "react";
import { upStox } from "../../../assets";
import { useNavigate } from "react-router-dom";

const BrokerSection = () => {
  const [isTerminalEnabled, setIsTerminalEnabled] = useState(false);
  const [isTradingEngineEnabled, setIsTradingEngineEnabled] = useState(false);
  const navigate = useNavigate();

  const brokers = [
    {
      name: "Upstox",
      code: "4UA3FE",
      performance: "0.00",
      logo: upStox,
    },
  ];

  return (
    <div className="w-full px-4 py-6">
      <div className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#2E3A59] dark:text-white">
              Broker
            </h2>
            <p className="text-sm text-[#718EBF] dark:text-[#A0AEC0]">
              Lorem Ipsum donor
            </p>
          </div>
          <button
            onClick={() => navigate("/add-broker")}
            className="px-4 py-2 bg-[#0096FF] text-white rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            + Add Broker
          </button>
        </div>

        <div className="space-y-4">
          {brokers.map((broker, index) => (
            <div
              key={index}
              className="border border-[#E4EAF0] dark:border-[#2D2F36] rounded-xl p-4 bg-white dark:bg-[#1F1F24] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={broker.logo}
                  alt="broker logo"
                  className="w-12 h-12 sm:w-16 sm:h-16"
                />
                <div>
                  <p className="font-semibold text-[#2E3A59] dark:text-white">
                    {broker.name}
                  </p>
                  <p className="text-xs text-[#718EBF]">{broker.code}</p>
                </div>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                  Strategy Performance
                </p>
                <p className="font-semibold text-[#2E3A59] dark:text-white">
                  {broker.performance}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                  Terminal
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isTerminalEnabled}
                    onChange={() => setIsTerminalEnabled(!isTerminalEnabled)}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-[#2D2F36] peer-focus:outline-none rounded-full peer peer-checked:bg-[#0096FF] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                  Trading Engine
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isTradingEngineEnabled}
                    onChange={() =>
                      setIsTradingEngineEnabled(!isTradingEngineEnabled)
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-[#2D2F36] peer-focus:outline-none rounded-full peer peer-checked:bg-[#0096FF] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrokerSection;
