import React, { useEffect, useState, useMemo } from "react";
import PrimaryButton from "../../common/PrimaryButton";

const IndicatorSelectorModal = ({
  visible,
  onClose,
  indicators = [],
  currentIndicatorId = 0,
  currentParams = {},
  onConfirm,
}) => {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(currentIndicatorId || 0);
  const [paramValues, setParamValues] = useState(currentParams || {});

  const filtered = useMemo(
    () =>
      indicators.filter((i) =>
        i.IndicatorName.toLowerCase().includes(search.toLowerCase())
      ),
    [indicators, search]
  );

  const selectedMeta = useMemo(
    () => indicators.find((i) => i.IndicatorId === selectedId),
    [indicators, selectedId]
  );

  // Initialize params when indicator changes
  useEffect(() => {
    if (!selectedMeta) return;
    const next = {};
    (selectedMeta.IndicatorParams || []).forEach((p) => {
      const firstListValue =
        p.ParamType === "List" && Array.isArray(p.ParamNameList)
          ? p.ParamNameList[0] ?? ""
          : "";
      next[p.ParamId] =
        paramValues[p.ParamId] ?? p.DefaultValue ?? firstListValue;
    });
    setParamValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMeta?.IndicatorId]);

  if (!visible) return null;

  const handleParamChange = (pid, val) =>
    setParamValues((prev) => ({ ...prev, [pid]: val }));

  const handleOk = () => {
    onConfirm(selectedId, paramValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-2 py-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#1E2027] rounded-2xl w-full max-w-3xl shadow-xl p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">
          Select Indicator
        </h3>
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4 dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
        />

        <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
          {filtered.map((ind) => {
            const active = ind.IndicatorId === selectedId;
            return (
              <div
                key={ind.IndicatorId}
                className={`border rounded-lg p-3 transition ${
                  active
                    ? "border-blue-500 bg-blue-50 dark:bg-[#0F3F62]"
                    : "border-gray-200 dark:border-[#2C2F36]"
                }`}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={active}
                    onChange={() => setSelectedId(ind.IndicatorId)}
                  />
                  <span className="text-sm font-medium dark:text-gray-200">
                    {ind.IndicatorName}
                  </span>
                </label>

                {active && (
                  <div className="mt-3 grid md:grid-cols-3 gap-3">
                    {(ind.IndicatorParams || []).map((p) => {
                      const val = paramValues[p.ParamId] ?? "";
                      if (
                        p.ParamType === "List" &&
                        Array.isArray(p.ParamNameList)
                      ) {
                        return (
                          <div key={p.ParamId}>
                            <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                              {p.ParamName}
                            </label>
                            <select
                              value={val || p.ParamNameList?.[0] || ""}
                              onChange={(e) =>
                                handleParamChange(p.ParamId, e.target.value)
                              }
                              className="w-full border rounded px-2 py-1 text-xs dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                            >
                              {p.ParamNameList.map((opt) => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      return (
                        <div key={p.ParamId}>
                          <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                            {p.ParamName}
                          </label>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              handleParamChange(p.ParamId, e.target.value)
                            }
                            className="w-full border rounded px-2 py-1 text-xs dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
                            placeholder={p.ParamType}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!filtered.length && (
            <p className="text-xs text-gray-500">No indicators found.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border text-sm dark:border-[#2C2F36] dark:text-gray-200"
          >
            Cancel
          </button>
          <PrimaryButton
            type="button"
            disabled={!selectedId}
            onClick={handleOk}
            className="px-6 py-2 rounded-lg text-sm"
          >
            Ok
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default IndicatorSelectorModal;
