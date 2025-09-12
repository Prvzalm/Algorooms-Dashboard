import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useCreateStrategyMutation,
  useStrategyDetailsForEdit,
} from "../../../hooks/strategyHooks";
import InstrumentModal from "./InstrumentModal";
import OrderType from "./OrderType";
import Leg1 from "./Leg1";
import EntryCondition from "./EntryCondition";
import RiskAndAdvance from "./RiskAndAdvance";
import "./MobileButtons.css";

// Centralized default values
const DEFAULT_FORM_VALUES = {
  StrategyName: "",
  StrategyType: "time",
  StrategySegmentType: "Option",
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
  LongEntryEquation: [],
  ShortEntryEquation: [],
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
  AdvanceFeatures: {},
};

// Strike template for consistent data structure
const createDefaultStrike = (overrides = {}) => ({
  TransactionType: "SELL",
  StrikeType: "CE",
  StrikeValueType: 0,
  StrikeValue: 0,
  SLActionTypeId: "ONPRICE",
  TargetActionTypeId: "ONPRICE",
  TargetType: "tgpr",
  SLType: "slpr",
  Target: "0",
  StopLoss: "30",
  Qty: "0",
  ExpiryType: "WEEKLY",
  strikeTypeobj: { type: "ATM", StrikeValue: 0, RangeFrom: 0, RangeTo: 0 },
  isTrailSL: false,
  IsMoveSLCTC: false,
  isExitAll: false,
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
  TrailingSL: {
    TrailingType: "tslpr",
    InstrumentMovementValue: 0,
    TrailingValue: 0,
  },
  lotSize: 0,
  ...overrides,
});

// Main context for strategy state management
const useStrategyContext = () => {
  const [selectedStrategyTypes, setSelectedStrategyTypes] = useState(["time"]);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [selectedEquityInstruments, setSelectedEquityInstruments] = useState(
    []
  );
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);

  const updateStrategyType = useCallback((newType) => {
    setSelectedStrategyTypes([newType]);
    setSelectedInstrument(null);
    setSelectedEquityInstruments([]);
  }, []);

  return {
    selectedStrategyTypes,
    selectedInstrument,
    selectedEquityInstruments,
    showInstrumentModal,
    setSelectedInstrument,
    setSelectedEquityInstruments,
    setShowInstrumentModal,
    updateStrategyType,
  };
};

const StrategyBuilder = () => {
  const { strategyId } = useParams();
  const navigate = useNavigate();
  const editing = !!strategyId;

  const methods = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
    mode: "onChange",
  });

  const { handleSubmit, setValue, reset, getValues, watch } = methods;
  const { mutate, isPending } = useCreateStrategyMutation();

  const {
    data: editDetails,
    isLoading: editLoading,
    isError: editError,
  } = useStrategyDetailsForEdit(strategyId, editing);

  const strategyContext = useStrategyContext();
  const {
    selectedStrategyTypes,
    selectedInstrument,
    selectedEquityInstruments,
    showInstrumentModal,
    setSelectedInstrument,
    setSelectedEquityInstruments,
    setShowInstrumentModal,
    updateStrategyType,
  } = strategyContext;

  // Debounced form updates to prevent infinite loops
  const updateFormDebounced = useCallback(
    debounce((key, value) => {
      setValue(key, value, { shouldDirty: true });
    }, 100),
    [setValue]
  );

  // Handle strategy type change
  const handleStrategyChange = useCallback(
    (id) => {
      if (selectedStrategyTypes.includes(id)) return;

      updateStrategyType(id);
      reset({
        ...DEFAULT_FORM_VALUES,
        StrategyType: id,
        StrategySegmentType: id === "time" ? "Option" : "",
      });
    },
    [selectedStrategyTypes, updateStrategyType, reset]
  );

  // Prefill edit data
  useEffect(() => {
    if (!editing || editLoading || editError || !editDetails) return;

    try {
      const mappedData = mapEditDataToForm(editDetails);
      reset(mappedData);
      setSelectedStrategyTypes([mappedData.StrategyType]);

      // Set instruments based on strategy data
      if (mappedData.StrategyScriptList?.[0]) {
        const firstScript = mappedData.StrategyScriptList[0];
        setSelectedInstrument({
          Name: firstScript.InstrumentName,
          InstrumentToken: firstScript.InstrumentToken,
          SegmentType: mappedData.StrategySegmentType,
          LotSize: firstScript.Qty || 0,
        });
      }
    } catch (error) {
      console.error("Failed to prefill edit strategy", error);
      toast.error("Failed to load strategy for edit");
    }
  }, [
    editing,
    editDetails,
    editLoading,
    editError,
    reset,
    setSelectedInstrument,
    setSelectedStrategyTypes,
  ]);

  // Sync strategy type with form
  useEffect(() => {
    updateFormDebounced("StrategyType", selectedStrategyTypes[0] || "time");
    if (selectedStrategyTypes[0] === "time") {
      updateFormDebounced("StrategySegmentType", "Option");
    }
  }, [selectedStrategyTypes, updateFormDebounced]);

  // Sync instrument with form
  useEffect(() => {
    if (!selectedInstrument) return;

    updateFormDebounced("StrategySegmentType", selectedInstrument.SegmentType);

    const currentScripts = getValues("StrategyScriptList") || [];
    if (currentScripts.length === 0 || !currentScripts[0]?.InstrumentName) {
      updateFormDebounced("StrategyScriptList", [
        {
          InstrumentToken: selectedInstrument.InstrumentToken || "",
          InstrumentName: selectedInstrument.Name || "",
          Qty: selectedInstrument.LotSize || 0,
          LongEquationoptionStrikeList: [createDefaultStrike()],
          ShortEquationoptionStrikeList:
            selectedStrategyTypes[0] === "indicator"
              ? [createDefaultStrike()]
              : [],
          StrikeTickValue: 0,
        },
      ]);
    }
  }, [
    selectedInstrument,
    getValues,
    updateFormDebounced,
    selectedStrategyTypes,
  ]);

  // Handle equity instruments for indicator strategies
  useEffect(() => {
    if (
      selectedStrategyTypes[0] !== "indicator" ||
      selectedEquityInstruments.length === 0
    )
      return;

    updateFormDebounced("StrategySegmentType", "Equity");

    const scripts = selectedEquityInstruments.map((ins) => ({
      InstrumentToken: ins.InstrumentToken || "",
      InstrumentName: ins.Name || "",
      Qty: 1,
      LongEquationoptionStrikeList: [createDefaultStrike({ StrikeType: "PE" })],
      ShortEquationoptionStrikeList: [
        createDefaultStrike({ StrikeType: "CE" }),
      ],
      StrikeTickValue: 0,
    }));

    updateFormDebounced("StrategyScriptList", scripts);
  }, [selectedEquityInstruments, selectedStrategyTypes, updateFormDebounced]);

  // Form submission
  const onSubmit = useCallback(
    (formValues) => {
      try {
        const payload = buildStrategyPayload(formValues, {
          selectedInstrument,
          selectedEquityInstruments,
          selectedStrategyTypes,
        });

        mutate(payload, {
          onSuccess: () => {
            toast.success(editing ? "Strategy updated" : "Strategy created");
            if (!editing) reset();
            navigate("/strategies");
          },
          onError: (error) => {
            toast.error(
              error?.message ||
                `Failed to ${editing ? "update" : "create"} strategy`
            );
          },
        });
      } catch (error) {
        console.error("Form submission error:", error);
        toast.error("Invalid form data");
      }
    },
    [
      mutate,
      editing,
      reset,
      navigate,
      selectedInstrument,
      selectedEquityInstruments,
      selectedStrategyTypes,
    ]
  );

  // UI state derived values
  const hideLeg1 = useMemo(
    () =>
      selectedStrategyTypes[0] === "indicator" &&
      (selectedEquityInstruments.length > 0 ||
        (selectedInstrument && selectedInstrument.SegmentType === "Equity")),
    [selectedStrategyTypes, selectedEquityInstruments, selectedInstrument]
  );

  if (editing && editLoading) {
    return <div className="p-6">Loading strategy...</div>;
  }

  if (editing && editError) {
    return (
      <div className="p-6 text-red-500">Failed to load strategy details</div>
    );
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
              <StrategyTypeSelector
                selectedTypes={selectedStrategyTypes}
                onChange={handleStrategyChange}
              />

              <InstrumentSelector
                selectedInstrument={selectedInstrument}
                selectedEquityInstruments={selectedEquityInstruments}
                onShowModal={() => setShowInstrumentModal(true)}
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
                : "Creating..."
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
                : "Creating..."
              : editing
              ? "Save"
              : "Create"}
          </button>
        </div>

        {/* Spacer for mobile view */}
        <div className="mobile-button-spacer md:hidden"></div>
      </form>

      <InstrumentModal
        visible={showInstrumentModal}
        onClose={() => setShowInstrumentModal(false)}
        selected={selectedInstrument}
        setSelected={setSelectedInstrument}
        selectedList={selectedEquityInstruments}
        setSelectedList={setSelectedEquityInstruments}
        selectedStrategyTypes={selectedStrategyTypes}
      />
    </FormProvider>
  );
};

// Helper components
const StrategyTypeSelector = ({ selectedTypes, onChange }) => (
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
            checked={selectedTypes.includes(type.id)}
            onChange={() => onChange(type.id)}
          />
          <span className="break-words">{type.label}</span>
        </label>
      ))}
    </div>
  </div>
);

const InstrumentSelector = ({
  selectedInstrument,
  selectedEquityInstruments,
  onShowModal,
}) => (
  <div className="p-4 border rounded-xl space-y-4 w-full dark:bg-[#15171C] dark:border-[#1E2027]">
    <h2 className="font-semibold dark:text-white">Select Instruments</h2>
    <div
      className="border-dashed border border-gray-300 min-h-[6rem] rounded-lg flex items-center justify-center cursor-pointer dark:border-[#1E2027] dark:bg-[#1E2027]"
      onClick={onShowModal}
    >
      <span className="text-gray-400 dark:text-gray-500 text-xl">
        {selectedInstrument || selectedEquityInstruments.length
          ? "Change"
          : "+ Add"}
      </span>
    </div>

    {selectedInstrument && !selectedEquityInstruments.length && (
      <InstrumentDisplay instrument={selectedInstrument} />
    )}

    {selectedEquityInstruments.length > 0 && (
      <div className="mt-2 space-y-3">
        {selectedEquityInstruments.map((ins) => (
          <InstrumentDisplay key={ins.InstrumentToken} instrument={ins} />
        ))}
      </div>
    )}
  </div>
);

const InstrumentDisplay = ({ instrument }) => (
  <div className="mt-2 border rounded-lg p-3 text-xs flex flex-col gap-1 dark:bg-[#1E2027] dark:border-[#1E2027]">
    <div>
      <span className="font-semibold">Name: </span>
      {instrument.Name}
    </div>
    <div>
      <span className="font-semibold">Lot Size: </span>
      {instrument.LotSize || 0}
    </div>
    <div>
      <span className="font-semibold">Exchange: </span>
      {instrument.Exchange || instrument.Segment || "—"}
    </div>
  </div>
);

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function mapEditDataToForm(editDetails) {
  const d = editDetails;
  return {
    ...DEFAULT_FORM_VALUES,
    StrategyName: d.StrategyName || "",
    StrategyType:
      d.StrategyExecutionType === "tb"
        ? "time"
        : d.StrategyExecutionType === "ib"
        ? "indicator"
        : "price",
    StrategySegmentType: d.StrategySegmentType || "",
    ProductType: d.ProductType || 0,
    TradeStartTime: d.TradeStartTime || "09:16",
    AutoSquareOffTime: d.AutoSquareOffTime || "15:15",
    ActiveDays: d.ActiveDays || ["MON", "TUE", "WED", "THU", "FRI"],
    ExitWhenTotalProfit: d.ExitWhenTotalProfit || 0,
    ExitWhenTotalLoss: d.ExitWhenTotalLoss || 0,
    StrategyScriptList: d.StrategyScriptList || [],
    LongEntryEquation: d.LongEntryEquation || [],
    ShortEntryEquation: d.ShortEntryEquation || [],
    Long_ExitEquation: d.Long_ExitEquation || [],
    Short_ExitEquation: d.Short_ExitEquation || [],
    // Add other fields as needed...
  };
}

function buildStrategyPayload(formValues, context) {
  const {
    selectedInstrument,
    selectedEquityInstruments,
    selectedStrategyTypes,
  } = context;

  const segmentMap = {
    Option: "OPTION",
    Equity: "NSE",
    Future: "NFO-FUT",
    Indices: "INDICES",
    CDS: "CDS-FUT",
    MCX: "MCX",
  };

  const mappedSegment =
    segmentMap[formValues.StrategySegmentType] ||
    formValues.StrategySegmentType;

  const executionType =
    formValues.StrategyType === "time"
      ? "tb"
      : formValues.StrategyType === "indicator"
      ? "ib"
      : "pa";

  // Build final strategy script list
  let finalScriptList;
  if (
    selectedStrategyTypes[0] === "indicator" &&
    formValues.StrategySegmentType === "Equity" &&
    selectedEquityInstruments.length > 0
  ) {
    finalScriptList = formValues.StrategyScriptList;
  } else {
    const lotSize = selectedInstrument?.LotSize || 0;
    finalScriptList = [
      {
        InstrumentToken: selectedInstrument?.InstrumentToken || "",
        InstrumentName: selectedInstrument?.Name || "",
        Qty: lotSize,
        LongEquationoptionStrikeList: formValues.StrategyScriptList?.[0]
          ?.LongEquationoptionStrikeList || [createDefaultStrike()],
        ShortEquationoptionStrikeList:
          formValues.StrategyScriptList?.[0]?.ShortEquationoptionStrikeList ||
          [],
        StrikeTickValue: 0,
      },
    ];
  }

  return {
    ...formValues,
    StrategyType: null, // Set to null as per API requirement
    StrategySegmentType:
      formValues.StrategyType === "time" ? "OPTION" : mappedSegment,
    StrategyExecutionType: executionType,
    StrategyScriptList: finalScriptList,
    TradeStopTime: formValues.TradeStopTime || formValues.AutoSquareOffTime,
    EntryRule: null,
    ExitRule: null,
    LongEntryEquation:
      formValues.StrategyType === "indicator"
        ? formValues.LongEntryEquation?.length > 0
          ? formValues.LongEntryEquation
          : null
        : null,
    ShortEntryEquation:
      formValues.StrategyType === "indicator"
        ? formValues.ShortEntryEquation?.length > 0
          ? formValues.ShortEntryEquation
          : null
        : null,
    Long_ExitEquation:
      formValues.Long_ExitEquation?.length > 0
        ? formValues.Long_ExitEquation
        : null,
    Short_ExitEquation:
      formValues.Short_ExitEquation?.length > 0
        ? formValues.Short_ExitEquation
        : null,
  };
}

export default StrategyBuilder;
