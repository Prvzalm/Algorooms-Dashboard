import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { infoIcon } from "../../../assets";
import ReEntryExecuteModal from "./ReEntryExecuteModal";
import TrailStopLossModal from "./TrailStopLossModal";
import React from "react";

const RiskAndAdvance = ({ selectedStrategyTypes }) => {
  const { setValue, getValues, watch } = useFormContext();
  const [noTradeAfter, setNoTradeAfter] = useState("15:15");

  // Watch reactive values to avoid infinite loops
  const strategyScripts = watch("StrategyScriptList");
  const activeLegIndex = watch("ActiveLegIndex");

  // Check if equity instruments are selected in indicator-based mode
  const isIndicatorEquityMode =
    selectedStrategyTypes?.[0] === "indicator" &&
    getValues("StrategySegmentType") === "Equity";

  // State for equity script fields
  const [targetSlType, setTargetSlType] = useState("Percentage(%)");
  const [targetOnEachScript, setTargetOnEachScript] = useState("");
  const [stopLossOnEachScript, setStopLossOnEachScript] = useState("");

  // Prefill on mount (edit mode)
  useEffect(() => {
    const stop = getValues("TradeStopTime") || getValues("AutoSquareOffTime");
    if (stop) setNoTradeAfter(stop);

    // Prefill equity script fields if they exist
    const targetOnScript = getValues("TargetOnEachScript");
    const stopLossOnScript = getValues("StopLossOnEachScript");
    const targetSlTypeValue = getValues("TargetSlType");

    if (targetOnScript) setTargetOnEachScript(String(targetOnScript));
    if (stopLossOnScript) setStopLossOnEachScript(String(stopLossOnScript));
    if (targetSlTypeValue) setTargetSlType(targetSlTypeValue);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setValue("TradeStopTime", noTradeAfter, { shouldDirty: true });
  }, [noTradeAfter, setValue]);

  // Handle form values for equity script fields
  useEffect(() => {
    if (isIndicatorEquityMode && targetOnEachScript !== "") {
      setValue("TargetOnEachScript", Number(targetOnEachScript) || 0, {
        shouldDirty: true,
      });
    }
  }, [targetOnEachScript, setValue, isIndicatorEquityMode]);

  useEffect(() => {
    if (isIndicatorEquityMode && stopLossOnEachScript !== "") {
      setValue("StopLossOnEachScript", Number(stopLossOnEachScript) || 0, {
        shouldDirty: true,
      });
    }
  }, [stopLossOnEachScript, setValue, isIndicatorEquityMode]);

  useEffect(() => {
    if (isIndicatorEquityMode) {
      setValue("TargetSlType", targetSlType, { shouldDirty: true });
    }
  }, [targetSlType, setValue, isIndicatorEquityMode]);

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

  // local UI state for which advance features are active
  const [advState, setAdvState] = useState({
    "Move SL to Cost": false,
    "Exit All on SL/Tgt": false,
    "Pre Punch SL": false,
    "Wait & Trade": false,
    "Premium Difference": false,
    "Re Entry/Execute": false,
    "Trail SL": false,
  });

  // Sync advState with actual form data to keep checkboxes in sync
  useEffect(() => {
    const scripts = strategyScripts || [];
    const firstScript = scripts[0] || {};
    const longs = firstScript.LongEquationoptionStrikeList || [];
    const currentStrike = longs[activeLegIndex] || {};

    setAdvState((prev) => ({
      ...prev,
      "Move SL to Cost": currentStrike.IsMoveSLCTC || false,
      "Exit All on SL/Tgt": currentStrike.isExitAll || false,
      "Pre Punch SL": currentStrike.isPrePunchSL || false,
      "Wait & Trade": currentStrike.waitNTrade?.isWaitnTrade || false,
      "Premium Difference": currentStrike.IsPriceDiffrenceConstrant || false,
      "Re Entry/Execute": currentStrike.reEntry?.isRentry || false,
      "Trail SL": currentStrike.isTrailSL || false,
    }));
  }, [strategyScripts, activeLegIndex]);

  const isDisabledAdvance = (label) => {
    // Rule 1: Move SL to Cost active -> disable all except Exit All and Premium Difference
    if (
      advState["Move SL to Cost"] &&
      label !== "Exit All on SL/Tgt" &&
      label !== "Premium Difference" &&
      label !== "Move SL to Cost"
    ) {
      return true;
    }
    // Rule 2: Exit All disables Re Entry/Execute
    if (advState["Exit All on SL/Tgt"] && label === "Re Entry/Execute") {
      return true;
    }
    // Rule 3: Wait & Trade disables Move SL to Cost
    if (advState["Wait & Trade"] && label === "Move SL to Cost") {
      return true;
    }
    return false;
  };

  const updateFirstStrike = (updater) => {
    const scripts = strategyScripts || [];
    if (!Array.isArray(scripts) || scripts.length === 0) return;
    const firstScript = { ...scripts[0] };
    const longs = Array.isArray(firstScript.LongEquationoptionStrikeList)
      ? [...firstScript.LongEquationoptionStrikeList]
      : [];
    if (longs.length === 0) return;

    // Use the watched active leg index to update the correct leg
    const targetIndex = Math.min(activeLegIndex || 0, longs.length - 1);

    const strike = { ...longs[targetIndex] };
    updater(strike);
    longs[targetIndex] = strike;
    const nextScripts = [...scripts];
    nextScripts[0] = { ...firstScript, LongEquationoptionStrikeList: longs };
    setValue("StrategyScriptList", nextScripts, { shouldDirty: true });
  };
  const onToggleAdvance = (label, checked) => {
    setAdvState((prev) => ({ ...prev, [label]: checked }));
    // enforce mutual exclusions when turning ON
    if (checked) {
      if (label === "Move SL to Cost") {
        // turning on Move SL to Cost should turn off others except allowed
        setAdvState((prev) => ({
          ...prev,
          "Move SL to Cost": true,
          "Wait & Trade": false,
          "Pre Punch SL": false,
          "Trail SL": false,
          "Re Entry/Execute": prev["Re Entry/Execute"],
          "Exit All on SL/Tgt": prev["Exit All on SL/Tgt"],
          "Premium Difference": prev["Premium Difference"],
        }));
      }
      if (label === "Exit All on SL/Tgt") {
        // exit all -> disable re entry
        setAdvState((prev) => ({ ...prev, "Re Entry/Execute": false }));
      }
      if (label === "Wait & Trade") {
        // wait & trade disables move SL to cost
        setAdvState((prev) => ({ ...prev, "Move SL to Cost": false }));
      }
    }
    // Update a consolidated AdvanceFeatures map in form for simpler consumption in Leg1
    const currentAf = getValues("AdvanceFeatures") || {};
    setValue(
      "AdvanceFeatures",
      { ...currentAf, [label]: checked },
      { shouldDirty: true }
    );

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
            isPerPt: s.waitNTrade?.isPerPt || "wt_eq",
            typeId: s.waitNTrade?.typeId || "wt_eq",
            MovementValue: s.waitNTrade?.MovementValue ?? "0",
          };
        });
        break;
      case "Premium Difference":
        if (checked) {
          // Get existing values to populate modal
          const scripts = strategyScripts || [];
          const firstScript = scripts[0] || {};
          const longs = firstScript.LongEquationoptionStrikeList || [];
          const currentStrike = longs[activeLegIndex] || {};

          // Initialize temp value with existing value
          setPremiumDiffTempValue(
            currentStrike.PriceDiffrenceConstrantValue || "0"
          );

          // Open modal for value input
          setShowPremiumDiffModal(true);
        } else {
          updateFirstStrike((s) => {
            s.IsPriceDiffrenceConstrant = false;
            s.PriceDiffrenceConstrantValue = "0";
          });
        }
        break;
      case "Re Entry/Execute":
        if (checked) {
          // Get existing values to populate modal
          const scripts = strategyScripts || [];
          const firstScript = scripts[0] || {};
          const longs = firstScript.LongEquationoptionStrikeList || [];
          const currentStrike = longs[activeLegIndex] || {};

          // Initialize temp data with existing values
          setReEntryTempData({
            executionType:
              currentStrike.reEntry?.RentryType === "RENC"
                ? "Combined"
                : currentStrike.reEntry?.RentryType === "REX"
                ? "Exit"
                : "Leg Wise",
            cycles: currentStrike.reEntry?.TradeCycle || "1",
            actionType: currentStrike.reEntry?.RentryActionTypeId || "ON_CLOSE",
          });

          // Show modal to configure Re-Entry/Execute
          setShowReEntryModal(true);
        } else {
          // Directly disable when unchecking
          updateFirstStrike((s) => {
            s.reEntry = {
              ...(s.reEntry || {}),
              isRentry: false,
              RentryType: "REN",
              TradeCycle: "0",
              RentryActionTypeId: "ON_CLOSE",
            };
          });
          const currentAf = getValues("AdvanceFeatures") || {};
          setValue(
            "AdvanceFeatures",
            {
              ...currentAf,
              "Re Entry/Execute": false,
            },
            { shouldDirty: true }
          );
        }
        break;
      case "Trail SL":
        if (checked) {
          // Get existing values to populate modal
          const scripts = strategyScripts || [];
          const firstScript = scripts[0] || {};
          const longs = firstScript.LongEquationoptionStrikeList || [];
          const currentStrike = longs[activeLegIndex] || {};

          // Initialize temp data with existing values
          setTrailSlTempData({
            trailingType:
              currentStrike.TrailingSL?.TrailingType === "tslpt" ? "Pt" : "%",
            priceMovement:
              currentStrike.TrailingSL?.InstrumentMovementValue || "0",
            trailingValue: currentStrike.TrailingSL?.TrailingValue || "0",
          });

          // Show modal to configure Trail SL
          setShowTrailSlModal(true);
        } else {
          // Directly disable when unchecking
          updateFirstStrike((s) => {
            s.isTrailSL = false;
            s.TrailingSL = {
              TrailingType: "tslpr",
              InstrumentMovementValue: "0",
              TrailingValue: "0",
            };
          });
          const currentAf = getValues("AdvanceFeatures") || {};
          setValue(
            "AdvanceFeatures",
            {
              ...currentAf,
              "Trail SL": false,
            },
            { shouldDirty: true }
          );
        }
        break;
      default:
        break;
    }
  };

  // Premium Difference Modal state & handler
  const [showPremiumDiffModal, setShowPremiumDiffModal] = useState(false);
  const [premiumDiffTempValue, setPremiumDiffTempValue] = useState("0");

  // Re-Entry/Execute Modal state & handler
  const [showReEntryModal, setShowReEntryModal] = useState(false);
  const [reEntryTempData, setReEntryTempData] = useState({
    executionType: "Combined",
    cycles: "1",
    actionType: "ON_CLOSE",
  });

  // Trail SL Modal state & handler
  const [showTrailSlModal, setShowTrailSlModal] = useState(false);
  const [trailSlTempData, setTrailSlTempData] = useState({
    trailingType: "%",
    priceMovement: "0",
    trailingValue: "0",
  });

  const savePremiumDifference = () => {
    updateFirstStrike((s) => {
      s.IsPriceDiffrenceConstrant = Number(premiumDiffTempValue) > 0;
      s.PriceDiffrenceConstrantValue =
        Number(premiumDiffTempValue) > 0 ? premiumDiffTempValue : "0";
    });
    setShowPremiumDiffModal(false);
    if (Number(premiumDiffTempValue) === 0) {
      setAdvState((prev) => ({ ...prev, "Premium Difference": false }));
    }
    const currentAf = getValues("AdvanceFeatures") || {};
    setValue(
      "AdvanceFeatures",
      {
        ...currentAf,
        "Premium Difference": Number(premiumDiffTempValue) > 0,
        PremiumDifferenceValue: premiumDiffTempValue,
      },
      { shouldDirty: true }
    );
  };

  const saveReEntryExecute = (data) => {
    const rentryTypeMap = {
      Combined: "RENC",
      "Leg Wise": "REN",
      Exit: "REX",
    };

    updateFirstStrike((s) => {
      s.reEntry = {
        ...(s.reEntry || {}),
        isRentry: true,
        RentryType: rentryTypeMap[data.executionType] || "REN",
        TradeCycle: data.cycles,
        RentryActionTypeId: data.actionType || "ON_CLOSE",
      };
    });
    setAdvState((prev) => ({ ...prev, "Re Entry/Execute": true }));
    const currentAf = getValues("AdvanceFeatures") || {};
    setValue(
      "AdvanceFeatures",
      {
        ...currentAf,
        "Re Entry/Execute": true,
        ReEntryExecutionType: data.executionType,
        ReEntryCycles: data.cycles,
        ReEntryActionType: data.actionType,
      },
      { shouldDirty: true }
    );
    setReEntryTempData(data);
  };

  const saveTrailStopLoss = (data) => {
    updateFirstStrike((s) => {
      s.isTrailSL = true;
      s.TrailingSL = {
        TrailingType: data.trailingType === "%" ? "tslpr" : "tslpt",
        InstrumentMovementValue: data.priceMovement,
        TrailingValue: data.trailingValue,
      };
    });
    setAdvState((prev) => ({ ...prev, "Trail SL": true }));
    const currentAf = getValues("AdvanceFeatures") || {};
    setValue(
      "AdvanceFeatures",
      {
        ...currentAf,
        "Trail SL": true,
        TrailSlType: data.trailingType,
        TrailSlPriceMovement: data.priceMovement,
        TrailSlTrailingValue: data.trailingValue,
      },
      { shouldDirty: true }
    );
    setTrailSlTempData(data);
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
      {/* Show Risk Management for all strategies except 'price' */}
      {selectedStrategyTypes?.[0] !== "price" && (
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
              type="number"
              defaultValue={getValues("ExitWhenTotalProfit") || ""}
              placeholder="Exit When Over All Profit In Amount (INR)"
              onChange={(e) =>
                setValue("ExitWhenTotalProfit", Number(e.target.value) || 0, {
                  shouldDirty: true,
                })
              }
              className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
            />
            <input
              type="number"
              defaultValue={getValues("ExitWhenTotalLoss") || ""}
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
          {/* Additional fields for indicator-based equity strategies */}
          {isIndicatorEquityMode && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <input
                  type="number"
                  value={targetOnEachScript}
                  placeholder="Target on each script"
                  onChange={(e) => setTargetOnEachScript(e.target.value)}
                  className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <input
                  type="number"
                  value={stopLossOnEachScript}
                  placeholder="Stop Loss on each script"
                  onChange={(e) => setStopLossOnEachScript(e.target.value)}
                  className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                />
                <div className="flex-1 min-w-[160px]">
                  <label className="text-gray-500 block text-xs mb-1 dark:text-gray-400">
                    Target/SL Type
                  </label>
                  <select
                    value={targetSlType}
                    onChange={(e) => setTargetSlType(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                  >
                    <option value="Percentage(%)">Percentage(%)</option>
                    <option value="Points">Points</option>
                  </select>
                </div>
              </div>
            </div>
          )}
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
                {advanceOptions.map((opt) => {
                  const disabled = isDisabledAdvance(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex items-center space-x-2 col-span-1 text-gray-700 dark:text-gray-300 ${
                        disabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!advState[opt]}
                        disabled={disabled}
                        onChange={(e) => onToggleAdvance(opt, e.target.checked)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="p-4 border rounded-2xl dark:bg-[#15171C] dark:border-[#1E2027]">
            <h2 className="font-semibold text-lg text-black dark:text-white">
              Strategy Name
            </h2>
            <input
              type="text"
              defaultValue={getValues("StrategyName") || ""}
              placeholder="Enter your strategy name here"
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
            defaultValue={getValues("StrategyName") || ""}
            placeholder="Enter your strategy name here"
            onChange={(e) =>
              setValue("StrategyName", e.target.value, { shouldDirty: true })
            }
            className="mt-3 bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 w-full dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
          />
        </div>
      )}
      {showPremiumDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#15171C] rounded-xl p-6 w-[90%] max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Premium Difference
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Trade When Premium Difference &lt;=
            </p>
            <input
              type="number"
              value={premiumDiffTempValue}
              onChange={(e) =>
                setPremiumDiffTempValue(
                  Math.max(0, Number(e.target.value) || 0)
                )
              }
              className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
              placeholder="Enter value"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPremiumDiffModal(false);
                  // if user cancels without value, also uncheck
                  if (premiumDiffTempValue === 0) {
                    setAdvState((prev) => ({
                      ...prev,
                      "Premium Difference": false,
                    }));
                    updateFirstStrike((s) => {
                      s.IsPriceDiffrenceConstrant = false;
                      s.PriceDiffrenceConstrantValue = 0;
                    });
                  }
                }}
                className="px-4 py-2 rounded-lg border text-sm dark:border-[#333] dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePremiumDifference}
                className="px-4 py-2 rounded-lg bg-[#0096FF] text-white text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-Entry/Execute Modal */}
      <ReEntryExecuteModal
        isOpen={showReEntryModal}
        onClose={() => {
          setShowReEntryModal(false);
          // Uncheck the checkbox if user cancels
          setAdvState((prev) => ({ ...prev, "Re Entry/Execute": false }));
        }}
        onSave={saveReEntryExecute}
        initialData={reEntryTempData}
      />

      {/* Trail Stop Loss Modal */}
      <TrailStopLossModal
        isOpen={showTrailSlModal}
        onClose={() => {
          setShowTrailSlModal(false);
          // Uncheck the checkbox if user cancels
          setAdvState((prev) => ({ ...prev, "Trail SL": false }));
        }}
        onSave={saveTrailStopLoss}
        initialData={trailSlTempData}
      />
    </div>
  );
};

export default RiskAndAdvance;
