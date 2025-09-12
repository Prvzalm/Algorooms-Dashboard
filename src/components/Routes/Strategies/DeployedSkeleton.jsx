import React from "react";

const DeployedSkeleton = ({ rows = 3, strategiesPerRow = 2 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C] animate-pulse"
        >
          <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-[#2D2F36] rounded" />
              <div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-[#2D2F36] rounded mb-2" />
                <div className="h-4 w-40 bg-gray-200 dark:bg-[#2D2F36] rounded" />
              </div>
            </div>
            <div className="flex gap-4 md:gap-8 items-center flex-wrap">
              <div className="h-7 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded" />
              <div className="h-7 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded" />
              <div className="h-8 w-28 bg-gray-200 dark:bg-[#2D2F36] rounded" />
            </div>
            <div className="flex items-center gap-6">
              <div className="h-8 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-[#2D2F36] rounded-full" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-[#2D2F36] rounded-full" />
            </div>
          </div>
          <div className="border-t border-[#E4EAF0] dark:border-[#2D2F36] px-5 py-4 space-y-4">
            {Array.from({ length: strategiesPerRow }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-xl border border-[#E4EAF0] dark:border-[#2D2F36] px-4 py-3 bg-[#F9FBFC] dark:bg-[#1B1D22]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-4 w-40 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                  <div className="h-5 w-14 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                  <div className="h-4 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="h-6 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                  <div className="h-6 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                  <div className="h-8 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                  <div className="h-5 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeployedSkeleton;
