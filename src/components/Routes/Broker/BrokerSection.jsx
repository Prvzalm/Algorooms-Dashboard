import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserBrokerData } from "../../../hooks/dashboardHooks";

const BrokerSection = () => {
  const [terminalToggles, setTerminalToggles] = useState({});
  const [engineToggles, setEngineToggles] = useState({});
  const navigate = useNavigate();

  const { data: brokers = [], isLoading, isError } = useUserBrokerData();

  const handleToggleTerminal = (id) => {
    setTerminalToggles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleEngine = (id) => {
    setEngineToggles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full md:p-4">
      <div className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#2E3A59] dark:text-white">
              Broker
            </h2>
            <p className="text-sm text-[#718EBF] dark:text-[#A0AEC0]">
              Manage your connected brokers
            </p>
          </div>
          <button
            onClick={() => navigate("/add-broker")}
            className="px-4 py-3 bg-[#0096FF] text-white rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            + Add Broker
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading brokers...</div>
        ) : isError ? (
          <div className="text-center text-red-500">
            Failed to load broker data.
          </div>
        ) : brokers.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <img src={emptyDeployedStrategy} alt="No brokers" />
          </div>
        ) : (
          <div className="space-y-4">
            {brokers.map((broker, index) => (
              <div
                key={index}
                className="border border-[#E4EAF0] dark:border-[#2D2F36] rounded-xl p-4 bg-white dark:bg-[#1F1F24] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={broker.brokerLogoUrl}
                    alt={`${broker.BrokerName} logo`}
                    className="w-12 h-12 sm:w-16 sm:h-16"
                  />
                  <div>
                    <p className="font-semibold text-[#2E3A59] dark:text-white">
                      {broker.BrokerName}
                    </p>
                    <p className="text-xs text-[#718EBF]">
                      {broker.BrokerClientId}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <p className="text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                    Strategy Performance
                  </p>
                  <p className="font-semibold text-[#2E3A59] dark:text-white">
                    0.00
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
                      checked={terminalToggles[broker.id] || false}
                      onChange={() => handleToggleTerminal(broker.id)}
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
                      checked={engineToggles[broker.id] || false}
                      onChange={() => handleToggleEngine(broker.id)}
                    />

                    <div className="w-11 h-6 bg-gray-200 dark:bg-[#2D2F36] peer-focus:outline-none rounded-full peer peer-checked:bg-[#0096FF] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerSection;
