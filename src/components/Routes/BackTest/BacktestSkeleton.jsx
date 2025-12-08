import React from "react";

const BacktestSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Equity Curve Card Skeleton */}
      <div className="w-full bg-white dark:bg-darkbg text-[#2E3A59] dark:text-white rounded-xl p-6">
        <div className="flex flex-col justify-between mb-4 space-y-2">
          <div className="h-6 w-48 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
          <div className="h-6 w-56 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
        </div>
        <div className="w-full h-[300px] bg-gray-100 dark:bg-[#2D2F36] rounded-lg mb-8"></div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-darkbg rounded-xl p-4 space-y-3"
          >
            <div className="h-4 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
            <div className="h-6 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
          </div>
        ))}
      </div>

      {/* Max Profit/Loss Chart Skeleton */}
      <div className="bg-white dark:bg-darkbg rounded-xl p-6">
        <div className="h-6 w-48 bg-gray-200 dark:bg-[#2D2F36] rounded mb-4"></div>
        <div className="w-full h-[300px] bg-gray-100 dark:bg-[#2D2F36] rounded-lg"></div>
      </div>

      {/* Daywise Breakdown Skeleton */}
      <div className="bg-white dark:bg-darkbg rounded-xl p-6">
        <div className="h-6 w-40 bg-gray-200 dark:bg-[#2D2F36] rounded mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#1A1C23] rounded"
            >
              <div className="h-4 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Details Skeleton */}
      <div className="bg-white dark:bg-darkbg rounded-xl p-6">
        <div className="h-6 w-44 bg-gray-200 dark:bg-[#2D2F36] rounded mb-4"></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2D2F36]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="py-3 px-4">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-gray-100 dark:border-[#2D2F36]"
                >
                  {Array.from({ length: 6 }).map((_, colIdx) => (
                    <td key={colIdx} className="py-3 px-4">
                      <div className="h-4 w-16 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BacktestSkeleton;
