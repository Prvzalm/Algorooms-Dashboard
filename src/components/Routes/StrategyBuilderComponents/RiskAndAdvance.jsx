import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { infoIcon } from "../../../assets";

const RiskAndAdvance = ({ selectedStrategyTypes }) => {
  const { setValue, getValues } = useFormContext();
  const [noTradeAfter, setNoTradeAfter] = useState("15:15");

  useEffect(() => {
    setValue("TradeStopTime", noTradeAfter, { shouldDirty: true });
  }, [noTradeAfter, setValue]);

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

  const updateFirstStrike = (updater) => {
    const scripts = getValues("StrategyScriptList") || [];
    if (!Array.isArray(scripts) || scripts.length === 0) return;
    const firstScript = { ...scripts[0] };
    const longs = Array.isArray(firstScript.LongEquationoptionStrikeList)
      ? [...firstScript.LongEquationoptionStrikeList]
      : [];
    if (longs.length === 0) return;
    const strike = { ...longs[0] };
    updater(strike);
    longs[0] = strike;
    const nextScripts = [...scripts];
    nextScripts[0] = { ...firstScript, LongEquationoptionStrikeList: longs };
    setValue("StrategyScriptList", nextScripts, { shouldDirty: true });
  };

  const onToggleAdvance = (label, checked) => {
    switch (label) {
      case "Move SL to Cost":
        updateFirstStrike((s) => {
          s.IsMoveSLCTC = !!checked;
        });
        break;
      case "Exit All on SL/Tgt":
        setValue("SquareOffAllOptionLegOnSl", !!checked, { shouldDirty: true });
        updateFirstStrike((s) => {
          s.isExitAll = !!checked;
        });
        break;
      case "Pre Punch SL":
        updateFirstStrike((s) => {
          s.isPrePunchSL = !!checked;
        });
        break;
      case "Wait & Trade":
        updateFirstStrike((s) => {
          s.waitNTrade = {
            ...(s.waitNTrade || {}),
            isWaitnTrade: !!checked,
            isPerPt: s.waitNTrade?.isPerPt || "wtpr_+",
            typeId: s.waitNTrade?.typeId || "wtpr_+",
            MovementValue: s.waitNTrade?.MovementValue ?? 0,
          };
        });
        break;
      case "Premium Difference":
        updateFirstStrike((s) => {
          s.IsPriceDiffrenceConstrant = !!checked;
          if (!checked) s.PriceDiffrenceConstrantValue = 0;
        });
        break;
      case "Re Entry/Execute":
        updateFirstStrike((s) => {
          s.reEntry = {
            ...(s.reEntry || {}),
            isRentry: !!checked,
            RentryType: s.reEntry?.RentryType || "REN",
            TradeCycle: s.reEntry?.TradeCycle ?? 4,
            RentryActionTypeId: s.reEntry?.RentryActionTypeId || "ON_CLOSE",
          };
        });
        break;
      case "Trail SL":
        updateFirstStrike((s) => {
          s.isTrailSL = !!checked;
          s.TrailingSL = {
            ...(s.TrailingSL || {}),
            TrailingType: s.TrailingSL?.TrailingType || "tslpr",
            InstrumentMovementValue: s.TrailingSL?.InstrumentMovementValue ?? 0,
            TrailingValue: s.TrailingSL?.TrailingValue ?? 0,
          };
        });
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={`grid gap-6 ${
        selectedStrategyTypes?.[0] === "indicator"
          ? "md:grid-cols-1"
          : "md:grid-cols-2"
      }`}
    >
      {/* Placeholder left column for 'price' to force right-side positioning */}
      {selectedStrategyTypes?.[0] === "price" && (
        <div className="hidden md:block" />
      )}
      {/* Left column: hide Risk Management here when price strategy */}
      {selectedStrategyTypes?.[0] !== "indicator" &&
        selectedStrategyTypes?.[0] !== "price" && (
          <div className="p-4 border rounded-2xl space-y-4 dark:bg-[#15171C] dark:border-[#1E2027]">
            {/* Risk Management (non-price left column) */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg text-black dark:text-white">
                  Risk Management
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Lorem Ipsum donor
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Exit When Over All Profit In Amount (INR)"
                onChange={(e) =>
                  setValue("ExitWhenTotalProfit", Number(e.target.value) || 0, {
                    shouldDirty: true,
                  })
                }
                className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Exit When Over All Loss In Amount (INR)"
                onChange={(e) =>
                  setValue("ExitWhenTotalLoss", Number(e.target.value) || 0, {
                    shouldDirty: true,
                  })
                }
                className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
              />
              {selectedStrategyTypes?.[0] === "indicator" && (
                <div className="flex-1 min-w-[160px]">
                  <label className="text-gray-500 block text-xs mb-1 dark:text-gray-400">
                    Max Trade Cycle
                  </label>
                  <input
                    type="number"
                    placeholder="Max Trade Cycle"
                    onChange={(e) =>
                      setValue("MaxTrade", Number(e.target.value) || 0, {
                        shouldDirty: true,
                      })
                    }
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                  />
                </div>
              )}
              <div className="flex-1 min-w-[160px]">
                <label className="text-gray-500 block text-xs mb-1 dark:text-gray-400">
                  No Trade After
                </label>
                <input
                  type="time"
                  value={noTradeAfter}
                  onChange={(e) => setNoTradeAfter(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                />
              </div>
            </div>
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
                      onChange={(e) => {
                        const map = {
                          "No Trailing": 0,
                          "Lock Fix Profit": 1,
                          "Trail Profit": 2,
                          "Lock and Trail": 3,
                        };
                        setValue(
                          "TrailProfitType",
                          e.target.checked ? map[opt] : 0,
                          { shouldDirty: true }
                        );
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedStrategyTypes?.[0] === "price" && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="If Profit Reaches"
                  onChange={(e) =>
                    setValue("LockProfitAt", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Lock Profit at"
                  onChange={(e) =>
                    setValue("LockProfit", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Every Increase In Profit By"
                  onChange={(e) =>
                    setValue("TrailProfitBy", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Trail Profit By"
                  onChange={(e) =>
                    setValue("Trail_SL", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
              </div>
            )}
          </div>
        )}

      {/* Right column container (or only column for non-indicator) */}
      {selectedStrategyTypes?.[0] !== "indicator" && (
        <div className="space-y-6 md:flex md:flex-col md:justify-between">
          {/* For price strategy, show Risk Management here instead (above strategy name) */}
          {selectedStrategyTypes?.[0] === "price" && (
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
              </div>
              <div className="flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder="Exit When Over All Profit In Amount (INR)"
                  onChange={(e) =>
                    setValue(
                      "ExitWhenTotalProfit",
                      Number(e.target.value) || 0,
                      { shouldDirty: true }
                    )
                  }
                  className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Exit When Over All Loss In Amount (INR)"
                  onChange={(e) =>
                    setValue("ExitWhenTotalLoss", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <div className="flex-1 min-w-[160px]">
                  <label className="text-gray-500 block text-xs mb-1 dark:text-gray-400">
                    No Trade After
                  </label>
                  <input
                    type="time"
                    value={noTradeAfter}
                    onChange={(e) => setNoTradeAfter(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                  />
                </div>
              </div>
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
                        onChange={(e) => {
                          const map = {
                            "No Trailing": 0,
                            "Lock Fix Profit": 1,
                            "Trail Profit": 2,
                            "Lock and Trail": 3,
                          };
                          setValue(
                            "TrailProfitType",
                            e.target.checked ? map[opt] : 0,
                            { shouldDirty: true }
                          );
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="If Profit Reaches"
                  onChange={(e) =>
                    setValue("LockProfitAt", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Lock Profit at"
                  onChange={(e) =>
                    setValue("LockProfit", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Every Increase In Profit By"
                  onChange={(e) =>
                    setValue("TrailProfitBy", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Trail Profit By"
                  onChange={(e) =>
                    setValue("Trail_SL", Number(e.target.value) || 0, {
                      shouldDirty: true,
                    })
                  }
                  className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>
          )}
          {/* Advance Features hidden for 'price' strategy, Strategy Name always shown */}
          {selectedStrategyTypes?.[0] !== "price" && (
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
                    <input
                      type="checkbox"
                      onChange={(e) => onToggleAdvance(opt, e.target.checked)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 border rounded-2xl dark:bg-[#15171C] dark:border-[#1E2027]">
            <h2 className="font-semibold text-lg text-black dark:text-white">
              Strategy Name
            </h2>
            <input
              type="text"
              placeholder="Entry your strategy name here"
              onChange={(e) =>
                setValue("StrategyName", e.target.value, { shouldDirty: true })
              }
              className="mt-3 bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 w-full dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>
      )}
      {selectedStrategyTypes?.[0] === "indicator" && (
        <div className="p-4 border rounded-2xl dark:bg-[#15171C] dark:border-[#1E2027]">
          <h2 className="font-semibold text-lg text-black dark:text-white">
            Strategy Name
          </h2>
          <input
            type="text"
            placeholder="Entry your strategy name here"
            onChange={(e) =>
              setValue("StrategyName", e.target.value, { shouldDirty: true })
            }
            className="mt-3 bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 w-full dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
          />
        </div>
      )}
    </div>
  );
};

export default RiskAndAdvance;
