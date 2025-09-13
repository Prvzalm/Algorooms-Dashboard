import React, { useState } from "react";
import { formatCurrency } from "../../../hooks/reportsHooks";

const Badge = ({ children, color = "slate" }) => {
  const map = {
    green: "text-emerald-600 bg-emerald-50",
    red: "text-rose-600 bg-rose-50",
    slate: "text-slate-600 bg-slate-100",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${map[color]}`}
    >
      {children}
    </span>
  );
};

const StrategyCard = ({ strategy, onSelect, expanded = false, children }) => {
  const pnlPositive = (strategy.pnlStrategyWise ?? 0) >= 0;
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white ${
        expanded ? "p-0" : "p-5"
      } shadow-sm`}
    >
      {!expanded && (
        <button
          onClick={() => onSelect?.(strategy)}
          className="w-full text-left"
        >
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-[15px] text-slate-800 leading-none">
                  {strategy.StrategyName}
                </h3>
                <Badge color="slate">Win: {strategy.NoOfWins}</Badge>
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="text-slate-500">Total Traders</div>
                  <div className="font-medium text-slate-800 text-[13px]">
                    {strategy.TotalTrade}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-slate-500">P&L</div>
                  <div
                    className={`font-medium text-[13px] ${
                      pnlPositive ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(strategy.pnlStrategyWise)}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-slate-500">Wins</div>
                  <div className="font-medium text-emerald-600 text-[13px]">
                    {strategy.NoOfWins}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-slate-500">Losses</div>
                  <div className="font-medium text-rose-600 text-[13px]">
                    {strategy.NoOfLosses}
                  </div>
                </div>
              </div>
            </div>
            <div className="self-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </button>
      )}
      {expanded && children}
    </div>
  );
};

export default StrategyCard;
