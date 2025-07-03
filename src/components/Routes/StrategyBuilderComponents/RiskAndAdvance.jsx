import { useState } from "react";

const RiskAndAdvance = () => {
  const [noTradeAfter, setNoTradeAfter] = useState("15:14");

  const trailingOptions = [
    "No Trailing",
    "Lock Fix Profit",
    "Trail Profit",
    "Lock and Trail",
  ];
  const advanceOptions = [
    "Move SL to Cost",
    "Exit All on SL/Tgt",
    "Pre Punch SL",
    "Wait & Trade",
    "Premium Difference",
    "Re Entry/Execute",
    "Trail SL",
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-4 border rounded-2xl space-y-4 dark:bg-[#15171C] dark:border-[#1E2027]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-semibold text-lg text-black dark:text-white">
              Risk Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Lorem Ipsum donor
            </p>
          </div>
          <div>
            <label className="text-gray-500 block text-xs mb-1 dark:text-gray-400">
              No Trade After
            </label>
            <input
              type="time"
              value={noTradeAfter}
              onChange={(e) => setNoTradeAfter(e.target.value)}
              className="border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="Exit When Over All Profit In Amount (INR)"
          className="w-full placeholder:text-center bg-blue-50 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium placeholder-gray-600 dark:bg-[#1E2027] dark:text-white dark:placeholder-white"
        />

        <input
          type="text"
          placeholder="Exit When Over All Loss In Amount (INR)"
          className="w-full placeholder:text-center bg-blue-50 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium placeholder-gray-600 dark:bg-[#1E2027] dark:text-white dark:placeholder-white"
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-white">
            Profit Trailing
          </p>
          <div className="flex flex-wrap w-full gap-4 text-sm">
            {trailingOptions.map((opt) => (
              <label
                key={opt}
                className="flex items-center space-x-2 flex-1 min-w-[150px] text-gray-700 dark:text-gray-300"
              >
                <input type="checkbox" />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="If Profit Reaches"
            className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Lock Profit at"
            className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Every Increase In Profit By"
            className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="Trail Profit By"
            className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="space-y-6 md:flex md:flex-col md:justify-between">
        <div className="p-4 border rounded-2xl space-y-4 dark:bg-[#15171C] dark:border-[#1E2027]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg text-black dark:text-white">
                Advance Features
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lorem Ipsum donor
              </p>
            </div>
            <div className="text-gray-500 text-xl font-bold dark:text-gray-300">
              i
            </div>
          </div>

          <div className="grid grid-cols-3 gap-y-4 mt-4 text-sm">
            {advanceOptions.map((opt) => (
              <label
                key={opt}
                className="flex items-center space-x-2 col-span-1 text-gray-700 dark:text-gray-300"
              >
                <input type="checkbox" />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-2xl dark:bg-[#15171C] dark:border-[#1E2027]">
          <h2 className="font-semibold text-lg text-black dark:text-white">
            Strategy Name
          </h2>
          <input
            type="text"
            placeholder="Entry your strategy name here"
            className="mt-3 bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 w-full dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
          />
          <button className="ml-auto mt-4 bg-[#0096FF] text-white md:px-8 px-4 py-2 rounded-lg text-sm font-medium">
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskAndAdvance;
