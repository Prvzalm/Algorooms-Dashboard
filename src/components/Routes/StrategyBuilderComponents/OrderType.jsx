import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import TradeSettings from "./TradeSettings";

const OrderType = ({ selectedStrategyTypes, hideLeg1 }) => {
  const { setValue, getValues } = useFormContext();
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
  const [legs, setLegs] = useState(["L1"]);

  // helper: default strike row used when adding/removing legs
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
    PriceDiffrenceConstrantValue: "0",
    isPrePunchSL: false,
    reEntry: {
      isRentry: false,
      RentryType: "REN",
      TradeCycle: "0",
      RentryActionTypeId: "ON_CLOSE",
    },
    waitNTrade: {
      isWaitnTrade: false,
      isPerPt: "wt_eq",
      typeId: "wt_eq",
      MovementValue: "0",
    },
    TrailingSL: {
      TrailingType: "tslpr",
      InstrumentMovementValue: "0",
      TrailingValue: "0",
    },
    lotSize: 0,
  });

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

  // Initialize legs from form or create first leg
  useEffect(() => {
    const scripts = getValues("StrategyScriptList") || [];
    const firstScript = scripts[0] || {};
    const longList = Array.isArray(firstScript.LongEquationoptionStrikeList)
      ? firstScript.LongEquationoptionStrikeList
      : [];
    const count = Math.max(1, longList.length);
    const newLegs = Array.from({ length: count }, (_, i) => `L${i + 1}`);
    setLegs(newLegs);
    // ensure ActiveLegIndex exists
    if (getValues("ActiveLegIndex") === undefined) {
      setValue("ActiveLegIndex", 0, { shouldDirty: false });
    }
    setSelectedLeg(`L${(getValues("ActiveLegIndex") ?? 0) + 1}`);
  }, []);

  // sync selectedLeg with form ActiveLegIndex
  useEffect(() => {
    const index = Math.max(0, legs.indexOf(selectedLeg));
    setValue("ActiveLegIndex", index, { shouldDirty: true });
  }, [selectedLeg, legs, setValue]);

  const handleAddLeg = () => {
    try {
      // Get current values once
      const idx = legs.length;
      const nextLegName = `L${idx + 1}`;

      // Create a function to update the form to prevent React state update loops
      const updateFormState = () => {
        // Update legs state
        setLegs((prevLegs) => [...prevLegs, nextLegName]);
        setSelectedLeg(nextLegName);

        // Get latest script data
        const scripts = getValues("StrategyScriptList") || [];
        const base = { ...(scripts[0] || {}) };

        // Ensure arrays exist
        const longArr = Array.isArray(base.LongEquationoptionStrikeList)
          ? [...base.LongEquationoptionStrikeList]
          : [];

        const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
          ? [...base.ShortEquationoptionStrikeList]
          : [];

        // Create new strike
        const newStrike = createDefaultStrike();

        // Add strikes
        const isIndicator = selectedStrategyTypes?.[0] === "indicator";
        longArr.push(newStrike);

        if (isIndicator) {
          shortArr.push({ ...newStrike });
        }

        // Update form with new data
        base.LongEquationoptionStrikeList = longArr;
        if (isIndicator) {
          base.ShortEquationoptionStrikeList = shortArr;
        }

        setValue("StrategyScriptList", [base], { shouldDirty: true });
        setValue("ActiveLegIndex", idx, { shouldDirty: true });
      };

      // Use setTimeout to avoid cascading updates in the same render cycle
      setTimeout(updateFormState, 0);
    } catch (err) {
      console.error("Add leg error", err);
    }
  };

  const handleRemoveLeg = (removeIndex) => {
    try {
      if (legs.length <= 1) return; // must keep at least one leg

      // Create a function to update state in a single batch
      const updateFormState = () => {
        const scripts = getValues("StrategyScriptList") || [];
        const base = { ...(scripts[0] || {}) };

        // Get arrays and ensure they are properly initialized
        const longArr = Array.isArray(base.LongEquationoptionStrikeList)
          ? [...base.LongEquationoptionStrikeList]
          : [];

        const shortArr = Array.isArray(base.ShortEquationoptionStrikeList)
          ? [...base.ShortEquationoptionStrikeList]
          : [];

        // Remove items at index
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

        // Handle edge case of removing all legs
        const isIndicator = selectedStrategyTypes?.[0] === "indicator";
        if (longArr.length === 0) {
          longArr.push(createDefaultStrike());
          if (isIndicator) {
            shortArr.push(createDefaultStrike());
          }
        }

        // Update form data
        base.LongEquationoptionStrikeList = longArr;
        if (isIndicator) {
          base.ShortEquationoptionStrikeList = shortArr;
        }

        // Calculate new leg names and selected index
        const newCount = longArr.length;
        const newLegs = Array.from({ length: newCount }, (_, i) => `L${i + 1}`);

        const currentIndex = Math.max(0, legs.indexOf(selectedLeg));
        let newSelectedIndex = currentIndex;

        // Adjust selected index if needed
        if (removeIndex === currentIndex) {
          newSelectedIndex = Math.min(removeIndex, newCount - 1);
        } else if (removeIndex < currentIndex) {
          newSelectedIndex = Math.max(0, currentIndex - 1);
        }

        // Apply all updates
        setValue("StrategyScriptList", [base], { shouldDirty: true });
        setValue("ActiveLegIndex", newSelectedIndex, { shouldDirty: true });
        setLegs(newLegs);
        setSelectedLeg(`L${newSelectedIndex + 1}`);
      };

      // Use setTimeout to avoid update loops
      setTimeout(updateFormState, 0);
    } catch (err) {
      console.error("Remove leg error", err);
    }
  };

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

      {!hideLeg1 && (
        <>
          <div className="text-sm font-semibold text-black dark:text-white">
            Strategy Legs
          </div>
          <div className="mt-2 overflow-x-auto">
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 pt-2">
              <div className="flex flex-wrap gap-2 flex-1 mb-2 md:mb-0">
                {legs.map((leg, idx) => (
                  <div key={leg} className="relative">
                    <button
                      type="button"
                      onClick={() => setSelectedLeg(leg)}
                      className={`md:px-12 px-6 py-2 rounded-lg text-sm font-medium border transition ${
                        selectedLeg === leg
                          ? "bg-blue-50 text-blue-600 border-blue-300 dark:bg-[#0F3F62]"
                          : "bg-white text-gray-500 border-gray-300 dark:bg-[#1E2027] dark:text-gray-400 dark:border-[#2C2F36]"
                      }`}
                    >
                      {leg}
                    </button>
                    {legs.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLeg(idx);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
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
                className="bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] hover:bg-[radial-gradient(circle,_#1534E0_0%,_#4365E8_100%)] text-white md:px-8 px-6 py-3 rounded-lg text-sm font-medium transition"
                onClick={handleAddLeg}
              >
                + Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderType;
