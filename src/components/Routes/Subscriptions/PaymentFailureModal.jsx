import { failurePaymentIcon } from "../../../assets";

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

        <div className="mb-1">Payment Failed!</div>
        <div className="text-2xl font-bold text-[#2E3A59] dark:text-white mb-4">
          ₹{data.amount}
        </div>

        <div className="text-sm text-left space-y-2 text-[#2E3A59] dark:text-white mb-6">
          <div className="flex justify-between">
            <span className="text-[#707070]">Ref Number</span>
            <span>--------</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">Payment Time</span>
            <span>{data.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">Payment Method</span>
            <span>{data.method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">Sender Name</span>
            <span className="font-medium">{data.sender}</span>
          </div>
        </div>

        <button
          className="bg-[#0096FF] hover:bg-[#007ddc] transition text-white py-3 w-full rounded-lg font-semibold"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
    </div>
  );
};

export default PaymentFailureModal;
