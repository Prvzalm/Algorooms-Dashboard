import { useBacktestPlans } from "../../../hooks/subscriptionHooks";

const BacktestCredits = ({ onBuyCredit }) => {
  const apiKey = "abc";
  const { data: plans = [], isLoading, isError } = useBacktestPlans(apiKey);

  const mappedPlans = plans.map((plan) => ({
    title: plan.PlanName,
    price: plan.Price,
    description: `Unlimited backtesting access for ${plan.Validity} days.`,
    features: [
      `Unlimited Backtest for ${plan.Validity} days`,
      `Unlimited Portfolio Backtest for ${plan.Validity} days`,
      `Credit Worth: ${plan.CreditWorth}`,
    ],
    raw: plan,
  }));

  if (isLoading) {
    return <div className="text-center col-span-3">Loading plans...</div>;
  }

  if (isError || mappedPlans.length === 0) {
    return (
      <div className="text-center col-span-3 text-red-500">
        Failed to load plans.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      {mappedPlans.map((plan, index) => (
        <div
          key={index}
          className="border border-[#E6EDF4] dark:border-[#1E2027] bg-white dark:bg-[#15171C] rounded-2xl p-6 space-y-4"
        >
          <div className="text-lg font-semibold">{plan.title}</div>
          <div className="text-3xl font-bold">
            ₹{plan.price}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              (+ GST)
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {plan.description}
          </div>

          <button
            onClick={() => onBuyCredit(plan.raw)}
            className={`w-full py-4 rounded-xl text-sm font-semibold ${
              plan.title === "Pro"
                ? "bg-[#0096FF] text-white"
                : "border border-[#D5DAE1] dark:border-gray-700"
            }`}
          >
            Buy Credits
          </button>

          <div>
            <div className="text-sm font-semibold mb-2">What’s included:</div>
            <ul className="space-y-1 text-sm text-[#2E3A59] dark:text-white">
              {plan.features.map((feature, i) => (
                <li key={i}>• {feature}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BacktestCredits;
