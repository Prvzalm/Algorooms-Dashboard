import HeaderCard from "./HeaderCard";
import StrategyDeployed from "./StrategyDeployed";
import StrategyTemplates from "./StrategyTemplates";
import BrokerCard from "./BrokerCard";
import Tutorials from "./Tutorials";
import RaAlgos from "./RaAlgos";
import { man, tutorialIcon, upStox, upStoxJas } from "../../../assets";
import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import NoticeModal from "../../NoticeModal";

const Dashboard = () => {
  const [showNotice, setShowNotice] = useState(() => {
    return !localStorage.getItem("noticeAccepted");
  });

  const handleCloseNotice = () => {
    localStorage.setItem("noticeAccepted", "true");
    setShowNotice(false);
  };

  const brokers = [
    { name: "Upstox", code: "3CCF6C", logo: upStox, amount: "7584" },
    { name: "Zerodha", code: "7ZZ89K", logo: upStox, amount: "3676" },
  ];

  const [selectedBroker, setSelectedBroker] = useState(brokers[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  const strategies = [
    { name: "Momentum Booster", status: "• Running • Live", pnl: "+₹5,400" },
    { name: "BankNifty S1", status: "• Running • Live", pnl: "+₹2,500" },
    { name: "Nifty Options Hedge", status: "• Running • Live", pnl: "-₹850" },
  ];

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

  const templates = [
    {
      title: "Brahmastra Nifty Option B...",
      desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dolorum iure, dolorem debitis reprehenderit, velit qui excepturi eius architecto saepe culpa ad quo expedita vitae quas non explicabo officia voluptate! Hic, mollitia. Repellendus accusamus ullam sunt.",
      margin: "₹100",
      maxDD: "0.00",
    },
    {
      title: "Shakti BankNifty Intraday",
      desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dolorum iure, dolorem debitis reprehenderit, velit qui excepturi eius architecto saepe culpa ad quo expedita vitae quas non explicabo officia voluptate! Hic, mollitia. Repellendus accusamus ullam sunt.",
      margin: "₹250",
      maxDD: "1.25%",
    },
    {
      title: "Long Straddle Reversal",
      desc: "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dolorum iure, dolorem debitis reprehenderit, velit qui excepturi eius architecto saepe culpa ad quo expedita vitae quas non explicabo officia voluptate! Hic, mollitia. Repellendus accusamus ullam sunt.",
      margin: "₹500",
      maxDD: "2.75%",
    },
  ];

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
            <div className="flex space-x-2 items-center">
              <img
                src={selectedBroker.logo}
                alt={selectedBroker.name}
                className="w-5 h-5 md:w-7 md:h-7 object-contain rounded-full"
              />
              <span className="text-sm md:text-base">
                {selectedBroker.name}
              </span>
              <FiChevronDown className="text-gray-500 dark:text-gray-300" />
            </div>

            {dropdownOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white dark:bg-[#1f1f24] border border-gray-200 dark:border-gray-600 rounded-lg z-50 w-48">
                {brokers.map((broker, index) => (
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

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <HeaderCard
          totalPnl="5,756"
          topGainer="Nifty Options S1"
          topLoser="Nifty Options S1"
          userName="Jasnek Singh"
          accountImg={upStoxJas}
        />
        <BrokerCard brokers={brokers} />
        <StrategyDeployed strategies={strategies} brokers={brokers} />
      </div>

      <StrategyTemplates templates={templates} />

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
