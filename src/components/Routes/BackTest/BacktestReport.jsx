import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getPnlTextClass } from "../../../services/utils/formatters";

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

  const totalPnlValue = Number(overall?.TotalProfitLoss) || 0;
  const drawdownValue = Number(overall?.CommulitiveDrawDown) || 0;
  const totalPnlClass = getPnlTextClass(totalPnlValue);
  const drawdownClass = getPnlTextClass(drawdownValue, {
    positive: "text-green-600 dark:text-green-400",
    negative: "text-red-500 dark:text-red-400",
    neutral: "text-gray-500 dark:text-gray-400",
  });
  const formatCurrency = (value) =>
    Number.isFinite(value)
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "--";

  return (
    <div className="w-full bg-white dark:bg-darkbg text-[#2E3A59] dark:text-white rounded-xl">
      <div className="flex flex-col justify-between mb-4">
        <p className="text-lg font-medium">
          P&amp;L:{" "}
          <span className={totalPnlClass}>
            ₹ {formatCurrency(totalPnlValue)}
          </span>
        </p>
        <p className="text-lg font-medium">
          Max. Draw down:{" "}
          <span className={drawdownClass}>
            ₹ {formatCurrency(drawdownValue)}
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
