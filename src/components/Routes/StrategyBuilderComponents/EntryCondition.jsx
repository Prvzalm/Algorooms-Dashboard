import React, { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiTrash, FiInfo } from "react-icons/fi";
import { useIndicatorMaster } from "../../../hooks/strategyHooks";
import IndicatorSelectorModal from "./IndicatorSelectorModal";
import PrimaryButton from "../../common/PrimaryButton";

// Helpers to create default equation structures compatible with payload
const createDefaultIndicatorObj = () => ({
  indicatorId: 0,
  IndicatorParamList: [{ ParamId: "string", IndicatorParamValue: "string" }],
});
const createDefaultEquation = () => ({
  comparerId: 0,
  comparerName: "string",
  OperatorId: 0,
  OperatorName: "End",
  indicator: createDefaultIndicatorObj(),
  comparerIndicator: createDefaultIndicatorObj(),
});

const EntryCondition = ({ selectedStrategyTypes }) => {
  const { watch, setValue } = useFormContext();

  // Form bindings
  const transactionType = watch("TransactionType"); // 0 both, 1 long, 2 short
  const longEntry = watch("LongEntryEquation") || [];
  const shortEntry = watch("ShortEntryEquation") || [];
  const longExit = watch("Long_ExitEquation") || [];
  const shortExit = watch("Short_ExitEquation") || [];
  const isChartOnOptionStrike = watch("IsChartOnOptionStrike") || false;
  const strategySegmentType = (watch("StrategySegmentType") || "")
    .toString()
    .toLowerCase();
  const selectedStrategyTypesForm = watch("selectedStrategyTypes") || [];
  const strategyType = selectedStrategyTypes?.[0] ?? "time";
  const isIndicatorStrategy = strategyType === "indicator";
  const isCombinedChartDisabled =
    strategySegmentType === "equity" || strategySegmentType === "future";

  const chartType = watch("chartTypeCombinedOrOption");

  // Indicator master
  const { data: indicatorData, isLoading, isError } = useIndicatorMaster(true);
  const allIndicators = useMemo(
    () => indicatorData?.Indicators || [],
    [indicatorData]
  );
  const comparers = indicatorData?.Comparers || [];

  // Exit toggle: auto-enable if exit arrays already have items
  const [exitEnabled, setExitEnabled] = useState(
    (Array.isArray(longExit) && longExit.length > 0) ||
      (Array.isArray(shortExit) && shortExit.length > 0)
  );

  useEffect(() => {
    const hasExit =
      (Array.isArray(longExit) && longExit.length > 0) ||
      (Array.isArray(shortExit) && shortExit.length > 0);
    if (hasExit !== exitEnabled) setExitEnabled(hasExit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [longExit?.length, shortExit?.length]);

  useEffect(() => {
    if (isCombinedChartDisabled && chartType === "combined") {
      setValue("chartTypeCombinedOrOption", "options", { shouldDirty: true });
    }
  }, [isCombinedChartDisabled, chartTypeCombinedOrOption, setValue]);

  useEffect(() => {
    setValue(
      "IsChartOnOptionStrike",
      chartTypeCombinedOrOption === "combined",
      {
        shouldDirty: true,
      }
    );
    setValue("useCombinedChart", chartTypeCombinedOrOption === "combined", {
      shouldDirty: true,
    });
  }, [chartType, setValue]);

  // When options/combined chart is enabled, force single-side (Only Long by default)
  useEffect(() => {
    if (
      (chartType === "options" || chartType === "combined") &&
      transactionType === 0
    ) {
      setValue("TransactionType", 1, { shouldDirty: true });
    }
  }, [chartType, transactionType, setValue]);

  useEffect(() => {
    const initialChartType = null;
    setValue("chartTypeCombinedOrOption", initialChartType);
  }, []);

  const combinedChartTooltip = isCombinedChartDisabled
    ? "Combined chart is available only for option strikes. Equity and futures selections render their own price feeds."
    : "Displays entry indicators and selected option strikes on a single chart so you can validate timing without switching between legs.";

  // Utilities
  const findIndicatorMeta = (id) =>
    allIndicators.find((i) => Number(i.IndicatorId) === Number(id));
  const paramSummary = (indObj) => {
    if (!indObj || !indObj.indicatorId) return "";
    const meta = findIndicatorMeta(indObj.indicatorId);
    if (!meta) return "";
    const parts = (meta.IndicatorParams || []).map((p) => {
      const v = (indObj.IndicatorParamList || []).find(
        (x) => String(x.ParamId) === String(p.ParamId)
      )?.IndicatorParamValue;
      return `${p.ParamName}(${v ?? 0})`;
    });
    return `${meta.IndicatorName} ${parts.join(" ")}`.trim();
  };

  const operatorValue = (eq) => Number(eq?.OperatorId ?? 0);

  const ensureArray = (key) => {
    const arr = watch(key) || [];
    if (!Array.isArray(arr) || arr.length === 0) {
      setValue(key, [createDefaultEquation()], { shouldDirty: true });
      return [createDefaultEquation()];
    }
    return arr;
  };

  const updateEq = (key, index, updater) => {
    const arr = [...(watch(key) || [])];
    const current = arr[index] || createDefaultEquation();
    arr[index] = updater({ ...current });
    setValue(key, arr, { shouldDirty: true });
  };

  const setIndicator = (key, index, which, indicatorId, paramsObj) => {
    const toParamList = (obj) =>
      Object.entries(paramsObj || obj || {}).map(([pid, val]) => ({
        ParamId: pid,
        IndicatorParamValue: String(val ?? ""),
      }));
    updateEq(key, index, (eq) => {
      const target = which === "left" ? "indicator" : "comparerIndicator";
      const paramList = Array.isArray(paramsObj)
        ? paramsObj
        : toParamList(paramsObj);
      eq[target] = {
        indicatorId: Number(indicatorId) || 0,
        IndicatorParamList:
          paramList && paramList.length
            ? paramList
            : [{ ParamId: "string", IndicatorParamValue: "string" }],
      };
      return eq;
    });

    // Sync Long and Short Entry Equations with opposite comparators
    if (key === "LongEntryEquation") {
      syncToShortEntry(index, which, indicatorId, paramsObj);
    } else if (key === "ShortEntryEquation") {
      syncToLongEntry(index, which, indicatorId, paramsObj);
    }
  };

  const getOppositeComparator = (comparerId) => {
    const oppositeMap = {
      1: 2, // > to <
      2: 1, // < to >
      3: 4, // >= to <=
      4: 3, // <= to >=
      5: 5, // == remains ==
      6: 6, // != remains !=
    };
    return oppositeMap[comparerId] || comparerId;
  };

  const syncToShortEntry = (index, which, indicatorId, paramsObj) => {
    const longArr = watch("LongEntryEquation") || [];
    const longEq = longArr[index];
    if (!longEq) return;

    const shortArr = [...(watch("ShortEntryEquation") || [])];
    // Ensure short array has enough elements
    while (shortArr.length <= index) {
      shortArr.push(createDefaultEquation());
    }

    const toParamList = (obj) =>
      Object.entries(paramsObj || obj || {}).map(([pid, val]) => ({
        ParamId: pid,
        IndicatorParamValue: String(val ?? ""),
      }));

    const target = which === "left" ? "indicator" : "comparerIndicator";
    const paramList = Array.isArray(paramsObj)
      ? paramsObj
      : toParamList(paramsObj);

    // Copy indicator to short with opposite comparator
    shortArr[index] = {
      ...shortArr[index],
      [target]: {
        indicatorId: Number(indicatorId) || 0,
        IndicatorParamList:
          paramList && paramList.length
            ? paramList
            : [{ ParamId: "string", IndicatorParamValue: "string" }],
      },
      comparerId: getOppositeComparator(longEq.comparerId),
      comparerName:
        comparers.find(
          (c) => c.ComparerId === getOppositeComparator(longEq.comparerId)
        )?.ComparerName || longEq.comparerName,
    };

    setValue("ShortEntryEquation", shortArr, { shouldDirty: true });
  };

  const syncToLongEntry = (index, which, indicatorId, paramsObj) => {
    const shortArr = watch("ShortEntryEquation") || [];
    const shortEq = shortArr[index];
    if (!shortEq) return;

    const longArr = [...(watch("LongEntryEquation") || [])];
    // Ensure long array has enough elements
    while (longArr.length <= index) {
      longArr.push(createDefaultEquation());
    }

    const toParamList = (obj) =>
      Object.entries(paramsObj || obj || {}).map(([pid, val]) => ({
        ParamId: pid,
        IndicatorParamValue: String(val ?? ""),
      }));

    const target = which === "left" ? "indicator" : "comparerIndicator";
    const paramList = Array.isArray(paramsObj)
      ? paramsObj
      : toParamList(paramsObj);

    // Copy indicator to long with opposite comparator
    longArr[index] = {
      ...longArr[index],
      [target]: {
        indicatorId: Number(indicatorId) || 0,
        IndicatorParamList:
          paramList && paramList.length
            ? paramList
            : [{ ParamId: "string", IndicatorParamValue: "string" }],
      },
      comparerId: getOppositeComparator(shortEq.comparerId),
      comparerName:
        comparers.find(
          (c) => c.ComparerId === getOppositeComparator(shortEq.comparerId)
        )?.ComparerName || shortEq.comparerName,
    };

    setValue("LongEntryEquation", longArr, { shouldDirty: true });
  };

  const setComparer = (key, index, comparerId) => {
    const cmp = comparers.find(
      (c) => Number(c.ComparerId) === Number(comparerId)
    );
    updateEq(key, index, (eq) => ({
      ...eq,
      comparerId: Number(comparerId) || 0,
      comparerName: cmp?.ComparerName || "string",
    }));

    // Sync comparator to opposite side with opposite value
    if (key === "LongEntryEquation") {
      syncComparatorToShort(index, comparerId);
    } else if (key === "ShortEntryEquation") {
      syncComparatorToLong(index, comparerId);
    }
  };

  const syncComparatorToShort = (index, comparerId) => {
    const shortArr = [...(watch("ShortEntryEquation") || [])];
    while (shortArr.length <= index) {
      shortArr.push(createDefaultEquation());
    }

    const oppositeId = getOppositeComparator(Number(comparerId));
    const cmp = comparers.find((c) => Number(c.ComparerId) === oppositeId);

    shortArr[index] = {
      ...shortArr[index],
      comparerId: oppositeId,
      comparerName: cmp?.ComparerName || "string",
    };

    setValue("ShortEntryEquation", shortArr, { shouldDirty: true });
  };

  const syncComparatorToLong = (index, comparerId) => {
    const longArr = [...(watch("LongEntryEquation") || [])];
    while (longArr.length <= index) {
      longArr.push(createDefaultEquation());
    }

    const oppositeId = getOppositeComparator(Number(comparerId));
    const cmp = comparers.find((c) => Number(c.ComparerId) === oppositeId);

    longArr[index] = {
      ...longArr[index],
      comparerId: oppositeId,
      comparerName: cmp?.ComparerName || "string",
    };

    setValue("LongEntryEquation", longArr, { shouldDirty: true });
  };

  const addRow = (key) => {
    const arr = [...(watch(key) || [])];
    arr.push(createDefaultEquation());
    if (arr.length > 1) {
      arr[arr.length - 2] = {
        ...arr[arr.length - 2],
        OperatorId: 0,
        OperatorName: "AND",
      };
    }
    setValue(key, arr, { shouldDirty: true });
  };
  const removeRow = (key, index) => {
    const arr = [...(watch(key) || [])];
    arr.splice(index, 1);
    if (arr.length > 0) {
      arr[arr.length - 1] = {
        ...arr[arr.length - 1],
        OperatorId: 0,
        OperatorName: "End",
      };
    }
    setValue(key, arr, { shouldDirty: true });
  };

  const setOperator = (key, index, operatorId) => {
    const operatorName = operatorId == 0 ? "AND" : "OR";
    const arr = [...(watch(key) || [])];
    const current = arr[index] || createDefaultEquation();
    arr[index] = {
      ...current,
      OperatorId: Number(operatorId),
      OperatorName: operatorName,
    };
    setValue(key, arr, { shouldDirty: true, shouldTouch: true });

    // Keep paired side in sync for paired layouts (transactionType === 0)
    if (transactionType === 0) {
      const counterpartKey = key.includes("Long")
        ? key.replace("Long", "Short")
        : key.replace("Short", "Long");
      const counterpartArr = [...(watch(counterpartKey) || [])];
      if (counterpartArr[index]) {
        counterpartArr[index] = {
          ...counterpartArr[index],
          OperatorId: Number(operatorId),
          OperatorName: operatorName,
        };
        setValue(counterpartKey, counterpartArr, {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    }
  };

  const addPair = () => {
    const longArr = [...(watch("LongEntryEquation") || [])];
    const shortArr = [...(watch("ShortEntryEquation") || [])];
    longArr.push(createDefaultEquation());
    shortArr.push(createDefaultEquation());
    if (longArr.length > 1) {
      longArr[longArr.length - 2] = {
        ...longArr[longArr.length - 2],
        OperatorId: 0,
        OperatorName: "AND",
      };
      shortArr[shortArr.length - 2] = {
        ...shortArr[shortArr.length - 2],
        OperatorId: 0,
        OperatorName: "AND",
      };
    }
    setValue("LongEntryEquation", longArr, { shouldDirty: true });
    setValue("ShortEntryEquation", shortArr, { shouldDirty: true });
  };

  const removePair = (index) => {
    const longArr = [...(watch("LongEntryEquation") || [])];
    const shortArr = [...(watch("ShortEntryEquation") || [])];
    longArr.splice(index, 1);
    shortArr.splice(index, 1);
    if (longArr.length > 0) {
      longArr[longArr.length - 1] = {
        ...longArr[longArr.length - 1],
        OperatorId: 0,
        OperatorName: "End",
      };
      shortArr[shortArr.length - 1] = {
        ...shortArr[shortArr.length - 1],
        OperatorId: 0,
        OperatorName: "End",
      };
    }
    setValue("LongEntryEquation", longArr, { shouldDirty: true });
    setValue("ShortEntryEquation", shortArr, { shouldDirty: true });
  };

  const addExitPair = () => {
    const longArr = [...(watch("Long_ExitEquation") || [])];
    const shortArr = [...(watch("Short_ExitEquation") || [])];
    longArr.push(createDefaultEquation());
    shortArr.push(createDefaultEquation());
    if (longArr.length > 1) {
      longArr[longArr.length - 2] = {
        ...longArr[longArr.length - 2],
        OperatorId: 0,
        OperatorName: "AND",
      };
      shortArr[shortArr.length - 2] = {
        ...shortArr[shortArr.length - 2],
        OperatorId: 0,
        OperatorName: "AND",
      };
    }
    setValue("Long_ExitEquation", longArr, { shouldDirty: true });
    setValue("Short_ExitEquation", shortArr, { shouldDirty: true });
  };

  const removeExitPair = (index) => {
    const longArr = [...(watch("Long_ExitEquation") || [])];
    const shortArr = [...(watch("Short_ExitEquation") || [])];
    longArr.splice(index, 1);
    shortArr.splice(index, 1);
    if (longArr.length > 0) {
      longArr[longArr.length - 1] = {
        ...longArr[longArr.length - 1],
        OperatorId: 0,
        OperatorName: "End",
      };
      shortArr[shortArr.length - 1] = {
        ...shortArr[shortArr.length - 1],
        OperatorId: 0,
        OperatorName: "End",
      };
    }
    setValue("Long_ExitEquation", longArr, { shouldDirty: true });
    setValue("Short_ExitEquation", shortArr, { shouldDirty: true });
  };

  // Indicator modal state
  const [indicatorModal, setIndicatorModal] = useState({
    open: false,
    key: "LongEntryEquation",
    index: 0,
    which: "left", // 'left' | 'right'
  });

  const currentModalIndicatorId = useMemo(() => {
    const arr = watch(indicatorModal.key) || [];
    const eq = arr[indicatorModal.index];
    const target =
      indicatorModal.which === "left" ? "indicator" : "comparerIndicator";
    return eq?.[target]?.indicatorId || 0;
  }, [
    indicatorModal,
    watch("LongEntryEquation"),
    watch("ShortEntryEquation"),
    watch("Long_ExitEquation"),
    watch("Short_ExitEquation"),
  ]);

  const currentModalParams = useMemo(() => {
    const arr = watch(indicatorModal.key) || [];
    const eq = arr[indicatorModal.index];
    const target =
      indicatorModal.which === "left" ? "indicator" : "comparerIndicator";
    const list = eq?.[target]?.IndicatorParamList || [];
    // Convert to map for modal default values
    return list.reduce((acc, p) => {
      acc[p.ParamId] = p.IndicatorParamValue;
      return acc;
    }, {});
  }, [
    indicatorModal,
    watch("LongEntryEquation"),
    watch("ShortEntryEquation"),
    watch("Long_ExitEquation"),
    watch("Short_ExitEquation"),
  ]);

  const openModal = (key, index, which) =>
    setIndicatorModal({ open: true, key, index, which });

  const handleModalConfirm = (indicatorId, params) => {
    setIndicator(
      indicatorModal.key,
      indicatorModal.index,
      indicatorModal.which,
      indicatorId,
      params
    );
    setIndicatorModal((s) => ({ ...s, open: false }));
  };

  // UI section renderer
  const renderRows = (label, key, arr, colorClass) => (
    <div className="border border-dashed border-gray-200 rounded-xl p-4 mb-4">
      <p className={`${colorClass} font-semibold mb-2`}>{label}</p>
      {(!arr || arr.length === 0) && (
        <button
          type="button"
          onClick={() => addRow(key)}
          className="text-xs text-blue-600 underline"
        >
          + Add first condition
        </button>
      )}
      {(arr || []).map((eq, idx) => (
        <>
          <div key={idx} className="mb-4 last:mb-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <button
                type="button"
                onClick={() => openModal(key, idx, "left")}
                className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
              >
                {eq?.indicator?.indicatorId
                  ? findIndicatorMeta(eq.indicator.indicatorId)
                      ?.IndicatorName || "Select Indicator"
                  : "Select Indicator"}
              </button>
              <select
                className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                value={eq?.comparerId || 0}
                onChange={(e) => setComparer(key, idx, e.target.value)}
              >
                <option value={0}>Select Comparator</option>
                {comparers.map((c) => (
                  <option key={c.ComparerId} value={c.ComparerId}>
                    {c.ComparerName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => openModal(key, idx, "right")}
                className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
              >
                {eq?.comparerIndicator?.indicatorId
                  ? findIndicatorMeta(eq.comparerIndicator.indicatorId)
                      ?.IndicatorName || "Select Indicator"
                  : "Select Indicator"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {paramSummary(eq?.indicator)}
              </p>
              <div />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {paramSummary(eq?.comparerIndicator)}
              </p>
            </div>

            {arr.length > 1 && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => removeRow(key, idx)}
                  className="text-red-500 hover:text-red-600 text-xs inline-flex items-center gap-1"
                >
                  <FiTrash /> Remove
                </button>
              </div>
            )}
          </div>
          {idx < arr.length - 1 ? (
            <div className="flex justify-center my-2">
              <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setOperator(key, idx, 0)}
                  className={`px-3 py-1 text-sm rounded-l-md ${
                    operatorValue(eq) === 0
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-[#15171C] text-gray-700 dark:text-gray-300"
                  } border-r border-gray-300 dark:border-gray-600`}
                >
                  AND
                </button>
                <button
                  type="button"
                  onClick={() => setOperator(key, idx, 1)}
                  className={`px-3 py-1 text-sm rounded-r-md ${
                    operatorValue(eq) === 1
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-[#15171C] text-gray-700 dark:text-gray-300"
                  }`}
                >
                  OR
                </button>
              </div>
            </div>
          ) : null}
        </>
      ))}

      <div className="mt-2 text-right">
        <PrimaryButton
          type="button"
          onClick={() => addRow(key)}
          className="text-xs px-3 py-2 rounded-lg"
        >
          + Add Condition
        </PrimaryButton>
      </div>
    </div>
  );

  const renderPairedEntryRows = () => {
    const longArr = watch("LongEntryEquation") || [];
    const shortArr = watch("ShortEntryEquation") || [];
    const maxLen = Math.max(longArr.length, shortArr.length);

    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-4 mb-4">
        {maxLen === 0 && (
          <button
            type="button"
            onClick={addPair}
            className="text-xs text-blue-600 underline"
          >
            + Add first condition pair
          </button>
        )}
        {Array.from({ length: maxLen }, (_, idx) => {
          const longEq = longArr[idx] || createDefaultEquation();
          const shortEq = shortArr[idx] || createDefaultEquation();
          return (
            <React.Fragment key={idx}>
              {/* Long Entry */}
              <div className="mb-2">
                <p className="text-green-600 text-sm font-medium mb-1">
                  Long Entry
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <button
                    type="button"
                    onClick={() => openModal("LongEntryEquation", idx, "left")}
                    className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  >
                    {longEq?.indicator?.indicatorId
                      ? findIndicatorMeta(longEq.indicator.indicatorId)
                          ?.IndicatorName || "Select Indicator"
                      : "Select Indicator"}
                  </button>
                  <select
                    className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    value={longEq?.comparerId || 0}
                    onChange={(e) =>
                      setComparer("LongEntryEquation", idx, e.target.value)
                    }
                  >
                    <option value={0}>Select Comparator</option>
                    {comparers.map((c) => (
                      <option key={c.ComparerId} value={c.ComparerId}>
                        {c.ComparerName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openModal("LongEntryEquation", idx, "right")}
                    className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  >
                    {longEq?.comparerIndicator?.indicatorId
                      ? findIndicatorMeta(longEq.comparerIndicator.indicatorId)
                          ?.IndicatorName || "Select Indicator"
                      : "Select Indicator"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {paramSummary(longEq?.indicator)}
                  </p>
                  <div />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {paramSummary(longEq?.comparerIndicator)}
                  </p>
                </div>
              </div>
              {/* Short Entry */}
              <div className="mb-2">
                <p className="text-red-500 text-sm font-medium mb-1">
                  Short Entry
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <button
                    type="button"
                    onClick={() => openModal("ShortEntryEquation", idx, "left")}
                    className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  >
                    {shortEq?.indicator?.indicatorId
                      ? findIndicatorMeta(shortEq.indicator.indicatorId)
                          ?.IndicatorName || "Select Indicator"
                      : "Select Indicator"}
                  </button>
                  <select
                    className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    value={shortEq?.comparerId || 0}
                    onChange={(e) =>
                      setComparer("ShortEntryEquation", idx, e.target.value)
                    }
                  >
                    <option value={0}>Select Comparator</option>
                    {comparers.map((c) => (
                      <option key={c.ComparerId} value={c.ComparerId}>
                        {c.ComparerName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      openModal("ShortEntryEquation", idx, "right")
                    }
                    className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  >
                    {shortEq?.comparerIndicator?.indicatorId
                      ? findIndicatorMeta(shortEq.comparerIndicator.indicatorId)
                          ?.IndicatorName || "Select Indicator"
                      : "Select Indicator"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {paramSummary(shortEq?.indicator)}
                  </p>
                  <div />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {paramSummary(shortEq?.comparerIndicator)}
                  </p>
                </div>
              </div>
              {/* Remove */}
              {maxLen > 1 && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => removePair(idx)}
                    className="text-red-500 hover:text-red-600 text-xs inline-flex items-center gap-1"
                  >
                    <FiTrash /> Remove Pair
                  </button>
                </div>
              )}
              {idx < maxLen - 1 && (
                <div className="flex justify-center my-2">
                  <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => setOperator("LongEntryEquation", idx, 0)}
                      className={`px-3 py-1 text-sm rounded-l-md ${
                        operatorValue(longArr[idx]) === 0
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-[#15171C] text-gray-700 dark:text-gray-300"
                      } border-r border-gray-300 dark:border-gray-600`}
                    >
                      AND
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperator("LongEntryEquation", idx, 1)}
                      className={`px-3 py-1 text-sm rounded-r-md ${
                        operatorValue(longArr[idx]) === 1
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-[#15171C] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      OR
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div className="mt-2 text-right">
          <PrimaryButton
            type="button"
            onClick={addPair}
            className="text-xs px-3 py-2 rounded-lg"
          >
            + Add Condition Pair
          </PrimaryButton>
        </div>
      </div>
    );
  };

  const renderPairedExitRows = () => {
    const longArr = watch("Long_ExitEquation") || [];
    const shortArr = watch("Short_ExitEquation") || [];
    const maxLen = Math.max(longArr.length, shortArr.length);

    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-4 mb-4">
        {maxLen === 0 && (
          <button
            type="button"
            onClick={addExitPair}
            className="text-xs text-blue-600 underline"
          >
            + Add first exit condition pair
          </button>
        )}
        {Array.from({ length: maxLen }, (_, idx) => {
          const longEq = longArr[idx] || createDefaultEquation();
          const shortEq = shortArr[idx] || createDefaultEquation();
          return (
            <React.Fragment key={idx}>
              {/* Long Exit */}
              <div className="mb-2">
                <p className="text-green-600 text-sm font-medium mb-1">
                  Long Exit
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <button
                    type="button"
                    onClick={() => openModal("Long_ExitEquation", idx, "left")}
                    className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  >
                    {longEq?.indicator?.indicatorId
                      ? findIndicatorMeta(longEq.indicator.indicatorId)
                          ?.IndicatorName || "Select Indicator"
                      : "Select Indicator"}
                  </button>
                  <select
                    className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    value={longEq?.comparerId || 0}
                    onChange={(e) =>
                      setComparer("Long_ExitEquation", idx, e.target.value)
                    }
                  >
                    <option value={0}>Select Comparator</option>
                    {comparers.map((c) => (
                      <option key={c.ComparerId} value={c.ComparerId}>
                        {c.ComparerName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openModal("Long_ExitEquation", idx, "right")}
                    className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  >
                    {longEq?.comparerIndicator?.indicatorId
                      ? findIndicatorMeta(longEq.comparerIndicator.indicatorId)
                          ?.IndicatorName || "Select Indicator"
                      : "Select Indicator"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {paramSummary(longEq?.indicator)}
                  </p>
                  <div />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {paramSummary(longEq?.comparerIndicator)}
                  </p>
                </div>
              </div>
              {/* Short Exit */}
              <div className="mb-2">
                <p className="text-red-500 text-sm font-medium mb-1">
                  Short Exit
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                  <button
                    type="button"
                    onClick={() => openModal("Short_ExitEquation", idx, "left")}
                    className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  >
                    {shortEq?.indicator?.indicatorId
                      ? findIndicatorMeta(shortEq.indicator.indicatorId)
                          ?.IndicatorName || "Select Indicator"
                      : "Select Indicator"}
                  </button>
                  <select
                    className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    value={shortEq?.comparerId || 0}
                    onChange={(e) =>
                      setComparer("Short_ExitEquation", idx, e.target.value)
                    }
                  >
                    <option value={0}>Select Comparator</option>
                    {comparers.map((c) => (
                      <option key={c.ComparerId} value={c.ComparerId}>
                        {c.ComparerName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      openModal("Short_ExitEquation", idx, "right")
                    }
                    className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  >
                    {shortEq?.comparerIndicator?.indicatorId
                      ? findIndicatorMeta(shortEq.comparerIndicator.indicatorId)
                          ?.IndicatorName || "Select Indicator"
                      : "Select Indicator"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {paramSummary(shortEq?.indicator)}
                  </p>
                  <div />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {paramSummary(shortEq?.comparerIndicator)}
                  </p>
                </div>
              </div>
              {/* Remove */}
              {maxLen > 1 && (
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => removeExitPair(idx)}
                    className="text-red-500 hover:text-red-600 text-xs inline-flex items-center gap-1"
                  >
                    <FiTrash /> Remove Pair
                  </button>
                </div>
              )}
              {idx < maxLen - 1 && (
                <div className="flex justify-center my-2">
                  <div className="inline-flex rounded-md border border-gray-300 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => setOperator("Long_ExitEquation", idx, 0)}
                      className={`px-3 py-1 text-sm rounded-l-md ${
                        operatorValue(longArr[idx]) === 0
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-[#15171C] text-gray-700 dark:text-gray-300"
                      } border-r border-gray-300 dark:border-gray-600`}
                    >
                      AND
                    </button>
                    <button
                      type="button"
                      onClick={() => setOperator("Long_ExitEquation", idx, 1)}
                      className={`px-3 py-1 text-sm rounded-r-md ${
                        operatorValue(longArr[idx]) === 1
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-[#15171C] text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      OR
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div className="mt-2 text-right">
          <PrimaryButton
            type="button"
            onClick={addExitPair}
            className="text-xs px-3 py-2 rounded-lg"
          >
            + Add Exit Condition Pair
          </PrimaryButton>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-[#15171C]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg text-black dark:text-white">
          Entry Conditions
        </h2>
        {!isCombinedChartDisabled && isIndicatorStrategy && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={chartTypeCombinedOrOption === "combined"}
                onChange={() => {
                  setValue(
                    "chartTypeCombinedOrOption",
                    chartType === "combined" ? null : "combined",
                    {
                      shouldDirty: true,
                    }
                  );
                }}
              />
              Use Combined Chart
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={chartTypeCombinedOrOption === "options"}
                onChange={() => {
                  setValue(
                    "chartTypeCombinedOrOption",
                    chartType === "options" ? null : "options",
                    {
                      shouldDirty: true,
                    }
                  );
                }}
              />
              Use Options Chart
              <span className="relative group inline-flex">
                <button
                  type="button"
                  className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 flex items-center justify-center text-[10px] bg-white dark:bg-[#1E2027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B44FE]"
                  aria-label="Combined chart information"
                >
                  <FiInfo className="text-xs" />
                </button>
                <span
                  className="pointer-events-none absolute right-0 top-full mt-2 w-60 max-w-xs text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2027] border border-gray-200 dark:border-[#2A2D35] rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition"
                  role="tooltip"
                >
                  {combinedChartTooltip}
                </span>
              </span>
            </label>
          </div>
        )}
      </div>

      {isLoading && (
        <p className="text-xs text-gray-500 mb-4">Loading indicators...</p>
      )}
      {isError && (
        <p className="text-xs text-red-500 mb-4">
          Failed to load indicators (using fallback).
        </p>
      )}

      {transactionType === 0 ? (
        renderPairedEntryRows()
      ) : (
        <>
          {(transactionType === 0 || transactionType === 1) &&
            renderRows(
              "Long Entry Conditions",
              "LongEntryEquation",
              longEntry,
              "text-green-600"
            )}

          {(transactionType === 0 || transactionType === 2) &&
            renderRows(
              "Short Entry Conditions",
              "ShortEntryEquation",
              shortEntry,
              "text-red-500"
            )}
        </>
      )}

      {/* Exit toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-500 mt-2">
        <input
          type="checkbox"
          checked={exitEnabled}
          onChange={(e) => {
            const on = e.target.checked;
            setExitEnabled(on);
            if (!on) {
              setValue("Long_ExitEquation", [], { shouldDirty: true });
              setValue("Short_ExitEquation", [], { shouldDirty: true });
            } else {
              if (!Array.isArray(longExit) || longExit.length === 0)
                setValue("Long_ExitEquation", [createDefaultEquation()], {
                  shouldDirty: true,
                });
              if (!Array.isArray(shortExit) || shortExit.length === 0)
                setValue("Short_ExitEquation", [createDefaultEquation()], {
                  shouldDirty: true,
                });
            }
          }}
        />
        Exit Conditions{" "}
        <span className="text-xs text-gray-400">(Optional)</span>
      </label>

      {exitEnabled && (
        <div className="mt-3">
          {transactionType === 0 ? (
            renderPairedExitRows()
          ) : (
            <>
              {(transactionType === 0 || transactionType === 1) &&
                renderRows(
                  "Long Exit Conditions",
                  "Long_ExitEquation",
                  longExit,
                  "text-green-600"
                )}
              {(transactionType === 0 || transactionType === 2) &&
                renderRows(
                  "Short Exit Conditions",
                  "Short_ExitEquation",
                  shortExit,
                  "text-red-500"
                )}
            </>
          )}
        </div>
      )}

      <IndicatorSelectorModal
        visible={indicatorModal.open}
        onClose={() => setIndicatorModal((s) => ({ ...s, open: false }))}
        indicators={allIndicators}
        currentIndicatorId={currentModalIndicatorId}
        currentParams={currentModalParams}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default EntryCondition;
