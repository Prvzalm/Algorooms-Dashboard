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
  const [selectedAlertType, setSelectedAlertType] = useState(null);
  const [initialEntryStates, setInitialEntryStates] = useState({
    longEntry: false,
    shortEntry: false,
  });
  const [configuredAlerts, setConfiguredAlerts] = useState({
    longEntry: false,
    longExit: false,
    shortEntry: false,
    shortExit: false,
  });
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const {
    data: settingsData,
    isLoading: initialLoading,
    refetch,
  } = useTradingViewSettings(strategyId, { enabled: isOpen && !!strategyId });
  const { mutate: saveSettings, isPending: loading } =
    useSaveTradingViewSettings();
  const { mutate: deleteSettings, isPending: deleting } =
    useDeleteTradingViewSettings();

  const hasAnyAlertConfigured =
    settingsData?.ExternalSignalsSettings?.Enabled &&
    (settingsData?.ExternalSignalsSettings?.AcceptLongEntrySignal ||
      settingsData?.ExternalSignalsSettings?.AcceptLongExitSignal ||
      settingsData?.ExternalSignalsSettings?.AcceptShortEntrySignal ||
      settingsData?.ExternalSignalsSettings?.AcceptShortExitSignal);

  useEffect(() => {
    if (
      settingsData?.Status === "Success" &&
      settingsData?.ExternalSignalsSettings
    ) {
      const settings = settingsData.ExternalSignalsSettings;
      setInitialEntryStates({
        longEntry: settings.AcceptLongEntrySignal || false,
        shortEntry: settings.AcceptShortEntrySignal || false,
      });
      setConfiguredAlerts({
        longEntry: settings.AcceptLongEntrySignal || false,
        longExit: settings.AcceptLongExitSignal || false,
        shortEntry: settings.AcceptShortEntrySignal || false,
        shortExit: settings.AcceptShortExitSignal || false,
      });
      setSelectedAlertType(null);
    }
  }, [settingsData]);

  useEffect(() => {
    if (!isOpen) setSelectedAlertType(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const webhookUrl = `https://uat-core-api.algorooms.com/api/ExternalSignals/TradingView?key=${userId}_${strategyId}`;

  const getJsonForSelectedType = () => {
    if (!selectedAlertType) return "";
    const jsonMap = {
      longEntry: { SignalType: "ENTRY", SignalDirection: "LONG" },
      longExit: { SignalType: "EXIT", SignalDirection: "LONG" },
      shortEntry: { SignalType: "ENTRY", SignalDirection: "SHORT" },
      shortExit: { SignalType: "EXIT", SignalDirection: "SHORT" },
    };
    return JSON.stringify(jsonMap[selectedAlertType], null, 2);
  };

  const toggleAlertType = (type) =>
    setSelectedAlertType((prev) => (prev === type ? null : type));

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

  const handleSave = async () => {
    const existingSettings = settingsData?.ExternalSignalsSettings || {};
    const payload = {
      Enabled: true,
      SignalSource: "tradingview",
      SignalWebhookURL: webhookUrl,
      AcceptLongEntrySignal:
        selectedAlertType === "longEntry" ||
        existingSettings.AcceptLongEntrySignal ||
        false,
      AcceptLongExitSignal:
        selectedAlertType === "longExit" ||
        existingSettings.AcceptLongExitSignal ||
        false,
      AcceptShortEntrySignal:
        selectedAlertType === "shortEntry" ||
        existingSettings.AcceptShortEntrySignal ||
        false,
      AcceptShortExitSignal:
        selectedAlertType === "shortExit" ||
        existingSettings.AcceptShortExitSignal ||
        false,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15171C] rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#2D2F36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
              📊
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2E3A59] dark:text-white">
                Connect TradingView Alert
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Follow these simple steps to connect your alert
              </p>
            </div>
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
              <FiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#15171C]">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Step 1: Choose Alert */}
            <div className="bg-white dark:bg-[#1A1B20] rounded-2xl p-6 border-2 border-gray-200 dark:border-[#2D2F36]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-[#2E3A59] dark:text-white">
                  Choose Your Alert Type
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 ml-11">
                Select ONE alert type below. You can add more alerts later by
                repeating this process.
              </p>
              <div className="grid grid-cols-2 gap-3 ml-11">
                {[
                  {
                    id: "longEntry",
                    label: "Long Entry",
                    icon: "📈",
                    color: "green",
                  },
                  {
                    id: "longExit",
                    label: "Long Exit",
                    icon: "🔚",
                    color: "red",
                    disabled: !initialEntryStates.longEntry,
                  },
                  {
                    id: "shortEntry",
                    label: "Short Entry",
                    icon: "📉",
                    color: "purple",
                  },
                  {
                    id: "shortExit",
                    label: "Short Exit",
                    icon: "🛑",
                    color: "orange",
                    disabled: !initialEntryStates.shortEntry,
                  },
                ].map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() =>
                      !configuredAlerts[alert.id] &&
                      !alert.disabled &&
                      toggleAlertType(alert.id)
                    }
                    disabled={configuredAlerts[alert.id] || alert.disabled}
                    className={`p-4 rounded-xl border-2 transition-all text-sm font-semibold ${
                      configuredAlerts[alert.id]
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30 cursor-not-allowed"
                        : selectedAlertType === alert.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg scale-105"
                        : alert.disabled
                        ? "border-gray-200 dark:border-[#2D2F36] opacity-40 cursor-not-allowed"
                        : "border-gray-200 dark:border-[#2D2F36] hover:border-blue-400 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{alert.icon}</span>
                      <div className="flex-1 text-left">
                        <div
                          className={`${
                            configuredAlerts[alert.id]
                              ? "text-green-600 dark:text-green-400"
                              : alert.disabled
                              ? "text-gray-400"
                              : "text-[#2E3A59] dark:text-white"
                          }`}
                        >
                          {alert.label}
                        </div>
                        {alert.disabled && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            Configure entry first
                          </div>
                        )}
                      </div>
                      {configuredAlerts[alert.id] && (
                        <span className="text-xl text-green-600 dark:text-green-400">
                          ✓
                        </span>
                      )}
                      {selectedAlertType === alert.id &&
                        !configuredAlerts[alert.id] && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full" />
                        )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Copy This JSON */}
            <div className="bg-white dark:bg-[#1A1B20] rounded-2xl p-6 border-2 border-gray-200 dark:border-[#2D2F36]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-[#2E3A59] dark:text-white">
                  Copy This JSON Code
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 ml-11">
                Click the copy button to copy this JSON code. You'll paste it in
                TradingView.
              </p>
              <div className="relative ml-11">
                <pre className="bg-white dark:bg-[#0D0E12] border-2 border-purple-200 dark:border-[#2D2F36] rounded-xl p-4 text-sm font-mono overflow-x-auto text-gray-800 dark:text-gray-200">
                  {selectedAlertType
                    ? getJsonForSelectedType()
                    : '{\n  "Please select an alert type above"\n}'}
                </pre>
                <button
                  onClick={() =>
                    copyToClipboard(getJsonForSelectedType(), "json")
                  }
                  disabled={!selectedAlertType}
                  className="absolute top-3 right-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all flex items-center gap-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {copiedJson ? (
                    <>
                      <FiCheck className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-4 h-4" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 3: Copy Webhook URL */}
            <div className="bg-white dark:bg-[#1A1B20] rounded-2xl p-6 border-2 border-gray-200 dark:border-[#2D2F36]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-[#2E3A59] dark:text-white">
                  Copy Webhook URL
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 ml-11">
                Copy this webhook URL. You'll need it in TradingView's
                Notifications tab.
              </p>
              <div className="relative ml-11">
                <div className="bg-white dark:bg-[#0D0E12] border-2 border-green-200 dark:border-[#2D2F36] rounded-xl p-4 text-sm break-all pr-32 font-mono text-gray-800 dark:text-gray-200">
                  {webhookUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(webhookUrl, "url")}
                  className="absolute top-3 right-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl"
                >
                  {copiedUrl ? (
                    <>
                      <FiCheck className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-4 h-4" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 4: TradingView Instructions */}
            <div className="bg-white dark:bg-[#1A1B20] rounded-2xl p-6 border-2 border-gray-200 dark:border-[#2D2F36]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h3 className="text-lg font-bold text-[#2E3A59] dark:text-white">
                  Setup in TradingView
                </h3>
              </div>
              <div className="ml-11 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    A. Create your alert in TradingView
                  </p>
                  <img
                    src="https://uat.algorooms.com/static/media/step1.b8a2674f4a649e9d1ec5.png"
                    alt="Create Alert"
                    className="w-full max-w-md h-auto object-contain rounded-xl border-2 border-gray-200 dark:border-[#2D2F36]"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    B. Paste JSON in "Message" tab
                  </p>
                  <img
                    src="https://uat.algorooms.com/static/media/step2.ec18c2677aa638042c6e.png"
                    alt="Paste JSON"
                    className="w-full max-w-md h-auto object-contain rounded-xl border-2 border-gray-200 dark:border-[#2D2F36]"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    C. Paste Webhook URL in "Notifications" tab
                  </p>
                  <img
                    src="https://uat.algorooms.com/static/media/step3.dd454685855f25371d4e.png"
                    alt="Paste Webhook"
                    className="w-full max-w-md h-auto object-contain rounded-xl border-2 border-gray-200 dark:border-[#2D2F36]"
                  />
                </div>
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-white dark:bg-[#1A1B20] border-2 border-gray-200 dark:border-[#2D2F36] rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 dark:text-amber-400 text-2xl">
                  💡
                </div>
                <div>
                  <h4 className="font-bold text-[#2E3A59] dark:text-white mb-2">
                    Quick Tips
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                    <li>You can only configure ONE alert at a time</li>
                    <li>
                      To add more alerts, save this one and repeat the process
                    </li>
                    <li>
                      Configured alerts will show with a green checkmark ✓
                    </li>
                    <li>
                      Exit alerts require their corresponding entry alert first
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-[#2D2F36] bg-gray-50 dark:bg-[#1A1B20]">
          <button
            onClick={onClose}
            disabled={loading || deleting}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition bg-gray-200 dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white hover:bg-gray-300 dark:hover:bg-[#3D3F46] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedAlertType || loading || deleting}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            )}
            {loading ? "Saving..." : "✓ Save & Connect Alert"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingViewWalkthroughModal;
