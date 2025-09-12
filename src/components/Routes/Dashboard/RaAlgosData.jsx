import React, { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Common component supporting two variants:
// 1. dashboard (default): list of authors each with horizontally scrollable strategy chips
// 2. page: grid of strategy cards for a single author
// Props:
// - variant: 'dashboard' | 'page'
// - algos: array (dashboard variant)
// - author: object { name, avatar, sebiId } (page variant)
// - strategies: array of strategies (page variant)
const RaAlgosData = ({
  variant = "dashboard",
  algos = [],
  author,
  strategies = [],
}) => {
  if (variant === "page") {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {strategies.map((st, i) => (
          <div
            key={i}
            className="flex flex-col justify-between h-full rounded-xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] p-4 shadow-sm hover:shadow transition-shadow"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-[#2E3A59] dark:text-white leading-snug max-w-[140px] truncate">
                  {st?.name}
                </h3>
                <button className="text-[11px] text-[#718EBF] dark:text-gray-400 hover:text-[#0096FF]">
                  {st?.saves} Saves
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#718EBF] dark:text-gray-400 line-clamp-4 mb-4">
                {st?.description}
              </p>
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[#718EBF] dark:text-gray-400 mb-1">
                  Margin
                </p>
                <p className="text-sm font-semibold text-[#0096FF]">
                  {st?.margin}
                </p>
              </div>
              <button className="bg-[#0096FF] hover:bg-[#007FDB] text-white text-xs font-medium px-6 py-1.5 rounded-md">
                Deploy
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }
};

export default RaAlgosData;
