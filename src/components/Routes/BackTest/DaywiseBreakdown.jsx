import React, { useEffect, useRef, useState } from "react";

const DaywiseBreakdown = () => {
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

  const generateDaywiseDataWithActualDates = () => {
    const startDate = new Date(new Date().getFullYear(), 0, 1);
    const result = [];

    for (let month = 0; month < 12; month++) {
      const date = new Date(startDate);
      date.setMonth(month);

      const monthName = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      const dayData = {
        date: monthName,
        pnl: 0,
        grid: [],
      };

      for (let i = 0; i < 25; i++) {
        const tradeDate = new Date(date);
        tradeDate.setDate(i + 1);

        const rand = Math.random();
        let type = "inactive";
        let amount = 0;

        if (rand > 0.7) {
          type = "profit";
          amount = Math.floor(Math.random() * 2000 + 500);
        } else if (rand > 0.4) {
          type = "loss";
          amount = -Math.floor(Math.random() * 1500 + 300);
        }

        if (type !== "inactive") {
          dayData.pnl += amount;
        }

        dayData.grid.push({
          type,
          amount,
          date: tradeDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }),
        });
      }

      result.push(dayData);
    }

    return result;
  };

  const data = generateDaywiseDataWithActualDates();

  return (
    <div className="bg-white dark:bg-darkbg rounded-2xl w-full mb-8">
      <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
        Daywise Breakdown
      </h2>

      <div className="flex overflow-x-auto gap-4 pb-2 overflow-visible">
        {data.map((month, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center min-w-[64px] gap-1"
          >
            <div className="grid grid-cols-5 gap-[3px] sm:gap-[4px]">
              {month.grid.map((cell, i) => (
                <div
                  key={i}
                  ref={cellRef}
                  className={`w-4 h-4 rounded-sm relative group transition duration-200 ${
                    cell.type === "profit"
                      ? "bg-green-500 hover:brightness-110"
                      : cell.type === "loss"
                      ? "bg-red-500 hover:brightness-110"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  {cell.type !== "inactive" && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap bg-black text-white text-[10px] px-2 py-1 rounded z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-200 ${
                        alignLeft ? "right-full mr-2" : "left-full ml-2"
                      }`}
                    >
                      {cell.date} • {formatAmount(cell.amount)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-500 mt-1">{month.date}</div>

            <div
              className={`text-sm font-semibold ${
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
  );
};

export default DaywiseBreakdown;
