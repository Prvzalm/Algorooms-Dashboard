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

  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const planType = data?.PlanType || data?.SubscriptionType || "N/A";
  const planDays =
    data?.PlanDays ||
    data?.PlanDuration ||
    data?.PlanDurationInDays ||
    data?.SubscriptionDays ||
    data?.DurationInDays ||
    null;

  const basePrice = toNumber(data?.BasePrice ?? data?.Price);
  const discountedBase = toNumber(
    data?.DiscountedBasePrice ??
      data?.DiscountedPrice ??
      data?.DiscountedAmount ??
      data?.discountedBase ??
      basePrice
  );
  const baseDiscount = Math.max(0, basePrice - discountedBase);

  const couponAmount = toNumber(
    data?.CouponDiscountAmount ?? data?.coupon ?? data?.CouponAmount
  );
  const couponPercentApi = toNumber(
    data?.CouponDiscountPercentage ?? data?.CouponPercent ?? data?.couponPercent
  );
  const couponPercent =
    couponPercentApi ||
    (discountedBase > 0 ? (couponAmount / discountedBase) * 100 : 0);

  const walletAmount = toNumber(data?.WalletAmount ?? data?.wallet);

  const gstAmount = toNumber(
    data?.GstTaxationCharge ?? data?.GSTAmount ?? data?.gstAmount
  );

  const netPayableApi = toNumber(
    data?.NetPaybleAmount ??
      data?.NetPayableAmount ??
      data?.NetPaymentAmount ??
      data?.NetPay
  );

  const fallbackNetPayable = Math.max(
    0,
    discountedBase - couponAmount - walletAmount + gstAmount
  );
  const netPayable = netPayableApi || fallbackNetPayable;

  const gstBase = toNumber(
    data?.GstBaseAmount ?? (netPayable > 0 ? netPayable - gstAmount : 0)
  );
  const derivedGstBase = gstBase || Math.max(0, discountedBase - couponAmount);
  const gstPercent = derivedGstBase ? (gstAmount / derivedGstBase) * 100 : 0;

  const formatMoney = (v) => `₹${toNumber(v).toFixed(2)}`;
  const formatPct = (v) => `${v.toFixed(2)}%`;

  const handleOutsideClick = (e) => {
    if (e.target.id === "modal-overlay") onClose();
  };

  const handleProcessPayment = () => {
    if (!agree) return;

    initiatePayment(paymentPayload, {
      onSuccess: (response) => {
        const normalizedStatus = (
          response?.status ||
          response?.Status ||
          response?.paymentStatus ||
          ""
        )
          .toString()
          .toLowerCase();

        const normalizedMessage = (response?.message || response?.Message || "")
          .toString()
          .toLowerCase();

        const link =
          response?.paymentLink ||
          response?.PaymentLink ||
          response?.redirectUrl;

        // Open any returned payment link immediately (UPI/redirect flows)
        if (link) {
          window.open(link, "_blank");
        }

        const isSuccessful =
          response?.success === true ||
          response?.isSuccess === true ||
          response?.Success === true ||
          normalizedStatus === "success" ||
          normalizedStatus === "paid" ||
          normalizedStatus === "completed" ||
          normalizedMessage === "success";

        if (isSuccessful || link) {
          toast.success(
            response?.message ||
              response?.Message ||
              "Payment initiated successfully"
          );
          onProcessPayment(response);
        } else {
          toast.error(
            response?.message ||
              response?.Message ||
              "Failed to initiate payment"
          );
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
              Subscription Type / Days
            </span>
            <span>
              {planType !== "N/A"
                ? `${planType.charAt(0).toUpperCase()}${planType
                    .slice(1)
                    .toLowerCase()}`
                : "N/A"}
              {planDays ? ` • ${planDays} days` : ""}
            </span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Base Price
            </span>
            <span>{formatMoney(basePrice)}</span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Discounted Base Price
            </span>
            <span>{formatMoney(discountedBase)}</span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Discount (Base - Discounted)
            </span>
            <span className="text-green-600 dark:text-green-400">
              -{formatMoney(baseDiscount)}
            </span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Coupon Discount
            </span>
            <span className="text-green-600 dark:text-green-400">
              -{formatMoney(couponAmount)}
              {couponPercent ? ` (${formatPct(couponPercent)})` : ""}
            </span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              Wallet Transaction
            </span>
            <span className="text-green-600 dark:text-green-400">
              -{formatMoney(walletAmount)}
            </span>
          </div>
          <div className="flex justify-between text-[#2E3A59] dark:text-white">
            <span className="text-[#707070] dark:text-gray-400">
              GST {gstPercent ? `(${formatPct(gstPercent)})` : ""}
            </span>
            <span className="text-red-500 dark:text-red-400">
              +{formatMoney(gstAmount)}
            </span>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="flex justify-between font-medium text-base text-[#2E3A59] dark:text-white">
            <span>Net Payable</span>
            <span>{formatMoney(netPayable)}</span>
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
            <a
              href="https://algorooms.com/privacy-policy.html#refund"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline"
            >
              refund policy
            </a>
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
