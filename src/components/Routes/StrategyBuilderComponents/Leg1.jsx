import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FiTrash2 } from "react-icons/fi";
import { leg1CopyIcon } from "../../../assets";

const Leg1 = ({ selectedStrategyTypes }) => {
  const { setValue } = useFormContext();
  const [position, setPosition] = useState("BUY");
  const [optionType, setOptionType] = useState("Call");
  const [prePunchSL, setPrePunchSL] = useState(false);
  const [signalCandleCondition, setSignalCandleCondition] = useState(false);

  const strikeOptions = ["ATM"];
  const expiryOptions = ["WEEKLY", "MONTHLY"];
  const criteriaOptions = ["Strike Type"];
  const slOptions = ["SL%", "SL pt"];
  const tpOptions = ["TP%", "TP pt"];
  const onPriceOptions = ["On Price", "On Close"];
  const conditionOptions = ["CE", "PE"];

  useEffect(() => {
    const strikeType = optionType === "Call" ? "CE" : "PE";
    setValue(
      "StrategyScriptList",
      [
        {
          InstrumentToken: "",
          Qty: 0,
          LongEquationoptionStrikeList: [
            {
              TransactionType: position,
              StrikeType: strikeType,
              StrikeValueType: 0,
              StrikeValue: 0,
              Qty: 0,
              lotSize: 0,
              TargetType: "tgpr",
              TargetTypeId: "ONPRICE",
              SLType: "slpr",
              Target: 0,
              StopLoss: 0,
              TargetActionTypeId: "ONPRICE",
              SLActionTypeId: "ONPRICE",
              ExpiryType: "WEEKLY",
              reEntry: {
                isRentry: false,
                RentryType: "",
                TradeCycle: 0,
                RentryActionTypeId: "",
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
              strikeTypeobj: {
                type: "ATM",
                StrikeValue: 0,
                RangeFrom: 0,
                RangeTo: 0,
              },
              isTrailSL: false,
              IsRecursive: false,
              IsMoveSLCTC: false,
              isExitAll: false,
              IsPriceDiffrenceConstrant: false,
              PriceDiffrenceConstrantValue: 0,
              isPrePunchSL: false,
            },
          ],
          ShortEquationoptionStrikeList: [
            {
              TransactionType: position === "BUY" ? "SELL" : "BUY",
              StrikeType: strikeType,
              StrikeValueType: 0,
              StrikeValue: 0,
              Qty: 0,
              lotSize: 0,
              TargetType: "tgpr",
              TargetTypeId: "ONPRICE",
              SLType: "slpr",
              Target: 0,
              StopLoss: 0,
              TargetActionTypeId: "ONPRICE",
              SLActionTypeId: "ONPRICE",
              ExpiryType: "WEEKLY",
              reEntry: {
                isRentry: false,
                RentryType: "",
                TradeCycle: 0,
                RentryActionTypeId: "",
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
              strikeTypeobj: {
                type: "ATM",
                StrikeValue: 0,
                RangeFrom: 0,
                RangeTo: 0,
              },
              isTrailSL: false,
              IsRecursive: false,
              IsMoveSLCTC: false,
              isExitAll: false,
              IsPriceDiffrenceConstrant: false,
              PriceDiffrenceConstrantValue: 0,
              isPrePunchSL: false,
            },
          ],
          StrikeTickValue: 0,
        },
      ],
      { shouldDirty: true }
    );
  }, [position, optionType, setValue]);

  return (
    <div className="p-4 border rounded-2xl space-y-4 dark:border-[#1E2027] dark:bg-[#15171C] text-black dark:text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Leg1</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Lorem Ipsum donor
          </p>
        </div>
        <button className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          View All Strategies
        </button>
      </div>

      <div className="border rounded-xl p-4 space-y-4 border-gray-200 dark:border-[#1E2027] dark:bg-[#1E2027]">
        {selectedStrategyTypes?.[0] === "indicator" && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block mb-1 text-green-600 font-medium">
                When Long Condition
              </label>
              <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
                {conditionOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-red-500 font-medium">
                When Short Condition
              </label>
              <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
                {conditionOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Qty
            </label>
            <input
              type="text"
              defaultValue="75"
              className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Position
            </label>
            <div className="flex space-x-2">
              {["BUY", "SELL"].map((pos) => (
                <button
                  type="button"
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`w-1/2 border rounded px-3 py-2 font-semibold transition ${
                    position === pos
                      ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-[#0F3F62]"
                      : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-[#2C2F36] border-gray-300 dark:border-[#2C2F36]"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Option Type
            </label>
            <div className="flex space-x-2">
              {["Call", "Put"].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setOptionType(type)}
                  className={`w-1/2 border rounded px-3 py-2 font-semibold transition ${
                    optionType === type
                      ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-[#0F3F62]"
                      : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-[#2C2F36] border-gray-300 dark:border-[#2C2F36]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Expiry
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {expiryOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Select Strike Criteria
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {criteriaOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Strike Type
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {strikeOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Stop Loss
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {slOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Qty
            </label>
            <input
              type="text"
              defaultValue="30"
              className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              On Price
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {onPriceOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              TP
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {tpOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              Qty
            </label>
            <input
              type="text"
              defaultValue="0"
              className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-600 dark:text-gray-400">
              On Price
            </label>
            <select className="border rounded px-3 py-2 text-sm w-full dark:bg-[#15171C] dark:text-white dark:border-[#2C2F36]">
              {onPriceOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div
          className={`flex ${
            selectedStrategyTypes?.[0] === "indicator"
              ? "justify-between"
              : "justify-end"
          } items-center pt-2`}
        >
          {selectedStrategyTypes?.[0] === "indicator" && (
            <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
              <input
                type="checkbox"
                checked={prePunchSL}
                onChange={() => setPrePunchSL(!prePunchSL)}
              />
              <span>
                Pre Punch SL{" "}
                <span className="text-[11px]">(Advance Feature)</span>
              </span>
            </label>
          )}

          <div className="flex space-x-4 text-xl text-gray-400 dark:text-gray-500">
            <FiTrash2 className="text-red-500 cursor-pointer" />
            <img src={leg1CopyIcon} />
          </div>
        </div>
      </div>

      {selectedStrategyTypes?.[0] === "indicator" && (
        <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center space-x-2">
          <input
            type="checkbox"
            checked={signalCandleCondition}
            onChange={() => setSignalCandleCondition(!signalCandleCondition)}
          />
          <span>
            Add Signal Candle Condition{" "}
            <span className="text-[11px] text-gray-400">(Optional)</span>
          </span>
        </label>
      )}
    </div>
  );
};

export default Leg1;
