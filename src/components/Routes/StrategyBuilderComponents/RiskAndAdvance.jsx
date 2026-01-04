import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { infoIcon } from "../../../assets";
import ReEntryExecuteModal from "./ReEntryExecuteModal";
import TrailStopLossModal from "./TrailStopLossModal";
import React from "react";
import ComingSoonOverlay from "../../common/ComingSoonOverlay";
import PrimaryButton from "../../common/PrimaryButton";
import { useStrategyBuilderStore } from "../../../stores/strategyBuilderStore";

const RiskAndAdvance = ({ selectedStrategyTypes, comingSoon = false }) => {
  const { setValue, getValues, watch } = useFormContext();
  const updatePayload = useStrategyBuilderStore((s) => s.updatePayload);
  const tradeStopTimeValue = watch("TradeStopTime") || "15:15";
  const autoSquareOffTimeValue = watch("AutoSquareOffTime") || "15:15";
  const noTradeAfter = tradeStopTimeValue;

  // Watch reactive values to avoid infinite loops
  const strategyScripts = watch("StrategyScriptList");
  const activeLegIndex = watch("ActiveLegIndex") || 0;
  const advanceFeatures = watch("AdvanceFeatures") || {};

  // Check if equity instruments are selected in indicator-based mode
  const isIndicatorEquityMode =
    selectedStrategyTypes?.[0] === "indicator" &&
    getValues("StrategySegmentType") === "Equity";

  const tpSlTypeRaw = watch("TpSLType");
  const targetSlType = Number(tpSlTypeRaw) === 1 ? "Points" : "Percentage(%)";
  const rawTarget = watch("Target");
  const rawStopLoss = watch("SL");
  const targetOnEachScript =
    rawTarget === null || rawTarget === undefined ? "" : String(rawTarget);
  const stopLossOnEachScript =
    rawStopLoss === null || rawStopLoss === undefined
      ? ""
      : String(rawStopLoss);

  useEffect(() => {
    if (!isIndicatorEquityMode) return;

    const numericTpSl = Number(tpSlTypeRaw);

    if (Number.isNaN(numericTpSl)) {
      setValue("TpSLType", 0, { shouldDirty: false });
      return;
    }
  }, [isIndicatorEquityMode, tpSlTypeRaw, setValue]);

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

  // Wait & Trade modal state
  const [showWaitTradeModal, setShowWaitTradeModal] = useState(false);
  const [waitTradeTempData, setWaitTradeTempData] = useState({
    type: "% ↑",
    movement: "",
  });

  // Reset advance toggles when strategy type changes
  useEffect(() => {
    setAdvState({
      "Move SL to Cost": false,
      "Exit All on SL/Tgt": false,
      "Pre Punch SL": false,
      "Wait & Trade": false,
      "Premium Difference": false,
      "Re Entry/Execute": false,
      "Trail SL": false,
    });
    setWaitTradeTempData({ type: "% ↑", movement: "" });
    setPremiumDiffTempValue("");
    setReEntryTempData({
      executionType: "ReExecute",
      cycles: "1",
      actionType: "IMMDT",
    });
    setTrailSlTempData({
      trailingType: "%",
      priceMovement: "0",
      trailingValue: "0",
    });
    setValue("AdvanceFeatures", {}, { shouldDirty: true });
  }, [selectedStrategyTypes?.[0], setValue]);

  // Keep checkboxes in sync with shared toggle flags (not per-leg values)
  useEffect(() => {
    setAdvState((prev) => ({
      ...prev,
      "Move SL to Cost": !!advanceFeatures["Move SL to Cost"],
      "Exit All on SL/Tgt": !!advanceFeatures["Exit All on SL/Tgt"],
      "Pre Punch SL": !!advanceFeatures["Pre Punch SL"],
      "Wait & Trade": !!advanceFeatures["Wait & Trade"],
      "Premium Difference": !!advanceFeatures["Premium Difference"],
      "Re Entry/Execute": !!advanceFeatures["Re Entry/Execute"],
      "Trail SL": !!advanceFeatures["Trail SL"],
    }));
  }, [advanceFeatures]);

  // If AdvanceFeatures is empty but strikes contain flags (edit mode), sync from strikes
  // This should only run when AdvanceFeatures is completely empty (initial load/edit)
  // to avoid overwriting user's checkbox selections when adding/switching legs
  useEffect(() => {
    const scripts = Array.isArray(strategyScripts) ? strategyScripts : [];
    if (!scripts.length) return;

    // Only sync if AdvanceFeatures is completely empty or undefined (initial state)
    const hasAnyFeatureEnabled = advanceOptions.some(
      (opt) => advanceFeatures[opt] === true
    );

    // If user has already enabled any feature, don't override with strike data
    if (hasAnyFeatureEnabled) return;

    const first = scripts[0] || {};
    const pickStrike = (list) =>
      Array.isArray(list) && list.length
        ? list[Math.min(activeLegIndex, list.length - 1)] || list[0]
        : null;

    const longStrike = pickStrike(first.LongEquationoptionStrikeList);
    const shortStrike = pickStrike(first.ShortEquationoptionStrikeList);
    const strike = longStrike || shortStrike || {};

    const premiumEnabled =
      strike?.IsPriceDiffrenceConstrant &&
      Number(strike?.PriceDiffrenceConstrantValue) > 0;

    const derived = {
      "Move SL to Cost": !!strike?.IsMoveSLCTC,
      "Exit All on SL/Tgt": !!(
        advanceFeatures?.["Exit All on SL/Tgt"] || strike?.isExitAll
      ),
      "Pre Punch SL": !!strike?.isPrePunchSL,
      "Wait & Trade": !!strike?.waitNTrade?.isWaitnTrade,
      "Premium Difference": !!premiumEnabled,
      "Re Entry/Execute": !!strike?.reEntry?.isRentry,
      "Trail SL": !!strike?.isTrailSL,
    };

    const needsSync = advanceOptions.some(
      (opt) => !!derived[opt] !== !!advanceFeatures[opt]
    );

    if (needsSync) {
      setAdvState((prev) => ({ ...prev, ...derived }));
      const nextAf = { ...advanceFeatures, ...derived };
      setValue("AdvanceFeatures", nextAf, { shouldDirty: false });
    }
  }, [strategyScripts, activeLegIndex, advanceFeatures, setValue]);

  const isDisabledAdvance = (label) => {
    // Rule 1: Move SL to Cost active -> disable all except Premium Difference (Exit All also disabled)
    if (
      advState["Move SL to Cost"] &&
      label !== "Premium Difference" &&
      label !== "Move SL to Cost" &&
      label !== "Re Entry/Execute"
    ) {
      return true;
    }
    // Rule 2: Exit All disables Re Entry/Execute and Move SL to Cost
    if (advState["Exit All on SL/Tgt"]) {
      if (label === "Re Entry/Execute" || label === "Move SL to Cost") {
        return true;
      }
    }
    // Rule 2b: Re Entry/Execute disables Move SL to Cost
    if (advState["Re Entry/Execute"] && label === "Move SL to Cost") {
      return true;
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

  const updateActiveStrikes = (updater) => {
    const scripts = strategyScripts || [];
    if (!Array.isArray(scripts) || scripts.length === 0) return;

    const nextScripts = scripts.map((script) => {
      const longs = Array.isArray(script.LongEquationoptionStrikeList)
        ? [...script.LongEquationoptionStrikeList]
        : [];
      const shorts = Array.isArray(script.ShortEquationoptionStrikeList)
        ? [...script.ShortEquationoptionStrikeList]
        : [];

      // Update active leg only
      if (longs[activeLegIndex]) {
        const copy = { ...longs[activeLegIndex] };
        updater(copy);
        longs[activeLegIndex] = copy;
      }
      if (shorts[activeLegIndex]) {
        const copy = { ...shorts[activeLegIndex] };
        updater(copy);
        shorts[activeLegIndex] = copy;
      }

      return {
        ...script,
        LongEquationoptionStrikeList: longs,
        ShortEquationoptionStrikeList: shorts,
      };
    });

    setValue("StrategyScriptList", nextScripts, { shouldDirty: true });
    updatePayload({ StrategyScriptList: nextScripts });
  };

  // Update all legs globally (used when disabling advance features)
  const updateAllStrikes = (updater) => {
    const scripts = strategyScripts || [];
    if (!Array.isArray(scripts) || scripts.length === 0) return;

    const nextScripts = scripts.map((script) => {
      const longs = Array.isArray(script.LongEquationoptionStrikeList)
        ? script.LongEquationoptionStrikeList.map((strike) => {
            const copy = { ...strike };
            updater(copy);
            return copy;
          })
        : [];
      const shorts = Array.isArray(script.ShortEquationoptionStrikeList)
        ? script.ShortEquationoptionStrikeList.map((strike) => {
            const copy = { ...strike };
            updater(copy);
            return copy;
          })
        : [];

      return {
        ...script,
        LongEquationoptionStrikeList: longs,
        ShortEquationoptionStrikeList: shorts,
      };
    });

    setValue("StrategyScriptList", nextScripts, { shouldDirty: true });
    updatePayload({ StrategyScriptList: nextScripts });
  };

  const setAdvanceFeatureFlags = (updates) => {
    const currentAf = getValues("AdvanceFeatures") || {};
    const nextAf = { ...currentAf, ...updates };
    setValue("AdvanceFeatures", nextAf, { shouldDirty: true });
    setAdvState((prev) => {
      const nextState = { ...prev };
      Object.entries(updates).forEach(([key, val]) => {
        nextState[key] = !!val;
      });
      return nextState;
    });
  };

  const resetAdvanceFeature = (label) => {
    switch (label) {
      case "Move SL to Cost":
        updateAllStrikes((s) => {
          s.IsMoveSLCTC = false;
        });
        break;
      case "Exit All on SL/Tgt":
        setValue("SquareOffAllOptionLegOnSl", false, { shouldDirty: true });
        updateAllStrikes((s) => {
          s.isExitAll = false;
        });
        break;
      case "Pre Punch SL":
        updateAllStrikes((s) => {
          s.isPrePunchSL = false;
        });
        break;
      case "Wait & Trade":
        updateAllStrikes((s) => {
          s.waitNTrade = {
            isWaitnTrade: false,
            isPerPt: "wtpr_+",
            typeId: "wtpr_+",
            MovementValue: "0",
          };
        });
        setWaitTradeTempData({ type: "% ↑", movement: "0" });
        break;
      case "Premium Difference":
        updateAllStrikes((s) => {
          s.IsPriceDiffrenceConstrant = false;
          s.PriceDiffrenceConstrantValue = "0";
        });
        setPremiumDiffTempValue("0");
        break;
      case "Re Entry/Execute":
        updateAllStrikes((s) => {
          s.reEntry = {
            isRentry: false,
            RentryType: "REN",
            TradeCycle: "0",
            RentryActionTypeId: "ON_CLOSE",
          };
        });
        setReEntryTempData({
          executionType: "ReEntry On Close",
          cycles: "1",
          actionType: "ON_CLOSE",
        });
        break;
      case "Trail SL":
        updateAllStrikes((s) => {
          s.isTrailSL = false;
          s.TrailingSL = {
            TrailingType: "tslpr",
            InstrumentMovementValue: "0",
            TrailingValue: "0",
          };
        });
        setTrailSlTempData({
          trailingType: "%",
          priceMovement: "0",
          trailingValue: "0",
        });
        break;
      default:
        break;
    }

    setAdvanceFeatureFlags({ [label]: false });
  };
  const onToggleAdvance = (label, checked) => {
    const modalFeatures = new Set([
      "Wait & Trade",
      "Premium Difference",
      "Re Entry/Execute",
      "Trail SL",
    ]);

    if (!checked) {
      resetAdvanceFeature(label);
      return;
    }

    if (label === "Move SL to Cost") {
      resetAdvanceFeature("Wait & Trade");
      resetAdvanceFeature("Pre Punch SL");
      resetAdvanceFeature("Trail SL");
      resetAdvanceFeature("Exit All on SL/Tgt");
      setAdvanceFeatureFlags({ "Move SL to Cost": true });
      updateActiveStrikes((s) => {
        s.IsMoveSLCTC = true;
      });
      return;
    }

    if (label === "Exit All on SL/Tgt") {
      resetAdvanceFeature("Re Entry/Execute");
      resetAdvanceFeature("Move SL to Cost");
      setAdvanceFeatureFlags({ "Exit All on SL/Tgt": true });
      setValue("SquareOffAllOptionLegOnSl", true, { shouldDirty: true });
      updateActiveStrikes((s) => {
        s.isExitAll = true;
      });
      return;
    }

    if (label === "Pre Punch SL") {
      setAdvanceFeatureFlags({ "Pre Punch SL": true });
      updateActiveStrikes((s) => {
        s.isPrePunchSL = true;
      });
      return;
    }

    if (label === "Wait & Trade") {
      resetAdvanceFeature("Move SL to Cost");
      setAdvanceFeatureFlags({ "Wait & Trade": true });
      const scripts = strategyScripts || [];
      const firstScript = scripts[0] || {};
      const longs = firstScript.LongEquationoptionStrikeList || [];
      const currentStrike = longs[0] || {};
      const wtMapRev = {
        wt_eq: "% ↑",
        "wtpt_+": "pt ↑",
        "wtpt_-": "pt ↓",
        "wtpr_-": "% ↓",
      };
      setWaitTradeTempData({
        type: wtMapRev[currentStrike.waitNTrade?.typeId] || "% ↑",
        movement: currentStrike.waitNTrade?.MovementValue ?? "",
      });
      setShowWaitTradeModal(true);
      return;
    }

    if (label === "Premium Difference") {
      setAdvanceFeatureFlags({ "Premium Difference": true });
      const scripts = strategyScripts || [];
      const firstScript = scripts[0] || {};
      const longs = firstScript.LongEquationoptionStrikeList || [];
      const currentStrike = longs[0] || {};
      const currentPremValue = currentStrike.PriceDiffrenceConstrantValue ?? "";
      setPremiumDiffTempValue(currentPremValue);
      setShowPremiumDiffModal(true);
      return;
    }

    if (label === "Re Entry/Execute") {
      resetAdvanceFeature("Exit All on SL/Tgt");
      resetAdvanceFeature("Move SL to Cost");
      setAdvanceFeatureFlags({ "Re Entry/Execute": true });
      const scripts = strategyScripts || [];
      const firstScript = scripts[0] || {};
      const longs = firstScript.LongEquationoptionStrikeList || [];
      const currentStrike = longs[0] || {};
      const rentryTypeToUI = (rentryType) => {
        const map = {
          REX: "ReExecute",
          REN: "ReEntry On Close",
          RENC: "ReEntry On Cost",
        };
        return map[rentryType] || "ReExecute";
      };
      setReEntryTempData({
        executionType: rentryTypeToUI(currentStrike.reEntry?.RentryType),
        cycles: currentStrike.reEntry?.TradeCycle || "1",
        actionType: currentStrike.reEntry?.RentryActionTypeId || "IMMDT",
      });
      setShowReEntryModal(true);
      updateActiveStrikes((s) => {
        s.isExitAll = false;
        s.IsMoveSLCTC = false;
      });
      setValue("SquareOffAllOptionLegOnSl", false, { shouldDirty: true });
      return;
    }

    if (label === "Trail SL") {
      resetAdvanceFeature("Pre Punch SL");
      setAdvanceFeatureFlags({ "Trail SL": true });
      const scripts = strategyScripts || [];
      const firstScript = scripts[0] || {};
      const longs = firstScript.LongEquationoptionStrikeList || [];
      const currentStrike = longs[0] || {};
      setTrailSlTempData({
        trailingType:
          currentStrike.TrailingSL?.TrailingType === "tslpt" ? "Pt" : "%",
        priceMovement: currentStrike.TrailingSL?.InstrumentMovementValue || "0",
        trailingValue: currentStrike.TrailingSL?.TrailingValue || "0",
      });
      setShowTrailSlModal(true);
      updateActiveStrikes((s) => {
        s.isPrePunchSL = false;
      });
      return;
    }

    if (!modalFeatures.has(label)) {
      setAdvanceFeatureFlags({ [label]: true });
    }
  };

  const saveWaitTrade = () => {
    const mapWaitTradeType = (label) => {
      const meta = {
        "% ↓": { isPerPt: "wtpr_-", typeId: "wtpr_-" },
        "% ↑": { isPerPt: "wt_eq", typeId: "wt_eq" },
        "pt ↑": { isPerPt: "wtpt_+", typeId: "wtpt_+" },
        "pt ↓": { isPerPt: "wtpt_-", typeId: "wtpt_-" },
      };
      return meta[label] || meta["% ↑"];
    };

    const meta = mapWaitTradeType(waitTradeTempData.type);
    const movementVal = String(
      Math.max(0, Number(waitTradeTempData.movement) || 0)
    );

    updateActiveStrikes((s) => {
      s.IsMoveSLCTC = false;
      s.waitNTrade = {
        ...(s.waitNTrade || {}),
        isWaitnTrade: true,
        isPerPt: meta.isPerPt,
        typeId: meta.typeId,
        MovementValue: movementVal,
      };
    });

    setAdvanceFeatureFlags({
      "Wait & Trade": true,
      "Move SL to Cost": false,
    });
    setShowWaitTradeModal(false);
  };

  // Premium Difference Modal state & handler
  const [showPremiumDiffModal, setShowPremiumDiffModal] = useState(false);
  const [premiumDiffTempValue, setPremiumDiffTempValue] = useState("");

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
    updateActiveStrikes((s) => {
      s.IsPriceDiffrenceConstrant = Number(premiumDiffTempValue) > 0;
      s.PriceDiffrenceConstrantValue =
        Number(premiumDiffTempValue) > 0 ? premiumDiffTempValue : "0";
    });
    setShowPremiumDiffModal(false);
    const isEnabled = Number(premiumDiffTempValue) > 0;

    setAdvanceFeatureFlags({ "Premium Difference": isEnabled });
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

    updateActiveStrikes((s) => {
      s.reEntry = {
        ...(s.reEntry || {}),
        isRentry: true,
        RentryType: rentryTypeMap[data.executionType] || "REX",
        TradeCycle: data.cycles,
        RentryActionTypeId: finalActionType,
      };
      s.IsMoveSLCTC = false;
    });
    setAdvanceFeatureFlags({
      "Re Entry/Execute": true,
      "Move SL to Cost": false,
    });
    setReEntryTempData(data);
    setShowReEntryModal(false);
  };

  const saveTrailStopLoss = (data) => {
    updateActiveStrikes((s) => {
      s.isTrailSL = true;
      s.TrailingSL = {
        TrailingType: data.trailingType === "%" ? "tslpr" : "tslpt",
        InstrumentMovementValue: data.priceMovement,
        TrailingValue: data.trailingValue,
      };
    });
    setAdvanceFeatureFlags({ "Trail SL": true, "Pre Punch SL": false });
    setTrailSlTempData(data);
    setShowTrailSlModal(false);
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
                  Control your trading outcomes by setting global limits on
                  losses and profits on the strategy, and automating how gains
                  are protected (trailing).
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <input
                type="number"
                defaultValue={getValues("ExitWhenTotalProfit") || ""}
                placeholder="Exit When Over All Profit In Amount (INR)"
                onChange={(e) =>
                  setValue(
                    "ExitWhenTotalProfit",
                    e.target.value === "" ? "" : Number(e.target.value) || 0,
                    {
                      shouldDirty: true,
                    }
                  )
                }
                className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
              />
              <input
                type="number"
                defaultValue={getValues("ExitWhenTotalLoss") || ""}
                placeholder="Exit When Over All Loss In Amount (INR)"
                onChange={(e) =>
                  setValue(
                    "ExitWhenTotalLoss",
                    e.target.value === "" ? "" : Number(e.target.value) || 0,
                    {
                      shouldDirty: true,
                    }
                  )
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
                      setValue(
                        "MaxTrade",
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value) || 0,
                        {
                          shouldDirty: true,
                        }
                      )
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
                      setValue("Target", val === "" ? "" : Number(val) || 0, {
                        shouldDirty: true,
                      });
                    }}
                    className="flex-1 min-w-[240px] bg-blue-50 text-gray-700 px-4 py-3 rounded-xl text-sm placeholder-gray-500 dark:bg-[#1E2027] dark:text-white dark:placeholder-gray-400"
                  />
                  <input
                    type="number"
                    value={stopLossOnEachScript}
                    placeholder="Stop Loss on each script"
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue("SL", val === "" ? "" : Number(val) || 0, {
                        shouldDirty: true,
                      });
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
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value) || 0,
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
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value) || 0,
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
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value) || 0,
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
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value) || 0,
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
                      Control your trading outcomes by setting global limits on
                      losses and profits on the strategy, and automating how
                      gains are protected (trailing).
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
                      Advance Features
                      <span className="relative group inline-flex">
                        <button
                          type="button"
                          className="w-5 h-5 flex items-center justify-center"
                          aria-label="Advanced feature information"
                        >
                          <img src={infoIcon} alt="info" className="w-4 h-4" />
                        </button>
                        <span
                          className="pointer-events-none absolute right-0 top-full mt-2 w-64 max-w-sm text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2027] border border-gray-200 dark:border-[#2A2D35] rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition"
                          role="tooltip"
                        >
                          Toggle features like trailing SL, re-entry/execute
                          logic, and global exit sync. Options that conflict
                          with your current strategy type are disabled
                          automatically.
                        </span>
                      </span>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Utilize advanced execution controls for dynamic stop-loss
                      movement, conditional entry/re-entry, and strategy-wide
                      exit synchronization.
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
        {showWaitTradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-[#15171C] rounded-xl p-6 w-[90%] max-w-sm space-y-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Wait &amp; Trade
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Type
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                    value={waitTradeTempData.type}
                    onChange={(e) =>
                      setWaitTradeTempData((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                  >
                    {["% ↓", "% ↑", "pt ↑", "pt ↓"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400">
                    Movement
                  </label>
                  <input
                    type="number"
                    value={waitTradeTempData.movement}
                    min={0}
                    onChange={(e) =>
                      setWaitTradeTempData((prev) => ({
                        ...prev,
                        movement: e.target.value,
                      }))
                    }
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                    placeholder="Enter value"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowWaitTradeModal(false);
                    resetAdvanceFeature("Wait & Trade");
                  }}
                  className="px-4 py-2 rounded-lg border text-sm dark:border-[#333] dark:text-gray-300"
                >
                  Cancel
                </button>
                <PrimaryButton
                  type="button"
                  onClick={saveWaitTrade}
                  className="px-4 py-2 text-sm"
                >
                  Save
                </PrimaryButton>
              </div>
            </div>
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
                onChange={(e) => setPremiumDiffTempValue(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                placeholder="Enter value"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPremiumDiffModal(false);
                    resetAdvanceFeature("Premium Difference");
                  }}
                  className="px-4 py-2 rounded-lg border text-sm dark:border-[#333] dark:text-gray-300"
                >
                  Cancel
                </button>
                <PrimaryButton
                  type="button"
                  onClick={savePremiumDifference}
                  className="px-4 py-2 text-sm"
                >
                  Save
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {/* Re-Entry/Execute Modal */}
        <ReEntryExecuteModal
          isOpen={showReEntryModal}
          onClose={() => {
            setShowReEntryModal(false);
            resetAdvanceFeature("Re Entry/Execute");
          }}
          onSave={saveReEntryExecute}
          initialData={reEntryTempData}
        />

        {/* Trail Stop Loss Modal */}
        <TrailStopLossModal
          isOpen={showTrailSlModal}
          onClose={() => {
            setShowTrailSlModal(false);
            resetAdvanceFeature("Trail SL");
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
