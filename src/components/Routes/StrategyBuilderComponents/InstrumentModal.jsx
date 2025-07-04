import { useEffect, useRef } from "react";
import { searchIcon } from "../../../assets";

const InstrumentModal = ({ visible, onClose, selected, setSelected }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-6 w-[90%] max-w-md dark:bg-[#15171C] relative"
      >
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-4 bg-[#F5F8FA] dark:bg-[#1E2027]">
          <img src={searchIcon} alt="" />
          <input
            type="text"
            placeholder="Search scripts: i.e. State Bank of India, Banknifty, Crudeoil"
            className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-white placeholder:text-gray-400"
          />
        </div>

        <div className="space-x-3 text-sm mb-2">
          {["Options", "Equity", "Futures", "Indices", "CDS", "MCX"].map(
            (type, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name="type"
                  defaultChecked={type === "Options"}
                />{" "}
                {type}
              </label>
            )
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          *Only option category allowed for Time-Based Strategy type
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {["NIFTY 50", "NIFTY BANK", "NIFTY FIN SERVICE", "SENSEX"].map(
            (name, i) => (
              <button
                key={i}
                onClick={() => setSelected(name)}
                className={`border rounded-lg py-2 text-sm font-medium 
              ${
                selected === name
                  ? "bg-blue-100 text-[#0096FF] dark:bg-[#2A2D34] dark:text-blue-400"
                  : "text-gray-700 hover:bg-blue-50 dark:text-white dark:hover:bg-[#2A2D34]"
              } dark:border-[#1E2027]`}
              >
                {name}
              </button>
            )
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#0096FF] text-white py-2 rounded-lg font-semibold"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default InstrumentModal;
