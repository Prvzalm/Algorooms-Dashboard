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
      StrategyType: "",
      StrategySegmentType: "",
      ProductType: "",
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
      isBtSt: true,
    },
  });
  const { handleSubmit, setValue, reset, getValues } = methods;
  const { mutate, isPending } = useCreateStrategyMutation();
  const [selectedStrategyTypes, setSelectedStrategyTypes] = useState([]);
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);

  const handleStrategyChange = (id) => {
    setSelectedStrategyTypes((prev) => (prev.includes(id) ? [] : [id]));
  };

  useEffect(() => {
    // Enforce API constraint: Only Option category allowed if time-based
    if (selectedStrategyTypes[0] === "time") {
      setValue("StrategySegmentType", "Option", { shouldDirty: true });
    }
    setValue("StrategyType", selectedStrategyTypes[0] || "", { shouldDirty: true });
  }, [selectedStrategyTypes, setValue]);

  useEffect(() => {
    if (selectedInstrument && selectedInstrument.SegmentType) {
      setValue("StrategySegmentType", selectedInstrument.SegmentType, { shouldDirty: true });
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
    // Normalize StrategySegmentType codes per backend spec
    const segmentMap = {
      Option: "OPTION",
      Equity: "NSE",
      Future: "NFO-FUT",
      Indices: "INDICES",
      CDS: "CDS-FUT",
      MCX: "MCX",
    };
    const mappedSegment = segmentMap[values.StrategySegmentType] || values.StrategySegmentType;

    if (values.StrategyType === "time" && mappedSegment !== "OPTION") {
      toast.error("Please select option category for BT-ST functionality");
      return;
    }

    // StrategyExecutionType based on StrategyType
    const executionType = values.StrategyType === "time" ? "tb" : values.StrategyType === "indicator" ? "ib" : "pa";

    // StrategyScriptList enrichment: ensure instrument details present
    const currentScripts = Array.isArray(values.StrategyScriptList) ? values.StrategyScriptList : [];
    const firstScript = currentScripts[0] || {};
    const enrichedScripts = [
      {
        InstrumentToken: selectedInstrument?.InstrumentToken || firstScript.InstrumentToken || "",
        InstrumentName: selectedInstrument?.Name || firstScript.InstrumentName || "",
        Qty: selectedInstrument?.LotSize || firstScript.Qty || 0,
        LongEquationoptionStrikeList: firstScript.LongEquationoptionStrikeList || [],
        ShortEquationoptionStrikeList: firstScript.ShortEquationoptionStrikeList || [],
        StrikeTickValue: selectedInstrument?.StrikeTickValue || firstScript.StrikeTickValue || 0,
      },
    ];

    const payload = {
      ...values,
      StrategySegmentType: values.StrategyType === "time" ? "OPTION" : mappedSegment,
      StrategyExecutionType: executionType,
      StrategyScriptList: enrichedScripts,
      TradeStopTime: values.TradeStopTime || values.AutoSquareOffTime, // align with working flow where stop time is captured
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-sm text-gray-700 dark:text-gray-200 overflow-hidden">
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
                  <label key={type.id} className="flex items-center space-x-2">
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
