import React, { useState } from "react";
import { paymentDetailsIcon } from "../../../assets";

const PaymentDetailsModal = ({ isOpen, onClose, data, onProcessPayment }) => {
  const [agree, setAgree] = useState(false);

  if (!isOpen) return null;

  const handleOutsideClick = (e) => {
    if (e.target.id === "modal-overlay") onClose();
  };

  return (
    <div
      id="modal-overlay"
      onClick={handleOutsideClick}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
    >
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg space-y-4">
        <div className="text-lg font-semibold flex items-center gap-2">
          <img src={paymentDetailsIcon} alt="" /> Payment Details
        </div>

        <div className="text-sm space-y-4">
          <div className="flex justify-between">
            <span className="text-[#707070]">Subscription Plan Name</span>
            <span className="font-medium">{data.planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">Subscription Type</span>
            <span>{data.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">Base Price</span>
            <span>₹{data.basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">Wallet Balance</span>
            <span className="text-green-600">-₹{data.wallet.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">Discount</span>
            <span className="text-green-600">-₹{data.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">Coupon</span>
            <span>-₹{data.coupon.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#707070]">IGST 18%</span>
            <span className="text-red-500">+₹{data.tax.toFixed(2)}</span>
          </div>
          <hr />
          <div className="flex justify-between font-medium text-base">
            <span>Net Payable</span>
            <span>₹{data.netPayable.toFixed(0)}</span>
          </div>
          <hr />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree(!agree)}
            className="mt-1"
          />
          <label className="text-sm">
            I accept all payment terms and{" "}
            <span className="text-blue-600 underline cursor-pointer">
              refund policy
            </span>
          </label>
        </div>

        <button
          disabled={!agree}
          onClick={onProcessPayment}
          className={`w-full py-3 rounded-xl text-white text-sm font-semibold ${
            agree ? "bg-[#0096FF]" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Process Payment
        </button>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
