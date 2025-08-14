import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { infoIcon } from "../../../assets";

const RiskAndAdvance = ({ selectedStrategyTypes }) => {
  const { setValue } = useFormContext();
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
          onChange={(e)=> setValue("ExitWhenTotalProfit", Number(e.target.value) || 0, { shouldDirty: true })}
          className="w-full bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
        />

        <input
          type="text"
          placeholder="Exit When Over All Loss In Amount (INR)"
          onChange={(e)=> setValue("ExitWhenTotalLoss", Number(e.target.value) || 0, { shouldDirty: true })}
          className="w-full bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
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
                <input
                  type="checkbox"
                  onChange={(e)=> {
                    const map = { "No Trailing": 0, "Lock Fix Profit": 1, "Trail Profit": 2, "Lock and Trail": 3 };
                    setValue("TrailProfitType", e.target.checked ? map[opt] : 0, { shouldDirty: true });
                  }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedStrategyTypes?.[0] !== "time" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="If Profit Reaches"
              onChange={(e)=> setValue("LockProfitAt", Number(e.target.value) || 0, { shouldDirty: true })}
              className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Lock Profit at"
              onChange={(e)=> setValue("LockProfit", Number(e.target.value) || 0, { shouldDirty: true })}
              className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Every Increase In Profit By"
              onChange={(e)=> setValue("TrailProfitBy", Number(e.target.value) || 0, { shouldDirty: true })}
              className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Trail Profit By"
              onChange={(e)=> setValue("Trail_SL", Number(e.target.value) || 0, { shouldDirty: true })}
              className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
            />
          </div>
        )}
      </div>

      <div className="space-y-6 md:flex md:flex-col md:justify-between">
        <div className="p-4 border rounded-2xl space-y-4 dark:bg-[#15171C] dark:border-[#1E2027]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex gap-2 items-center font-semibold text-lg text-black dark:text-white">
                Advance Features <img src={infoIcon} alt="" />
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lorem Ipsum donor
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-y-4 mt-4 text-sm">
            {advanceOptions.map((opt) => (
              <label
                key={opt}
                className="flex items-center space-x-2 col-span-1 text-gray-700 dark:text-gray-300"
              >
                <input type="checkbox" onChange={(e)=> setValue("SquareOffAllOptionLegOnSl", e.target.checked, { shouldDirty: true })} />
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
            onChange={(e)=> setValue("StrategyName", e.target.value, { shouldDirty: true })}
            className="mt-3 bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 w-full dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
          />
          {/* Submit button lives in parent form */}
        </div>
      </div>
    </div>
  );
};

export default RiskAndAdvance;
