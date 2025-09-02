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

const BacktestReport = ({ overall, equityCurve }) => {
  const labels = equityCurve?.labels || [];
  const values = equityCurve?.values || [];
  const chartData = {
    labels,
    datasets: [
      {
        label: "Equity Curve",
        data: values,
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
          P&amp;L:{" "}
          <span
            className={
              overall?.TotalProfitLoss >= 0 ? "text-green-500" : "text-red-500"
            }
          >
            ₹{" "}
            {overall?.TotalProfitLoss?.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
        </p>
        <p className="text-lg font-medium">
          Max. Draw down:{" "}
          <span className="text-red-500">
            ₹{" "}
            {overall?.CommulitiveDrawDown?.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </span>
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
