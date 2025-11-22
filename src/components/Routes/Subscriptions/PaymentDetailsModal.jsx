import React, { useState } from "react";
import { paymentDetailsIcon } from "../../../assets";
import { useInitiatePayment } from "../../../hooks/subscriptionHooks";
import { toast } from "react-toastify";
import PrimaryButton from "../../common/PrimaryButton";

const PaymentDetailsModal = ({
  isOpen,
  onClose,
  data,
  onProcessPayment,
  paymentPayload,
}) => {
  const [agree, setAgree] = useState(false);
  const { mutate: initiatePayment, isPending } = useInitiatePayment();

  if (!isOpen) return null;

  const handleOutsideClick = (e) => {
    if (e.target.id === "modal-overlay") onClose();
  };

  const handleProcessPayment = () => {
    if (!agree) return;

    initiatePayment(paymentPayload, {
      onSuccess: (response) => {
        // Response contains: paymentLink, orderId, tokenType, amount
        if (response?.paymentLink) {
          // Open Razorpay payment link in new tab
          window.open(response.paymentLink, "_blank");
          toast.success("Payment link generated successfully");
          onProcessPayment(response);
        } else {
          toast.error("Failed to generate payment link");
        }
      },
      onError: (error) => {
        toast.error(error?.message || "Failed to initiate payment");
      },
    });
  };

  return (
    <div
      id="modal-overlay"
      onClick={handleOutsideClick}
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
    >
      <div className="bg-white dark:bg-[#15171C] w-full max-w-md p-6 rounded-2xl shadow-lg space-y-4">
        <div className="text-lg font-semibold flex items-center gap-2 text-[#2E3A59] dark:text-white">
          <img src={paymentDetailsIcon} alt="" /> Payment Details
        </div>

        <div className="text-sm space-y-4">
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Subscription Plan Name
            </span>
            <span className="font-medium">{data?.PlanName || "N/A"}</span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Subscription Type
            </span>
            <span>
              {data?.PlanType
                ? data.PlanType.charAt(0).toUpperCase() +
                  data.PlanType.slice(1).toLowerCase()
                : "N/A"}
            </span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Base Price
            </span>
            <span>₹{data?.BasePrice?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Wallet Balance
            </span>
            <span className="text-green-600 dark:text-green-400">
              -₹{data?.WalletAmount?.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">Discount</span>
            <span className="text-green-600 dark:text-green-400">
              -₹{data?.discount || "0.00"}
            </span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">Coupon</span>
            <span>-₹{data?.coupon || "0.00"}</span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">IGST 18%</span>
            <span className="text-red-500 dark:text-red-400">
              +₹{data?.GstTaxationCharge?.toFixed(2) || "0.00"}
            </span>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="flex justify-between font-medium text-base text-[#2E3A59] dark:text-white">
            <span>Net Payable</span>
            <span>
              ₹
              {(
                data?.NetPaybleAmount ??
                (data?.BasePrice || 0) -
                  (data?.WalletAmount || 0) -
                  (data?.CouponDiscountAmount || 0) +
                  (data?.GstTaxationCharge || 0)
              ).toFixed(2)}
            </span>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree(!agree)}
            className="mt-1 accent-blue-600"
          />
          <label className="text-sm text-[#2E3A59] dark:text-white">
            I accept all payment terms and{" "}
            <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">
              refund policy
            </span>
          </label>
        </div>

        <PrimaryButton
          disabled={!agree || isPending}
          onClick={handleProcessPayment}
          className="w-full py-4 rounded-xl text-sm font-semibold"
        >
          {isPending ? "Processing..." : "Process Payment"}
        </PrimaryButton>
      </div>
    </div>
  );
};

export default PaymentDetailsModal;
