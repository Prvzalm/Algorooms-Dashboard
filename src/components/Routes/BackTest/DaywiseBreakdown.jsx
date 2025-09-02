import React, { useEffect, useRef, useState, useMemo } from "react";

const DaywiseBreakdown = ({ dictionaryOfDateWisePnl }) => {
  const cellRef = useRef();
  const [alignLeft, setAlignLeft] = useState(false);

  useEffect(() => {
    const el = cellRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      setAlignLeft(spaceRight < 120);
    }
  }, []);

  const formatAmount = (amt) =>
    amt > 0 ? `+${amt.toFixed(2)}` : amt.toFixed(2);

  const data = useMemo(() => {
    if (!dictionaryOfDateWisePnl) return [];
    // dictionary keys: YYYY-MM-DD => pnl
    const grouped = {};
    Object.entries(dictionaryOfDateWisePnl).forEach(([dateStr, pnl]) => {
      const d = new Date(dateStr);
      if (isNaN(d)) return;
      const monthKey = `${d.toLocaleDateString("en-US", {
        month: "short",
      })} ${d.getFullYear()}`;
      if (!grouped[monthKey])
        grouped[monthKey] = { date: monthKey, pnl: 0, grid: [] };
      grouped[monthKey].pnl += pnl;
      grouped[monthKey].grid.push({
        type: pnl > 0 ? "profit" : pnl < 0 ? "loss" : "inactive",
        amount: pnl,
        date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      });
    });
    return Object.values(grouped);
  }, [dictionaryOfDateWisePnl]);

  // Alternate tooltip: show a small fixed panel on click rather than hover causing overlap issues
  const [tooltip, setTooltip] = useState(null); // {x,y,date,amount}
  const containerRef = useRef(null);

  const handleCellClick = (e, cell) => {
    if (cell.type === "inactive") return;
    const rect = containerRef.current?.getBoundingClientRect();
    const cellRect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: cellRect.left - (rect?.left || 0) + cellRect.width / 2,
      y: cellRect.top - (rect?.top || 0) - 8,
      date: cell.date,
      amount: cell.amount,
    });
  };

  return (
    <div className="bg-white dark:bg-darkbg rounded-2xl w-full mb-8">
      <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
        Daywise Breakdown
      </h2>
      <div ref={containerRef} className="relative">
        {tooltip && (
          <div
            className="absolute z-50 -translate-x-1/2 bg-black text-white text-[11px] px-2 py-1 rounded shadow pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.date} • {formatAmount(tooltip.amount)}
          </div>
        )}
        <div className="flex overflow-x-auto gap-6 pb-4 overflow-visible">
          {data.map((month, idx) => (
            <div key={idx} className="flex flex-col items-center min-w-[72px]">
              <div className="grid grid-cols-5 gap-[4px] relative z-0 p-1 rounded bg-transparent">
                {month.grid.map((cell, i) => (
                  <div
                    key={i}
                    onMouseEnter={(e) => handleCellClick(e, cell)}
                    onMouseLeave={() => setTooltip(null)}
                    className={`w-4 h-4 rounded-sm cursor-pointer transition duration-150 ${
                      cell.type === "profit"
                        ? "bg-green-500"
                        : cell.type === "loss"
                        ? "bg-red-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap z-10">
                {month.date}
              </div>
              <div
                className={`mt-1 text-sm font-semibold ${
                  month.pnl > 0
                    ? "text-green-500"
                    : month.pnl < 0
                    ? "text-red-500"
                    : "text-black dark:text-white"
                }`}
              >
                {formatAmount(month.pnl)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DaywiseBreakdown;
