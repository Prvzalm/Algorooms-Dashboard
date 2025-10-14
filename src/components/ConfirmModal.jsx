import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const ConfirmModal = ({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
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
        className="bg-white dark:bg-[#1f1f24] rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-gray-700 text-black dark:text-white"
      >
        <h3 className="text-base font-semibold mb-2">{title}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed whitespace-pre-line">
          {message}
        </p>
        <div className="flex justify-end gap-3 text-sm">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white disabled:opacity-60 transition"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
