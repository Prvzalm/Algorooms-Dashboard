import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import TradeSettings from "./TradeSettings";

const OrderType = ({ selectedStrategyTypes }) => {
  const { setValue, getValues, watch } = useFormContext();

  const [selectedDays, setSelectedDays] = useState([
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
  ]);
  const [selectedLeg, setSelectedLeg] = useState("L1");
  const [startTime, setStartTime] = useState("09:16");
  const [squareOffTime, setSquareOffTime] = useState("15:15");
  const [productType, setProductType] = useState("MIS");

  // CNC Settings state
  const [showCNCSettings, setShowCNCSettings] = useState(true);
  const [cncEntryDays, setCncEntryDays] = useState(4);
  const [cncExitDays, setCncExitDays] = useState(0);

  // Prefill from form values (edit mode)
  useEffect(() => {
    const vDays = getValues("ActiveDays");
    if (Array.isArray(vDays) && vDays.length) setSelectedDays(vDays);
    const vStart = getValues("TradeStartTime");
    if (vStart) setStartTime(vStart);
    const vSq = getValues("AutoSquareOffTime") || getValues("TradeStopTime");
    if (vSq) setSquareOffTime(vSq);
    const prod = getValues("ProductType");
    if (prod === 0) setProductType("MIS");
    if (prod === 1 && getValues("isBtSt")) setProductType("BTST");
    else if (prod === 1 && !getValues("isBtSt")) setProductType("CNC");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderTypes = ["MIS", "CNC", "BTST"];
  const days = ["MON", "TUE", "WED", "THU", "FRI"];

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  useEffect(() => {
    setValue("ActiveDays", selectedDays, { shouldDirty: true });
  }, [selectedDays, setValue]);

  useEffect(() => {
    setValue("TradeStartTime", startTime, { shouldDirty: true });
  }, [startTime, setValue]);

  useEffect(() => {
    setValue("AutoSquareOffTime", squareOffTime, { shouldDirty: true });
  }, [squareOffTime, setValue]);

  useEffect(() => {
    const productTypeMap = { MIS: 0, CNC: 1, BTST: 1 };
    setValue("ProductType", productTypeMap[productType], { shouldDirty: true });
    setValue("isBtSt", productType === "BTST", { shouldDirty: true });
  }, [productType, setValue]);

  return (
    <div className="p-4 border rounded-2xl space-y-4 bg-white dark:border-[#1E2027] dark:bg-[#131419]">
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
            <input
              type="radio"
              name="productType"
              checked={productType === type}
              onChange={() => setProductType(type)}
            />
            <span>{type}</span>
          </label>
        ))}
      </div>

      {(productType === "CNC" || productType === "BTST") && (
        <div className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
          CNC & BTST features are not available in live market, but you can use
          them for backtest
        </div>
      )}

      {productType === "CNC" && (
        <div className="border border-gray-200 dark:border-[#2C2F36] rounded-lg p-4 space-y-4">
          <button
            type="button"
            onClick={() => setShowCNCSettings(!showCNCSettings)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              CNC Settings
            </span>
            <span
              className={`transform transition-transform ${
                showCNCSettings ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {showCNCSettings && (
            <div className="space-y-6">
              {/* Entry Days Slider */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Entry: {cncEntryDays} trading days before expiry
                </label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={cncEntryDays}
                  onChange={(e) => setCncEntryDays(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                      (cncEntryDays / 4) * 100
                    }%, #e5e7eb ${(cncEntryDays / 4) * 100}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                </div>
              </div>

              {/* Exit Days Slider */}
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Exit: {cncExitDays} trading days before expiry
                </label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={cncExitDays}
                  onChange={(e) => setCncExitDays(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                      (cncExitDays / 4) * 100
                    }%, #e5e7eb ${(cncExitDays / 4) * 100}%, #e5e7eb 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
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
      </div>

      <div className="flex items-center text-sm">
        <div className="overflow-x-auto w-full">
          <div className="flex space-x-1 min-w-max">
            {days.map((day) => (
              <button
                type="button"
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
    </div>
  );
};

export default OrderType;
