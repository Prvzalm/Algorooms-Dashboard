import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { FormProvider, useForm } from "react-hook-form";
import {
  useCreateStrategyMutation,
  useStrategyDetailsForEdit,
  useUserStrategies,
  useSearchInstrument,
} from "../../../hooks/strategyHooks";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import Leg1 from "./Leg1";
import OrderType from "./OrderType";
import RiskAndAdvance from "./RiskAndAdvance";
import EntryCondition from "./EntryCondition";
import InstrumentModal from "./InstrumentModal";
import BacktestStrategyComponent from "../BackTest/BacktestStrategyComponent";
import "./MobileButtons.css"; // Import mobile button styles
import {
  useStrategyBuilderStore,
  getDefaultPayload,
} from "../../../stores/strategyBuilderStore";
import { buildStrategyPayload } from "../../../utils/strategyPayload";
import ComingSoonOverlay from "../../common/ComingSoonOverlay";
import StrategyBuilderSkeleton from "./StrategyBuilderSkeleton";
import { FiInfo } from "react-icons/fi";
import PrimaryButton from "../../common/PrimaryButton";
import { createDefaultStrike } from "../../../stores/strategyBuilderStore";

const normalizeSegmentType = (segment = "Option") => {
  if (!segment) return "Option";
  const upper = segment.toString().toUpperCase();
  if (upper.includes("EQUITY") || upper === "EQ" || upper.includes("NSE")) {
    return "Equity";
  }
  if (upper.includes("FUT") || upper.includes("NFO")) {
    return "Future";
  }
  if (upper.includes("OPT")) {
    return "Option";
  }
  if (upper.includes("INDICE")) {
    return "Indices";
  }
  if (upper.includes("CDS")) {
    return "CDS";
  }
  if (upper.includes("MCX")) {
    return "MCX";
  }
  return segment;
};

const defaultExchangeForSegment = (segment) => {
  const normalized = normalizeSegmentType(segment);
  if (normalized === "Equity") return "NSE";
  if (normalized === "Future" || normalized === "Option") return "NFO";
  if (normalized === "Indices") return "NSE";
  if (normalized === "MCX") return "MCX";
  if (normalized === "CDS") return "CDS";
  return normalized || "";
};

const StrategyBuilder = () => {
  const { strategyId } = useParams();
  const editing = !!strategyId;
  const initialFormValuesRef = useRef(getDefaultPayload());
  const editPrefilledRef = useRef(false); // Track when edit data has hydrated form/store

  const methods = useForm({
    defaultValues: initialFormValuesRef.current,
  });
  const { handleSubmit, setValue, reset, getValues, watch } = methods;
  const { mutate, isPending } = useCreateStrategyMutation();
  const {
    data: editDetails,
    isLoading: editLoading,
    isError: editError,
  } = useStrategyDetailsForEdit(strategyId, editing);

  // Hook to refetch user strategies after creation
  const { refetch: refetchUserStrategies } = useUserStrategies({
    page: 1,
    pageSize: 100, // Large page size to get all strategies
    strategyType: "created",
    enabled: false, // Only fetch on-demand after creation
  });

  // For fetching instrument details in edit mode
  const [editInstrumentSearch, setEditInstrumentSearch] = useState({
    segmentType: "",
    instrumentName: "",
    shouldFetch: false,
  });

  // Hook to fetch instrument details in edit mode
  const { data: editInstrumentData = [], isLoading: editInstrumentLoading } =
    useSearchInstrument(
      editInstrumentSearch.segmentType,
      editInstrumentSearch.instrumentName,
      editInstrumentSearch.shouldFetch
    );
  const navigate = useNavigate();
  const [terminalConnectionAccepted, setTerminalConnectionAccepted] =
    useState(false);

  // Derive AdvanceFeatures flags from strike data (edit mode hydration)
  const deriveAdvanceFeatures = (
    scripts,
    activeIdx = 0,
    squareOffAll = false
  ) => {
    if (!Array.isArray(scripts) || !scripts.length) return {};
    const first = scripts[0] || {};
    const pickStrike = (list) =>
      Array.isArray(list) && list.length
        ? list[Math.min(activeIdx, list.length - 1)] || list[0]
        : null;

    const longStrike = pickStrike(first.LongEquationoptionStrikeList);
    const shortStrike = pickStrike(first.ShortEquationoptionStrikeList);
    const strike = longStrike || shortStrike || {};

    const premiumEnabled =
      strike?.IsPriceDiffrenceConstrant &&
      Number(strike?.PriceDiffrenceConstrantValue) > 0;

    return {
      "Move SL to Cost": !!strike?.IsMoveSLCTC,
      "Exit All on SL/Tgt": !!(squareOffAll || strike?.isExitAll),
      "Pre Punch SL": !!strike?.isPrePunchSL,
      "Wait & Trade": !!strike?.waitNTrade?.isWaitnTrade,
      "Premium Difference": !!premiumEnabled,
      "Re Entry/Execute": !!strike?.reEntry?.isRentry,
      "Trail SL": !!strike?.isTrailSL,
    };
  };

  // ✅ OPTIMIZED: Single selector with shallow equality check
  const {
    selectedStrategyTypes,
    setSelectedStrategyTypes,
    selectedInstrument,
    setSelectedInstrument,
    selectedEquityInstruments,
    setSelectedEquityInstruments,
    showInstrumentModal,
    openInstrumentModal,
    closeInstrumentModal,
    showBacktestModal,
    openBacktestModal,
    closeBacktestModal,
    showBacktestComponent,
    showBacktest,
    createdStrategyId,
    setCreatedStrategyId,
    setPayload,
    strategyPayload,
    updatePayload,
    resetAll,
  } = useStrategyBuilderStore();

  const navigateToStrategies = () => {
    // Centralized exit to strategies with full cleanup
    closeBacktestModal();
    showBacktest(false);
    setCreatedStrategyId(null);
    resetAll();

    const defaults = getDefaultPayload();
    initialFormValuesRef.current = defaults;
    setPayload(defaults);
    reset(defaults);
    setSelectedInstrument("");
    setSelectedEquityInstruments([]);
    setSelectedStrategyTypes([defaults.StrategyType]);

    navigate("/strategies", { replace: true });
  };

  const productTypeNum = Number(watch("ProductType")) || 0;
  const isBtSt = watch("isBtSt") || false;
  const isCncOrBtst = productTypeNum === 1 || isBtSt;

  useEffect(() => {
    if (!isCncOrBtst && terminalConnectionAccepted) {
      setTerminalConnectionAccepted(false);
    }
  }, [isCncOrBtst, terminalConnectionAccepted]);

  // State for instrument quantities
  const watchedScripts = watch("StrategyScriptList") || [];

  const defaultLotQty = (lotSize) => {
    const parsed = Number(lotSize);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const resolveQtyValue = (raw, fallback = 1) => {
    if (raw === "") return "";
    if (raw === null || raw === undefined) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const handleRemoveEquityInstrument = (instrumentToken) => {
    setSelectedEquityInstruments(
      selectedEquityInstruments.filter(
        (instrument) => instrument.InstrumentToken !== instrumentToken
      )
    );
  };

  const handleEquityQtyChange = (idx, value) => {
    const current = getValues("StrategyScriptList") || [];
    if (!current.length || !current[idx]) return;
    const updated = current.map((script, sIdx) => {
      if (sIdx !== idx) return script;
      if (value === "") return { ...script, Qty: "" };
      const parsed = Number(value);
      // Accept any positive number without forcing fallback during typing
      const qty = Number.isFinite(parsed) && parsed > 0 ? parsed : value;
      return { ...script, Qty: qty };
    });
    setValue("StrategyScriptList", updated, { shouldDirty: true });
    updatePayload({ StrategyScriptList: updated });
  };

  const handleEquityQtyBlur = (idx, lotSize) => {
    const current = getValues("StrategyScriptList") || [];
    if (!current.length || !current[idx]) return;
    const fallback = defaultLotQty(lotSize);
    const currentQty = current[idx].Qty;
    // Only apply default if blank or invalid
    const parsed = Number(currentQty);
    const safeQty =
      currentQty === "" || !Number.isFinite(parsed) || parsed <= 0
        ? fallback
        : parsed;
    if (safeQty === current[idx].Qty) return;
    const updated = current.map((script, sIdx) =>
      sIdx === idx ? { ...script, Qty: safeQty } : script
    );
    setValue("StrategyScriptList", updated, { shouldDirty: true });
    updatePayload({ StrategyScriptList: updated });
  };

  const handleSingleQtyChange = (value) => {
    const current = getValues("StrategyScriptList") || [];
    if (!current.length) return;
    const updated = current.map((script, idx) => {
      if (idx !== 0) return script;
      // Allow empty string during typing
      if (value === "") return { ...script, Qty: "" };
      const parsed = Number(value);
      // Accept positive numbers, keep value as-is for invalid input (will be fixed on blur)
      const qty = Number.isFinite(parsed) && parsed > 0 ? parsed : value;
      return { ...script, Qty: qty };
    });
    setValue("StrategyScriptList", updated, { shouldDirty: true });
    updatePayload({ StrategyScriptList: updated });
  };

  const handleSingleQtyBlur = () => {
    const current = getValues("StrategyScriptList") || [];
    if (!current.length) return;
    const fallback = defaultLotQty(selectedInstrument?.LotSize);
    const currentQty = current[0].Qty;
    // Only apply default if blank or invalid
    const parsed = Number(currentQty);
    const safeQty =
      currentQty === "" || !Number.isFinite(parsed) || parsed <= 0
        ? fallback
        : parsed;
    if (safeQty === current[0].Qty) return;
    const updated = current.map((script, idx) =>
      idx === 0 ? { ...script, Qty: safeQty } : script
    );
    setValue("StrategyScriptList", updated, { shouldDirty: true });
    updatePayload({ StrategyScriptList: updated });
  };

  const renderEquityInstrumentRow = ({ index, style, ariaAttributes }) => {
    const ins = selectedEquityInstruments[index];
    if (!ins) return null;
    const qtyValue = resolveQtyValue(
      watchedScripts[index]?.Qty,
      defaultLotQty(ins.LotSize)
    );

    return (
      <div style={style} className="px-1" {...ariaAttributes}>
        <div className="border rounded-lg p-2 text-xs bg-white dark:bg-[#1E2027] dark:border-[#2A2D35] shadow-sm relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRemoveEquityInstrument(ins.InstrumentToken)}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-colors flex-shrink-0"
            title="Remove instrument"
          >
            <span className="text-sm font-bold">×</span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {ins.Name}
            </div>
            {ins.SegmentType && (
              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                {ins.SegmentType}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 w-12">
            <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">
              Qty
            </div>
            <input
              type="number"
              min="1"
              value={qtyValue}
              onChange={(e) => handleEquityQtyChange(index, e.target.value)}
              onBlur={() => handleEquityQtyBlur(index, ins.LotSize)}
              className="w-full px-0.5 py-1 border border-gray-300 dark:border-[#2A2D35] rounded-md bg-white dark:bg-[#131419] text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs text-center"
            />
          </div>
        </div>
      </div>
    );
  };

  const handleStrategyChange = (id) => {
    if (selectedStrategyTypes.includes(id)) return;
    // Build fresh defaults for the selected strategy type
    const freshDefaults = {
      ...getDefaultPayload(),
      StrategyType: id,
      StrategySegmentType: id === "time" ? "Option" : "",
      StrategyExecutionType:
        id === "time" ? "tb" : id === "indicator" ? "ib" : "pa",
      AdvanceFeatures: {},
      ActiveLegIndex: 0,
    };

    // Reset all shared state and form to a clean slate
    resetAll();
    setPayload(freshDefaults);
    initialFormValuesRef.current = freshDefaults;
    reset(freshDefaults);

    // Clear selections/backtest flags and set the new type
    setSelectedInstrument("");
    setSelectedEquityInstruments([]);
    setSelectedStrategyTypes([id]);
    showBacktest(false);
    setCreatedStrategyId(null);
  };

  const mergeWithDefaults = (raw) => {
    const defaults = getDefaultPayload();
    const merged = { ...defaults, ...raw };
    Object.keys(defaults).forEach((key) => {
      if (
        merged[key] === "" ||
        merged[key] === null ||
        merged[key] === undefined
      ) {
        merged[key] = defaults[key];
      }
    });
    return merged;
  };

  useEffect(() => {
    const defaults = getDefaultPayload();
    reset(defaults);
    setPayload(defaults);
    setSelectedInstrument("");
    setSelectedEquityInstruments([]);
    setSelectedStrategyTypes([defaults.StrategyType]);
    editPrefilledRef.current = false;
  }, [
    reset,
    setPayload,
    setSelectedInstrument,
    setSelectedEquityInstruments,
    setSelectedStrategyTypes,
  ]);

  useEffect(() => {
    if (!editing) return;
    const blankPayload = getDefaultPayload();
    reset(blankPayload);
    setPayload(blankPayload);
    setSelectedInstrument("");
    setSelectedEquityInstruments([]);
    editPrefilledRef.current = false;
  }, [
    editing,
    strategyId,
    reset,
    setPayload,
    setSelectedInstrument,
    setSelectedEquityInstruments,
  ]);

  // ✅ OPTIMIZED: Single effect to sync Zustand payload with form
  useEffect(() => {
    // Sync strategy type
    if (selectedStrategyTypes[0]) {
      setValue("StrategyType", selectedStrategyTypes[0], { shouldDirty: true });

      // Auto-set segment type for time-based
      if (selectedStrategyTypes[0] === "time") {
        const currentSeg = methods.getValues("StrategySegmentType");
        if (currentSeg !== "Option") {
          setValue("StrategySegmentType", "Option", { shouldDirty: true });
          updatePayload({ StrategySegmentType: "Option" });
        }
      }
    }
  }, [selectedStrategyTypes, setValue, methods, updatePayload]);

  // ✅ OPTIMIZED: Sync instrument selection with payload
  useEffect(() => {
    if (!selectedInstrument || !selectedInstrument.SegmentType) return;

    // When editing and payload is already hydrated, avoid rebuilding strike arrays
    if (editing && editPrefilledRef.current) return;

    // Update both form and Zustand
    setValue("StrategySegmentType", selectedInstrument.SegmentType, {
      shouldDirty: true,
    });

    const existingScripts = getValues("StrategyScriptList") || [];
    const previous = existingScripts[0] || {};
    const lotQty = defaultLotQty(selectedInstrument.LotSize);
    const isIndicator = selectedStrategyTypes[0] === "indicator";

    const legCount = Math.max(
      1,
      (previous.LongEquationoptionStrikeList || []).length,
      (previous.ShortEquationoptionStrikeList || []).length
    );

    const makeDefaultStrike = (side = "long") =>
      createDefaultStrike(side === "long" ? "CE" : "PE");

    const longList = Array.from({ length: legCount }, () =>
      makeDefaultStrike("long")
    );
    const shortList = isIndicator
      ? Array.from({ length: legCount }, () => makeDefaultStrike("short"))
      : [];

    // Keep opposite CE/PE pairing for indicator strategies
    if (isIndicator) {
      longList.forEach((strike, idx) => {
        const opposite = strike.StrikeType === "CE" ? "PE" : "CE";
        shortList[idx].StrikeType = opposite;
      });
    }

    const scriptData = {
      InstrumentToken: selectedInstrument.InstrumentToken || "",
      InstrumentName: selectedInstrument.Name || "",
      Qty: resolveQtyValue(previous.Qty, lotQty),
      LongEquationoptionStrikeList: longList,
      ShortEquationoptionStrikeList: shortList,
      StrikeTickValue: 0,
    };

    setValue("StrategyScriptList", [scriptData], { shouldDirty: true });
    setValue("ActiveLegIndex", 0, { shouldDirty: true });
    setValue("AdvanceFeatures", {}, { shouldDirty: true });
    updatePayload({
      StrategySegmentType: selectedInstrument.SegmentType,
      StrategyScriptList: [scriptData],
      ActiveLegIndex: 0,
      AdvanceFeatures: {},
    });
  }, [
    editing,
    selectedInstrument,
    setValue,
    getValues,
    updatePayload,
    selectedStrategyTypes,
  ]);

  // ✅ OPTIMIZED: Handle equity instruments for indicator-based strategies
  useEffect(() => {
    if (selectedStrategyTypes[0] !== "indicator") return;
    if (!selectedEquityInstruments.length) return;

    // Avoid overriding populated edit payload
    if (editing && editPrefilledRef.current) return;

    const buildDefaultStrike = (strikeType) => ({
      TransactionType: "BUY",
      StrikeType: strikeType,
      StrikeValueType: 0,
      StrikeValue: 0,
      SLActionTypeId: "ONPRICE",
      TargetActionTypeId: "ONPRICE",
      isTrailSL: true,
      IsRecursive: false,
      IsMoveSLCTC: true,
      isExitAll: true,
      TargetType: "tgpr",
      SLType: "slpr",
      Target: "0",
      StopLoss: "0",
      Qty: "0",
      isPrePunchSL: true,
      IsPriceDiffrenceConstrant: true,
      PriceDiffrenceConstrantValue: "0",
      ExpiryType: "WEEKLY",
      reEntry: {
        isRentry: true,
        RentryType: "REN",
        TradeCycle: "0",
        RentryActionTypeId: "ON_CLOSE",
      },
      waitNTrade: {
        isWaitnTrade: true,
        isPerPt: "wtpr_+",
        typeId: "wtpr_+",
        MovementValue: "0",
      },
      TrailingSL: {
        TrailingType: "tslpr",
        InstrumentMovementValue: "0",
        TrailingValue: "0",
      },
      strikeTypeobj: {
        type: "ATM",
        StrikeValue: 0,
        RangeFrom: 0,
        RangeTo: 0,
      },
    });

    const existingScripts = getValues("StrategyScriptList") || [];
    const scripts = selectedEquityInstruments.map((ins, idx) => {
      const previous = existingScripts[idx] || {};
      const lotQty = defaultLotQty(ins.LotSize);
      return {
        InstrumentToken: ins.InstrumentToken || "",
        InstrumentName: ins.Name || "",
        Qty: resolveQtyValue(previous.Qty, lotQty),
        LongEquationoptionStrikeList: (previous.LongEquationoptionStrikeList &&
        previous.LongEquationoptionStrikeList.length > 0
          ? previous.LongEquationoptionStrikeList
          : [buildDefaultStrike("PE")]) || [buildDefaultStrike("PE")],
        ShortEquationoptionStrikeList:
          (previous.ShortEquationoptionStrikeList &&
          previous.ShortEquationoptionStrikeList.length > 0
            ? previous.ShortEquationoptionStrikeList
            : [buildDefaultStrike("CE")]) || [buildDefaultStrike("CE")],
        StrikeTickValue: previous.StrikeTickValue || 0,
      };
    });

    const segmentForSelection =
      selectedEquityInstruments[0]?.SegmentType || "Equity";

    setValue("StrategySegmentType", segmentForSelection, {
      shouldDirty: true,
    });
    setValue("StrategyScriptList", scripts, { shouldDirty: true });

    updatePayload({
      StrategySegmentType: segmentForSelection,
      StrategyScriptList: scripts,
    });
  }, [
    editing,
    selectedEquityInstruments,
    selectedStrategyTypes,
    setValue,
    updatePayload,
  ]);

  // Prefill when in edit mode and API data loaded
  useEffect(() => {
    if (!editing) return;
    if (editLoading || editError) return;
    if (!editDetails) return;
    try {
      // Map API shape to form values; using direct fields when name matches
      const d = editDetails;

      // Determine strategy type - if equations exist, it's indicator-based
      const hasIndicatorEquations =
        (d.LongEntryEquation && d.LongEntryEquation.length > 0) ||
        (d.ShortEntryEquation && d.ShortEntryEquation.length > 0) ||
        (d.Long_ExitEquation && d.Long_ExitEquation.length > 0) ||
        (d.Short_ExitEquation && d.Short_ExitEquation.length > 0);

      const detectedStrategyType =
        d.StrategyType === "Select"
          ? "time"
          : d.StrategyType
          ? d.StrategyType.toLowerCase()
          : hasIndicatorEquations
          ? "indicator"
          : "time";

      const parsedTpSlType = (() => {
        const raw = d.TpSLType;
        if (typeof raw === "string") {
          const upper = raw.toUpperCase();
          if (upper.includes("POINT")) return 1;
          if (upper.includes("PERCENT")) return 0;
          const num = Number(raw);
          if (!Number.isNaN(num)) return num;
        }
        const num = Number(raw);
        return Number.isFinite(num) ? num : 0;
      })();

      const mapped = {
        StrategyName: d.StrategyName || "",
        StrategyType: detectedStrategyType,
        StrategySegmentType: normalizeSegmentType(d.StrategySegmentType),
        ProductType: Number(d.ProductType) || Number(d.OrderType) || 0,
        TradeStartTime: d.TradeStartTime || "09:16",
        TradeStopTime: d.TradeStopTime || "15:15",
        AutoSquareOffTime: d.AutoSquareOffTime || "15:15",
        ActiveDays: d.ActiveDays || ["MON", "TUE", "WED", "THU", "FRI"],
        ExitWhenTotalProfit: d.ExitWhenTotalProfit || 0,
        ExitWhenTotalLoss: d.ExitWhenTotalLoss || d.ExitWhenTotalLoss || 0,
        TrailProfitType: d.TrailProfitType || 0,
        LockProfitAt: d.LockProfitAt || 0,
        LockProfit: d.LockProfit || 0,
        TrailProfitBy: d.TrailProfitBy || 0,
        Trail_SL: d.Trail_SL || 0,
        SquareOffAllOptionLegOnSl: d.SquareOffAllOptionLegOnSl || false,
        StrategyScriptList: d.StrategyScriptList || [],
        LongEntryEquation: d.LongEntryEquation || [],
        ShortEntryEquation: d.ShortEntryEquation || [],
        Long_ExitEquation: d.Long_ExitEquation || [],
        Short_ExitEquation: d.Short_ExitEquation || [],
        IsChartOnOptionStrike: (() => {
          // Convert boolean IsChartOnOptionStrike to "combined"/"options"/null based on legs count
          if (!d.IsChartOnOptionStrike) return null;
          const scripts = d.StrategyScriptList || [];
          const firstScript = scripts[0];
          if (!firstScript) return null;
          const longLegs = firstScript.LongEquationoptionStrikeList || [];
          const shortLegs = firstScript.ShortEquationoptionStrikeList || [];
          const totalLegs = longLegs.length + shortLegs.length;
          // If 2 or more legs, it's combined chart; if 1 leg, it's options chart
          return totalLegs >= 2
            ? "combined"
            : totalLegs === 1
            ? "options"
            : null;
        })(),
        AdvanceFeatures: d.AdvanceFeatures || {},
        isBtSt: d.isBtSt || false,
        StrategyId: d.StrategyId || 0,
        ActiveLegIndex: d.ActiveLegIndex || 0,
        StrategyExecutionType:
          d.StrategyExecutionType || d.StrategyExecuterId || "tb",
        Interval: d.Interval || 1,
        SL: d.SL || 0,
        Target: d.Target || 0,
        Privacy: d.Privacy || "Private",
        Copy_Allowed: d.Copy_Allowed || false,
        StrategyExecuterId: d.StrategyExecuterId || 0,
        OrderType: d.OrderType || 0,
        TransactionType: Number(d.TransactionType) || 0,
        TpSLType: parsedTpSlType,
        MinimumCapital: d.MinimumCapital || 0,
        ProfitTranches: d.ProfitTranches || 0,
        strategyTag: d.strategyTag || "any",
        RiskDescription: d.RiskDescription || null,
        subscriptionprice: d.subscriptionprice || 0,
        subscriptiondays: d.subscriptiondays || 0,
        MaxTrade: d.MaxTrade || 0,
        MaxDD: d.MaxDD || 0,
        Roi: d.Roi || 0,
        isTradeOnTriggerCandle: d.isTradeOnTriggerCandle || false,
        BuyWhen: d.BuyWhen || null,
        ShortWhen: d.ShortWhen || null,
        IsContiniousTriggerCandle: d.IsContiniousTriggerCandle || false,
        ChartType: d.ChartType ?? 1,
        EntryDaysBeforExpiry: d.EntryDaysBeforExpiry ?? 0,
        ExitDaysBeforExpiry: d.ExitDaysBeforExpiry ?? 0,
      };

      // Hydrate advance feature flags from strike-level data when API doesn't send AdvanceFeatures
      const derivedAdvance = deriveAdvanceFeatures(
        mapped.StrategyScriptList,
        mapped.ActiveLegIndex || 0,
        mapped.SquareOffAllOptionLegOnSl
      );
      mapped.AdvanceFeatures = {
        ...mapped.AdvanceFeatures,
        ...derivedAdvance,
      };

      reset(mapped);
      setSelectedStrategyTypes([mapped.StrategyType]);

      // Sync Zustand store with mapped data for edit mode
      setPayload(mapped);
      // Ensure AdvanceFeatures are present in the form for downstream effects
      setValue("AdvanceFeatures", mapped.AdvanceFeatures || {}, {
        shouldDirty: false,
      });

      editPrefilledRef.current = true;

      const normalizedSegment = mapped.StrategySegmentType?.toLowerCase();
      const isEquityMultiEdit =
        mapped.StrategyType === "indicator" &&
        (normalizedSegment === "equity" || normalizedSegment === "future") &&
        Array.isArray(mapped.StrategyScriptList) &&
        mapped.StrategyScriptList.length > 0;

      if (isEquityMultiEdit) {
        const multiSelection = mapped.StrategyScriptList.filter(
          (script) => script?.InstrumentToken && script?.InstrumentName
        ).map((script) => ({
          Name: script.InstrumentName,
          InstrumentToken: script.InstrumentToken,
          SegmentType: normalizedSegment === "future" ? "Future" : "Equity",
          LotSize: script.Qty || 1,
          Exchange:
            script.Exchange ||
            script.Segment ||
            defaultExchangeForSegment(mapped.StrategySegmentType),
        }));
        setSelectedInstrument("");
        setSelectedEquityInstruments(multiSelection);
      } else if (mapped.StrategyScriptList?.[0]) {
        const firstScript = mapped.StrategyScriptList[0];
        if (firstScript.InstrumentName && mapped.StrategySegmentType) {
          setSelectedEquityInstruments([]);
          setEditInstrumentSearch({
            segmentType: normalizeSegmentType(mapped.StrategySegmentType),
            instrumentName: firstScript.InstrumentName,
            shouldFetch: true,
          });
        }
      }
    } catch (e) {
      console.error("Failed to prefill edit strategy", e);
      toast.error("Failed to load strategy for edit");
    }
  }, [editing, editDetails, editLoading, editError, reset]);

  // Handle instrument data fetch in edit mode
  useEffect(() => {
    if (!editing || !editInstrumentSearch.shouldFetch) return;
    if (editInstrumentLoading || !editInstrumentData?.length) return;

    // Find the matching instrument from search results
    const matchedInstrument = editInstrumentData.find(
      (instrument) => instrument.Name === editInstrumentSearch.instrumentName
    );

    if (matchedInstrument) {
      setSelectedInstrument({
        Name: matchedInstrument.Name,
        InstrumentToken: matchedInstrument.InstrumentToken,
        SegmentType: editInstrumentSearch.segmentType,
        LotSize: matchedInstrument.LotSize || 0,
        Exchange:
          matchedInstrument.Exchange ||
          matchedInstrument.Segment ||
          defaultExchangeForSegment(editInstrumentSearch.segmentType),
      });
    }

    // Reset search params to avoid unnecessary API calls
    setEditInstrumentSearch({
      segmentType: "",
      instrumentName: "",
      shouldFetch: false,
    });
  }, [
    editing,
    editInstrumentSearch,
    editInstrumentLoading,
    editInstrumentData,
  ]);

  // ✅ OPTIMIZED: Single effect to sync Zustand payload with form
  useEffect(() => {
    // Sync strategy type
    if (selectedStrategyTypes[0]) {
      setValue("StrategyType", selectedStrategyTypes[0], { shouldDirty: true });

      // Auto-set segment type for time-based
      if (selectedStrategyTypes[0] === "time") {
        const currentSeg = methods.getValues("StrategySegmentType");
        if (currentSeg !== "Option") {
          setValue("StrategySegmentType", "Option", { shouldDirty: true });
          updatePayload({ StrategySegmentType: "Option" });
        }
      }
    }
  }, [selectedStrategyTypes, setValue, methods, updatePayload]);

  // ✅ Handle switching from equity multi-select back to single instrument
  useEffect(() => {
    if (
      selectedEquityInstruments.length > 0 &&
      selectedInstrument &&
      selectedInstrument.SegmentType &&
      selectedInstrument.SegmentType !== "Equity"
    ) {
      const inst = selectedInstrument;
      const scriptData = {
        InstrumentToken: inst.InstrumentToken || "",
        InstrumentName: inst.Name || "",
        Qty: 0,
        LongEquationoptionStrikeList: [],
        ShortEquationoptionStrikeList: [],
        StrikeTickValue: 0,
      };

      reset();
      setSelectedEquityInstruments([]);
      if (selectedStrategyTypes[0]) {
        setValue("StrategyType", selectedStrategyTypes[0], {
          shouldDirty: true,
        });
      }
      setValue("StrategySegmentType", inst.SegmentType, { shouldDirty: true });
      setValue("StrategyScriptList", [scriptData], { shouldDirty: true });

      updatePayload({
        StrategySegmentType: inst.SegmentType,
        StrategyScriptList: [scriptData],
      });
    }
  }, [
    selectedInstrument,
    selectedEquityInstruments,
    reset,
    setValue,
    selectedStrategyTypes,
    updatePayload,
  ]);

  const onSubmit = (values) => {
    // Merge form values with Zustand payload for complete state
    const mergedValues = mergeWithDefaults({ ...strategyPayload, ...values });

    const validateAndNormalize = (raw) => {
      const errors = [];
      const clone = { ...raw };

      const checkEqArray = (arr, label) => {
        if (!Array.isArray(arr)) return;
        arr.forEach((eq, idx) => {
          if (
            (eq.indicator?.indicatorId && eq.indicator.indicatorId !== 0) ||
            (eq.comparerIndicator?.indicatorId &&
              eq.comparerIndicator.indicatorId !== 0)
          ) {
            if (!eq.comparerId || eq.comparerId === 0)
              errors.push(`${label} comparer missing (row ${idx + 1}).`);
            if (!eq.indicator?.indicatorId)
              errors.push(`${label} left indicator missing (row ${idx + 1}).`);
            if (!eq.comparerIndicator?.indicatorId)
              errors.push(`${label} right indicator missing (row ${idx + 1}).`);
          }
        });
      };
      checkEqArray(clone.LongEntryEquation, "Long Entry");
      checkEqArray(clone.ShortEntryEquation, "Short Entry");
      checkEqArray(clone.Long_ExitEquation, "Long Exit");
      checkEqArray(clone.Short_ExitEquation, "Short Exit");

      if (
        !Array.isArray(clone.StrategyScriptList) ||
        !clone.StrategyScriptList.length
      ) {
        errors.push("At least one instrument script is required.");
      } else {
        clone.StrategyScriptList = clone.StrategyScriptList.map(
          (script, sIdx) => {
            const sc = { ...script };
            const qtyParsed = Number(sc.Qty);
            if (!Number.isFinite(qtyParsed) || qtyParsed <= 0) {
              sc.Qty = 1;
              errors.push(`Quantity auto-set to 1 (script ${sIdx + 1}).`);
            }
            const fixStrikes = (list, sideLabel) =>
              Array.isArray(list)
                ? list.map((st, i) => {
                    const stc = { ...st };
                    if (!stc.Qty || +stc.Qty <= 0) {
                      if (sc.Qty && +sc.Qty > 0) {
                        stc.Qty = sc.Qty;
                      } else {
                        errors.push(
                          `Strike Qty must be > 0 (script ${
                            sIdx + 1
                          }, ${sideLabel} row ${i + 1}).`
                        );
                      }
                    }
                    if (!stc.StopLoss || +stc.StopLoss <= 0) {
                      stc.StopLoss = 30;
                    }
                    if (stc.reEntry?.isRentry) {
                      if (
                        stc.reEntry.TradeCycle === "0" ||
                        stc.reEntry.TradeCycle === 0 ||
                        stc.reEntry.TradeCycle === null ||
                        stc.reEntry.TradeCycle === undefined ||
                        stc.reEntry.TradeCycle === ""
                      ) {
                        stc.reEntry = {
                          ...stc.reEntry,
                          TradeCycle: "1",
                        };
                        errors.push(
                          `TradeCycle auto-set to 1 (script ${
                            sIdx + 1
                          }, ${sideLabel} row ${i + 1}).`
                        );
                      }
                    }
                    return stc;
                  })
                : [];
            sc.LongEquationoptionStrikeList = fixStrikes(
              sc.LongEquationoptionStrikeList,
              "Long strike"
            );
            sc.ShortEquationoptionStrikeList = fixStrikes(
              sc.ShortEquationoptionStrikeList,
              "Short strike"
            );
            return sc;
          }
        );
      }

      return { errors, normalized: clone };
    };

    const { errors, normalized } = validateAndNormalize(mergedValues);
    if (errors.length) {
      console.warn(
        "Strategy validation issues (non-blocking, server will validate):",
        errors
      );
    }

    // Update Zustand store with normalized values
    setPayload(normalized);

    // Store normalized values to be used when creating strategy
    window.strategyFormData = normalized;

    // If in edit mode, directly save without showing popup
    if (editing) {
      handleCreateStrategy(false); // Save and go to strategies page
      return;
    }

    // Always show backtest confirmation modal for creation
    // (whether it's first time or updating an existing backtest)
    openBacktestModal();
  };

  const handleCreateStrategy = (shouldBacktest = false) => {
    const valuesNorm = window.strategyFormData;
    const payload = buildStrategyPayload({
      values: valuesNorm,
      ui: {
        selectedStrategyTypes,
        selectedInstrument,
        selectedEquityInstruments,
        showBacktestComponent,
        createdStrategyId,
      },
    });

    mutate(payload, {
      onSuccess: async (data) => {
        const isUpdating = showBacktestComponent && createdStrategyId;

        if (isUpdating) {
          // If updating existing strategy, show success message and keep backtest component
          toast.success("Strategy updated successfully");
          // No need to refetch or find strategy ID since we already have it
          // Just scroll to backtest section if user chose to backtest
          if (shouldBacktest) {
            setTimeout(() => {
              const backtestElement =
                document.getElementById("backtest-section");
              if (backtestElement) {
                backtestElement.scrollIntoView({ behavior: "smooth" });
              }
            }, 100);
          }
        } else {
          // Creating new strategy
          toast.success("Strategy created successfully");

          // Since response doesn't contain ID, fetch strategy by name
          try {
            const strategiesResponse = await refetchUserStrategies();
            const strategies = strategiesResponse?.data?.strategies || [];

            // Find the created strategy by matching name
            const createdStrategy = strategies.find(
              (strategy) => strategy.StrategyName === valuesNorm.StrategyName
            );

            if (createdStrategy) {
              setCreatedStrategyId(createdStrategy.StrategyId);

              if (shouldBacktest) {
                // Don't reset form, show backtest component
                showBacktest(true);
                // Scroll to backtest section after a short delay
                setTimeout(() => {
                  const backtestElement =
                    document.getElementById("backtest-section");
                  if (backtestElement) {
                    backtestElement.scrollIntoView({ behavior: "smooth" });
                  }
                }, 100);
              } else {
                // Reset form and navigate to strategies
                navigateToStrategies();
              }
            } else {
              // Fallback if strategy not found in list
              console.warn(
                "Created strategy not found in user strategies list"
              );
              if (shouldBacktest) {
                toast.warning(
                  "Strategy created but couldn't find ID for backtest. Please navigate to backtest manually."
                );
              }
              if (!shouldBacktest) {
                navigateToStrategies();
              }
            }
          } catch (error) {
            console.error("Error fetching strategies after creation:", error);
            toast.warning(
              "Strategy created successfully, but couldn't load backtest. Please refresh and try again."
            );
            if (!shouldBacktest) {
              navigateToStrategies();
            }
          }
        }

        // If user chose "No, Skip" and we're updating, navigate to strategies
        if (isUpdating && !shouldBacktest) {
          navigateToStrategies();
        }
      },
      onError: (e) => {
        toast.error(e?.message || "Failed to create strategy");
      },
    });

    // Close modal
    closeBacktestModal();
  };

  const hideLeg1 =
    selectedStrategyTypes[0] === "indicator" &&
    (selectedEquityInstruments.length > 0 ||
      (selectedInstrument &&
        (selectedInstrument.SegmentType === "Equity" ||
          selectedInstrument.SegmentType === "Future")));
  const isPriceBased = selectedStrategyTypes?.[0] === "price";

  if (editing && editLoading) {
    return <StrategyBuilderSkeleton />;
  }
  if (editing && editError) {
    return <div className="p-6 text-red-500">Failed to load strategy.</div>;
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 text-sm text-gray-700 dark:text-gray-200 overflow-hidden"
      >
        {editing && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={navigateToStrategies}
              className="inline-flex items-center gap-2 text-sm text-[#0096FF] hover:underline"
            >
              <span className="text-lg">←</span>
              <span>Back to Strategies</span>
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-xl space-y-4 w-full bg-white dark:bg-[#131419] dark:border-[#1E2027] self-start h-[166px]">
                <h2 className="font-semibold dark:text-white">Strategy Type</h2>
                <div className="space-y-2">
                  {[
                    { id: "time", label: "Time Based" },
                    { id: "indicator", label: "Indicator Based" },
                    { id: "price", label: "Price Action Based" },
                  ].map((type) => (
                    <label
                      key={type.id}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStrategyTypes.includes(type.id)}
                        onChange={() => handleStrategyChange(type.id)}
                      />
                      <span className="break-words dark:text-gray-300">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="p-4 border rounded-xl space-y-4 w-full bg-white dark:bg-[#131419] dark:border-[#1E2027] md:min-h-[166px] flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold dark:text-white">
                      Select Instruments
                    </h2>
                    {selectedStrategyTypes?.[0] === "indicator" && (
                      <div className="relative group">
                        <button
                          type="button"
                          aria-label="Equity selection limit"
                          className="w-5 h-5 rounded-full border border-gray-300 dark:border-[#2A2D35] text-[10px] text-gray-500 dark:text-gray-300 flex items-center justify-center bg-white dark:bg-[#1E2027]"
                        >
                          <FiInfo className="text-xs" />
                        </button>
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 text-[10px] text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2027] border border-gray-200 dark:border-[#2A2D35] rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                          Equity mode allows selecting a maximum of 50
                          instruments.
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={`border-dashed border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer dark:border-[#1E2027] dark:bg-[#1E2027] transition-all ${
                      selectedInstrument || selectedEquityInstruments.length
                        ? "min-h-[2.5rem] py-2"
                        : "min-h-[6rem]"
                    }`}
                    onClick={openInstrumentModal}
                  >
                    <span
                      className={`text-gray-400 dark:text-gray-500 ${
                        selectedInstrument || selectedEquityInstruments.length
                          ? "text-sm"
                          : "text-xl"
                      }`}
                    >
                      + Add
                    </span>
                  </div>

                  {selectedInstrument && !selectedEquityInstruments.length && (
                    <div className="mt-2 border rounded-lg p-4 text-xs bg-white dark:bg-[#1E2027] dark:border-[#2A2D35] shadow-sm relative">
                      {(selectedInstrument.SegmentType === "Equity" ||
                        selectedInstrument.SegmentType === "Future") && (
                        <button
                          type="button"
                          onClick={() => setSelectedInstrument("")}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-colors"
                          title="Remove instrument"
                        >
                          <span className="text-sm font-bold">×</span>
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Instrument Name
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selectedInstrument.Name}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Lot Size
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selectedInstrument.LotSize || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Exchange
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selectedInstrument.Exchange ||
                              selectedInstrument.Segment ||
                              "—"}
                          </div>
                        </div>
                        {(selectedInstrument.SegmentType === "Equity" ||
                          selectedInstrument.SegmentType === "Future") && (
                          <div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Quantity
                            </div>
                            <input
                              type="number"
                              min="1"
                              value={resolveQtyValue(
                                watchedScripts?.[0]?.Qty,
                                defaultLotQty(selectedInstrument.LotSize)
                              )}
                              onChange={(e) =>
                                handleSingleQtyChange(e.target.value)
                              }
                              onBlur={handleSingleQtyBlur}
                              className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#2A2D35] rounded-md bg-white dark:bg-[#131419] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEquityInstruments.length > 0 && (
                    <div className="mt-2 flex-1 overflow-y-auto max-h-[300px] md:max-h-[220px]">
                      <div className="flex flex-col gap-2">
                        {selectedEquityInstruments.map((ins, idx) => (
                          <div
                            key={ins.InstrumentToken || ins.Name || idx}
                            className="flex-shrink-0"
                          >
                            {renderEquityInstrumentRow({
                              index: idx,
                              style: {},
                              ariaAttributes: {},
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {isPriceBased && <ComingSoonOverlay />}
              </div>
              <InstrumentModal
                visible={showInstrumentModal}
                onClose={closeInstrumentModal}
                selected={selectedInstrument}
                setSelected={setSelectedInstrument}
                selectedList={selectedEquityInstruments}
                setSelectedList={setSelectedEquityInstruments}
                selectedStrategyTypes={selectedStrategyTypes}
              />
            </div>

            {!hideLeg1 && (
              <OrderType
                selectedStrategyTypes={selectedStrategyTypes}
                comingSoon={isPriceBased}
                hideLeg1={hideLeg1}
              />
            )}
          </div>

          <div className="overflow-x-hidden">
            {!hideLeg1 && (
              <Leg1
                key={selectedStrategyTypes?.[0] || "leg1"}
                selectedStrategyTypes={selectedStrategyTypes}
                selectedInstrument={selectedInstrument}
                comingSoon={isPriceBased}
                editing={editing}
              />
            )}
            {hideLeg1 && (
              <div className="mt-0">
                <OrderType
                  selectedStrategyTypes={selectedStrategyTypes}
                  comingSoon={isPriceBased}
                  hideLeg1={hideLeg1}
                />
              </div>
            )}
          </div>
        </div>

        {selectedStrategyTypes[0] === "indicator" && (
          <EntryCondition selectedStrategyTypes={selectedStrategyTypes} />
        )}

        <div className="overflow-x-hidden">
          <RiskAndAdvance
            key={selectedStrategyTypes?.[0] || "risk"}
            selectedStrategyTypes={selectedStrategyTypes}
            comingSoon={isPriceBased}
          />
        </div>

        {isCncOrBtst && (
          <div className="flex items-start gap-2 text-sm">
            <input
              id="terminal-connection-ack"
              type="checkbox"
              className="mt-1"
              checked={terminalConnectionAccepted}
              onChange={(e) => setTerminalConnectionAccepted(e.target.checked)}
            />
            <label htmlFor="terminal-connection-ack" className="select-none">
              I understand that failure to connect my trading terminal and
              trade engine before market opens may result in delayed or missed
              executions.
            </label>
          </div>
        )}

        {/* Mobile view: fixed button at bottom */}
        <div className="md:hidden mobile-buttons-container">
          <PrimaryButton
            type="submit"
            disabled={isPending || (isCncOrBtst && !terminalConnectionAccepted)}
            className="px-8 py-3 text-sm w-full max-w-xs"
          >
            {isPending
              ? editing
                ? "Saving..."
                : "Saving..."
              : editing
              ? "Save"
              : "Create"}
          </PrimaryButton>
        </div>

        {/* Desktop view: normal button placement */}
        <div className="flex justify-end">
          <PrimaryButton
            type="submit"
            disabled={isPending || (isCncOrBtst && !terminalConnectionAccepted)}
            className="ml-auto md:px-8 px-4 py-3 text-sm hidden md:block"
          >
            {isPending
              ? editing
                ? "Saving..."
                : "Saving..."
              : editing
              ? "Save"
              : "Create"}
          </PrimaryButton>
        </div>

        {/* Spacer for mobile view to prevent content from being hidden behind fixed button */}
        <div className="mobile-button-spacer md:hidden"></div>

        {/* Backtest Confirmation Modal */}
        {showBacktestModal &&
          createPortal(
            <div
              onClick={closeBacktestModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] px-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#15171C] rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold mb-4 dark:text-white">
                  Create Strategy
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Do you want to backtest this strategy after creating it?
                </p>
                <div className="flex gap-3">
                  <PrimaryButton
                    onClick={() => handleCreateStrategy(true)}
                    disabled={isPending}
                    className="flex-1 px-4 py-2 text-sm"
                  >
                    {isPending ? "Creating..." : "Yes, Backtest"}
                  </PrimaryButton>
                  <button
                    onClick={() => handleCreateStrategy(false)}
                    disabled={isPending}
                    className="flex-1 bg-gray-200 dark:bg-[#1E2027] text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {isPending ? "Creating..." : "No, Skip"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </form>

      {/* Backtest Component - shown below the form when user chooses to backtest */}
      {showBacktestComponent && createdStrategyId && (
        <div
          id="backtest-section"
          className="mt-8 border-t pt-8 dark:border-[#1E2027]"
        >
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Strategy Created Successfully!
            </h2>
            <p className="text-blue-600 dark:text-blue-300 text-sm">
              Your strategy has been created. You can now backtest it using the
              options below, or modify the strategy above and update it by
              creating again.
            </p>
          </div>
          <BacktestStrategyComponent
            initialStrategyId={createdStrategyId.toString()}
            strategyBuilder={true}
          />
        </div>
      )}
    </FormProvider>
  );
};

export default StrategyBuilder;
