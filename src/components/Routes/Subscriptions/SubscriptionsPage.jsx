import { useMemo, useState } from "react";
import FAQs from "./FAQs";
import BacktestCredits from "./BacktestCredits";
import PlanChangeConfirmationModal from "./PlanChangeConfirmationModal";
import PaymentDetailsModal from "./PaymentDetailsModal";
import PaymentSuccessModal from "./PaymentSuccessModal";
import PaymentFailureModal from "./PaymentFailureModal";
import {
  useBrokerPlans,
  usePaymentDetails,
} from "../../../hooks/subscriptionHooks";

const SubscriptionsPage = () => {
  const [mainTab, setMainTab] = useState("Plans");
  const [activeTab, setActiveTab] = useState("Quarterly");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [apiKey] = useState("abc");
  const [paymentPayload, setPaymentPayload] = useState(null);
  const { data: pricingData, isLoading } = useBrokerPlans(
    activeTab.toLowerCase(),
    apiKey
  );
  const [payload, setPayload] = useState(null);
  const { data: paymentData } = usePaymentDetails(payload);

  const handlePlanContinue = (plan) => {
    const payload = {
      Planid: plan.planId || plan.PlanId,
      PlanType: activeTab.toLowerCase(),
      SubscriptionType: mainTab === "Plans" ? "BROKER" : "BACKTEST",
      CouponCode: "",
      BrokerClientId: "",
    };

    setPayload(payload);
    setPaymentPayload(payload);
    setShowConfirm(false);
    setShowPayment(true);
  };

  const mappedPlans = useMemo(() => {
    if (!pricingData || !Array.isArray(pricingData)) return [];

    return pricingData.map((plan) => ({
      ...plan,
      title: `${plan.planName} Plan`,
      price: plan.Price,
      description:
        plan.Description || plan.PlanDescription || plan.planDescription || "",
      features: [
        `${plan.allowedBacktestCount} allowed backtest credits`,
        `${plan.maxStrategyCreation} strategy creation allowed`,
        `${plan.maxLiveDeployment} live + ${plan.maxPaperDeployment} forward deployments allowed`,
        `${plan.maxStrategyAllowedInPhortpholio} strategy portfolio allowed`,
        `${plan.allowedBrokes.join(", ")} brokers allowed`,
      ],
    }));
  }, [pricingData]);

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

  return (
    <div>
      <div className="md:p-6 text-[#2E3A59] dark:text-white space-y-6">
        <div className="text-xl md:text-2xl text-[#2E3A59] dark:text-white font-semibold">
          Subscriptions
        </div>

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
          <div>
            <div className="flex gap-3 mt-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium ${
                    activeTab === tab
                      ? "bg-[#1B44FE] text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-4">
              {isLoading ? (
                <div className="col-span-3 text-center">Loading Plans...</div>
              ) : (
                mappedPlans.map((plan, index) => (
                  <div
                    key={index}
                    className="border border-[#E6EDF4] dark:border-[#1E2027] bg-white dark:bg-[#15171C] rounded-2xl p-6 space-y-4"
                  >
                    <div className="text-lg font-semibold text-[#2E3A59] dark:text-white">
                      {plan.planName} Plan
                    </div>
                    <div className="text-3xl font-bold text-[#2E3A59] dark:text-white">
                      ₹{plan.Price}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                        (+ GST)
                      </span>
                    </div>
                    {plan.description ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.description}
                      </div>
                    ) : null}

                    {(() => {
                      const planName = plan.planName?.toLowerCase?.() || "";
                      const isFreePlan =
                        planName.includes("free") ||
                        Number(plan.Price) === 0 ||
                        plan.Price === "0";

                      if (isFreePlan) {
                        return (
                          <div className="w-full py-4 rounded-xl text-sm font-semibold border border-[#D5DAE1] dark:border-gray-700 text-[#16A34A] dark:text-green-400 text-center bg-[#F0FDF4] dark:bg-transparent">
                            Plan already active
                          </div>
                        );
                      }

                      return (
                        <button
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowConfirm(true);
                          }}
                          className={`w-full py-4 rounded-xl text-sm font-semibold ${
                            planName === "unlimited"
                              ? "bg-[#1B44FE] text-white"
                              : "border border-[#D5DAE1] dark:border-gray-700 text-[#2E3A59] dark:text-white"
                          }`}
                        >
                          Get Started
                        </button>
                      );
                    })()}

                    <div>
                      <div className="text-sm font-semibold mb-2 text-[#2E3A59] dark:text-white">
                        What's included:
                      </div>
                      <ul className="space-y-1 text-sm text-[#2E3A59] dark:text-white">
                        <li>
                          • {plan.allowedBacktestCount} allowed backtest credits
                        </li>
                        <li>
                          • {plan.maxStrategyCreation} strategy creation allowed
                        </li>
                        <li>
                          • {plan.maxLiveDeployment} live + forward deployments
                          allowed
                        </li>
                        <li>
                          • {plan.maxStrategyAllowedInPhortpholio} strategy
                          portfolio allowed
                        </li>
                        <li>
                          • Brokers allowed: {plan.allowedBrokes.join(", ")}
                        </li>
                      </ul>
                    </div>
                  </div>
                ))
              )}
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
          if (selectedPlan) {
            handlePlanContinue(selectedPlan);
          }
        }}
      />

      <PaymentDetailsModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        data={paymentData}
        paymentPayload={paymentPayload}
        onProcessPayment={(paymentResponse) => {
          setShowPayment(false);

          // Store payment response in localStorage
          if (paymentResponse) {
            localStorage.setItem(
              "paymentLink",
              paymentResponse.paymentLink || ""
            );
            localStorage.setItem("orderId", paymentResponse.orderId || "");
            localStorage.setItem("tokenType", paymentResponse.tokenType || "");
            localStorage.setItem("amount", paymentResponse.amount || "");
          }

          // Show success modal (payment link opened in new tab)
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
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
