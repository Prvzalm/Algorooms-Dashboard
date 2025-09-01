import React, { useMemo, useId } from "react";

// Cumulative area + line chart (lightweight, no external deps)
// props: data = [{ Order, LabelName (MM-YYYY), DataValue }]
// Renders cumulative PnL curve with gradient fill & simple axes
const MiniCumulativeChart = ({ data = [], height = 120, className = "" }) => {
  const uid = useId().replace(/:/g, "");
  const processed = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return [...data]
      .filter((d) => typeof d?.DataValue === "number")
      .sort((a, b) => a.Order - b.Order);
  }, [data]);

  const cumulative = useMemo(() => {
    let sum = 0;
    return processed.map((d) => {
      sum += d.DataValue;
      return { ...d, cumulative: sum };
    });
  }, [processed]);

  const { min, max } = useMemo(() => {
    if (!cumulative.length) return { min: 0, max: 0 };
    let min = cumulative[0].cumulative;
    let max = cumulative[0].cumulative;
    cumulative.forEach((d) => {
      if (d.cumulative < min) min = d.cumulative;
      if (d.cumulative > max) max = d.cumulative;
    });
    if (min > 0) min = 0; // baseline at 0 if all positive
    if (max < 0) max = 0; // baseline at 0 if all negative
    return { min, max };
  }, [cumulative]);

  const width = 200;
  const range = max - min || 1;

  const points = cumulative.map((d, i) => {
    const x = (i / Math.max(1, cumulative.length - 1)) * (width - 10) + 5; // horizontal padding 5
    const y = height - ((d.cumulative - min) / range) * (height - 20) - 10; // vertical padding 10
    return { x, y, label: d.LabelName, cumulative: d.cumulative };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  const areaD = `${pathD} L${
    points.length ? points[points.length - 1].x.toFixed(2) : 0
  },${height - 10} L${points.length ? points[0].x.toFixed(2) : 0},${
    height - 10
  } Z`;

  // Y-axis ticks (0 plus maybe mid + max). We'll create 3 ticks: 0, mid, max (rounded)
  const ticks = useMemo(() => {
    const arr = [];
    const values = [0, max];
    if (max > 0) values.splice(1, 0, max / 2);
    else if (min < 0) values.splice(1, 0, min / 2);
    values.forEach((v) => {
      const y = height - ((v - min) / range) * (height - 20) - 10;
      arr.push({ value: v, y });
    });
    return arr;
  }, [max, min, range, height]);

  const formatNumber = (n) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (abs >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toFixed(0);
  };

  // X-axis labels: first month short (e.g. Mar), then year when it changes
  const xLabels = useMemo(() => {
    const out = [];
    points.forEach((p, i) => {
      const [mm, yyyy] = p.label.split("-");
      if (i === 0) {
        out.push({ x: p.x, text: monthShort(mm) });
      } else {
        const prev = points[i - 1];
        const [, prevYear] = prev.label.split("-");
        if (prevYear !== yyyy) {
          out.push({ x: p.x, text: yyyy });
        }
      }
    });
    return out;
  }, [points]);

  function monthShort(mm) {
    const m = parseInt(mm, 10);
    return (
      [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][m - 1] || mm
    );
  }

  const gradientId = `grad-${uid}`;

  return (
    <div className={className} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label="Cumulative performance chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* Y axis line */}
        <line
          x1={5}
          x2={5}
          y1={10}
          y2={height - 10}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        {ticks.map((t) => (
          <g key={t.value}>
            <line
              x1={5}
              x2={width}
              y1={t.y}
              y2={t.y}
              stroke="#f1f5f9"
              className="dark:stroke-gray-700"
              strokeWidth={0.5}
            />
            <text
              x={0}
              y={t.y + 3}
              fontSize={8}
              className="fill-gray-400 dark:fill-gray-500"
            >
              {formatNumber(t.value)}
            </text>
          </g>
        ))}
        {points.length > 0 ? (
          <>
            {/* Area */}
            <path d={areaD} fill={`url(#${gradientId})`} stroke="none" />
            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Points (last point emphasized) */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={i === points.length - 1 ? 3 : 1.5}
                fill={i === points.length - 1 ? "#2563eb" : "#3b82f6"}
              >
                <title>{`${p.label}  ${p.cumulative.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`}</title>
              </circle>
            ))}
            {/* X labels */}
            {xLabels.map((l, idx) => (
              <text
                key={idx}
                x={l.x}
                y={height - 2}
                fontSize={8}
                textAnchor="middle"
                className="fill-gray-400 dark:fill-gray-500"
              >
                {l.text}
              </text>
            ))}
          </>
        ) : (
          // Empty placeholder baseline grid only
          <text
            x={width / 2}
            y={height / 2}
            fontSize={9}
            textAnchor="middle"
            className="fill-gray-300 dark:fill-gray-600"
          >
            No Data
          </text>
        )}
      </svg>
    </div>
  );
};

export default MiniCumulativeChart;
