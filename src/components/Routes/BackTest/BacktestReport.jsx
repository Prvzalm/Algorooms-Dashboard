import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, LinearScale, CategoryScale, PointElement);

const BacktestReport = () => {
  const chartData = {
    labels: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    datasets: [
      {
        label: "Equity Curve",
        data: [
          0, 1000, 2000, 2500, 2200, 2200, 2600, 2600, 2600, 2600, 3000, 3500,
          4000,
        ],
        fill: true,
        backgroundColor: "rgba(0, 150, 255, 0.08)",
        borderColor: "#0096FF",
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: {
          callback: (value) => `${value / 1000}k`,
          color: "#999",
        },
        grid: { display: false },
      },
      x: {
        ticks: { color: "#999" },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="w-full bg-white dark:bg-darkbg text-[#2E3A59] dark:text-white rounded-xl">
      <div className="flex flex-col justify-between mb-4">
        <p className="text-lg font-medium">
          P&amp;L: <span className="text-red-500">₹ -722.40</span>
        </p>
        <p className="text-lg font-medium">
          Max. Draw down: <span className="text-red-500">₹ 5,589.40</span>
        </p>
      </div>

      <div className="w-full h-[300px] mb-8">
        <Line data={chartData} options={chartOptions} />
      </div>

      <h2 className="text-xl font-bold mb-4 text-black dark:text-white">
        Backtest Summary
      </h2>
    </div>
  );
};

export default BacktestReport;
