import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useCreateStrategyMutation } from "../../../hooks/strategyHooks";
import { toast } from "react-toastify";
import Leg1 from "./Leg1";
import OrderType from "./OrderType";
import RiskAndAdvance from "./RiskAndAdvance";
import InstrumentModal from "./InstrumentModal";
import EntryCondition from "./EntryCondition";

const StrategyBuilder = () => {
  const methods = useForm({
    defaultValues: {
      StrategyName: "",
      StrategyType: "time",
      StrategySegmentType: "",
      ProductType: 0,
      TradeStartTime: "",
      AutoSquareOffTime: "",
      ActiveDays: [],
      ExitWhenTotalProfit: 0,
      ExitWhenTotalLoss: 0,
      TrailProfitType: 0,
      LockProfitAt: 0,
      LockProfit: 0,
      TrailProfitBy: 0,
      Trail_SL: 0,
      SquareOffAllOptionLegOnSl: false,
      StrategyScriptList: [],
      LongEntryEquation: [],
      ShortEntryEquation: [],
      Long_ExitEquation: [],
      Short_ExitEquation: [],
      IsChartOnOptionStrike: false,
      isBtSt: false,
      StrategyId: 0,
      Interval: 5,
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
      ChartType: 0,
      EntryDaysBeforExpiry: 0,
      ExitDaysBeforExpiry: 4,
    },
  });
  const { handleSubmit, setValue, reset, getValues } = methods;
  const { mutate, isPending } = useCreateStrategyMutation();
  const [selectedStrategyTypes, setSelectedStrategyTypes] = useState(["time"]);
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);

  const handleStrategyChange = (id) => {
    setSelectedStrategyTypes((prev) => {
      if (prev.includes(id)) {
        return prev;
      }
      return [id];
    });
  };

  useEffect(() => {
    if (selectedStrategyTypes[0] === "time") {
      setValue("StrategySegmentType", "Option", { shouldDirty: true });
    }
    setValue("StrategyType", selectedStrategyTypes[0] || "", {
      shouldDirty: true,
    });
  }, [selectedStrategyTypes, setValue]);

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

  const onSubmit = (values) => {
    const segmentMap = {
      Option: "OPTION",
      Equity: "NSE",
      Future: "NFO-FUT",
      Indices: "INDICES",
      CDS: "CDS-FUT",
      MCX: "MCX",
    };
    const mappedSegment =
      segmentMap[values.StrategySegmentType] || values.StrategySegmentType;

    if (values.StrategyType === "time" && mappedSegment !== "OPTION") {
      toast.error("Please select option category for BT-ST functionality");
      return;
    }

    const executionType =
      values.StrategyType === "time"
        ? "tb"
        : values.StrategyType === "indicator"
        ? "ib"
        : "pa";

    const currentScripts = Array.isArray(values.StrategyScriptList)
      ? values.StrategyScriptList
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

    const toNullIfEmpty = (val) => {
      if (Array.isArray(val)) return val.length > 0 ? val : null;
      return val === "" ? null : val ?? null;
    };

    const payload = {
      ...values,
      StrategyType: null,
      StrategySegmentType:
        values.StrategyType === "time" ? "OPTION" : mappedSegment,
      StrategyExecutionType: executionType,
      StrategyScriptList: enrichedScripts,
      TradeStopTime: values.TradeStopTime || values.AutoSquareOffTime,
      EntryRule: null,
      ExitRule: null,
      LongEntryEquation: toNullIfEmpty(values.LongEntryEquation),
      ShortEntryEquation: toNullIfEmpty(values.ShortEntryEquation),
      Long_ExitEquation: toNullIfEmpty(values.Long_ExitEquation),
      Short_ExitEquation: toNullIfEmpty(values.Short_ExitEquation),
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
                    + Add
                  </span>
                </div>

                {selectedInstrument && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs break-words dark:bg-[#1E2027] dark:text-blue-400">
                      {selectedInstrument?.Name || ""}
                    </span>
                  </div>
                )}
              </div>
              <InstrumentModal
                visible={showInstrumentModal}
                onClose={() => setShowInstrumentModal(false)}
                selected={selectedInstrument}
                setSelected={setSelectedInstrument}
              />
            </div>

            <OrderType selectedStrategyTypes={selectedStrategyTypes} />
          </div>

          <div className="overflow-x-hidden">
            <Leg1 selectedStrategyTypes={selectedStrategyTypes} />
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
