import { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiChevronDown } from "react-icons/fi";

const timeRanges = [
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
  "2 Years",
  "Custom Range",
];

const exportOptions = ["Download PDF", "Email PDF", "View in Browser"];

const BacktestStrategyComponent = () => {
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [activeTimeRange, setActiveTimeRange] = useState("1 Month");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [customRange, setCustomRange] = useState([null, null]);
  const [startDate, endDate] = customRange;
  const dropdownRef = useRef(null);

  const handleTimeRangeClick = (range) => {
    if (range === "Custom Range") {
      setShowCustomRange((prev) => {
        const newState = !prev;
        if (!newState) {
          setCustomRange([null, null]);
          setActiveTimeRange("");
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full md:p-6 text-[#2E3A59] dark:text-white">
      <h2 className="text-lg font-semibold">Choose Strategy to Backtest</h2>
      <p className="text-sm text-gray-400 mb-6">Lorem Ipsum donor</p>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="w-full sm:w-1/3">
          <div className="bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm px-4 py-3 rounded-lg text-[#718EBF] dark:text-white cursor-pointer">
            Select Strategy
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => handleTimeRangeClick(range)}
              className={`text-sm px-4 py-3 rounded-md border ${
                (activeTimeRange === range && range !== "Custom Range") ||
                (range === "Custom Range" && showCustomRange)
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
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm">Select Date Range:</span>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setCustomRange(update)}
            isClearable
            placeholderText="Choose range"
            className="text-sm px-4 py-3 rounded-md border border-gray-300 dark:border-[#2D2F36] bg-white dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white"
          />
        </div>
      )}

      <div className="flex justify-between items-center border rounded-xl px-4 py-2 text-sm font-medium mb-4">
        <div>
          Backtest Credit:{" "}
          <span className="text-black dark:text-white">6034/6044</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowExportMenu((prev) => !prev)}
            className="text-sm px-4 py-3 border border-[#0096FF] rounded-md text-[#0096FF] flex items-center gap-1"
          >
            Export to PDF <FiChevronDown />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-[#1E2027] border rounded shadow-md w-44 z-10">
              {exportOptions.map((option, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2A2C33] cursor-pointer text-sm"
                  onClick={() => {
                    setShowExportMenu(false);
                    alert(`Selected: ${option}`);
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacktestStrategyComponent;
