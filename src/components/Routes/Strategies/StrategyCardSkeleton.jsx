import React from "react";

const StrategyCardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-5 animate-pulse"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-gray-200 dark:bg-[#2D2F36] rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded" />
            </div>
            <div className="h-5 w-5 bg-gray-200 dark:bg-[#2D2F36] rounded" />
          </div>
          <div className="grid grid-cols-2 gap-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-[#2D2F36] rounded" />
              </div>
            ))}
          </div>
          <div className="mt-4 h-9 bg-gray-100 dark:bg-[#2D2F36] rounded" />
          <div className="mt-4 flex space-x-2">
            <div className="flex-1 h-10 bg-gray-100 dark:bg-[#2D2F36] rounded" />
            <div className="flex-1 h-10 bg-gray-200 dark:bg-[#2D2F36] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StrategyCardSkeleton;
