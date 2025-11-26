import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiTrash2 } from "react-icons/fi";
import { leg1CopyIcon } from "../../../assets";
import {
  useStrategyBuilderStore,
  createDefaultStrike,
} from "../../../stores/strategyBuilderStore";
import ComingSoonOverlay from "../../common/ComingSoonOverlay";
import PrimaryButton from "../../common/PrimaryButton";

const Leg1 = ({
  selectedStrategyTypes,
  selectedInstrument,
  comingSoon = false,
}) => {
  // Guard to prevent feedback loops when hydrating per-leg features from existing strikes
  const hydratingRef = useRef(false);
  const { setValue, getValues, watch } = useFormContext();
  // Select stable store actions individually to avoid unnecessary rerenders
  const updatePayload = useStrategyBuilderStore((s) => s.updatePayload);
  const setLegAdvanceFeature = useStrategyBuilderStore(
    (s) => s.setLegAdvanceFeature
  );
  const getLegAdvanceFeatures = useStrategyBuilderStore(
    (s) => s.getLegAdvanceFeatures
  );
  const activeLegIndex = watch("ActiveLegIndex") ?? 0;
  const strategyScripts = watch("StrategyScriptList");
  const advanceFeatures = watch("AdvanceFeatures");

  const rawBuyWhen = watch("BuyWhen");
  const rawShortWhen = watch("ShortWhen");
  const tradeOnTriggerCandle = watch("isTradeOnTriggerCandle") || false;
  const ofContinuousCandle = watch("IsContiniousTriggerCandle") || false;
  const isChartOnOptionStrike = watch("IsChartOnOptionStrike") || false;
  const chartType = watch("chartType");
  const transactionType = watch("TransactionType") ?? 0;
  const productTypeNum = Number(watch("ProductType")) || 0;
  const isBtSt = watch("isBtSt") || false;

  // Derive productType
  const productType =
    productTypeNum === 0
      ? "MIS"
      : productTypeNum === 1 && isBtSt
      ? "BTST"
      : productTypeNum === 1 && !isBtSt
      ? "CNC"
      : "MIS";

  // ✅ Legs management state (moved from OrderType)
  const [legs, setLegs] = useState(["L1"]);
  const [selectedLeg, setSelectedLeg] = useState("L1");

  const [signalCandleCondition, setSignalCandleCondition] = useState(
    tradeOnTriggerCandle || !!rawBuyWhen || !!rawShortWhen || ofContinuousCandle
  );

  useEffect(() => {
    if (
      tradeOnTriggerCandle ||
      rawBuyWhen ||
      rawShortWhen ||
      ofContinuousCandle
    ) {
      setSignalCandleCondition(true);
    }
  }, [tradeOnTriggerCandle, rawBuyWhen, rawShortWhen, ofContinuousCandle]);

  // Force ExpiryType to WEEKLY for CNC and BTST
  useEffect(() => {
    if (productType === "CNC" || productType === "BTST") {
      const scripts = getValues("StrategyScriptList") || [];
      const updatedScripts = scripts.map((script) => {
        const updatedLong = (script.LongEquationoptionStrikeList || []).map(
          (strike) => ({
            ...strike,
            ExpiryType: "WEEKLY",
          })
        );
        const updatedShort = (script.ShortEquationoptionStrikeList || []).map(
          (strike) => ({
            ...strike,
            ExpiryType: "WEEKLY",
          })
        );
        return {
          ...script,
          LongEquationoptionStrikeList: updatedLong,
          ShortEquationoptionStrikeList: updatedShort,
        };
      });
      setValue("StrategyScriptList", updatedScripts, { shouldDirty: true });
    }
  }, [productType, setValue, getValues]);

  // When options chart is enabled for indicator strategy, keep only one leg
  useEffect(() => {
    if (chartType === "options" && isIndicatorStrategy) {
      const scripts = getValues("StrategyScriptList") || [];
      if (scripts.length > 0) {
        const firstScript = scripts[0];
        const longStrikes = firstScript.LongEquationoptionStrikeList || [];
        const shortStrikes = firstScript.ShortEquationoptionStrikeList || [];
        // Keep only the active leg's strike
        const keepIndex = activeLegIndex;
        const newLong = longStrikes[keepIndex] ? [longStrikes[keepIndex]] : [];
        const newShort = shortStrikes[keepIndex]
          ? [shortStrikes[keepIndex]]
          : [];
        const updatedScript = {
          ...firstScript,
          LongEquationoptionStrikeList: newLong,
          ShortEquationoptionStrikeList: newShort,
        };
        const updatedScripts = [updatedScript];
        setValue("StrategyScriptList", updatedScripts, { shouldDirty: true });
        updatePayload({ StrategyScriptList: updatedScripts });
        // Update legs state
        setLegs(["L1"]);
        setSelectedLeg("L1");
        setValue("ActiveLegIndex", 0, { shouldDirty: true });
      }
    }
  }, [chartType, activeLegIndex, setValue, updatePayload, getValues]);

  const buyWhen = rawBuyWhen || "Low Break";
  const shortWhen = rawShortWhen || "Low Break";

  const strategyType = selectedStrategyTypes?.[0] ?? "time";
  const isTimeStrategy = strategyType === "time";
  const isIndicatorStrategy = strategyType === "indicator";

  // available options (unchanged)
  const expiryOptions = ["WEEKLY", "NEXTWEEKLY", "MONTHLY"];
  const slOptions = ["SL%", "SL pt"];
  const tpOptions = ["TP%", "TP pt"];
  const onPriceOptions = ["On Price", "On Close"];
  const conditionOptions = ["CE", "PE"];

  // NEW: strike criteria menu (as per screenshot)
  const strikeCriteriaOptions = [
    { label: "ATM pt", value: "ATM_PT" },
    { label: "ATM %", value: "ATM_PERCENT" },
    { label: "CP", value: "CP" },
    { label: "CP >=", value: "CP_GTE" },
    { label: "CP <=", value: "CP_LTE" },
  ];

  // NEW: ladder options for ATM pt / ATM %
  const atmPointsOptions = useMemo(() => {
    const arr = [];
    for (let p = 2000; p >= 50; p -= 50) {
      arr.push({ label: `ITM ${p}`, value: `ITM_${p}` });
    }
    arr.push({ label: "ATM", value: "ATM" });
    for (let p = 50; p <= 2000; p += 50) {
      arr.push({ label: `OTM ${p}`, value: `OTM_${p}` });
    }
    return arr;
  }, []);
  const atmPercentOptions = useMemo(() => {
    const arr = [];
    for (let p = 20; p >= 0.5; p -= 0.5) {
      const formatted = p.toFixed(1);
      arr.push({ label: `ITM ${formatted}%`, value: `ITM_${formatted}` });
    }
    arr.push({ label: "ATM", value: "ATM" });
    for (let p = 0.5; p <= 20; p += 0.5) {
      const formatted = p.toFixed(1);
      arr.push({ label: `OTM ${formatted}%`, value: `OTM_${formatted}` });
    }
    return arr;
  }, []);

  const strikeCriteriaToType = (crit) => {
    if (crit === "ATM_PERCENT") return "ATMPER";
    if (crit === "ATM_PT") return "ATM";
    if (crit === "CP") return "CPNEAR";
    if (crit === "CP_GTE") return "CPGREATERTHAN";
    if (crit === "CP_LTE") return "CPLESSTHAN";
    return crit;
  };

  const parseStrikeToken = (raw) => {
    if (typeof raw === "number") return raw;
    if (!raw || raw === "ATM") return 0;
    const parts = String(raw).split("_");
    if (parts.length < 2) return 0;
    const side = parts[0];
    const num = parseFloat(parts[1]);
    if (Number.isNaN(num)) return 0;
    return side === "ITM" ? -num : num;
  };

  const formatStrikeSummary = (strikeObj) => {
    if (!strikeObj) return "ATM";
    const value = Number(strikeObj.StrikeValue) || 0;
    const abs = Math.abs(value);
    switch (strikeObj.type) {
      case "ATM":
        return value === 0 ? "ATM" : `ATM ${value > 0 ? `+${abs}` : `-${abs}`}`;
      case "ATMPER":
        return value === 0
          ? "ATM"
          : `ATM ${value > 0 ? `+${abs}%` : `-${abs}%`}`;
      case "CPNEAR":
        return abs === 0 ? "CP" : `CP ±${abs}`;
      case "CPGREATERTHAN":
        return `CP ≥ ${abs}`;
      case "CPLESSTHAN":
        return `CP ≤ ${abs}`;
      default:
        return strikeObj.type || "ATM";
    }
  };
  const strategyScript = strategyScripts?.[0] || {};
  const longStrikes = Array.isArray(strategyScript.LongEquationoptionStrikeList)
    ? strategyScript.LongEquationoptionStrikeList
    : [];
  const shortStrikes = Array.isArray(
    strategyScript.ShortEquationoptionStrikeList
  )
    ? strategyScript.ShortEquationoptionStrikeList
    : [];

  const existingActiveLong = longStrikes[activeLegIndex];
  const existingActiveShort = shortStrikes[activeLegIndex];

  const isPopulatedStrike = useCallback((strike) => {
    if (!strike) return false;
    const qty = Number(strike.Qty || 0);
    const target = Number(strike.Target || 0);
    const stop = Number(strike.StopLoss);
    const strikeOffset = Number(strike?.strikeTypeobj?.StrikeValue || 0);
    const hasCustomType =
      strike?.strikeTypeobj?.type && strike.strikeTypeobj.type !== "ATM";
    const hasWait = strike?.waitNTrade?.isWaitnTrade;
    const hasPremium = strike?.IsPriceDiffrenceConstrant;
    const hasReEntry = strike?.reEntry?.isRentry;
    const hasTrail = strike?.isTrailSL;

    const hasStopConfigured = !Number.isNaN(stop) && stop !== 0 && stop !== 30;

    return (
      qty > 0 ||
      target > 0 ||
      hasStopConfigured ||
      strikeOffset !== 0 ||
      hasCustomType ||
      !!hasWait ||
      !!hasPremium ||
      !!hasReEntry ||
      !!hasTrail
    );
  }, []);

  const longPopulated = isPopulatedStrike(existingActiveLong);
  const shortPopulated = isPopulatedStrike(existingActiveShort);

  const primaryStrikeSource =
    longPopulated && !shortPopulated
      ? "long"
      : !longPopulated && shortPopulated
      ? "short"
      : longPopulated
      ? "long"
      : shortPopulated
      ? "short"
      : "long";

  const existingActiveStrike =
    primaryStrikeSource === "short"
      ? existingActiveShort || existingActiveLong
      : existingActiveLong || existingActiveShort;

  const position = existingActiveStrike?.TransactionType || "BUY";
  const expiryType =
    productType === "CNC" || productType === "BTST"
      ? "WEEKLY"
      : existingActiveStrike?.ExpiryType || "WEEKLY";
  const slTypeSel = existingActiveStrike?.SLType === "slpt" ? "SL pt" : "SL%";
  const tpTypeSel =
    existingActiveStrike?.TargetType === "tgpt" ? "TP pt" : "TP%";
  const slAction =
    existingActiveStrike?.SLActionTypeId === "ONCLOSE"
      ? "On Close"
      : "On Price";
  const tpAction =
    existingActiveStrike?.TargetActionTypeId === "ONCLOSE"
      ? "On Close"
      : "On Price";
  const rawTargetValue = existingActiveStrike?.Target;
  const targetValue =
    rawTargetValue === undefined || rawTargetValue === null
      ? ""
      : String(rawTargetValue);
  const rawStopLoss = existingActiveStrike?.StopLoss;
  const stopLossQty =
    rawStopLoss === undefined || rawStopLoss === null
      ? ""
      : String(rawStopLoss);
  const prePunchSL = !!existingActiveStrike?.isPrePunchSL;

  const longCondition = isIndicatorStrategy
    ? (longPopulated
        ? existingActiveLong?.StrikeType
        : existingActiveShort?.StrikeType) || "CE"
    : "";
  const optionType = existingActiveStrike?.StrikeType === "PE" ? "Put" : "Call";
  const shortCondition = isIndicatorStrategy
    ? shortPopulated
      ? existingActiveShort?.StrikeType
      : longCondition === "CE"
      ? "PE"
      : "CE"
    : "";

  const backendStrikeType = existingActiveStrike?.strikeTypeobj?.type || "ATM";
  const selectedStrikeCriteria = (() => {
    if (backendStrikeType === "ATMPER") return "ATM_PERCENT";
    if (backendStrikeType === "ATM") return "ATM_PT";
    if (backendStrikeType === "CPNEAR") return "CP";
    if (backendStrikeType === "CPGREATERTHAN") return "CP_GTE";
    if (backendStrikeType === "CPLESSTHAN") return "CP_LTE";
    return "ATM_PT";
  })();

  const strikeValueNumeric =
    Number(existingActiveStrike?.strikeTypeobj?.StrikeValue) || 0;
  const isATMMode =
    selectedStrikeCriteria === "ATM_PT" ||
    selectedStrikeCriteria === "ATM_PERCENT";

  const formatATMSelection = (value, criteria) => {
    if (!value) return "ATM";
    const abs = Math.abs(value);
    if (criteria === "ATM_PERCENT") {
      const formatted = Number(abs).toFixed(1);
      return value < 0 ? `ITM_${formatted}` : `OTM_${formatted}`;
    }
    return value < 0 ? `ITM_${abs}` : `OTM_${abs}`;
  };

  const strikeTypeSelectValue = isATMMode
    ? formatATMSelection(strikeValueNumeric, selectedStrikeCriteria)
    : "ATM";
  const strikeTypeNumber = !isATMMode ? Math.max(0, strikeValueNumeric) : 0;

  const lotSizeBase = selectedInstrument?.LotSize || 0;
  const effectiveLotSize =
    lotSizeBase || Number(existingActiveStrike?.lotSize) || 0;

  const qtyMultiplier = useMemo(() => {
    if (!effectiveLotSize) return 1;
    const rawQty = Number(existingActiveStrike?.Qty);
    if (!Number.isFinite(rawQty) || rawQty <= 0) {
      return 1;
    }
    const ratio = rawQty / effectiveLotSize;
    return Math.max(1, Math.round(ratio) || 1);
  }, [existingActiveStrike, effectiveLotSize]);

  const qtyDisplay = effectiveLotSize
    ? Math.max(1, qtyMultiplier) * effectiveLotSize
    : Number(existingActiveStrike?.Qty) || 0;

  const getLegSummary = useCallback(
    (idx) => {
      const script = strategyScripts?.[0];
      const longLeg = script?.LongEquationoptionStrikeList?.[idx];
      const shortLeg = script?.ShortEquationoptionStrikeList?.[idx];
      const isActive = idx === activeLegIndex;

      const longLegPopulated = isPopulatedStrike(longLeg);
      const shortLegPopulated = isPopulatedStrike(shortLeg);

      let legData = longLeg;
      if (!longLegPopulated && shortLegPopulated) {
        legData = shortLeg;
      } else if (!longLegPopulated && !shortLegPopulated) {
        legData = shortLeg || longLeg;
      }

      const sourceStrike = legData || (isActive ? existingActiveStrike : null);

      const transaction =
        sourceStrike?.TransactionType || (isActive ? position : "SELL");
      const optionSymbol =
        sourceStrike?.StrikeType ||
        (isActive
          ? isIndicatorStrategy
            ? longCondition
            : optionType === "Call"
            ? "CE"
            : "PE"
          : "");

      const qtyValue =
        sourceStrike?.Qty ||
        (isActive
          ? String(
              Math.max(1, qtyMultiplier) * (selectedInstrument?.LotSize || 0)
            )
          : "");

      const strikeObj =
        sourceStrike?.strikeTypeobj ||
        (isActive
          ? {
              type: strikeCriteriaToType(selectedStrikeCriteria),
              StrikeValue: isATMMode
                ? parseStrikeToken(strikeTypeSelectValue)
                : strikeTypeNumber,
              RangeFrom: 0,
              RangeTo: 0,
            }
          : null);

      const targetText =
        sourceStrike &&
        sourceStrike.Target !== undefined &&
        sourceStrike.Target !== null
          ? String(sourceStrike.Target)
          : isActive
          ? String(targetValue)
          : "";
      const stopLossText =
        sourceStrike &&
        sourceStrike.StopLoss !== undefined &&
        sourceStrike.StopLoss !== null
          ? String(sourceStrike.StopLoss)
          : isActive
          ? String(stopLossQty)
          : "";
      const instrumentName =
        sourceStrike?.InstrumentName ||
        script?.InstrumentName ||
        selectedInstrument?.Name ||
        "";

      const summaryBits = [
        instrumentName || null,
        qtyValue ? `Qty ${qtyValue}` : null,
        `Strike ${formatStrikeSummary(strikeObj)}`,
        targetText ? `TP ${targetText}` : null,
        stopLossText ? `SL ${stopLossText}` : null,
      ].filter(Boolean);

      return {
        title: `${transaction || "SELL"} ${optionSymbol || ""}`.trim(),
        subtitle: summaryBits.join(" • "),
      };
    },
    [
      strategyScripts,
      activeLegIndex,
      position,
      isIndicatorStrategy,
      longCondition,
      optionType,
      qtyMultiplier,
      selectedInstrument,
      selectedStrikeCriteria,
      isATMMode,
      strikeTypeSelectValue,
      strikeTypeNumber,
      targetValue,
      stopLossQty,
      existingActiveStrike,
      isPopulatedStrike,
    ]
  );

  const applyStrikeUpdate = useCallback(
    (mutator) => {
      const scripts = getValues("StrategyScriptList") || [];
      if (!scripts.length) return;

      const prevBase = scripts[0] || {};
      const base = { ...prevBase };
      const longArr = Array.isArray(base.LongEquationoptionStrikeList)
        ? [...base.LongEquationoptionStrikeList]
        : [];
      const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
        ? [...base.ShortEquationoptionStrikeList]
        : [];

      while (longArr.length <= activeLegIndex) {
        longArr.push(createDefaultStrike());
      }

      if (!isTimeStrategy) {
        while (shortArr.length <= activeLegIndex) {
          shortArr.push(createDefaultStrike());
        }
      }

      const longStrike = { ...longArr[activeLegIndex] };
      const shortStrike = !isTimeStrategy
        ? { ...shortArr[activeLegIndex] }
        : undefined;

      mutator({ longStrike, shortStrike });

      longArr[activeLegIndex] = longStrike;
      if (!isTimeStrategy && shortStrike) {
        shortArr[activeLegIndex] = shortStrike;
      }

      const instrumentLot = selectedInstrument?.LotSize || 0;

      const nextBase = {
        ...base,
        LongEquationoptionStrikeList: longArr,
        ...(isTimeStrategy ? {} : { ShortEquationoptionStrikeList: shortArr }),
      };

      if (instrumentLot && !nextBase.Qty) {
        nextBase.Qty = instrumentLot;
      }

      const prevJSON = JSON.stringify(prevBase);
      const nextJSON = JSON.stringify(nextBase);

      if (prevJSON !== nextJSON) {
        const updatedScripts = [nextBase];
        setValue("StrategyScriptList", updatedScripts, { shouldDirty: true });
        updatePayload({ StrategyScriptList: updatedScripts });
      }
    },
    [
      activeLegIndex,
      getValues,
      selectedInstrument,
      isTimeStrategy,
      setValue,
      updatePayload,
    ]
  );

  // ✅ Per-leg advance features using Zustand store
  const getPerLegFeature = (featureName, defaultValue) => {
    const legFeatures = getLegAdvanceFeatures(activeLegIndex);
    return legFeatures[featureName] !== undefined
      ? legFeatures[featureName]
      : defaultValue;
  };

  const setPerLegFeature = (featureName, value) => {
    const current = getPerLegFeature(featureName, undefined);
    // Avoid redundant store updates if value is unchanged
    if (Object.is(current, value)) return;
    setLegAdvanceFeature(activeLegIndex, featureName, value);
  };

  // Wait & Trade states (per-leg)
  const waitTradeEnabled = getPerLegFeature("waitTradeEnabled", false);
  const waitTradeMovement = getPerLegFeature("waitTradeMovement", 0);
  const waitTradeType = getPerLegFeature("waitTradeType", "% ↑");

  const setWaitTradeEnabled = (val) =>
    setPerLegFeature("waitTradeEnabled", val);
  const setWaitTradeMovement = (val) =>
    setPerLegFeature("waitTradeMovement", val);
  const setWaitTradeType = (val) => setPerLegFeature("waitTradeType", val);

  // Premium Difference states (per-leg)
  const premiumDiffEnabled = getPerLegFeature("premiumDiffEnabled", false);
  const premiumDiffValue = getPerLegFeature("premiumDiffValue", 0);

  const setPremiumDiffEnabled = (val) =>
    setPerLegFeature("premiumDiffEnabled", val);
  const setPremiumDiffValue = (val) =>
    setPerLegFeature("premiumDiffValue", val);

  // Re-Entry/Execute states (per-leg)
  const reEntryEnabled = getPerLegFeature("reEntryEnabled", false);
  const reEntryExecutionType = getPerLegFeature(
    "reEntryExecutionType",
    "ReExecute"
  );
  const reEntryCycles = getPerLegFeature("reEntryCycles", 1);
  const reEntryActionType = getPerLegFeature("reEntryActionType", "IMMDT");

  const setReEntryEnabled = (val) => setPerLegFeature("reEntryEnabled", val);
  const setReEntryExecutionType = (val) =>
    setPerLegFeature("reEntryExecutionType", val);
  const setReEntryCycles = (val) => setPerLegFeature("reEntryCycles", val);
  const setReEntryActionType = (val) =>
    setPerLegFeature("reEntryActionType", val);

  // Trail SL states (per-leg)
  const trailSlEnabled = getPerLegFeature("trailSlEnabled", false);
  const trailSlType = getPerLegFeature("trailSlType", "%");
  const trailSlPriceMovement = getPerLegFeature("trailSlPriceMovement", 0);
  const trailSlTrailingValue = getPerLegFeature("trailSlTrailingValue", 0);

  const setTrailSlEnabled = (val) => setPerLegFeature("trailSlEnabled", val);
  const setTrailSlType = (val) => setPerLegFeature("trailSlType", val);
  const setTrailSlPriceMovement = (val) =>
    setPerLegFeature("trailSlPriceMovement", val);
  const setTrailSlTrailingValue = (val) =>
    setPerLegFeature("trailSlTrailingValue", val);

  useEffect(() => {
    const scripts = getValues("StrategyScriptList") || [];
    if (!scripts.length) return;

    const base = { ...(scripts[0] || {}) };
    const longArr = Array.isArray(base.LongEquationoptionStrikeList)
      ? [...base.LongEquationoptionStrikeList]
      : [];
    const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
      ? [...base.ShortEquationoptionStrikeList]
      : [];

    let updated = false;

    while (longArr.length <= activeLegIndex) {
      longArr.push(createDefaultStrike());
      updated = true;
    }

    if (!isTimeStrategy) {
      while (shortArr.length <= activeLegIndex) {
        shortArr.push(createDefaultStrike());
        updated = true;
      }
    }

    if (!updated) return;

    const next = [
      {
        ...base,
        LongEquationoptionStrikeList: longArr,
        ...(isTimeStrategy ? {} : { ShortEquationoptionStrikeList: shortArr }),
      },
    ];

    setValue("StrategyScriptList", next, { shouldDirty: true });
    updatePayload({ StrategyScriptList: next });
  }, [activeLegIndex, getValues, isTimeStrategy, setValue, updatePayload]);

  useEffect(() => {
    if (!effectiveLotSize || !existingActiveStrike) return;
    const currentQty = Number(existingActiveStrike.Qty) || 0;
    if (currentQty > 0) return;

    applyStrikeUpdate(({ longStrike, shortStrike }) => {
      const defaultQty = String(effectiveLotSize);
      longStrike.Qty = defaultQty;
      longStrike.lotSize = effectiveLotSize;
      if (shortStrike) {
        shortStrike.Qty = defaultQty;
        shortStrike.lotSize = effectiveLotSize;
      }
    });
  }, [effectiveLotSize, existingActiveStrike, applyStrikeUpdate]);

  useEffect(() => {
    if (!existingActiveStrike) return;

    const wtMapRev = {
      "wtpr_-": "% ↓",
      wt_eq: "% ↑",
      "wtpt_+": "pt ↑",
      "wtpt_-": "pt ↓",
    };

    const wait = existingActiveStrike.waitNTrade;
    // Prevent writer effects from running while hydrating Zustand per-leg features
    hydratingRef.current = true;
    try {
      if (wait?.isWaitnTrade) {
        if (!waitTradeEnabled) setWaitTradeEnabled(true);
        const movement = Number(wait.MovementValue) || 0;
        if (waitTradeMovement !== movement) setWaitTradeMovement(movement);
        const label = wtMapRev[wait.typeId] || "% ↑";
        if (waitTradeType !== label) setWaitTradeType(label);
      }

      if (existingActiveStrike.IsPriceDiffrenceConstrant) {
        const value =
          Number(existingActiveStrike.PriceDiffrenceConstrantValue) || 0;
        if (!premiumDiffEnabled) setPremiumDiffEnabled(true);
        if (premiumDiffValue !== value) setPremiumDiffValue(value);
      }

      if (existingActiveStrike.reEntry?.isRentry) {
        const rentryTypeMap = {
          REX: "ReExecute",
          REN: "ReEntry On Close",
          RENC: "ReEntry On Cost",
        };
        const exec =
          rentryTypeMap[existingActiveStrike.reEntry.RentryType] || "ReExecute";
        if (!reEntryEnabled) setReEntryEnabled(true);
        if (reEntryExecutionType !== exec) setReEntryExecutionType(exec);
        const cycles = Number(existingActiveStrike.reEntry.TradeCycle) || 1;
        if (reEntryCycles !== cycles) setReEntryCycles(cycles);
        const action =
          existingActiveStrike.reEntry.RentryActionTypeId || "IMMDT";
        if (reEntryActionType !== action) setReEntryActionType(action);
      }

      if (existingActiveStrike.isTrailSL && existingActiveStrike.TrailingSL) {
        if (!trailSlEnabled) setTrailSlEnabled(true);
        const typeLabel =
          existingActiveStrike.TrailingSL.TrailingType === "tslpt" ? "Pt" : "%";
        if (trailSlType !== typeLabel) setTrailSlType(typeLabel);
        const movement =
          Number(existingActiveStrike.TrailingSL.InstrumentMovementValue) || 0;
        if (trailSlPriceMovement !== movement)
          setTrailSlPriceMovement(movement);
        const trailing =
          Number(existingActiveStrike.TrailingSL.TrailingValue) || 0;
        if (trailSlTrailingValue !== trailing)
          setTrailSlTrailingValue(trailing);
      }
    } finally {
      // Release on next tick so writer effects see updated store values and won't bounce
      setTimeout(() => {
        hydratingRef.current = false;
      }, 0);
    }
  }, [existingActiveStrike, activeLegIndex]);

  useEffect(() => {
    if (hydratingRef.current) return;
    const mapWaitTradeType = (label) => {
      const meta = {
        "% ↓": { isPerPt: "wtpr_-", typeId: "wtpr_-" },
        "% ↑": { isPerPt: "wt_eq", typeId: "wt_eq" },
        "pt ↑": { isPerPt: "wtpt_+", typeId: "wtpt_+" },
        "pt ↓": { isPerPt: "wtpt_-", typeId: "wtpt_-" },
        Equal: { isPerPt: "wt_eq", typeId: "wt_eq" },
      };
      return meta[label] || meta["% ↑"];
    };

    applyStrikeUpdate(({ longStrike, shortStrike }) => {
      const meta = mapWaitTradeType(waitTradeType);
      const globalEnabled = advanceFeatures?.["Wait & Trade"];

      const applyToStrike = (strike) => {
        const prev = strike.waitNTrade || {};
        const effectiveEnabled =
          waitTradeEnabled || prev.isWaitnTrade || globalEnabled;

        if (!effectiveEnabled) {
          strike.waitNTrade = {
            isWaitnTrade: false,
            isPerPt: meta.isPerPt,
            typeId: meta.typeId,
            MovementValue: "0",
          };
          return;
        }

        if (waitTradeEnabled) {
          strike.waitNTrade = {
            isWaitnTrade: true,
            isPerPt: meta.isPerPt,
            typeId: meta.typeId,
            MovementValue: String(waitTradeMovement || 0),
          };
          return;
        }

        if (globalEnabled) {
          const globalType =
            advanceFeatures?.WaitTradeType || prev.typeId || meta.typeId;
          const globalMovement =
            advanceFeatures?.WaitTradeMovement ?? prev.MovementValue ?? "0";
          strike.waitNTrade = {
            isWaitnTrade: true,
            isPerPt: globalType,
            typeId: globalType,
            MovementValue: String(globalMovement),
          };
          return;
        }

        if (prev.isWaitnTrade) {
          strike.waitNTrade = { ...prev };
          return;
        }

        strike.waitNTrade = {
          isWaitnTrade: false,
          isPerPt: meta.isPerPt,
          typeId: meta.typeId,
          MovementValue: "0",
        };
      };

      applyToStrike(longStrike);
      if (shortStrike) applyToStrike(shortStrike);
    });
  }, [
    waitTradeEnabled,
    waitTradeMovement,
    waitTradeType,
    advanceFeatures,
    applyStrikeUpdate,
  ]);

  useEffect(() => {
    if (hydratingRef.current) return;
    applyStrikeUpdate(({ longStrike, shortStrike }) => {
      const globalEnabled = advanceFeatures?.["Premium Difference"];
      const globalValue = advanceFeatures?.PremiumDifferenceValue;

      const applyToStrike = (strike) => {
        const effectiveEnabled =
          premiumDiffEnabled ||
          strike.IsPriceDiffrenceConstrant ||
          globalEnabled;

        if (!effectiveEnabled) {
          strike.IsPriceDiffrenceConstrant = false;
          strike.PriceDiffrenceConstrantValue = String(
            strike.PriceDiffrenceConstrantValue || "0"
          );
          return;
        }

        const value = premiumDiffEnabled
          ? Number(premiumDiffValue) || 0
          : globalValue !== undefined
          ? Number(globalValue) || 0
          : Number(strike.PriceDiffrenceConstrantValue) || 0;

        strike.IsPriceDiffrenceConstrant = value > 0;
        strike.PriceDiffrenceConstrantValue = String(value);
      };

      applyToStrike(longStrike);
      if (shortStrike) applyToStrike(shortStrike);
    });
  }, [
    premiumDiffEnabled,
    premiumDiffValue,
    advanceFeatures,
    applyStrikeUpdate,
  ]);

  useEffect(() => {
    if (hydratingRef.current) return;
    const mapUiToCode = {
      ReExecute: "REX",
      "ReEntry On Close": "REN",
      "ReEntry On Cost": "RENC",
    };
    const mapCodeToUi = {
      REX: "ReExecute",
      REN: "ReEntry On Close",
      RENC: "ReEntry On Cost",
    };

    applyStrikeUpdate(({ longStrike, shortStrike }) => {
      const globalEnabled = advanceFeatures?.["Re Entry/Execute"];

      const applyToStrike = (strike) => {
        const prev = strike.reEntry || {};
        const effectiveEnabled =
          reEntryEnabled || prev.isRentry || globalEnabled;

        if (!effectiveEnabled) {
          strike.reEntry = {
            isRentry: false,
            RentryType: "REX",
            TradeCycle: "0",
            RentryActionTypeId: "IMMDT",
          };
          return;
        }

        const executionType = reEntryEnabled
          ? reEntryExecutionType
          : advanceFeatures?.ReEntryExecutionType ||
            mapCodeToUi[prev.RentryType] ||
            "ReExecute";

        const cycles = reEntryEnabled
          ? Number(reEntryCycles) || 1
          : Number(advanceFeatures?.ReEntryCycles || prev.TradeCycle || 1);

        let actionType = reEntryEnabled
          ? reEntryActionType
          : advanceFeatures?.ReEntryActionType ||
            prev.RentryActionTypeId ||
            "IMMDT";

        // RentryActionTypeId can only be "ON_CLOSE" or "IMMDT"
        if (executionType === "ReEntry On Close") {
          actionType = "ON_CLOSE";
        } else {
          // For ReEntry On Cost and ReExecute, use IMMDT
          actionType = "IMMDT";
        }

        strike.reEntry = {
          isRentry: true,
          RentryType: mapUiToCode[executionType] || "REX",
          TradeCycle: String(Math.max(1, cycles)),
          RentryActionTypeId: actionType,
        };
      };

      applyToStrike(longStrike);
      if (shortStrike) applyToStrike(shortStrike);
    });
  }, [
    reEntryEnabled,
    reEntryExecutionType,
    reEntryCycles,
    reEntryActionType,
    advanceFeatures,
    applyStrikeUpdate,
  ]);

  useEffect(() => {
    if (hydratingRef.current) return;
    applyStrikeUpdate(({ longStrike, shortStrike }) => {
      const globalEnabled = advanceFeatures?.["Trail SL"];

      const applyToStrike = (strike) => {
        const prev = strike.TrailingSL || {};
        const effectiveEnabled =
          trailSlEnabled || strike.isTrailSL || globalEnabled;

        if (!effectiveEnabled) {
          strike.isTrailSL = false;
          strike.TrailingSL = {
            TrailingType: "tslpr",
            InstrumentMovementValue: "0",
            TrailingValue: "0",
          };
          return;
        }

        const effectiveType = trailSlEnabled
          ? trailSlType
          : advanceFeatures?.TrailSlType ||
            (prev.TrailingType === "tslpt" ? "Pt" : "%");

        const movement = trailSlEnabled
          ? Number(trailSlPriceMovement) || 0
          : Number(
              advanceFeatures?.TrailSlPriceMovement ??
                prev.InstrumentMovementValue ??
                0
            );

        const trailing = trailSlEnabled
          ? Number(trailSlTrailingValue) || 0
          : Number(
              advanceFeatures?.TrailSlTrailingValue ?? prev.TrailingValue ?? 0
            );

        strike.isTrailSL = true;
        strike.TrailingSL = {
          TrailingType: effectiveType === "Pt" ? "tslpt" : "tslpr",
          InstrumentMovementValue: String(movement),
          TrailingValue: String(trailing),
        };
      };

      applyToStrike(longStrike);
      if (shortStrike) applyToStrike(shortStrike);
    });
  }, [
    trailSlEnabled,
    trailSlType,
    trailSlPriceMovement,
    trailSlTrailingValue,
    advanceFeatures,
    applyStrikeUpdate,
  ]);

  const handleQtyMultiplierChange = useCallback(
    (nextMultiplier) => {
      if (!effectiveLotSize) return;
      const safeMultiplier = Math.max(1, nextMultiplier);
      const legQty = safeMultiplier * effectiveLotSize;
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const qtyString = String(legQty);
        longStrike.Qty = qtyString;
        longStrike.lotSize = effectiveLotSize;
        if (shortStrike) {
          shortStrike.Qty = qtyString;
          shortStrike.lotSize = effectiveLotSize;
        }
      });
    },
    [applyStrikeUpdate, effectiveLotSize]
  );

  const handlePositionChange = useCallback(
    (nextPosition) => {
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.TransactionType = nextPosition;
        if (shortStrike) {
          shortStrike.TransactionType = nextPosition;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleOptionTypeChange = useCallback(
    (nextType) => {
      const strikeSymbol = nextType === "Call" ? "CE" : "PE";
      applyStrikeUpdate(({ longStrike }) => {
        longStrike.StrikeType = strikeSymbol;
      });
    },
    [applyStrikeUpdate]
  );

  const handleIndicatorConditionChange = useCallback(
    (next) => {
      const shortValue = next === "CE" ? "PE" : "CE";
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.StrikeType = next;
        if (shortStrike) {
          shortStrike.StrikeType = shortValue;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleExpiryChange = useCallback(
    (value) => {
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.ExpiryType = value;
        if (shortStrike) {
          shortStrike.ExpiryType = value;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleStrikeCriteriaChange = useCallback(
    (criteria) => {
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const strikeObj = {
          type: strikeCriteriaToType(criteria),
          StrikeValue: 0,
          RangeFrom: 0,
          RangeTo: 0,
        };
        longStrike.strikeTypeobj = strikeObj;
        if (shortStrike) {
          shortStrike.strikeTypeobj = { ...strikeObj };
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleStrikeSelectValueChange = useCallback(
    (value) => {
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const strikeObj = {
          type: strikeCriteriaToType(selectedStrikeCriteria),
          StrikeValue: parseStrikeToken(value),
          RangeFrom: 0,
          RangeTo: 0,
        };
        longStrike.strikeTypeobj = strikeObj;
        if (shortStrike) {
          shortStrike.strikeTypeobj = { ...strikeObj };
        }
      });
    },
    [applyStrikeUpdate, selectedStrikeCriteria]
  );

  const handleStrikeNumberChange = useCallback(
    (value) => {
      const numeric = Math.max(0, Number(value) || 0);
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const strikeObj = {
          type: strikeCriteriaToType(selectedStrikeCriteria),
          StrikeValue: numeric,
          RangeFrom: 0,
          RangeTo: 0,
        };
        longStrike.strikeTypeobj = strikeObj;
        if (shortStrike) {
          shortStrike.strikeTypeobj = { ...strikeObj };
        }
      });
    },
    [applyStrikeUpdate, selectedStrikeCriteria]
  );

  const handleSlTypeChange = useCallback(
    (label) => {
      const code = label === "SL pt" ? "slpt" : "slpr";
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.SLType = code;
        if (shortStrike) {
          shortStrike.SLType = code;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleStopLossChange = useCallback(
    (value) => {
      const formatted =
        value === "" ? "" : String(Math.max(0, Number(value) || 0));
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.StopLoss = formatted;
        if (shortStrike) {
          shortStrike.StopLoss = formatted;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleSlActionChange = useCallback(
    (label) => {
      const code = label === "On Close" ? "ONCLOSE" : "ONPRICE";
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.SLActionTypeId = code;
        if (shortStrike) {
          shortStrike.SLActionTypeId = code;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleTpTypeChange = useCallback(
    (label) => {
      const code = label === "TP pt" ? "tgpt" : "tgpr";
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.TargetType = code;
        if (shortStrike) {
          shortStrike.TargetType = code;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleTargetChange = useCallback(
    (value) => {
      const formatted =
        value === "" ? "" : String(Math.max(0, Number(value) || 0));
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.Target = formatted;
        if (shortStrike) {
          shortStrike.Target = formatted;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handleTpActionChange = useCallback(
    (label) => {
      const code = label === "On Close" ? "ONCLOSE" : "ONPRICE";
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.TargetActionTypeId = code;
        if (shortStrike) {
          shortStrike.TargetActionTypeId = code;
        }
      });
    },
    [applyStrikeUpdate]
  );

  const handlePrePunchToggle = useCallback(() => {
    const next = !prePunchSL;
    applyStrikeUpdate(({ longStrike, shortStrike }) => {
      longStrike.isPrePunchSL = next;
      if (shortStrike) {
        shortStrike.isPrePunchSL = next;
      }
    });
  }, [applyStrikeUpdate, prePunchSL]);

  const handleTradeOnTriggerToggle = () => {
    setValue("isTradeOnTriggerCandle", !tradeOnTriggerCandle, {
      shouldDirty: true,
    });
  };

  const handleBuyWhenChange = (value) => {
    setValue("BuyWhen", value, { shouldDirty: true });
  };

  const handleShortWhenChange = (value) => {
    setValue("ShortWhen", value, { shouldDirty: true });
  };

  const handleContinuousToggle = () => {
    setValue("IsContiniousTriggerCandle", !ofContinuousCandle, {
      shouldDirty: true,
    });
  };

  // compute disabled state when no instrument selected
  const isDisabled = !selectedInstrument || !selectedInstrument.InstrumentToken;
  const showComingSoon = comingSoon || selectedStrategyTypes?.[0] === "price";

  // ✅ Initialize legs from form or create first leg (moved from OrderType)
  useEffect(() => {
    const scripts = getValues("StrategyScriptList") || [];
    const firstScript = scripts[0] || {};
    const longList = Array.isArray(firstScript.LongEquationoptionStrikeList)
      ? firstScript.LongEquationoptionStrikeList
      : [];
    const shortList = Array.isArray(firstScript.ShortEquationoptionStrikeList)
      ? firstScript.ShortEquationoptionStrikeList
      : [];
    // Use whichever list has more legs (for edit mode compatibility)
    const count = Math.max(1, longList.length, shortList.length);
    const newLegs = Array.from({ length: count }, (_, i) => `L${i + 1}`);
    setLegs(newLegs);
    // ensure ActiveLegIndex exists
    if (getValues("ActiveLegIndex") === undefined) {
      setValue("ActiveLegIndex", 0, { shouldDirty: false });
    }
    setSelectedLeg(`L${(getValues("ActiveLegIndex") ?? 0) + 1}`);
  }, []);

  // ✅ Sync legs state whenever StrategyScriptList changes (delete/copy from Leg1)
  useEffect(() => {
    if (!strategyScripts || !strategyScripts[0]) return;

    const longList = strategyScripts[0].LongEquationoptionStrikeList || [];
    const shortList = strategyScripts[0].ShortEquationoptionStrikeList || [];
    // Use whichever list has more legs (for edit mode compatibility)
    const count = Math.max(1, longList.length, shortList.length);
    const newLegs = Array.from({ length: count }, (_, i) => `L${i + 1}`);

    // Only update if legs count changed
    if (newLegs.length !== legs.length) {
      setLegs(newLegs);

      // Ensure selected leg is valid
      const currentIndex = activeLegIndex;
      if (currentIndex >= newLegs.length) {
        const adjustedIndex = Math.max(0, newLegs.length - 1);
        setSelectedLeg(`L${adjustedIndex + 1}`);
        setValue("ActiveLegIndex", adjustedIndex, { shouldDirty: true });
      } else {
        setSelectedLeg(`L${currentIndex + 1}`);
      }
    }
  }, [strategyScripts, activeLegIndex, legs.length, setValue]);

  // ✅ Sync selectedLeg with form ActiveLegIndex
  useEffect(() => {
    const index = Math.max(0, legs.indexOf(selectedLeg));
    setValue("ActiveLegIndex", index, { shouldDirty: true });
  }, [selectedLeg, legs, setValue]);

  const exchange =
    selectedInstrument?.Exchange || selectedInstrument?.Segment || "";

  const featureWaitTradeActive =
    waitTradeEnabled || advanceFeatures?.["Wait & Trade"];
  const featurePremiumActive =
    premiumDiffEnabled || advanceFeatures?.["Premium Difference"];
  const featureReEntryActive =
    reEntryEnabled || advanceFeatures?.["Re Entry/Execute"];
  const featureTrailSlActive = trailSlEnabled || advanceFeatures?.["Trail SL"];
  const showTrailSlForIndicator = selectedStrategyTypes?.[0] === "indicator";

  const handleAddLeg = () => {
    try {
      const idx = legs.length;
      const nextLegName = `L${idx + 1}`;

      const updateFormState = () => {
        setLegs((prevLegs) => [...prevLegs, nextLegName]);
        setSelectedLeg(nextLegName);

        const scripts = getValues("StrategyScriptList") || [];
        const base = { ...(scripts[0] || {}) };

        const longArr = Array.isArray(base.LongEquationoptionStrikeList)
          ? [...base.LongEquationoptionStrikeList]
          : [];

        const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
          ? [...base.ShortEquationoptionStrikeList]
          : [];

        const newStrike = createDefaultStrike();

        const isIndicator = selectedStrategyTypes?.[0] === "indicator";
        longArr.push(newStrike);

        if (isIndicator) {
          shortArr.push({ ...newStrike });
        }

        base.LongEquationoptionStrikeList = longArr;
        if (isIndicator) {
          base.ShortEquationoptionStrikeList = shortArr;
        }

        const updated = [base];
        setValue("StrategyScriptList", updated, { shouldDirty: true });
        setValue("ActiveLegIndex", idx, { shouldDirty: true });

        updatePayload({ StrategyScriptList: updated });
      };

      setTimeout(updateFormState, 0);
    } catch (err) {
      console.error("Add leg error", err);
    }
  };

  // When combined chart is enabled for indicator strategy, ensure at least 2 legs
  useEffect(() => {
    if (isChartOnOptionStrike && isIndicatorStrategy && legs.length < 2) {
      try {
        const idx = legs.length;
        const nextLegName = `L${idx + 1}`;

        const updateFormState = () => {
          setLegs((prevLegs) => [...prevLegs, nextLegName]);
          setSelectedLeg(nextLegName);

          const scripts = getValues("StrategyScriptList") || [];
          const base = { ...(scripts[0] || {}) };

          const longArr = Array.isArray(base.LongEquationoptionStrikeList)
            ? [...base.LongEquationoptionStrikeList]
            : [];

          const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
            ? [...base.ShortEquationoptionStrikeList]
            : [];

          const newStrike = createDefaultStrike();

          const isIndicator = selectedStrategyTypes?.[0] === "indicator";
          longArr.push(newStrike);

          if (isIndicator) {
            shortArr.push({ ...newStrike });
          }

          base.LongEquationoptionStrikeList = longArr;
          if (isIndicator) {
            base.ShortEquationoptionStrikeList = shortArr;
          }

          const updated = [base];
          setValue("StrategyScriptList", updated, { shouldDirty: true });
          setValue("ActiveLegIndex", idx, { shouldDirty: true });

          updatePayload({ StrategyScriptList: updated });
        };

        setTimeout(updateFormState, 0);
      } catch (err) {
        console.error("Add leg error", err);
      }
    }
  }, [
    isChartOnOptionStrike,
    legs.length,
    selectedStrategyTypes,
    getValues,
    setValue,
    updatePayload,
  ]);

  // ✅ Remove leg handler (moved from OrderType)
  const handleRemoveLeg = (removeIndex) => {
    try {
      const minLegs = isChartOnOptionStrike && isIndicatorStrategy ? 2 : 1;
      if (legs.length <= minLegs) return; // Keep at least minLegs legs

      const updateFormState = () => {
        const scripts = getValues("StrategyScriptList") || [];
        const base = { ...(scripts[0] || {}) };

        const longArr = Array.isArray(base.LongEquationoptionStrikeList)
          ? [...base.LongEquationoptionStrikeList]
          : [];

        const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
          ? [...base.ShortEquationoptionStrikeList]
          : [];

        // Remove at index
        if (removeIndex >= 0 && removeIndex < longArr.length) {
          longArr.splice(removeIndex, 1);
        }

        if (
          shortArr.length &&
          removeIndex >= 0 &&
          removeIndex < shortArr.length
        ) {
          shortArr.splice(removeIndex, 1);
        }

        // Edge case: ensure at least one leg remains
        const isIndicator = selectedStrategyTypes?.[0] === "indicator";
        if (longArr.length === 0) {
          longArr.push(createDefaultStrike());
          if (isIndicator) {
            shortArr.push(createDefaultStrike());
          }
        }

        base.LongEquationoptionStrikeList = longArr;
        if (isIndicator) {
          base.ShortEquationoptionStrikeList = shortArr;
        }

        // Calculate new legs and active index
        const newCount = longArr.length;
        const newLegs = Array.from({ length: newCount }, (_, i) => `L${i + 1}`);

        const currentIndex = Math.max(0, legs.indexOf(selectedLeg));
        let newSelectedIndex = currentIndex;

        if (removeIndex === currentIndex) {
          newSelectedIndex = Math.min(removeIndex, newCount - 1);
        } else if (removeIndex < currentIndex) {
          newSelectedIndex = Math.max(0, currentIndex - 1);
        }

        const updated = [base];
        setValue("StrategyScriptList", updated, { shouldDirty: true });
        setValue("ActiveLegIndex", newSelectedIndex, { shouldDirty: true });

        updatePayload({ StrategyScriptList: updated });

        setLegs(newLegs);
        setSelectedLeg(`L${newSelectedIndex + 1}`);
      };

      setTimeout(updateFormState, 0);
    } catch (err) {
      console.error("Remove leg error", err);
    }
  };

  const handleSelectLeg = (index) => {
    const legName = legs[index];
    if (!legName) return;
    setSelectedLeg(legName);
    setValue("ActiveLegIndex", index, { shouldDirty: true });
  };

  // ✅ Delete leg handler
  const handleDeleteLeg = () => {
    const scripts = getValues("StrategyScriptList") || [];
    if (!scripts[0]) return;

    const longStrikes = scripts[0].LongEquationoptionStrikeList || [];
    const shortStrikes = scripts[0].ShortEquationoptionStrikeList || [];

    if (longStrikes.length <= 1) return; // Keep at least 1 leg

    // Remove current active leg
    longStrikes.splice(activeLegIndex, 1);
    if (shortStrikes.length > activeLegIndex) {
      shortStrikes.splice(activeLegIndex, 1);
    }

    const updated = [
      {
        ...scripts[0],
        LongEquationoptionStrikeList: longStrikes,
        ShortEquationoptionStrikeList: shortStrikes,
      },
    ];

    setValue("StrategyScriptList", updated, { shouldDirty: true });
    updatePayload({ StrategyScriptList: updated });

    // Adjust active leg index
    const newIndex = Math.max(
      0,
      Math.min(activeLegIndex, longStrikes.length - 1)
    );
    setValue("ActiveLegIndex", newIndex, { shouldDirty: true });
  };

  // ✅ Copy leg handler
  const handleCopyLeg = () => {
    const scripts = getValues("StrategyScriptList") || [];
    if (!scripts[0]) return;

    const longStrikes = scripts[0].LongEquationoptionStrikeList || [];
    const shortStrikes = scripts[0].ShortEquationoptionStrikeList || [];

    // Clone current active leg
    const clonedLong = JSON.parse(JSON.stringify(longStrikes[activeLegIndex]));
    const clonedShort = shortStrikes[activeLegIndex]
      ? JSON.parse(JSON.stringify(shortStrikes[activeLegIndex]))
      : null;

    // Insert clones after current leg
    longStrikes.splice(activeLegIndex + 1, 0, clonedLong);
    if (clonedShort) {
      shortStrikes.splice(activeLegIndex + 1, 0, clonedShort);
    }

    const updated = [
      {
        ...scripts[0],
        LongEquationoptionStrikeList: longStrikes,
        ShortEquationoptionStrikeList: shortStrikes,
      },
    ];

    setValue("StrategyScriptList", updated, { shouldDirty: true });
    updatePayload({ StrategyScriptList: updated });

    // Switch to newly copied leg
    setValue("ActiveLegIndex", activeLegIndex + 1, { shouldDirty: true });
  };

  return (
    // changed: added relative group container
    <div className="relative group">
      {showComingSoon && <ComingSoonOverlay />}
      {/* Hover overlay when no instrument selected */}
      {!selectedInstrument && !showComingSoon && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center
                     bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity
                     text-white text-sm font-semibold rounded-2xl select-none"
        >
          Select Instrument
        </div>
      )}
      <div className="p-4 border rounded-2xl space-y-4 bg-white dark:border-[#1E2027] dark:bg-[#131419] text-black dark:text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm font-semibold text-black dark:text-white">
            Strategy Legs
          </div>
          {chartType !== "options" && (
            <PrimaryButton
              type="button"
              onClick={handleAddLeg}
              className="px-5 py-2 text-sm"
            >
              + Add Leg
            </PrimaryButton>
          )}
        </div>

        <div className="space-y-3">
          {legs.map((leg, idx) => {
            const isActive = idx === activeLegIndex;
            const summary = getLegSummary(idx);
            return (
              <div
                key={leg}
                className={`rounded-xl border transition-colors ${
                  isActive
                    ? "border-blue-300 bg-blue-50/40 dark:border-[#0F3F62] dark:bg-[#0F3F62]/10"
                    : "border-gray-200 bg-white dark:border-[#2C2F36] dark:bg-[#1E2027]"
                }`}
              >
                <div
                  className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 ${
                    isActive ? "cursor-default" : "cursor-pointer"
                  }`}
                  onClick={() => !isActive && handleSelectLeg(idx)}
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {`Leg ${idx + 1}`}
                      {summary.title && (
                        <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-300">
                          {summary.title}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {summary.subtitle || "Configure leg parameters"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="px-2 py-1 text-[10px] font-semibold uppercase rounded-full bg-blue-100 text-blue-700 dark:bg-[#0F3F62]/40 dark:text-blue-200">
                        Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectLeg(idx)}
                        className="px-3 py-1.5 text-xs font-medium border rounded-lg text-blue-600 border-blue-300 dark:text-blue-200 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-[#0F3F62]/30 transition"
                      >
                        Edit
                      </button>
                    )}
                    {legs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLeg(idx);
                        }}
                        className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="px-4 pb-4 pt-3 space-y-4 border-t border-dashed border-gray-200 dark:border-[#2C2F36]">
                    {selectedStrategyTypes?.[0] === "indicator" && (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        {(transactionType === 0 || transactionType === 1) && (
                          <div>
                            <label className="block mb-1 text-green-600 font-medium">
                              When Long Condition
                            </label>
                            <select
                              className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                              disabled={isDisabled}
                              value={longCondition}
                              onChange={(e) =>
                                handleIndicatorConditionChange(e.target.value)
                              }
                            >
                              {conditionOptions.map((opt) => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {(transactionType === 0 || transactionType === 2) && (
                          <div>
                            <label className="block mb-1 text-red-500 font-medium">
                              When Short Condition
                            </label>
                            <select
                              className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                              disabled={isDisabled}
                              value={shortCondition}
                              onChange={(e) =>
                                handleIndicatorConditionChange(
                                  e.target.value === "CE" ? "PE" : "CE"
                                )
                              }
                            >
                              {conditionOptions.map((opt) => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        )}
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
                              !isDisabled &&
                              handleQtyMultiplierChange(qtyMultiplier - 1)
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
                            onClick={() =>
                              !isDisabled &&
                              handleQtyMultiplierChange(qtyMultiplier + 1)
                            }
                            className="px-2 py-1 border rounded dark:border-[#2C2F36]"
                            disabled={isDisabled || effectiveLotSize === 0}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-[10px] mt-1 text-gray-500 dark:text-gray-500">
                          Multiples of lot ({effectiveLotSize || "-"})
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
                              onClick={() => handlePositionChange(pos)}
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
                                onClick={() => handleOptionTypeChange(type)}
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
                          disabled={
                            isDisabled ||
                            productType === "CNC" ||
                            productType === "BTST"
                          }
                          value={
                            productType === "CNC" || productType === "BTST"
                              ? "WEEKLY"
                              : expiryType
                          }
                          onChange={(e) => handleExpiryChange(e.target.value)}
                        >
                          {expiryOptions.map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 text-gray-600 dark:text-gray-400">
                          Strike Criteria
                        </label>
                        <select
                          className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                          value={selectedStrikeCriteria}
                          onChange={(e) =>
                            handleStrikeCriteriaChange(e.target.value)
                          }
                          disabled={isDisabled}
                        >
                          {strikeCriteriaOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 text-gray-600 dark:text-gray-400">
                          Strike Type
                        </label>
                        {isATMMode ? (
                          <select
                            className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                            value={strikeTypeSelectValue}
                            onChange={(e) =>
                              handleStrikeSelectValueChange(e.target.value)
                            }
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
                              handleStrikeNumberChange(e.target.value)
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
                          SL Type
                        </label>
                        <select
                          className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                          disabled={isDisabled}
                          value={slTypeSel}
                          onChange={(e) => handleSlTypeChange(e.target.value)}
                        >
                          {slOptions.map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-600 dark:text-gray-400">
                          SL
                        </label>
                        <input
                          type="number"
                          value={stopLossQty}
                          onChange={(e) =>
                            !isDisabled && handleStopLossChange(e.target.value)
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
                          onChange={(e) => handleSlActionChange(e.target.value)}
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
                          TP Type
                        </label>
                        <select
                          className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                          disabled={isDisabled}
                          value={tpTypeSel}
                          onChange={(e) => handleTpTypeChange(e.target.value)}
                        >
                          {tpOptions.map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-gray-600 dark:text-gray-400">
                          TP
                        </label>
                        <input
                          type="number"
                          value={targetValue}
                          onChange={(e) =>
                            !isDisabled && handleTargetChange(e.target.value)
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
                          onChange={(e) => handleTpActionChange(e.target.value)}
                        >
                          {onPriceOptions.map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(featureWaitTradeActive ||
                      featurePremiumActive ||
                      featureReEntryActive ||
                      featureTrailSlActive ||
                      showTrailSlForIndicator) && (
                      <div className="mt-2 space-y-3">
                        {!showTrailSlForIndicator && (
                          <div className="text-[11px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
                            --- Advance Features ---
                          </div>
                        )}
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
                                  onChange={(e) =>
                                    setWaitTradeType(e.target.value)
                                  }
                                >
                                  {["% ↓", "% ↑", "pt ↑", "pt ↓", "Equal"].map(
                                    (o) => (
                                      <option key={o}>{o}</option>
                                    )
                                  )}
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
                                value={premiumDiffValue}
                                min={0}
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    Number(e.target.value) || 0
                                  );
                                  setPremiumDiffValue(val);
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
                                  <option value="ReExecute">ReExecute</option>
                                  <option value="ReEntry On Cost">
                                    ReEntry On Cost
                                  </option>
                                  <option value="ReEntry On Close">
                                    ReEntry On Close
                                  </option>
                                </select>
                              </div>
                              <div>
                                <label className="block mb-1 text-gray-600 dark:text-gray-400">
                                  Action Type
                                </label>
                                <select
                                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                                  value={reEntryActionType}
                                  onChange={(e) =>
                                    setReEntryActionType(e.target.value)
                                  }
                                  disabled={
                                    reEntryExecutionType ===
                                      "ReEntry On Cost" ||
                                    reEntryExecutionType === "ReEntry On Close"
                                  }
                                >
                                  <option value="ON_CLOSE">On Close</option>
                                  <option value="IMMDT">Immediate</option>
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
                          {(featureTrailSlActive ||
                            showTrailSlForIndicator) && (
                            <>
                              <div>
                                <label className="block mb-1 text-gray-600 dark:text-gray-400">
                                  Trail SL Type
                                </label>
                                <select
                                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                                  value={trailSlType}
                                  onChange={(e) =>
                                    setTrailSlType(e.target.value)
                                  }
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
                            onChange={handlePrePunchToggle}
                            disabled={isDisabled}
                          />
                          <span>
                            Pre Punch SL{" "}
                            <span className="text-[11px]">
                              (Advance Feature)
                            </span>
                          </span>
                        </label>
                      )}

                      <div className="flex space-x-4 text-xl text-gray-400 dark:text-gray-500">
                        <FiTrash2
                          className="text-red-500 cursor-pointer hover:text-red-600 transition"
                          onClick={handleDeleteLeg}
                          title="Delete leg"
                        />
                        <img
                          src={leg1CopyIcon}
                          className="cursor-pointer hover:opacity-75 transition"
                          onClick={handleCopyLeg}
                          alt="Copy leg"
                          title="Copy leg"
                        />
                      </div>
                    </div>

                    {selectedStrategyTypes?.[0] === "indicator" && (
                      <>
                        <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={signalCandleCondition}
                            onChange={() =>
                              setSignalCandleCondition(!signalCandleCondition)
                            }
                            disabled={isDisabled}
                          />
                          <span>
                            Add Signal Candle Condition{" "}
                            <span className="text-[11px] text-gray-400">
                              (Optional)
                            </span>
                          </span>
                        </label>

                        {signalCandleCondition && (
                          <div className="mt-4 p-4 border border-gray-200 dark:border-[#2C2F36] rounded-lg bg-gray-50 dark:bg-[#1A1D23] space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={tradeOnTriggerCandle}
                                  onChange={handleTradeOnTriggerToggle}
                                  disabled={isDisabled}
                                />
                                <span>Trade on Trigger Candle</span>
                              </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-400">
                                  Buy When
                                </label>
                                <select
                                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                                  value={buyWhen}
                                  onChange={(e) =>
                                    handleBuyWhenChange(e.target.value)
                                  }
                                  disabled={isDisabled}
                                >
                                  <option value="Low Break">Low Break</option>
                                  <option value="High Break">High Break</option>
                                </select>
                              </div>

                              <div>
                                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-400">
                                  Short When
                                </label>
                                <select
                                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                                  value={shortWhen}
                                  onChange={(e) =>
                                    handleShortWhenChange(e.target.value)
                                  }
                                  disabled={isDisabled}
                                >
                                  <option value="Low Break">Low Break</option>
                                  <option value="High Break">High Break</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={ofContinuousCandle}
                                  onChange={handleContinuousToggle}
                                  disabled={isDisabled}
                                />
                                <span>Of Continious Candle</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Leg1;
