import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserBrokerData } from "../../../hooks/dashboardHooks";
import {
  useStartStopTradeEngine,
  useDeleteBroker,
  useSquareOffBroker,
} from "../../../hooks/brokerHooks";
import { emptyDeployedStrategy } from "../../../assets";
import ConfirmModal from "../../ConfirmModal";
import { FiMoreVertical } from "react-icons/fi";

const BrokerSection = () => {
  // Local UI override states (so UI feels instant after mutation)
  const [engineStatusOverrides, setEngineStatusOverrides] = useState({}); // BrokerClientId -> "Running"|"Stopped"
  const [pendingBrokerId, setPendingBrokerId] = useState(null); // track which broker row is mutating
  const mutatingRef = useRef(false);
  const [confirmForBrokerId, setConfirmForBrokerId] = useState(null); // BrokerClientId awaiting start confirmation
  const navigate = useNavigate();

  const { data: brokers = [], isLoading, isError } = useUserBrokerData();
  const { mutate: mutateTradeEngine, isPending } = useStartStopTradeEngine();
  const { mutate: mutateDeleteBroker, isPending: deletingBroker } =
    useDeleteBroker();
  const { mutate: mutateSquareOffBroker, isPending: squaringOff } =
    useSquareOffBroker();

  const getEffectiveTradeEngineStatus = (broker) => {
    const override = engineStatusOverrides[broker.BrokerClientId];
    return override || broker.TradeEngineStatus;
  };

  const handleTerminalLogin = (broker) => {
    if (!broker?.APILoginUrl) return; // nothing to do
    // Save identifiers for ConnectBroker route to process
    localStorage.setItem("selected-broker-client-id", broker.BrokerClientId);
    localStorage.setItem(
      "broker-auth-query-key",
      broker.brokerAuthQueryString || "request_token"
    );
    window.location.href = broker.APILoginUrl;
  };

  const performToggleTradeEngine = (broker, nextAction) => {
    if (!broker || isPending || mutatingRef.current) return;
    mutatingRef.current = true;
    setPendingBrokerId(broker.BrokerClientId);
    mutateTradeEngine(
      {
        TradeEngineName:
          broker.TradeEngineName ||
          broker.TradeEngine ||
          broker.tradeEngineName,
        BrokerClientId: broker.BrokerClientId,
        ConnectOptions: nextAction,
      },
      {
        onSuccess: () => {
          setEngineStatusOverrides((prev) => ({
            ...prev,
            [broker.BrokerClientId]:
              nextAction === "Start" ? "Running" : "Stopped",
          }));
        },
        onSettled: () => {
          mutatingRef.current = false;
          setPendingBrokerId(null);
          setConfirmForBrokerId(null);
        },
      }
    );
  };

  const handleToggleTradeEngine = (broker) => {
    if (!broker || isPending || mutatingRef.current) return;
    const currentStatus = getEffectiveTradeEngineStatus(broker);
    const nextAction = currentStatus === "Running" ? "Stop" : "Start";
    if (nextAction === "Start") {
      setConfirmForBrokerId(broker.BrokerClientId);
      return;
    }
    performToggleTradeEngine(broker, nextAction);
  };

  // Kebab menu state: which broker menu is open
  const [openMenuId, setOpenMenuId] = useState(null);
  // Confirm modals for delete & square off
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmSquareId, setConfirmSquareId] = useState(null);

  // Close menu on outside click (stable and per-opened menu)
  // Uses a unique id for each row menu container to avoid ref conflicts
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e) => {
      const el = document.getElementById(`broker-menu-${openMenuId}`);
      if (el && !el.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  return (
    <div className="w-full md:p-4">
      <div className="rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#2E3A59] dark:text-white">
              Broker
            </h2>
            <p className="text-sm text-[#718EBF] dark:text-[#A0AEC0]">
              Manage your connected brokers
            </p>
          </div>
          <button
            onClick={() => navigate("/add-broker")}
            className="px-4 py-3 bg-[#0096FF] text-white rounded-lg text-sm font-medium w-full sm:w-auto"
          >
            + Add Broker
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-live="polite">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border border-[#E4EAF0] dark:border-[#2D2F36] rounded-xl p-4 bg-white dark:bg-[#1F1F24]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gray-200 dark:bg-[#2D2F36] animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                      <div className="h-3 w-36 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <div className="h-3 w-28 bg-gray-200 dark:bg-[#2D2F36] rounded mb-2 animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-3 w-14 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                    <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-[#2D2F36] animate-pulse" />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                    <div className="h-6 w-11 rounded-full bg-gray-200 dark:bg-[#2D2F36] animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center text-red-500">
            Failed to load broker data.
          </div>
        ) : brokers.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <img src={emptyDeployedStrategy} alt="No brokers" />
          </div>
        ) : (
          <div className="space-y-4 relative">
            <ConfirmModal
              open={!!confirmForBrokerId}
              title="Start Trade Engine?"
              message={
                "This will begin live trading for the selected broker.\nEnsure strategies & margins are configured."
              }
              confirmLabel="OK"
              cancelLabel="Cancel"
              loading={isPending}
              onCancel={() => setConfirmForBrokerId(null)}
              onConfirm={() => {
                const broker = brokers.find(
                  (b) => b.BrokerClientId === confirmForBrokerId
                );
                setConfirmForBrokerId(null);
                if (broker) performToggleTradeEngine(broker, "Start");
              }}
            />
            {brokers.map((broker, index) => {
              const tradeEngineStatus = getEffectiveTradeEngineStatus(broker);
              const rowPending =
                pendingBrokerId === broker.BrokerClientId && isPending;
              return (
                <div
                  key={index}
                  className="relative border border-[#E4EAF0] dark:border-[#2D2F36] rounded-xl p-4 bg-white dark:bg-[#1F1F24] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  {rowPending && (
                    <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center bg-white/70 dark:bg-black/40 backdrop-blur-sm z-10">
                      <div className="w-10 h-10 border-4 border-t-transparent border-[#0096FF] rounded-full animate-spin mb-2" />
                      <p className="text-xs text-[#2E3A59] dark:text-gray-300 font-medium">
                        Updating...
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <img
                      src={broker.brokerLogoUrl}
                      alt={`${broker.BrokerName} logo`}
                      className="w-12 h-12 sm:w-16 sm:h-16"
                    />
                    <div>
                      <p className="font-semibold text-[#2E3A59] dark:text-white">
                        {broker.BrokerName}
                      </p>
                      <p className="text-[11px] text-[#718EBF]">
                        {broker.BrokerClientId}
                      </p>
                      <p className="mt-1 text-[11px]">
                        <span className="text-[#718EBF] dark:text-[#A0AEC0]">
                          Login:
                        </span>{" "}
                        <span
                          className={
                            broker.BrokerLoginStatus
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-500"
                          }
                        >
                          {broker.BrokerLoginStatus
                            ? "Connected"
                            : "Not Connected"}
                        </span>
                      </p>
                    </div>
                    {/* Kebab menu */}
                    <div
                      className="ml-2 relative"
                      id={`broker-menu-${broker.BrokerClientId}`}
                    >
                      <button
                        type="button"
                        aria-label="Actions"
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2A2A2E]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId((prev) =>
                            prev === broker.BrokerClientId
                              ? null
                              : broker.BrokerClientId
                          );
                        }}
                        disabled={rowPending || deletingBroker || squaringOff}
                      >
                        <FiMoreVertical className="text-gray-600 dark:text-gray-300" />
                      </button>
                      {openMenuId === broker.BrokerClientId && (
                        <div className="absolute z-20 mt-2 w-44 rounded-md border border-gray-200 dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] shadow-lg">
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#2A2A2E]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              setConfirmSquareId(broker.BrokerClientId);
                            }}
                            disabled={rowPending || squaringOff}
                          >
                            Square Off
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-[#2A2A2E]"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              setConfirmDeleteId(broker.BrokerClientId);
                            }}
                            disabled={rowPending || deletingBroker}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center sm:text-left hidden sm:block">
                    <p className="text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                      Strategy Performance
                    </p>
                    <p className="font-semibold text-[#2E3A59] dark:text-white">
                      0.00
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                      Terminal
                    </p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        onChange={() => handleTerminalLogin(broker)}
                        // Reflect login status visually (checked if logged in)
                        checked={!!broker.BrokerLoginStatus}
                        // Prevent direct toggle of checked state (managed by server refresh)
                        readOnly
                        disabled={rowPending}
                      />
                      <div
                        className={`w-11 h-6 relative rounded-full transition-colors ${
                          broker.BrokerLoginStatus
                            ? "bg-[#0096FF]"
                            : "bg-gray-200 dark:bg-[#2D2F36]"
                        } ${rowPending ? "opacity-60" : ""}`}
                      >
                        <span
                          className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white border border-gray-300 transition-transform ${
                            broker.BrokerLoginStatus ? "translate-x-full" : ""
                          }`}
                        />
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                      Trading Engine
                    </p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={tradeEngineStatus === "Running"}
                        onChange={() => handleToggleTradeEngine(broker)}
                        disabled={rowPending}
                      />
                      <div
                        className={`w-11 h-6 relative rounded-full transition-colors ${
                          tradeEngineStatus === "Running"
                            ? "bg-green-600"
                            : "bg-gray-200 dark:bg-[#2D2F36]"
                        } ${rowPending ? "opacity-60" : ""}`}
                      >
                        <span
                          className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white border border-gray-300 transition-transform ${
                            tradeEngineStatus === "Running"
                              ? "translate-x-full"
                              : ""
                          }`}
                        />
                      </div>
                    </label>
                  </div>
                </div>
              );
            })}
            {/* Confirm: Start Trade Engine (existing) is above. Add broker SquareOff/Delete modals below */}
            <ConfirmModal
              open={!!confirmDeleteId}
              title="Delete Broker?"
              message={
                "This will remove the broker connection from your account. You can add it again later."
              }
              confirmLabel="Delete"
              cancelLabel="Cancel"
              loading={deletingBroker}
              onCancel={() => setConfirmDeleteId(null)}
              onConfirm={() => {
                const id = confirmDeleteId;
                setConfirmDeleteId(null);
                if (!id) return;
                setPendingBrokerId(id);
                mutateDeleteBroker(
                  { BrokerClientId: id },
                  {
                    onSettled: () => setPendingBrokerId(null),
                  }
                );
              }}
            />
            <ConfirmModal
              open={!!confirmSquareId}
              title="Square Off Broker?"
              message={
                "This will square off all open positions under this broker. Proceed?"
              }
              confirmLabel="Square Off"
              cancelLabel="Cancel"
              loading={squaringOff}
              onCancel={() => setConfirmSquareId(null)}
              onConfirm={() => {
                const id = confirmSquareId;
                setConfirmSquareId(null);
                if (!id) return;
                setPendingBrokerId(id);
                mutateSquareOffBroker(
                  { BrokerClientId: id },
                  {
                    onSettled: () => setPendingBrokerId(null),
                  }
                );
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BrokerSection;
