import { useEffect, useRef, useState } from "react";
import { strategy1, strategy2, strategy3 } from "../../../assets";
import { FiChevronDown } from "react-icons/fi";

const icons = [strategy1, strategy2, strategy3];

const StrategyDeployed = ({ strategies, brokers }) => {
  const [selectedBroker, setSelectedBroker] = useState(brokers[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (broker) => {
    setSelectedBroker(broker);
    setDropdownOpen(false);
  };

  return (
    <>
      <div className="flex md:hidden flex-row items-center justify-between w-full space-y-2">
        <p className="text-sm font-bold text-center">Strategy Deployed</p>

        <div
          className="relative cursor-pointer"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          ref={dropdownRef}
        >
          <div className="flex space-x-2 items-center">
            <img
              src={selectedBroker.logo}
              alt={selectedBroker.name}
              className="w-5 h-5 object-contain rounded-full"
            />
            <span className="text-sm">{selectedBroker.name}</span>
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

      <div className="bg-white dark:bg-[#15171C] space-y-2 p-4 border border-[#DFEAF2] dark:border-[#1E2027] rounded-3xl h-full text-black dark:text-white">
        {strategies.map((s, i) => {
          const Icon = icons[i % icons.length];
          const isNegative = s.pnl.startsWith("-");
          const statusParts = s.status
            .split("•")
            .map((part) => part.trim())
            .filter(Boolean);

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
                    alt={s.name}
                  />
                </div>

                <div className="flex flex-row items-center justify-between w-full">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {s.name}
                    </p>
                    <p className="text-xs flex flex-wrap items-center gap-1">
                      {statusParts.map((part, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span className="text-gray-400 dark:text-gray-500">
                            •
                          </span>
                          <span
                            className={
                              part.toLowerCase() === "running"
                                ? "text-[#19A0FF]"
                                : "text-green-600"
                            }
                          >
                            {part}
                          </span>
                        </span>
                      ))}
                    </p>
                  </div>

                  <p
                    className={`font-bold text-base mt-2 sm:mt-0 sm:ml-6 ${
                      isNegative ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {s.pnl}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default StrategyDeployed;
