import React, { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const RaAlgosData = ({ algos }) => {
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
