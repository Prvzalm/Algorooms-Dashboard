const options = [
  "TradingView Indicators",
  "TradingView Strategy (Pinescript)",
  "Chartink",
  "Multi Stocks from Chartink",
];

const SignalSelector = () => {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#15171C] border border-gray-200 dark:border-[#1E2027]">
      <p className="font-semibold mb-2 text-sm">Select Signal From</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Select your type
      </p>
      <div className="grid md:grid-cols-4 gap-3">
        {options.map((label, i) => (
          <label key={i} className="flex items-center space-x-2 text-sm">
            <input type="checkbox" className="accent-blue-600" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default SignalSelector;
