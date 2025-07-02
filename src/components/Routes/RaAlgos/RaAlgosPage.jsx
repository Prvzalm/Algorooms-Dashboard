import { useState } from "react";
import RaAlgosData from "../Dashboard/RaAlgosData";
import { man } from "../../../assets";

const mockAlgos = [
  {
    name: "Abinas Mishra",
    avatar: man,
    sebiId: "SEBI INH00001990",
    strategies: [
      { name: "Sensex Weekly Expiry", margin: "₹3,00,000", saves: 11 },
      { name: "BankNifty Intraday", margin: "₹2,50,000", saves: 9 },
      { name: "Option Booster", margin: "₹1,80,000", saves: 6 },
    ],
  },
  {
    name: "Rajat Gupta",
    avatar: man,
    sebiId: "SEBI INH000010202",
    strategies: [
      { name: "BankNifty S1", margin: "₹1,50,000", saves: 7 },
      { name: "Nifty Weekly", margin: "₹1,80,000", saves: 5 },
    ],
  },
  {
    name: "Nikita Mehra",
    avatar: man,
    sebiId: "SEBI INH000017381",
    strategies: [
      { name: "Option Scalper", margin: "₹2,20,000", saves: 9 },
      { name: "Delta Neutral", margin: "₹2,40,000", saves: 6 },
      { name: "Monthly Builder", margin: "₹2,80,000", saves: 12 },
      { name: "Index Spread", margin: "₹3,00,000", saves: 4 },
    ],
  },
];

const RaAlgosPage = () => {
  const [activeTab, setActiveTab] = useState("Buy");

  return (
    <div className="w-full px-4 md:px-6 py-6 rounded-2xl border border-[#E4EAF0] dark:border-[#2D2F36]">
      <h2 className="text-xl font-semibold text-[#2E3A59] dark:text-white mb-1">
        Ra Algos
      </h2>
      <p className="text-sm text-[#718EBF] dark:text-gray-400 mb-4">
        Lorem Ipsum donor
      </p>

      <div className="flex space-x-3 mb-6">
        {["Buy", "Sell"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === tab
                ? "bg-[#0096FF] text-white"
                : "bg-[#F5F8FA] dark:bg-[#2D2F36] text-[#2E3A59] dark:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <RaAlgosData algos={mockAlgos} />
    </div>
  );
};

export default RaAlgosPage;
