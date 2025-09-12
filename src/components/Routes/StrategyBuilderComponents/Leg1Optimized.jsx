import { useEffect, useState, useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { FiTrash2 } from "react-icons/fi";
import { leg1CopyIcon } from "../../../assets";

// Centralized strike configuration
const STRIKE_CRITERIA_OPTIONS = [
  { label: "ATM pt", value: "ATM_PT" },
  { label: "ATM %", value: "ATM_PERCENT" },
  { label: "CP", value: "CP" },
  { label: "CP >=", value: "CP_GTE" },
  { label: "CP <=", value: "CP_LTE" },
];

const EXPIRY_OPTIONS = ["WEEKLY", "MONTHLY"];
const SL_OPTIONS = ["SL%", "SL pt"];
const TP_OPTIONS = ["TP%", "TP pt"];
const ON_PRICE_OPTIONS = ["On Price", "On Close"];
const CONDITION_OPTIONS = ["CE", "PE"];

// Generate ATM options
const generateATMOptions = (type) => {
  const arr = [];
  const step = type === "points" ? 50 : 0.5;
  const max = type === "points" ? 2000 : 20;

  for (let p = max; p >= step; p -= step) {
    arr.push({
      label: `ITM ${type === "points" ? p : p.toFixed(1)}${
        type === "percent" ? "%" : ""
      }`,
      value: `ITM_${type === "points" ? p : p.toFixed(1)}`,
    });
  }

  arr.push({ label: "ATM", value: "ATM" });

  for (let p = step; p <= max; p += step) {
    arr.push({
      label: `OTM ${type === "points" ? p : p.toFixed(1)}${
        type === "percent" ? "%" : ""
      }`,
      value: `OTM_${type === "points" ? p : p.toFixed(1)}`,
    });
  }

  return arr;
};

const ATM_POINTS_OPTIONS = generateATMOptions("points");
const ATM_PERCENT_OPTIONS = generateATMOptions("percent");

// Leg state management hook
const useLegState = (selectedInstrument, activeLegIndex, strategyScripts) => {
  const [legConfig, setLegConfig] = useState({
    position: "BUY",
    optionType: "Call",
    expiryType: "WEEKLY",
    slTypeSel: "SL%",
    tpTypeSel: "TP%",
    slAction: "On Price",
    tpAction: "On Price",
    targetValue: 0,
    stopLossQty: 30,
    qtyMultiplier: 1,
    selectedStrikeCriteria: "ATM_PT",
    strikeTypeSelectValue: "ATM",
    strikeTypeNumber: 0,
    longCondition: "CE",
    prePunchSL: false,
    signalCandleCondition: false,
    waitTradeEnabled: false,
    waitTradeMovement: 0,
    waitTradeType: "% ↑",
    premiumDiffEnabled: false,
    premiumDiffValue: 0,
  });

  const updateLegConfig = useCallback((updates) => {
    setLegConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Load existing leg data when leg changes
  useEffect(() => {
    if (!selectedInstrument || !strategyScripts?.[0]) return;

    const longStrike =
      strategyScripts[0]?.LongEquationoptionStrikeList?.[activeLegIndex];
    if (!longStrike) return;

    const newConfig = {
      position: longStrike.TransactionType || "BUY",
      optionType: longStrike.StrikeType === "PE" ? "Put" : "Call",
      expiryType: longStrike.ExpiryType || "WEEKLY",
      slTypeSel: longStrike.SLType === "slpt" ? "SL pt" : "SL%",
      tpTypeSel: longStrike.TargetType === "tgpt" ? "TP pt" : "TP%",
      slAction:
        longStrike.SLActionTypeId === "ONCLOSE" ? "On Close" : "On Price",
      tpAction:
        longStrike.TargetActionTypeId === "ONCLOSE" ? "On Close" : "On Price",
      targetValue: Number(longStrike.Target) || 0,
      stopLossQty: Number(longStrike.StopLoss) || 30,
      prePunchSL: !!longStrike.isPrePunchSL,
      waitTradeEnabled: !!longStrike.waitNTrade?.isWaitnTrade,
      waitTradeMovement: Number(longStrike.waitNTrade?.MovementValue) || 0,
      premiumDiffEnabled: !!longStrike.IsPriceDiffrenceConstrant,
      premiumDiffValue: Number(longStrike.PriceDiffrenceConstrantValue) || 0,
    };

    // Calculate qty multiplier
    const lotSize = selectedInstrument?.LotSize || 0;
    const legQty = Number(longStrike.Qty) || 0;
    if (lotSize > 0 && legQty > 0) {
      newConfig.qtyMultiplier = Math.max(1, Math.round(legQty / lotSize));
    }

    // Handle strike criteria
    const strikeType = longStrike.strikeTypeobj?.type;
    const strikeValue = Number(longStrike.strikeTypeobj?.StrikeValue) || 0;

    if (strikeType) {
      const criteriaMap = {
        ATM: "ATM_PT",
        ATMPER: "ATM_PERCENT",
        CPNEAR: "CP",
        CPGREATERTHAN: "CP_GTE",
        CPLESSTHAN: "CP_LTE",
      };

      newConfig.selectedStrikeCriteria = criteriaMap[strikeType] || "ATM_PT";

      if (strikeType === "ATM" || strikeType === "ATMPER") {
        if (strikeValue === 0) {
          newConfig.strikeTypeSelectValue = "ATM";
        } else if (strikeValue < 0) {
          newConfig.strikeTypeSelectValue = `ITM_${Math.abs(strikeValue)}`;
        } else {
          newConfig.strikeTypeSelectValue = `OTM_${Math.abs(strikeValue)}`;
        }
      } else {
        newConfig.strikeTypeNumber = strikeValue;
      }
    }

    setLegConfig((prev) => ({ ...prev, ...newConfig }));
  }, [selectedInstrument, activeLegIndex, strategyScripts]);

  return [legConfig, updateLegConfig];
};

const Leg1 = ({ selectedStrategyTypes, selectedInstrument, editing }) => {
  const { setValue, getValues, watch } = useFormContext();
  const activeLegIndex = watch("ActiveLegIndex") ?? 0;
  const strategyScripts = watch("StrategyScriptList");
  const advanceFeatures = watch("AdvanceFeatures");

  const [legConfig, updateLegConfig] = useLegState(
    selectedInstrument,
    activeLegIndex,
    strategyScripts
  );

  const isDisabled = !selectedInstrument || !selectedInstrument.InstrumentToken;
  const isTime = selectedStrategyTypes?.[0] === "time";
  const isATMMode =
    legConfig.selectedStrikeCriteria === "ATM_PT" ||
    legConfig.selectedStrikeCriteria === "ATM_PERCENT";
  const shortCondition = legConfig.longCondition === "CE" ? "PE" : "CE";

  // Derived values
  const lotSizeBase = selectedInstrument?.LotSize || 0;
  const qtyDisplay = Math.max(1, legConfig.qtyMultiplier) * lotSizeBase;
  const exchange =
    selectedInstrument?.Exchange || selectedInstrument?.Segment || "";

  // Strike builder
  const buildStrike = useCallback(
    (strikeTypeSymbol) => {
      const mapCriteriaType = (crit) => {
        const map = {
          ATM_PERCENT: "ATMPER",
          ATM_PT: "ATM",
          CP: "CPNEAR",
          CP_GTE: "CPGREATERTHAN",
          CP_LTE: "CPLESSTHAN",
        };
        return map[crit] || crit;
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

      const strikeValueRaw = isATMMode
        ? legConfig.strikeTypeSelectValue
        : legConfig.strikeTypeNumber;
      const strikeValueNumeric =
        typeof strikeValueRaw === "number"
          ? strikeValueRaw
          : parseOffsetValue(strikeValueRaw);

      const slTypeCode = legConfig.slTypeSel === "SL%" ? "slpr" : "slpt";
      const tpTypeCode = legConfig.tpTypeSel === "TP%" ? "tgpr" : "tgpt";
      const actionMap = (v) => (v === "On Close" ? "ONCLOSE" : "ONPRICE");

      const mapWaitTradeType = (label) => {
        const map = {
          "% ↓": { isPerPt: "percent", typeId: "wtpr_%_down" },
          "% ↑": { isPerPt: "percent", typeId: "wtpr_%_up" },
          "pt ↑": { isPerPt: "point", typeId: "wtpr_pt_up" },
          "pt ↓": { isPerPt: "point", typeId: "wtpr_pt_down" },
          Equal: { isPerPt: "equal", typeId: "wtpr_equal" },
        };
        return map[label] || map["% ↑"];
      };

      const wtTypeMeta = mapWaitTradeType(legConfig.waitTradeType);
      const legQty = Math.max(1, legConfig.qtyMultiplier) * lotSizeBase;

      return {
        TransactionType: legConfig.position,
        StrikeType: strikeTypeSymbol,
        StrikeValueType: 0,
        StrikeValue: 0,
        SLActionTypeId: actionMap(legConfig.slAction),
        TargetActionTypeId: actionMap(legConfig.tpAction),
        TargetType: tpTypeCode,
        SLType: slTypeCode,
        Target: String(legConfig.targetValue),
        StopLoss: String(legConfig.stopLossQty),
        Qty: String(legQty),
        ExpiryType: legConfig.expiryType,
        strikeTypeobj: {
          type: mapCriteriaType(legConfig.selectedStrikeCriteria),
          StrikeValue: strikeValueNumeric,
          RangeFrom: 0,
          RangeTo: 0,
        },
        isTrailSL: !isTime,
        IsMoveSLCTC: !isTime,
        isExitAll: !isTime,
        isPrePunchSL: legConfig.prePunchSL && !isTime,
        reEntry: {
          isRentry: !isTime,
          RentryType: "REN",
          TradeCycle: 0,
          RentryActionTypeId: "ON_CLOSE",
        },
        waitNTrade: {
          isWaitnTrade: !isTime && legConfig.waitTradeEnabled,
          isPerPt: wtTypeMeta.isPerPt,
          typeId: wtTypeMeta.typeId,
          MovementValue: legConfig.waitTradeMovement,
        },
        TrailingSL: {
          TrailingType: "tslpr",
          InstrumentMovementValue: 0,
          TrailingValue: 0,
        },
        lotSize: lotSizeBase,
        IsPriceDiffrenceConstrant: !isTime && legConfig.premiumDiffEnabled,
        PriceDiffrenceConstrantValue: legConfig.premiumDiffValue,
      };
    },
    [legConfig, isTime, isATMMode, lotSizeBase]
  );

  // Update form data when leg config changes
  const updateFormData = useCallback(() => {
    if (!selectedInstrument) return;

    const scripts = getValues("StrategyScriptList") || [];
    const base = { ...(scripts[0] || {}) };

    // Set instrument data
    base.InstrumentToken = selectedInstrument.InstrumentToken || "";
    base.InstrumentName = selectedInstrument.Name || "";
    base.Qty = lotSizeBase;
    base.StrikeTickValue = 0;

    // Ensure arrays exist
    const longArr = Array.isArray(base.LongEquationoptionStrikeList)
      ? [...base.LongEquationoptionStrikeList]
      : [];
    const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
      ? [...base.ShortEquationoptionStrikeList]
      : [];

    // Expand arrays if needed
    while (longArr.length <= activeLegIndex) longArr.push(undefined);
    if (!isTime) {
      while (shortArr.length <= activeLegIndex) shortArr.push(undefined);
    }

    // Build strikes
    const optionStrikeType = legConfig.optionType === "Call" ? "CE" : "PE";
    const longStrike = buildStrike(
      isTime ? optionStrikeType : legConfig.longCondition
    );

    longArr[activeLegIndex] = longStrike;

    if (!isTime) {
      const shortStrike = buildStrike(shortCondition);
      shortArr[activeLegIndex] = shortStrike;
    }

    // Update arrays
    base.LongEquationoptionStrikeList = longArr.filter((x) => x !== undefined);
    if (!isTime) {
      base.ShortEquationoptionStrikeList = shortArr.filter(
        (x) => x !== undefined
      );
    }

    // Only update if changed to prevent loops
    const prevJSON = JSON.stringify(scripts[0] || {});
    const nextJSON = JSON.stringify(base);

    if (prevJSON !== nextJSON) {
      setValue("StrategyScriptList", [base], { shouldDirty: true });
    }
  }, [
    selectedInstrument,
    getValues,
    setValue,
    activeLegIndex,
    buildStrike,
    isTime,
    legConfig,
    shortCondition,
    lotSizeBase,
  ]);

  // Debounced form update
  const debouncedUpdate = useMemo(
    () => debounce(updateFormData, 300),
    [updateFormData]
  );

  useEffect(() => {
    if (!selectedInstrument) return;
    debouncedUpdate();
    return () => debouncedUpdate.cancel?.();
  }, [selectedInstrument, legConfig, activeLegIndex, debouncedUpdate]);

  // Update advance features
  useEffect(() => {
    const af = getValues("AdvanceFeatures") || {};
    const next = { ...af };

    if (legConfig.waitTradeEnabled) {
      next["Wait & Trade"] = true;
      next.WaitTradeMovement = legConfig.waitTradeMovement;
      next.WaitTradeType = legConfig.waitTradeType;
    }

    if (legConfig.premiumDiffEnabled) {
      next["Premium Difference"] = true;
      next.PremiumDifferenceValue = legConfig.premiumDiffValue;
    }

    setValue("AdvanceFeatures", next, { shouldDirty: true });
  }, [
    legConfig.waitTradeEnabled,
    legConfig.waitTradeMovement,
    legConfig.waitTradeType,
    legConfig.premiumDiffEnabled,
    legConfig.premiumDiffValue,
    setValue,
    getValues,
  ]);

  // Check if features are active
  const existingActiveLong =
    strategyScripts?.[0]?.LongEquationoptionStrikeList?.[activeLegIndex];
  const featureWaitTradeActive =
    advanceFeatures?.["Wait & Trade"] ||
    legConfig.waitTradeEnabled ||
    existingActiveLong?.waitNTrade?.isWaitnTrade;
  const featurePremiumActive =
    advanceFeatures?.["Premium Difference"] ||
    legConfig.premiumDiffEnabled ||
    existingActiveLong?.IsPriceDiffrenceConstrant;

  return (
    <div className="relative group">
      {/* Disabled overlay */}
      {!selectedInstrument && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-semibold rounded-2xl select-none">
          Select Instrument
        </div>
      )}

      <div className="p-4 border rounded-2xl space-y-4 dark:border-[#1E2027] dark:bg-[#15171C] text-black dark:text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">{`Leg ${
              activeLegIndex + 1
            }`}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {selectedInstrument?.Name || "No instrument selected"}
            </p>
          </div>
        </div>

        <div className="border rounded-xl p-4 space-y-4 border-gray-200 dark:border-[#1E2027] dark:bg-[#1E2027]">
          {/* Indicator Strategy Conditions */}
          {!isTime && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block mb-1 text-green-600 font-medium">
                  When Long Condition
                </label>
                <select
                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  disabled={isDisabled}
                  value={legConfig.longCondition}
                  onChange={(e) =>
                    updateLegConfig({ longCondition: e.target.value })
                  }
                >
                  {CONDITION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
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
                    updateLegConfig({
                      longCondition: e.target.value === "CE" ? "PE" : "CE",
                    })
                  }
                >
                  {CONDITION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Qty, Position, Option Type */}
          <div
            className={`grid gap-3 text-xs ${
              !isTime ? "grid-cols-2" : "grid-cols-3"
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
                    updateLegConfig({
                      qtyMultiplier: Math.max(1, legConfig.qtyMultiplier - 1),
                    })
                  }
                  className="px-2 py-1 border rounded dark:border-[#2C2F36]"
                  disabled={isDisabled || legConfig.qtyMultiplier <= 1}
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
                    updateLegConfig({
                      qtyMultiplier: legConfig.qtyMultiplier + 1,
                    })
                  }
                  className="px-2 py-1 border rounded dark:border-[#2C2F36]"
                  disabled={isDisabled || lotSizeBase === 0}
                >
                  +
                </button>
              </div>
              <p className="text-[10px] mt-1 text-gray-500">
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
                    onClick={() => updateLegConfig({ position: pos })}
                    className={`w-1/2 border rounded px-3 py-2 font-semibold transition ${
                      legConfig.position === pos
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

            {isTime && (
              <div>
                <label className="block mb-1 text-gray-600 dark:text-gray-400">
                  Option Type
                </label>
                <div className="flex space-x-2">
                  {["Call", "Put"].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => updateLegConfig({ optionType: type })}
                      className={`w-1/2 border rounded px-3 py-2 font-semibold transition ${
                        legConfig.optionType === type
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

          {/* Expiry, Strike Criteria, Strike Type */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Expiry
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
                value={legConfig.expiryType}
                onChange={(e) =>
                  updateLegConfig({ expiryType: e.target.value })
                }
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Strike Criteria
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                value={legConfig.selectedStrikeCriteria}
                onChange={(e) =>
                  updateLegConfig({ selectedStrikeCriteria: e.target.value })
                }
                disabled={isDisabled}
              >
                {STRIKE_CRITERIA_OPTIONS.map((o) => (
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
                  value={legConfig.strikeTypeSelectValue}
                  onChange={(e) =>
                    updateLegConfig({ strikeTypeSelectValue: e.target.value })
                  }
                  disabled={isDisabled}
                >
                  {(legConfig.selectedStrikeCriteria === "ATM_PT"
                    ? ATM_POINTS_OPTIONS
                    : ATM_PERCENT_OPTIONS
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
                  value={legConfig.strikeTypeNumber}
                  onChange={(e) =>
                    updateLegConfig({
                      strikeTypeNumber: Math.max(0, Number(e.target.value)),
                    })
                  }
                  disabled={isDisabled}
                  placeholder="Enter value"
                />
              )}
            </div>
          </div>

          {/* Stop Loss Configuration */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                Stop Loss
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
                value={legConfig.slTypeSel}
                onChange={(e) => updateLegConfig({ slTypeSel: e.target.value })}
              >
                {SL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                SL Qty
              </label>
              <input
                type="number"
                value={legConfig.stopLossQty}
                onChange={(e) =>
                  !isDisabled &&
                  updateLegConfig({
                    stopLossQty: Math.max(0, Number(e.target.value) || 0),
                  })
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
                value={legConfig.slAction}
                onChange={(e) => updateLegConfig({ slAction: e.target.value })}
              >
                {ON_PRICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Profit Configuration */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                TP
              </label>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                disabled={isDisabled}
                value={legConfig.tpTypeSel}
                onChange={(e) => updateLegConfig({ tpTypeSel: e.target.value })}
              >
                {TP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-gray-600 dark:text-gray-400">
                TP Qty
              </label>
              <input
                type="number"
                value={legConfig.targetValue}
                onChange={(e) =>
                  !isDisabled &&
                  updateLegConfig({
                    targetValue: Math.max(0, Number(e.target.value) || 0),
                  })
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
                value={legConfig.tpAction}
                onChange={(e) => updateLegConfig({ tpAction: e.target.value })}
              >
                {ON_PRICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Features */}
          {(featureWaitTradeActive || featurePremiumActive) && (
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
                        value={legConfig.waitTradeType}
                        onChange={(e) =>
                          updateLegConfig({ waitTradeType: e.target.value })
                        }
                      >
                        {["% ↓", "% ↑", "pt ↑", "pt ↓", "Equal"].map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-gray-600 dark:text-gray-400">
                        Movement
                      </label>
                      <input
                        type="number"
                        value={legConfig.waitTradeMovement}
                        min={0}
                        onChange={(e) =>
                          updateLegConfig({
                            waitTradeMovement: Math.max(
                              0,
                              Number(e.target.value) || 0
                            ),
                          })
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
                      value={legConfig.premiumDiffValue}
                      min={0}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        updateLegConfig({ premiumDiffValue: val });
                      }}
                      className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className={`flex ${
              !isTime ? "justify-between" : "justify-end"
            } items-center pt-2`}
          >
            {!isTime && (
              <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={legConfig.prePunchSL}
                  onChange={(e) =>
                    updateLegConfig({ prePunchSL: e.target.checked })
                  }
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
              <img src={leg1CopyIcon} alt="Copy" />
            </div>
          </div>
        </div>

        {!isTime && (
          <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
            <input
              type="checkbox"
              checked={legConfig.signalCandleCondition}
              onChange={(e) =>
                updateLegConfig({ signalCandleCondition: e.target.checked })
              }
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

// Debounce utility
function debounce(func, wait) {
  let timeout;
  const debounced = function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  debounced.cancel = () => clearTimeout(timeout);
  return debounced;
}

export default Leg1;
