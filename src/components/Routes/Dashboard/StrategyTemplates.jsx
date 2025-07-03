import { useNavigate } from "react-router-dom";

const StrategyTemplates = ({ templates }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-darkbg rounded-xl text-black dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Strategy Templates</h3>
        <button
          onClick={() => navigate("/strategies")}
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
        >
          See All
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((item, idx) => (
          <div
            key={idx}
            className="border border-[#DFEAF2] dark:border-[#1E2027] bg-white dark:bg-[#15171C] p-4 rounded-3xl text-sm flex flex-col justify-between"
          >
            <div>
              <p className="font-semibold mb-2">{item.title}</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                {item.desc}
              </p>
              <div className="flex text-xs gap-x-6">
                <p>
                  Max DD: <span className="text-red-400">{item.maxDD}</span>
                </p>
                <p>
                  Margin: <span className="text-green-500">{item.margin}</span>
                </p>
              </div>
            </div>

            <button className="mt-4 w-1/2 bg-[#0096FF] hover:bg-blue-600 text-white font-semibold py-2 rounded-md text-sm transition">
              Add to my strategy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategyTemplates;
