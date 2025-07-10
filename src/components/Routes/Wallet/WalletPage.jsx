import { useState } from "react";
import {
  useWalletQuery,
  useWalletTransactions,
} from "../../../hooks/profileHooks";

const WalletPage = () => {
  const { data: walletInfo } = useWalletQuery();
  const { data: transactions } = useWalletTransactions();

  return (
    <div className="p-6 space-y-8 text-sm text-[#2E3A59] dark:text-white">
      <div className="text-xl font-semibold">My Wallet</div>

      <div className="bg-gradient-to-r from-[#4C49ED] to-[#0096FF] text-white p-6 rounded-2xl w-full md:w-1/3 space-y-3">
        <div className="text-sm">Wallet Amount</div>
        <div className="text-3xl font-bold">₹{walletInfo?.WalletBalance}</div>
        <div className="text-sm pt-2">Backtest Credit</div>
        <div className="text-lg font-medium">{walletInfo?.credit}</div>
      </div>

      <div className="text-xl font-semibold">Wallet Transactions</div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px] bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl">
          <div className="grid grid-cols-5 p-4 border-b border-[#EDF2F6] dark:border-[#1E2027] text-sm text-[#718EBF]">
            <div>Transferred Amount</div>
            <div>Status</div>
            <div>Remarks</div>
            <div>Subscription Type</div>
            <div>Date</div>
          </div>

          {transactions?.map((tx, index) => (
            <div
              key={index}
              className="grid grid-cols-5 p-4 border-b border-[#EDF2F6] dark:border-[#1E2027] text-sm"
            >
              <div className="space-y-1">
                <div className="text-[#718EBF]">#{tx?.TransactionRefId}</div>
                <div
                  className={
                    tx?.TransactionType === "CR"
                      ? "text-green-600 font-semibold"
                      : "text-red-500 font-semibold"
                  }
                >
                  ₹ {tx?.Amount}
                </div>
              </div>
              <div className="text-green-600 font-medium">{tx?.status}</div>
              <div>{tx?.Remarks ? tx?.Remarks : "N/A"}</div>
              <div>{tx?.SubscriptionType ? tx?.SubscriptionType : "N/A"}</div>
              <div>{new Date(tx?.TransactionDate).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
