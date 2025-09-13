import React, { useMemo } from "react";

// Expects points: array of {x: string|number, y: number}
export const EquityCurve = ({ points = [], height = 180 }) => {
  const path = useMemo(() => {
    if (!points.length) return "";
    const ys = points.map((p) => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const range = maxY - minY || 1;
    const stepX = 100 / (points.length - 1 || 1);
    return points
      .map((p, i) => {
        const x = i * stepX;
        const yNorm = (p.y - minY) / range; // 0..1
        const y = 100 - yNorm * 100;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [points]);

  if (!points.length) {
    return (
      <div className="flex items-center justify-center h-[180px] text-xs text-slate-400">
        No Data
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <path
        d={path}
        fill="none"
        stroke="#0096FF"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="equityGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,150,255,0.25)" />
          <stop offset="100%" stopColor="rgba(0,150,255,0)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default EquityCurve;
