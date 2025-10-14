import { useEffect, useLayoutEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiTrash2 } from "react-icons/fi";
import { leg1CopyIcon } from "../../../assets";

const Leg1 = ({ selectedStrategyTypes, selectedInstrument, editing }) => {
  const { setValue, getValues, watch } = useFormContext();
  const activeLegIndex = watch("ActiveLegIndex") ?? 0;
  const strategyScripts = watch("StrategyScriptList");
  const advanceFeatures = watch("AdvanceFeatures");
  // local UI state
  const [position, setPosition] = useState("BUY");
  const [optionType, setOptionType] = useState("Call");
  const [prePunchSL, setPrePunchSL] = useState(false);
  const [signalCandleCondition, setSignalCandleCondition] = useState(false);

  // available options (unchanged)
  const expiryOptions = ["WEEKLY", "MONTHLY"];
  const slOptions = ["SL%", "SL pt"];
  const tpOptions = ["TP%", "TP pt"];
  const onPriceOptions = ["On Price", "On Close"];
  const conditionOptions = ["CE", "PE"];

  // condition states (controlled)
  const [longCondition, setLongCondition] = useState("CE");
  const shortCondition = longCondition === "CE" ? "PE" : "CE";

  // NEW: strike criteria menu (as per screenshot)
  const strikeCriteriaOptions = [
    { label: "ATM pt", value: "ATM_PT" },
    { label: "ATM %", value: "ATM_PERCENT" },
    { label: "CP", value: "CP" },
    { label: "CP >=", value: "CP_GTE" },
    { label: "CP <=", value: "CP_LTE" },
  ];

  // NEW controlled expiry & action/type states
  const [expiryType, setExpiryType] = useState("WEEKLY");
  const [slTypeSel, setSlTypeSel] = useState("SL%");
  const [tpTypeSel, setTpTypeSel] = useState("TP%");
  const [slAction, setSlAction] = useState("On Price");
  const [tpAction, setTpAction] = useState("On Price");
  // target value (TP) state
  const [targetValue, setTargetValue] = useState(0);

  // NEW: ladder options for ATM pt / ATM %
  const atmPointsOptions = (() => {
    const arr = [];
    for (let p = 2000; p >= 50; p -= 50)
      arr.push({ label: `ITM ${p}`, value: `ITM_${p}` });
    arr.push({ label: "ATM", value: "ATM" });
    for (let p = 50; p <= 2000; p += 50)
      arr.push({ label: `OTM ${p}`, value: `OTM_${p}` });
    return arr;
  })();
  const atmPercentOptions = (() => {
    const arr = [];
    for (let p = 20; p >= 0.5; p -= 0.5)
      arr.push({ label: `ITM ${p.toFixed(1)}%`, value: `ITM_${p.toFixed(1)}` });
    arr.push({ label: "ATM", value: "ATM" });
    for (let p = 0.5; p <= 20; p += 0.5)
      arr.push({ label: `OTM ${p.toFixed(1)}%`, value: `OTM_${p.toFixed(1)}` });
    return arr;
  })();

  const [selectedStrikeCriteria, setSelectedStrikeCriteria] = useState(
    strikeCriteriaOptions[0].value
  );
  const [strikeTypeSelectValue, setStrikeTypeSelectValue] = useState("ATM");
  const [strikeTypeNumber, setStrikeTypeNumber] = useState(0);
  const isATMMode =
    selectedStrikeCriteria === "ATM_PT" ||
    selectedStrikeCriteria === "ATM_PERCENT";

  // Qty multiplier
  const [qtyMultiplier, setQtyMultiplier] = useState(1);
  // NEW: stop loss qty state (maps to StopLoss)
  const [stopLossQty, setStopLossQty] = useState(30);
  // Additional feature states derived from first strike (wait & trade / premium difference)
  const [waitTradeEnabled, setWaitTradeEnabled] = useState(false);
  const [waitTradeMovement, setWaitTradeMovement] = useState(0);
  const [waitTradeType, setWaitTradeType] = useState("% ↑");
  const [premiumDiffEnabled, setPremiumDiffEnabled] = useState(false);
  const [premiumDiffValue, setPremiumDiffValue] = useState(0);
  const [showPremiumDiffInlineInput, setShowPremiumDiffInlineInput] =
    useState(false);

  // Re-Entry/Execute states
  const [reEntryEnabled, setReEntryEnabled] = useState(false);
  const [reEntryExecutionType, setReEntryExecutionType] = useState("Combined");
  const [reEntryCycles, setReEntryCycles] = useState(1);

  // Trail SL states
  const [trailSlEnabled, setTrailSlEnabled] = useState(false);
  const [trailSlType, setTrailSlType] = useState("%");
  const [trailSlPriceMovement, setTrailSlPriceMovement] = useState(0);
  const [trailSlTrailingValue, setTrailSlTrailingValue] = useState(0);

  // compute disabled state when no instrument selected
  const isDisabled = !selectedInstrument || !selectedInstrument.InstrumentToken;

  // Default payload/object for Leg1 when clearing/resetting
  const LEG1_DEFAULTS = {
    position: "BUY",
    optionType: "Call",
    prePunchSL: false,
    signalCandleCondition: false,
    // add other fields you use in payload here with sensible defaults
    Qty: 0,
    ExpiryType: "WEEKLY",
    StrikeType: "ATM",
    SLType: "SL%",
    TPType: "TP%",
  };

  // derive lot size
  const lotSizeBase = selectedInstrument?.LotSize || 0;
  const qtyDisplay = Math.max(1, qtyMultiplier) * lotSizeBase;

  // REMOVED: syncing local Leg1 state into form (Leg1 field no longer needed)
  // useEffect(() => {
  //   setValue("Leg1", { position, optionType, prePunchSL, signalCandleCondition }, { shouldDirty: true });
  // }, [position, optionType, prePunchSL, signalCandleCondition, setValue]);

  // UPDATED: instrument change effect (removed setValue for Leg1)
  useLayoutEffect(() => {
    if (!selectedInstrument) {
      setPosition(LEG1_DEFAULTS.position);
      setOptionType(LEG1_DEFAULTS.optionType);
      setPrePunchSL(LEG1_DEFAULTS.prePunchSL);
      setSignalCandleCondition(LEG1_DEFAULTS.signalCandleCondition);
      return;
    }
    // Prefill from existing strike at current leg (edit or when switching legs)
    const scripts = getValues("StrategyScriptList") || [];
    const first = scripts[0];
    const longAt = first?.LongEquationoptionStrikeList?.[activeLegIndex];
    if (longAt) {
      setPosition(longAt.TransactionType || "BUY");
      if (selectedStrategyTypes?.[0] === "time") {
        setOptionType(longAt.StrikeType === "PE" ? "Put" : "Call");
      }
      setExpiryType(longAt.ExpiryType || "WEEKLY");
      setSlTypeSel(longAt.SLType === "slpt" ? "SL pt" : "SL%");
      setTpTypeSel(longAt.TargetType === "tgpt" ? "TP pt" : "TP%");
      setStopLossQty(Number(longAt.StopLoss) || 30);
      setTargetValue(Number(longAt.Target) || 0);
      setPrePunchSL(!!longAt.isPrePunchSL);
      setSlAction(
        longAt.SLActionTypeId === "ONCLOSE" ? "On Close" : "On Price"
      );
      setTpAction(
        longAt.TargetActionTypeId === "ONCLOSE" ? "On Close" : "On Price"
      );
      // derive wait & trade
      if (longAt.waitNTrade?.isWaitnTrade) {
        setWaitTradeEnabled(true);
        setWaitTradeMovement(Number(longAt.waitNTrade.MovementValue) || 0);
        // map backend typeId to label
        const wtMapRev = {
          "wtpr_-": "% ↓",
          wt_eq: "% ↑",
          "wtpt_+": "pt ↑",
          "wtpt_-": "pt ↓",
        };
        setWaitTradeType(wtMapRev[longAt.waitNTrade.typeId] || "% ↑");
      } else {
        setWaitTradeEnabled(false);
        setWaitTradeMovement(0);
      }
      // derive premium difference
      if (longAt.IsPriceDiffrenceConstrant) {
        setPremiumDiffEnabled(true);
        setPremiumDiffValue(Number(longAt.PriceDiffrenceConstrantValue) || 0);
      } else {
        setPremiumDiffEnabled(false);
        setPremiumDiffValue(0);
      }

      // derive re-entry/execute
      if (longAt.reEntry?.isRentry) {
        setReEntryEnabled(true);
        const rentryTypeReverseMap = {
          RENC: "Combined",
          REN: "Leg Wise",
          REX: "Exit",
        };
        setReEntryExecutionType(
          rentryTypeReverseMap[longAt.reEntry.RentryType] || "Combined"
        );
        setReEntryCycles(Number(longAt.reEntry.TradeCycle) || 1);
      } else {
        setReEntryEnabled(false);
        setReEntryExecutionType("Combined");
        setReEntryCycles(1);
      }

      // derive trail SL
      if (longAt.isTrailSL && longAt.TrailingSL) {
        setTrailSlEnabled(true);
        setTrailSlType(longAt.TrailingSL.TrailingType === "tslpt" ? "Pt" : "%");
        setTrailSlPriceMovement(
          Number(longAt.TrailingSL.InstrumentMovementValue) || 0
        );
        setTrailSlTrailingValue(Number(longAt.TrailingSL.TrailingValue) || 0);
      } else {
        setTrailSlEnabled(false);
        setTrailSlType("%");
        setTrailSlPriceMovement(0);
        setTrailSlTrailingValue(0);
      }
      const typeMapRev = {
        ATM: "ATM_PT",
        ATMPER: "ATM_PERCENT",
        CPNEAR: "CP",
        CPGREATERTHAN: "CP_GTE",
        CPLESSTHAN: "CP_LTE",
      };
      const t = longAt.strikeTypeobj?.type;
      const svNum = Number(longAt?.strikeTypeobj?.StrikeValue) || 0;
      if (t) {
        const mapped =
          typeMapRev[t] || (String(t).startsWith("CP") ? "CP" : "ATM_PT");
        setSelectedStrikeCriteria(mapped);
        if (t === "ATM" || t === "ATMPER") {
          if (svNum === 0) setStrikeTypeSelectValue("ATM");
          else if (svNum < 0)
            setStrikeTypeSelectValue(`ITM_${Math.abs(svNum)}`);
          else setStrikeTypeSelectValue(`OTM_${Math.abs(svNum)}`);
        } else {
          setStrikeTypeNumber(svNum);
        }
      }
      // set qty multiplier per leg from saved Qty
      const lot = selectedInstrument?.LotSize || 0;
      const legQty = Number(longAt.Qty) || 0;
      if (lot > 0 && legQty > 0) {
        const mult = Math.max(1, Math.round(legQty / lot));
        setQtyMultiplier(mult);
      } else {
        // default qty multiplier for fresh legs
        setQtyMultiplier(1);
      }
    } else {
      // new selection reset
      setPosition(LEG1_DEFAULTS.position);
      setOptionType(LEG1_DEFAULTS.optionType);
      setPrePunchSL(LEG1_DEFAULTS.prePunchSL);
      setSignalCandleCondition(LEG1_DEFAULTS.signalCandleCondition);
      setQtyMultiplier(1);
      // reset advanced features
      setWaitTradeEnabled(false);
      setWaitTradeMovement(0);
      setWaitTradeType("% ↑");
      setPremiumDiffEnabled(false);
      setPremiumDiffValue(0);
      setReEntryEnabled(false);
      setReEntryExecutionType("Combined");
      setReEntryCycles(1);
      setTrailSlEnabled(false);
      setTrailSlType("%");
      setTrailSlPriceMovement(0);
      setTrailSlTrailingValue(0);
    }
  }, [selectedInstrument, editing, activeLegIndex, strategyScripts]);

  // unified builder for StrategyScriptList (apply to active leg only)
  useEffect(() => {
    // Skip processing if instrument not selected
    if (!selectedInstrument) return;

    // Function to update form values - called at the end to prevent excessive renders
    const updateFormValues = () => {
      const isTime = selectedStrategyTypes?.[0] === "time";

      // Get current values
      const scripts = getValues("StrategyScriptList") || [];
      const base = { ...(scripts[0] || {}) };
      const existingActiveLong =
        scripts?.[0]?.LongEquationoptionStrikeList?.[activeLegIndex];

      // Set instrument identity
      base.InstrumentToken =
        selectedInstrument.InstrumentToken || base.InstrumentToken || "";
      base.InstrumentName =
        selectedInstrument.Name || base.InstrumentName || "";
      base.StrikeTickValue = base.StrikeTickValue || 0;

      // Set lot sizes
      const lotSizeBase = selectedInstrument?.LotSize || 0;
      base.Qty = lotSizeBase;
      const legQty = Math.max(1, qtyMultiplier) * lotSizeBase;

      // Helper functions
      const mapCriteriaType = (crit) => {
        if (crit === "ATM_PERCENT") return "ATMPER";
        if (crit === "ATM_PT") return "ATM";
        if (crit === "CP") return "CPNEAR";
        if (crit === "CP_GTE") return "CPGREATERTHAN";
        if (crit === "CP_LTE") return "CPLESSTHAN";
        return crit;
      };

      const parseOffsetValue = (raw) => {
        if (raw === "ATM") return 0;
        const parts = raw.split("_");
        if (parts.length < 2) return 0;
        const side = parts[0];
        const num = parseFloat(parts[1]);
        if (isNaN(num)) return 0;
        return side === "ITM" ? -num : num;
      };

      // Values for strike calculation
      const strikeValueRaw = isATMMode
        ? strikeTypeSelectValue
        : strikeTypeNumber;
      const strikeValueNumeric =
        typeof strikeValueRaw === "number"
          ? strikeValueRaw
          : parseOffsetValue(strikeValueRaw);

      // Type codes
      const slTypeCode = slTypeSel === "SL%" ? "slpr" : "slpt";
      const tpTypeCode = tpTypeSel === "TP%" ? "tgpr" : "tgpt";
      const actionMap = (v) => (v === "On Close" ? "ONCLOSE" : "ONPRICE");

      // Wait & Trade type mapping
      const mapWaitTradeType = (label) => {
        const map = {
          "% ↓": { isPerPt: "wtpr_-", typeId: "wtpr_-" },
          "% ↑": { isPerPt: "wt_eq", typeId: "wt_eq" },
          "pt ↑": { isPerPt: "wtpt_+", typeId: "wtpt_+" },
          "pt ↓": { isPerPt: "wtpt_-", typeId: "wtpt_-" },
          Equal: { isPerPt: "wt_eq", typeId: "wt_eq" },
        };
        return map[label] || map["% ↑"];
      };
      const wtTypeMeta = mapWaitTradeType(waitTradeType);

      // Create strike object builder
      const buildStrike = (strikeTypeSymbol) => {
        // Derive effective feature states
        const prevWait = existingActiveLong?.waitNTrade;
        const prevPremEnabled = existingActiveLong?.IsPriceDiffrenceConstrant;
        const prevPremValue = existingActiveLong?.PriceDiffrenceConstrantValue;
        const prevReEntry = existingActiveLong?.reEntry;
        const prevTrailSL = existingActiveLong?.TrailingSL;

        // Wait & Trade settings
        const effectiveWaitEnabled = waitTradeEnabled || prevWait?.isWaitnTrade;
        let effectiveWaitObj;

        if (effectiveWaitEnabled) {
          if (waitTradeEnabled) {
            effectiveWaitObj = {
              isWaitnTrade: true,
              isPerPt: wtTypeMeta.isPerPt,
              typeId: wtTypeMeta.typeId,
              MovementValue: String(waitTradeMovement),
            };
          } else if (prevWait?.isWaitnTrade) {
            effectiveWaitObj = { ...prevWait };
          }
        } else {
          effectiveWaitObj = {
            isWaitnTrade: false,
            isPerPt: wtTypeMeta.isPerPt,
            typeId: wtTypeMeta.typeId,
            MovementValue: "0",
          };
        }

        // Premium difference settings
        const globalPremEnabled = advanceFeatures?.["Premium Difference"];
        const globalPremValue = advanceFeatures?.PremiumDifferenceValue;
        const effectivePremiumEnabled =
          premiumDiffEnabled || prevPremEnabled || globalPremEnabled;
        const effectivePremiumValue = premiumDiffEnabled
          ? String(premiumDiffValue)
          : globalPremValue !== undefined
          ? String(globalPremValue)
          : prevPremEnabled
          ? String(prevPremValue)
          : "0";

        // Re-Entry/Execute settings
        const globalReEntryEnabled = advanceFeatures?.["Re Entry/Execute"];
        const effectiveReEntryEnabled =
          reEntryEnabled || prevReEntry?.isRentry || globalReEntryEnabled;
        const effectiveReEntryObj = effectiveReEntryEnabled
          ? {
              isRentry: true,
              RentryType:
                reEntryExecutionType === "Combined"
                  ? "RENC"
                  : reEntryExecutionType === "Exit"
                  ? "REX"
                  : "REN",
              TradeCycle: String(reEntryCycles || prevReEntry?.TradeCycle || 1),
              RentryActionTypeId: "ON_CLOSE",
            }
          : {
              isRentry: false,
              RentryType: "REN",
              TradeCycle: "0",
              RentryActionTypeId: "ON_CLOSE",
            };

        // Trail SL settings
        const globalTrailSlEnabled = advanceFeatures?.["Trail SL"];
        const effectiveTrailSlEnabled =
          trailSlEnabled ||
          existingActiveLong?.isTrailSL ||
          globalTrailSlEnabled;
        const effectiveTrailSlObj = effectiveTrailSlEnabled
          ? {
              TrailingType: trailSlType === "%" ? "tslpr" : "tslpt",
              InstrumentMovementValue:
                String(trailSlPriceMovement) ||
                String(prevTrailSL?.InstrumentMovementValue) ||
                "0",
              TrailingValue:
                String(trailSlTrailingValue) ||
                String(prevTrailSL?.TrailingValue) ||
                "0",
            }
          : {
              TrailingType: "tslpr",
              InstrumentMovementValue: "0",
              TrailingValue: "0",
            };

        // Return completed strike object
        return {
          TransactionType: position,
          StrikeType: strikeTypeSymbol,
          StrikeValueType: 0,
          StrikeValue: 0,
          SLActionTypeId: actionMap(slAction),
          TargetActionTypeId: actionMap(tpAction),
          TargetType: tpTypeCode,
          SLType: slTypeCode,
          Target: String(targetValue),
          StopLoss: String(stopLossQty),
          Qty: String(legQty),
          ExpiryType: expiryType,
          strikeTypeobj: {
            type: mapCriteriaType(selectedStrikeCriteria),
            StrikeValue: strikeValueNumeric,
            RangeFrom: 0,
            RangeTo: 0,
          },
          isTrailSL: effectiveTrailSlEnabled,
          // Respect existing flags updated via AdvanceFeatures panel
          IsMoveSLCTC: existingActiveLong?.IsMoveSLCTC ?? false,
          isExitAll: existingActiveLong?.isExitAll ?? false,
          isPrePunchSL: prePunchSL,
          reEntry: effectiveReEntryObj,
          waitNTrade: effectiveWaitObj,
          TrailingSL: effectiveTrailSlObj,
          lotSize: lotSizeBase,
          IsPriceDiffrenceConstrant: effectivePremiumEnabled,
          PriceDiffrenceConstrantValue: String(effectivePremiumValue),
        };
      };

      // Create strikes
      const optionStrikeType = optionType === "Call" ? "CE" : "PE";
      const longStrike = buildStrike(isTime ? optionStrikeType : longCondition);

      // Prepare arrays
      const longArr = Array.isArray(base.LongEquationoptionStrikeList)
        ? [...base.LongEquationoptionStrikeList]
        : [];
      const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
        ? [...base.ShortEquationoptionStrikeList]
        : [];

      // Ensure arrays have enough slots
      while (longArr.length <= activeLegIndex) longArr.push(undefined);
      if (!isTime)
        while (shortArr.length <= activeLegIndex) shortArr.push(undefined);

      // Set strikes
      longArr[activeLegIndex] = longStrike;
      if (!isTime) {
        const shortStrike = buildStrike(shortCondition);
        shortArr[activeLegIndex] = shortStrike;
      }

      // Filter out undefined values
      base.LongEquationoptionStrikeList = longArr.filter(
        (x) => x !== undefined
      );
      if (!isTime)
        base.ShortEquationoptionStrikeList = shortArr.filter(
          (x) => x !== undefined
        );

      // Compare existing and new values to avoid unnecessary updates
      const prevJSON = JSON.stringify(scripts[0] || {});
      const nextJSON = JSON.stringify(base);

      if (prevJSON !== nextJSON) {
        setValue("StrategyScriptList", [base], { shouldDirty: true });
      }
    };

    // Use a timeout to debounce multiple rapid updates
    // This is critical to prevent the maximum update depth error
    const timeoutId = setTimeout(() => {
      updateFormValues();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    selectedInstrument,
    selectedStrategyTypes,
    qtyMultiplier,
    selectedStrikeCriteria,
    strikeTypeSelectValue,
    strikeTypeNumber,
    isATMMode,
    longCondition,
    shortCondition,
    prePunchSL,
    position,
    optionType,
    getValues,
    setValue,
    stopLossQty,
    targetValue,
    slTypeSel,
    tpTypeSel,
    slAction,
    tpAction,
    expiryType,
    activeLegIndex,
    waitTradeEnabled,
    waitTradeMovement,
    waitTradeType,
    premiumDiffEnabled,
    premiumDiffValue,
    reEntryEnabled,
    reEntryExecutionType,
    reEntryCycles,
    trailSlEnabled,
    trailSlType,
    trailSlPriceMovement,
    trailSlTrailingValue,
    advanceFeatures,
  ]);

  // reset strike related controlled values when strategy type toggles
  useEffect(() => {
    setStrikeTypeSelectValue("ATM");
    setStrikeTypeNumber(0);
  }, [selectedStrategyTypes]);

  // persist advanced feature local fields into top-level AdvanceFeatures for global visibility
  useEffect(() => {
    const af = getValues("AdvanceFeatures") || {};
    const next = { ...af };
    if (waitTradeEnabled) {
      next["Wait & Trade"] = true;
      next.WaitTradeMovement = waitTradeMovement;
      next.WaitTradeType = waitTradeType;
    } else if (af["Wait & Trade"]) {
      // keep flag until user unticks in AdvanceFeatures panel; don't delete silently
    }
    if (premiumDiffEnabled) {
      next["Premium Difference"] = true;
      next.PremiumDifferenceValue = premiumDiffValue;
    }
    if (reEntryEnabled) {
      next["Re Entry/Execute"] = true;
      next.ReEntryExecutionType = reEntryExecutionType;
      next.ReEntryCycles = reEntryCycles;
    }
    if (trailSlEnabled) {
      next["Trail SL"] = true;
      next.TrailSlType = trailSlType;
      next.TrailSlPriceMovement = trailSlPriceMovement;
      next.TrailSlTrailingValue = trailSlTrailingValue;
    }
    setValue("AdvanceFeatures", next, { shouldDirty: true });
  }, [
    waitTradeEnabled,
    waitTradeMovement,
    waitTradeType,
    premiumDiffEnabled,
    premiumDiffValue,
    reEntryEnabled,
    reEntryExecutionType,
    reEntryCycles,
    trailSlEnabled,
    trailSlType,
    trailSlPriceMovement,
    trailSlTrailingValue,
    setValue,
    getValues,
  ]);

  // sync local premiumDiffValue from global AdvanceFeatures when not editing locally
  useEffect(() => {
    const globalVal = advanceFeatures?.PremiumDifferenceValue;
    if (
      !premiumDiffEnabled &&
      typeof globalVal === "number" &&
      globalVal !== premiumDiffValue
    ) {
      setPremiumDiffValue(globalVal);
    }
  }, [
    advanceFeatures?.PremiumDifferenceValue,
    premiumDiffEnabled,
    premiumDiffValue,
  ]);

  // derive lot size & exchange for display
  const exchange =
    selectedInstrument?.Exchange || selectedInstrument?.Segment || "";

  // derive existing feature flags for stable rendering (prevents flicker when external toggle updates before local state sync)
  const existingActiveLong =
    strategyScripts?.[0]?.LongEquationoptionStrikeList?.[activeLegIndex];
  const featureWaitTradeActive =
    advanceFeatures?.["Wait & Trade"] ||
    waitTradeEnabled ||
    existingActiveLong?.waitNTrade?.isWaitnTrade;
  const featurePremiumActive =
    advanceFeatures?.["Premium Difference"] ||
    premiumDiffEnabled ||
    existingActiveLong?.IsPriceDiffrenceConstrant;
  const featureReEntryActive =
    advanceFeatures?.["Re Entry/Execute"] ||
    reEntryEnabled ||
    existingActiveLong?.reEntry?.isRentry;
  const featureTrailSlActive =
    advanceFeatures?.["Trail SL"] ||
    trailSlEnabled ||
    existingActiveLong?.isTrailSL;

  // stable premium value selection (avoid 0->value flicker)
  const globalPremiumValue = advanceFeatures?.PremiumDifferenceValue;
  const premiumInputValue =
    typeof globalPremiumValue === "number" && !Number.isNaN(globalPremiumValue)
      ? globalPremiumValue
      : premiumDiffValue;

  return (
    // changed: added relative group container
    <div className="relative group">
      {/* Hover overlay when no instrument selected */}
      {!selectedInstrument && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center
                     bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
                     text-white text-sm font-semibold rounded-2xl select-none"
        >
          Select Instrument
        </div>
      )}
      <div className="p-4 border rounded-2xl space-y-4 bg-white dark:border-[#1E2027] dark:bg-[#131419] text-black dark:text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{`Leg ${
              activeLegIndex + 1
            }`}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Lorem Ipsum donor
            </p>
          </div>
        </div>

        <div className="border rounded-xl p-4 space-y-4 bg-white border-gray-200 dark:border-[#1E2027] dark:bg-[#1E2027]">
          {selectedStrategyTypes?.[0] === "indicator" && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block mb-1 text-green-600 font-medium">
                  When Long Condition
                </label>
                <select
                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  disabled={isDisabled}
                  value={longCondition}
                  onChange={(e) => setLongCondition(e.target.value)}
                >
                  {conditionOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-red-500 font-medium">
                  When Short Condition
                </label>
                <select
                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  disabled={isDisabled}
                  value={shortCondition}
                  onChange={(e) =>
                    // enforce opposite relationship
                    setLongCondition(e.target.value === "CE" ? "PE" : "CE")
                  }
                >
                  {conditionOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div
            className={`grid gap-3 text-xs ${
              selectedStrategyTypes?.[0] === "indicator"
                ? "grid-cols-2"
                : "grid-cols-3"
            }`}
          >
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Qty
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    !isDisabled && setQtyMultiplier((m) => (m > 1 ? m - 1 : 1))
                  }
                  className="px-2 py-1 border rounded dark:border-[#2C2F36]"
                  disabled={isDisabled || qtyMultiplier <= 1}
                >
                  -
                </button>
                <input
                  type="text"
                  value={qtyDisplay}
                  readOnly
                  className="border rounded px-2 py-2 w-full text-center dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36] cursor-not-allowed"
                  disabled
                />
                <button
                  type="button"
                  onClick={() => !isDisabled && setQtyMultiplier((m) => m + 1)}
                  className="px-2 py-1 border rounded dark:border-[#2C2F36]"
                  disabled={isDisabled || lotSizeBase === 0}
                >
                  +
                </button>
              </div>
              <p className="text-[10px] mt-1 text-gray-500 dark:text-gray-500">
                Multiples of lot ({lotSizeBase})
              </p>
            </div>
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Position
              </label>
              <div className="flex space-x-2">
                {["BUY", "SELL"].map((pos) => (
                  <button
                    type="button"
                    key={pos}
                    onClick={() => setPosition(pos)}
                    className={`w-1/2 border rounded px-3 py-2 font-semibold transition ${
                      position === pos
                        ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-[#0F3F62]"
                        : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-[#2C2F36] border-gray-300 dark:border-[#2C2F36]"
                    }`}
                    disabled={isDisabled}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
            {selectedStrategyTypes?.[0] !== "indicator" && (
              <div>
                <label className="block mb-1 text-gray-600 dark:text-gray-400">
                  Option Type
                </label>
                <div className="flex space-x-2">
                  {["Call", "Put"].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setOptionType(type)}
                      className={`w-1/2 border rounded px-3 py-2 font-semibold transition ${
                        optionType === type
                          ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-[#0F3F62]"
                          : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-[#2C2F36] border-gray-300 dark:border-[#2C2F36]"
                      }`}
                      disabled={isDisabled}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Expiry
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
                value={expiryType}
                onChange={(e) => setExpiryType(e.target.value)}
              >
                {expiryOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Strike Criteria select */}
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Strike Criteria
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                value={selectedStrikeCriteria}
                onChange={(e) => setSelectedStrikeCriteria(e.target.value)}
                disabled={isDisabled}
              >
                {strikeCriteriaOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Strike Type field */}
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Strike Type
              </label>
              {isATMMode ? (
                <select
                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  value={strikeTypeSelectValue}
                  onChange={(e) => setStrikeTypeSelectValue(e.target.value)}
                  disabled={isDisabled}
                >
                  {(selectedStrikeCriteria === "ATM_PT"
                    ? atmPointsOptions
                    : atmPercentOptions
                  ).map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  value={strikeTypeNumber}
                  onChange={(e) =>
                    setStrikeTypeNumber(Math.max(0, Number(e.target.value)))
                  }
                  disabled={isDisabled}
                  placeholder="Enter value"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Stop Loss
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
                value={slTypeSel}
                onChange={(e) => setSlTypeSel(e.target.value)}
              >
                {slOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Partially Qty Booked
              </label>
              <input
                type="number"
                value={stopLossQty}
                onChange={(e) =>
                  !isDisabled &&
                  setStopLossQty(
                    Math.max(
                      0,
                      Number.isNaN(+e.target.value) ? 0 : +e.target.value
                    )
                  )
                }
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                On Price
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
                value={slAction}
                onChange={(e) => setSlAction(e.target.value)}
              >
                {onPriceOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                TP
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
                value={tpTypeSel}
                onChange={(e) => setTpTypeSel(e.target.value)}
              >
                {tpOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Partially Qty Booked
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) =>
                  !isDisabled &&
                  setTargetValue(
                    Math.max(
                      0,
                      Number.isNaN(+e.target.value) ? 0 : +e.target.value
                    )
                  )
                }
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                On Price
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
                value={tpAction}
                onChange={(e) => setTpAction(e.target.value)}
              >
                {onPriceOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Features Section */}
          {(featureWaitTradeActive ||
            featurePremiumActive ||
            featureReEntryActive ||
            featureTrailSlActive) && (
            <div className="mt-4 space-y-3">
              <div className="text-[11px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
                --- Advance Features ---
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {featureWaitTradeActive && (
                  <>
                    <div>
                      <label className="block mb-1 text-gray-600 dark:text-gray-400">
                        Wait & Trade
                      </label>
                      <select
                        className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                        value={waitTradeType}
                        onChange={(e) => setWaitTradeType(e.target.value)}
                      >
                        {["% ↓", "% ↑", "pt ↑", "pt ↓", "Equal"].map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 dark:text-gray-400">
                        Movement
                      </label>
                      <input
                        type="number"
                        value={waitTradeMovement}
                        min={0}
                        onChange={(e) =>
                          setWaitTradeMovement(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                      />
                    </div>
                  </>
                )}
                {featurePremiumActive && (
                  <div>
                    <label className="block mb-1 text-gray-600 dark:text-gray-400">
                      Premium
                    </label>
                    <input
                      type="number"
                      value={premiumInputValue}
                      min={0}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setPremiumDiffValue(val);
                        const af = getValues("AdvanceFeatures") || {};
                        if (af.PremiumDifferenceValue !== val) {
                          setValue(
                            "AdvanceFeatures",
                            {
                              ...af,
                              "Premium Difference": true,
                              PremiumDifferenceValue: val,
                            },
                            { shouldDirty: true }
                          );
                        }
                      }}
                      className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    />
                  </div>
                )}
                {featureReEntryActive && (
                  <>
                    <div>
                      <label className="block mb-1 text-gray-600 dark:text-gray-400">
                        Re-Entry Type
                      </label>
                      <select
                        className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                        value={reEntryExecutionType}
                        onChange={(e) =>
                          setReEntryExecutionType(e.target.value)
                        }
                      >
                        <option value="Combined">Combined</option>
                        <option value="Leg Wise">Leg Wise</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 dark:text-gray-400">
                        Cycles
                      </label>
                      <input
                        type="number"
                        value={reEntryCycles}
                        min={1}
                        onChange={(e) =>
                          setReEntryCycles(
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                      />
                    </div>
                  </>
                )}
                {featureTrailSlActive && (
                  <>
                    <div>
                      <label className="block mb-1 text-gray-600 dark:text-gray-400">
                        Trail SL Type
                      </label>
                      <select
                        className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                        value={trailSlType}
                        onChange={(e) => setTrailSlType(e.target.value)}
                      >
                        <option value="%">%</option>
                        <option value="Pt">Pt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 dark:text-gray-400">
                        Price Movement
                      </label>
                      <input
                        type="number"
                        value={trailSlPriceMovement}
                        min={0}
                        onChange={(e) =>
                          setTrailSlPriceMovement(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 dark:text-gray-400">
                        Trailing Value
                      </label>
                      <input
                        type="number"
                        value={trailSlTrailingValue}
                        min={0}
                        onChange={(e) =>
                          setTrailSlTrailingValue(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div
            className={`flex ${
              selectedStrategyTypes?.[0] === "indicator"
                ? "justify-between"
                : "justify-end"
            } items-center pt-2`}
          >
            {selectedStrategyTypes?.[0] === "indicator" && (
              <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={prePunchSL}
                  onChange={() => setPrePunchSL(!prePunchSL)}
                  disabled={isDisabled}
                />
                <span>
                  Pre Punch SL{" "}
                  <span className="text-[11px]">(Advance Feature)</span>
                </span>
              </label>
            )}

            <div className="flex space-x-4 text-xl text-gray-400 dark:text-gray-500">
              <FiTrash2 className="text-red-500 cursor-pointer" />
              <img src={leg1CopyIcon} />
            </div>
          </div>
        </div>

        {selectedStrategyTypes?.[0] === "indicator" && (
          <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
            <input
              type="checkbox"
              checked={signalCandleCondition}
              onChange={() => setSignalCandleCondition(!signalCandleCondition)}
              disabled={isDisabled}
            />
            <span>
              Add Signal Candle Condition{" "}
              <span className="text-[11px] text-gray-400">(Optional)</span>
            </span>
          </label>
        )}
      </div>
    </div>
  );
};

export default Leg1;
