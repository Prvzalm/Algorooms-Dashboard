import React, { useState, useMemo } from "react";
import { FiChevronDown, FiChevronUp, FiPrinter } from "react-icons/fi";

const TransactionDetails = ({ dateWiseDetailList }) => {
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

      {dateWiseDetailList?.map((item, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] mb-6 overflow-hidden"
        >
          {/* Date Header */}
          <div
            className="flex justify-between items-center px-4 py-4 cursor-pointer"
            onClick={() => toggleExpand(item.Date)}
          >
            <span className="text-gray-500 dark:text-gray-400">
              {new Date(item.Date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Profit/Loss</span>
              <span
                className={`${
                  item.dateWiseSummary?.TotatProfitLoss >= 0
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                } font-semibold px-3 py-1 rounded-full text-sm`}
              >
                {item.dateWiseSummary?.TotatProfitLoss?.toLocaleString()}
              </span>
              {expandedDate === item.Date ? <FiChevronUp /> : <FiChevronDown />}
            </div>
          </div>

          {/* Trades Table */}
          {expandedDate === item.Date && (
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
                  {item.ScriptWiseTransactionDetailList?.map((trade, i) => (
                    <tr
                      key={i}
                      className="text-gray-700 dark:text-white border-t"
                    >
                      <td className="py-2 pr-4">{trade.TradingSymbol}</td>
                      <td className="py-2 pr-4">{trade.Qty}</td>
                      <td className="py-2 pr-4">
                        Price: {trade.EntryPrice}
                        <br />
                        Time:{" "}
                        {new Date(trade.EntryTimeStamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 pr-4">
                        Price: {trade.ExitPrice}
                        <br />
                        Time:{" "}
                        {new Date(trade.ExitTimeStamp).toLocaleTimeString()}
                      </td>
                      <td
                        className={`py-2 pr-4 font-medium ${
                          trade.PNL >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {trade.PNL.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-red-500 font-semibold">
                        {trade.TransactionType}
                      </td>
                      <td className="py-2 text-blue-500 font-medium">
                        {trade.OrderExitType}
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
