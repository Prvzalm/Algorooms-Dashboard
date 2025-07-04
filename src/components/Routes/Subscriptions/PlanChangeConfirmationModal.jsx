import React, { useEffect } from "react";
import { confirmPaymentIcon } from "../../../assets";

const PlanChangeConfirmationModal = ({ isOpen, onClose, onContinue }) => {
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
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg">
        <div className="mb-4 text-lg font-semibold flex items-center gap-2">
          <img src={confirmPaymentIcon} alt="" />
          Are you sure you want to change plan?
        </div>
        <hr />
        <p className="text-sm text-gray-600 my-6">
          If you change plan type then your existing plan will be deleted, and
          changed to the new plan. No refund will be entertained in this case.
        </p>
        <button
          onClick={onContinue}
          className="w-full py-3 bg-[#0096FF] text-white text-sm font-semibold rounded-xl"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default PlanChangeConfirmationModal;
