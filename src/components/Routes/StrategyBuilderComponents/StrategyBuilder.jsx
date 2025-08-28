import { useEffect, useState, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useCreateStrategyMutation } from "../../../hooks/strategyHooks";
import { toast } from "react-toastify";
import Leg1 from "./Leg1";
import OrderType from "./OrderType";
import RiskAndAdvance from "./RiskAndAdvance";
import EntryCondition from "./EntryCondition";
import InstrumentModal from "./InstrumentModal";

const StrategyBuilder = () => {
  const initialFormValuesRef = useRef({
    StrategyName: "",
    StrategyType: "time",
    StrategySegmentType: "",
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

    const payload = {
      ...valuesNorm,
      StrategyType: null,
      StrategySegmentType:
        valuesNorm.StrategyType === "time" ? "OPTION" : mappedSegment,
      StrategyExecutionType: executionType,
      StrategyScriptList: StrategyScriptListFinal,
      TradeStopTime: valuesNorm.TradeStopTime || valuesNorm.AutoSquareOffTime,
      EntryRule: null,
      ExitRule: null,
      LongEntryEquation: toNullIfEmpty(valuesNorm.LongEntryEquation),
      ShortEntryEquation: toNullIfEmpty(valuesNorm.ShortEntryEquation),
      Long_ExitEquation: toNullIfEmpty(valuesNorm.Long_ExitEquation),
      Short_ExitEquation: toNullIfEmpty(valuesNorm.Short_ExitEquation),
    };

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

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 text-sm text-gray-700 dark:text-gray-200 overflow-hidden"
      >
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

            <OrderType selectedStrategyTypes={selectedStrategyTypes} />
          </div>

          <div className="overflow-x-hidden">
            {!hideLeg1 && (
              <Leg1
                selectedStrategyTypes={selectedStrategyTypes}
                selectedInstrument={selectedInstrument}
              />
            )}
          </div>
        </div>

        {selectedStrategyTypes[0] === "indicator" && <EntryCondition />}

        <div className="overflow-x-hidden">
          <RiskAndAdvance selectedStrategyTypes={selectedStrategyTypes} />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="ml-auto bg-[#0096FF] text-white md:px-8 px-4 py-3 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Create"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default StrategyBuilder;
