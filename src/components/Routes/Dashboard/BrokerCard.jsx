import { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useStartStopTradeEngine } from "../../../hooks/brokerHooks";
import ConfirmModal from "../../ConfirmModal";
import StopTradeEngineModal from "../../StopTradeEngineModal";

const BrokerCard = ({ brokers = [] }) => {
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { mutate, isPending } = useStartStopTradeEngine();
  const mutatingRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);

  useEffect(() => {
    if (!brokers || brokers.length === 0) {
      setSelectedBroker(null);
      return;
    }

    setSelectedBroker((prev) => {
      if (!prev) return brokers[0];
      const stillExists = brokers.find((b) => b.code === prev.code);
      return stillExists || brokers[0];
    });
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

  const performToggleTradeEngine = (nextAction) => {
    if (!selectedBroker || isPending || mutatingRef.current) return;
    mutatingRef.current = true;
    mutate(
      {
        TradeEngineName: selectedBroker.tradeEngineName,
        BrokerClientId: selectedBroker.code,
        ConnectOptions: nextAction,
      },
      {
        onSettled: () => {
          mutatingRef.current = false;
        },
      }
    );
  };

  const handleToggleTradeEngine = (e) => {
    e.stopPropagation();
    if (!selectedBroker || isPending || mutatingRef.current) return;
    const nextAction =
      selectedBroker.tradeEngineStatus === "Running" ? "Stop" : "Start";
    // Show confirm only when starting
    if (nextAction === "Start") {
      setConfirmOpen(true);
      return;
    }
    // For stop, show stop modal
    setStopConfirmOpen(true);
  };

  return (
    <div className="bg-white dark:bg-[#15171C] p-4 border border-[#DFEAF2] dark:border-[#1E2027] rounded-3xl flex flex-col justify-between relative text-black dark:text-white overflow-hidden">
      <ConfirmModal
        open={confirmOpen}
        title="Start Trade Engine?"
        message={
          "This will start executing live trades for the selected broker.\nMake sure your strategies and margins are configured."
        }
        confirmLabel="OK"
        cancelLabel="Cancel"
        loading={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          performToggleTradeEngine("Start");
        }}
      />
      <StopTradeEngineModal
        open={stopConfirmOpen}
        title="Stop Trade Engine?"
        message="Choose how to stop the trade engine."
        cancelLabel="Cancel"
        stopLabel="Stop"
        stopSquareOffLabel="Stop & Square Off"
        loading={isPending}
        onCancel={() => setStopConfirmOpen(false)}
        onStop={() => {
          setStopConfirmOpen(false);
          performToggleTradeEngine("Stop");
        }}
        onStopSquareOff={() => {
          setStopConfirmOpen(false);
          performToggleTradeEngine("StopNSquareOff");
        }}
      />
      {isPending && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm bg-white/70 dark:bg-black/50">
          <div className="w-14 h-14 border-4 border-t-transparent border-blue-500 rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Updating Trade Engine...
          </p>
          <p className="text-[11px] mt-1 text-gray-500 dark:text-gray-400">
            This may take up some time
          </p>
        </div>
      )}
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
          <div className="absolute top-full mt-2 left-0 bg-white dark:bg-[#2a2a30] border border-gray-200 dark:border-[#3a3a3f] rounded-lg z-50 max-h-36 overflow-y-auto">
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
        Broker Login Status
      </div>
      <div className="text-xl font-bold text-black dark:text-white mb-4">
        {selectedBroker?.isLoggedIn ? "Connected" : "Not Connected"}
      </div>

      <hr className="mb-4 border-gray-200 dark:border-[#1E2027]" />

      <div className="flex justify-between">
        <div className="flex flex-col items-center text-sm space-y-1">
          <span className="text-[#718EBF] dark:text-gray-400">Terminal</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!selectedBroker?.isLoggedIn}
              readOnly
              onChange={() => {
                if (!selectedBroker?.loginUrl) return;
                localStorage.setItem(
                  "BrokerClientId",
                  selectedBroker.code
                );
                // Save expected query param key provided by API (fallback handled earlier)
                localStorage.setItem(
                  "brokerAuthqueryString",
                  selectedBroker.brokerAuthQueryString
                );
                window.location.href = selectedBroker.loginUrl;
              }}
            />
            <div
              className={`w-11 h-6 relative rounded-full transition-colors ${
                selectedBroker?.isLoggedIn
                  ? "bg-[#0096FF]"
                  : "bg-gray-200 dark:bg-[#2D2F36]"
              }`}
            >
              <span
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white border border-gray-300 transition-transform ${
                  selectedBroker?.isLoggedIn ? "translate-x-full" : ""
                }`}
              />
            </div>
          </label>
        </div>
        <div className="flex flex-col items-center text-sm space-y-1">
          <span className="text-[#718EBF] dark:text-gray-400">
            Trading Engine
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={selectedBroker?.tradeEngineStatus === "Running"}
              onChange={handleToggleTradeEngine}
              disabled={isPending}
            />
            <div
              className={`w-11 h-6 relative rounded-full transition-colors ${
                selectedBroker?.tradeEngineStatus === "Running"
                  ? "bg-green-600"
                  : "bg-gray-200 dark:bg-[#2D2F36]"
              } ${isPending ? "opacity-60" : ""}`}
            >
              <span
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white border border-gray-300 transition-transform ${
                  selectedBroker?.tradeEngineStatus === "Running"
                    ? "translate-x-full"
                    : ""
                }`}
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default BrokerCard;
