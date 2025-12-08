import { useNavigate } from "react-router-dom";
import { useMarketplaceStrategies } from "../../../hooks/dashboardHooks";
import { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import DuplicateStrategyModal from "../../DuplicateStrategyModal";
import { useDuplicateStrategy } from "../../../hooks/strategyHooks";
import MiniCumulativeChart from "../../Charts/MiniCumulativeChart";
import PrimaryButton from "../../common/PrimaryButton";

const StrategyTemplates = ({ pageSize = 3, showSeeAll = true }) => {
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState("Recent");
  const [filterMargins, setFilterMargins] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState("sort");
  const filterRef = useRef(null);
  const {
    data: templates,
    isLoading,
    isError,
  } = useMarketplaceStrategies({
    page,
    pageSize,
    orderBy,
    filterMargins,
  });

  // Ensure safe access when loading
  const items = Array.isArray(templates) ? templates : [];

  const navigate = useNavigate();

  const [dupOpen, setDupOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const { mutate: duplicateMutate, isLoading: duplicating } =
    useDuplicateStrategy();

  const openDuplicate = (strategy) => {
    setSelectedStrategy(strategy);
    setDupOpen(true);
  };

  const handleDuplicate = (newName) => {
    if (!selectedStrategy) return;
    duplicateMutate(
      {
        StrategyId: String(selectedStrategy.StrategyId || selectedStrategy.id),
        StrategyName: newName,
      },
      {
        onSuccess: () => {
          setDupOpen(false);
          setSelectedStrategy(null);
        },
      }
    );
  };

  // Close filters on outside click / escape
  useEffect(() => {
    if (!showFilters) return;
    function handle(e) {
      if (e.type === "keydown" && e.key === "Escape") {
        setShowFilters(false);
      }
      if (e.type === "mousedown") {
        if (filterRef.current && !filterRef.current.contains(e.target)) {
          setShowFilters(false);
        }
      }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [showFilters]);

  if (isError) return <div>Failed to load strategies.</div>;

  return (
    <div className="text-black dark:text-white">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xl md:text-2xl text-[#343C6A] dark:text-white">
            Strategy Templates
          </h3>
          <div
            className="flex items-center gap-3 flex-wrap justify-end relative"
            ref={filterRef}
          >
            <div className="relative">
              {!showSeeAll && (
                <button
                  onClick={() => setShowFilters((o) => !o)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E2027] text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#262a31]"
                >
                  Filters
                  {(orderBy !== "Recent" || filterMargins) && (
                    <span className="ml-1 inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {orderBy !== "Recent" && <span>{orderBy}</span>}
                      {filterMargins && <span>{filterMargins}</span>}
                    </span>
                  )}
                </button>
              )}
              {showFilters && (
                <div className="absolute right-0 mt-2 z-50 w-[420px] max-w-[90vw] bg-white dark:bg-[#1F1F24] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden flex text-sm animate-fadeIn">
                  {/* Categories */}
                  <div className="w-32 bg-gray-50 dark:bg-[#24262C] border-r border-gray-200 dark:border-gray-700 flex flex-col py-2">
                    <button
                      onClick={() => setActiveFilterCategory("sort")}
                      className={`text-left px-4 py-2 rounded-r-lg transition text-xs font-medium ${
                        activeFilterCategory === "sort"
                          ? "bg-white dark:bg-[#1F1F24] text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-[#2a2d33]"
                      }`}
                    >
                      Sort By
                    </button>
                    <button
                      onClick={() => setActiveFilterCategory("margin")}
                      className={`text-left px-4 py-2 rounded-r-lg transition text-xs font-medium ${
                        activeFilterCategory === "margin"
                          ? "bg-white dark:bg-[#1F1F24] text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-[#2a2d33]"
                      }`}
                    >
                      Margin
                    </button>
                    <div className="mt-auto pt-2 px-2">
                      <button
                        onClick={() => {
                          setOrderBy("Recent");
                          setFilterMargins("");
                          setPage(1);
                          setShowFilters(false);
                        }}
                        className="w-full text-[10px] tracking-wide uppercase px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  {/* Options */}
                  <div className="flex-1 p-3 grid grid-cols-2 gap-2 content-start max-h-72 overflow-y-auto">
                    {activeFilterCategory === "sort" &&
                      [
                        { label: "Recent", value: "Recent" },
                        { label: "Subscriptions", value: "MaxSubscriptions" },
                        { label: "Margin", value: "Margin" },
                      ].map((opt) => {
                        const active = orderBy === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setOrderBy(opt.value);
                              setPage(1);
                              if (opt.value === "Margin") {
                                setActiveFilterCategory("margin");
                              } else {
                                setShowFilters(false);
                              }
                            }}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition ${
                              active
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300"
                                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    {activeFilterCategory === "margin" &&
                      [
                        { label: "All", value: "" },
                        { label: "Under 100000", value: "0-100000" },
                        { label: "100001-500000", value: "100001-500000" },
                        { label: "500001-1000000", value: "500001-1000000" },
                        { label: "Above 1000000", value: "1000001-10000000" },
                      ].map((opt) => {
                        const active = filterMargins === opt.value;
                        return (
                          <button
                            key={opt.value || "all"}
                            onClick={() => {
                              setFilterMargins(opt.value);
                              setPage(1);
                              setShowFilters(false);
                            }}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition text-left ${
                              active
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300"
                                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-400"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
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
                disabled={items.length < pageSize || isLoading}
                className={`px-3 py-2 flex items-center gap-1 transition ${
                  items.length < pageSize || isLoading
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
                onClick={() =>
                  navigate("/strategies", {
                    state: { activeTab: "Strategy Templates" },
                  })
                }
                className="text-[#343C6A] dark:text-blue-400 text-lg hover:underline"
              >
                See All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: pageSize }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="border border-[#DFEAF2] dark:border-[#1E2027] bg-white dark:bg-[#131419] p-4 rounded-3xl text-sm flex flex-col justify-between animate-pulse"
              >
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                  <div className="flex justify-between items-center text-xs gap-x-6">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  </div>

                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="w-full h-[140px] bg-gray-100 dark:bg-[#1E2027] rounded" />
                    <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 w-1/2 h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
              </div>
            ))
          : items.map((item, idx) => (
              <div
                key={idx}
                className="border border-[#DFEAF2] dark:border-[#1E2027] bg-white dark:bg-[#131419] p-4 rounded-3xl text-sm flex flex-col justify-between"
              >
                <div>
                  <p className="font-semibold mb-2">{item.StrategyName}</p>
                  {/* <div className="flex text-xs gap-x-6">
                    <p>
                      Margin:{" "}
                      <span className="text-green-500">
                        ₹{item.MinimumCapital ?? "N/A"}
                      </span>
                    </p>
                  </div> */}

                  {/* <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <MiniCumulativeChart
                      data={
                        item?.BackTestResultData?.StrategyScriptList?.[0]
                          ?.DataPointList || []
                      }
                      height={140}
                      className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-gray-400">
                      <span>Cumulative PnL</span>
                      <span
                        className={`${
                          item?.BackTestResultData?.TotalPNL >= 0
                            ? "text-green-600"
                            : "text-red-500"
                        } font-medium`}
                      >
                        {Math.round(
                          item?.BackTestResultData?.TotalPNL || 0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div> */}
                </div>

                <PrimaryButton
                  className="mt-4 w-1/2 mx-auto py-2 text-sm"
                  onClick={() => openDuplicate(item)}
                >
                  Add to my strategy
                </PrimaryButton>
              </div>
            ))}
      </div>
      <DuplicateStrategyModal
        open={dupOpen}
        originalName={
          selectedStrategy?.StrategyName || selectedStrategy?.Name || "Strategy"
        }
        onCancel={() => {
          if (duplicating) return; // prevent closing during request
          setDupOpen(false);
          setSelectedStrategy(null);
        }}
        onSubmit={handleDuplicate}
        loading={duplicating}
      />
    </div>
  );
};

export default StrategyTemplates;
