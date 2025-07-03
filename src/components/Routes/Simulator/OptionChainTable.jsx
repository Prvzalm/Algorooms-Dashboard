import { useEffect, useRef, useState } from "react";
import { simulatorAddOnIcon } from "../../../assets";

const expiryTabs = [
  { label: "12 JUN’25", note: "CW: 2 DTE" },
  { label: "19 JUN’25", note: "NW: 9 DTE" },
  { label: "26 JUN’25", note: "CM: 16 DTE" },
  { label: "3 JUL’25" },
  { label: "10 JUL’25" },
  { label: "15 JUL’25" },
  { label: "21 JUL’25" },
  { label: "28 JUL’25" },
];

const mockData = [
  {
    strike: 25050,
    atm: true,
    callLTP: 174.3,
    callDelta: 0.6,
    putLTP: 135.1,
    putDelta: -0.52,
  },
  ...Array(5).fill({
    strike: 25050,
    atm: false,
    callLTP: 174.3,
    callDelta: 0.6,
    putLTP: 69.0,
    putDelta: -0.6,
  }),
];

const OptionChainTable = () => {
  const [selectedExpiry, setSelectedExpiry] = useState("12 JUN’25");
  const [selectedType, setSelectedType] = useState("Spot");
  const [showAddOns, setShowAddOns] = useState(false);
  const [addons, setAddons] = useState({
    Delta: true,
    "Call & Put IV": false,
    OI: false,
    ATM: true,
  });

  const addonRef = useRef();

  const toggleAddon = (key) => {
    setAddons({ ...addons, [key]: !addons[key] });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addonRef.current && !addonRef.current.contains(e.target)) {
        setShowAddOns(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white md:w-[40%] dark:bg-[#15171C] rounded-2xl border border-gray-200 dark:border-[#2D2F36] p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-gray-800 dark:text-white">
          Option Chain
        </h2>

        <div className="relative" ref={addonRef}>
          <button
            className="text-sm text-gray-500 dark:text-gray-300 flex items-center gap-1"
            onClick={() => setShowAddOns((prev) => !prev)}
          >
            <img src={simulatorAddOnIcon} alt="icon" />
            Add ons
          </button>

          {showAddOns && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#15171C] border border-gray-200 dark:border-[#2D2F36] shadow-lg rounded-xl p-3 z-50">
              {Object.keys(addons).map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-2 mb-2 last:mb-0 text-gray-800 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={addons[label]}
                    onChange={() => toggleAddon(label)}
                    className="accent-[#0096FF]"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto mb-4">
        {expiryTabs.map((tab) => (
          <div className="flex flex-col items-center">
            <button
              key={tab.label}
              onClick={() => setSelectedExpiry(tab.label)}
              className={`px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap ${
                selectedExpiry === tab.label
                  ? "bg-blue-100 text-[#0096FF] border-[#0096FF]"
                  : "bg-white text-gray-700 border-gray-300 dark:bg-[#2A2A2E] dark:text-gray-300 dark:border-gray-600"
              }`}
            >
              {tab.label}
            </button>
            <span className="text-opacity-50 text-[#212121] text-xs">
              {tab.note && `(${tab.note})`}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col w-full text-sm text-[#2E3A59] dark:text-gray-300 mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 w-full mb-2">
          <div>
            <span className="text-opacity-50 text-[#212121]">ATM IV:</span>{" "}
            <span className="font-bold">15.9</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-opacity-50 text-[#212121]">ATM:</span>
            {["Spot", "Fut", "Synth Fut"].map((type) => (
              <label
                key={type}
                className="flex text-opacity-50 text-[#212121] items-center gap-1"
              >
                <input
                  type="radio"
                  name="atmType"
                  value={type}
                  checked={selectedType === type}
                  onChange={(e) => setSelectedType(e.target.value)}
                />
                {type}
              </label>
            ))}
          </div>

          <div>
            <span className="text-opacity-50 text-[#212121]">
              Straddle Prem:
            </span>{" "}
            <span className="font-bold">252</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div>
            <span className="text-opacity-50 text-[#212121]">PCR:</span>{" "}
            <span className="font-bold">0.95</span>
          </div>

          <div>
            <span>
              14.7 Cr <span className="text-green-500">(+4.67L)</span>
            </span>{" "}
            - <span className="text-opacity-50 text-[#212121]">OI:</span>{" "}
            <span>
              13.7 Cr <span className="text-green-500">(+2.67L)</span>
            </span>
          </div>

          <div>
            <span className="text-opacity-50 text-[#212121]">Max Pain:</span>{" "}
            <span className="font-bold">25000</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-[#2D2F36]">
        <table className="min-w-full text-sm text-center border-collapse">
          <thead className="bg-gray-100 dark:bg-[#2F2F35] text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-2 border dark:border-[#2D2F36]">
                Call LTP (Δ)
              </th>
              <th className="px-4 py-2 border dark:border-[#2D2F36]">Strike</th>
              <th className="px-4 py-2 border dark:border-[#2D2F36]">
                Put LTP (Δ)
              </th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row, i) => (
              <tr
                key={i}
                className={`${
                  row.atm
                    ? "bg-blue-50 dark:bg-[#293B55]"
                    : i % 2
                    ? "bg-gray-50 dark:bg-[#1F1F24]"
                    : "bg-white dark:bg-[#15171C]"
                } text-gray-800 dark:text-gray-200`}
              >
                <td className="px-4 py-2 border dark:border-[#2D2F36]">
                  <span className="text-green-600">{row.callLTP}</span>{" "}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({row.callDelta})
                  </span>
                </td>
                <td className="px-4 py-2 border dark:border-[#2D2F36]">
                  <div className="font-semibold">{row.strike}</div>
                  <div className="text-xs text-gray-400">
                    {row.atm ? "ATM" : "ATM ± 50"}
                  </div>
                </td>
                <td className="px-4 py-2 border dark:border-[#2D2F36]">
                  <span className="text-red-500">{row.putLTP}</span>{" "}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({row.putDelta})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionChainTable;
