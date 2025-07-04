import { useState } from "react";
import { infoIcon, searchIcon, upStox } from "../../../assets";
import { FaYoutube } from "react-icons/fa";

const popularBrokers = Array(12).fill({
  name: "Upstox",
  logo: upStox,
});

const AddBrokerPage = () => {
  const [selectedBroker, setSelectedBroker] = useState(popularBrokers[0]);
  const [brokerId, setBrokerId] = useState("");
  const [appName, setAppName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const handleSubmit = () => {
    console.log({
      brokerId,
      appName,
      apiKey,
      apiSecret,
      selectedBroker,
    });

    alert(`Broker info submitted:
Broker ID: ${brokerId}
App Name: ${appName}
API Key: ${apiKey}
API Secret: ${apiSecret}`);
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
              className="w-full px-4 py-2 pl-10 rounded-lg bg-[#F5F8FA] dark:bg-[#2D2F36] text-sm text-[#2E3A59] dark:text-white placeholder:text-[#718EBF]"
            />
            <span className="absolute left-3 top-2 text-[#718EBF]">
              {" "}
              <img src={searchIcon} alt="" />
            </span>
          </div>

          <h3 className="font-medium text-[#2E3A59] dark:text-white mb-3">
            Popular Broker
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {popularBrokers.map((broker, index) => (
              <button
                key={index}
                onClick={() => setSelectedBroker(broker)}
                className="flex flex-col items-center justify-center p-4 border border-[#E4EAF0] dark:border-[#2D2F36] rounded-xl bg-white dark:bg-[#1F1F24] hover:shadow-sm"
              >
                <img
                  src={broker.logo}
                  alt={broker.name}
                  className="w-16 h-16 mb-2"
                />
                <p className="text-sm font-medium text-[#2E3A59] dark:text-white">
                  {broker.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-1/3 md:border-l border-[#E4EAF0] dark:border-[#2D2F36] md:pl-6">
          <h2 className="text-lg font-semibold text-[#2E3A59] dark:text-white">
            Add Your Broker Detail
          </h2>
          <p className="text-sm text-[#718EBF] dark:text-[#A0AEC0] mb-4">
            Lorem Ipsum donor
          </p>

          <div className="flex items-center justify-between border border-[#E4EAF0] dark:border-[#2D2F36] rounded-xl p-4 mb-6 bg-white dark:bg-[#1F1F24]">
            <div className="flex items-center gap-3">
              <img
                src={selectedBroker.logo}
                alt={selectedBroker.name}
                className="w-16 h-16"
              />
              <div>
                <p className="font-semibold text-[#2E3A59] dark:text-white">
                  {selectedBroker.name}
                </p>
                <p className="flex items-center text-xs text-[#718EBF] dark:text-[#A0AEC0]">
                  How to add {selectedBroker.name} broker?{" "}
                  <FaYoutube className="text-red-500 text-xl ml-1" />
                </p>
              </div>
            </div>
          </div>

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
            Redirect Url: <img width={14} height={14} src={infoIcon} alt="" />
          </div>
          <a
            href="https://web.algorooms.com/connect-broker"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 mb-4 block break-all"
          >
            https://web.algorooms.com/connect-broker
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
