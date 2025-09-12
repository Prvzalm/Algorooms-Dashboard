import { useEffect, useState, useRef, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  useCreateStrategyMutation,
  useStrategyDetailsForEdit,
} from "../../../hooks/strategyHooks";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import Leg1 from "./Leg1";
import OrderType from "./OrderType";
import RiskAndAdvance from "./RiskAndAdvance";
import EntryCondition from "./EntryCondition";
import InstrumentModal from "./InstrumentModal";
import "./MobileButtons.css"; // Import mobile button styles

const StrategyBuilder = () => {
  const { strategyId } = useParams();
  const editing = !!strategyId;
  const initialFormValuesRef = useRef({
    StrategyName: "",
    StrategyType: "time",
    StrategySegmentType: "",
    ActiveLegIndex: 0,
    ProductType: 0,
    TradeStartTime: "09:16",
    AutoSquareOffTime: "15:15",
    ActiveDays: ["MON", "TUE", "WED", "THU", "FRI"],
    ExitWhenTotalProfit: 0,
    ExitWhenTotalLoss: 0,
    TrailProfitType: 0,
    LockProfitAt: 0,
    LockProfit: 0,
    TrailProfitBy: 0,
    Trail_SL: 0,
    SquareOffAllOptionLegOnSl: false,
    StrategyScriptList: [],
    LongEntryEquation: [
      {
        comparerId: 0,
        comparerName: "string",
        OperatorId: 0,
        OperatorName: "string",
        indicator: {
          indicatorId: 0,
          IndicatorParamList: [
            { ParamId: "string", IndicatorParamValue: "string" },
          ],
        },
        comparerIndicator: {
          indicatorId: 0,
          IndicatorParamList: [
            { ParamId: "string", IndicatorParamValue: "string" },
          ],
        },
      },
    ],
    ShortEntryEquation: [
      {
        comparerId: 0,
        comparerName: "string",
        OperatorId: 0,
        OperatorName: "string",
        indicator: {
          indicatorId: 0,
          IndicatorParamList: [
            { ParamId: "string", IndicatorParamValue: "string" },
          ],
        },
        comparerIndicator: {
          indicatorId: 0,
          IndicatorParamList: [
            { ParamId: "string", IndicatorParamValue: "string" },
          ],
        },
      },
    ],
    Long_ExitEquation: [],
    Short_ExitEquation: [],
    IsChartOnOptionStrike: false,
    isBtSt: false,
    StrategyId: 0,
    Interval: 1,
    SL: 0,
    Target: 0,
    Privacy: "Private",
    Copy_Allowed: false,
    StrategyExecuterId: 0,
    OrderType: 0,
    TransactionType: 0,
    TpSLType: 0,
    MinimumCapital: 0,
    ProfitTranches: 0,
    strategyTag: "any",
    RiskDescription: null,
    subscriptionprice: 0,
    subscriptiondays: 0,
    MaxTrade: 0,
    MaxDD: 0,
    Roi: 0,
    isTradeOnTriggerCandle: false,
    BuyWhen: null,
    ShortWhen: null,
    IsContiniousTriggerCandle: false,
    ChartType: 1,
    EntryDaysBeforExpiry: 0,
    ExitDaysBeforExpiry: 4,
  });

  const methods = useForm({
    defaultValues: initialFormValuesRef.current,
  });
  const { handleSubmit, setValue, reset, getValues } = methods;
  const { mutate, isPending } = useCreateStrategyMutation();
  const {
    data: editDetails,
    isLoading: editLoading,
    isError: editError,
  } = useStrategyDetailsForEdit(strategyId, editing);
  const navigate = useNavigate();
  const [selectedStrategyTypes, setSelectedStrategyTypes] = useState(["time"]);
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [selectedEquityInstruments, setSelectedEquityInstruments] = useState(
    []
  );
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);

  const handleStrategyChange = (id) => {
    if (selectedStrategyTypes.includes(id)) return;
    const baseDefaults = initialFormValuesRef.current;
    reset({
      ...baseDefaults,
      StrategyType: id,
      StrategySegmentType: id === "time" ? "Option" : "",
    });
    setSelectedInstrument("");
    setSelectedEquityInstruments([]);
    setSelectedStrategyTypes([id]);
  };

  // Prefill when in edit mode and API data loaded
  useEffect(() => {
    if (!editing) return;
    if (editLoading || editError) return;
    if (!editDetails) return;
    try {
      // Map API shape to form values; using direct fields when name matches
      const d = editDetails;
      const mapped = {
        StrategyName: d.StrategyName || "",
        StrategyType:
          d.StrategyType === "Select" ? "time" : d.StrategyType || "time",
        StrategySegmentType:
          d.StrategySegmentType === "OPTION"
            ? "Option"
            : d.StrategySegmentType || "Option",
        ProductType: d.ProductType || 0,
        TradeStartTime: d.TradeStartTime || "09:16",
        AutoSquareOffTime: d.AutoSquareOffTime || d.TradeStopTime || "15:15",
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
        IsChartOnOptionStrike: d.IsChartOnOptionStrike || false,
        isBtSt: d.isBtSt || false,
        StrategyId: d.StrategyId || 0,
        Interval: d.Interval || 1,
        SL: d.SL || 0,
        Target: d.Target || 0,
        Privacy: d.Privacy || "Private",
        Copy_Allowed: d.Copy_Allowed || false,
        StrategyExecuterId: d.StrategyExecuterId || 0,
        OrderType: d.OrderType || 0,
        TransactionType: d.TransactionType || 0,
        TpSLType: d.TpSLType || 0,
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
        ChartType: d.ChartType || 1,
        EntryDaysBeforExpiry: d.EntryDaysBeforExpiry || 0,
        ExitDaysBeforExpiry: d.ExitDaysBeforExpiry || 4,
      };
      reset(mapped);
      setSelectedStrategyTypes([mapped.StrategyType]);
      // Instrument inference
      if (mapped.StrategyScriptList?.[0]) {
        setSelectedInstrument({
          Name: mapped.StrategyScriptList[0].InstrumentName,
          InstrumentToken: mapped.StrategyScriptList[0].InstrumentToken,
          SegmentType: mapped.StrategySegmentType,
          LotSize: mapped.StrategyScriptList[0].Qty || 0,
        });
      }
    } catch (e) {
      console.error("Failed to prefill edit strategy", e);
      toast.error("Failed to load strategy for edit");
    }
  }, [editing, editDetails, editLoading, editError, reset]);

  useEffect(() => {
    setValue("StrategyType", selectedStrategyTypes[0] || "", {
      shouldDirty: true,
    });
    if (selectedStrategyTypes[0] === "time") {
      const currentSeg = methods.getValues("StrategySegmentType");
      if (currentSeg !== "Option") {
        setValue("StrategySegmentType", "Option", { shouldDirty: true });
      }
    }
  }, [selectedStrategyTypes, setValue, methods]);

  useEffect(() => {
    if (selectedInstrument && selectedInstrument.SegmentType) {
      setValue("StrategySegmentType", selectedInstrument.SegmentType, {
        shouldDirty: true,
      });
      const scripts = getValues("StrategyScriptList") || [];
      const first = scripts[0];
      if (scripts.length === 0 || !first?.InstrumentName) {
        setValue(
          "StrategyScriptList",
          [
            {
              InstrumentToken: selectedInstrument.InstrumentToken || "",
              InstrumentName: selectedInstrument.Name || "",
              Qty: 0,
              LongEquationoptionStrikeList: [],
              ShortEquationoptionStrikeList: [],
              StrikeTickValue: 0,
            },
          ],
          { shouldDirty: true }
        );
      }
    }
  }, [selectedInstrument, setValue, getValues]);

  useEffect(() => {
    if (selectedStrategyTypes[0] !== "indicator") return;
    if (!selectedEquityInstruments.length) return;

    setValue("StrategySegmentType", "Equity", { shouldDirty: true });

    const buildDefaultStrike = (strikeType) => ({
      TransactionType: "SELL",
      StrikeType: strikeType,
      StrikeValueType: 0,
      StrikeValue: 0,
      SLActionTypeId: "ONPRICE",
      TargetActionTypeId: "ONPRICE",
      isTrailSL: true,
      IsRecursive: true,
      IsMoveSLCTC: true,
      isExitAll: true,
      TargetType: "tgpr",
      SLType: "slpr",
      Target: 0,
      StopLoss: 0,
      Qty: 0,
      isPrePunchSL: true,
      IsPriceDiffrenceConstrant: true,
      PriceDiffrenceConstrantValue: 0,
      ExpiryType: "WEEKLY",
      reEntry: {
        isRentry: true,
        RentryType: "REN",
        TradeCycle: 0,
        RentryActionTypeId: "ON_CLOSE",
      },
      waitNTrade: {
        isWaitnTrade: true,
        isPerPt: "wtpr_+",
        typeId: "wtpr_+",
        MovementValue: 0,
      },
      TrailingSL: {
        TrailingType: "tslpr",
        InstrumentMovementValue: 0,
        TrailingValue: 0,
      },
      strikeTypeobj: {
        type: "ATM",
        StrikeValue: 0,
        RangeFrom: 0,
        RangeTo: 0,
      },
    });

    const scripts = selectedEquityInstruments.map((ins) => ({
      InstrumentToken: ins.InstrumentToken || "",
      InstrumentName: ins.Name || "",
      Qty: 1,
      LongEquationoptionStrikeList: [buildDefaultStrike("PE")],
      ShortEquationoptionStrikeList: [buildDefaultStrike("CE")],
      StrikeTickValue: 0,
    }));

    setValue("StrategyScriptList", scripts, { shouldDirty: true });
  }, [selectedEquityInstruments, selectedStrategyTypes, setValue]);

  useEffect(() => {
    if (
      selectedEquityInstruments.length > 0 &&
      selectedInstrument &&
      selectedInstrument.SegmentType &&
      selectedInstrument.SegmentType !== "Equity"
    ) {
      const inst = selectedInstrument;
      reset();
      setSelectedEquityInstruments([]);
      setValue("StrategyType", selectedStrategyTypes[0], { shouldDirty: true });
      setValue("StrategySegmentType", inst.SegmentType, { shouldDirty: true });
      setValue(
        "StrategyScriptList",
        [
          {
            InstrumentToken: inst.InstrumentToken || "",
            InstrumentName: inst.Name || "",
            Qty: 0,
            LongEquationoptionStrikeList: [],
            ShortEquationoptionStrikeList: [],
            StrikeTickValue: 0,
          },
        ],
        { shouldDirty: true }
      );
    }
  }, [
    selectedInstrument,
    selectedEquityInstruments,
    reset,
    setValue,
    selectedStrategyTypes,
  ]);

  const onSubmit = (values) => {
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
                        stc.reEntry.TradeCycle === 0 ||
                        stc.reEntry.TradeCycle === null ||
                        stc.reEntry.TradeCycle === undefined
                      ) {
                        stc.reEntry = {
                          ...stc.reEntry,
                          TradeCycle: 1,
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

    const { errors, normalized } = validateAndNormalize(values);
    if (errors.length) {
      console.warn(
        "Strategy validation issues (non-blocking, server will validate):",
        errors
      );
    }

    const valuesNorm = normalized;

    const segmentMap = {
      Option: "OPTION",
      Equity: "NSE",
      Future: "NFO-FUT",
      Indices: "INDICES",
      CDS: "CDS-FUT",
      MCX: "MCX",
    };
    const mappedSegment =
      segmentMap[valuesNorm.StrategySegmentType] ||
      valuesNorm.StrategySegmentType;

    if (valuesNorm.StrategyType === "time" && mappedSegment !== "OPTION") {
      console.warn(
        "Time strategy with non-OPTION segment detected; proceeding without client-side block."
      );
    }

    const executionType =
      valuesNorm.StrategyType === "time"
        ? "tb"
        : valuesNorm.StrategyType === "indicator"
        ? "ib"
        : "pa";

    const currentScripts = Array.isArray(valuesNorm.StrategyScriptList)
      ? valuesNorm.StrategyScriptList
      : [];
    const firstScript = currentScripts[0] || {};
    const lotSizeVal = selectedInstrument?.LotSize || firstScript.Qty || 0;

    const buildDefaultStrike = (lot) => ({
      TransactionType: "SELL",
      StrikeType: "PE",
      StrikeValueType: 0,
      StrikeValue: 0,
      Qty: lot,
      TargetType: "tgpr",
      SLType: "slpr",
      Target: 0,
      StopLoss: 30,
      TargetActionTypeId: "ONPRICE",
      SLActionTypeId: "ONPRICE",
      ExpiryType: "WEEKLY",
      lotSize: lot,
      IsMoveSLCTC: false,
      IsPriceDiffrenceConstrant: false,
      PriceDiffrenceConstrantValue: 0,
      isPrePunchSL: false,
      reEntry: {
        isRentry: false,
        RentryType: "REN",
        TradeCycle: 0,
        RentryActionTypeId: "ON_CLOSE",
      },
      waitNTrade: {
        isWaitnTrade: false,
        isPerPt: "wtpr_+",
        typeId: "wtpr_+",
        MovementValue: 0,
      },
      strikeTypeobj: {
        type: "ATM",
        RangeFrom: 0,
        RangeTo: 0,
        StrikeValue: 0,
      },
      isExitAll: false,
      isTrailSL: false,
      TrailingSL: {
        TrailingType: "tslpr",
        InstrumentMovementValue: 0,
        TrailingValue: 0,
      },
    });

    const longOptionStrikes =
      Array.isArray(firstScript.LongEquationoptionStrikeList) &&
      firstScript.LongEquationoptionStrikeList.length > 0
        ? firstScript.LongEquationoptionStrikeList.map((item) => ({
            ...item,
            Qty: item?.Qty || lotSizeVal,
            lotSize: item?.lotSize || lotSizeVal,
            IsMoveSLCTC: item?.IsMoveSLCTC ?? false,
            IsPriceDiffrenceConstrant: item?.IsPriceDiffrenceConstrant ?? false,
            PriceDiffrenceConstrantValue:
              item?.PriceDiffrenceConstrantValue ?? 0,
            isPrePunchSL: item?.isPrePunchSL ?? false,
            reEntry: item?.reEntry ?? {
              isRentry: false,
              RentryType: "REN",
              TradeCycle: 0,
              RentryActionTypeId: "ON_CLOSE",
            },
            waitNTrade: item?.waitNTrade ?? {
              isWaitnTrade: false,
              isPerPt: "wtpr_+",
              typeId: "wtpr_+",
              MovementValue: 0,
            },
            strikeTypeobj: item?.strikeTypeobj ?? {
              type: "ATM",
              RangeFrom: 0,
              RangeTo: 0,
              StrikeValue: 0,
            },
            isExitAll: item?.isExitAll ?? false,
            isTrailSL: item?.isTrailSL ?? false,
            TrailingSL: item?.TrailingSL ?? {
              TrailingType: "tslpr",
              InstrumentMovementValue: 0,
              TrailingValue: 0,
            },
          }))
        : [buildDefaultStrike(lotSizeVal)];

    const isIndicatorEquityMulti =
      selectedStrategyTypes[0] === "indicator" &&
      valuesNorm.StrategySegmentType === "Equity" &&
      selectedEquityInstruments.length > 0;

    let StrategyScriptListFinal;

    if (isIndicatorEquityMulti) {
      StrategyScriptListFinal = valuesNorm.StrategyScriptList;
    } else {
      const enrichedScripts = [
        {
          InstrumentToken:
            selectedInstrument?.InstrumentToken ||
            firstScript.InstrumentToken ||
            "",
          Qty: lotSizeVal,
          LongEquationoptionStrikeList: longOptionStrikes,
          ShortEquationoptionStrikeList: Array.isArray(
            firstScript.ShortEquationoptionStrikeList
          )
            ? firstScript.ShortEquationoptionStrikeList
            : [],
        },
      ];
      StrategyScriptListFinal = enrichedScripts;
    }

    const toNullIfEmpty = (val) => {
      if (Array.isArray(val)) return val.length > 0 ? val : null;
      return val === "" ? null : val ?? null;
    };

    const payloadBase = {
      ...valuesNorm,
      StrategyType: null,
      StrategySegmentType:
        valuesNorm.StrategyType === "time" ? "OPTION" : mappedSegment,
      StrategyExecutionType: executionType,
      StrategyScriptList: StrategyScriptListFinal,
      TradeStopTime: valuesNorm.TradeStopTime || valuesNorm.AutoSquareOffTime,
      EntryRule: null,
      ExitRule: null,
      Long_ExitEquation: toNullIfEmpty(valuesNorm.Long_ExitEquation),
      Short_ExitEquation: toNullIfEmpty(valuesNorm.Short_ExitEquation),
    };

    // Include entry equations only for indicator strategies
    if (valuesNorm.StrategyType === "indicator") {
      payloadBase.LongEntryEquation = toNullIfEmpty(
        valuesNorm.LongEntryEquation
      );
      payloadBase.ShortEntryEquation = toNullIfEmpty(
        valuesNorm.ShortEntryEquation
      );
    } else {
      payloadBase.LongEntryEquation = null;
      payloadBase.ShortEntryEquation = null;
    }

    const payload = payloadBase;

    mutate(payload, {
      onSuccess: () => {
        toast.success("Strategy created");
        reset();
      },
      onError: (e) => {
        toast.error(e?.message || "Failed to create strategy");
      },
    });
  };

  const hideLeg1 =
    selectedStrategyTypes[0] === "indicator" &&
    (selectedEquityInstruments.length > 0 ||
      (selectedInstrument && selectedInstrument.SegmentType === "Equity"));

  if (editing && editLoading) {
    return <div className="p-6">Loading strategy...</div>;
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
              onClick={() => navigate("/strategies")}
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
              <div className="p-4 border rounded-xl space-y-4 w-full dark:bg-[#15171C] dark:border-[#1E2027]">
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
                      <span className="break-words">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-4 border rounded-xl space-y-4 w-full dark:bg-[#15171C] dark:border-[#1E2027]">
                <h2 className="font-semibold dark:text-white">
                  Select Instruments
                </h2>
                <div
                  className="border-dashed border border-gray-300 min-h-[6rem] rounded-lg flex items-center justify-center cursor-pointer dark:border-[#1E2027] dark:bg-[#1E2027]"
                  onClick={() => setShowInstrumentModal(true)}
                >
                  <span className="text-gray-400 dark:text-gray-500 text-xl">
                    {selectedInstrument || selectedEquityInstruments.length
                      ? "Change"
                      : "+ Add"}
                  </span>
                </div>

                {selectedInstrument && !selectedEquityInstruments.length && (
                  <div className="mt-2 border rounded-lg p-3 text-xs flex flex-col gap-1 dark:bg-[#1E2027] dark:border-[#1E2027]">
                    <div>
                      <span className="font-semibold">Name: </span>
                      {selectedInstrument.Name}
                    </div>
                    <div>
                      <span className="font-semibold">Lot Size: </span>
                      {selectedInstrument.LotSize || 0}
                    </div>
                    <div>
                      <span className="font-semibold">Exchange: </span>
                      {selectedInstrument.Exchange ||
                        selectedInstrument.Segment ||
                        "—"}
                    </div>
                  </div>
                )}

                {selectedEquityInstruments.length > 0 && (
                  <div className="mt-2 space-y-3">
                    {selectedEquityInstruments.map((ins) => (
                      <div
                        key={ins.InstrumentToken}
                        className="border rounded-lg p-3 text-xs flex flex-col gap-1 dark:bg-[#1E2027] dark:border-[#1E2027]"
                      >
                        <div>
                          <span className="font-semibold">Name: </span>
                          {ins.Name}
                        </div>
                        <div>
                          <span className="font-semibold">Lot Size: </span>
                          {ins.LotSize || 0}
                        </div>
                        <div>
                          <span className="font-semibold">Exchange: </span>
                          {ins.Exchange || ins.Segment || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <InstrumentModal
                visible={showInstrumentModal}
                onClose={() => setShowInstrumentModal(false)}
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
                hideLeg1={hideLeg1}
              />
            )}
          </div>

          <div className="overflow-x-hidden">
            {!hideLeg1 && (
              <Leg1
                selectedStrategyTypes={selectedStrategyTypes}
                selectedInstrument={selectedInstrument}
                editing={editing}
              />
            )}
            {hideLeg1 && (
              <div className="mt-0">
                <OrderType
                  selectedStrategyTypes={selectedStrategyTypes}
                  hideLeg1={hideLeg1}
                />
              </div>
            )}
          </div>
        </div>

        {selectedStrategyTypes[0] === "indicator" && <EntryCondition />}

        <div className="overflow-x-hidden">
          <RiskAndAdvance selectedStrategyTypes={selectedStrategyTypes} />
        </div>

        {/* Mobile view: fixed button at bottom */}
        <div className="md:hidden mobile-buttons-container">
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#0096FF] text-white px-8 py-3 rounded-lg text-sm font-medium disabled:opacity-50 w-full max-w-xs"
          >
            {isPending
              ? editing
                ? "Saving..."
                : "Saving..."
              : editing
              ? "Save"
              : "Create"}
          </button>
        </div>

        {/* Desktop view: normal button placement */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="ml-auto bg-[#0096FF] text-white md:px-8 px-4 py-3 rounded-lg text-sm font-medium disabled:opacity-50 hidden md:block"
          >
            {isPending
              ? editing
                ? "Saving..."
                : "Saving..."
              : editing
              ? "Save"
              : "Create"}
          </button>
        </div>

        {/* Spacer for mobile view to prevent content from being hidden behind fixed button */}
        <div className="mobile-button-spacer md:hidden"></div>
      </form>
    </FormProvider>
  );
};

export default StrategyBuilder;
