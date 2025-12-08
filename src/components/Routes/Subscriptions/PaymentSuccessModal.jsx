import { successPaymentIcon } from "../../../assets";

const PaymentSuccessModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#15171C] rounded-2xl p-6 md:p-8 w-full max-w-sm text-center"
      >
        <div className="flex justify-center mb-4">
          <img src={successPaymentIcon} alt="" />
        </div>

        <div className="text-lg font-medium mb-1 text-[#2E3A59] dark:text-white">
          Payment Success!
        </div>
        <div className="text-[22px] font-bold mb-4 text-[#2E3A59] dark:text-white">
          ₹{data.amount}
        </div>

        <div className="text-left text-sm text-[#2E3A59] dark:text-white space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between">
            <span className="font-normal text-[#707070] dark:text-gray-400">
              Ref Number
            </span>
            <span className="font-medium">{data.ref || "000085752257"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-normal text-[#707070] dark:text-gray-400">
              Payment Time
            </span>
            <span className="font-medium">{data.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-normal text-[#707070] dark:text-gray-400">
              Payment Method
            </span>
            <span className="font-medium">{data.method}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-normal text-[#707070] dark:text-gray-400">
              Sender Name
            </span>
            <span className="font-medium">{data.sender}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
