import { useState, useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";
import { savePopupIcon } from "../../../assets";

export default function SavePopup({ onClose }) {
  const [category, setCategory] = useState("Running Trades");
  const [strategyName, setStrategyName] = useState("");
  const popupRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/40">
      <div
        ref={popupRef}
        className="bg-white dark:bg-[#15171C] text-gray-900 dark:text-white rounded-2xl w-full max-w-md p-6 space-y-6 shadow-xl"
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <img src={savePopupIcon} alt="Save" className="w-5 h-5" />
          Save Strategy
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm mb-1 block">Select Category:</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none px-4 py-2 rounded-md bg-gray-100 dark:bg-[#1E2027] text-gray-900 dark:text-white focus:outline-none"
              >
                <option>Running Trades</option>
                <option>Watchlist</option>
                <option>Archived</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-sm mb-1 block">Strategy Name:</label>
            <input
              type="text"
              placeholder="Enter your strategy name"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-[#1E2027] text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onClose?.();
            }}
            className="w-full bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white font-medium py-4 rounded-lg transition"
          >
            Save
          </button>
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            See Top Right corner for Saved Straties Button.
          </p>
        </div>
      </div>
    </div>
  );
}
