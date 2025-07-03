import { useState } from "react";
import { FiTrash2, FiShield } from "react-icons/fi";
import { leg1CopyIcon } from "../../../assets";

const Leg1 = () => {
  const [position, setPosition] = useState("BUY");
  const [optionType, setOptionType] = useState("Call");

  const strikeOptions = ["ATM"];
  const expiryOptions = ["Weekly"];
  const criteriaOptions = ["Strike Type"];
  const slOptions = ["SL%"];
  const tpOptions = ["TP%"];
  const onPriceOptions = ["On Price"];

  return (
    <div className="p-4 border rounded-2xl space-y-4 dark:border-[#1E2027] dark:bg-[#15171C] text-black dark:text-white">
      <div>
        <h2 className="font-semibold text-lg">Leg1</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Lorem Ipsum donor
        </p>
      </div>

      <div className="border rounded-xl p-4 space-y-4 border-gray-200 dark:border-[#1E2027] dark:bg-[#1E2027]">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Qty
            </label>
            <input
              type="text"
              defaultValue="75"
              className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Position
            </label>
            <div className="flex space-x-2">
              {["BUY", "SELL"].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`w-1/2 border rounded px-3 py-2 font-semibold transition ${
                    position === pos
                      ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-[#0F3F62]"
                      : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-[#2C2F36] border-gray-300 dark:border-[#2C2F36]"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Option Type
            </label>
            <div className="flex space-x-2">
              {["Call", "Put"].map((type) => (
                <button
                  key={type}
                  onClick={() => setOptionType(type)}
                  className={`w-1/2 border rounded px-3 py-2 font-semibold transition ${
                    optionType === type
                      ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-[#0F3F62]"
                      : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-[#2C2F36] border-gray-300 dark:border-[#2C2F36]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Expiry
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {expiryOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Select Strike Criteria
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {criteriaOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Strike Type
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {strikeOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Stop Loss
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {slOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Qty
            </label>
            <input
              type="text"
              defaultValue="30"
              className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              On Price
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {onPriceOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              TP
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {tpOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              Qty
            </label>
            <input
              type="text"
              defaultValue="0"
              className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400 text-xs">
              On Price
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {onPriceOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 text-xl text-gray-400 dark:text-gray-500">
        <FiTrash2 className="text-red-500 cursor-pointer" />
        <img src={leg1CopyIcon} />
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
        View All Strategies
      </div>
    </div>
  );
};

export default Leg1;
