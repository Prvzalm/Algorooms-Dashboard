import React, { useState } from "react";
import PrimaryButton from "../../common/PrimaryButton";

const TrailStopLossModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [trailingType, setTrailingType] = useState(
    initialData.trailingType || "%"
  );
  const [priceMovement, setPriceMovement] = useState(
    initialData.priceMovement || ""
  );
  const [trailingValue, setTrailingValue] = useState(
    initialData.trailingValue || ""
  );

  const handleSave = () => {
    onSave({
      trailingType,
      priceMovement: Number(priceMovement) || 0,
      trailingValue: Number(trailingValue) || 0,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#15171C] rounded-xl p-6 w-[90%] max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-black dark:text-white">
          Trail Stop loss
        </h3>

        <div className="bg-[#E8EDFF] dark:bg-[#1E2027] p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[#1B44FE] text-white flex items-center justify-center text-xs mt-0.5">
              i
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A trailing stop-loss is a dynamic trading tool. It's an order that
              adjusts as market prices change. It follows an asset's value at a
              specified distance or percentage, aiming to protect profits by
              selling if the price moves against the trade's direction.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Toggle between % and Pt */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTrailingType("%")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                trailingType === "%"
                  ? "bg-[#1B44FE] text-white"
                  : "bg-gray-100 dark:bg-[#1E2027] text-gray-700 dark:text-gray-300"
              }`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => setTrailingType("Pt")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                trailingType === "Pt"
                  ? "bg-[#1B44FE] text-white"
                  : "bg-gray-100 dark:bg-[#1E2027] text-gray-700 dark:text-gray-300"
              }`}
            >
              Pt
            </button>
          </div>

          {/* If price moves (X) input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              If price moves (X)
            </label>
            <div className="relative">
              <input
                type="number"
                value={priceMovement}
                onChange={(e) => setPriceMovement(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333] pr-8"
                placeholder="Enter value"
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

          {/* Then Trail SL by (Y) input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Then Trail SL by (Y)
            </label>
            <input
              type="number"
              value={trailingValue}
              onChange={(e) => setTrailingValue(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#333]"
              placeholder="Enter value"
            />
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
          <PrimaryButton onClick={handleSave} className="px-4 py-2 text-sm">
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default TrailStopLossModal;
