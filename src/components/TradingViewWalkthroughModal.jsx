import React, { useState, useEffect } from "react";
import { FiX, FiCopy, FiCheck } from "react-icons/fi";
import { toast } from "react-toastify";
import {
  useTradingViewSettings,
  useSaveTradingViewSettings,
  useDeleteTradingViewSettings,
} from "../hooks/tradingViewHooks";

const TradingViewWalkthroughModal = ({
  isOpen,
  onClose,
  strategyId,
  userId,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAlertType, setSelectedAlertType] = useState({
    longEntry: false,
    longExit: false,
    shortEntry: false,
    shortExit: false,
  });
  // Track initial state from GET API to determine if exits should be clickable
  const [initialEntryStates, setInitialEntryStates] = useState({
    longEntry: false,
    shortEntry: false,
  });
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch existing settings using TanStack Query
  const {
    data: settingsData,
    isLoading: initialLoading,
    refetch,
  } = useTradingViewSettings(strategyId, {
    enabled: isOpen && !!strategyId,
  });

  // Save settings mutation
  const { mutate: saveSettings, isPending: loading } =
    useSaveTradingViewSettings();

  // Delete settings mutation
  const { mutate: deleteSettings, isPending: deleting } =
    useDeleteTradingViewSettings();

  // Check if any alert type is configured
  const hasAnyAlertConfigured =
    settingsData?.ExternalSignalsSettings?.Enabled &&
    (settingsData?.ExternalSignalsSettings?.AcceptLongEntrySignal ||
      settingsData?.ExternalSignalsSettings?.AcceptLongExitSignal ||
      settingsData?.ExternalSignalsSettings?.AcceptShortEntrySignal ||
      settingsData?.ExternalSignalsSettings?.AcceptShortExitSignal);

  // Update selected alert types when settings are loaded
  useEffect(() => {
    if (
      settingsData?.Status === "Success" &&
      settingsData?.ExternalSignalsSettings
    ) {
      const settings = settingsData.ExternalSignalsSettings;
      const longEntry = settings.AcceptLongEntrySignal || false;
      const shortEntry = settings.AcceptShortEntrySignal || false;

      // Set initial entry states - these determine if exits can be enabled
      setInitialEntryStates({
        longEntry: longEntry,
        shortEntry: shortEntry,
      });

      setSelectedAlertType({
        longEntry: longEntry,
        longExit: settings.AcceptLongExitSignal || false,
        shortEntry: shortEntry,
        shortExit: settings.AcceptShortExitSignal || false,
      });
    }
  }, [settingsData]);

  // Reset to first step when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const webhookUrl = `https://uat-core-api.algorooms.com/api/ExternalSignals/TradingView?key=${userId}_${strategyId}`;

  // Generate JSON for all selected alert types
  const getJsonForSelectedType = () => {
    const jsonObjects = [];

    if (selectedAlertType.longEntry) {
      jsonObjects.push({ SignalType: "ENTRY", SignalDirection: "LONG" });
    }
    if (selectedAlertType.longExit) {
      jsonObjects.push({ SignalType: "EXIT", SignalDirection: "LONG" });
    }
    if (selectedAlertType.shortEntry) {
      jsonObjects.push({ SignalType: "ENTRY", SignalDirection: "SHORT" });
    }
    if (selectedAlertType.shortExit) {
      jsonObjects.push({ SignalType: "EXIT", SignalDirection: "SHORT" });
    }

    if (jsonObjects.length === 0) return "";
    if (jsonObjects.length === 1)
      return JSON.stringify(jsonObjects[0], null, 2);

    return JSON.stringify(jsonObjects, null, 2);
  };

  const toggleAlertType = (type) => {
    setSelectedAlertType((prev) => {
      const newState = { ...prev, [type]: !prev[type] };

      // If disabling entry, also disable corresponding exit
      if (type === "longEntry" && !newState.longEntry) {
        newState.longExit = false;
      }
      if (type === "shortEntry" && !newState.shortEntry) {
        newState.shortExit = false;
      }

      return newState;
    });
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "json") {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    const payload = {
      Enabled: true,
      SignalSource: "tradingview",
      SignalWebhookURL: webhookUrl,
      AcceptLongEntrySignal: selectedAlertType.longEntry,
      AcceptLongExitSignal: selectedAlertType.longExit,
      AcceptShortEntrySignal: selectedAlertType.shortEntry,
      AcceptShortExitSignal: selectedAlertType.shortExit,
      StrategyId: strategyId,
    };

    saveSettings(payload, {
      onSuccess: (response) => {
        if (response.Status === "Success") {
          toast.success(
            response.Message || "External signal settings saved successfully."
          );
          onClose();
        } else {
          toast.error(response.Message || "Failed to save settings");
        }
      },
      onError: (error) => {
        console.error("Failed to save TradingView settings:", error);
        toast.error(
          error?.response?.data?.Message || "Failed to save settings"
        );
      },
    });
  };

  const handleRemoveSignal = () => {
    if (!strategyId) return;

    deleteSettings(strategyId, {
      onSuccess: (response) => {
        if (response.Status === "Success") {
          toast.success(
            response.Message || "External signal settings removed successfully."
          );
          onClose();
        } else {
          toast.error(response.Message || "Failed to remove settings");
        }
      },
      onError: (error) => {
        console.error("Failed to remove TradingView settings:", error);
        toast.error(
          error?.response?.data?.Message || "Failed to remove settings"
        );
      },
    });
  };

  const steps = [
    {
      title: "Choose Your Alert Type",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Note:</span> You can select
              multiple alert types. Exit signals can only be enabled if
              corresponding entry signal is selected.
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <div className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</div>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Important:</span> Finish all steps
              carefully (select type → create alert → copy JSON → copy webhook →
              save) and simultaneously copy & paste in TradingView to ensure
              proper alert/signal delivery.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={() => toggleAlertType("longEntry")}
              className={`p-4 rounded-xl border-2 transition text-left ${
                selectedAlertType.longEntry
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-[#2D2F36] hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAlertType.longEntry}
                  onChange={() => {}}
                  className="w-4 h-4"
                />
                <span className="font-medium text-[#2E3A59] dark:text-white">
                  Long Entry
                </span>
              </div>
            </button>

            <button
              onClick={() => toggleAlertType("longExit")}
              disabled={!initialEntryStates.longEntry}
              className={`p-4 rounded-xl border-2 transition text-left ${
                selectedAlertType.longExit
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : !initialEntryStates.longEntry
                  ? "border-gray-200 dark:border-[#2D2F36] opacity-50 cursor-not-allowed"
                  : "border-gray-200 dark:border-[#2D2F36] hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAlertType.longExit}
                  onChange={() => {}}
                  className="w-4 h-4"
                  disabled={!initialEntryStates.longEntry}
                />
                <span
                  className={`font-medium ${
                    !initialEntryStates.longEntry
                      ? "text-gray-400"
                      : "text-red-500"
                  }`}
                >
                  Long Exit
                </span>
              </div>
            </button>

            <button
              onClick={() => toggleAlertType("shortEntry")}
              className={`p-4 rounded-xl border-2 transition text-left ${
                selectedAlertType.shortEntry
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-[#2D2F36] hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAlertType.shortEntry}
                  onChange={() => {}}
                  className="w-4 h-4"
                />
                <span className="font-medium text-[#2E3A59] dark:text-white">
                  Short Entry
                </span>
              </div>
            </button>

            <button
              onClick={() => toggleAlertType("shortExit")}
              disabled={!initialEntryStates.shortEntry}
              className={`p-4 rounded-xl border-2 transition text-left ${
                selectedAlertType.shortExit
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : !initialEntryStates.shortEntry
                  ? "border-gray-200 dark:border-[#2D2F36] opacity-50 cursor-not-allowed"
                  : "border-gray-200 dark:border-[#2D2F36] hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAlertType.shortExit}
                  onChange={() => {}}
                  className="w-4 h-4"
                  disabled={!initialEntryStates.shortEntry}
                />
                <span
                  className={`font-medium ${
                    !initialEntryStates.shortEntry
                      ? "text-gray-400"
                      : "text-red-500"
                  }`}
                >
                  Short Exit
                </span>
              </div>
            </button>
          </div>
        </div>
      ),
    },
    {
      title: "Open Trading View and Create Alert",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Follow these steps in TradingView to create your alert
          </p>
          <div className="bg-gray-50 dark:bg-[#1E1F25] rounded-lg p-4 flex items-center justify-center">
            <img
              src="https://uat.algorooms.com/static/media/step1.b8a2674f4a649e9d1ec5.png"
              alt="Step 1: Create Alert in TradingView"
              className="max-w-full h-auto max-h-[300px] object-contain rounded-lg"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Copy Json Data Signal",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Copy the json as shown here and paste it into the "Message" Tab on
            the Trading View
          </p>
          <div className="bg-gray-50 dark:bg-[#1E1F25] rounded-lg p-4 flex items-center justify-center mb-4">
            <img
              src="https://uat.algorooms.com/static/media/step2.ec18c2677aa638042c6e.png"
              alt="Step 2: Add Message"
              className="max-w-full h-auto max-h-[300px] object-contain rounded-lg"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#2E3A59] dark:text-white">
              Add Message
            </label>
            <div className="relative">
              <pre className="bg-white dark:bg-[#131419] border border-gray-200 dark:border-[#2D2F36] rounded-lg p-4 text-sm overflow-x-auto max-h-[150px] overflow-y-auto">
                {getJsonForSelectedType()}
              </pre>
              <button
                onClick={() =>
                  copyToClipboard(getJsonForSelectedType(), "json")
                }
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center gap-2"
              >
                {copiedJson ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span className="text-xs">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Copy Webhook URL",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Copy the Webhook URL as shown here and Paste it into the
            "Notification" Tab on the Trading View Connection URL
          </p>
          <div className="bg-gray-50 dark:bg-[#1E1F25] rounded-lg p-4 flex items-center justify-center mb-4">
            <img
              src="https://uat.algorooms.com/static/media/step3.dd454685855f25371d4e.png"
              alt="Step 3: Add Webhook URL"
              className="max-w-full h-auto max-h-[300px] object-contain rounded-lg"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#2E3A59] dark:text-white">
              Add Webhook URL
            </label>
            <div className="relative">
              <div className="bg-white dark:bg-[#131419] border border-gray-200 dark:border-[#2D2F36] rounded-lg p-4 text-sm break-all">
                {webhookUrl}
              </div>
              <button
                onClick={() => copyToClipboard(webhookUrl, "url")}
                className="absolute top-2 right-2 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center gap-2"
              >
                {copiedUrl ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span className="text-xs">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    <span className="text-xs">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Save Signal",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Note:</span> If you also want to
              add an exit signal, please first save your current setup and then
              repeat the process from the very first step.
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Note:</span> If you already added
              the exit signal, then just save.
            </div>
          </div>
        </div>
      ),
    },
  ];

  const isNextDisabled =
    currentStep === 0 && !Object.values(selectedAlertType).some((v) => v);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15171C] rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2D2F36]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              📊
            </div>
            <h2 className="text-lg font-semibold text-[#2E3A59] dark:text-white">
              Tradingview Alert Configuration
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyAlertConfigured && (
              <button
                onClick={handleRemoveSignal}
                disabled={deleting}
                className="px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting && (
                  <span className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                )}
                {deleting ? "Removing..." : "Remove Signal"}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={deleting}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2D2F36] rounded-lg transition disabled:opacity-50"
            >
              <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2D2F36]">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                      index <= currentStep
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-[#2D2F36] text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </div>
                  <span className="text-xs mt-2 text-center max-w-[80px] text-gray-600 dark:text-gray-400 hidden sm:block">
                    {step.title.split(" ")[0]} {step.title.split(" ")[1]}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      index < currentStep
                        ? "bg-blue-500"
                        : "bg-gray-200 dark:bg-[#2D2F36]"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-xl font-semibold text-[#2E3A59] dark:text-white mb-4">
            {steps[currentStep].title}
          </h3>
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-[#2D2F36]">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || loading || deleting}
            className={`px-6 py-2.5 rounded-lg font-medium transition ${
              currentStep === 0 || loading || deleting
                ? "bg-gray-100 dark:bg-[#2D2F36] text-gray-400 cursor-not-allowed"
                : "bg-gray-200 dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white hover:bg-gray-300 dark:hover:bg-[#3D3F46]"
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={isNextDisabled || loading || deleting}
            className={`px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2 ${
              isNextDisabled || loading || deleting
                ? "bg-gray-300 dark:bg-[#2D2F36] text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            )}
            {currentStep === steps.length - 1
              ? loading
                ? "Saving..."
                : "Save"
              : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingViewWalkthroughModal;
