import React from "react";

const StrategyBuilderSkeleton = () => {
  return (
    <div className="space-y-6 text-sm animate-pulse">
      {/* Back Button Skeleton */}
      <div className="flex items-center">
        <div className="h-4 w-40 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Strategy Type Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-6 space-y-4">
            <div className="h-5 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
            </div>
          </div>

          {/* Instrument Selection Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-6 space-y-4">
            <div className="h-5 w-40 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
            <div className="h-12 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
            <div className="h-4 w-56 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
          </div>

          {/* Leg Section Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-8 w-24 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
                <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              </div>
            </div>
          </div>

          {/* Order Type Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-6 space-y-4">
            <div className="h-5 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Entry Condition Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-6 space-y-4">
            <div className="h-5 w-36 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
                <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              </div>
            </div>
          </div>

          {/* Risk & Advanced Settings Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-6 space-y-4">
            <div className="h-5 w-48 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
                <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              </div>
            </div>
          </div>

          {/* Additional Settings Card */}
          <div className="rounded-xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-6 space-y-4">
            <div className="h-5 w-40 bg-gray-200 dark:bg-[#2D2F36] rounded"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
              <div className="h-10 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <div className="h-10 w-32 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
        <div className="flex gap-3">
          <div className="h-10 w-28 bg-gray-100 dark:bg-[#2D2F36] rounded"></div>
          <div className="h-10 w-40 bg-blue-100 dark:bg-[#2D2F36] rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilderSkeleton;
