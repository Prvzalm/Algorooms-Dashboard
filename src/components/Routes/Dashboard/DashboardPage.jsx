import HeaderCard from "./HeaderCard";
import StrategyDeployed from "./StrategyDeployed";
import StrategyTemplates from "./StrategyTemplates";
import BrokerCard from "./BrokerCard";
import JoinAndSupport from "./JoinAndSupport";
import { man, tutorialIcon, upStox, upStoxJas } from "../../../assets";
import { useEffect, useRef, useState } from "react";
import NoticeModal from "../../NoticeModal";
import { FiChevronDown } from "react-icons/fi";
import {
  useBrokerwiseStrategies,
  useUserBrokerData,
} from "../../../hooks/dashboardHooks";
import RaAlgosPage from "../RaAlgos/RaAlgosPage";
import { useNavigate } from "react-router-dom";
import {
  useBrokerPnl,
  useBrokerStrategies,
  useTopGainerLoser,
} from "../../../stores/pnlStore";
import { useLivePnlData } from "../../../hooks/useLivePnlData";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showNotice, setShowNotice] = useState(() => {
    return !localStorage.getItem("noticeAccepted");
  });

  // TanStack Query for API data
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

  // Use custom hook for centralized PNL management
  const { brokers: pnlBrokers, grandTotalPnl } = useLivePnlData(
    brokerStrategiesData,
    isStrategyLoading,
    isStrategyError
  );

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

  // Use optimized selectors for selected broker data
  const selectedBrokerPnl = useBrokerPnl(selectedBroker?.code);
  const allStrategiesForSelectedBroker = useBrokerStrategies(
    selectedBroker?.code
  );
  const { topGainer, topLoser } = useTopGainerLoser(selectedBroker?.code);

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
      <div className="animate-pulse p-6 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24]">
        <div className="h-6 w-48 bg-gray-200 dark:bg-[#2a2a30] rounded" />
        <div className="mt-6 h-32 bg-gray-200 dark:bg-[#2a2a30] rounded" />
      </div>
    </div>
  );

  const BrokerCardSkeleton = () => (
    <div className="col-span-1">
      <div className="animate-pulse p-6 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24] h-full">
        <div className="h-6 w-32 bg-gray-200 dark:bg-[#2a2a30] rounded" />
        <div className="mt-6 h-32 bg-gray-200 dark:bg-[#2a2a30] rounded" />
      </div>
    </div>
  );

  const StrategiesSkeleton = () => (
    <div className="col-span-1">
      <div className="animate-pulse p-6 rounded-2xl border dark:border-[#2a2a30] bg-white dark:bg-[#1f1f24]">
        <div className="h-6 w-48 bg-gray-200 dark:bg-[#2a2a30] rounded" />
        <div className="mt-6 h-32 bg-gray-200 dark:bg-[#2a2a30] rounded" />
      </div>
    </div>
  );

  return (
    <>
      {showNotice && <NoticeModal onClose={handleCloseNotice} />}
      <div className="flex justify-between relative text-black dark:text-white">
        <div className="flex text-xl md:text-2xl font-semibold text-[#343C6A] dark:text-white items-center w-2/3">
          My Dashboard
        </div>

        <div className="md:flex hidden md:flex-row md:text-lg md:font-semibold items-center justify-evenly w-full md:w-1/3 space-y-2 md:space-y-0">
          <p className="text-xl md:text-2xl font-semibold text-[#343C6A] dark:text-white text-center whitespace-nowrap">
            Strategy Deployed
          </p>

          <div
            className="relative cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            ref={dropdownRef}
          >
            {selectedBroker ? (
              <div className="flex items-center gap-2 font-semibold px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a30] transition-colors">
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
                <FiChevronDown
                  className={`text-lg text-[#2E3A59] dark:text-white transition-transform flex-shrink-0 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-sm text-gray-500">
                  No broker selected
                </span>
                <FiChevronDown className="text-lg text-gray-500" />
              </div>
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

      <div className="grid md:grid-cols-3 gap-4 mt-4 items-start">
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
              totalPnl={grandTotalPnl.toFixed(2)}
              topGainer={topGainer?.name || "-"}
              topLoser={topLoser?.name || "-"}
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
            liveStrategies={allStrategiesForSelectedBroker}
            selectedBroker={selectedBroker}
            uniqueBrokers={uniqueBrokers}
            handleSelect={handleSelect}
          />
        )}
      </div>

      <StrategyTemplates />

      {/* <div className="grid grid-cols-1 gap-4">
        <div className="rounded-xl text-black dark:text-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-xl md:text-2xl text-[#343C6A] dark:text-white">
              Ra Algos
            </h3>
            <button
              onClick={() => navigate("/raalgo")}
              className="text-[#343C6A] dark:text-blue-400 text-lg hover:underline"
            >
              See All
            </button>
          </div>

          <RaAlgosPage algos={yourAlgoData} dashboard={true} />
        </div>
      </div> */}
      <JoinAndSupport />
    </>
  );
};

export default Dashboard;
