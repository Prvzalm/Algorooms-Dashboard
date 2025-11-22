import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import PrimaryButton from "../../common/PrimaryButton";
import Leg1 from "../StrategyBuilderComponents/Leg1";
import OrderType from "../StrategyBuilderComponents/OrderType";
import RiskAndAdvance from "../StrategyBuilderComponents/RiskAndAdvance";
import InstrumentModal from "../StrategyBuilderComponents/InstrumentModal";
import { useCreateStrategyMutation } from "../../../hooks/strategyHooks";
import "../StrategyBuilderComponents/MobileButtons.css";

// Default form values for TradingView signals
const DEFAULT_FORM_VALUES = {
  StrategyName: "",
  StrategyType: "time",
  StrategySegmentType: "Option",
  ActiveLegIndex: 0,
  ProductType: 0,
  TradeStartTime: "09:16",
  AutoSquareOffTime: "15:15",
  ActiveDays: ["MON", "TUE", "WED", "THU", "FRI"],
  StrategyScriptList: [],
  AdvanceFeatures: {},
};

const TradingviewSignalsPage = () => {
  const [selectedStrategyTypes, setSelectedStrategyTypes] = useState([]);
  const [selectedSignals, setSelectedSignals] = useState([]);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState("");

  // Add form methods for components that need FormProvider
  const methods = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
    mode: "onChange",
  });

  const { handleSubmit, setValue, reset } = methods;
  const { mutate, isPending } = useCreateStrategyMutation();

  const handleStrategyChange = (id) => {
    setSelectedStrategyTypes((prev) => (prev.includes(id) ? [] : [id]));
    // Update form value as well
    methods.setValue("StrategyType", id);
  };

  const handleSignalToggle = (signal) => {
    setSelectedSignals((prev) =>
      prev.includes(signal)
        ? prev.filter((s) => s !== signal)
        : [...prev, signal]
    );
  };

  const onSubmit = (values) => {
    // Basic validation for TradingView signals
    if (!selectedSignals.length) {
      toast.error("Please select at least one signal source");
      return;
    }

    if (!selectedStrategyTypes.length) {
      toast.error("Please select a strategy type");
      return;
    }

    if (!selectedInstrument) {
      toast.error("Please select an instrument");
      return;
    }

    // Create a simplified payload for TradingView signals
    const payload = {
      ...values,
      StrategyName: values.StrategyName || "TradingView Signal Strategy",
      StrategyType: selectedStrategyTypes[0],
      StrategySegmentType: selectedInstrument.SegmentType || "Option",
      StrategyExecutionType: "tb", // Time-based by default
      SignalSources: selectedSignals,
      StrategyScriptList: [
        {
          InstrumentToken: selectedInstrument.InstrumentToken || "",
          InstrumentName: selectedInstrument.Name || "",
          Qty: selectedInstrument.LotSize || 1,
          LongEquationoptionStrikeList: [],
          ShortEquationoptionStrikeList: [],
          StrikeTickValue: 0,
        },
      ],
      Privacy: "Private",
      Copy_Allowed: false,
    };

    mutate(payload, {
      onSuccess: () => {
        toast.success("TradingView signal strategy created successfully!");
        reset();
        setSelectedSignals([]);
        setSelectedStrategyTypes([]);
        setSelectedInstrument("");
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
        <div className="p-4 border rounded-xl space-y-4 bg-white dark:bg-[#131419] dark:border-[#1E2027]">
          <h2 className="font-semibold dark:text-white">Select Signal From</h2>
          <div className="flex flex-wrap gap-4">
            {[
              "TradingView Indicators",
              "TradingView Strategy (Pinescript)",
              "Chartink",
              "Multi Stocks from Chartink",
            ].map((signal, i) => (
              <label key={i} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedSignals.includes(signal)}
                  onChange={() => handleSignalToggle(signal)}
                />
                <span>{signal}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-xl space-y-4 w-full bg-white dark:bg-[#131419] dark:border-[#1E2027]">
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

              <div className="p-4 border rounded-xl space-y-4 bg-white dark:bg-[#131419] dark:border-[#1E2027]">
                <h2 className="font-semibold dark:text-white">
                  Select Instruments
                </h2>
                <div
                  onClick={() => setShowInstrumentModal(true)}
                  className="border-dashed border dark:border-[#1E2027] rounded-lg min-h-[6rem] flex items-center justify-center cursor-pointer dark:bg-[#1E2027]"
                >
                  <span className="text-gray-400 dark:text-gray-500 text-xl">
                    + Add
                  </span>
                </div>
                {selectedInstrument && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs break-words dark:bg-[#1E2027] dark:text-blue-400">
                      {selectedInstrument.Name || selectedInstrument}
                    </span>
                  </div>
                )}
              </div>
              <InstrumentModal
                visible={showInstrumentModal}
                onClose={() => setShowInstrumentModal(false)}
                selected={selectedInstrument}
                setSelected={setSelectedInstrument}
                selectedStrategyTypes={selectedStrategyTypes}
              />
            </div>

            <OrderType
              selectedStrategyTypes={selectedStrategyTypes}
              hideLeg1={false}
            />
          </div>

          <div className="overflow-x-hidden">
            <Leg1
              selectedStrategyTypes={selectedStrategyTypes}
              selectedInstrument={selectedInstrument}
              editing={false}
            />
          </div>
        </div>

        <div className="overflow-x-hidden">
          <RiskAndAdvance selectedStrategyTypes={selectedStrategyTypes} />
        </div>

        {/* Mobile view: fixed button at bottom */}
        <div className="md:hidden mobile-buttons-container">
          <PrimaryButton
            type="submit"
            disabled={isPending}
            className="px-8 py-3 rounded-lg text-sm font-medium w-full max-w-xs"
          >
            {isPending ? "Creating..." : "Create Signal Strategy"}
          </PrimaryButton>
        </div>

        {/* Desktop view: normal button placement */}
        <div className="flex justify-end">
          <PrimaryButton
            type="submit"
            disabled={isPending}
            className="ml-auto md:px-8 px-4 py-3 rounded-lg text-sm font-medium hidden md:block"
          >
            {isPending ? "Creating..." : "Create Signal Strategy"}
          </PrimaryButton>
        </div>

        {/* Spacer for mobile view to prevent content from being hidden behind fixed button */}
        <div className="mobile-button-spacer md:hidden"></div>
      </form>
    </FormProvider>
  );
};

export default TradingviewSignalsPage;
