import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useUserStrategies,
  useDuplicateStrategy,
  useDeleteStrategy,
} from "../../../hooks/strategyHooks";
import { emptyStrategy, shrinkLogo } from "../../../assets";
// import CreateStrategyPopup from "./CreateStrategyPopup";
import DuplicateStrategyModal from "../../DuplicateStrategyModal";
import ConfirmModal from "../../ConfirmModal";
import {
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiSearch,
} from "react-icons/fi";
import { SiTradingview } from "react-icons/si";
import StrategyCardSkeleton from "./StrategyCardSkeleton";
import DeployStrategyModal from "./DeployStrategyModal";
import TradingViewWalkthroughModal from "../../TradingViewWalkthroughModal";
import { useAuth } from "../../../context/AuthContext";
import { useBulkTradingViewSettings } from "../../../hooks/tradingViewHooks";
import PrimaryButton from "../../common/PrimaryButton";

const subTabs = ["Strategies", "Tradingview Signals Trading"];

const MyStrategiesList = ({ activeSubTab, setActiveSubTab }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // pagination state for "Strategies" sub tab
  const pageSize = 10;
  const [strategyPage, setStrategyPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [tradingViewModal, setTradingViewModal] = useState({
    open: false,
    strategyId: null,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setStrategyPage(1);
  }, [activeSubTab, debouncedSearchQuery]);

  const {
    data: userStrategies = [],
    isLoading: strategiesLoading,
    isError: strategiesError,
  } = useUserStrategies({
    page: strategyPage,
    pageSize,
    strategyType: "created", // Always fetch created strategies
    queryText: debouncedSearchQuery,
    orderBy: "Date",
  });

  // Get all strategy IDs
  const strategyIds = userStrategies.map((s) => s.StrategyId);

  // Fetch TradingView settings for all strategies using TanStack Query
  const {
    data: tvSettingsData,
    isLoading: loadingTvSettings,
    refetch: refetchTvSettings,
  } = useBulkTradingViewSettings(strategyIds);

  const tvEnabledStrategies = tvSettingsData?.enabledStrategies || new Set();

  // Filter strategies based on active sub tab
  const filteredStrategies = userStrategies.filter((strategy) => {
    if (activeSubTab === "Strategies") {
      // Show strategies where TradingView is NOT enabled
      return !tvEnabledStrategies.has(strategy.StrategyId);
    } else {
      // Show strategies where TradingView IS enabled
      return tvEnabledStrategies.has(strategy.StrategyId);
    }
  });

  // const [showStrategyPopup, setShowStrategyPopup] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
  // Refs to detect outside clicks when the action menu is open
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Close the action menu on outside click or Escape
  useEffect(() => {
    const handlePointerDown = (e) => {
      if (!actionMenuOpenId) return;
      const menuEl = menuRef.current;
      const btnEl = menuButtonRef.current;
      if (menuEl && menuEl.contains(e.target)) return;
      if (btnEl && btnEl.contains(e.target)) return;
      setActionMenuOpenId(null);
    };

    const handleKeyDown = (e) => {
      if (!actionMenuOpenId) return;
      if (e.key === "Escape") setActionMenuOpenId(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionMenuOpenId]);
  const [dupModalOpen, setDupModalOpen] = useState(false);
  const [dupTarget, setDupTarget] = useState(null);
  const { mutate: mutateDuplicate, isPending: duplicating } =
    useDuplicateStrategy();
  const { mutate: mutateDelete, isPending: deleting } = useDeleteStrategy();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deployTarget, setDeployTarget] = useState(null);

  if (strategiesError) return <div>Failed to load strategies.</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search strategies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E4EAF0] dark:border-[#2D2F36] rounded-lg bg-white dark:bg-[#1F1F24] text-[#2E3A59] dark:text-white placeholder-[#718EBF] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B44FE] focus:border-transparent"
          />
        </div>
        <div className="flex space-x-3">
          {subTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeSubTab === tab
                  ? "bg-[#1B44FE] text-white border border-transparent"
                  : "bg-gray-100 dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white border border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {strategiesLoading || loadingTvSettings ? (
        <StrategyCardSkeleton count={6} />
      ) : (
        <>
          {filteredStrategies.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-[#718EBF] dark:text-gray-400">
                Showing {filteredStrategies.length} strategies (Page{" "}
                {strategyPage})
              </span>
              <div className="flex items-center bg-[#F5F8FA] dark:bg-[#2D2F36] rounded-full overflow-hidden text-sm">
                <button
                  onClick={() => setStrategyPage((p) => Math.max(1, p - 1))}
                  disabled={strategyPage === 1 || strategiesLoading}
                  className={`px-3 py-2 flex items-center ${
                    strategyPage === 1 || strategiesLoading
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-white dark:hover:bg-[#3A3D44]"
                  }`}
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>
                <span className="px-4 py-2 font-medium select-none">
                  {strategyPage}
                </span>
                <button
                  onClick={() => setStrategyPage((p) => p + 1)}
                  disabled={
                    userStrategies.length < pageSize || strategiesLoading
                  }
                  className={`px-3 py-2 flex items-center ${
                    userStrategies.length < pageSize || strategiesLoading
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-white dark:hover:bg-[#3A3D44]"
                  }`}
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}

          {filteredStrategies.length === 0 ? (
            <div className="flex h-[50vh] flex-col items-center justify-center">
              <img src={emptyStrategy} alt="Empty" className="mb-6" />
              {activeSubTab === "Strategies" ? (
                <>
                  <PrimaryButton
                    className="px-6 py-2 rounded-lg text-sm font-medium"
                    onClick={() => navigate("/trading/strategy-builder")}
                  >
                    + Create Strategy
                  </PrimaryButton>

                  {/**
                   * Legacy behavior:
                   *
                   * <PrimaryButton onClick={() => setShowStrategyPopup(true)}>
                   *   + Create Strategy
                   * </PrimaryButton>
                   * {showStrategyPopup && (
                   *   <CreateStrategyPopup onClose={() => setShowStrategyPopup(false)} />
                   * )}
                   */}
                </>
              ) : (
                <p className="text-sm text-[#718EBF] dark:text-gray-400">
                  No TradingView signals configured yet
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStrategies.map((strategy) => (
                  <div
                    key={strategy.StrategyId}
                    className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-5 relative flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-2 relative">
                      <div>
                        <h3 className="text-base font-semibold text-[#2E3A59] dark:text-white">
                          {strategy.StrategyName}
                        </h3>
                        <p className="text-xs text-[#718EBF] dark:text-gray-400 mt-0.5">
                          By {strategy.CreatedBy}
                        </p>
                      </div>
                      <button
                        className="text-gray-400 dark:text-gray-500 text-xl px-2 py-1 hover:text-[#1B44FE]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOpenId((prev) =>
                            prev === strategy.StrategyId
                              ? null
                              : strategy.StrategyId
                          );
                        }}
                        ref={
                          actionMenuOpenId === strategy.StrategyId
                            ? menuButtonRef
                            : null
                        }
                      >
                        ⋮
                      </button>
                      {actionMenuOpenId === strategy.StrategyId && (
                        <div
                          className="absolute right-0 top-7 z-30 w-40 rounded-lg border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] shadow-lg text-xs py-2"
                          ref={menuRef}
                        >
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36]"
                            onClick={() => {
                              navigate(
                                `/trading/strategy-builder/${strategy.StrategyId}`
                              );
                              setActionMenuOpenId(null);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36]"
                            onClick={() => {
                              setDupTarget(strategy);
                              setDupModalOpen(true);
                              setActionMenuOpenId(null);
                            }}
                          >
                            Duplicate
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            onClick={() => {
                              setConfirmDeleteId(strategy.StrategyId);
                              setActionMenuOpenId(null);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 text-xs text-[#718EBF] dark:text-gray-400 mt-3">
                      <div>
                        <p className="mb-1">{strategy.TradeStartTime || "-"}</p>
                        <p className="font-medium">Start Time</p>
                      </div>
                      <div>
                        <p className="mb-1">{strategy.TradeStopTime || "-"}</p>
                        <p className="font-medium">End Time</p>
                      </div>
                      <div>
                        <p className="mb-1">
                          {strategy.StrategySegmentType || "-"}
                        </p>
                        <p className="font-medium">Segment Type</p>
                      </div>
                      <div>
                        <p className="mb-1">
                          {strategy.StrategyExecutionType || "-"}
                        </p>
                        <p className="font-medium">Strategy Type</p>
                      </div>
                    </div>

                    <div className="mt-4 max-h-[120px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      {strategy.ScriptDetails &&
                      strategy.ScriptDetails.length > 0 ? (
                        strategy.ScriptDetails.map((script, index) => (
                          <div
                            key={index}
                            className="w-full bg-[#F5F8FA] dark:bg-[#2D2F36] text-[#718EBF] dark:text-gray-300 text-xs font-medium py-2.5 px-3 rounded-md flex items-center justify-between flex-shrink-0"
                          >
                            <span
                              className="flex-1 truncate pr-2"
                              title={script.ScriptName || "-"}
                            >
                              {script.ScriptName || "-"}
                            </span>
                            <span className="text-[10px] opacity-70 whitespace-nowrap flex-shrink-0">
                              Qty: {script.ScriptQuantity || 0}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="w-full bg-[#F5F8FA] dark:bg-[#2D2F36] text-[#718EBF] dark:text-gray-300 text-xs font-medium py-3 px-4 rounded-md text-center">
                          No scripts available
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-2">
                      <button
                        className="flex-1 py-3 rounded-md border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] text-[#2E3A59] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2D2F36] transition"
                        onClick={() =>
                          navigate(
                            `/backtesting/strategybacktest/${strategy.StrategyId}`
                          )
                        }
                      >
                        Backtest
                      </button>
                      <PrimaryButton
                        className="flex-1 py-3 rounded-md text-sm font-medium"
                        onClick={() => setDeployTarget(strategy)}
                      >
                        Deploy
                      </PrimaryButton>
                      {strategy.StrategyExecutionType === "Indicator Based" && (
                        <button
                          className="sm:w-auto w-full py-3 px-3 rounded-md border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] text-[#2E3A59] dark:text-white hover:bg-gray-50 dark:hover:bg-[#2D2F36] transition flex items-center justify-center gap-2"
                          onClick={() =>
                            setTradingViewModal({
                              open: true,
                              strategyId: strategy.StrategyId,
                            })
                          }
                          title="Configure TradingView Signals"
                        >
                          <SiTradingview className="w-5 h-5" />
                          {activeSubTab === "Tradingview Signals Trading" && (
                            <>
                              <FiArrowRight className="w-4 h-4 text-[#718EBF] dark:text-gray-400" />
                              <img
                                src={shrinkLogo}
                                alt="AlgoRooms"
                                className="w-4 h-4"
                              />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-6">
                <span className="text-xs text-[#718EBF] dark:text-gray-400">
                  Showing {filteredStrategies.length} strategies (Page{" "}
                  {strategyPage})
                </span>
                <div className="flex items-center bg-[#F5F8FA] dark:bg-[#2D2F36] rounded-full overflow-hidden text-sm">
                  <button
                    onClick={() => setStrategyPage((p) => Math.max(1, p - 1))}
                    disabled={strategyPage === 1 || strategiesLoading}
                    className={`px-3 py-2 flex items-center ${
                      strategyPage === 1 || strategiesLoading
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-white dark:hover:bg-[#3A3D44]"
                    }`}
                    aria-label="Previous page"
                  >
                    <FiChevronLeft />
                  </button>
                  <span className="px-4 py-2 font-medium select-none">
                    {strategyPage}
                  </span>
                  <button
                    onClick={() => setStrategyPage((p) => p + 1)}
                    disabled={
                      userStrategies.length < pageSize || strategiesLoading
                    }
                    className={`px-3 py-2 flex items-center ${
                      userStrategies.length < pageSize || strategiesLoading
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-white dark:hover:bg-[#3A3D44]"
                    }`}
                    aria-label="Next page"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <DuplicateStrategyModal
        open={dupModalOpen}
        originalName={dupTarget?.StrategyName}
        loading={duplicating}
        onCancel={() => {
          setDupModalOpen(false);
          setDupTarget(null);
        }}
        onSubmit={(newName) => {
          if (!dupTarget) return;
          mutateDuplicate(
            { StrategyId: dupTarget.StrategyId, StrategyName: newName },
            {
              onSuccess: () => {
                setDupModalOpen(false);
                setDupTarget(null);
              },
            }
          );
        }}
      />
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete Strategy?"
        message="This action cannot be undone. Are you sure you want to delete this strategy?"
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        loading={deleting}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (!confirmDeleteId) return;
          mutateDelete(confirmDeleteId, {
            onSuccess: () => setConfirmDeleteId(null),
            onError: () => {},
          });
        }}
      />
      <DeployStrategyModal
        open={!!deployTarget}
        strategy={deployTarget}
        onClose={() => setDeployTarget(null)}
      />
      <TradingViewWalkthroughModal
        isOpen={tradingViewModal.open}
        onClose={() => {
          setTradingViewModal({ open: false, strategyId: null });
          // Refetch settings after modal closes to update the filtered lists
          refetchTvSettings();
        }}
        strategyId={tradingViewModal.strategyId}
        userId={user?.UserId}
      />
    </>
  );
};

export default MyStrategiesList;
