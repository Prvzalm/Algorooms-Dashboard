import React from "react";

// Skeleton loader for Reports page
const ReportsSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#1E2027] rounded-2xl border border-slate-200 dark:border-[#2D2F36] p-4 md:p-5 space-y-5 shadow-sm animate-pulse">
      {/* Tabs */}
      <div className="flex gap-10 text-[13px] font-medium pl-2 border-b border-slate-200 dark:border-[#2D2F36]">
        <div className="h-8 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded" />
        <div className="h-8 w-32 bg-gray-100 dark:bg-[#2D2F36] rounded" />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 text-[12px] font-medium bg-slate-50 dark:bg-[#15171C] rounded-lg px-3 py-3 border border-transparent dark:border-[#2D2F36]">
        <div className="flex items-center gap-2">
          <div className="h-3 w-10 bg-gray-200 dark:bg-[#2D2F36] rounded" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 bg-gray-200 dark:bg-[#2D2F36] rounded" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex border border-slate-200 dark:border-[#2D2F36] rounded-md overflow-hidden">
            <div className="h-8 w-16 bg-gray-200 dark:bg-[#2D2F36]" />
            <div className="h-8 w-16 bg-gray-100 dark:bg-[#2D2F36]" />
          </div>
          <div className="h-8 w-24 bg-[#0096FF]/40 dark:bg-[#0096FF]/30 rounded" />
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-slate-200 dark:border-[#2D2F36] rounded-xl p-4 flex gap-6 bg-white dark:bg-[#15171C]">
          <div className="space-y-4">
            <div className="h-3 w-28 bg-gray-200 dark:bg-[#2D2F36] rounded" />
            <div className="h-40 w-40 rounded-full bg-gray-100 dark:bg-[#2D2F36]" />
          </div>
          <ul className="space-y-2 text-[11px] font-medium max-h-[160px] overflow-y-auto pr-2 custom-scrollbar w-44">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gray-300 dark:bg-[#2D2F36]" />
                <div className="flex-1 h-3 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                <span className="h-3 w-10 rounded bg-gray-200 dark:bg-[#2D2F36]" />
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-slate-200 dark:border-[#2D2F36] rounded-xl p-4 flex flex-col gap-3 bg-white dark:bg-[#15171C]">
          <div className="h-[180px] w-full bg-gray-100 dark:bg-[#2D2F36] rounded" />
        </div>
      </div>

      {/* Strategy Cards Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-5"
          >
            <div className="flex items-start gap-6">
              <div className="flex-1 space-y-3">
                <div className="h-4 w-56 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                <div className="grid grid-cols-4 gap-4 text-xs">
                  {Array.from({ length: 4 }).map((__, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                      <div className="h-3 w-14 bg-gray-100 dark:bg-[#2D2F36] rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-5 w-5 bg-gray-200 dark:bg-[#2D2F36] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsSkeleton;
