import React, { useState } from "react";
import { FiChevronDown, FiChevronUp, FiPrinter } from "react-icons/fi";

const mockData = [
  {
    date: "Jun 10 2025",
    totalPL: 2000,
    trades: [
      {
        symbol: "BANKNIFTY25JUN88000CE",
        qty: 35,
        entry: { price: 151.5, time: "9:22:00 AM" },
        exit: { price: 121.5, time: "10:20:00 AM" },
        pl: 1379,
        type: "SELL",
        exitType: "SHORT TARGET",
      },
      {
        symbol: "BANKNIFTY25JUN88000CE",
        qty: 35,
        entry: { price: 151.5, time: "9:22:00 AM" },
        exit: { price: 121.5, time: "10:20:00 AM" },
        pl: 1379,
        type: "SELL",
        exitType: "SHORT TARGET",
      },
    ],
  },
];

const TransactionDetails = () => {
  const [expandedDate, setExpandedDate] = useState(null);

  const toggleExpand = (date) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  };

  return (
    <div className="bg-white dark:bg-darkbg rounded-xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Transaction Details
        </h2>
        <button className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-[#2D2F36] text-sm rounded-md text-gray-600 dark:text-white">
          Export to PDF <FiPrinter />
        </button>
      </div>

      {mockData.map((item, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] mb-6 overflow-hidden"
        >
          {/* Date Header */}
          <div
            className="flex justify-between items-center px-4 py-4 cursor-pointer"
            onClick={() => toggleExpand(item.date)}
          >
            <span className="text-gray-500 dark:text-gray-400">
              {item.date}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Profit/Loss</span>
              <span className="bg-green-100 text-green-600 font-semibold px-3 py-1 rounded-full text-sm">
                {item.totalPL}
              </span>
              {expandedDate === item.date ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>

          {/* Trades Table */}
          {expandedDate === item.date && (
            <div className="border-t border-gray-200 dark:border-[#2D2F36] p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Quantity</th>
                    <th className="pb-2">Entry</th>
                    <th className="pb-2">Exit</th>
                    <th className="pb-2">Profit/Loss</th>
                    <th className="pb-2">Transaction</th>
                    <th className="pb-2">Exit Type</th>
                  </tr>
                </thead>
                <tbody>
                  {item.trades.map((trade, i) => (
                    <tr
                      key={i}
                      className="text-gray-700 dark:text-white border-t"
                    >
                      <td className="py-2 pr-4">{trade.symbol}</td>
                      <td className="py-2 pr-4">{trade.qty}</td>
                      <td className="py-2 pr-4">
                        Price: {trade.entry.price}
                        <br />
                        Time: {trade.entry.time}
                      </td>
                      <td className="py-2 pr-4">
                        Price: {trade.exit.price}
                        <br />
                        Time: {trade.exit.time}
                      </td>
                      <td className="py-2 pr-4 text-green-600 font-medium">
                        {trade.pl.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-red-500 font-semibold">
                        {trade.type}
                      </td>
                      <td className="py-2 text-blue-500 font-medium">
                        {trade.exitType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TransactionDetails;
