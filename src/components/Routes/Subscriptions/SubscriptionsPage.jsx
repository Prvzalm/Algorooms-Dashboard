import { useState } from "react";
import FAQs from "./FAQs";
import BacktestCredits from "./BacktestCredits";
import PlanChangeConfirmationModal from "./PlanChangeConfirmationModal";
import PaymentDetailsModal from "./PaymentDetailsModal";
import PaymentSuccessModal from "./PaymentSuccessModal";
import PaymentFailureModal from "./PaymentFailureModal";

const SubscriptionsPage = () => {
  const [mainTab, setMainTab] = useState("Plans");
  const [activeTab, setActiveTab] = useState("Quarterly");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);

  const tabs = ["Monthly", "Quarterly", "Yearly"];
  const mainTabs = ["Plans", "Backtest Credits"];

  const paymentInfo = {
    planName: "Unlimited",
    type: "Quarterly",
    basePrice: 7497,
    wallet: 2375,
    discount: 1124,
    coupon: 0,
    tax: 719,
    netPayable: 4718,
  };

  const plans = {
    Monthly: [
      {
        title: "Free Plan",
        price: 0,
        description:
          "Best for small business owners, startups who need landing page for their business.",
        features: [
          "50 allowed backtest credits",
          "5 strategy creation allowed",
          "All brokers allowed",
          "Retail strategies allowed",
        ],
      },
      {
        title: "Unlimited Plan",
        price: 29,
        description:
          "Best for medium business owners, startups who need landing page for their business.",
        features: [
          "500 allowed backtest credits",
          "5 strategy creation allowed",
          "5 live deployment allowed",
          "5 forward deployment allowed",
          "All brokers allowed",
          "5 strategy portfolio allowed",
          "Retail + HNI strategies allowed",
        ],
      },
      {
        title: "Limited Plan",
        price: 15,
        description:
          "Best for large companies, business owners who need landing page for their business.",
        features: [
          "250 allowed backtest credits",
          "10 strategy creation allowed",
          "3 live deployment allowed",
          "3 forward deployment allowed",
          "All brokers allowed",
          "2 strategy portfolio allowed",
          "Retail + HNI strategies allowed",
        ],
      },
    ],
    Quarterly: [
      {
        title: "Free Plan",
        price: 0,
        description:
          "Best for small business owners, startups who need landing page for their business.",
        features: [
          "50 allowed backtest credits",
          "5 strategy creation allowed",
          "All brokers allowed",
          "Retail strategies allowed",
        ],
      },
      {
        title: "Unlimited Plan",
        price: 69,
        description:
          "Best for medium business owners, startups who need landing page for their business.",
        features: [
          "1500 allowed backtest credits",
          "5 strategy creation allowed",
          "20 live deployment allowed",
          "20 forward deployment allowed",
          "All brokers allowed",
          "10 strategy portfolio allowed",
          "Retail + HNI strategies allowed",
        ],
      },
      {
        title: "Limited Plan",
        price: 41,
        description:
          "Best for large companies, business owners who need landing page for their business.",
        features: [
          "500 allowed backtest credits",
          "25 strategy creation allowed",
          "5 live deployment allowed",
          "5 forward deployment allowed",
          "All brokers allowed",
          "2 strategy portfolio allowed",
          "Retail + HNI strategies allowed",
        ],
      },
    ],
    Yearly: [
      {
        title: "Free Plan",
        price: 0,
        description:
          "Best for small business owners, startups who need landing page for their business.",
        features: [
          "50 allowed backtest credits",
          "5 strategy creation allowed",
          "All brokers allowed",
          "Retail strategies allowed",
        ],
      },
      {
        title: "Unlimited Plan",
        price: 199,
        description:
          "Best for medium business owners, startups who need landing page for their business.",
        features: [
          "6000 allowed backtest credits",
          "5 strategy creation allowed",
          "50 live deployment allowed",
          "50 forward deployment allowed",
          "All brokers allowed",
          "25 strategy portfolio allowed",
          "Retail + HNI strategies allowed",
        ],
      },
      {
        title: "Limited Plan",
        price: 129,
        description:
          "Best for large companies, business owners who need landing page for their business.",
        features: [
          "2000 allowed backtest credits",
          "30 strategy creation allowed",
          "10 live deployment allowed",
          "10 forward deployment allowed",
          "All brokers allowed",
          "5 strategy portfolio allowed",
          "Retail + HNI strategies allowed",
        ],
      },
    ],
  };

  return (
    <div>
      <div className="md:p-6 text-[#2E3A59] dark:text-white space-y-6">
        <div className="text-xl font-semibold">My Subscription</div>

        <div className="flex gap-6 border-b border-[#E6EDF4] dark:border-[#1E2027] text-sm font-medium">
          {mainTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`pb-2 px-4 ${
                mainTab === tab
                  ? "text-[#0096FF] border-b-2 border-[#0096FF]"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {mainTab === "Plans" ? (
          <div className="bg-white dark:bg-[#15171C]">
            <div className="flex gap-6 border-[#E6EDF4] dark:border-[#1E2027] text-sm font-medium">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-4 py-2 rounded-lg ${
                    activeTab === tab
                      ? "text-[#0096FF] bg-blue-100 border border-[#0096FF]"
                      : "text-gray-500 bg-gray-50 border dark:text-gray-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-4">
              {plans[activeTab]?.map((plan, index) => (
                <div
                  key={index}
                  className="border border-[#E6EDF4] dark:border-[#1E2027] bg-white dark:bg-[#15171C] rounded-2xl p-6 space-y-4"
                >
                  <div className="text-lg font-semibold">{plan.title}</div>
                  <div className="text-3xl font-bold">₹{plan.price}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </div>

                  <button
                    onClick={() => setShowConfirm(true)}
                    className={`w-full py-4 rounded-xl text-sm font-semibold ${
                      plan.price === 69
                        ? "bg-[#0096FF] text-white"
                        : "border border-[#D5DAE1] dark:border-gray-700"
                    }`}
                  >
                    Get Started
                  </button>
                  <div>
                    <div className="text-sm font-semibold mb-2">
                      What’s included:
                    </div>
                    <ul className="space-y-1 text-sm text-[#2E3A59] dark:text-white">
                      {plan.features.map((feature, i) => (
                        <li key={i}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <BacktestCredits
            onBuyCredit={(plan) => {
              setSelectedPlan(plan);
              setShowConfirm(true);
            }}
          />
        )}
        <FAQs />
      </div>
      <PlanChangeConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onContinue={() => {
          setShowConfirm(false);
          setShowPayment(true);
        }}
      />

      <PaymentDetailsModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        data={paymentInfo}
        onProcessPayment={() => {
          setShowPayment(false);

          const isSuccess = true;

          if (isSuccess) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } else {
            setShowFailure(true);
          }
        }}
      />
      <PaymentSuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        data={{
          amount: paymentInfo?.netPayable,
          ref: "000085752257",
          time: new Date().toLocaleString(),
          method: "UPI",
          sender: "Jasnek Singh",
        }}
      />

      <PaymentFailureModal
        isOpen={showFailure}
        onClose={() => setShowFailure(false)}
        data={{
          amount: paymentInfo?.netPayable,
          time: new Date().toLocaleString(),
          method: "UPI",
          sender: "Jasnek Singh",
        }}
        onRetry={() => {
          setShowFailure(false);
          setShowPayment(true);
        }}
      />
    </div>
  );
};

export default SubscriptionsPage;
