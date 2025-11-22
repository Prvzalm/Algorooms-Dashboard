import { failurePaymentIcon } from "../../../assets";
import PrimaryButton from "../../common/PrimaryButton";

const PaymentFailureModal = ({ isOpen, onClose, data, onRetry }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#15171C] rounded-2xl px-6 py-8 w-full max-w-sm text-center shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <img src={failurePaymentIcon} alt="" />
        </div>

        <div className="mb-1 text-[#2E3A59] dark:text-white">
          Payment Failed!
        </div>
        <div className="text-2xl font-bold text-[#2E3A59] dark:text-white mb-4">
          ₹{data.amount}
        </div>

        <div className="text-sm text-left space-y-2 text-[#2E3A59] dark:text-white mb-6">
          <div className="flex justify-between">
            <span className="text-[#707070] dark:text-gray-400">
              Ref Number
            </span>
            <span>--------</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070] dark:text-gray-400">
              Payment Time
            </span>
            <span>{data.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070] dark:text-gray-400">
              Payment Method
            </span>
            <span>{data.method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070] dark:text-gray-400">
              Sender Name
            </span>
            <span className="font-medium">{data.sender}</span>
          </div>
        </div>

        <PrimaryButton
          onClick={onRetry}
          className="w-full py-3 rounded-lg font-semibold"
        >
          Try again
        </PrimaryButton>
      </div>
    </div>
  );
};

export default PaymentFailureModal;
