import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
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
import RollingStraddleChart from "./RollingStraddleChart";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler,
  Tooltip,
  Legend
);

const strategyTypes = ["Neutral", "Bearish", "Bullish"];
const expiryList = ["2025-06-12", "2025-06-19", "2025-06-26"];
const riskFilters = ["All", "Risk Defined", "Undefined Risk"];
const viewTabs = ["Pre Built Strategies", "Rolling Straddle"];

const StrategySelector = () => {
  const [activeTab, setActiveTab] = useState(viewTabs[0]);
  const [activeType, setActiveType] = useState("Neutral");
  const [activeExpiry, setActiveExpiry] = useState("2025-06-12");
  const [activeRisk, setActiveRisk] = useState("All");
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "Pre Built Strategies") return;

    const fetchStrategies = async () => {
      setLoading(true);
      const data = [
        {
          name: "Short Straddle",
          labels: [24500, 24750, 24950, 25000, 25100, 25250, 25500],
          pnl: [-150, 0, 150, 200, 150, 0, -150],
        },
        {
          name: "Long Straddle",
          labels: [24500, 24750, 24950, 25000, 25100, 25250, 25500],
          pnl: [150, 50, -100, -200, -100, 50, 150],
        },
        {
          name: "Iron Condor",
          labels: [24500, 24750, 24950, 25000, 25100, 25250, 25500],
          pnl: [-50, 20, 150, 170, 150, 20, -50],
        },
        {
          name: "Iron Butterfly",
          labels: [24500, 24750, 24950, 25000, 25100, 25250, 25500],
          pnl: [-100, 20, 180, 200, 180, 20, -100],
        },
        {
          name: "Strangle",
          labels: [24500, 24750, 24950, 25000, 25100, 25250, 25500],
          pnl: [80, 20, -80, -100, -80, 20, 80],
        },
        {
          name: "Covered Call",
          labels: [24500, 24750, 24950, 25000, 25100, 25250, 25500],
          pnl: [-100, -50, 0, 50, 70, 90, 100],
        },
      ];

      setTimeout(() => {
        setStrategies(data);
        setLoading(false);
      }, 600);
    };

    fetchStrategies();
  }, [activeType, activeExpiry, activeRisk, activeTab]);

  const getChartData = (strategy) => {
    const { pnl, labels, name } = strategy;
    const isShort = name.toLowerCase().includes("short");

    return {
      labels,
      datasets: [
        {
          label: "PnL",
          data: pnl,
          fill: {
            target: "origin",
            above: isShort ? "rgba(0,255,0,0.15)" : "rgba(255,0,0,0.15)",
            below: isShort ? "rgba(255,0,0,0.15)" : "rgba(0,255,0,0.15)",
          },
          borderColor: "#1F2937",
          pointRadius: 0,
          tension: 0.4,
          borderWidth: 1.5,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false },
      y: { display: false },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div className="bg-white md:w-[60%] dark:bg-[#15171C] rounded-xl p-4 border border-gray-200 dark:border-[#2D2F36]">
      <div className="flex items-center gap-6 mb-3 text-sm font-medium">
        {viewTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-1 border-b-2 ${
              activeTab === tab
                ? "text-[#0096FF] border-[#0096FF]"
                : "text-gray-400 border-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Pre Built Strategies" && (
        <>
          <div className="flex items-center gap-4 mb-4">
            {strategyTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-1 rounded-md text-sm border ${
                  activeType === type
                    ? "bg-blue-100 text-[#0096FF] border-[#0096FF]"
                    : "text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between mb-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Expiry:</span>
              <select
                value={activeExpiry}
                onChange={(e) => setActiveExpiry(e.target.value)}
                className="border px-2 py-1 rounded dark:bg-[#2A2A2E] dark:border-gray-600"
              >
                {expiryList.map((exp) => (
                  <option key={exp}>{exp}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              {riskFilters.map((risk) => (
                <button
                  key={risk}
                  onClick={() => setActiveRisk(risk)}
                  className={`px-3 py-1 rounded text-sm ${
                    activeRisk === risk
                      ? "bg-gray-200 dark:bg-[#2F2F35] text-black dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "Pre Built Strategies" &&
        (loading ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            Loading strategies...
          </div>
        ) : strategies.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No strategies found.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {strategies.map((strategy, idx) => (
              <div
                key={idx}
                className="border rounded-xl p-2 bg-white dark:bg-[#2A2A2E] border-gray-200 dark:border-gray-600"
              >
                <div className="w-full h-24">
                  <Line data={getChartData(strategy)} options={chartOptions} />
                </div>
                <p className="text-center mt-2 text-sm text-gray-700 dark:text-white">
                  {strategy.name}
                </p>
              </div>
            ))}
          </div>
        ))}

      {activeTab === "Rolling Straddle" && <RollingStraddleChart />}
    </div>
  );
};

export default StrategySelector;
