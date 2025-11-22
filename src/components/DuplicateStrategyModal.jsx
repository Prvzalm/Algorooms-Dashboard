import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PrimaryButton from "./common/PrimaryButton";

const DuplicateStrategyModal = ({
  open,
  originalName = "",
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(`${originalName} Copy`);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, originalName]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter" && name.trim() && !loading) {
        onSubmit?.(name.trim());
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, name, loading, onCancel, onSubmit]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1f1f24] rounded-xl p-6 w-full max-w-sm shadow-xl border border-gray-200 dark:border-gray-700 text-black dark:text-white"
      >
        <h3 className="text-base font-semibold mb-2">
          Duplicate {originalName}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
          Provide a name for the duplicated strategy.
        </p>
        <div className="mb-5">
          <label className="block text-xs font-medium mb-1">
            Strategy Name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2d33] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new strategy name"
            maxLength={60}
            disabled={loading}
          />
        </div>
        <div className="flex justify-end gap-3 text-sm">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <PrimaryButton
            className="px-4 py-2"
            onClick={() => name.trim() && onSubmit?.(name.trim())}
            disabled={!name.trim() || loading}
          >
            {loading ? "Duplicating..." : "Duplicate"}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DuplicateStrategyModal;
