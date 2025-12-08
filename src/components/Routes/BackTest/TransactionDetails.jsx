import React, { useState } from "react";
import { FiChevronDown, FiChevronUp, FiPrinter } from "react-icons/fi";
import { getPnlTextClass } from "../../../services/utils/formatters";

const TransactionDetails = ({ dateWiseDetailList }) => {
  const [expandedDate, setExpandedDate] = useState(null);
  // track current page per date (so each day's table paginates independently)
  const [pageMap, setPageMap] = useState({});
  const PAGE_SIZE = 5;

  const toggleExpand = (date) => {
    setExpandedDate((prev) => (prev === date ? null : date));
    // when expanding a new date, ensure its page is set to 1
    setPageMap((prev) => ({ ...(prev || {}), [date]: 1 }));
  };

  const setPageForDate = (date, page) => {
    setPageMap((prev) => ({ ...(prev || {}), [date]: page }));
  };

  const formatTime = (value) => {
    if (!value) return "--";
    const dt = new Date(value);
    return Number.isNaN(dt.getTime())
      ? "--"
      : dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatNumber = (value) =>
    Number.isFinite(Number(value))
      ? Number(value).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      : "--";

  const getTransactionTone = (type) => {
    if (!type) return "text-gray-500";
    const normalized = type.toLowerCase();
    if (normalized.includes("sell")) return "text-red-500 dark:text-red-400";
    if (normalized.includes("buy")) return "text-green-600 dark:text-green-400";
    return "text-gray-500 dark:text-gray-400";
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

      {dateWiseDetailList?.map((item, index) => {
        const dayPnl = Number(item.dateWiseSummary?.TotatProfitLoss) || 0;
        const dayPnlTone = getPnlTextClass(dayPnl, {
          neutral: "text-gray-600 dark:text-gray-300",
        });
        const badgeBg =
          dayPnl > 0
            ? "bg-green-100 dark:bg-green-900/30"
            : dayPnl < 0
            ? "bg-red-100 dark:bg-red-900/30"
            : "bg-gray-100 dark:bg-gray-800";

        return (
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
                  className={`${badgeBg} ${dayPnlTone} font-semibold px-3 py-1 rounded-full text-sm`}
                >
                  {formatNumber(dayPnl)}
                </span>
                {expandedDate === item.Date ? (
                  <FiChevronUp />
                ) : (
                  <FiChevronDown />
                )}
              </div>
            </div>

            {/* Trades Table */}
            {expandedDate === item.Date && (
              <div className="border-t border-gray-200 dark:border-[#2D2F36] p-4 overflow-x-auto">
                {/** Paginate trades for this date */}
                {(() => {
                  const trades = item.ScriptWiseTransactionDetailList || [];
                  const total = trades.length;
                  const currentPage = pageMap[item.Date] || 1;
                  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
                  const start = (currentPage - 1) * PAGE_SIZE;
                  const pageItems = trades.slice(start, start + PAGE_SIZE);

                  return (
                    <>
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
                          {pageItems.map((trade, i) => {
                            const pnlValue = Number(trade.PNL);
                            const pnlClass = getPnlTextClass(pnlValue);
                            return (
                              <tr
                                key={i}
                                className="text-gray-700 dark:text-white border-t"
                              >
                                <td className="py-2 pr-4">
                                  {trade.TradingSymbol || "--"}
                                </td>
                                <td className="py-2 pr-4">
                                  {trade.Qty ?? "--"}
                                </td>
                                <td className="py-2 pr-4">
                                  Price: {formatNumber(trade.EntryPrice)}
                                  <br />
                                  Time: {formatTime(trade.EntryTimeStamp)}
                                </td>
                                <td className="py-2 pr-4">
                                  Price: {formatNumber(trade.ExitPrice)}
                                  <br />
                                  Time: {formatTime(trade.ExitTimeStamp)}
                                </td>
                                <td
                                  className={`py-2 pr-4 font-medium ${pnlClass}`}
                                >
                                  {formatNumber(pnlValue)}
                                </td>
                                <td
                                  className={`py-2 pr-4 font-semibold ${getTransactionTone(
                                    trade.TransactionType || ""
                                  )}`}
                                >
                                  {trade.TransactionType || "--"}
                                </td>
                                <td className="py-2 text-blue-500 font-medium">
                                  {trade.OrderExitType || "--"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Pagination controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-gray-500">
                          Showing {Math.min(total, start + 1)} -{" "}
                          {Math.min(total, start + PAGE_SIZE)} of {total}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setPageForDate(
                                item.Date,
                                Math.max(1, currentPage - 1)
                              )
                            }
                            disabled={currentPage === 1}
                            className={`px-2 py-1 rounded ${
                              currentPage === 1
                                ? "text-gray-400"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            Prev
                          </button>
                          {Array.from({ length: totalPages }).map((_, pIdx) => {
                            const pageNum = pIdx + 1;
                            return (
                              <button
                                key={pageNum}
                                onClick={() =>
                                  setPageForDate(item.Date, pageNum)
                                }
                                className={`px-2 py-1 rounded ${
                                  pageNum === currentPage
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() =>
                              setPageForDate(
                                item.Date,
                                Math.min(totalPages, currentPage + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className={`px-2 py-1 rounded ${
                              currentPage === totalPages
                                ? "text-gray-400"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TransactionDetails;
