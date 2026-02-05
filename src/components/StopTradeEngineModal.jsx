import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PrimaryButton from "./common/PrimaryButton";

const StopTradeEngineModal = ({
  open,
  title = "Are you sure you want to stop or stop & square off trading engine?",
  message = "The stop action will stop the trading engine and the stop & square off action will first attempt to square off the strategies and then stop the trading engine.",
  warningMessage = "Important: Please verify your broker account after square off to ensure all positions are closed successfully.",
  cancelLabel = "Cancel",
  stopLabel = "Stop",
  stopSquareOffLabel = "Stop & Square Off",
  onCancel,
  onStop,
  onStopSquareOff,
  loading = false,
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1f1f24] rounded-2xl p-6 sm:p-7 w-full max-w-xl shadow-xl border border-gray-200 dark:border-gray-700 text-black dark:text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stop-trade-engine-title"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#FFF7EB] text-[#F6A106] flex items-center justify-center text-3xl mb-4">
            !
          </div>
          <h3
            id="stop-trade-engine-title"
            className="text-lg sm:text-xl font-semibold text-[#2E3A59] dark:text-white mb-3"
          >
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
            {message}
          </p>
          <div className="mt-5 w-full flex items-start gap-3 rounded-xl border border-[#FCD49B] bg-[#FFF7EB] px-4 py-3 text-left">
            <div className="text-xl text-[#F6A106] pt-0.5">!</div>
            <p className="text-xs sm:text-sm text-[#B56504] leading-relaxed">
              {warningMessage}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 gap-3 text-sm">
          <button
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#E3E8EF] text-[#2E3A59] hover:bg-[#d4dbe6] disabled:opacity-50"
            onClick={onStop}
            disabled={loading}
          >
            {stopLabel}
          </button>
          <PrimaryButton
            onClick={onStopSquareOff}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2"
          >
            {loading ? "Please wait..." : stopSquareOffLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default StopTradeEngineModal;
