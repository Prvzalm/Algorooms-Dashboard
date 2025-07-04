const backtestPlans = [
  {
    title: "Basic",
    price: 499,
    description:
      "Best for small business owners, startups who need landing page for their business.",
    features: [
      "Unlimited Backtest for 7 days",
      "Unlimited Portfolio Backtest for 7 days",
    ],
  },
  {
    title: "Pro",
    price: 1499,
    description:
      "Best for medium business owners, startups who need landing page for their business.",
    features: [
      "Unlimited Backtest for 30 days",
      "Unlimited Portfolio Backtest for 30 days",
    ],
  },
  {
    title: "Pro+",
    price: 2499,
    description:
      "Best for large companies, business owners who need landing page for their business.",
    features: [
      "Unlimited Backtest for 90 days",
      "Unlimited Portfolio Backtest for 90 days",
    ],
  },
];

const BacktestCredits = ({ onBuyCredit }) => {
  return (
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      {backtestPlans.map((plan, index) => (
        <div
          key={index}
          className="border border-[#E6EDF4] dark:border-[#1E2027] bg-white dark:bg-[#15171C] rounded-2xl p-6 space-y-4"
        >
          <div className="text-lg font-semibold">{plan.title}</div>
          <div className="text-3xl font-bold">
            ₹{plan.price.toLocaleString("en-IN")}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {plan.description}
          </div>

          <button
            onClick={() => onBuyCredit(plan)}
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
