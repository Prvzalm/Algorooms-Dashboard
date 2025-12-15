import { useEffect, useRef, useState } from "react";
import {
  emptyStrategyImg,
  strategy1,
  strategy2,
  strategy3,
} from "../../../assets";
import { FiChevronDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../common/PrimaryButton";
import { getPnlTextClass } from "../../../services/utils/formatters";

const icons = [strategy1, strategy2, strategy3];

const StrategyDeployed = ({
  strategies,
  liveStrategies = [],
  uniqueBrokers,
  selectedBroker,
  handleSelect,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const deployedStrategies =
    strategies?.flatMap((broker) =>
      broker.DeploymentDetail.flatMap((strategy) =>
        strategy.DeploymentDetail.map((deployment) => {
          // Find the live PNL for this strategy from WebSocket data
          const liveStrategy = liveStrategies.find(
            (ls) => ls.id === strategy.strategyId
          );

          return {
            strategyName: strategy.StrategyName,
            strategyId: strategy.strategyId,
            brokerName: broker.BrokerName,
            brokerCode: broker.BrokerClientId,
            brokerLogo: broker.brokerLogoUrl,
            totalPnl: liveStrategy?.strategyPNL ?? deployment.TotalPnl,
            isLive: deployment.isLiveMode,
            running: deployment.Running_Status,
            maxProfit: deployment.MaxProfit,
            maxLoss: deployment.MaxLoss,
            deploymentType: deployment.DeploymentType,
            timestamp: deployment.deploymentTimeStamp,
          };
        })
      )
    ) || [];

  return (
    <>
      <div className="flex md:hidden flex-row items-center justify-between w-full space-y-2">
        <p className="text-xl text-[#343C6A] font-semibold text-center whitespace-nowrap">
          Strategy Deployed
        </p>

        {uniqueBrokers.length !== 0 ? (
          <div
            className="relative cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            ref={dropdownRef}
          >
            <div className="flex space-x-2 items-center">
              <img
                src={selectedBroker?.logo}
                alt={selectedBroker?.name}
                className="w-5 h-5 object-contain rounded-full"
              />
              <span className="text-sm">{selectedBroker?.name}</span>
              <FiChevronDown className="text-gray-500 dark:text-gray-300" />
            </div>

            {dropdownOpen && (
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-[#1f1f24] border border-gray-200 dark:border-gray-600 rounded-lg z-50 w-48 max-h-64 overflow-y-auto">
                {uniqueBrokers.map((broker, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelect(broker)}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2a2a30] cursor-pointer text-black dark:text-white"
                  >
                    <img
                      src={broker.logo}
                      alt={broker.name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm">
                      {broker.name}
                      <span className="text-[#718EBF] text-xs ml-1">
                        ({broker.code})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No broker selected</div>
        )}
      </div>

      {uniqueBrokers.length !== 0 ? (
        <div className="bg-white dark:bg-[#15171C] space-y-2 p-4 border border-[#DFEAF2] dark:border-[#1E2027] rounded-3xl h-[227px] overflow-y-auto overflow-x-hidden text-black dark:text-white relative">
          <button
            onClick={() =>
              navigate("/strategies", {
                state: { activeTab: "Deployed Strategies" },
              })
            }
            className="absolute top-2 right-4 text-sm text-[#19A0FF] hover:text-[#007BFF] cursor-pointer"
          >
            See All
          </button>
          {deployedStrategies.map((s, i) => {
            const Icon = icons[i % icons.length];
            const pnlValue = Number(s.totalPnl) || 0;
            const pnlClass = getPnlTextClass(pnlValue);
            const statusParts = [
              {
                label: s.running ? "Running" : "Stopped",
                className: s.running ? "text-[#19A0FF]" : "text-red-500",
              },
              {
                label: s.isLive ? "Live" : "Paper",
                className: s.isLive
                  ? "text-green-600 dark:text-green-400"
                  : "text-amber-500 dark:text-amber-400",
              },
            ];

            return (
              <div
                key={i}
                className="flex justify-between items-start sm:items-center gap-4 text-sm"
              >
                <div className="flex items-start sm:items-center gap-3 w-full">
                  <div className="rounded-full w-14 h-14 flex items-center justify-center shrink-0">
                    <img
                      className="w-12 h-12 object-contain"
                      src={Icon}
                      alt={s.strategyName}
                    />
                  </div>

                  <div className="flex flex-row items-center justify-between w-full overflow-x-hidden">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p
                        className="font-medium text-gray-800 dark:text-white truncate"
                        title={s.strategyName}
                      >
                        {s.strategyName}
                      </p>
                      <p className="text-xs flex flex-wrap items-center gap-1">
                        {statusParts.map((part, idx) => (
                          <span key={idx} className="flex items-center gap-1">
                            <span className="text-gray-400 dark:text-gray-500">
                              •
                            </span>
                            <span className={part.className}>{part.label}</span>
                          </span>
                        ))}
                      </p>
                    </div>

                    <p
                      className={`font-bold text-base mt-2 sm:mt-0 sm:ml-6 ${pnlClass}`}
                    >
                      ₹
                      {pnlValue.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 h-full text-black dark:text-white">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E8F1FF] dark:bg-[#1F2937]">
            <img src={emptyStrategyImg} alt="" />
          </div>

          <div>
            <h1 className="text-base md:text-lg font-semibold text-[#1F1F1F] dark:text-white">
              No Strategies Deployed
            </h1>
            <p className="text-sm text-[#9CA3AF] dark:text-gray-400 mt-1">
              You haven't deployed any trading strategies yet.
            </p>
          </div>

          <PrimaryButton
            onClick={() => navigate("/trading/strategy-builder")}
            className="text-sm px-5 py-2"
          >
            Create Strategy
          </PrimaryButton>
        </div>
      )}
    </>
  );
};

export default StrategyDeployed;
