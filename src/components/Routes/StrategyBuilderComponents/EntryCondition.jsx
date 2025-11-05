import React, { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiTrash, FiInfo } from "react-icons/fi";
import { useIndicatorMaster } from "../../../hooks/strategyHooks";
import IndicatorSelectorModal from "./IndicatorSelectorModal";

// Helpers to create default equation structures compatible with payload
const createDefaultIndicatorObj = () => ({
  indicatorId: 0,
  IndicatorParamList: [{ ParamId: "string", IndicatorParamValue: "string" }],
});
const createDefaultEquation = () => ({
  comparerId: 0,
  comparerName: "string",
  OperatorId: 0,
  OperatorName: "string",
  indicator: createDefaultIndicatorObj(),
  comparerIndicator: createDefaultIndicatorObj(),
});

const EntryCondition = () => {
  const { watch, setValue } = useFormContext();

  // Form bindings
  const transactionType = watch("TransactionType"); // 0 both, 1 long, 2 short
  const longEntry = watch("LongEntryEquation") || [];
  const shortEntry = watch("ShortEntryEquation") || [];
  const longExit = watch("Long_ExitEquation") || [];
  const shortExit = watch("Short_ExitEquation") || [];
  const isChartOnOptionStrike = watch("IsChartOnOptionStrike") || false;

  // Indicator master
  const { data: indicatorData, isLoading, isError } = useIndicatorMaster(true);
  const allIndicators = useMemo(
    () =>
      (indicatorData?.Indicators || []).concat(
        indicatorData?.PriceActionIndicators || []
      ),
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
      OperatorId: getOppositeComparator(longEq.comparerId),
      OperatorName:
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
      OperatorId: getOppositeComparator(shortEq.comparerId),
      OperatorName:
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
      OperatorId: Number(comparerId) || 0,
      OperatorName: cmp?.ComparerName || "string",
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
      OperatorId: oppositeId,
      OperatorName: cmp?.ComparerName || "string",
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
      OperatorId: oppositeId,
      OperatorName: cmp?.ComparerName || "string",
    };

    setValue("LongEntryEquation", longArr, { shouldDirty: true });
  };

  const addRow = (key) => {
    const arr = [...(watch(key) || [])];
    arr.push(createDefaultEquation());
    setValue(key, arr, { shouldDirty: true });
  };
  const removeRow = (key, index) => {
    const arr = [...(watch(key) || [])];
    arr.splice(index, 1);
    setValue(key, arr, { shouldDirty: true });
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
        <div key={idx} className="mb-4 last:mb-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
            <button
              type="button"
              onClick={() => openModal(key, idx, "left")}
              className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
            >
              {eq?.indicator?.indicatorId
                ? findIndicatorMeta(eq.indicator.indicatorId)?.IndicatorName ||
                  "Select Indicator"
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
      ))}

      <div className="mt-2 text-right">
        <button
          type="button"
          onClick={() => addRow(key)}
          className="bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white text-xs px-3 py-2 rounded-lg transition"
        >
          + Add Condition
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-[#15171C]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg text-black dark:text-white">
          Entry Conditions
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={!!isChartOnOptionStrike}
            onChange={(e) =>
              setValue("IsChartOnOptionStrike", !!e.target.checked, {
                shouldDirty: true,
              })
            }
          />
          Use Combined Chart <FiInfo className="text-gray-400" />
        </label>
      </div>

      {isLoading && (
        <p className="text-xs text-gray-500 mb-4">Loading indicators...</p>
      )}
      {isError && (
        <p className="text-xs text-red-500 mb-4">
          Failed to load indicators (using fallback).
        </p>
      )}

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
