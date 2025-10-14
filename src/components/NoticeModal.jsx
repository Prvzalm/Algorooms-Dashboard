import { useState } from "react";
import { sebiModal } from "../assets";

const NoticeModal = ({ onClose }) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15171C] rounded-2xl max-w-xl w-full p-6 space-y-4 text-sm text-[#2E3A59] dark:text-white">
        <div className="flex items-center space-x-2">
          <img src={sebiModal} alt="icon" className="w-5 h-5" />
          <h2 className="text-base font-semibold">
            Risk disclosures on derivatives
          </h2>
        </div>

        <ul className="list-disc list-inside space-y-2">
          <li>
            9 out of 10 individual traders in equity Futures and Options
            Segment, incurred net losses.
          </li>
          <li>
            On an average, loss makers registered net trading loss close to
            ₹50,000.
          </li>
          <li>
            Over and above the net trading losses incurred, loss makers expended
            an additional 28% of net trading losses as transaction costs.
          </li>
          <li>
            Those making net trading profits, incurred between 15% to 50% of
            such profits as transaction cost.
          </li>
        </ul>

        <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
          Source:{" "}
          <a href="#" className="text-blue-600 underline">
            SEBI
          </a>{" "}
          study dated January 25, 2023 on “Analysis of Profit and Loss of
          Individual Traders dealing in equity Futures and Options (F&O)
          Segment”, wherein Aggregate Level findings are based on annual
          Profit/Loss incurred by individual traders in equity F&O during FY
          2021-22.
        </p>

        <label className="flex items-center space-x-2 text-xs">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-4 h-4"
          />
          <span>
            I accept all the{" "}
            <a href="#" className="text-blue-600 underline">
              Terms & Conditions
            </a>
          </span>
        </label>

        <button
          disabled={!accepted}
          onClick={onClose}
          className={`w-full py-3 rounded-md text-white font-semibold transition ${
            accepted
              ? "bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)]"
              : "bg-blue-300 cursor-not-allowed"
          }`}
        >
          I Understand
        </button>
      </div>
    </div>
  );
};

export default NoticeModal;
