import { useState, useEffect, useMemo } from "react";
import { infoIcon, searchIcon } from "../../../assets";
import { FaYoutube } from "react-icons/fa";
import { useMasterBrokerData } from "../../../hooks/brokerHooks";
import { toast } from "react-toastify";
import { addBroker } from "../../../api/brokerApi";

const AddBrokerPage = () => {
  const [brokerId, setBrokerId] = useState("");
  const [appName, setAppName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBroker, setSelectedBroker] = useState(null);
  const { data: brokers = [], isLoading, isError } = useMasterBrokerData();

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

  const handleSubmit = async () => {
    try {
      const payload = {
        BrokerId: selectedBroker.BrokerId,
        BrokerClientId: brokerId,
        APIKey: apiKey,
        APISecretKey: apiSecret,
        APIAppId: appName,
        IsCustomApi: true,
      };

      const res = await addBroker(payload);

      if (res.Status === "Success") {
        toast.success("Broker added successfully!");
      } else {
        toast.info(res.Message || "Something went wrong");
      }
    } catch (error) {
      toast.error(error?.response?.data?.Message || "Failed to add broker");
      console.error("AddBroker API Error:", error);
    }
  };

  return (
    <div className="w-full md:p-4">
      <div className="flex flex-col lg:flex-row gap-6 border border-[#E4EAF0] dark:border-[#2D2F36] rounded-2xl p-4 md:p-6 bg-white dark:bg-[#1F1F24]">
        <div className="w-full lg:w-2/3">
          <h2 className="text-lg font-semibold text-[#2E3A59] dark:text-white">
            Add Your Broker
          </h2>
          <p className="text-sm text-[#718EBF] dark:text-[#A0AEC0] mb-4">
            Lorem Ipsum donor
          </p>

          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search broker"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
            />
            <span className="absolute left-3 top-2 text-[#718EBF]">
              <img src={searchIcon} alt="search" />
            </span>
          </div>

          <h3 className="font-medium text-[#2E3A59] dark:text-white mb-3">
            Popular Brokers
          </h3>

          {isLoading ? (
            <p className="text-sm text-gray-500">Loading brokers...</p>
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
            Lorem Ipsum donor
          </p>

          {selectedBroker && (
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
          )}

          <input
            type="text"
            placeholder="Enter Broker ID"
            value={brokerId}
            onChange={(e) => setBrokerId(e.target.value)}
            className="w-full px-4 py-2 mb-4 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
          />

          <input
            type="text"
            placeholder="App Name (Any)"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full px-4 py-2 mb-4 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
          />

          <input
            type="text"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 mb-4 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
          />

          <input
            type="text"
            placeholder="API Secret Key"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            className="w-full px-4 py-2 mb-4 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
          />

          <div className="flex gap-1 items-center text-sm text-[#718EBF] dark:text-[#A0AEC0] mb-2">
            Redirect Url:
            <img width={14} height={14} src={infoIcon} alt="info" />
          </div>
          <a
            href={selectedBroker?.ApiRedirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 mb-4 block break-all"
          >
            {selectedBroker?.ApiRedirectUrl || "-"}
          </a>

          <button
            className="w-full py-2 rounded-lg bg-[#0096FF] text-white font-medium"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBrokerPage;
