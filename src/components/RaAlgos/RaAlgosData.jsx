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
                  {st.name}
                </h3>
                <button className="text-[11px] text-[#718EBF] dark:text-gray-400 hover:text-[#0096FF]">
                  {st.saves} Saves
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-[#718EBF] dark:text-gray-400 line-clamp-4 mb-4">
                {st.description}
              </p>
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-[#718EBF] dark:text-gray-400 mb-1">
                  Margin
                </p>
                <p className="text-sm font-semibold text-[#0096FF]">
                  {st.margin}
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

  // dashboard variant (existing design)
  const scrollRefs = useRef([]);
  const scroll = (index, direction) => {
    const el = scrollRefs.current[index];
    if (el) {
      el.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-4">
      {algos.map((algo, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#15171C] rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="flex items-center gap-4 md:w-1/3 w-full">
            <img
              src={algo.avatar || `https://i.pravatar.cc/100?img=${idx + 1}`}
              alt="avatar"
              className="w-14 h-14 rounded-2xl object-cover"
            />
            <div className="truncate">
              <p className="font-semibold text-[#2E3A59] dark:text-white truncate">
                {algo.name}
              </p>
              <p className="text-xs text-[#718EBF] dark:text-gray-400 truncate">
                SEBI {algo.sebiId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-2/3">
            <button
              onClick={() => scroll(idx, "left")}
              className="p-2 rounded-full border border-gray-300 dark:border-[#2D2F36] text-gray-400 hover:text-[#0096FF]"
            >
              <FiChevronLeft size={16} />
            </button>

            <div
              ref={(el) => (scrollRefs.current[idx] = el)}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
            >
              {algo.strategies.map((s, i) => (
                <div
                  key={i}
                  className="min-w-[220px] px-4 py-3 rounded-xl bg-[#F9FAFB] dark:bg-[#1E2027] border border-gray-200 dark:border-[#2D2F36] text-sm"
                >
                  <div className="flex justify-between font-medium">
                    <span className="truncate">{s.name}</span>
                    <span className="text-black dark:text-white font-semibold">
                      {s.margin}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#718EBF] dark:text-gray-400 mt-1">
                    <span>{s.saves} Saves</span>
                    <span>Margin</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll(idx, "right")}
              className="p-2 rounded-full border border-gray-300 dark:border-[#2D2F36] text-gray-400 hover:text-[#0096FF]"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RaAlgosData;
