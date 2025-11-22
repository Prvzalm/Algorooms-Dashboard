import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { searchIcon } from "../../../assets";
import { useSearchInstrument } from "../../../hooks/strategyHooks";
import PrimaryButton from "../../common/PrimaryButton";

const segmentTypes = [
  "Option",
  "Equity",
  "Future",
  // "Indices", "CDS", "MCX"
];

const EQUITY_MULTI_LIMIT = 50;

const InstrumentModal = ({
  visible,
  onClose,
  selected,
  setSelected,
  selectedList = [],
  setSelectedList = () => {},
  selectedStrategyTypes = [],
}) => {
  const modalRef = useRef(null);
  // send a single space when input is empty so API returns "all" instruments
  const [searchQuery, setSearchQuery] = useState("");
  const [segmentType, setSegmentType] = useState("Option");

  const {
    data: instruments = [],
    isLoading,
    isError,
  } = useSearchInstrument(segmentType, searchQuery, visible);

  const isDisabledType = (type) => {
    const st = selectedStrategyTypes?.[0];
    if (st === "time") return type !== "Option";
    if (st === "indicator") return type === "CDS" || type === "MCX";
    return false;
  };

  const multiMode =
    selectedStrategyTypes?.[0] === "indicator" &&
    (segmentType === "Equity" || segmentType === "Future");

  const toggleSelect = (item) => {
    if (multiMode) {
      setSelected(""); // clear single
      const exists = selectedList.some(
        (i) => i.InstrumentToken === item.InstrumentToken
      );
      if (exists) {
        setSelectedList(
          selectedList.filter((i) => i.InstrumentToken !== item.InstrumentToken)
        );
      } else {
        if (
          segmentType === "Equity" &&
          selectedList.length >= EQUITY_MULTI_LIMIT
        ) {
          toast.error(
            `You can select up to ${EQUITY_MULTI_LIMIT} equity instruments.`
          );
          return;
        }
        setSelectedList([
          ...selectedList,
          { ...item, SegmentType: segmentType },
        ]);
      }
    } else {
      setSelected({ ...item, SegmentType: segmentType });
    }
  };

  // if strategy type changes and current segment is not allowed, switch to Option
  useEffect(() => {
    if (isDisabledType(segmentType)) {
      setSegmentType("Option");
    }
  }, [selectedStrategyTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-4 md:p-6 w-[95%] max-w-md dark:bg-[#15171C] relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-6 bg-[#F5F8FA] dark:bg-[#1E2027]">
          <img src={searchIcon} alt="" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              // if user clears input (or only spaces), send single space to fetch all
              setSearchQuery(e.target.value)
            }
            placeholder="Search scripts: i.e. State Bank of India, Banknifty, Crudeoil"
            className="bg-transparent outline-none flex-1 text-sm text-gray-700 dark:text-white placeholder:text-gray-400"
          />
        </div>

        <div className="space-x-3 text-sm mb-6 flex flex-wrap">
          {segmentTypes.map((type) => (
            <label
              key={type}
              className={`cursor-pointer ${
                isDisabledType(type) ? "opacity-50" : ""
              }`}
            >
              <input
                type="radio"
                name="type"
                value={type}
                checked={segmentType === type}
                onChange={() => !isDisabledType(type) && setSegmentType(type)}
                className="mr-1"
                disabled={isDisabledType(type)}
              />
              {type}
            </label>
          ))}
        </div>

        {segmentType === "Future" && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              * Qty has to be filled after seeing it from your broker account
              for NFO
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6 max-h-64 overflow-y-auto">
          {isLoading ? (
            <p className="col-span-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading...
            </p>
          ) : isError ? (
            <p className="col-span-2 text-center text-sm text-red-500">
              Failed to load instruments.
            </p>
          ) : instruments.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-gray-400">
              No instruments found.
            </p>
          ) : (
            instruments.map((item) => {
              const isActive = multiMode
                ? selectedList.some(
                    (i) => i.InstrumentToken === item.InstrumentToken
                  )
                : selected?.Name === item.Name;
              return (
                <button
                  type="button"
                  key={item.InstrumentToken}
                  onClick={() => toggleSelect(item)}
                  className={`border rounded-lg py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-[#E8EDFF] text-[#1B44FE] dark:bg-[#2A2D34] dark:text-blue-300 border-[#1B44FE]/40"
                      : "text-gray-700 hover:bg-[#E8EDFF] dark:text-white dark:hover:bg-[#2A2D34]"
                  } dark:border-[#1E2027]`}
                >
                  {item.Name}
                </button>
              );
            })
          )}
        </div>

        <PrimaryButton
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-lg font-semibold sticky bottom-0"
        >
          Save
        </PrimaryButton>
      </div>
    </div>
  );
};

export default InstrumentModal;
