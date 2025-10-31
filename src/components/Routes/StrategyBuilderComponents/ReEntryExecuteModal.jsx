import React, { useState, useEffect } from "react";

const ReEntryExecuteModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [executionType, setExecutionType] = useState(
    initialData.executionType || "ReExecute"
  );
  const [cycles, setCycles] = useState(initialData.cycles || "1");
  const [actionType, setActionType] = useState(
    initialData.actionType || "IMMDT"
  );

  // Update state when modal opens with new initialData
  useEffect(() => {
    if (isOpen) {
      setExecutionType(initialData.executionType || "ReExecute");
      setCycles(initialData.cycles || "1");
      setActionType(initialData.actionType || "IMMDT");
    }
  }, [
    isOpen,
    initialData.executionType,
    initialData.cycles,
    initialData.actionType,
  ]);

  const handleSave = () => {
    onSave({
      executionType,
      cycles,
      actionType,
    });
    onClose();
  };

  if (!isOpen) return null;

  // Determine if action type dropdown should be disabled
  const isActionTypeDisabled =
    executionType === "ReEntry On Cost" || executionType === "ReEntry On Close";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#15171C] rounded-xl p-6 w-[90%] max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Re-Entry/Execute Configuration
        </h3>

        <div className="bg-blue-50 dark:bg-[#1E2027] p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs mt-0.5">
              i
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Configure re-entry behavior for your strategy. Choose execution
              type and number of cycles based on your risk management needs.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Re-Entry Type Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Re-Entry Type
            </label>
            <select
              value={executionType}
              onChange={(e) => setExecutionType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
            >
              <option value="ReExecute">ReExecute</option>
              <option value="ReEntry On Cost">ReEntry On Cost</option>
              <option value="ReEntry On Close">ReEntry On Close</option>
            </select>
          </div>

          {/* Action Type - Disabled for "ReEntry On Cost" and "ReEntry On Close" */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Action Type
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              disabled={isActionTypeDisabled}
              className={`w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333] ${
                isActionTypeDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <option value="ON_CLOSE">On Close</option>
              <option value="IMMDT">Immediate</option>
            </select>
          </div>

          {/* Re-entry/Execute cycles input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Re-Entry/Execute Cycles
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={cycles}
                onChange={(e) => setCycles(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
                placeholder="Enter cycles"
              />
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
