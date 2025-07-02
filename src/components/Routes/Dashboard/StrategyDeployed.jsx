import { strategy1, strategy2, strategy3 } from "../../../assets";

const icons = [strategy1, strategy2, strategy3];

const StrategyDeployed = ({ strategies }) => (
  <div className="bg-white dark:bg-[#15171C] p-4 border border-[#DFEAF2] dark:border-[#1E2027] rounded-3xl h-full text-black dark:text-white">
    {strategies.map((s, i) => {
      const Icon = icons[i % icons.length];
      const isNegative = s.pnl.startsWith("-");
      const statusParts = s.status
        .split("•")
        .map((part) => part.trim())
        .filter(Boolean);

      return (
        <div
          key={i}
          className="flex justify-between items-start sm:items-center gap-4 text-sm mb-4"
        >
          <div className="flex items-start sm:items-center gap-3 w-full">
            <div className="rounded-full w-14 h-14 flex items-center justify-center shrink-0">
              <img
                className="w-12 h-12 object-contain"
                src={Icon}
                alt={s.name}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
              <div className="space-y-1">
                <p className="font-medium text-gray-800 dark:text-white">
                  {s.name}
                </p>
                <p className="text-xs flex flex-wrap items-center gap-1">
                  {statusParts.map((part, idx) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="text-gray-400 dark:text-gray-500">
                        •
                      </span>
                      <span
                        className={
                          part.toLowerCase() === "running"
                            ? "text-[#19A0FF]"
                            : "text-green-600"
                        }
                      >
                        {part}
                      </span>
                    </span>
                  ))}
                </p>
              </div>
              <p
                className={`font-bold text-base mt-2 sm:mt-0 sm:ml-6 ${
                  isNegative ? "text-red-500" : "text-green-500"
                }`}
              >
                {s.pnl}
              </p>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default StrategyDeployed;
