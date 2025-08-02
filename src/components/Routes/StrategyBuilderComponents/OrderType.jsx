import { useState } from "react";
import TradeSettings from "./TradeSettings";

const OrderType = ({ selectedStrategyTypes }) => {
  const [selectedDays, setSelectedDays] = useState(["MON"]);
  const [selectedLeg, setSelectedLeg] = useState("L1");
  const [startTime, setStartTime] = useState("09:16");
  const [squareOffTime, setSquareOffTime] = useState("15:14");

  const orderTypes = ["MIS", "CNC", "BTST"];
  const days = ["MON", "TUE", "WED", "THU", "FRI"];
  const legs = ["L1", "L2"];

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="p-4 border rounded-2xl space-y-4 dark:border-[#1E2027] dark:bg-[#15171C]">
      <div className="text-lg font-semibold text-black dark:text-white">
        Order Type
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Select your type
      </p>

      <div className="flex items-center space-x-4 text-sm">
        {orderTypes.map((type) => (
          <label
            key={type}
            className="flex items-center space-x-2 dark:text-gray-300"
          >
            <input type="checkbox" />
            <span>{type}</span>
          </label>
        ))}
        <div className="ml-auto">
          <label className="text-gray-500 dark:text-gray-400 block text-xs mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#2C2F36]"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 text-sm">
        <div>
          <label className="text-gray-500 dark:text-gray-400 block text-xs mb-1">
            Square Off
          </label>
          <input
            type="time"
            value={squareOffTime}
            onChange={(e) => setSquareOffTime(e.target.value)}
            className="border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#2C2F36]"
          />
        </div>
        <div className="overflow-x-auto w-full">
          <div className="flex space-x-1 ml-4 min-w-max">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-2 rounded border text-xs transition ${
                  selectedDays.includes(day)
                    ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-[#0F3F62]"
                    : "bg-white text-gray-500 border-gray-300 dark:bg-[#1E2027] dark:text-gray-400 dark:border-[#2C2F36]"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedStrategyTypes?.[0] === "indicator" && <TradeSettings />}

      <div className="text-sm font-semibold text-black dark:text-white">
        Strategy Legs
      </div>
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {legs.map((leg) => (
            <button
              key={leg}
              onClick={() => setSelectedLeg(leg)}
              className={`md:px-12 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                selectedLeg === leg
                  ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-[#0F3F62]"
                  : "bg-white text-gray-500 border-gray-300 dark:bg-[#1E2027] dark:text-gray-400 dark:border-[#2C2F36]"
              }`}
            >
              {leg}
            </button>
          ))}
        </div>
        <button className="ml-auto bg-[#0096FF] hover:bg-blue-600 text-white md:px-8 px-4 py-3 rounded-lg text-sm font-medium transition">
          + Add
        </button>
      </div>
    </div>
  );
};

export default OrderType;
