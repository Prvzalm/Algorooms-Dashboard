import { useState, useEffect, useMemo } from "react";
import { infoIcon, searchIcon } from "../../../assets";
import { FaYoutube } from "react-icons/fa";
import { FiArrowLeft, FiCopy } from "react-icons/fi";
import { useMasterBrokerData } from "../../../hooks/brokerHooks";
import { toast } from "react-toastify";
import { useAddBroker } from "../../../hooks/brokerHooks";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../common/PrimaryButton";

const AddBrokerPage = () => {
  const [brokerId, setBrokerId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const { data: brokers = [], isLoading, isError } = useMasterBrokerData();
  const navigation = useNavigate();
  const { mutate: mutateAddBroker, isPending: adding } = useAddBroker();

  const filteredBrokers = useMemo(() => {
    return brokers.filter((broker) =>
      broker.BrokerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [brokers, searchTerm]);

  useEffect(() => {
    if (brokers.length > 0 && !selectedBroker) {
      setSelectedBroker(brokers[0]);
    }
  }, [brokers, selectedBroker]);

  // Master API brokers should only require Broker ID in the UI and payload
  const isMaster = !!selectedBroker?.IsMasterApiAvailable;

  const handleCopyUrl = async () => {
    if (!selectedBroker?.ApiRedirectUrl) return;
    try {
      await navigator.clipboard.writeText(selectedBroker.ApiRedirectUrl);
      toast.success("URL copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handleSubmit = async () => {
    if (!selectedBroker) {
      toast.error("Please select a broker");
      return;
    }
    try {
      const payload = isMaster
        ? {
            BrokerId: selectedBroker.BrokerId,
            BrokerClientId: brokerId,
            IsCustomApi: isMaster,
          }
        : {
            BrokerId: selectedBroker.BrokerId,
            BrokerClientId: brokerId,
            APIKey: apiKey,
            APISecretKey: apiSecret,
            APIAppId: selectedBroker.BrokerName,
            IsCustomApi: isMaster,
          };

      mutateAddBroker(payload, {
        onSuccess: (res) => {
          if (res?.Status && res.Status.toLowerCase() !== "success") {
            // toast handled in hook; still keep UX consistent
            return;
          }
          navigation(-1, { replace: true });
        },
      });
    } catch (error) {
      toast.error(error?.response?.data?.Message || "Failed to add broker");
      console.error("AddBroker API Error:", error);
    }
  };

  return (
    <div className="w-full md:p-4">
      <div className="mb-3">
        <button
          type="button"
          onClick={() => navigation(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24] text-[#2E3A59] dark:text-white hover:bg-gray-50 dark:hover:bg-[#2A2A2E]"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 border border-[#E4EAF0] dark:border-[#2D2F36] rounded-2xl p-4 md:p-6 bg-white dark:bg-[#1F1F24]">
        <div className="w-full lg:w-2/3">
          <h2 className="text-xl md:text-2xl font-semibold text-[#2E3A59] dark:text-white">
            Add Your Broker
          </h2>
          <p className="text-sm text-[#718EBF] dark:text-[#A0AEC0] mb-4">
            Browse the partner list and pick the broker you want to connect with
            Algorooms.
          </p>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search broker"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
            />
            <span className="absolute left-3 top-3 text-[#718EBF]">
              <img src={searchIcon} alt="search" />
            </span>
          </div>

          <h3 className="font-medium text-[#2E3A59] dark:text-white mb-3">
            Popular Brokers
          </h3>

          {isLoading ? (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              aria-busy="true"
              aria-live="polite"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center p-4 border rounded-xl border-[#E4EAF0] dark:border-[#2D2F36] bg-white dark:bg-[#1F1F24]"
                >
                  <div className="w-16 h-16 mb-2 rounded-lg bg-gray-200 dark:bg-[#2D2F36] animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500">Failed to load broker list</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredBrokers.length === 0 ? (
                <p className="text-sm col-span-full text-[#718EBF] dark:text-[#A0AEC0]">
                  No brokers found.
                </p>
              ) : (
                filteredBrokers.map((broker, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedBroker(broker)}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl ${
                      selectedBroker?.BrokerId === broker.BrokerId
                        ? "border-[#0096FF]"
                        : "border-[#E4EAF0] dark:border-[#2D2F36]"
                    } bg-white dark:bg-[#1F1F24] hover:shadow-sm`}
                  >
                    <img
                      src={broker.BrokerLogoUrl}
                      alt={broker.BrokerName}
                      className="w-16 h-16 mb-2"
                    />
                    <p className="text-sm font-medium text-[#2E3A59] dark:text-white">
                      {broker.BrokerName}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/3 md:border-l border-[#E4EAF0] dark:border-[#2D2F36] md:pl-6">
          <h2 className="text-lg font-semibold text-[#2E3A59] dark:text-white">
            Add Your Broker Detail
          </h2>
          <p className="text-sm text-[#718EBF] dark:text-[#A0AEC0] mb-4">
            Enter the login information or tokens required by your broker so we
            can finish the setup.
          </p>

          {isLoading ? (
            <div
              className="flex items-center justify-between border border-[#E4EAF0] dark:border-[#2D2F36] rounded-xl p-4 mb-6 bg-white dark:bg-[#1F1F24]"
              aria-busy="true"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-[#2D2F36] animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                  <div className="h-3 w-56 bg-gray-200 dark:bg-[#2D2F36] rounded animate-pulse" />
                </div>
              </div>
            </div>
          ) : (
            selectedBroker && (
              <div className="flex items-center justify-between border border-[#E4EAF0] dark:border-[#2D2F36] rounded-xl p-4 mb-6 bg-white dark:bg-[#1F1F24]">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBroker.BrokerLogoUrl}
                    alt={selectedBroker.BrokerName}
                    className="w-16 h-16"
                  />
                  <div>
                    <p className="font-semibold text-[#2E3A59] dark:text-white">
                      {selectedBroker.BrokerName}
                    </p>
                    <p className="flex items-center text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                      How to add {selectedBroker.BrokerName}?{" "}
                      <FaYoutube className="text-red-500 text-xl ml-1" />
                    </p>
                  </div>
                </div>
              </div>
            )
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="brokerId"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Broker ID
              </label>
              <input
                id="brokerId"
                name="brokerId"
                type="text"
                placeholder="Enter Broker ID"
                value={brokerId}
                onChange={(e) => setBrokerId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
              />
            </div>
            {!isMaster && (
              <>
                <div>
                  <label
                    htmlFor="apiKey"
                    className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    API Key
                  </label>
                  <input
                    id="apiKey"
                    name="apiKey"
                    type="text"
                    placeholder="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="apiSecret"
                    className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    API Secret Key
                  </label>
                  <input
                    id="apiSecret"
                    name="apiSecret"
                    type="text"
                    placeholder="API Secret Key"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-1 items-center text-sm text-[#718EBF] dark:text-[#A0AEC0] mb-2">
            Redirect Url:
            <span className="relative group inline-flex">
              <button
                type="button"
                className="w-4 h-4 flex items-center justify-center"
                aria-label="Redirect URL information"
              >
                <img width={14} height={14} src={infoIcon} alt="info" />
              </button>
              <span
                className="pointer-events-none absolute right-0 top-full mt-2 w-60 max-w-xs text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2027] border border-gray-200 dark:border-[#2A2D35] rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition"
                role="tooltip"
              >
                Copy this callback URL into your broker developer console.
                Tokens will only be issued if the redirect exactly matches the
                value configured here.
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <a
              href={selectedBroker?.ApiRedirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 block break-all flex-1"
            >
              {selectedBroker?.ApiRedirectUrl || "-"}
            </a>
            {selectedBroker?.ApiRedirectUrl && (
              <button
                type="button"
                onClick={handleCopyUrl}
                className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-[#2D2F36] transition-colors"
                aria-label="Copy redirect URL"
              >
                <FiCopy className="w-4 h-4 text-[#718EBF] dark:text-[#A0AEC0]" />
              </button>
            )}
          </div>

          <PrimaryButton
            className="w-full py-3"
            onClick={handleSubmit}
            disabled={adding}
          >
            {adding ? "Submitting..." : "Submit"}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default AddBrokerPage;
