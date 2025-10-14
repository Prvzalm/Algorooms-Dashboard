import React, { useState } from "react";

const ReEntryExecuteModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [executionType, setExecutionType] = useState(
    initialData.executionType || "Combined"
  );
  const [cycles, setCycles] = useState(initialData.cycles || "1");
  const [actionType, setActionType] = useState(
    initialData.actionType || "ON_CLOSE"
  );

  const handleSave = () => {
    onSave({
      executionType,
      cycles,
      actionType,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#15171C] rounded-xl p-6 w-[90%] max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Re-Entry/Execute
        </h3>

        <div className="bg-blue-50 dark:bg-[#1E2027] p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-0.5">
              i
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Execute combined executes all strategy components as a single
              order. Execute leg-wise executes each component separately.
              Choices depend on strategy complexity and market conditions,
              affecting execution and risk management.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Toggle between Combined, Leg Wise, and Exit */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setExecutionType("Combined")}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                executionType === "Combined"
                  ? "bg-[#0096FF] text-white"
                  : "bg-gray-100 dark:bg-[#1E2027] text-gray-700 dark:text-gray-300"
              }`}
            >
              Combined
            </button>
            <button
              type="button"
              onClick={() => setExecutionType("Leg Wise")}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                executionType === "Leg Wise"
                  ? "bg-[#0096FF] text-white"
                  : "bg-gray-100 dark:bg-[#1E2027] text-gray-700 dark:text-gray-300"
              }`}
            >
              Leg Wise
            </button>
            <button
              type="button"
              onClick={() => setExecutionType("Exit")}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                executionType === "Exit"
                  ? "bg-[#0096FF] text-white"
                  : "bg-gray-100 dark:bg-[#1E2027] text-gray-700 dark:text-gray-300"
              }`}
            >
              Exit
            </button>
          </div>

          {/* Action Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Action Type
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
            >
              <option value="ON_CLOSE">On Close</option>
              <option value="IMMDT">Immediate</option>
            </select>
          </div>

          {/* Re-entry/Execute cycles input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Re-Entry/Execute cycles
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={cycles}
                onChange={(e) => setCycles(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333] pr-8"
                placeholder="Enter cycles"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 14l5-5 5 5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm dark:border-[#333] dark:text-gray-300 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white text-sm transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReEntryExecuteModal;
