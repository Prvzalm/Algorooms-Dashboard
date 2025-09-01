import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiTrash2 } from "react-icons/fi";
import { leg1CopyIcon } from "../../../assets";

const Leg1 = ({ selectedStrategyTypes, selectedInstrument, editing }) => {
  const { setValue, getValues } = useFormContext(); // added getValues
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
  useEffect(() => {
    if (!selectedInstrument) {
      setPosition(LEG1_DEFAULTS.position);
      setOptionType(LEG1_DEFAULTS.optionType);
      setPrePunchSL(LEG1_DEFAULTS.prePunchSL);
      setSignalCandleCondition(LEG1_DEFAULTS.signalCandleCondition);
      return;
    }
    // On edit, try to prefill from existing first long strike
    if (editing) {
      const scripts = getValues("StrategyScriptList") || [];
      const first = scripts[0];
      const long0 = first?.LongEquationoptionStrikeList?.[0];
      if (long0) {
        setPosition(long0.TransactionType || "BUY");
        // infer optionType from StrikeType only in time strategy
        if (selectedStrategyTypes?.[0] === "time") {
          setOptionType(long0.StrikeType === "PE" ? "Put" : "Call");
        }
        setExpiryType(long0.ExpiryType || "WEEKLY");
        if (long0.SLType === "slpt") setSlTypeSel("SL pt");
        if (long0.TargetType === "tgpt") setTpTypeSel("TP pt");
        setStopLossQty(Number(long0.StopLoss) || 30);
        setTargetValue(Number(long0.Target) || 0);
        setPrePunchSL(!!long0.isPrePunchSL);
        setSlAction(
          long0.SLActionTypeId === "ONCLOSE" ? "On Close" : "On Price"
        );
        setTpAction(
          long0.TargetActionTypeId === "ONCLOSE" ? "On Close" : "On Price"
        );
        // strike criteria mapping
        const typeMapRev = {
          ATM: "ATM_PT",
          ATMPER: "ATM_PERCENT",
          CPNear: "CP",
          CPGREATERTHAN: "CP_GTE",
          CPLESSTHAN: "CP_LTE",
        };
        const t = long0.strikeTypeobj?.type;
        if (t) {
          if (t === "ATM" || t === "ATMPER")
            setSelectedStrikeCriteria(typeMapRev[t] || "ATM_PT");
          if (t.startsWith("CP"))
            setSelectedStrikeCriteria(typeMapRev[t] || "CP");
        }
        if (long0.strikeTypeobj) {
          const sv = Number(long0.strikeTypeobj.StrikeValue) || 0;
          if (
            selectedStrikeCriteria === "ATM_PT" ||
            selectedStrikeCriteria === "ATM_PERCENT"
          ) {
            // convert numeric back to ladder value
            if (sv === 0) setStrikeTypeSelectValue("ATM");
            else if (sv < 0) setStrikeTypeSelectValue(`ITM_${Math.abs(sv)}`);
            else setStrikeTypeSelectValue(`OTM_${Math.abs(sv)}`);
          } else {
            setStrikeTypeNumber(sv);
          }
        }
      }
    } else {
      // new selection reset
      setPosition(LEG1_DEFAULTS.position);
      setOptionType(LEG1_DEFAULTS.optionType);
      setPrePunchSL(LEG1_DEFAULTS.prePunchSL);
      setSignalCandleCondition(LEG1_DEFAULTS.signalCandleCondition);
    }
  }, [selectedInstrument, editing]);

  // unified builder for StrategyScriptList (single leg only)
  useEffect(() => {
    if (!selectedInstrument) return;
    const isTime = selectedStrategyTypes?.[0] === "time";

    const scripts = getValues("StrategyScriptList") || [];
    const base = { ...(scripts[0] || {}) };

    // ensure instrument identity
    base.InstrumentToken =
      selectedInstrument.InstrumentToken || base.InstrumentToken || "";
    base.InstrumentName = selectedInstrument.Name || base.InstrumentName || "";
    base.StrikeTickValue = base.StrikeTickValue || 0;

    // script level qty = single lot (backend sample)
    const lotSizeBase = selectedInstrument?.LotSize || 0;
    base.Qty = lotSizeBase;

    // leg qty (multiplied)
    const legQty = Math.max(1, qtyMultiplier) * lotSizeBase;

    // derive strike value & type mapping
    const mapCriteriaType = (crit) => {
      if (crit === "ATM_PERCENT") return "ATMPER";
      if (crit === "ATM_PT") return "ATM";
      if (crit === "CP") return "CPNEAR";
      if (crit === "CP_GTE") return "CPGREATERTHAN";
      if (crit === "CP_LTE") return "CPLESSTHAN";
      return crit; // CP / CP_GTE / etc.
    };

    const parseOffsetValue = (raw) => {
      if (raw === "ATM") return 0;
      const parts = raw.split("_");
      if (parts.length < 2) return 0;
      const side = parts[0]; // ITM / OTM
      const num = parseFloat(parts[1]);
      if (isNaN(num)) return 0;
      // ITM should be negative, OTM positive
      return side === "ITM" ? -num : num;
    };

    const strikeValueRaw = isATMMode ? strikeTypeSelectValue : strikeTypeNumber;
    const strikeValueNumeric =
      typeof strikeValueRaw === "number"
        ? strikeValueRaw
        : parseOffsetValue(strikeValueRaw);

    const slTypeCode = slTypeSel === "SL%" ? "slpr" : "slpt";
    const tpTypeCode = tpTypeSel === "TP%" ? "tgpr" : "tgpt";
    const actionMap = (v) => (v === "On Close" ? "ONCLOSE" : "ONPRICE");

    // helper to build strike template
    const buildStrike = (strikeTypeSymbol) => {
      return {
        TransactionType: position,
        StrikeType: strikeTypeSymbol,
        StrikeValueType: 0,
        // REQUIREMENT: outer StrikeValue must remain 0 always
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
          // REQUIREMENT: signed value here (negative ITM, positive OTM, 0 ATM)
          StrikeValue: strikeValueNumeric,
          RangeFrom: 0,
          RangeTo: 0,
        },
        isTrailSL: isTime ? false : true,
        IsMoveSLCTC: isTime ? false : true,
        isExitAll: isTime ? false : true,
        IsPriceDiffrenceConstrant: isTime ? false : true,
        PriceDiffrenceConstrantValue: 0,
        isPrePunchSL: prePunchSL && !isTime,
        reEntry: {
          isRentry: isTime ? false : true,
          RentryType: "REN",
          TradeCycle: 0,
          RentryActionTypeId: "ON_CLOSE",
        },
        waitNTrade: {
          isWaitnTrade: isTime ? false : true,
          isPerPt: "wtpr_+",
          typeId: "wtpr_+",
          MovementValue: 0,
        },
        TrailingSL: {
          TrailingType: "tslpr",
          InstrumentMovementValue: 0,
          TrailingValue: 0,
        },
        lotSize: lotSizeBase,
      };
    };

    // StrikeType selection logic
    const optionStrikeType = optionType === "Call" ? "CE" : "PE";
    const longStrike = buildStrike(
      isTime ? optionStrikeType : longCondition // time-based from optionType
    );

    if (isTime) {
      base.LongEquationoptionStrikeList = [longStrike];
      base.ShortEquationoptionStrikeList = [];
    } else {
      const shortStrike = buildStrike(shortCondition);
      base.LongEquationoptionStrikeList = [longStrike];
      base.ShortEquationoptionStrikeList = [shortStrike];
    }

    setValue("StrategyScriptList", [base], { shouldDirty: true });
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
  ]);

  // reset strike related controlled values when strategy type toggles
  useEffect(() => {
    setStrikeTypeSelectValue("ATM");
    setStrikeTypeNumber(0);
  }, [selectedStrategyTypes, selectedStrikeCriteria]);

  // updating strikeTypeobj.type when criteria changes (already handled in effect above)
  const handleSelectStrikeCriteria = (val) => {
    setSelectedStrikeCriteria(val);
  };

  // derive lot size & exchange for display
  const exchange =
    selectedInstrument?.Exchange || selectedInstrument?.Segment || "";

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
      <div className="p-4 border rounded-2xl space-y-4 dark:border-[#1E2027] dark:bg-[#15171C] text-black dark:text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Leg1</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Lorem Ipsum donor
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-gray-500 dark:text-gray-400 font-medium"
            disabled={isDisabled}
          >
            View All Strategies
          </button>
        </div>

        <div className="border rounded-xl p-4 space-y-4 border-gray-200 dark:border-[#1E2027] dark:bg-[#1E2027]">
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

          <div className="grid grid-cols-3 gap-3 text-xs">
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
                Qty
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
                Qty
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
