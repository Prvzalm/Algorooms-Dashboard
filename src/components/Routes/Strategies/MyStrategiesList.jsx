import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useUserStrategies,
  useDuplicateStrategy,
  useDeleteStrategy,
} from "../../../hooks/strategyHooks";
import { emptyStrategy } from "../../../assets";
import CreateStrategyPopup from "./CreateStrategyPopup";
import DuplicateStrategyModal from "../../DuplicateStrategyModal";
import ConfirmModal from "../../ConfirmModal";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import StrategyCardSkeleton from "./StrategyCardSkeleton";

const subTabs = ["Strategies", "Tradingview Signals Trading"];

const MyStrategiesList = ({ activeSubTab, setActiveSubTab }) => {
  const navigate = useNavigate();

  // pagination state for "Strategies" sub tab
  const pageSize = 10;
  const [strategyPage, setStrategyPage] = useState(1);
  useEffect(() => {
    setStrategyPage(1);
  }, [activeSubTab]);

  const {
    data: userStrategies = [],
    isLoading: strategiesLoading,
    isError: strategiesError,
  } = useUserStrategies({
    page: strategyPage,
    pageSize,
    strategyType: activeSubTab === "Strategies" ? "created" : "subscribed",
    queryText: "",
    orderBy: "Date",
  });

  const [showStrategyPopup, setShowStrategyPopup] = useState(false);
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

  if (strategiesLoading) return <StrategyCardSkeleton count={6} />;
  if (strategiesError) return <div>Failed to load strategies.</div>;

  return (
    <>
      <div className="flex space-x-3 mb-4">
        {subTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-4 py-3 rounded-lg text-sm font-medium ${
              activeSubTab === tab
                ? "bg-blue-100 text-[#0096FF] border border-[#0096FF]"
                : "bg-gray-200 dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeSubTab === "Strategies" && userStrategies.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-[#718EBF] dark:text-gray-400">
            Showing {userStrategies.length} strategies (Page {strategyPage})
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
              disabled={userStrategies.length < pageSize || strategiesLoading}
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

      {userStrategies.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center">
          <img src={emptyStrategy} alt="Empty" className="mb-6" />
          <button
            className="px-6 py-2 bg-[#0096FF] text-white rounded-lg text-sm font-medium"
            onClick={() => setShowStrategyPopup(true)}
          >
            + Create Strategy
          </button>

          {showStrategyPopup && (
            <CreateStrategyPopup onClose={() => setShowStrategyPopup(false)} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {userStrategies.map((strategy) => (
            <div
              key={strategy.StrategyId}
              className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#15171C] p-5 relative"
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
                  className="text-gray-400 dark:text-gray-500 text-xl px-2 py-1 hover:text-[#0096FF]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionMenuOpenId((prev) =>
                      prev === strategy.StrategyId ? null : strategy.StrategyId
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
                  <p className="mb-1">{strategy.StrategySegmentType || "-"}</p>
                  <p className="font-medium">Segment Type</p>
                </div>
                <div>
                  <p className="mb-1">
                    {strategy.StrategyExecutionType || "-"}
                  </p>
                  <p className="font-medium">Strategy Type</p>
                </div>
              </div>

              <div className="mt-4">
                <button
                  disabled
                  className="w-full bg-[#F5F8FA] dark:bg-[#2D2F36] text-[#718EBF] dark:text-gray-300 text-xs font-medium py-3 rounded-md"
                >
                  {strategy.ScriptDetails?.[0]?.ScriptName || "-"}
                </button>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  className="flex-1 py-3 rounded-md border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] text-[#2E3A59] dark:text-white text-sm font-medium"
                  onClick={() =>
                    navigate(
                      `/backtesting/strategybacktest/${strategy.StrategyId}`
                    )
                  }
                >
                  Backtest
                </button>
                <button className="flex-1 py-3 rounded-md bg-[#0096FF] hover:bg-blue-600 text-white text-sm font-medium">
                  Deploy
                </button>
              </div>
            </div>
          ))}
        </div>
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
    </>
  );
};

export default MyStrategiesList;
