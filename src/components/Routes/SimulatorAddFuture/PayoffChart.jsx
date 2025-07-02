import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import RollingStraddleChart from "../Simulator/RollingStraddleChart";
import { FiChevronDown } from "react-icons/fi";
import { simulatorAddOnIcon } from "../../../assets";
import SharePopup from "./SharePopup";
import SavePopup from "./SavePopup";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

const tabs = ["Payoff Chart", "MTM", "Strategy", "OI", "Rolling Straddle"];

const TabContent = ({ tab }) => {
  if (tab === "Payoff Chart") return <PayoffChartContent />;
  if (tab === "MTM") return <div className="p-4">MTM content goes here...</div>;
  if (tab === "Strategy")
    return <div className="p-4">Strategy content here...</div>;
  if (tab === "OI") return <div className="p-4">OI analysis loading...</div>;
  if (tab === "Rolling Straddle") return <RollingStraddleChart />;
  return null;
};

const PayoffChart = () => {
  const [activeTab, setActiveTab] = useState("Payoff Chart");

  return (
    <div className="md:w-[60%] bg-white dark:bg-[#15171C] rounded-xl border border-gray-200 dark:border-[#2D2F36] p-4 text-sm">
      <div className="flex items-center gap-6 mb-4 text-sm font-medium border-b border-gray-200 dark:border-[#2D2F36]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-400"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <TabContent tab={activeTab} />
    </div>
  );
};

export default PayoffChart;

const PayoffChartContent = () => {
  const labels = [24250, 24500, 24750, 25000, 25153.3, 25500, 25750, 26000];
  const actualPayoff = [-50000, -40000, -20000, 0, 0, -20000, -40000, -50000];
  const targetPayoff = [
    -45000, -30000, -10000, 0, 1000, -10000, -30000, -45000,
  ];
  const [activeTab, setActiveTab] = useState("positions");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const [isAddsDropDownOpen, setIsAddsDropDownOpen] = useState(false);

  const [addsDropDown, setAddsDropDown] = useState({
    entryExitDate: true,
    entryExitDateTime: false,
    delta: false,
    multiplyByLot: true,
    showFullPnL: false,
    mergeLegs: false,
  });

  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsAddsDropDownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleAddsDropDownOption = (key) => {
    setAddsDropDown((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const data = {
    labels,
    datasets: [
      {
        label: "Actual Payoff",
        data: actualPayoff,
        borderColor: "green",
        backgroundColor: "rgba(0,200,0,0.05)",
        tension: 0.3,
        fill: true,
        pointRadius: 0,
      },
      {
        label: "Target P&L",
        data: targetPayoff,
        borderColor: "blue",
        backgroundColor: "rgba(0,0,255,0.05)",
        tension: 0.3,
        borderDash: [4, 4],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `₹${ctx.formattedValue}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#888" },
      },
      y: {
        ticks: {
          color: "#888",
          callback: (value) => `₹${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-xs font-medium text-gray-600 dark:text-gray-300">
        <div>
          Est. Margin: <b>₹2.26L</b>
        </div>
        <div>
          P&L: <span className="text-green-600 font-semibold">₹0 (0.0%)</span>
        </div>
        <div>
          Max Profit: <span className="text-gray-500">Undefined</span>
        </div>
        <div>
          Max Loss: <span className="text-red-500">Undefined</span>
        </div>
        <div>
          POP: <span className="text-black dark:text-white">48.84%</span>
        </div>
        <div>
          Net Credit: <span className="text-black dark:text-white">₹0</span>
        </div>
        <div>
          Breakevens:{" "}
          <span className="text-black dark:text-white">25721 (0.4%)</span>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#15171C] h-64 p-3 rounded mb-4">
        <Line data={data} options={options} />
      </div>

      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 rounded-xl overflow-visible border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-600 bg-gray-50 dark:bg-[#15171C]">
          <div className="flex gap-6">
            <button
              onClick={() => handleTabChange("positions")}
              className={`pb-1 ${
                activeTab === "positions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-400"
              }`}
            >
              Positions
            </button>
            <button
              onClick={() => handleTabChange("greeks")}
              className={`pb-1 ${
                activeTab === "greeks"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-400"
              }`}
            >
              Greeks
            </button>
            <button
              onClick={() => handleTabChange("pnl")}
              className={`pb-1 ${
                activeTab === "pnl"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-400"
              }`}
            >
              Target P&L{" "}
              <span className="text-xs font-normal">(Blue Line)</span>
            </button>
          </div>
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsAddsDropDownOpen((prev) => !prev)}
              className="flex items-center gap-1 text-gray-400 cursor-pointer"
            >
              <img src={simulatorAddOnIcon} alt="" />
              Add ons <FiChevronDown className="transform" />
            </div>

            {isAddsDropDownOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15171C] z-50 p-3 text-sm text-gray-900 dark:text-gray-100">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addsDropDown.entryExitDate}
                      onChange={() => toggleAddsDropDownOption("entryExitDate")}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="font-medium">Entry/Exit Date</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addsDropDown.entryExitDateTime}
                      onChange={() =>
                        toggleAddsDropDownOption("entryExitDateTime")
                      }
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="font-medium">Entry/Exit Date Time</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addsDropDown.delta}
                      onChange={() => toggleAddsDropDownOption("delta")}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="font-medium">Delta</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addsDropDown.multiplyByLot}
                      onChange={() => toggleAddsDropDownOption("multiplyByLot")}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="font-medium">
                      Multiply Greeks by Lot Size
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addsDropDown.showFullPnL}
                      onChange={() => toggleAddsDropDownOption("showFullPnL")}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="font-medium">Show Full P&L</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={addsDropDown.mergeLegs}
                      onChange={() => toggleAddsDropDownOption("mergeLegs")}
                      className="accent-blue-600 w-4 h-4"
                    />
                    <span className="font-medium">
                      Merge CE PE Legs together
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
        {activeTab === "positions" && <PositionsTable />}
        {activeTab === "greeks" && <GreeksTable />}
        {activeTab === "pnl" && <TargetPnLTable />}
      </div>
    </>
  );
};

function GreeksTable() {
  const data = [
    {
      lots: 1,
      qty: 75,
      date: "10 Jun, 09:16",
      strike: "25150PE",
      expiry: "12 Jun’25",
      iv: 12.5,
      delta: 0.49,
      theta: 0.14,
      gamma: -0.0013,
      vega: -7.985,
      type: "S",
    },
    {
      lots: 1,
      qty: 75,
      date: "10 Jun, 09:16",
      strike: "25150PE",
      expiry: "12 Jun’25",
      iv: 12.5,
      delta: 0.6,
      theta: 0.12,
      gamma: -0.001,
      vega: -7.9,
      type: "",
    },
  ];

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full text-center border-t border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-[#15171C] text-gray-600 dark:text-gray-300">
          <tr>
            <th className="py-2 px-2">
              <input type="checkbox" />
            </th>
            <th className="py-2 px-2">Lots</th>
            <th className="py-2 px-2">Qty</th>
            <th className="py-2 px-2">Date</th>
            <th className="py-2 px-2">Strike</th>
            <th className="py-2 px-2">Expiry</th>
            <th className="py-2 px-2">IV</th>
            <th className="py-2 px-2">Delta</th>
            <th className="py-2 px-2">Theta</th>
            <th className="py-2 px-2">Gamma</th>
            <th className="py-2 px-2">Vega</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-white">
          {data.map((row, idx) => (
            <tr key={idx} className="border-t dark:border-gray-700">
              <td className="py-2 px-2">
                <input type="checkbox" />
              </td>
              <td className="py-2 px-2">
                {row.type === "S" && (
                  <span className="border border-red-400 text-red-500 px-1.5 py-0.5 rounded text-xs font-semibold">
                    S
                  </span>
                )}
              </td>
              <td className="py-2 px-2">{row.qty}</td>
              <td className="py-2 px-2">{row.date}</td>
              <td className="py-2 px-2">{row.strike}</td>
              <td className="py-2 px-2">{row.expiry}</td>
              <td className="py-2 px-2">{row.iv}</td>
              <td className="py-2 px-2">{row.delta}</td>
              <td className="py-2 px-2">{row.theta}</td>
              <td className="py-2 px-2">{row.gamma}</td>
              <td className="py-2 px-2">{row.vega}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td colSpan="7" className="text-left pl-4 py-2">
              Greeks in ₹
            </td>
            <td className="py-2 px-2">-0.11</td>
            <td className="py-2 px-2">0.26</td>
            <td className="py-2 px-2">-0.0023</td>
            <td className="py-2 px-2">-15.885</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TargetPnLTable() {
  const data = [
    {
      type: "S",
      lots: 1,
      qty: 75,
      date: "10 Jun, 09:16",
      strike: "25150PE",
      expiry: "12 Jun’25",
      entry: 112.5,
      ltp: 111.8,
      targetPrice: 112.03,
      targetPnL: -7,
    },
    {
      type: "",
      lots: 1,
      qty: 75,
      date: "10 Jun, 09:16",
      strike: "25150PE",
      expiry: "12 Jun’25",
      entry: 132.5,
      ltp: 131.8,
      targetPrice: 122.03,
      targetPnL: 20,
    },
  ];

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full text-center border-t border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-[#15171C] text-gray-600 dark:text-gray-300">
          <tr>
            <th className="py-2 px-2">
              <input type="checkbox" />
            </th>
            <th className="py-2 px-2">Lots</th>
            <th className="py-2 px-2">Qty</th>
            <th className="py-2 px-2">Date</th>
            <th className="py-2 px-2">Strike</th>
            <th className="py-2 px-2">Expiry</th>
            <th className="py-2 px-2">Entry</th>
            <th className="py-2 px-2">LTP</th>
            <th className="py-2 px-2">P&L</th>
            <th className="py-2 px-2">Target Price</th>
            <th className="py-2 px-2">Target P&L</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-white">
          {data.map((row, idx) => (
            <tr key={idx} className="border-t dark:border-gray-700">
              <td className="py-2 px-2">
                <input type="checkbox" />
              </td>
              <td className="py-2 px-2">
                {row.type === "S" && (
                  <span className="border border-red-400 text-red-500 px-1.5 py-0.5 rounded text-xs font-semibold">
                    S
                  </span>
                )}
              </td>
              <td className="py-2 px-2">{row.qty}</td>
              <td className="py-2 px-2">{row.date}</td>
              <td className="py-2 px-2">{row.strike}</td>
              <td className="py-2 px-2">{row.expiry}</td>
              <td className="py-2 px-2">{row.entry}</td>
              <td className="py-2 px-2">{row.ltp}</td>
              <td className="py-2 px-2 text-green-600">0 (0%)</td>
              <td className="py-2 px-2">{row.targetPrice}</td>
              <td
                className={`py-2 px-2 ${
                  row.targetPnL >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {row.targetPnL}
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td colSpan="10" className="text-right pr-4 py-2">
              Total
            </td>
            <td className="text-green-600 py-2 px-2">₹13</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PositionsTable() {
  const [showShare, setShowShare] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full text-center border-t border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-[#15171C] text-gray-600 dark:text-gray-300">
          <tr>
            <th className="py-2 px-2">
              <input type="checkbox" />
            </th>
            <th className="py-2 px-2">Lots</th>
            <th className="py-2 px-2">Qty</th>
            <th className="py-2 px-2">Date⇅</th>
            <th className="py-2 px-2">Strike</th>
            <th className="py-2 px-2">Expiry</th>
            <th className="py-2 px-2">Entry</th>
            <th className="py-2 px-2">LTP</th>
            <th className="py-2 px-2">Delta</th>
            <th className="py-2 px-2">P&L</th>
            <th className="py-2 px-2">Lots Exit</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-white">
          {[1, 2].map((_, i) => (
            <tr key={i} className="border-t dark:border-gray-700">
              <td className="py-2">
                <input type="checkbox" />
              </td>
              <td className="py-2">
                <span className="border border-red-400 text-red-500 px-1.5 py-0.5 rounded text-xs font-semibold">
                  S
                </span>
              </td>
              <td className="py-2">1</td>
              <td className="py-2">75</td>
              <td className="py-2">10 Jun, 09:16</td>
              <td className="py-2">25150PE</td>
              <td className="py-2">
                12 Jun’25 <span className="ml-1">⌄</span>
              </td>
              <td className="py-2">122.5</td>
              <td className="py-2">122.5</td>
              <td className="py-2">0.49</td>
              <td className="py-2 text-green-600">₹ 0. (0.0%)</td>
              <td className="py-2 flex justify-center items-center gap-1">
                <span>1</span>
                <span className="text-red-500 rotate-180">↻</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#15171C] text-xs">
        <div className="flex items-center gap-2">
          <span>Multiplier:</span>
          <button className="px-2 border rounded">-</button>
          <span className="px-2">1</span>
          <button className="px-2 border rounded">+</button>
          <span className="ml-4">
            Lot Size: <b>75</b>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-blue-600">Add Alert</button>
          <button
            onClick={() => setShowSavePopup(true)}
            className="text-blue-600 border border-blue-500 px-3 py-1 rounded"
          >
            Save
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="text-blue-600 border border-blue-500 px-3 py-1 rounded flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 00-2.995 2.824L12 11v1H5a1 1 0 00-.993.883L4 13a1 1 0 00.883.993L5 14h7v1a3 3 0 002.824 2.995L15 18a3 3 0 000-6zm0 2a1 1 0 010 2 1 1 0 010-2z" />
            </svg>
            Share
          </button>
          <span className="text-gray-500">-0.02</span>
          <span className="text-green-600">₹ 0.</span>
          <button className="text-red-500">Exit</button>
          <button className="text-gray-500">Clear</button>
        </div>
      </div>
      {showShare && <SharePopup onClose={() => setShowShare(false)} />}
      {showSavePopup && <SavePopup onClose={() => setShowSavePopup(false)} />}
    </div>
  );
}
