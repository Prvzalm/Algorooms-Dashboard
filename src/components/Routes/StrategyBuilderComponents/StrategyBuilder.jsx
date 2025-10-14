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
import { useStrategyBuilderStore } from "../../../stores/strategyBuilderStore";
import { buildStrategyPayload } from "../../../utils/strategyPayload";

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

  // Hook to refetch user strategies after creation
  const { refetch: refetchUserStrategies } = useUserStrategies({
    page: 1,
    pageSize: 100, // Large page size to get all strategies
    strategyType: "created",
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
  // Centralized UI state via Zustand
  const selectedStrategyTypes = useStrategyBuilderStore(
    (s) => s.selectedStrategyTypes
  );
  const setSelectedStrategyTypes = useStrategyBuilderStore(
    (s) => s.setSelectedStrategyTypes
  );
  const selectedInstrument = useStrategyBuilderStore(
    (s) => s.selectedInstrument
  );
  const setSelectedInstrument = useStrategyBuilderStore(
    (s) => s.setSelectedInstrument
  );
  const selectedEquityInstruments = useStrategyBuilderStore(
    (s) => s.selectedEquityInstruments
  );
  const setSelectedEquityInstruments = useStrategyBuilderStore(
    (s) => s.setSelectedEquityInstruments
  );
  const showInstrumentModal = useStrategyBuilderStore(
    (s) => s.showInstrumentModal
  );
  const openInstrumentModal = useStrategyBuilderStore(
    (s) => s.openInstrumentModal
  );
  const closeInstrumentModal = useStrategyBuilderStore(
    (s) => s.closeInstrumentModal
  );
  const showBacktestModal = useStrategyBuilderStore((s) => s.showBacktestModal);
  const openBacktestModal = useStrategyBuilderStore((s) => s.openBacktestModal);
  const closeBacktestModal = useStrategyBuilderStore(
    (s) => s.closeBacktestModal
  );
  const showBacktestComponent = useStrategyBuilderStore(
    (s) => s.showBacktestComponent
  );
  const showBacktest = useStrategyBuilderStore((s) => s.showBacktest);
  const createdStrategyId = useStrategyBuilderStore((s) => s.createdStrategyId);
  const setCreatedStrategyId = useStrategyBuilderStore(
    (s) => s.setCreatedStrategyId
  );

  // State for instrument quantities
  const [instrumentQty, setInstrumentQty] = useState(1);
  const [equityInstrumentQtys, setEquityInstrumentQtys] = useState({});

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
        const firstScript = mapped.StrategyScriptList[0];
        if (firstScript.InstrumentName && mapped.StrategySegmentType) {
          // Set up search params to fetch instrument details including lot size
          setEditInstrumentSearch({
            segmentType:
              mapped.StrategySegmentType === "OPTION"
                ? "Option"
                : mapped.StrategySegmentType === "NSE"
                ? "Equity"
                : mapped.StrategySegmentType === "NFO-FUT"
                ? "Future"
                : mapped.StrategySegmentType === "INDICES"
                ? "Indices"
                : mapped.StrategySegmentType === "CDS-FUT"
                ? "CDS"
                : mapped.StrategySegmentType === "MCX"
                ? "MCX"
                : "Option",
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
        Exchange: matchedInstrument.Exchange || matchedInstrument.Segment || "",
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
        isPerPt: "wt_eq",
        typeId: "wt_eq",
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

    const { errors, normalized } = validateAndNormalize(values);
    if (errors.length) {
      console.warn(
        "Strategy validation issues (non-blocking, server will validate):",
        errors
      );
    }

    // Store normalized values to be used when creating strategy
    window.strategyFormData = normalized;

    // If in edit mode, directly save without showing popup
    if (editing) {
      handleCreateStrategy(false); // Save and go to strategies page
      return;
    }

    // If backtest component is already showing, directly create/update strategy
    // without showing the popup again
    if (showBacktestComponent) {
      handleCreateStrategy(true); // Automatically backtest since component is shown
      return;
    }

    // Show backtest confirmation modal only for first time creation
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
            const strategies = strategiesResponse?.data || [];

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
                reset();
                navigate("/strategies");
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
                reset();
                navigate("/strategies");
              }
            }
          } catch (error) {
            console.error("Error fetching strategies after creation:", error);
            toast.warning(
              "Strategy created successfully, but couldn't load backtest. Please refresh and try again."
            );
            if (!shouldBacktest) {
              reset();
              navigate("/strategies");
            }
          }
        }

        // If user chose "No, Skip" and we're updating, navigate to strategies
        if (isUpdating && !shouldBacktest) {
          reset();
          navigate("/strategies");
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

              <div className="p-4 border rounded-xl space-y-4 w-full bg-white dark:bg-[#131419] dark:border-[#1E2027]">
                <h2 className="font-semibold dark:text-white">
                  Select Instruments
                </h2>
                <div
                  className="border-dashed border border-gray-300 min-h-[6rem] rounded-lg flex items-center justify-center cursor-pointer dark:border-[#1E2027] dark:bg-[#1E2027]"
                  onClick={openInstrumentModal}
                >
                  <span className="text-gray-400 dark:text-gray-500 text-xl">
                    {selectedInstrument || selectedEquityInstruments.length
                      ? "Change"
                      : "+ Add"}
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
                            value={instrumentQty}
                            onChange={(e) =>
                              setInstrumentQty(
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#2A2D35] rounded-md bg-white dark:bg-[#131419] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedEquityInstruments.length > 0 && (
                  <div className="mt-2 space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {selectedEquityInstruments.map((ins) => (
                      <div
                        key={ins.InstrumentToken}
                        className="border rounded-lg p-4 text-xs bg-white dark:bg-[#1E2027] dark:border-[#2A2D35] shadow-sm relative"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEquityInstruments(
                              selectedEquityInstruments.filter(
                                (i) => i.InstrumentToken !== ins.InstrumentToken
                              )
                            );
                            const newQtys = { ...equityInstrumentQtys };
                            delete newQtys[ins.InstrumentToken];
                            setEquityInstrumentQtys(newQtys);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-colors"
                          title="Remove instrument"
                        >
                          <span className="text-sm font-bold">×</span>
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Instrument Name
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {ins.Name}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Lot Size
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {ins.LotSize || 0}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Exchange
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {ins.Exchange || ins.Segment || "—"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Segment Type
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {ins.SegmentType || "—"}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Quantity
                            </div>
                            <input
                              type="number"
                              min="1"
                              value={
                                equityInstrumentQtys[ins.InstrumentToken] || 1
                              }
                              onChange={(e) =>
                                setEquityInstrumentQtys({
                                  ...equityInstrumentQtys,
                                  [ins.InstrumentToken]: Math.max(
                                    1,
                                    parseInt(e.target.value) || 1
                                  ),
                                })
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 dark:border-[#2A2D35] rounded-md bg-white dark:bg-[#131419] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
            className="bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white px-8 py-3 rounded-lg text-sm font-medium disabled:opacity-50 w-full max-w-xs transition"
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
            className="ml-auto bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white md:px-8 px-4 py-3 rounded-lg text-sm font-medium disabled:opacity-50 hidden md:block transition"
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
                  <button
                    onClick={() => handleCreateStrategy(true)}
                    disabled={isPending}
                    className="flex-1 bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
                  >
                    {isPending ? "Creating..." : "Yes, Backtest"}
                  </button>
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
