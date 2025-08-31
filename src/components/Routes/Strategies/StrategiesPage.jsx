import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  emptyDeployedStrategy,
  emptyStrategy,
  notificationGeneral,
  upStox,
} from "../../../assets";
import StrategyTemplates from "../Dashboard/StrategyTemplates";
import MyPortfolioTab from "./MyPortfolioTab";
import {
  FiChevronDown,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import CreateStrategyPopup from "./CreateStrategyPopup";
import { useUserStrategies } from "../../../hooks/strategyHooks";
import { useBrokerwiseStrategies } from "../../../hooks/dashboardHooks";

const mainTabs = [
  "My Strategies",
  "Deployed Strategies",
  "Strategy Templates",
  "My Portfolio",
];

const subTabs = ["Strategies", "Tradingview Signals Trading"];

const mockSignalStrategies = [
  {
    name: "MACD Reversal",
    user: "AR42069",
    startTime: "10:00",
    endTime: "14:30",
    segment: "OPTION",
    strategyType: "Signal Based",
    action: "BUY NIFTY BANK ATM 0PE",
  },
];

const StrategiesPage = () => {
  const [activeTab, setActiveTab] = useState("My Strategies");
  const [activeSubTab, setActiveSubTab] = useState("Strategies");
  const [showStrategyPopup, setShowStrategyPopup] = useState(false);
  const navigate = useNavigate();

  // pagination state for "Strategies" sub tab
  const pageSize = 10;
  const [strategyPage, setStrategyPage] = useState(1);
  useEffect(() => {
    setStrategyPage(1); // reset page on sub tab change
  }, [activeSubTab, activeTab]);

  const {
    data: userStrategies = [],
    isLoading: strategiesLoading,
    isError: strategiesError,
  } = useUserStrategies({
    page: strategyPage,
    pageSize,
    strategyType: activeSubTab === "Strategies" ? "created" : "subscribed",
    queryText: "",
    orderBy: "Date",
  });

  const {
    data: deployedData = [],
    isLoading: deployedLoading,
    isError: deployedError,
  } = useBrokerwiseStrategies("Date");

  const [expandedBrokerIds, setExpandedBrokerIds] = useState([]);

  const toggleExpand = (code) => {
    setExpandedBrokerIds((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const transformDeployedData = (apiData = []) =>
    apiData.map((b) => {
      let strategies = [];
      let runningCount = 0;
      let deployedCount = 0;
      let totalPnl = 0;
      b.DeploymentDetail?.forEach((s) => {
        s.DeploymentDetail?.forEach((d) => {
          deployedCount += 1;
          if (d.Running_Status) runningCount += 1;
          totalPnl += d.TotalPnl ?? 0;
          strategies.push({
            id: s.strategyId,
            name: s.StrategyName,
            running: d.Running_Status,
            isLiveMode: d.isLiveMode,
            maxLoss: d.MaxLoss,
            maxProfit: d.MaxProfit,
            tradeCycle: d.MaxTradeCycle,
            qtyMultiplier: d.QtyMultiplier,
            squareOff: d.AutoSquareOffTime,
            deploymentTime: d.deploymentTimeStamp,
            pnl: d.TotalPnl ?? 0,
            positions: d.RunningPositionsCount,
            pendingOrders: d.PendingOrdersCount,
          });
        });
      });
      return {
        broker: {
          name: b.BrokerName,
          code: b.BrokerClientId,
          logo: b.brokerLogoUrl,
        },
        runningCount,
        deployedCount,
        totalPnl,
        strategies,
      };
    });

  const renderMyStrategies = () => {
    if (strategiesLoading) return <div>Loading strategies...</div>;
    if (strategiesError) return <div>Failed to load strategies.</div>;

    return (
      <>
        <div className="flex space-x-3 mb-4">
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-3 rounded-lg text-sm font-medium ${
                activeSubTab === tab
                  ? "bg-blue-100 text-[#0096FF] border border-[#0096FF]"
                  : "bg-gray-200 dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeSubTab === "Strategies" && userStrategies.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-[#718EBF] dark:text-gray-400">
              Showing {userStrategies.length} strategies (Page {strategyPage})
            </span>
            <div className="flex items-center bg-[#F5F8FA] dark:bg-[#2D2F36] rounded-full overflow-hidden text-sm">
              <button
                onClick={() => setStrategyPage((p) => Math.max(1, p - 1))}
                disabled={strategyPage === 1 || strategiesLoading}
                className={`px-3 py-2 flex items-center ${
                  strategyPage === 1 || strategiesLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white dark:hover:bg-[#3A3D44]"
                }`}
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              <span className="px-4 py-2 font-medium select-none">
                {strategyPage}
              </span>
              <button
                onClick={() => setStrategyPage((p) => p + 1)}
                disabled={userStrategies.length < pageSize || strategiesLoading}
                className={`px-3 py-2 flex items-center ${
                  userStrategies.length < pageSize || strategiesLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white dark:hover:bg-[#3A3D44]"
                }`}
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}

        {userStrategies.length === 0 ? (
          <div className="flex h-[50vh] flex-col items-center justify-center">
            <img src={emptyStrategy} alt="Empty" className="mb-6" />
            <button
              className="px-6 py-2 bg-[#0096FF] text-white rounded-lg text-sm font-medium"
              onClick={() => setShowStrategyPopup(true)}
            >
              + Create Strategy
            </button>

            {showStrategyPopup && (
              <CreateStrategyPopup
                onClose={() => setShowStrategyPopup(false)}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userStrategies.map((strategy, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-5"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-semibold text-[#2E3A59] dark:text-white">
                      {strategy.StrategyName}
                    </h3>
                    <p className="text-xs text-[#718EBF] dark:text-gray-400 mt-0.5">
                      By {strategy.CreatedBy}
                    </p>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 text-xl">
                    ⋮
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 text-xs text-[#718EBF] dark:text-gray-400 mt-3">
                  <div>
                    <p className="mb-1">{strategy.TradeStartTime || "-"}</p>
                    <p className="font-medium">Start Time</p>
                  </div>
                  <div>
                    <p className="mb-1">{strategy.TradeStopTime || "-"}</p>
                    <p className="font-medium">End Time</p>
                  </div>
                  <div>
                    <p className="mb-1">
                      {strategy.StrategySegmentType || "-"}
                    </p>
                    <p className="font-medium">Segment Type</p>
                  </div>
                  <div>
                    <p className="mb-1">
                      {strategy.StrategyExecutionType || "-"}
                    </p>
                    <p className="font-medium">Strategy Type</p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    disabled
                    className="w-full bg-[#F5F8FA] dark:bg-[#2D2F36] text-[#718EBF] dark:text-gray-300 text-xs font-medium py-3 rounded-md"
                  >
                    {strategy.ScriptDetails?.[0]?.ScriptName || "-"}
                  </button>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    className="flex-1 py-3 rounded-md border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] text-[#2E3A59] dark:text-white text-sm font-medium"
                    onClick={() =>
                      navigate(
                        `/backtesting/strategybacktest/${strategy.StrategyId}`
                      )
                    }
                  >
                    Backtest
                  </button>
                  <button className="flex-1 py-3 rounded-md bg-[#0096FF] hover:bg-blue-600 text-white text-sm font-medium">
                    Deploy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderDeployedStrategies = () => {
    const deployedStrategies = transformDeployedData(deployedData);
    if (deployedLoading)
      return <div className="text-center py-10">Loading...</div>;
    if (deployedError)
      return (
        <div className="text-center py-10 text-red-500">
          Failed to load deployed strategies.
        </div>
      );
    return (
      <div className="space-y-4">
        {deployedStrategies?.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center">
            <img src={emptyDeployedStrategy} alt="No deployed strategies" />
          </div>
        ) : (
          deployedStrategies.map((brokerItem) => {
            const expanded = expandedBrokerIds.includes(brokerItem.broker.code);
            return (
              <div
                key={brokerItem.broker.code}
                className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C]"
              >
                <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={brokerItem.broker.logo}
                      alt="Broker Logo"
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <p className="text-xs text-[#718EBF] dark:text-gray-400">
                        Broker
                      </p>
                      <p className="text-sm font-semibold text-[#2E3A59] dark:text-white">
                        {brokerItem.broker.name} ({brokerItem.broker.code})
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 md:gap-8">
                    <div className="bg-[#F5F8FA] dark:bg-[#2A2A2E] text-sm rounded-md px-4 py-1 text-[#718EBF] dark:text-gray-400">
                      Running {String(brokerItem.runningCount).padStart(2, "0")}
                    </div>
                    <div className="bg-[#F5F8FA] dark:bg-[#2A2A2E] text-sm rounded-md px-4 py-1 text-[#718EBF] dark:text-gray-400">
                      Deployed{" "}
                      {String(brokerItem.deployedCount).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <img src={notificationGeneral} alt="notification" />
                      <div className="flex flex-col justify-center">
                        <span className="text-[#212121] opacity-50 dark:text-gray-400 text-xs">
                          PnL
                        </span>
                        <span
                          className={`font-semibold ${
                            brokerItem.totalPnl >= 0
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          ₹{brokerItem.totalPnl}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(brokerItem.broker.code)}
                      className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35] transition ${
                        expanded ? "rotate-180" : ""
                      }`}
                    >
                      <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35]">
                      <FiMoreVertical className="text-xl text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {expanded && brokerItem.strategies.length > 0 && (
                  <div className="border-t border-[#E4EAF0] dark:border-[#2D2F36] px-5 py-4 space-y-4">
                    {brokerItem.strategies.map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-[#E4EAF0] dark:border-[#2D2F36] px-4 py-3 bg-[#F9FBFC] dark:bg-[#1B1D22]"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{s.name}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-md ${
                              s.isLiveMode
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-gray-200 dark:bg-[#2D2F36] text-gray-500 dark:text-gray-300"
                            }`}
                          >
                            {s.isLiveMode ? "Live" : "Paper"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-6 text-xs text-[#718EBF] dark:text-gray-400">
                          <div>
                            <p className="mb-0.5">Max Profit</p>
                            <p className="font-semibold text-[#2E3A59] dark:text-white">
                              {s.maxProfit ?? "-"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-0.5">Max Loss</p>
                            <p className="font-semibold text-[#2E3A59] dark:text-white">
                              {s.maxLoss ?? "-"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-0.5">Qty Multiplier</p>
                            <p className="font-semibold text-[#2E3A59] dark:text-white">
                              {s.qtyMultiplier}
                            </p>
                          </div>
                          <div>
                            <p className="mb-0.5">Square Off</p>
                            <p className="font-semibold text-[#2E3A59] dark:text-white">
                              {s.squareOff}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#718EBF] dark:text-gray-400">
                              Stop
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only"
                                defaultChecked={s.running}
                                onChange={() => {}}
                              />
                              <span className="w-11 h-6 bg-gray-200 dark:bg-[#2D2F36] rounded-full peer peer-checked:bg-green-600 transition"></span>
                              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></span>
                            </label>
                            <span className="text-sm font-medium">
                              {s.running ? "Running" : "Stopped"}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#718EBF] dark:text-gray-400">
                              PnL
                            </p>
                            <p
                              className={`text-sm font-semibold ${
                                s.pnl >= 0 ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              ₹{s.pnl}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full md:p-6 text-[#2E3A59] dark:text-white">
      <div className="flex mb-6 border-b border-gray-200 dark:border-[#2D2F36] overflow-x-auto whitespace-nowrap no-scrollbar">
        {mainTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 pb-2 font-medium md:text-base text-sm flex-shrink-0 ${
              activeTab === tab
                ? "text-[#0096FF] border-b-2 border-[#0096FF]"
                : "text-[#718EBF] dark:text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "My Strategies" && renderMyStrategies()}
      {activeTab === "Deployed Strategies" && renderDeployedStrategies()}
      {activeTab === "Strategy Templates" && (
        <StrategyTemplates pageSize={10} showSeeAll={false} />
      )}
      {activeTab === "My Portfolio" && <MyPortfolioTab />}
    </div>
  );
};

export default StrategiesPage;
