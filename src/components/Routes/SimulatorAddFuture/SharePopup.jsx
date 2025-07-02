import { useRef, useEffect } from "react";
import { FiCopy } from "react-icons/fi";
import { sharePopupIcon } from "../../../assets";

const SharePopup = ({
  url = "https://www.algorooms.in/#!/share/bflbvk;fvfv",
  onClose,
}) => {
  const popupRef = useRef();

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/40">
      <div
        ref={popupRef}
        className="bg-white dark:bg-[#15171C] text-gray-900 dark:text-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl relative"
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <img src={sharePopupIcon} alt="Share" className="w-5 h-5" />
          Share This Strategy
        </h3>

        <div className="bg-gray-100 dark:bg-[#1E2027] p-3 rounded-md overflow-x-auto text-sm">
          <span className="break-all block">{url}</span>
        </div>

        <button
          className="w-full bg-[#0096FF] hover:bg-blue-500 text-white font-medium py-4 rounded-lg flex items-center justify-center gap-2"
          onClick={() => {
            navigator.clipboard.writeText(url);
            onClose?.();
          }}
        >
          <FiCopy size={16} />
          Copy link
        </button>
      </div>
    </div>
  );
};

export default SharePopup;
