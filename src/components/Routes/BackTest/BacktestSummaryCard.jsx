import React from "react";
import { getPnlTextClass } from "../../../services/utils/formatters";

const StatRow = ({
  label,
  value,
  badgeText,
  positive = true,
  valueClassName,
  badgeTone,
}) => {
  const resolvedValueClass =
    valueClassName || (positive ? "text-green-500" : "text-red-500");
  const tone = badgeTone || (positive ? "positive" : "negative");
  const badgeClassMap = {
    positive:
      "bg-[#00A4781A] text-[#00A478] dark:bg-green-800 dark:text-green-200",
    negative: "bg-[#E45A5A1A] text-[#E45A5A] dark:bg-red-800 dark:text-red-200",
    neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <div className="flex flex-col justify-between items-center mb-1">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <div className="text-right">
        <p className={`font-medium ${resolvedValueClass}`}>{value}</p>
        {badgeText ? (
          <span
            className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-lg ${badgeClassMap[tone]}`}
          >
            {badgeText}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const BacktestSummaryCard = ({ overall }) => {
  const winDayPer = overall?.WinDayPer ?? 0;
  const loseDayPer = overall?.LoseDayPer ?? 0;
  const totalTradedDays = overall?.TotalTradedDays ?? 0;
  const winDays = overall?.WinDays ?? 0;
  const loseDays = overall?.LoseDays ?? 0;
  const totalTrades = overall?.TotalTrades ?? 0;
  const winTrades = overall?.WinTrades ?? 0;
  const loseTrades = overall?.LoseTrades ?? 0;
  const winTradesPer = overall?.WinTradesPer ?? 0;
  const loseTradesPer = overall?.LoseTradesPer ?? 0;
  const maxProfit = overall?.MaxProfit ?? 0;
  const maxLoss = overall?.MaxLoss ?? 0;
  const winStreak = overall?.WinStreak ?? 0;
  const loseStreak = overall?.LoseStreak ?? 0;
  const avgProfitPerDay = overall?.AverageProfitPerDay ?? 0;
  const avgLossPerDay = overall?.AverageLossPerDay ?? 0;
  const maxDrawDown = overall?.CommulitiveDrawDown ?? 0;

  const formatCurrency = (value) =>
    Number.isFinite(value)
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "--";

  const maxProfitClass = getPnlTextClass(maxProfit);
  const maxLossClass = getPnlTextClass(maxLoss);
  const avgProfitClass = getPnlTextClass(avgProfitPerDay);
  const avgLossClass = getPnlTextClass(avgLossPerDay);
  const drawdownClass = getPnlTextClass(maxDrawDown, {
    neutral: "text-gray-600 dark:text-gray-300",
  });
  const drawdownBorder =
    maxDrawDown < 0
      ? "border-red-400"
      : maxDrawDown > 0
      ? "border-green-400"
      : "border-gray-400 dark:border-gray-600";
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm font-medium mb-8">
      <div className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] p-4">
        <div className="flex border-b justify-between items-center text-gray-500 dark:text-gray-400 pb-3">
          Trading Days
          <div className="text-2xl font-semibold">{totalTradedDays}</div>
        </div>
        <div className="flex justify-between mt-5">
          <StatRow
            label="Win Days"
            value={`${winDayPer?.toFixed(2)}%`}
            badgeText={`${winDays} vs ${totalTradedDays}`}
            positive={winDayPer >= loseDayPer}
          />
          <StatRow
            label="Loss Days"
            value={`${loseDayPer?.toFixed(2)}%`}
            badgeText={`${loseDays} vs ${totalTradedDays}`}
            positive={false}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] p-4">
        <div className="flex border-b justify-between items-center text-gray-500 dark:text-gray-400 pb-3">
          Total Trades{" "}
          <div className="text-2xl font-semibold">{totalTrades}</div>
        </div>
        <div className="flex justify-between mt-5">
          <StatRow
            label="Win Trades"
            value={`${winTradesPer?.toFixed(2)}%`}
            badgeText={`${winTrades} vs ${totalTrades}`}
            positive={winTradesPer >= loseTradesPer}
          />
          <StatRow
            label="Loss Trades"
            value={`${loseTradesPer?.toFixed(2)}%`}
            badgeText={`${loseTrades} vs ${totalTrades}`}
            positive={false}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] p-4">
        <div className="flex border-b justify-between items-center pb-1">
          <div className="text-gray-500 dark:text-gray-400">Streak</div>
          <div className="text-left">
            <p>
              Win <b className="text-green-500">{winStreak}</b>
            </p>
            <p>
              Loss <b className="text-red-500">{loseStreak}</b>
            </p>
          </div>
        </div>
        <div className="flex justify-between mt-5">
          <StatRow
            label="Max Profit"
            value={`₹ ${formatCurrency(maxProfit)}`}
            badgeText={null}
            positive
            valueClassName={maxProfitClass}
            badgeTone="neutral"
          />
          <StatRow
            label="Max Loss"
            value={`₹ ${formatCurrency(maxLoss)}`}
            badgeText={null}
            positive={false}
            valueClassName={maxLossClass}
            badgeTone="neutral"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] p-4">
        <div className="flex border-b items-center justify-between pb-1">
          <div className="text-gray-500 dark:text-gray-400">
            Average Per Day
          </div>
          <div className="text-left">
            <p>
              Profit{" "}
              <b className={avgProfitClass}>{avgProfitPerDay.toFixed(2)}</b>
            </p>
            <p>
              Loss <b className={avgLossClass}>{avgLossPerDay.toFixed(2)}</b>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Max Drawdown
            </p>
            <p className="text-red-500 text-sm">From Peak</p>
          </div>
          <div className="mt-2 flex justify-center">
            <div
              className={`w-20 h-20 rounded-full border-4 ${drawdownBorder} flex items-center justify-center font-bold text-lg ${drawdownClass}`}
            >
              {Math.abs(maxDrawDown) > 1000
                ? (Math.abs(maxDrawDown) / 1000).toFixed(2) + "K"
                : Math.abs(maxDrawDown).toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestSummaryCard;
