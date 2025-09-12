import HeaderCard from "./HeaderCard";
import StrategyDeployed from "./StrategyDeployed";
import StrategyTemplates from "./StrategyTemplates";
import BrokerCard from "./BrokerCard";
import Tutorials from "./Tutorials";
import RaAlgos from "./RaAlgos";
import { man, tutorialIcon, upStox, upStoxJas } from "../../../assets";
import { useEffect, useRef, useState } from "react";
import NoticeModal from "../../NoticeModal";
import {
  useBrokerwiseStrategies,
  useUserBrokerData,
} from "../../../hooks/dashboardHooks";

const Dashboard = () => {
  const [showNotice, setShowNotice] = useState(() => {
    return !localStorage.getItem("noticeAccepted");
  });
  const {
    data: brokerData,
    isLoading: isBrokerLoading,
    isError: isBrokerError,
  } = useUserBrokerData();
  const {
    data: brokerStrategiesData,
    isLoading: isStrategyLoading,
    isError: isStrategyError,
  } = useBrokerwiseStrategies();

  const strategies = brokerStrategiesData || [];

  const uniqueBrokers = Array.from(
    new Map(
      strategies.map((strategy) => [
        strategy.BrokerClientId,
        {
          name: strategy.BrokerName,
          code: strategy.BrokerClientId,
          logo: strategy.brokerLogoUrl,
          brokerId: strategy.BrokerId,
        },
      ])
    ).values()
  );

  const brokers =
    brokerData?.map((item) => ({
      name: item.BrokerName,
      code: item.BrokerClientId,
      logo: item.brokerLogoUrl,
      loginUrl: item.APILoginUrl,
      isLoggedIn: item.BrokerLoginStatus,
      tradeEngineStatus: item.TradeEngineStatus,
      tradeEngineName: item.TradeEngineName || item.TradeEngine || null,
      brokerAuthQueryString: item.brokerAuthQueryString,
    })) || [];

  const handleCloseNotice = () => {
    localStorage.setItem("noticeAccepted", "true");
    setShowNotice(false);
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [selectedBroker, setSelectedBroker] = useState(null);

  useEffect(() => {
    if (uniqueBrokers.length > 0) {
      setSelectedBroker(uniqueBrokers[0]);
    }
  }, [brokerStrategiesData]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (broker) => {
    setSelectedBroker(broker);
    setDropdownOpen(false);
  };

  const selectedBrokerStrategies = strategies.filter(
    (strategy) => strategy.BrokerClientId === selectedBroker?.code
  );

  const yourTutorialData = [
    {
      title: "Nifty Option",
      icon: tutorialIcon,
      description:
        "Lorem ipsum dolor sit amet consectetur. Aliquam neque sed diam mi ornare senectus orci.",
      likes: "20k",
      shares: "5k",
    },
    {
      title: "BankNifty Strategy",
      icon: tutorialIcon,
      description:
        "Lorem ipsum dolor sit amet consectetur. Aliquam neque sed diam mi ornare senectus orci.",
      likes: "12k",
      shares: "3.2k",
    },
    {
      title: "Algo Trading 101",
      icon: tutorialIcon,
      description:
        "Lorem ipsum dolor sit amet consectetur. Aliquam neque sed diam mi ornare senectus orci.",
      likes: "18k",
      shares: "4.7k",
    },
  ];

  const yourAlgoData = [
    {
      name: "Abinas Mishra",
      avatar: man,
      sebiId: "SEBI INH00001990",
      strategies: [
        { name: "Sensex Weekly Expiry", margin: "₹3,00,000", saves: 11 },
        { name: "BankNifty Intraday", margin: "₹2,50,000", saves: 9 },
        { name: "Option Booster", margin: "₹1,80,000", saves: 6 },
      ],
    },
    {
      name: "Rajat Gupta",
      avatar: man,
      sebiId: "SEBI INH000010202",
      strategies: [
        { name: "BankNifty S1", margin: "₹1,50,000", saves: 7 },
        { name: "Nifty Weekly", margin: "₹1,80,000", saves: 5 },
      ],
    },
    {
      name: "Nikita Mehra",
      avatar: man,
      sebiId: "SEBI INH000017381",
      strategies: [
        { name: "Option Scalper", margin: "₹2,20,000", saves: 9 },
        { name: "Delta Neutral", margin: "₹2,40,000", saves: 6 },
        { name: "Monthly Builder", margin: "₹2,80,000", saves: 12 },
        { name: "Index Spread", margin: "₹3,00,000", saves: 4 },
      ],
    },
  ];

  // Component-wise loading & error handling: avoid blocking the whole page
  const HeaderSkeleton = () => (
    <div className="col-span-1">
      <div className="animate-pulse p-4 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24]">
        <div className="h-5 w-40 bg-gray-200 dark:bg-[#2a2a30] rounded" />
        <div className="mt-4 h-24 bg-gray-200 dark:bg-[#2a2a30] rounded" />
      </div>
    </div>
  );

  const BrokerCardSkeleton = () => (
    <div className="col-span-1">
      <div className="animate-pulse p-4 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24] h-full">
        <div className="h-5 w-28 bg-gray-200 dark:bg-[#2a2a30] rounded" />
        <div className="mt-4 h-24 bg-gray-200 dark:bg-[#2a2a30] rounded" />
      </div>
    </div>
  );

  const StrategiesSkeleton = () => (
    <div className="md:col-span-3 col-span-1">
      <div className="animate-pulse p-4 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24]">
        <div className="h-5 w-48 bg-gray-200 dark:bg-[#2a2a30] rounded" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="h-24 bg-gray-200 dark:bg-[#2a2a30] rounded" />
          <div className="h-24 bg-gray-200 dark:bg-[#2a2a30] rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showNotice && <NoticeModal onClose={handleCloseNotice} />}
      <div className="flex justify-between relative text-black dark:text-white">
        <div className="flex md:text-lg md:font-semibold font-bold items-center w-2/3">
          My Dashboard
        </div>

        <div className="md:flex hidden md:flex-row md:text-lg md:font-semibold items-center justify-evenly w-full md:w-1/3 space-y-2 md:space-y-0">
          <p className="text-sm md:text-base font-bold md:font-semibold text-center">
            Strategy Deployed
          </p>

          <div
            className="relative cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            ref={dropdownRef}
          >
            {selectedBroker ? (
              <div className="flex items-center space-x-2 font-semibold">
                <img
                  src={selectedBroker.logo}
                  alt={selectedBroker.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-base text-black dark:text-white">
                  {selectedBroker.name}
                  <span className="text-[#718EBF] dark:text-gray-400 font-normal ml-1">
                    ({selectedBroker.code})
                  </span>
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">No broker selected</span>
            )}

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
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6 items-start">
        <div
          className={
            isBrokerLoading
              ? "col-span-1"
              : brokers.length === 0
              ? "md:col-span-2 col-span-1"
              : "col-span-1"
          }
        >
          {isBrokerLoading ? (
            <HeaderSkeleton />
          ) : isBrokerError ? (
            <div className="p-4 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24] text-red-500">
              Failed to load broker accounts.
            </div>
          ) : (
            <HeaderCard
              totalPnl="5,756"
              topGainer="Nifty Options S1"
              topLoser="Nifty Options S1"
              accountImg={upStoxJas}
              brokers={brokers}
            />
          )}
        </div>

        {isBrokerLoading ? (
          <BrokerCardSkeleton />
        ) : isBrokerError ? (
          <div className="col-span-1 p-4 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24] text-red-500">
            Error loading brokers.
          </div>
        ) : (
          brokers.length > 0 && <BrokerCard brokers={brokers} />
        )}

        {isStrategyLoading ? (
          <StrategiesSkeleton />
        ) : isStrategyError ? (
          <div className="md:col-span-3 col-span-1 p-4 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24] text-red-500">
            Error fetching strategies.
          </div>
        ) : (
          <StrategyDeployed
            strategies={selectedBrokerStrategies}
            selectedBroker={selectedBroker}
            uniqueBrokers={uniqueBrokers}
            handleSelect={handleSelect}
          />
        )}
      </div>

      <StrategyTemplates />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1">
          <Tutorials tutorials={yourTutorialData} />
        </div>
        <div className="col-span-2">
          <RaAlgos algos={yourAlgoData} />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
