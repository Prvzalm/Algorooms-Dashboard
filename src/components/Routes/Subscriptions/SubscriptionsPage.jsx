import { useEffect, useMemo, useState } from "react";
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
  const { data: pricingData, isLoading } = useBrokerPlans(
    activeTab.toLowerCase(),
    apiKey
  );
  const {
    mutate: fetchPaymentDetails,
    data: paymentData,
    isPending,
  } = usePaymentDetails();

  const handlePlanContinue = (plan) => {
    const planId = plan.planId || plan.PlanId;
    const planType = activeTab.toLowerCase();
    const subscriptionType = mainTab === "Plans" ? "BROKER" : "BACKTEST";

    fetchPaymentDetails({
      Planid: planId,
      PlanType: planType,
      CouponCode: "",
      SubscriptionType: subscriptionType,
      BrokerClientId: "",
    });

    setShowConfirm(false);
    setShowPayment(true);
  };

  const mappedPlans = useMemo(() => {
    if (!pricingData || !Array.isArray(pricingData)) return [];

    return pricingData.map((plan) => ({
      ...plan,
      title: `${plan.planName} Plan`,
      price: plan.Price,
      description: "Auto-fetched from API",
      features: [
        `${plan.allowedBacktestCount} allowed backtest credits`,
        `${plan.maxStrategyCreation} strategy creation allowed`,
        `${plan.maxLiveDeployment} live deployment allowed`,
        `${plan.maxPaperDeployment} forward deployment allowed`,
        `${plan.maxStrategyAllowedInPhortpholio} strategy portfolio allowed`,
        plan.isHNIMarketPlaceAccess
          ? "Retail + HNI strategies allowed"
          : "Retail strategies allowed",
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
          <div>
            <div className="flex gap-6 border-[#E6EDF4] dark:border-[#1E2027] text-sm font-medium">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-4 py-2 rounded-lg ${
                    activeTab === tab
                      ? "text-[#0096FF] bg-blue-100 border border-[#0096FF]"
                      : "text-gray-500 bg-blue-50 border dark:text-gray-400"
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
                    <div className="text-lg font-semibold">
                      {plan.planName} Plan
                    </div>
                    <div className="text-3xl font-bold">₹{plan.Price}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {plan.description}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowConfirm(true);
                      }}
                      className={`w-full py-4 rounded-xl text-sm font-semibold ${
                        plan.planName.toLowerCase() === "unlimited"
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
                        <li>
                          • {plan.allowedBacktestCount} allowed backtest credits
                        </li>
                        <li>
                          • {plan.maxStrategyCreation} strategy creation allowed
                        </li>
                        <li>
                          • {plan.maxLiveDeployment} live deployment allowed
                        </li>
                        <li>
                          • {plan.maxPaperDeployment} forward deployment allowed
                        </li>
                        <li>
                          • {plan.maxStrategyAllowedInPhortpholio} strategy
                          portfolio allowed
                        </li>
                        <li>
                          •{" "}
                          {plan.isHNIMarketPlaceAccess
                            ? "Retail + HNI"
                            : "Retail only"}{" "}
                          strategies allowed
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
