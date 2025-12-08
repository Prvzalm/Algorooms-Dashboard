import React from "react";

// Simple SVG donut chart expecting segments: [{value, color, id}]
export const DonutChart = ({
  size = 140,
  stroke = 14,
  segments = [],
  showCenterTotal = true,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0) || 1;
  let offset = 0;

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="select-none"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F1F5F9"
          strokeWidth={stroke}
          fill="none"
        />
        {segments.map((seg, i) => {
          const safeVal = Math.max(0, seg.value);
          const dash = (safeVal / total) * circumference;
          const circle = (
            <circle
              key={seg.id || i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray .4s" }}
            />
          );
          offset += dash;
          return circle;
        })}
      </svg>
      {showCenterTotal && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[10px] text-slate-400 font-medium">
            Total P&L
          </div>
          <div className="text-[13px] font-semibold text-slate-700">
            {total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
