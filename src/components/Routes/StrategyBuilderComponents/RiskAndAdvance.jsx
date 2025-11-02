import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { infoIcon } from "../../../assets";
import ReEntryExecuteModal from "./ReEntryExecuteModal";
import TrailStopLossModal from "./TrailStopLossModal";
import React from "react";
import { useStrategyBuilderStore } from "../../../stores/strategyBuilderStore";
import ComingSoonOverlay from "../../common/ComingSoonOverlay";

const RiskAndAdvance = ({ selectedStrategyTypes, comingSoon = false }) => {
  const { setValue, getValues, watch } = useFormContext();
  // Select stable store actions individually to avoid unnecessary rerenders
  const setLegAdvanceFeature = useStrategyBuilderStore(
    (s) => s.setLegAdvanceFeature
  );
  const getLegAdvanceFeatures = useStrategyBuilderStore(
    (s) => s.getLegAdvanceFeatures
  );
  const tradeStopTimeValue = watch("TradeStopTime") || "15:15";
  const autoSquareOffTimeValue = watch("AutoSquareOffTime") || "15:15";
  const noTradeAfter = autoSquareOffTimeValue;

  // Watch reactive values to avoid infinite loops
  const strategyScripts = watch("StrategyScriptList");
  const activeLegIndex = watch("ActiveLegIndex");

  // Check if equity instruments are selected in indicator-based mode
  const isIndicatorEquityMode =
    selectedStrategyTypes?.[0] === "indicator" &&
    getValues("StrategySegmentType") === "Equity";

  const targetSlTypeRaw = watch("TargetSlType");
  const tpSlTypeRaw = watch("TpSLType");
  const targetSlType = targetSlTypeRaw || "Percentage(%)";
  const rawTargetOnEachScript = watch("TargetOnEachScript");
  const rawStopLossOnEachScript = watch("StopLossOnEachScript");
  const targetOnEachScript =
    rawTargetOnEachScript === null || rawTargetOnEachScript === undefined
      ? ""
      : String(rawTargetOnEachScript);
  const stopLossOnEachScript =
    rawStopLossOnEachScript === null || rawStopLossOnEachScript === undefined
      ? ""
      : String(rawStopLossOnEachScript);

  useEffect(() => {
    if (!isIndicatorEquityMode) return;

    const numericTpSl = Number(tpSlTypeRaw);

    if (Number.isNaN(numericTpSl)) {
      setValue("TpSLType", 0, { shouldDirty: false });
      setValue("TargetSlType", "Percentage(%)", { shouldDirty: false });
      return;
    }

    const expectedLabel = numericTpSl === 1 ? "Points" : "Percentage(%)";
    if (targetSlTypeRaw !== expectedLabel) {
      setValue("TargetSlType", expectedLabel, { shouldDirty: false });
    }
  }, [isIndicatorEquityMode, targetSlTypeRaw, tpSlTypeRaw, setValue]);

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
    // Rule 1: Move SL to Cost active -> disable all except Premium Difference (Exit All also disabled)
    if (
      advState["Move SL to Cost"] &&
      label !== "Premium Difference" &&
      label !== "Move SL to Cost"
    ) {
      return true;
    }
    // Rule 2: Exit All disables Re Entry/Execute and Move SL to Cost
    if (advState["Exit All on SL/Tgt"]) {
      if (label === "Re Entry/Execute" || label === "Move SL to Cost") {
        return true;
      }
    }
    // Rule 3: Wait & Trade disables Move SL to Cost
    if (advState["Wait & Trade"] && label === "Move SL to Cost") {
      return true;
    }
    if (advState["Re Entry/Execute"] && label === "Exit All on SL/Tgt") {
      return true;
    }
    if (advState["Trail SL"] && label === "Pre Punch SL") {
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
          "Exit All on SL/Tgt": false, // ✅ Disable Exit All when Move SL to Cost is enabled
          "Re Entry/Execute": prev["Re Entry/Execute"],
          "Premium Difference": prev["Premium Difference"],
        }));
      }
      if (label === "Exit All on SL/Tgt") {
        // exit all -> disable re entry and Move SL to Cost
        setAdvState((prev) => ({
          ...prev,
          "Re Entry/Execute": false,
          "Move SL to Cost": false, // ✅ Disable Move SL to Cost when Exit All is enabled
        }));
      }
      if (label === "Wait & Trade") {
        // wait & trade disables move SL to cost
        setAdvState((prev) => ({ ...prev, "Move SL to Cost": false }));
      }
      if (label === "Re Entry/Execute") {
        setAdvState((prev) => ({
          ...prev,
          "Exit All on SL/Tgt": false,
        }));
      }
      if (label === "Trail SL") {
        setAdvState((prev) => ({
          ...prev,
          "Pre Punch SL": false,
        }));
      }
    }
    // Update a consolidated AdvanceFeatures map in form for simpler consumption in Leg1
    const currentAf = getValues("AdvanceFeatures") || {};
    const nextAf = { ...currentAf, [label]: checked };
    if (label === "Re Entry/Execute" && checked) {
      nextAf["Exit All on SL/Tgt"] = false;
    }
    if (label === "Trail SL" && checked) {
      nextAf["Pre Punch SL"] = false;
    }
    setValue("AdvanceFeatures", nextAf, { shouldDirty: true });

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
        // Update per-leg store
        setLegAdvanceFeature(activeLegIndex, "waitTradeEnabled", !!checked);
        break;
      case "Premium Difference":
        if (checked) {
          // Get existing values to populate modal - from per-leg store
          const legFeatures = getLegAdvanceFeatures(activeLegIndex);
          const scripts = strategyScripts || [];
          const firstScript = scripts[0] || {};
          const longs = firstScript.LongEquationoptionStrikeList || [];
          const currentStrike = longs[activeLegIndex] || {};

          const currentPremValue =
            legFeatures.premiumDiffValue ||
            currentStrike.PriceDiffrenceConstrantValue ||
            "0";

          // Initialize temp value with existing value
          setPremiumDiffTempValue(currentPremValue);

          // Open modal for value input
          setShowPremiumDiffModal(true);
        } else {
          updateFirstStrike((s) => {
            s.IsPriceDiffrenceConstrant = false;
            s.PriceDiffrenceConstrantValue = "0";
          });
          // Clear per-leg store
          setLegAdvanceFeature(activeLegIndex, "premiumDiffEnabled", false);
          setLegAdvanceFeature(activeLegIndex, "premiumDiffValue", 0);
        }
        break;
      case "Re Entry/Execute":
        if (checked) {
          // Get existing values from per-leg store or strike data
          const legFeatures = getLegAdvanceFeatures(activeLegIndex);
          const scripts = strategyScripts || [];
          const firstScript = scripts[0] || {};
          const longs = firstScript.LongEquationoptionStrikeList || [];
          const currentStrike = longs[activeLegIndex] || {};

          // Map backend RentryType to UI executionType
          const rentryTypeToUI = (rentryType) => {
            const map = {
              REX: "ReExecute",
              REN: "ReEntry On Close",
              RENC: "ReEntry On Cost",
            };
            return map[rentryType] || "ReExecute";
          };

          // Initialize temp data with existing values (prefer leg store)
          setReEntryTempData({
            executionType:
              legFeatures.reEntryExecutionType ||
              rentryTypeToUI(currentStrike.reEntry?.RentryType),
            cycles:
              legFeatures.reEntryCycles ||
              currentStrike.reEntry?.TradeCycle ||
              "1",
            actionType: currentStrike.reEntry?.RentryActionTypeId || "IMMDT",
          });

          // Show modal to configure Re-Entry/Execute
          setShowReEntryModal(true);

          // Ensure conflicting exit-all state is cleared
          updateFirstStrike((s) => {
            s.isExitAll = false;
          });
          setValue("SquareOffAllOptionLegOnSl", false, { shouldDirty: true });
        } else {
          // Directly disable when unchecking
          updateFirstStrike((s) => {
            s.reEntry = {
              ...(s.reEntry || {}),
              isRentry: false,
              RentryType: "REX",
              TradeCycle: "0",
              RentryActionTypeId: "IMMDT",
            };
          });
          // Clear per-leg store
          setLegAdvanceFeature(activeLegIndex, "reEntryEnabled", false);
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
          // Get existing values from per-leg store or strike data
          const legFeatures = getLegAdvanceFeatures(activeLegIndex);
          const scripts = strategyScripts || [];
          const firstScript = scripts[0] || {};
          const longs = firstScript.LongEquationoptionStrikeList || [];
          const currentStrike = longs[activeLegIndex] || {};

          // Initialize temp data with existing values (prefer leg store)
          setTrailSlTempData({
            trailingType:
              legFeatures.trailSlType ||
              (currentStrike.TrailingSL?.TrailingType === "tslpt" ? "Pt" : "%"),
            priceMovement:
              legFeatures.trailSlPriceMovement ||
              currentStrike.TrailingSL?.InstrumentMovementValue ||
              "0",
            trailingValue:
              legFeatures.trailSlTrailingValue ||
              currentStrike.TrailingSL?.TrailingValue ||
              "0",
          });

          // Show modal to configure Trail SL
          setShowTrailSlModal(true);

          // Ensure Pre Punch SL is cleared when Trail SL is enabled
          updateFirstStrike((s) => {
            s.isPrePunchSL = false;
          });
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
          // Clear per-leg store
          setLegAdvanceFeature(activeLegIndex, "trailSlEnabled", false);
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

    // Update per-leg store
    const isEnabled = Number(premiumDiffTempValue) > 0;
    setLegAdvanceFeature(activeLegIndex, "premiumDiffEnabled", isEnabled);
    setLegAdvanceFeature(
      activeLegIndex,
      "premiumDiffValue",
      Number(premiumDiffTempValue)
    );

    if (!isEnabled) {
      setAdvState((prev) => ({ ...prev, "Premium Difference": false }));
    }
    const currentAf = getValues("AdvanceFeatures") || {};
    setValue(
      "AdvanceFeatures",
      {
        ...currentAf,
        "Premium Difference": isEnabled,
        PremiumDifferenceValue: premiumDiffTempValue,
      },
      { shouldDirty: true }
    );
  };

  const saveReEntryExecute = (data) => {
    // Map UI executionType to backend RentryType
    const rentryTypeMap = {
      ReExecute: "REX",
      "ReEntry On Close": "REN",
      "ReEntry On Cost": "RENC",
    };

    // RentryActionTypeId can only be "ON_CLOSE" or "IMMDT"
    // For ReEntry On Close, use ON_CLOSE; otherwise use IMMDT
    let finalActionType = data.actionType;
    if (data.executionType === "ReEntry On Close") {
      finalActionType = "ON_CLOSE";
    } else {
      // For ReEntry On Cost and ReExecute, use IMMDT
      finalActionType = "IMMDT";
    }

    updateFirstStrike((s) => {
      s.reEntry = {
        ...(s.reEntry || {}),
        isRentry: true,
        RentryType: rentryTypeMap[data.executionType] || "REX",
        TradeCycle: data.cycles,
        RentryActionTypeId: finalActionType,
      };
    });

    // Update per-leg store
    setLegAdvanceFeature(activeLegIndex, "reEntryEnabled", true);
    setLegAdvanceFeature(
      activeLegIndex,
      "reEntryExecutionType",
      data.executionType
    );
    setLegAdvanceFeature(activeLegIndex, "reEntryCycles", Number(data.cycles));
    setLegAdvanceFeature(activeLegIndex, "reEntryActionType", finalActionType);

    setAdvState((prev) => ({ ...prev, "Re Entry/Execute": true }));
    const currentAf = getValues("AdvanceFeatures") || {};
    setValue(
      "AdvanceFeatures",
      {
        ...currentAf,
        "Re Entry/Execute": true,
        ReEntryExecutionType: data.executionType,
        ReEntryCycles: data.cycles,
        ReEntryActionType: finalActionType,
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

    // Update per-leg store
    setLegAdvanceFeature(activeLegIndex, "trailSlEnabled", true);
    setLegAdvanceFeature(activeLegIndex, "trailSlType", data.trailingType);
    setLegAdvanceFeature(
      activeLegIndex,
      "trailSlPriceMovement",
      Number(data.priceMovement)
    );
    setLegAdvanceFeature(
      activeLegIndex,
      "trailSlTrailingValue",
      Number(data.trailingValue)
    );

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
    <div className="relative">
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
          <div className="p-4 border rounded-2xl space-y-4 bg-white dark:bg-[#131419] dark:border-[#1E2027]">
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
                    value={watch("MaxTrade") || ""}
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
                  onChange={(e) => {
                    setValue("TradeStopTime", e.target.value, {
                      shouldDirty: true,
                    });
                    setValue("AutoSquareOffTime", e.target.value, {
                      shouldDirty: true,
                    });
                  }}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setValue("TargetOnEachScript", "", {
                          shouldDirty: true,
                        });
                        return;
                      }
                      const num = Number(val);
                      if (!Number.isNaN(num)) {
                        setValue("TargetOnEachScript", num, {
                          shouldDirty: true,
                        });
                      }
                    }}
                    className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                  />
                  <input
                    type="number"
                    value={stopLossOnEachScript}
                    placeholder="Stop Loss on each script"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setValue("StopLossOnEachScript", "", {
                          shouldDirty: true,
                        });
                        return;
                      }
                      const num = Number(val);
                      if (!Number.isNaN(num)) {
                        setValue("StopLossOnEachScript", num, {
                          shouldDirty: true,
                        });
                      }
                    }}
                    className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                  />
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-gray-500 block text-xs mb-1 dark:text-gray-400">
                      Target/SL Type
                    </label>
                    <select
                      value={targetSlType}
                      onChange={(e) => {
                        const v = e.target.value;
                        setValue("TargetSlType", v, { shouldDirty: true });
                        // Map: % => 0, pts => 1
                        setValue("TpSLType", v === "Percentage(%)" ? 0 : 1, {
                          shouldDirty: true,
                        });
                      }}
                      className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                    >
                      <option value="Percentage(%)">Percentage(%)</option>
                      <option value="Points">Points</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-white">
                Profit Trailing
              </p>
              <div className="flex flex-wrap w-full gap-4 text-sm">
                {trailingOptions.map((opt, idx) => (
                  <label
                    key={opt}
                    className="flex items-center space-x-2 flex-1 min-w-[150px] text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="radio"
                      name="profitTrailingLeft"
                      checked={(watch("TrailProfitType") || 0) === idx}
                      onChange={() =>
                        setValue("TrailProfitType", idx, { shouldDirty: true })
                      }
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {/* Conditional trailing fields for non-price section */}
              {(() => {
                const t = watch("TrailProfitType") || 0;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    {(t === 1 || t === 3) && (
                      <>
                        <input
                          type="number"
                          defaultValue={getValues("LockProfit") || ""}
                          placeholder="If profit reaches"
                          onChange={(e) =>
                            setValue(
                              "LockProfit",
                              Number(e.target.value) || 0,
                              {
                                shouldDirty: true,
                              }
                            )
                          }
                          className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                        />
                        <input
                          type="number"
                          defaultValue={getValues("LockProfitAt") || ""}
                          placeholder="Lock profit at"
                          onChange={(e) =>
                            setValue(
                              "LockProfitAt",
                              Number(e.target.value) || 0,
                              {
                                shouldDirty: true,
                              }
                            )
                          }
                          className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                        />
                      </>
                    )}
                    {(t === 2 || t === 3) && (
                      <>
                        <input
                          type="number"
                          defaultValue={getValues("ProfitTranches") || ""}
                          placeholder="On every increase of"
                          onChange={(e) =>
                            setValue(
                              "ProfitTranches",
                              Number(e.target.value) || 0,
                              {
                                shouldDirty: true,
                              }
                            )
                          }
                          className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                        />
                        <input
                          type="number"
                          defaultValue={getValues("TrailProfitBy") || ""}
                          placeholder="Trail profit by"
                          onChange={(e) =>
                            setValue(
                              "TrailProfitBy",
                              Number(e.target.value) || 0,
                              {
                                shouldDirty: true,
                              }
                            )
                          }
                          className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                        />
                      </>
                    )}
                  </div>
                );
              })()}
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
              <div className="p-4 border rounded-2xl space-y-4 bg-white dark:bg-[#131419] dark:border-[#1E2027]">
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
                      setValue(
                        "ExitWhenTotalLoss",
                        Number(e.target.value) || 0,
                        {
                          shouldDirty: true,
                        }
                      )
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
                      onChange={(e) => {
                        setValue("TradeStopTime", e.target.value, {
                          shouldDirty: true,
                        });
                        setValue("AutoSquareOffTime", e.target.value, {
                          shouldDirty: true,
                        });
                      }}
                      className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-white">
                    Profit Trailing
                  </p>
                  <div className="flex flex-wrap w-full gap-4 text-sm">
                    {trailingOptions.map((opt, idx) => (
                      <label
                        key={opt}
                        className="flex items-center space-x-2 flex-1 min-w-[150px] text-gray-700 dark:text-gray-300"
                      >
                        <input
                          type="radio"
                          name="profitTrailingRight"
                          checked={(watch("TrailProfitType") || 0) === idx}
                          onChange={() =>
                            setValue("TrailProfitType", idx, {
                              shouldDirty: true,
                            })
                          }
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  {/* Conditional trailing fields for price section */}
                  {(() => {
                    const t = watch("TrailProfitType") || 0;
                    return (
                      <div className="grid grid-cols-2 gap-3">
                        {(t === 1 || t === 3) && (
                          <>
                            <input
                              type="number"
                              placeholder="If profit reaches"
                              defaultValue={getValues("LockProfit") || ""}
                              onChange={(e) =>
                                setValue(
                                  "LockProfit",
                                  Number(e.target.value) || 0,
                                  {
                                    shouldDirty: true,
                                  }
                                )
                              }
                              className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                            />
                            <input
                              type="number"
                              placeholder="Lock profit at"
                              defaultValue={getValues("LockProfitAt") || ""}
                              onChange={(e) =>
                                setValue(
                                  "LockProfitAt",
                                  Number(e.target.value) || 0,
                                  {
                                    shouldDirty: true,
                                  }
                                )
                              }
                              className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                            />
                          </>
                        )}
                        {(t === 2 || t === 3) && (
                          <>
                            <input
                              type="number"
                              placeholder="On every increase of"
                              defaultValue={getValues("ProfitTranches") || ""}
                              onChange={(e) =>
                                setValue(
                                  "ProfitTranches",
                                  Number(e.target.value) || 0,
                                  {
                                    shouldDirty: true,
                                  }
                                )
                              }
                              className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                            />
                            <input
                              type="number"
                              placeholder="Trail profit by"
                              defaultValue={getValues("TrailProfitBy") || ""}
                              onChange={(e) =>
                                setValue(
                                  "TrailProfitBy",
                                  Number(e.target.value) || 0,
                                  {
                                    shouldDirty: true,
                                  }
                                )
                              }
                              className="bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                            />
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
            {/* Advance Features hidden for 'price' strategy, Strategy Name always shown */}
            {selectedStrategyTypes?.[0] !== "price" && (
              <div className="p-4 border rounded-2xl space-y-4 bg-white dark:bg-[#131419] dark:border-[#1E2027]">
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
                          onChange={(e) =>
                            onToggleAdvance(opt, e.target.checked)
                          }
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="p-4 border rounded-2xl bg-white dark:bg-[#131419] dark:border-[#1E2027]">
              <h2 className="font-semibold text-lg text-black dark:text-white">
                Strategy Name
              </h2>
              <input
                type="text"
                defaultValue={getValues("StrategyName") || ""}
                placeholder="Enter your strategy name here"
                onChange={(e) =>
                  setValue("StrategyName", e.target.value, {
                    shouldDirty: true,
                  })
                }
                className="mt-3 bg-blue-50 text-sm px-4 py-3 rounded-xl placeholder-gray-500 text-gray-700 w-full dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>
        )}
        {selectedStrategyTypes?.[0] === "indicator" && (
          <div className="p-4 border rounded-2xl bg-white dark:bg-[#131419] dark:border-[#1E2027]">
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
                  className="px-4 py-2 rounded-lg bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white text-sm transition"
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
      {(comingSoon || selectedStrategyTypes?.[0] === "price") && (
        <ComingSoonOverlay />
      )}
    </div>
  );
};

export default RiskAndAdvance;
