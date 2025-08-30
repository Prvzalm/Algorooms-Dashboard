import { useNavigate } from "react-router-dom";
import { useMarketplaceStrategies } from "../../../hooks/dashboardHooks";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const StrategyTemplates = ({ pageSize = 3, showSeeAll = true }) => {
  const [page, setPage] = useState(1);
  const {
    data: templates,
    isLoading,
    isError,
  } = useMarketplaceStrategies({
    page,
    pageSize,
  });

  const navigate = useNavigate();

  if (isLoading) return <div>Loading strategies...</div>;
  if (isError) return <div>Failed to load strategies.</div>;

  return (
    <div className="bg-white dark:bg-darkbg rounded-xl text-black dark:text-white">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Strategy Templates</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#F5F8FA] dark:bg-[#1E2027] rounded-full overflow-hidden text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className={`px-3 py-2 flex items-center gap-1 transition ${
                  page === 1 || isLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white dark:hover:bg-[#2A2D33]"
                }`}
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              <span className="px-3 py-2 font-medium select-none">{page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={templates.length < pageSize || isLoading}
                className={`px-3 py-2 flex items-center gap-1 transition ${
                  templates.length < pageSize || isLoading
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white dark:hover:bg-[#2A2D33]"
                }`}
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
            {showSeeAll && (
              <button
                onClick={() => navigate("/strategies")}
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                See All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((item, idx) => (
          <div
            key={idx}
            className="border border-[#DFEAF2] dark:border-[#1E2027] bg-white dark:bg-[#15171C] p-4 rounded-3xl text-sm flex flex-col justify-between"
          >
            <div>
              <p className="font-semibold mb-2">{item.StrategyName}</p>

              <p className="text-gray-600 dark:text-gray-400 text-xs mb-3">
                Lorem ipsum dolor sit amet consectetur. Aliquam neque sed diam
                mi ornare senectus orci.
              </p>

              <div className="flex text-xs gap-x-6">
                <p>
                  Max DD:{" "}
                  <span className="text-red-400">{item.MaxDD ?? "N/A"}</span>
                </p>
                <p>
                  Margin:{" "}
                  <span className="text-green-500">
                    ₹{item.MinimumCapital ?? "N/A"}
                  </span>
                </p>
              </div>
            </div>

            <button className="mt-4 w-1/2 bg-[#0096FF] hover:bg-blue-600 text-white font-semibold py-3 rounded-md text-sm transition">
              Add to my strategy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategyTemplates;
