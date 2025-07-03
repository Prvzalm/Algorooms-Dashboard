import { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";

const BrokerCard = ({ brokers = [] }) => {
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (brokers.length > 0) {
      setSelectedBroker(brokers[0]);
    }
  }, [brokers]);

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

  return (
    <div className="bg-white dark:bg-[#15171C] p-4 border border-[#DFEAF2] dark:border-[#1E2027] rounded-3xl flex flex-col justify-between h-full relative text-black dark:text-white">
      <div className="text-sm text-[#718EBF] dark:text-gray-400 mb-2">
        Broker
      </div>

      <div
        className="flex items-center justify-between cursor-pointer relative mb-4"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        ref={dropdownRef}
      >
        {selectedBroker && (
          <div className="flex items-center space-x-2 font-semibold">
            <img
              src={selectedBroker.logo}
              alt=""
              className="w-6 h-6 rounded-full"
            />
            <span className="text-base text-black dark:text-white">
              {selectedBroker.name}
              <span className="text-[#718EBF] dark:text-gray-400 font-normal ml-1">
                ({selectedBroker.code})
              </span>
            </span>
          </div>
        )}
        <FiChevronDown className="text-[#718EBF] dark:text-gray-400" />

        {dropdownOpen && (
          <div className="absolute top-full mt-2 left-0 bg-white dark:bg-[#2a2a30] border border-gray-200 dark:border-[#3a3a3f] rounded-lg z-50 w-52">
            {brokers.map((broker, index) => (
              <div
                key={index}
                onClick={() => handleSelect(broker)}
                className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3f] cursor-pointer text-black dark:text-white"
              >
                <img
                  src={broker.logo}
                  alt=""
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm">
                  {broker.name}
                  <span className="text-[#718EBF] dark:text-gray-400 text-xs ml-1">
                    ({broker.code})
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-[#718EBF] dark:text-gray-400 text-xs">
        Strategies Performance
      </div>
      <div className="text-xl font-bold text-black dark:text-white mb-4">
        ₹{selectedBroker && selectedBroker.amount}
      </div>
      <hr className="mb-4 border-gray-200 dark:border-[#1E2027]" />

      <div className="flex justify-between">
        <div className="flex flex-col items-center text-sm space-y-1">
          <span className="text-[#718EBF] dark:text-gray-400">Terminal</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 dark:bg-[#2D2F36] peer-focus:outline-none peer rounded-full peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>
        <div className="flex flex-col items-center text-sm space-y-1">
          <span className="text-[#718EBF] dark:text-gray-400">
            Trading Engine
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 dark:bg-[#2D2F36] peer-focus:outline-none peer rounded-full peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default BrokerCard;
