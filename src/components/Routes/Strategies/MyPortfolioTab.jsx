import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { emptryMyPortfolio } from "../../../assets";
import { FiChevronDown } from "react-icons/fi";

const timeRanges = [
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
  "2 Years",
  "Custom Range",
];

const strategies = ["Momentum Strategy", "Delta Hedge", "Crypto Scalper"];

const MyPortfolioTab = () => {
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [activeTimeRange, setActiveTimeRange] = useState("");
  const [customRange, setCustomRange] = useState([null, null]);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const dropdownRef = useRef(null);
  const [startDate, endDate] = customRange;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTimeRangeClick = (range) => {
    if (range === "Custom Range") {
      setShowCustomRange((prev) => {
        const newState = !prev;
        if (!newState) {
          setActiveTimeRange("");
          setCustomRange([null, null]);
        } else {
          setActiveTimeRange("Custom Range");
        }
        return newState;
      });
    } else {
      setActiveTimeRange(range);
      setShowCustomRange(false);
    }
  };

  return (
    <div className="w-full px-4 md:px-6 py-6 text-[#2E3A59] dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="w-full sm:w-1/3">
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
            className="bg-[#F5F8FA] dark:bg-[#2D2F36] w-full text-sm px-4 py-2 rounded-lg text-[#2E3A59] dark:text-white border-none outline-none"
          >
            <option value="" disabled>
              Select Strategy
            </option>
            {strategies.map((strat, i) => (
              <option key={i} value={strat}>
                {strat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeClick(range)}
              className={`text-sm px-4 py-1.5 rounded-md border ${
                activeTimeRange === range && range !== "Custom Range"
                  ? "bg-[#0096FF] text-white border-[#0096FF]"
                  : range === "Custom Range" && showCustomRange
                  ? "bg-[#0096FF] text-white border-[#0096FF]"
                  : "border-gray-200 dark:border-[#2D2F36] text-[#2E3A59] dark:text-gray-300"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {showCustomRange && (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm">Select Date Range:</span>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setCustomRange(update)}
            isClearable={true}
            placeholderText="Choose range"
            className="text-sm px-4 py-2 rounded-md border border-gray-300 dark:border-[#2D2F36] bg-white dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white"
          />
        </div>
      )}

      <div className="flex border rounded-xl items-center px-4 py-2 justify-between mb-4 text-sm font-medium">
        <div>
          Backtest Credit:{" "}
          <span className="text-black dark:text-white">6034/6044</span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowExportOptions((prev) => !prev)}
            className="text-sm px-4 py-2 border border-[#0096FF] rounded-md text-[#0096FF] flex items-center gap-1"
          >
            Export to PDF <FiChevronDown />
          </button>

          {showExportOptions && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-[#1F1F24] shadow-lg border border-gray-200 dark:border-[#2D2F36] rounded-md text-sm z-10 w-44">
              {["PDF", "Excel", "CSV"].map((type) => (
                <button
                  key={type}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36]"
                  onClick={() => {
                    setShowExportOptions(false);
                    alert(`Exported as ${type}`);
                  }}
                >
                  Export as {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center justify-center text-center">
          <img
            src={emptryMyPortfolio}
            alt="Empty Portfolio"
            className="w-40 mb-4 opacity-80"
          />
          <p className="text-[#718EBF] dark:text-gray-400 text-sm">
            No Portfolio summary. Create Bucket!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyPortfolioTab;
