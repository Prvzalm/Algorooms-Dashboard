import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const filterOptions = ["Top 10", "Top 20", "Top 30", "All"];

const MaxProfitLossChart = () => {
  const [activeFilter, setActiveFilter] = useState("Top 10");

  const data = {
    labels: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    datasets: [
      {
        label: "Profit/Loss",
        data: [
          -2000, -800, -500, 4000, -600, 2500, 4000, -2000, -1500, 900, 4500,
          -1800, -2200,
        ],
        backgroundColor: function (context) {
          const value = context.raw;
          return value >= 0 ? "#22C55E" : "#EF4444";
        },
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "#888" },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: "#888",
          callback: (val) => `${val / 1000}k`,
        },
        grid: { color: "#eee" },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="w-full bg-white dark:bg-darkbg rounded-2xl mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Max Profit and Loss
        </h2>

        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
          {filterOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="filter"
                value={opt}
                checked={activeFilter === opt}
                onChange={() => setActiveFilter(opt)}
                className="accent-[#0096FF]"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-[320px] w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default MaxProfitLossChart;
