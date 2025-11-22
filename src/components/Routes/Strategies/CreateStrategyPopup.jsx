import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import { sebiModal } from "../../../assets";
import PrimaryButton from "../../common/PrimaryButton";

const CreateStrategyPopup = ({ onClose }) => {
  const popupRef = useRef(null);
  const navigate = useNavigate();
  const [selected, setSelected] = useState("builder");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleCreate = () => {
    if (selected === "builder") navigate("/trading/strategy-builder");
    else navigate("/trading/signals");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/40">
      <div
        ref={popupRef}
        className="bg-white dark:bg-[#15171C] text-gray-900 dark:text-white rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-xl"
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <img src={sebiModal} alt="Icon" className="w-5 h-5" />
          Select Strategy type
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: "builder",
              title: "Strategy Builder",
              desc: "Design multi-leg option strategies with visual controls, advanced risk management, and deployment-ready automation.",
            },
            // {
            //   key: "signals",
            //   title: "Tradingview Signals Trading",
            //   desc: "Pipe TradingView alerts directly into Algorooms executions with managed risk and audit trails.",
            // },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => setSelected(item.key)}
              className={`p-4 rounded-xl border ${
                selected === item.key
                  ? "border-[#0096FF] bg-[#F0F8FF] dark:bg-[#1E2027]"
                  : "border-gray-200 dark:border-[#2D2F36]"
              } cursor-pointer relative transition`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{item.title}</p>
                {selected === item.key && (
                  <span className="w-5 h-5 flex items-center justify-center bg-[#0096FF] rounded-full text-white">
                    <FiCheck size={12} />
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {item.desc}
              </p>
              <p className="mt-2 text-xs text-blue-500 underline">Read More</p>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <PrimaryButton
            onClick={handleCreate}
            className="w-full py-3 rounded-lg font-medium"
          >
            Create Strategy
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default CreateStrategyPopup;
