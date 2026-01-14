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

const createDefaultStrikeBySide = (side) =>
  createDefaultStrike(side === "long" ? "PE" : "CE");

const Leg1 = ({
  selectedStrategyTypes,
  selectedInstrument,
  comingSoon = false,
  editing = false,
}) => {
  // Guard to prevent feedback loops when hydrating per-leg features from existing strikes
  const hydratingRef = useRef(false);
  // Track initial mount to avoid overwriting ExpiryType during edit mode load
  const initialMountRef = useRef(true);
  const { setValue, getValues, watch } = useFormContext();
  // Select stable store actions individually to avoid unnecessary rerenders
  const updatePayload = useStrategyBuilderStore((s) => s.updatePayload);
  const activeLegIndex = watch("ActiveLegIndex") ?? 0;
  const strategyScripts = watch("StrategyScriptList");
  const advanceFeatures = watch("AdvanceFeatures");
  const moveSlToCostActive = useMemo(() => {
    const scripts = strategyScripts || [];
    const first = scripts[0] || {};
    const longs = first.LongEquationoptionStrikeList || [];
    return longs.some((s) => s?.IsMoveSLCTC);
  }, [strategyScripts]);

  const rawBuyWhen = watch("BuyWhen");
  const rawShortWhen = watch("ShortWhen");
  const tradeOnTriggerCandle = watch("isTradeOnTriggerCandle") || false;
  const ofContinuousCandle = watch("IsContiniousTriggerCandle") || false;
  const isChartOnOptionStrike = watch("IsChartOnOptionStrike") || false;
  const chartType = isChartOnOptionStrike ?? watch("chartType") ?? null;
  const transactionType = watch("TransactionType") ?? 0;
  const allowShortSide = transactionType !== 1; // 0 = both, 2 = only short
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

  // Set default ExpiryType to WEEKLY for CNC and BTST (only if not already set during editing)
  useEffect(() => {
    if (productType === "CNC" || productType === "BTST") {
      const scripts = getValues("StrategyScriptList") || [];

      // If we're in edit mode and this is initial mount, skip overwriting existing values
      if (editing && initialMountRef.current) {
        initialMountRef.current = false;
        return;
      }

      const updatedScripts = scripts.map((script) => {
        const updatedLong = (script.LongEquationoptionStrikeList || []).map(
          (strike) => ({
            ...strike,
            // Preserve existing ExpiryType during editing, otherwise default to WEEKLY
            ExpiryType: strike.ExpiryType || "WEEKLY",
          })
        );
        const updatedShort = (script.ShortEquationoptionStrikeList || []).map(
          (strike) => ({
            ...strike,
            // Preserve existing ExpiryType during editing, otherwise default to WEEKLY
            ExpiryType: strike.ExpiryType || "WEEKLY",
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

    // Mark as not initial mount after first run
    if (!editing && initialMountRef.current) {
      initialMountRef.current = false;
    }
  }, [productType, setValue, getValues, editing]);

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
  const allExpiryOptions = ["WEEKLY", "NEXTWEEKLY", "MONTHLY"];

  // Filter expiry options based on instrument
  const expiryOptions = useMemo(() => {
    const instrumentName = selectedInstrument?.Name?.toUpperCase() || "";
    const isNiftyBankOrFinService =
      instrumentName.includes("NIFTY BANK") ||
      instrumentName.includes("NIFTYBANK") ||
      instrumentName.includes("NIFTY FIN SERVICE") ||
      instrumentName.includes("NIFTYFIN");

    return isNiftyBankOrFinService ? ["MONTHLY"] : allExpiryOptions;
  }, [selectedInstrument]);

  const slOptions = ["SL%", "SL pt"];
  const tpOptions = ["TP%", "TP pt"];
  const onPriceOptions = ["On Price", "On Close"];
  const conditionOptions = ["CE", "PE"];

  // NEW: strike criteria menu (as per screenshot)
  const strikeCriteriaOptions = [
    { label: "ATM pt", value: "ATM_PT" },
    { label: "ATM %", value: "ATM_PERCENT" },
    { label: "Delta", value: "DELTA_NEAR" },
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
    if (crit === "DELTA_NEAR") return "DELTANEAR";
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

  const detectUnitToken = (input) => {
    if (!input && input !== 0) return "";
    const token = String(input).toLowerCase();
    if (token.includes("pt")) return "pt";
    if (token.includes("%") || token.includes("pr")) return "%";
    return "";
  };

  const deriveUnitSuffix = (code, fallbackLabel = "") => {
    const normalizedCode = detectUnitToken(code);
    if (normalizedCode) return normalizedCode;
    return detectUnitToken(fallbackLabel);
  };

  const formatMetricWithUnit = (label, value, unitToken) => {
    if (value === undefined || value === null || value === "") return null;
    const base = String(value);
    const decorated =
      unitToken === "%" ? `${base}%` : unitToken === "pt" ? `${base} pt` : base;
    return `${label} ${decorated}`;
  };

  const formatStrikeSummary = (strikeObj) => {
    if (!strikeObj) return "ATM";
    const value = Number(strikeObj.StrikeValue) || 0;
    const abs = Math.abs(value);
    switch (strikeObj.type) {
      case "ATM":
        return value === 0
          ? "ATM"
          : `ATM ${value > 0 ? `+${abs}` : `-${abs}`} pts`;
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
      case "DELTANEAR": {
        const clamped = Math.min(
          1,
          Math.max(0, Number.isFinite(value) ? value : 0.5)
        );
        const display = clamped.toFixed(1);
        return `Delta ${display}`;
      }
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
    existingActiveStrike?.ExpiryType ||
    existingActiveLong?.ExpiryType ||
    existingActiveShort?.ExpiryType ||
    "WEEKLY";
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
    if (backendStrikeType === "DELTANEAR") return "DELTA_NEAR";
    return "ATM_PT";
  })();

  const strikeValueNumeric =
    Number(existingActiveStrike?.strikeTypeobj?.StrikeValue) || 0;
  const isATMMode =
    selectedStrikeCriteria === "ATM_PT" ||
    selectedStrikeCriteria === "ATM_PERCENT";
  const isDeltaCriteria = selectedStrikeCriteria === "DELTA_NEAR";

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
  const strikeTypeNumber = useMemo(() => {
    if (isATMMode) return "";
    const raw = existingActiveStrike?.strikeTypeobj?.StrikeValue;
    if (raw === undefined || raw === null) {
      return isDeltaCriteria ? "0.50" : "";
    }
    // Allow empty string to pass through (for clearing input)
    if (raw === "") return "";
    return String(raw);
  }, [existingActiveStrike, isATMMode, isDeltaCriteria]);

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

      const qtyValue = (() => {
        const numericQty = Number(sourceStrike?.Qty);
        if (Number.isFinite(numericQty) && numericQty > 0)
          return String(numericQty);
        if (sourceStrike?.Qty !== undefined && sourceStrike?.Qty !== null)
          return String(sourceStrike.Qty);
        return "";
      })();

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

      const actionLabel = [transaction, optionSymbol]
        .filter(Boolean)
        .join(" ")
        .trim();

      const slUnit = deriveUnitSuffix(
        sourceStrike?.SLType,
        isActive ? slTypeSel : undefined
      );
      const tpUnit = deriveUnitSuffix(
        sourceStrike?.TargetType,
        isActive ? tpTypeSel : undefined
      );

      const summaryBits = [
        actionLabel || null,
        instrumentName || null,
        qtyValue ? `Qty ${qtyValue}` : null,
        `Strike ${formatStrikeSummary(strikeObj)}`,
        formatMetricWithUnit("TP", targetText, tpUnit),
        formatMetricWithUnit("SL", stopLossText, slUnit),
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
      slTypeSel,
      tpTypeSel,
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
        longArr.push(createDefaultStrikeBySide("long"));
      }

      if (allowShortSide) {
        while (shortArr.length <= activeLegIndex) {
          shortArr.push(createDefaultStrikeBySide("short"));
        }
      }

      // Ensure indicator defaults keep long/short opposite when initializing
      if (isIndicatorStrategy) {
        const longDefault = longArr[activeLegIndex]?.StrikeType || "CE";
        longArr[activeLegIndex].StrikeType = longDefault;
        if (allowShortSide) {
          const shortDefault = longDefault === "CE" ? "PE" : "CE";
          shortArr[activeLegIndex].StrikeType =
            shortArr[activeLegIndex]?.StrikeType || shortDefault;
        }
      }

      const longStrike = { ...longArr[activeLegIndex] };
      const shortStrike = allowShortSide
        ? { ...shortArr[activeLegIndex] }
        : undefined;

      mutator({ longStrike, shortStrike });

      longArr[activeLegIndex] = longStrike;
      if (allowShortSide && shortStrike) {
        shortArr[activeLegIndex] = shortStrike;
      }

      const instrumentLot = selectedInstrument?.LotSize || 0;

      const nextBase = {
        ...base,
        LongEquationoptionStrikeList: longArr,
        ShortEquationoptionStrikeList: allowShortSide ? shortArr : [],
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
      allowShortSide,
      getValues,
      selectedInstrument,
      setValue,
      updatePayload,
    ]
  );

  // Advance feature values are now derived directly from strike data instead of local state
  // This ensures each leg maintains its own independent values

  // Derive Wait & Trade values from active strike
  const wtMapRev = {
    "wtpr_-": "% ↓",
    "wtpr_+": "% ↑",
    "wtpt_+": "pt ↑",
    "wtpt_-": "pt ↓",
  };
  const waitTradeMovement =
    existingActiveStrike?.waitNTrade?.MovementValue ?? "";
  const waitTradeType =
    wtMapRev[existingActiveStrike?.waitNTrade?.typeId] || "% ↑";

  // Derive Premium Difference value from active strike
  const premiumDiffValue =
    existingActiveStrike?.PriceDiffrenceConstrantValue ?? "";

  // Derive Re Entry values from active strike
  const rentryTypeMap = {
    REX: "ReExecute",
    REN: "ReEntry On Close",
    RENC: "ReEntry On Cost",
  };
  const reEntryExecutionType =
    rentryTypeMap[existingActiveStrike?.reEntry?.RentryType] || "ReExecute";
  const reEntryCycles = existingActiveStrike?.reEntry?.TradeCycle ?? "";
  const reEntryActionType =
    existingActiveStrike?.reEntry?.RentryActionTypeId || "IMMDT";

  // Derive Trail SL values from active strike
  const trailSlType =
    existingActiveStrike?.TrailingSL?.TrailingType === "tslpt" ? "Pt" : "%";
  const trailSlPriceMovement =
    existingActiveStrike?.TrailingSL?.InstrumentMovementValue ?? "";
  const trailSlTrailingValue =
    existingActiveStrike?.TrailingSL?.TrailingValue ?? "";

  // No need for reset effects - values are read directly from strike data per leg

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
      longArr.push(createDefaultStrikeBySide("long"));
      updated = true;
    }

    if (allowShortSide) {
      while (shortArr.length <= activeLegIndex) {
        shortArr.push(createDefaultStrikeBySide("short"));
        updated = true;
      }
    }

    if (!updated) return;

    const next = [
      {
        ...base,
        LongEquationoptionStrikeList: longArr,
        ShortEquationoptionStrikeList: allowShortSide ? shortArr : [],
      },
    ];

    setValue("StrategyScriptList", next, { shouldDirty: true });
    updatePayload({ StrategyScriptList: next });
  }, [activeLegIndex, allowShortSide, getValues, setValue, updatePayload]);

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

  // Handler functions for advance feature updates (called directly from onChange)
  const handleWaitTradeChange = useCallback(
    (type, movement) => {
      const mapWaitTradeType = (label) => {
        const meta = {
          "% ↓": { isPerPt: "wtpr_-", typeId: "wtpr_-" },
          "% ↑": { isPerPt: "wtpr_+", typeId: "wtpr_+" },
          "pt ↑": { isPerPt: "wtpt_+", typeId: "wtpt_+" },
          "pt ↓": { isPerPt: "wtpt_-", typeId: "wtpt_-" },
        };
        return meta[label] || meta["% ↑"];
      };

      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const meta = mapWaitTradeType(type);
        const applyToStrike = (strike) => {
          strike.waitNTrade = {
            isWaitnTrade: true,
            isPerPt: meta.isPerPt,
            typeId: meta.typeId,
            MovementValue: movement === "" ? "" : String(Number(movement) || 0),
          };
        };
        applyToStrike(longStrike);
        if (shortStrike) applyToStrike(shortStrike);
      });
    },
    [applyStrikeUpdate]
  );

  const handlePremiumDiffChange = useCallback(
    (value) => {
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const applyToStrike = (strike) => {
          strike.IsPriceDiffrenceConstrant = value !== "" && Number(value) > 0;
          strike.PriceDiffrenceConstrantValue =
            value === "" ? "" : String(Number(value) || 0);
        };
        applyToStrike(longStrike);
        if (shortStrike) applyToStrike(shortStrike);
      });
    },
    [applyStrikeUpdate]
  );

  const handleReEntryChange = useCallback(
    (executionType, cycles, actionType) => {
      const mapUiToCode = {
        ReExecute: "REX",
        "ReEntry On Close": "REN",
        "ReEntry On Cost": "RENC",
      };

      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const applyToStrike = (strike) => {
          let finalActionType = actionType;
          if (executionType === "ReEntry On Close") {
            finalActionType = "ON_CLOSE";
          } else {
            finalActionType = "IMMDT";
          }

          strike.reEntry = {
            isRentry: true,
            RentryType: mapUiToCode[executionType] || "REX",
            TradeCycle: cycles === "" ? "" : String(Number(cycles) || 1),
            RentryActionTypeId: finalActionType,
          };
        };
        applyToStrike(longStrike);
        if (shortStrike) applyToStrike(shortStrike);
      });
    },
    [applyStrikeUpdate]
  );

  const handleTrailSlChange = useCallback(
    (type, priceMovement, trailingValue) => {
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const applyToStrike = (strike) => {
          strike.isTrailSL = true;
          strike.TrailingSL = {
            TrailingType: type === "Pt" ? "tslpt" : "tslpr",
            InstrumentMovementValue:
              priceMovement === "" ? "" : String(Number(priceMovement) || 0),
            TrailingValue:
              trailingValue === "" ? "" : String(Number(trailingValue) || 0),
          };
        };
        applyToStrike(longStrike);
        if (shortStrike) applyToStrike(shortStrike);
      });
    },
    [applyStrikeUpdate]
  );

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
    ({ long, short }) => {
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        if (long) longStrike.StrikeType = long;
        if (shortStrike && short) shortStrike.StrikeType = short;
      });
    },
    [applyStrikeUpdate]
  );

  const handleExpiryChange = useCallback(
    (value) => {
      if (productType === "CNC") {
        const scripts = getValues("StrategyScriptList") || [];
        const updated = scripts.map((script) => {
          const longs = Array.isArray(script.LongEquationoptionStrikeList)
            ? script.LongEquationoptionStrikeList.map((s) => ({
                ...s,
                ExpiryType: value,
              }))
            : [];
          const shorts = Array.isArray(script.ShortEquationoptionStrikeList)
            ? script.ShortEquationoptionStrikeList.map((s) => ({
                ...s,
                ExpiryType: value,
              }))
            : [];
          return {
            ...script,
            LongEquationoptionStrikeList: longs,
            ShortEquationoptionStrikeList: shorts,
          };
        });

        setValue("StrategyScriptList", updated, { shouldDirty: true });
        updatePayload({ StrategyScriptList: updated });
        return;
      }

      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        longStrike.ExpiryType = value;
        if (shortStrike) {
          shortStrike.ExpiryType = value;
        }
      });
    },
    [applyStrikeUpdate, getValues, productType, setValue, updatePayload]
  );

  const handleStrikeCriteriaChange = useCallback(
    (criteria) => {
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const defaultStrikeValue =
          criteria === "CP" ? "" : criteria === "DELTA_NEAR" ? "0.50" : "0";
        const strikeObj = {
          type: strikeCriteriaToType(criteria),
          StrikeValue: defaultStrikeValue,
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
      // Allow empty string during typing
      if (value === "") {
        applyStrikeUpdate(({ longStrike, shortStrike }) => {
          const strikeObj = {
            type: strikeCriteriaToType(selectedStrikeCriteria),
            StrikeValue: "",
            RangeFrom: 0,
            RangeTo: 0,
          };
          longStrike.strikeTypeobj = strikeObj;
          if (shortStrike) {
            shortStrike.strikeTypeobj = { ...strikeObj };
          }
        });
        return;
      }

      // For delta, allow typing decimal points and partial values
      if (isDeltaCriteria) {
        // Allow partial decimal input like "0.", "0.5", etc during typing
        const isValidPartialInput = /^[0-9]*\.?[0-9]*$/.test(value);
        if (isValidPartialInput) {
          // Store raw value during typing without formatting
          applyStrikeUpdate(({ longStrike, shortStrike }) => {
            const strikeObj = {
              type: strikeCriteriaToType(selectedStrikeCriteria),
              StrikeValue: value,
              RangeFrom: 0,
              RangeTo: 0,
            };
            longStrike.strikeTypeobj = strikeObj;
            if (shortStrike) {
              shortStrike.strikeTypeobj = { ...strikeObj };
            }
          });
          return;
        }
      }

      // For non-delta or invalid input, apply immediate formatting
      const numeric = Number(value);
      const formatted = (() => {
        if (!Number.isFinite(numeric)) return isDeltaCriteria ? "0.50" : "0";
        if (isDeltaCriteria) {
          // Clamp 0-1 and keep two decimals for 0.01 steps
          const clamped = Math.min(1, Math.max(0, numeric));
          const rounded = Math.round(clamped * 100) / 100;
          return rounded.toFixed(2);
        }
        return String(Math.max(0, numeric));
      })();
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const strikeObj = {
          type: strikeCriteriaToType(selectedStrikeCriteria),
          StrikeValue: String(formatted),
          RangeFrom: 0,
          RangeTo: 0,
        };
        longStrike.strikeTypeobj = strikeObj;
        if (shortStrike) {
          shortStrike.strikeTypeobj = { ...strikeObj };
        }
      });
    },
    [applyStrikeUpdate, selectedStrikeCriteria, isDeltaCriteria]
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

  const handleStrikeNumberBlur = useCallback(() => {
    if (!isDeltaCriteria) return;

    const currentValue = existingActiveStrike?.strikeTypeobj?.StrikeValue;
    if (
      currentValue === "" ||
      currentValue === undefined ||
      currentValue === null
    ) {
      // If empty, set to default
      applyStrikeUpdate(({ longStrike, shortStrike }) => {
        const strikeObj = {
          type: strikeCriteriaToType(selectedStrikeCriteria),
          StrikeValue: "0.50",
          RangeFrom: 0,
          RangeTo: 0,
        };
        longStrike.strikeTypeobj = strikeObj;
        if (shortStrike) {
          shortStrike.strikeTypeobj = { ...strikeObj };
        }
      });
      return;
    }

    const numeric = Number(currentValue);
    if (Number.isFinite(numeric)) {
      // Clamp and format
      const clamped = Math.min(1, Math.max(0, numeric));
      const rounded = Math.round(clamped * 100) / 100;
      const formatted = rounded.toFixed(2);

      if (formatted !== String(currentValue)) {
        applyStrikeUpdate(({ longStrike, shortStrike }) => {
          const strikeObj = {
            type: strikeCriteriaToType(selectedStrikeCriteria),
            StrikeValue: formatted,
            RangeFrom: 0,
            RangeTo: 0,
          };
          longStrike.strikeTypeobj = strikeObj;
          if (shortStrike) {
            shortStrike.strikeTypeobj = { ...strikeObj };
          }
        });
      }
    }
  }, [
    isDeltaCriteria,
    existingActiveStrike,
    applyStrikeUpdate,
    selectedStrikeCriteria,
  ]);

  const handleStopLossChange = useCallback(
    (value) => {
      // Allow blank values during typing
      const formatted = value === "" ? "" : String(Number(value) || 0);
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
      // Allow blank values during typing
      const formatted = value === "" ? "" : String(Number(value) || 0);
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

  // Visibility controlled by global advanceFeatures, values are per-leg
  const featureWaitTradeActive = advanceFeatures?.["Wait & Trade"];
  const featurePremiumActive = advanceFeatures?.["Premium Difference"];
  const featureReEntryActive = advanceFeatures?.["Re Entry/Execute"];
  const featureTrailSlActive = advanceFeatures?.["Trail SL"];
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

        const isIndicator = selectedStrategyTypes?.[0] === "indicator";
        const newStrike = {
          ...createDefaultStrikeBySide("long"),
          ...(moveSlToCostActive ? { IsMoveSLCTC: true } : {}),
        };

        // Auto-set the new leg's option type opposite to the previous leg (CE/PE pairing)
        const prevStrikeType = longArr[longArr.length - 1]?.StrikeType;
        if (!isIndicator && prevStrikeType) {
          newStrike.StrikeType = prevStrikeType === "CE" ? "PE" : "CE";
        }
        longArr.push(newStrike);

        if (isIndicator) {
          const opposite = newStrike.StrikeType === "CE" ? "PE" : "CE";
          shortArr.push({
            ...newStrike,
            StrikeType: opposite,
            ...(moveSlToCostActive ? { IsMoveSLCTC: true } : {}),
          });
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

  // When Move SL to Cost is enabled, ensure at least two legs and hide manual add
  // When disabled, remove the second leg if it was auto-added
  useEffect(() => {
    if (moveSlToCostActive) {
      // Add second leg if only 1 leg exists
      if (legs.length < 2) {
        handleAddLeg();
      }
    } else {
      // When Move SL to Cost is disabled, remove second leg if it exists and was auto-added
      const scripts = getValues("StrategyScriptList") || [];
      if (scripts[0]) {
        const longStrikes = scripts[0].LongEquationoptionStrikeList || [];
        const shortStrikes = scripts[0].ShortEquationoptionStrikeList || [];
        
        // Only remove if we have exactly 2 legs (the auto-added one)
        if (longStrikes.length === 2) {
          // Remove the second leg
          longStrikes.splice(1, 1);
          if (shortStrikes.length > 1) {
            shortStrikes.splice(1, 1);
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
          
          // Set active leg to first one
          setValue("ActiveLegIndex", 0, { shouldDirty: true });
        }
      }
    }
    // handleAddLeg is stable enough here; avoid extra dep to prevent repeated calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveSlToCostActive]);

  // When combined chart is enabled for indicator strategy, ensure at least 2 legs
  useEffect(() => {
    const isCombinedChart = isChartOnOptionStrike === "combined";
    if (isCombinedChart && isIndicatorStrategy) {
      try {
        const scripts = getValues("StrategyScriptList") || [];
        const base = scripts[0] || {};
        const longArr = Array.isArray(base.LongEquationoptionStrikeList)
          ? base.LongEquationoptionStrikeList
          : [];

        // Only add legs if we actually have less than 2 in the form data
        if (longArr.length < 2) {
          const idx = longArr.length;
          const nextLegName = `L${idx + 1}`;

          const updateFormState = () => {
            setLegs((prevLegs) => [...prevLegs, nextLegName]);
            setSelectedLeg(nextLegName);

            const updatedLongArr = [...longArr];
            const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
              ? [...base.ShortEquationoptionStrikeList]
              : [];

            const newStrike = {
              ...createDefaultStrikeBySide("long"),
              ...(moveSlToCostActive ? { IsMoveSLCTC: true } : {}),
            };

            const isIndicator = selectedStrategyTypes?.[0] === "indicator";
            updatedLongArr.push(newStrike);

            if (isIndicator) {
              const opposite = newStrike.StrikeType === "CE" ? "PE" : "CE";
              shortArr.push({
                ...newStrike,
                StrikeType: opposite,
                ...(moveSlToCostActive ? { IsMoveSLCTC: true } : {}),
              });
            }

            const updatedBase = {
              ...base,
              LongEquationoptionStrikeList: updatedLongArr,
            };
            if (isIndicator) {
              updatedBase.ShortEquationoptionStrikeList = shortArr;
            }

            const updated = [updatedBase];
            setValue("StrategyScriptList", updated, { shouldDirty: true });
            setValue("ActiveLegIndex", idx, { shouldDirty: true });

            updatePayload({ StrategyScriptList: updated });
          };

          setTimeout(updateFormState, 0);
        }
      } catch (err) {
        console.error("Add leg error", err);
      }
    }
  }, [
    isChartOnOptionStrike,
    isIndicatorStrategy,
    selectedStrategyTypes,
    getValues,
    setValue,
    updatePayload,
  ]);

  // ✅ Remove leg handler (moved from OrderType)
  const handleRemoveLeg = (removeIndex) => {
    try {
      const isCombinedChart = isChartOnOptionStrike === "combined";
      const minLegs = isCombinedChart && isIndicatorStrategy ? 2 : 1;
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
          longArr.push(createDefaultStrikeBySide("long"));
          if (isIndicator) {
            shortArr.push(createDefaultStrikeBySide("short"));
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
          {chartType !== "options" && !moveSlToCostActive && (
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
                                handleIndicatorConditionChange({
                                  long: e.target.value,
                                  short: e.target.value === "CE" ? "PE" : "CE",
                                })
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
                                handleIndicatorConditionChange({
                                  long: e.target.value === "CE" ? "PE" : "CE",
                                  short: e.target.value,
                                })
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
                                  ? pos === "BUY"
                                    ? "text-green-700 border-green-500 bg-green-50 dark:text-green-400 dark:bg-green-900/20 dark:border-green-600"
                                    : "text-red-600 border-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20 dark:border-red-600"
                                  : pos === "BUY"
                                  ? "text-green-600 border-green-200 bg-white dark:text-green-400 dark:bg-transparent dark:border-green-900/40"
                                  : "text-red-500 border-red-200 bg-white dark:text-red-400 dark:bg-transparent dark:border-red-900/40"
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
                          disabled={isDisabled || productType === "BTST"}
                          value={productType === "BTST" ? "WEEKLY" : expiryType}
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
                            onBlur={handleStrikeNumberBlur}
                            disabled={isDisabled}
                            placeholder={
                              isDeltaCriteria ? "0.00 - 1.00" : "Enter value"
                            }
                            min={isDeltaCriteria ? 0 : undefined}
                            max={isDeltaCriteria ? 1 : undefined}
                            step={isDeltaCriteria ? 0.01 : undefined}
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
                                    handleWaitTradeChange(
                                      e.target.value,
                                      waitTradeMovement
                                    )
                                  }
                                >
                                  {["% ↓", "% ↑", "pt ↑", "pt ↓"].map((o) => (
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
                                    handleWaitTradeChange(
                                      waitTradeType,
                                      e.target.value
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
                                  handlePremiumDiffChange(e.target.value);
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
                                    handleReEntryChange(
                                      e.target.value,
                                      reEntryCycles,
                                      reEntryActionType
                                    )
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
                                    handleReEntryChange(
                                      reEntryExecutionType,
                                      reEntryCycles,
                                      e.target.value
                                    )
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
                                    handleReEntryChange(
                                      reEntryExecutionType,
                                      e.target.value,
                                      reEntryActionType
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
                                    handleTrailSlChange(
                                      e.target.value,
                                      trailSlPriceMovement,
                                      trailSlTrailingValue
                                    )
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
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    handleTrailSlChange(
                                      trailSlType,
                                      next,
                                      trailSlTrailingValue
                                    );
                                  }}
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
                                  onChange={(e) => {
                                    const next = e.target.value;
                                    handleTrailSlChange(
                                      trailSlType,
                                      trailSlPriceMovement,
                                      next
                                    );
                                  }}
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {selectedStrategyTypes?.[0] === "indicator" && (
          <div className="mt-6 border border-dashed border-gray-200 dark:border-[#2C2F36] rounded-xl p-4 bg-gray-50/60 dark:bg-[#1A1D23] space-y-4">
            <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
              <input
                type="checkbox"
                checked={signalCandleCondition}
                onChange={() =>
                  !isDisabled && setSignalCandleCondition((prev) => !prev)
                }
                disabled={isDisabled}
              />
              <span>
                Add Signal Candle Condition{" "}
                <span className="text-[11px] text-gray-400">(Optional)</span>
              </span>
            </label>

            {signalCandleCondition && (
              <div className="p-4 border border-gray-200 dark:border-[#2C2F36] rounded-lg bg-white dark:bg-[#11141A] space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm text-gray-600 dark:text-gray-400">
                      Buy When
                    </label>
                    <select
                      className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                      value={buyWhen}
                      onChange={(e) => handleBuyWhenChange(e.target.value)}
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
                      onChange={(e) => handleShortWhenChange(e.target.value)}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Leg1;
