import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import ComingSoonOverlay from "../../common/ComingSoonOverlay";
import TradeSettings from "./TradeSettings";

const OrderType = ({ selectedStrategyTypes, comingSoon = false }) => {
  const { setValue, watch } = useFormContext();

  // Use form values directly - no local state needed
  const selectedDays = watch("ActiveDays") || [
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
  ];
  const startTime = watch("TradeStartTime") || "09:16";
  const tradeStopTime = watch("TradeStopTime") || "15:15";
  const squareOffTime = watch("AutoSquareOffTime") || "15:15";
  const productTypeNum = Number(watch("ProductType")) || 0;
  const isBtSt = watch("isBtSt") || false;
  const entryDays = watch("EntryDaysBeforExpiry") ?? 0;
  const exitDays = watch("ExitDaysBeforExpiry") ?? 0;
  const strategySegmentType = watch("StrategySegmentType") || "";
  const normalizedSegment = strategySegmentType.toLowerCase();
  const isEquityInstrument = normalizedSegment === "equity";
  const isFutureInstrument = normalizedSegment === "future";
  const hideDeliveryProducts = isEquityInstrument || isFutureInstrument;

  // Derive display value from form
  const productType =
    productTypeNum === 0
      ? "MIS"
      : productTypeNum === 1 && isBtSt
      ? "BTST"
      : productTypeNum === 1 && !isBtSt
      ? "CNC"
      : "MIS";

  const strategyScripts = watch("StrategyScriptList") || [];
  const cncExpiryType =
    strategyScripts?.[0]?.LongEquationoptionStrikeList?.[0]?.ExpiryType ||
    strategyScripts?.[0]?.ShortEquationoptionStrikeList?.[0]?.ExpiryType ||
    "WEEKLY";

  // CNC Settings state (these are UI-only, not in form)
  const [showCNCSettings, setShowCNCSettings] = useState(true);

  const cncMaxDays = (() => {
    if (cncExpiryType === "NEXTWEEKLY") return 14;
    if (cncExpiryType === "MONTHLY") return 30;
    return 4; // WEEKLY default
  })();

  useEffect(() => {
    if (productType !== "CNC") return;
    if (entryDays > cncMaxDays) {
      setValue("EntryDaysBeforExpiry", cncMaxDays, { shouldDirty: true });
    }
    if (exitDays > cncMaxDays) {
      setValue("ExitDaysBeforExpiry", cncMaxDays, { shouldDirty: true });
    }
  }, [productType, cncMaxDays, entryDays, exitDays, setValue]);

  const orderTypes = hideDeliveryProducts ? ["MIS"] : ["MIS", "CNC", "BTST"];

  useEffect(() => {
    if (hideDeliveryProducts && productType !== "MIS") {
      setValue("ProductType", 0, { shouldDirty: true });
      setValue("isBtSt", false, { shouldDirty: true });
    }
  }, [hideDeliveryProducts, productType, setValue]);
  const days = ["MON", "TUE", "WED", "THU", "FRI"];

  const toggleDay = (day) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setValue("ActiveDays", newDays, { shouldDirty: true });
  };

  const handleProductTypeChange = (type) => {
    const productTypeMap = { MIS: 0, CNC: 1, BTST: 1 };
    setValue("ProductType", productTypeMap[type], { shouldDirty: true });
    setValue("isBtSt", type === "BTST", { shouldDirty: true });
    if (type === "CNC") {
      setValue("EntryDaysBeforExpiry", 0, { shouldDirty: true });
      setValue("ExitDaysBeforExpiry", 0, { shouldDirty: true });
    }
  };

  return (
    <div className="relative">
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
                onChange={() => handleProductTypeChange(type)}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>

        {/* {(productType === "CNC" || productType === "BTST") && (
          <div className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
            CNC & BTST features are not available in live market, but you can
            use them for backtest
          </div>
        )} */}

        {productType === "CNC" && !hideDeliveryProducts && (
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
                    Entry: {entryDays} trading days before expiry
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={cncMaxDays}
                    value={Math.min(entryDays, cncMaxDays)}
                    onChange={(e) =>
                      setValue("EntryDaysBeforExpiry", Number(e.target.value), {
                        shouldDirty: true,
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                        ((Math.min(entryDays, cncMaxDays) || 0) / cncMaxDays) *
                        100
                      }%, #e5e7eb ${
                        ((Math.min(entryDays, cncMaxDays) || 0) / cncMaxDays) *
                        100
                      }%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0</span>
                    <span>
                      {cncMaxDays > 4 ? Math.round(cncMaxDays / 3) : 1}
                    </span>
                    <span>
                      {cncMaxDays > 4 ? Math.round((2 * cncMaxDays) / 3) : 2}
                    </span>
                    <span>{cncMaxDays}</span>
                  </div>
                </div>

                {/* Exit Days Slider */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Exit: {exitDays} trading days before expiry
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={cncMaxDays}
                    value={Math.min(exitDays, cncMaxDays)}
                    onChange={(e) =>
                      setValue("ExitDaysBeforExpiry", Number(e.target.value), {
                        shouldDirty: true,
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                        ((Math.min(exitDays, cncMaxDays) || 0) / cncMaxDays) *
                        100
                      }%, #e5e7eb ${
                        ((Math.min(exitDays, cncMaxDays) || 0) / cncMaxDays) *
                        100
                      }%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0</span>
                    <span>
                      {cncMaxDays > 4 ? Math.round(cncMaxDays / 3) : 1}
                    </span>
                    <span>
                      {cncMaxDays > 4 ? Math.round((2 * cncMaxDays) / 3) : 2}
                    </span>
                    <span>{cncMaxDays}</span>
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
              onChange={(e) =>
                setValue("TradeStartTime", e.target.value, {
                  shouldDirty: true,
                })
              }
              className="border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#2C2F36]"
            />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 block text-xs mb-1">
              {productType === "BTST" ? "Next Day Square Off" : "Square Off"}
            </label>
            <input
              type="time"
              value={squareOffTime}
              onChange={(e) => {
                setValue("AutoSquareOffTime", e.target.value, {
                  shouldDirty: true,
                });
              }}
              className="border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#2C2F36]"
            />
          </div>
        </div>

        <div className="flex items-center text-sm">
          <div className="w-full">
            <div className="flex flex-wrap gap-1 min-w-0">
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

        {selectedStrategyTypes?.[0] === "indicator" && (
          <TradeSettings selectedStrategyTypes={selectedStrategyTypes} />
        )}
      </div>
      {comingSoon && <ComingSoonOverlay />}
    </div>
  );
};

export default OrderType;
