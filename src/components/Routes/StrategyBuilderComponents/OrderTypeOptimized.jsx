import { useEffect, useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";

const ORDER_TYPES = ["MIS", "CNC", "BTST"];
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

// Default strike template
const createDefaultStrike = () => ({
  TransactionType: "SELL",
  StrikeType: "CE",
  StrikeValueType: 0,
  StrikeValue: 0,
  SLActionTypeId: "ONPRICE",
  TargetActionTypeId: "ONPRICE",
  TargetType: "tgpr",
  SLType: "slpr",
  Target: "0",
  StopLoss: "30",
  Qty: "0",
  ExpiryType: "WEEKLY",
  strikeTypeobj: { type: "ATM", StrikeValue: 0, RangeFrom: 0, RangeTo: 0 },
  isTrailSL: false,
  IsMoveSLCTC: false,
  isExitAll: false,
  IsPriceDiffrenceConstrant: false,
  PriceDiffrenceConstrantValue: 0,
  isPrePunchSL: false,
  reEntry: {
    isRentry: false,
    RentryType: "REN",
    TradeCycle: 0,
    RentryActionTypeId: "ON_CLOSE",
  },
  waitNTrade: {
    isWaitnTrade: false,
    isPerPt: "wtpr_+",
    typeId: "wtpr_+",
    MovementValue: 0,
  },
  TrailingSL: {
    TrailingType: "tslpr",
    InstrumentMovementValue: 0,
    TrailingValue: 0,
  },
  lotSize: 0,
});

const OrderType = ({ selectedStrategyTypes, hideLeg1 }) => {
  const { setValue, getValues, watch } = useFormContext();

  // Local state for UI
  const [orderConfig, setOrderConfig] = useState({
    selectedDays: ["MON", "TUE", "WED", "THU", "FRI"],
    startTime: "09:16",
    squareOffTime: "15:15",
    productType: "MIS",
    selectedLeg: "L1",
    legs: ["L1"],
  });

  // Watch form values for sync
  const activeLegIndex = watch("ActiveLegIndex") ?? 0;

  // Prefill from form values (edit mode)
  useEffect(() => {
    const vDays = getValues("ActiveDays");
    const vStart = getValues("TradeStartTime");
    const vSq = getValues("AutoSquareOffTime") || getValues("TradeStopTime");
    const prod = getValues("ProductType");
    const btst = getValues("isBtSt");

    const newConfig = { ...orderConfig };

    if (Array.isArray(vDays) && vDays.length) {
      newConfig.selectedDays = vDays;
    }
    if (vStart) newConfig.startTime = vStart;
    if (vSq) newConfig.squareOffTime = vSq;

    // Product type mapping
    if (prod === 0) newConfig.productType = "MIS";
    else if (prod === 1 && btst) newConfig.productType = "BTST";
    else if (prod === 1 && !btst) newConfig.productType = "CNC";

    setOrderConfig(newConfig);
  }, []); // Only run on mount

  // Initialize legs from form data
  useEffect(() => {
    const scripts = getValues("StrategyScriptList") || [];
    const firstScript = scripts[0] || {};
    const longList = Array.isArray(firstScript.LongEquationoptionStrikeList)
      ? firstScript.LongEquationoptionStrikeList
      : [];

    const count = Math.max(1, longList.length);
    const newLegs = Array.from({ length: count }, (_, i) => `L${i + 1}`);

    setOrderConfig((prev) => ({
      ...prev,
      legs: newLegs,
      selectedLeg: `L${activeLegIndex + 1}`,
    }));

    // Ensure ActiveLegIndex exists
    if (getValues("ActiveLegIndex") === undefined) {
      setValue("ActiveLegIndex", 0, { shouldDirty: false });
    }
  }, []); // Only run on mount

  // Update config function
  const updateOrderConfig = useCallback((updates) => {
    setOrderConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Sync form values when config changes
  useEffect(() => {
    setValue("ActiveDays", orderConfig.selectedDays, { shouldDirty: true });
  }, [orderConfig.selectedDays, setValue]);

  useEffect(() => {
    setValue("TradeStartTime", orderConfig.startTime, { shouldDirty: true });
  }, [orderConfig.startTime, setValue]);

  useEffect(() => {
    setValue("AutoSquareOffTime", orderConfig.squareOffTime, {
      shouldDirty: true,
    });
  }, [orderConfig.squareOffTime, setValue]);

  useEffect(() => {
    const productTypeMap = { MIS: 0, CNC: 1, BTST: 1 };
    setValue("ProductType", productTypeMap[orderConfig.productType], {
      shouldDirty: true,
    });
    setValue("isBtSt", orderConfig.productType === "BTST", {
      shouldDirty: true,
    });
  }, [orderConfig.productType, setValue]);

  // Sync selectedLeg with form ActiveLegIndex
  useEffect(() => {
    const index = Math.max(
      0,
      orderConfig.legs.indexOf(orderConfig.selectedLeg)
    );
    setValue("ActiveLegIndex", index, { shouldDirty: true });
  }, [orderConfig.selectedLeg, orderConfig.legs, setValue]);

  // Handle day toggle
  const toggleDay = useCallback(
    (day) => {
      updateOrderConfig({
        selectedDays: orderConfig.selectedDays.includes(day)
          ? orderConfig.selectedDays.filter((d) => d !== day)
          : [...orderConfig.selectedDays, day],
      });
    },
    [orderConfig.selectedDays, updateOrderConfig]
  );

  // Handle add leg
  const handleAddLeg = useCallback(() => {
    const newLegIndex = orderConfig.legs.length;
    const newLegName = `L${newLegIndex + 1}`;

    // Update form data in next tick to avoid state conflicts
    setTimeout(() => {
      try {
        const scripts = getValues("StrategyScriptList") || [];
        const base = { ...(scripts[0] || {}) };

        // Ensure arrays exist
        const longArr = Array.isArray(base.LongEquationoptionStrikeList)
          ? [...base.LongEquationoptionStrikeList]
          : [];
        const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
          ? [...base.ShortEquationoptionStrikeList]
          : [];

        // Add new strikes
        const isIndicator = selectedStrategyTypes?.[0] === "indicator";
        longArr.push(createDefaultStrike());

        if (isIndicator) {
          shortArr.push(createDefaultStrike());
        }

        // Update form
        base.LongEquationoptionStrikeList = longArr;
        if (isIndicator) {
          base.ShortEquationoptionStrikeList = shortArr;
        }

        setValue("StrategyScriptList", [base], { shouldDirty: true });
        setValue("ActiveLegIndex", newLegIndex, { shouldDirty: true });

        // Update local state
        updateOrderConfig({
          legs: [...orderConfig.legs, newLegName],
          selectedLeg: newLegName,
        });
      } catch (err) {
        console.error("Add leg error:", err);
      }
    }, 0);
  }, [
    orderConfig.legs,
    selectedStrategyTypes,
    setValue,
    getValues,
    updateOrderConfig,
  ]);

  // Handle remove leg
  const handleRemoveLeg = useCallback(
    (removeIndex) => {
      if (orderConfig.legs.length <= 1) return;

      setTimeout(() => {
        try {
          const scripts = getValues("StrategyScriptList") || [];
          const base = { ...(scripts[0] || {}) };

          const longArr = Array.isArray(base.LongEquationoptionStrikeList)
            ? [...base.LongEquationoptionStrikeList]
            : [];
          const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
            ? [...base.ShortEquationoptionStrikeList]
            : [];

          // Remove strikes at index
          if (removeIndex >= 0 && removeIndex < longArr.length) {
            longArr.splice(removeIndex, 1);
          }
          if (
            shortArr.length &&
            removeIndex >= 0 &&
            removeIndex < shortArr.length
          ) {
            shortArr.splice(removeIndex, 1);
          }

          // Ensure at least one strike remains
          const isIndicator = selectedStrategyTypes?.[0] === "indicator";
          if (longArr.length === 0) {
            longArr.push(createDefaultStrike());
            if (isIndicator) {
              shortArr.push(createDefaultStrike());
            }
          }

          // Update form
          base.LongEquationoptionStrikeList = longArr;
          if (isIndicator) {
            base.ShortEquationoptionStrikeList = shortArr;
          }

          setValue("StrategyScriptList", [base], { shouldDirty: true });

          // Calculate new legs and selection
          const newCount = longArr.length;
          const newLegs = Array.from(
            { length: newCount },
            (_, i) => `L${i + 1}`
          );

          const currentIndex = Math.max(
            0,
            orderConfig.legs.indexOf(orderConfig.selectedLeg)
          );
          let newSelectedIndex = currentIndex;

          if (removeIndex === currentIndex) {
            newSelectedIndex = Math.min(removeIndex, newCount - 1);
          } else if (removeIndex < currentIndex) {
            newSelectedIndex = Math.max(0, currentIndex - 1);
          }

          setValue("ActiveLegIndex", newSelectedIndex, { shouldDirty: true });

          updateOrderConfig({
            legs: newLegs,
            selectedLeg: `L${newSelectedIndex + 1}`,
          });
        } catch (err) {
          console.error("Remove leg error:", err);
        }
      }, 0);
    },
    [
      orderConfig.legs,
      orderConfig.selectedLeg,
      selectedStrategyTypes,
      setValue,
      getValues,
      updateOrderConfig,
    ]
  );

  return (
    <div className="p-4 border rounded-2xl space-y-4 dark:border-[#1E2027] dark:bg-[#15171C]">
      <div className="text-lg font-semibold text-black dark:text-white">
        Order Type
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Select your order configuration
      </p>

      {/* Product Type and Start Time */}
      <div className="flex items-center space-x-4 text-sm">
        {ORDER_TYPES.map((type) => (
          <label
            key={type}
            className="flex items-center space-x-2 dark:text-gray-300"
          >
            <input
              type="radio"
              name="productType"
              checked={orderConfig.productType === type}
              onChange={() => updateOrderConfig({ productType: type })}
            />
            <span>{type}</span>
          </label>
        ))}
        <div className="ml-auto">
          <label className="text-gray-500 dark:text-gray-400 block text-xs mb-1">
            Start Time
          </label>
          <input
            type="time"
            value={orderConfig.startTime}
            onChange={(e) => updateOrderConfig({ startTime: e.target.value })}
            className="border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#2C2F36]"
          />
        </div>
      </div>

      {/* Square Off Time and Days */}
      <div className="flex items-center space-x-4 text-sm">
        <div>
          <label className="text-gray-500 dark:text-gray-400 block text-xs mb-1">
            Square Off
          </label>
          <input
            type="time"
            value={orderConfig.squareOffTime}
            onChange={(e) =>
              updateOrderConfig({ squareOffTime: e.target.value })
            }
            className="border rounded px-3 py-2 text-sm dark:bg-[#1E2027] dark:text-white dark:border-[#2C2F36]"
          />
        </div>
        <div className="overflow-x-auto w-full">
          <div className="flex space-x-1 ml-4 min-w-max">
            {DAYS.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-2 rounded border text-xs transition ${
                  orderConfig.selectedDays.includes(day)
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

      {/* Strategy Legs */}
      {!hideLeg1 && (
        <>
          <div className="text-sm font-semibold text-black dark:text-white">
            Strategy Legs
          </div>
          <div className="mt-2 overflow-x-auto">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 pt-2">
              <div className="flex flex-wrap gap-2 flex-1 mb-2 md:mb-0">
                {orderConfig.legs.map((leg, idx) => (
                  <div key={leg} className="relative">
                    <button
                      type="button"
                      onClick={() => updateOrderConfig({ selectedLeg: leg })}
                      className={`md:px-12 px-6 py-2 rounded-lg text-sm font-medium border transition ${
                        orderConfig.selectedLeg === leg
                          ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-[#0F3F62]"
                          : "bg-white text-gray-500 border-gray-300 dark:bg-[#1E2027] dark:text-gray-400 dark:border-[#2C2F36]"
                      }`}
                    >
                      {leg}
                    </button>
                    {orderConfig.legs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLeg(idx);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow hover:bg-red-600 transition"
                        aria-label={`Remove ${leg}`}
                        title="Remove leg"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="bg-[#0096FF] hover:bg-blue-600 text-white md:px-8 px-6 py-3 rounded-lg text-sm font-medium transition"
                onClick={handleAddLeg}
              >
                + Add Leg
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderType;
