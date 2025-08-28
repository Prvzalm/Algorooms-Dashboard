import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FiTrash, FiInfo } from "react-icons/fi";
import { useIndicatorMaster } from "../../../hooks/strategyHooks";
import IndicatorSelectorModal from "./IndicatorSelectorModal";

// Helper to create empty side structure
const createEmptySide = () => ({
  indicatorId: 0,
  params: {},
  rightIndicatorId: 0,
  rightParams: {},
  comparatorId: 0,
  left: "",
  comparator: "",
  right: "",
  info: "",
});

const initialCondition = {
  long: createEmptySide(),
  short: createEmptySide(),
};

const EntryCondition = () => {
  const { setValue, watch } = useFormContext();
  const [conditions, setConditions] = useState([{ ...initialCondition }]);
  const [exitBlocks, setExitBlocks] = useState([{ ...initialCondition }]); // NEW: exit condition blocks
  const [useCombinedChart, setUseCombinedChart] = useState(false);
  const [exitConditions, setExitConditions] = useState(false);
  const transactionType = watch("TransactionType"); // 0 both, 1 long, 2 short
  const { data: indicatorData, isLoading, isError } = useIndicatorMaster(true);

  const [indicatorModal, setIndicatorModal] = useState({
    open: false,
    blockIdx: null,
    side: null, // 'long' | 'short'
    which: null, // 'left' | 'right'
    group: "entry", // NEW: 'entry' | 'exit'
  });

  // Combine indicators once loaded
  const allIndicators = (indicatorData?.Indicators || []).concat(
    indicatorData?.PriceActionIndicators || []
  );

  const comparers = indicatorData?.Comparers || [];

  // EXTEND condition structure: store ids + param values
  // shape: { long: { indicatorId, params:{[paramId]:value}, comparatorId, rightIndicatorId, rightParams:{} ... } ... }
  // Re-initialize existing simple fields if not present to avoid breakage
  useEffect(() => {
    setConditions((prev) =>
      prev.map((c) => ({
        ...c,
        long: {
          ...c.long,
          indicatorId: c.long.indicatorId || 0,
          params: c.long.params || {},
          rightIndicatorId: c.long.rightIndicatorId || 0,
          rightParams: c.long.rightParams || {},
          comparatorId: c.long.comparatorId || 0,
        },
        short: {
          ...c.short,
          indicatorId: c.short.indicatorId || 0,
          params: c.short.params || {},
          rightIndicatorId: c.short.rightIndicatorId || 0,
          rightParams: c.short.rightParams || {},
          comparatorId: c.short.comparatorId || 0,
        },
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorData]);

  const initParams = (indicator) => {
    if (!indicator) return {};
    const obj = {};
    (indicator.IndicatorParams || []).forEach((p) => {
      obj[p.ParamId] = p.DefaultValue ?? "";
    });
    return obj;
  };

  const openIndicatorModal = (blockIdx, side, which, group = "entry") => {
    setIndicatorModal({ open: true, blockIdx, side, which, group });
  };

  const handleIndicatorModalConfirm = (indicatorId, params) => {
    const { blockIdx, which, group } = indicatorModal;
    if (blockIdx == null) return;
    const setFn = group === "entry" ? setConditions : setExitBlocks;
    setFn((prev) =>
      prev.map((c, i) => {
        if (i !== blockIdx) return c;
        const next = { ...c };
        if (which === "left") {
          next.long = { ...next.long, indicatorId, params };
          next.short = { ...next.short, indicatorId, params };
        } else {
          next.long = {
            ...next.long,
            rightIndicatorId: indicatorId,
            rightParams: params,
          };
          next.short = {
            ...next.short,
            rightIndicatorId: indicatorId,
            rightParams: params,
          };
        }
        return next;
      })
    );
  };

  const syncComparatorPair = (
    blocksSetter,
    blockIdx,
    changedSide,
    comparerId,
    comparers
  ) => {
    const idNum = +comparerId;
    const normalize = (s = "") => s.toLowerCase().trim();
    const idToName = {};
    comparers.forEach((c) => {
      idToName[c.ComparerId] = c.ComparerName;
    });
    const name = normalize(idToName[idNum]);
    const oppositeNameMap = {
      "crosses above": "crosses below",
      "crosses below": "crosses above",
      "higher than": "less than",
      "less than": "higher than",
    };
    let oppositeId = idNum;
    if (!name.includes("equal")) {
      const oppName = oppositeNameMap[name];
      if (oppName) {
        const opp = comparers.find(
          (c) => normalize(c.ComparerName) === oppName
        );
        if (opp) oppositeId = opp.ComparerId;
      }
    }
    blocksSetter((prev) =>
      prev.map((c, i) => {
        if (i !== blockIdx) return c;
        const otherSide = changedSide === "long" ? "short" : "long";
        return {
          ...c,
          [changedSide]: { ...c[changedSide], comparatorId: idNum },
          [otherSide]: { ...c[otherSide], comparatorId: oppositeId },
        };
      })
    );
  };

  const handleComparerSelect = (
    blockIdx,
    changedSide,
    comparerId,
    group = "entry"
  ) => {
    if (group === "entry") {
      syncComparatorPair(
        setConditions,
        blockIdx,
        changedSide,
        comparerId,
        comparers
      );
    } else {
      syncComparatorPair(
        setExitBlocks,
        blockIdx,
        changedSide,
        comparerId,
        comparers
      );
    }
  };

  const paramSummary = (indicatorId, params) => {
    if (!indicatorId) return "";
    const meta = allIndicators.find((i) => i.IndicatorId === indicatorId);
    if (!meta) return "";
    const parts = (meta.IndicatorParams || []).map((p) => {
      const v = params?.[p.ParamId] ?? "";
      return `${p.ParamName}(${v || 0})`;
    });
    return `${meta.IndicatorName} ${parts.join(" ")}`.trim();
  };

  // UPDATED mapping creator to also map exitBlocks
  useEffect(() => {
    const buildIndicatorObj = (indicatorId, paramBag) => {
      if (!indicatorId) {
        return {
          indicatorId: 0,
          IndicatorParamList: [
            { ParamId: "string", IndicatorParamValue: "string" },
          ],
        };
      }
      const paramList = Object.entries(paramBag || {}).map(([pid, val]) => ({
        ParamId: pid,
        IndicatorParamValue: String(val ?? ""),
      }));
      return {
        indicatorId,
        IndicatorParamList: paramList.length
          ? paramList
          : [{ ParamId: "string", IndicatorParamValue: "string" }],
      };
    };

    const buildEquation = (sideData) => {
      const comparerMeta = comparers.find(
        (c) => c.ComparerId === sideData.comparatorId
      );
      return {
        comparerId: comparerMeta?.ComparerId || 0,
        comparerName: comparerMeta?.ComparerName || "string",
        OperatorId: comparerMeta?.ComparerId || 0,
        OperatorName: comparerMeta?.ComparerName || "string",
        indicator: buildIndicatorObj(sideData.indicatorId, sideData.params),
        comparerIndicator: buildIndicatorObj(
          sideData.rightIndicatorId,
          sideData.rightParams
        ),
      };
    };

    // Entry equations
    let longEq = [];
    let shortEq = [];
    if (transactionType === 0 || transactionType === 1) {
      longEq = conditions.map((b) => buildEquation(b.long));
    }
    if (transactionType === 0 || transactionType === 2) {
      shortEq = conditions.map((b) => buildEquation(b.short));
    }
    setValue("LongEntryEquation", longEq, { shouldDirty: true });
    setValue("ShortEntryEquation", shortEq, { shouldDirty: true });

    // Exit equations (independent)
    let longExitEq = [];
    let shortExitEq = [];
    if (exitConditions) {
      if (transactionType === 0 || transactionType === 1) {
        longExitEq = exitBlocks.map((b) => buildEquation(b.long));
      }
      if (transactionType === 0 || transactionType === 2) {
        shortExitEq = exitBlocks.map((b) => buildEquation(b.short));
      }
    }
    setValue("Long_ExitEquation", longExitEq, { shouldDirty: true });
    setValue("Short_ExitEquation", shortExitEq, { shouldDirty: true });

    setValue("IsChartOnOptionStrike", useCombinedChart, { shouldDirty: true });
  }, [
    conditions,
    exitBlocks,
    comparers,
    transactionType,
    useCombinedChart,
    exitConditions,
    setValue,
  ]);

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      { long: createEmptySide(), short: createEmptySide() },
    ]);
  };
  const addExitCondition = () => {
    setExitBlocks((prev) => [
      ...prev,
      { long: createEmptySide(), short: createEmptySide() },
    ]);
  };

  const removeCondition = (index) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };
  const removeExitCondition = (index) => {
    setExitBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-[#15171C]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg text-black dark:text-white">
          Entry Conditions
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={useCombinedChart}
            onChange={(e) => setUseCombinedChart(e.target.checked)}
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

      {conditions.map((block, idx) => (
        <div
          key={idx}
          className="border border-dashed border-gray-200 rounded-xl p-4 mb-4 relative"
        >
          {conditions.length > 1 && (
            <button
              type="button"
              onClick={() => removeCondition(idx)}
              className="absolute right-4 top-4 text-red-400 hover:text-red-600"
            >
              <FiTrash />
            </button>
          )}
          {(transactionType === 0 || transactionType === 1) && (
            <>
              <p className="text-green-600 font-semibold mb-2">
                Long Entry Conditions
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    openIndicatorModal(idx, "long", "left", "entry")
                  }
                  className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                >
                  {block.long.indicatorId
                    ? allIndicators.find(
                        (i) => i.IndicatorId === block.long.indicatorId
                      )?.IndicatorName
                    : "Select Indicator"}
                </button>
                <select
                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  value={block.long.comparatorId || 0}
                  onChange={(e) =>
                    handleComparerSelect(idx, "long", e.target.value, "entry")
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
                    openIndicatorModal(idx, "long", "right", "entry")
                  }
                  className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                >
                  {block.long.rightIndicatorId
                    ? allIndicators.find(
                        (i) => i.IndicatorId === block.long.rightIndicatorId
                      )?.IndicatorName
                    : "Select Indicator"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {paramSummary(block.long.indicatorId, block.long.params)}
                </p>
                <div />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {paramSummary(
                    block.long.rightIndicatorId,
                    block.long.rightParams
                  )}
                </p>
              </div>
            </>
          )}
          {(transactionType === 0 || transactionType === 2) && (
            <>
              <p className="text-red-500 font-semibold mt-6 mb-2">
                Short Entry Conditions
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    openIndicatorModal(idx, "short", "left", "entry")
                  }
                  className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                >
                  {block.short.indicatorId
                    ? allIndicators.find(
                        (i) => i.IndicatorId === block.short.indicatorId
                      )?.IndicatorName
                    : "Select Indicator"}
                </button>
                <select
                  className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                  value={block.short.comparatorId || 0}
                  onChange={(e) =>
                    handleComparerSelect(idx, "short", e.target.value, "entry")
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
                    openIndicatorModal(idx, "short", "right", "entry")
                  }
                  className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                >
                  {block.short.rightIndicatorId
                    ? allIndicators.find(
                        (i) => i.IndicatorId === block.short.rightIndicatorId
                      )?.IndicatorName
                    : "Select Indicator"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {paramSummary(block.short.indicatorId, block.short.params)}
                </p>
                <div />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {paramSummary(
                    block.short.rightIndicatorId,
                    block.short.rightParams
                  )}
                </p>
              </div>
            </>
          )}
          {transactionType === 0 && idx < conditions.length - 1 && (
            <div className="text-center mt-4">
              <div className="inline-flex rounded-md border border-gray-300">
                <button
                  type="button"
                  className="px-4 py-1 bg-blue-500 text-white text-xs rounded-l"
                >
                  AND
                </button>
                <button
                  type="button"
                  className="px-4 py-1 text-gray-500 text-xs"
                >
                  OR
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="mt-4 text-right">
        <button
          type="button"
          onClick={addCondition}
          className="bg-[#0096FF] text-white text-sm px-4 py-3 rounded-lg hover:bg-blue-600"
        >
          + Add Condition
        </button>
      </div>

      {/* Exit Conditions toggle (reset state on uncheck) */}
      <label className="flex items-center gap-2 text-sm text-gray-500 mt-4">
        <input
          type="checkbox"
          checked={exitConditions}
          onChange={(e) => {
            const checked = e.target.checked;
            setExitConditions(checked);
            if (!checked) {
              // reset to initial single block
              setExitBlocks([{ ...initialCondition }]);
              // also clear equations in form
              setValue("Long_ExitEquation", [], { shouldDirty: true });
              setValue("Short_ExitEquation", [], { shouldDirty: true });
            } else if (checked && exitBlocks.length === 0) {
              setExitBlocks([{ ...initialCondition }]);
            }
          }}
        />
        Exit Conditions{" "}
        <span className="text-xs text-gray-400">(Optional)</span>
      </label>

      {exitConditions && (
        <div className="mt-4">
          {exitBlocks.map((block, idx) => (
            <div
              key={idx}
              className="border border-dashed border-gray-200 rounded-xl p-4 mb-4 relative"
            >
              {exitBlocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExitCondition(idx)}
                  className="absolute right-4 top-4 text-red-400 hover:text-red-600"
                >
                  <FiTrash />
                </button>
              )}
              {(transactionType === 0 || transactionType === 1) && (
                <>
                  <p className="text-green-600 font-semibold mb-2">
                    Long Exit Conditions
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        openIndicatorModal(idx, "long", "left", "exit")
                      }
                      className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    >
                      {block.long.indicatorId
                        ? allIndicators.find(
                            (i) => i.IndicatorId === block.long.indicatorId
                          )?.IndicatorName
                        : "Select Indicator"}
                    </button>
                    <select
                      className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                      value={block.long.comparatorId || 0}
                      onChange={(e) =>
                        handleComparerSelect(
                          idx,
                          "long",
                          e.target.value,
                          "exit"
                        )
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
                        openIndicatorModal(idx, "long", "right", "exit")
                      }
                      className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    >
                      {block.long.rightIndicatorId
                        ? allIndicators.find(
                            (i) => i.IndicatorId === block.long.rightIndicatorId
                          )?.IndicatorName
                        : "Select Indicator"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {paramSummary(block.long.indicatorId, block.long.params)}
                    </p>
                    <div />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {paramSummary(
                        block.long.rightIndicatorId,
                        block.long.rightParams
                      )}
                    </p>
                  </div>
                </>
              )}
              {(transactionType === 0 || transactionType === 2) && (
                <>
                  <p className="text-red-500 font-semibold mt-6 mb-2">
                    Short Exit Conditions
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        openIndicatorModal(idx, "short", "left", "exit")
                      }
                      className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    >
                      {block.short.indicatorId
                        ? allIndicators.find(
                            (i) => i.IndicatorId === block.short.indicatorId
                          )?.IndicatorName
                        : "Select Indicator"}
                    </button>
                    <select
                      className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                      value={block.short.comparatorId || 0}
                      onChange={(e) =>
                        handleComparerSelect(
                          idx,
                          "short",
                          e.target.value,
                          "exit"
                        )
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
                        openIndicatorModal(idx, "short", "right", "exit")
                      }
                      className="border rounded px-3 py-2 text-left text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                    >
                      {block.short.rightIndicatorId
                        ? allIndicators.find(
                            (i) =>
                              i.IndicatorId === block.short.rightIndicatorId
                          )?.IndicatorName
                        : "Select Indicator"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {paramSummary(
                        block.short.indicatorId,
                        block.short.params
                      )}
                    </p>
                    <div />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {paramSummary(
                        block.short.rightIndicatorId,
                        block.short.rightParams
                      )}
                    </p>
                  </div>
                </>
              )}
              {transactionType === 0 && idx < exitBlocks.length - 1 && (
                <div className="text-center mt-4">
                  <div className="inline-flex rounded-md border border-gray-300">
                    <button
                      type="button"
                      className="px-4 py-1 bg-blue-500 text-white text-xs rounded-l"
                    >
                      AND
                    </button>
                    <button
                      type="button"
                      className="px-4 py-1 text-gray-500 text-xs"
                    >
                      OR
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Move Add Exit Condition button ABOVE checkbox */}
      {exitConditions && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={addExitCondition}
            className="bg-[#0096FF] disabled:opacity-40 text-white text-sm px-4 py-3 rounded-lg hover:bg-blue-600"
          >
            + Add Exit Condition
          </button>
        </div>
      )}

      <IndicatorSelectorModal
        visible={indicatorModal.open}
        onClose={() => setIndicatorModal((s) => ({ ...s, open: false }))}
        indicators={allIndicators}
        currentIndicatorId={
          indicatorModal.which === "left"
            ? indicatorModal.group === "entry"
              ? conditions[indicatorModal.blockIdx]?.[indicatorModal.side]
                  ?.indicatorId
              : exitBlocks[indicatorModal.blockIdx]?.[indicatorModal.side]
                  ?.indicatorId
            : indicatorModal.group === "entry"
            ? conditions[indicatorModal.blockIdx]?.[indicatorModal.side]
                ?.rightIndicatorId
            : exitBlocks[indicatorModal.blockIdx]?.[indicatorModal.side]
                ?.rightIndicatorId
        }
        currentParams={
          indicatorModal.which === "left"
            ? indicatorModal.group === "entry"
              ? conditions[indicatorModal.blockIdx]?.[indicatorModal.side]
                  ?.params
              : exitBlocks[indicatorModal.blockIdx]?.[indicatorModal.side]
                  ?.params
            : indicatorModal.group === "entry"
            ? conditions[indicatorModal.blockIdx]?.[indicatorModal.side]
                ?.rightParams
            : exitBlocks[indicatorModal.blockIdx]?.[indicatorModal.side]
                ?.rightParams
        }
        onConfirm={handleIndicatorModalConfirm}
      />
    </div>
  );
};

export default EntryCondition;
