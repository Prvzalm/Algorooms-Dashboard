import { useEffect, useRef, useState } from "react";
import { searchIcon } from "../../../assets";
import { useSearchInstrument } from "../../../hooks/strategyHooks";

const segmentTypes = ["Option", "Equity", "Future", "Indices", "CDS", "MCX"];

const InstrumentModal = ({ visible, onClose, selected, setSelected }) => {
  const modalRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("nif");
  const [segmentType, setSegmentType] = useState("Option");

  const {
    data: instruments = [],
    isLoading,
    isError,
  } = useSearchInstrument(
    segmentType,
    searchQuery,
    visible && searchQuery.length > 0
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-6 w-[90%] max-w-md dark:bg-[#15171C] relative"
      >
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-4 bg-[#F5F8FA] dark:bg-[#1E2027]">
          <img src={searchIcon} alt="" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scripts: i.e. State Bank of India, Banknifty, Crudeoil"
            className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-white placeholder:text-gray-400"
          />
        </div>

        <div className="space-x-3 text-sm mb-2 flex flex-wrap">
          {segmentTypes.map((type) => (
            <label key={type} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={type}
                checked={segmentType === type}
                onChange={() => setSegmentType(type)}
                className="mr-1"
              />
              {type}
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          *Only Option category allowed for Time-Based Strategy type
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="col-span-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </p>
          ) : isError ? (
            <p className="col-span-2 text-center text-sm text-red-500">
              Failed to load instruments.
            </p>
          ) : instruments.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-gray-400">
              No instruments found.
            </p>
          ) : (
            instruments.map((item, i) => (
              <button
                key={item.InstrumentToken}
                onClick={() => setSelected(item.Name)}
                className={`border rounded-lg py-2 text-sm font-medium ${
                  selected === item.Name
                    ? "bg-blue-100 text-[#0096FF] dark:bg-[#2A2D34] dark:text-blue-400"
                    : "text-gray-700 hover:bg-blue-50 dark:text-white dark:hover:bg-[#2A2D34]"
                } dark:border-[#1E2027]`}
              >
                {item.Name}
              </button>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#0096FF] text-white py-3 rounded-lg font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default InstrumentModal;
