import { useState } from "react";
import {
  emptyDeployedStrategy,
  emptyStrategy,
  notificationGeneral,
  upStox,
} from "../../../assets";
import StrategyTemplates from "../Dashboard/StrategyTemplates";
import MyPortfolioTab from "./MyPortfolioTab";
import { FiChevronDown, FiMoreVertical } from "react-icons/fi";
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
  const {
    data: userStrategies = [],
    isLoading: strategiesLoading,
    isError: strategiesError,
  } = useUserStrategies({
    page: 1,
    pageSize: 10,
    strategyType: activeSubTab === "Strategies" ? "created" : "subscribed",
    queryText: "",
    orderBy: "Name",
  });

  const {
    data: deployedData = [],
    isLoading: deployedLoading,
    isError: deployedError,
  } = useBrokerwiseStrategies("Name");

  const transformDeployedData = (apiData) => {
    const flatList = [];

    apiData.forEach((brokerItem) => {
      brokerItem.DeploymentDetail?.forEach((strategy) => {
        strategy.DeploymentDetail?.forEach((detail) => {
          flatList.push({
            broker: {
              name: brokerItem.BrokerName,
              code: brokerItem.BrokerClientId,
              logo: brokerItem.brokerLogoUrl,
            },
            engineId: detail.Running_Status ? 1 : 0,
            deployedId: detail ? 1 : 0,
            pnl: detail.TotalPnl ?? 0,
          });
        });
      });
    });

    return flatList;
  };

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
                  <button className="flex-1 py-3 rounded-md border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] text-[#2E3A59] dark:text-white text-sm font-medium">
                    Deploy
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
    if (deployedLoading) {
      return <div className="text-center py-10">Loading...</div>;
    }

    if (deployedError) {
      return (
        <div className="text-center py-10 text-red-500">
          Failed to load deployed strategies.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {deployedStrategies?.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center">
            <img src={emptyDeployedStrategy} alt="No deployed strategies" />
          </div>
        ) : (
          deployedStrategies.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-5 space-y-4 md:space-y-0 flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3 w-full md:w-auto">
                <img
                  src={item.broker.logo}
                  alt="Broker Logo"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <p className="text-xs text-[#718EBF] dark:text-gray-400">
                    Broker
                  </p>
                  <p className="text-sm font-semibold text-[#2E3A59] dark:text-white">
                    {item.broker.name} ({item.broker.code})
                  </p>
                </div>
              </div>

              <div className="flex gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-start mt-2 md:mt-0">
                <div className="bg-[#F5F8FA] dark:bg-[#2A2A2E] text-sm rounded-md px-4 py-1 text-[#718EBF] dark:text-gray-400">
                  Running {item.engineId}
                </div>
                <div className="bg-[#F5F8FA] dark:bg-[#2A2A2E] text-sm rounded-md px-4 py-1 text-[#718EBF] dark:text-gray-400">
                  Deployed {item.deployedId}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 mt-2 md:mt-0">
                <div className="flex items-center gap-2">
                  <img src={notificationGeneral} alt="notification" />
                  <div className="flex flex-col justify-center">
                    <span className="text-[#212121] opacity-50 dark:text-gray-400 text-xs">
                      PnL
                    </span>
                    <span className="text-green-600 font-semibold">
                      ₹{item.pnl}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <FiChevronDown className="text-gray-500 dark:text-gray-400" />
                  <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2F2F35]">
                    <FiMoreVertical className="text-xl text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
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
