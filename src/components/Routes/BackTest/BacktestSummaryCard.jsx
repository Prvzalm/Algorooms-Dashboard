import React from "react";

const StatRow = ({ label, value, percentage, badgeText, positive }) => (
  <div className="flex flex-col justify-between items-center mb-1">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <div className="text-right">
      <p
        className={`font-medium ${
          positive ? "text-green-500" : "text-red-500"
        }`}
      >
        {value}
      </p>
      <span
        className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-lg ${
          positive
            ? "bg-[#00A4781A] text-[#00A478] dark:bg-green-800 dark:text-green-200"
            : "bg-[#E45A5A1A] text-[#E45A5A] dark:bg-red-800 dark:text-red-200"
        }`}
      >
        {badgeText}
      </span>
    </div>
  </div>
);

const BacktestSummaryCard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm font-medium mb-8">
      <div className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] p-4">
        <div className="flex border-b justify-between items-center text-gray-500 dark:text-gray-400 pb-3">
          Trading Days
          <div className="text-2xl font-semibold">13</div>
        </div>
        <div className="flex justify-between mt-5">
          <StatRow
            label="Win Days"
            value="53.85%"
            badgeText="7 vs 13"
            positive
          />
          <StatRow
            label="Loss Days"
            value="46.15%"
            badgeText="7 vs 13"
            positive={false}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] p-4">
        <div className="flex border-b justify-between items-center text-gray-500 dark:text-gray-400 pb-3">
          Total Trades <div className="text-2xl font-semibold">48</div>
        </div>
        <div className="flex justify-between mt-5">
          <StatRow
            label="Win Trades"
            value="53.85%"
            badgeText="7 vs 13"
            positive
          />
          <StatRow
            label="Loss Trades"
            value="46.15%"
            badgeText="7 vs 13"
            positive={false}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] p-4">
        <div className="flex border-b justify-between items-center pb-1">
          <div className="text-gray-500 dark:text-gray-400">Streak</div>
          <div className="text-left">
            <p>
              Win <b className="text-green-500">3</b>
            </p>
            <p>
              Loss <b className="text-red-500">4</b>
            </p>
          </div>
        </div>
        <div className="flex justify-between mt-5">
          <StatRow
            label="Max Profit"
            value="53.85%"
            badgeText="7 vs 13"
            positive
          />
          <StatRow
            label="Max Loss"
            value="2.50K"
            badgeText="7 vs 13"
            positive={false}
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
              Profit <b className="text-green-500">1234.00</b>
            </p>
            <p>
              Loss <b className="text-red-500">-1599.21</b>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              Max Drawdown
            </p>
            <p className="text-red-500 text-sm">From Park</p>
          </div>
          <div className="mt-2 flex justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-red-400 flex items-center justify-center text-red-500 font-bold text-lg">
              5.59K
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestSummaryCard;
