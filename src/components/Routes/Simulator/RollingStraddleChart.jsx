import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useState } from "react";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const expiryList = ["12 JUN 2025", "19 JUN 2025", "26 JUN 2025"];
const timeRanges = ["1m", "2m", "5m"];

const RollingStraddleChart = () => {
  const [selectedExpiry, setSelectedExpiry] = useState(expiryList[0]);
  const [activeRange, setActiveRange] = useState("1m");

  const labels = [
    "10:15:59",
    "10:45:59",
    "11:15:59",
    "11:45:59",
    "12:15:59",
    "12:45:59",
    "13:15:59",
    "13:45:59",
    "14:15:59",
    "14:45:59",
    "15:15:59",
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Straddle",
        data: [370, 374, 369, 377, 375, 380, 378, 379, 376, 370, 360],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: "#3B82F6",
        pointBorderColor: "#fff",
        pointHoverRadius: 6,
        yAxisID: "yRight",
      },
      {
        label: "VWAP",
        data: [365, 366, 368, 370, 371, 373, 374, 374, 372, 369, 367],
        borderColor: "#22C55E",
        backgroundColor: "rgba(34,197,94,0.1)",
        borderDash: [4, 4],
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: "#22C55E",
        pointBorderColor: "#fff",
        pointHoverRadius: 6,
        yAxisID: "yRight",
      },
      {
        label: "Spot",
        data: [
          25400, 25450, 25500, 25520, 25550, 25570, 25540, 25560, 25530, 25500,
          25480,
        ],
        borderColor: "#000000",
        borderDash: [6, 3],
        tension: 0.3,
        borderWidth: 1.5,
        pointRadius: 4,
        pointBackgroundColor: "#6B7280",
        pointHoverRadius: 5,
        yAxisID: "yLeft",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          boxWidth: 10,
          usePointStyle: true,
          pointStyle: "line",
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}`,
        },
      },
    },
    scales: {
      yLeft: {
        type: "linear",
        position: "left",
        ticks: {
          callback: (v) => v.toLocaleString(),
          stepSize: 50,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      yRight: {
        type: "linear",
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "#3B82F6",
          stepSize: 5,
        },
      },
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-[#15171C] rounded-xl border border-gray-200 dark:border-[#2D2F36] p-4">
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center mb-4 text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">Expiry:</span>
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="border px-2 py-1 rounded dark:bg-[#2A2A2E] dark:border-gray-600"
            >
              {expiryList.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 flex-wrap">
            {timeRanges.map((time) => (
              <button
                key={time}
                onClick={() => setActiveRange(time)}
                className={`px-3 py-1 rounded text-sm ${
                  activeRange === time
                    ? "bg-gray-200 dark:bg-[#2F2F35] text-black dark:text-white"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-right text-gray-700 dark:text-gray-300 leading-tight">
          <div>
            <span className="text-black dark:text-white">25350CE</span> LTP:{" "}
            <b>202.8</b> OI: <b>26.6L</b> Vol: <b>12.2L</b>
          </div>
          <div>
            <span className="text-black dark:text-white">25350PE</span> LTP:{" "}
            <b>202.8</b> OI: <b>26.6L</b> Vol: <b>12.2L</b>
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default RollingStraddleChart;
