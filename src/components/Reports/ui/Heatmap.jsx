import React, { useMemo } from "react";

// Scrollable month block heatmap
// Renders one <svg> per month; container scrolls horizontally.
const Heatmap = ({
  data = [],
  cell = 14,
  labelHeight = 18,
  withMonthlyTotals = false,
}) => {
  // Responsive tweak: shrink cells on very small screens
  const isSmall = typeof window !== "undefined" && window.innerWidth < 480;
  const actualCell = isSmall ? Math.max(10, cell - 4) : cell;
  const months = useMemo(() => {
    if (!data.length) return [];
    const parsed = data
      .map((d) => ({ date: new Date(d.date), value: Number(d.value) || 0 }))
      .sort((a, b) => a.date - b.date);
    const groups = new Map();
    parsed.forEach((p) => {
      const key = `${p.date.getFullYear()}-${p.date.getMonth()}`; // e.g. 2025-7
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });
    // Build month objects
    return Array.from(groups.entries()).map(([key, arr]) => {
      // Build continuous day list inside month
      const start = new Date(
        arr[0].date.getFullYear(),
        arr[0].date.getMonth(),
        1
      );
      const end = new Date(
        arr[0].date.getFullYear(),
        arr[0].date.getMonth() + 1,
        0
      );
      const map = new Map(
        arr.map((x) => [x.date.toISOString().slice(0, 10), x.value])
      );
      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push({
          date: new Date(d),
          value: map.get(d.toISOString().slice(0, 10)) || 0,
        });
      }
      return { key, days, year: start.getFullYear(), month: start.getMonth() };
    });
  }, [data]);

  // Find global max for color scaling
  const maxAbs = useMemo(() => {
    const values = data.map((d) => Math.abs(Number(d.value) || 0));
    return Math.max(1, ...values);
  }, [data]);

  const cellGap = 2;
  const inner = actualCell - cellGap; // visible square size
  // Base grid height (7 rows) + label. If monthly totals shown, allocate extra labelHeight space.
  const svgHeight =
    7 * actualCell + labelHeight + (withMonthlyTotals ? labelHeight : 0);

  // Monthly totals (optional)
  const monthlyTotals = useMemo(() => {
    if (!withMonthlyTotals) return [];
    const map = new Map();
    months.forEach((m) => {
      let sum = 0;
      m.days.forEach((d) => (sum += d.value || 0));
      map.set(m.key, {
        key: m.key,
        total: sum,
        label: new Date(m.year, m.month, 1).toLocaleDateString("en-GB", {
          month: "short",
          year: "2-digit",
        }),
      });
    });
    return Array.from(map.values());
  }, [months, withMonthlyTotals]);

  return (
    <div className="w-full h-full overflow-x-auto custom-scrollbar bg-transparent">
      <div className="flex items-start gap-3 sm:gap-6 pb-2">
        {months.map((m) => {
          // Determine first weekday offset
          const firstDow = new Date(m.year, m.month, 1).getDay(); // 0=Sun
          // Build cells: we layout by weeks columns similar to GitHub
          const totalSlots = firstDow + m.days.length; // we won't fill trailing blanks
          const weeks = Math.ceil(totalSlots / 7);
          const width = weeks * actualCell + 4; // + small right pad
          const label = new Date(m.year, m.month, 1).toLocaleDateString(
            "en-US",
            { month: "short", year: "2-digit" }
          );

          // Build rects
          const rects = [];
          m.days.forEach((dObj, idx) => {
            const pos = firstDow + idx; // position inside grid
            const week = Math.floor(pos / 7);
            const dow = pos % 7;
            const v = dObj.value;
            let fill = "#E2E8F0";
            if (v !== 0) {
              const intens = Math.min(1, Math.abs(v) / maxAbs);
              fill =
                v > 0
                  ? `rgba(16,185,129,${0.25 + intens * 0.75})`
                  : `rgba(239,68,68,${0.25 + intens * 0.75})`;
            }
            rects.push(
              <rect
                key={dObj.date.toISOString()}
                x={week * actualCell}
                y={dow * actualCell}
                width={inner}
                height={inner}
                rx={2}
                fill={fill}
                className="hover:stroke-slate-400 hover:stroke-1"
              >
                <title>{`${dObj.date.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })} | P&L: ₹${v.toLocaleString("en-IN")}`}</title>
              </rect>
            );
          });

          return (
            <div key={m.key} className="shrink-0 relative" style={{ width }}>
              <svg width={width} height={svgHeight} className="select-none">
                {rects}
                <g>
                  <text
                    x={0}
                    y={7 * actualCell + (labelHeight - 3)}
                    fontSize={13}
                    className="fill-slate-500 dark:fill-slate-400"
                  >
                    {label}
                  </text>
                  {withMonthlyTotals && (
                    <text
                      x={0}
                      y={7 * actualCell + labelHeight + (labelHeight - 3)}
                      fontSize={13}
                      className={`${
                        monthlyTotals.find((t) => t.key === m.key)?.total >= 0
                          ? "fill-emerald-600 dark:fill-emerald-400"
                          : "fill-rose-600 dark:fill-rose-400"
                      } font-semibold`}
                    >
                      {monthlyTotals
                        .find((t) => t.key === m.key)
                        ?.total.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </text>
                  )}
                </g>
              </svg>
              {/* vertical separator */}
              <div className="absolute top-0 right-[-3px] h-full w-px bg-slate-200 dark:bg-slate-700" />
            </div>
          );
        })}
        {!months.length && (
          <div className="text-xs text-slate-400 dark:text-slate-500 px-2 py-4">
            No data
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;
