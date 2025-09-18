import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  useStrategyDetailsById,
  useDeployStrategy,
} from "../../../hooks/strategyHooks";
import { useUserBrokerData } from "../../../hooks/dashboardHooks";

const Toggle = ({ checked, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-[#718EBF]">
        <span
          className={
            !checked ? "text-[#2E3A59] dark:text-white font-medium" : ""
          }
        >
          Live
        </span>
      </div>
      <button
        type="button"
        aria-label="Toggle deployment mode"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[#163D8D]" : "bg-gray-300 dark:bg-[#2D2F36]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white border border-gray-200 transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
        />
      </button>
      <div className="flex items-center gap-2 text-xs text-[#718EBF]">
        <span
          className={
            checked ? "text-[#2E3A59] dark:text-white font-medium" : ""
          }
        >
          Forward Test
        </span>
      </div>
    </div>
  );
};

const BrokerMultiSelect = ({ options, value, onChange }) => {
  // options: [{ label, value: BrokerClientId, raw: item }]
  const isAllSelected = value.length === options.length && options.length > 0;

  const toggleAll = () => {
    if (isAllSelected) onChange([]);
    else onChange(options.map((o) => o.value));
  };

  const toggleOne = (val) => {
    if (value.includes(val)) onChange(value.filter((v) => v !== val));
    else onChange([...value, val]);
  };

  return (
    <div className="border rounded-lg border-gray-300 dark:border-gray-600 p-2 max-h-40 overflow-auto bg-white dark:bg-[#2a2d33]">
      <label className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer">
        <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
        <span>Select All</span>
      </label>
      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer"
        >
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={() => toggleOne(opt.value)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
};

const DeployStrategyModal = ({ open, onClose, strategy }) => {
  const navigate = useNavigate();
  const strategyId = strategy?.StrategyId;
  const { data: details, isLoading: detailsLoading } = useStrategyDetailsById(
    strategyId,
    open
  );
  const { data: brokers = [], isLoading: brokersLoading } = useUserBrokerData();
  const { mutate: mutateDeploy, isPending: deploying } = useDeployStrategy();

  const brokerOptions = useMemo(() => {
    return (brokers || []).map((b) => ({
      label: `${b.BrokerName} (${b.BrokerClientId})`,
      value: b.BrokerClientId,
      raw: b,
    }));
  }, [brokers]);

  const [isLiveMode, setIsLiveMode] = useState(false);
  const [qtyMultiplier, setQtyMultiplier] = useState(1);
  const [maxProfit, setMaxProfit] = useState(0);
  const [maxLoss, setMaxLoss] = useState(0);
  const [autoSquareOffTime, setAutoSquareOffTime] = useState("");
  const [selectedBrokerIds, setSelectedBrokerIds] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Initialize defaults once per open to avoid update loops
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      return;
    }
    if (initializedRef.current) return;
    // Initialize when we have either details or brokers (or both)
    const hasBrokers = brokerOptions.length > 0;
    const hasDetails = !!details;
    if (!hasBrokers && !hasDetails) return; // wait for data

    if (hasDetails) {
      setAutoSquareOffTime(details.AutoSquareOffTime || "");
    }
    if (hasBrokers) {
      setSelectedBrokerIds(brokerOptions.map((o) => o.value));
    }
    initializedRef.current = true;
  }, [open, details, brokerOptions]);

  if (!open) return null;
  const loading = !!detailsLoading && !!open;

  const submit = () => {
    const payload = {
      StrategyId: strategyId,
      isLiveMode,
      MaxTradeCycle: Number(details?.MaxTrade) || 1,
      MaxProfit: String(Number(maxProfit) || 0),
      QtyMultiplier: String(Number(qtyMultiplier) || 0),
      MaxLoss: String(Number(maxLoss) || 0),
      AutoSquareOffTime: autoSquareOffTime || null,
      BrokerClientIdList: brokerOptions
        .filter((o) => selectedBrokerIds.includes(o.value))
        .map((opt) => ({
          BrokerClientId: opt.value,
          BrokerId: opt.raw?.BrokerId,
        })),
    };

    mutateDeploy(payload, {
      onSuccess: () => {
        navigate("/strategies", {
          state: { activeTab: "Deployed Strategies" },
          replace: true,
        });
      },
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={() => !deploying && onClose?.()}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#1f1f24] rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-[#2E3A59] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Deploy Strategy</h3>
          <button
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={onClose}
            disabled={deploying}
          >
            Close
          </button>
        </div>

        {loading || brokersLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse"
            aria-busy
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-28 bg-gray-200 dark:bg-[#2D2F36] rounded" />
                <div className="h-9 w-full bg-gray-200 dark:bg-[#2D2F36] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Deployment Type
              </label>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={!isLiveMode}
                  onChange={(v) => setIsLiveMode(!v)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Brokers</label>
              <BrokerMultiSelect
                options={brokerOptions}
                value={selectedBrokerIds}
                onChange={setSelectedBrokerIds}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Qty Multiplier
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2d33] px-3 py-2 text-sm"
                value={qtyMultiplier}
                onChange={(e) => setQtyMultiplier(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Max Profit (optional)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2d33] px-3 py-2 text-sm"
                value={maxProfit}
                onChange={(e) => setMaxProfit(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Max Loss (optional)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2d33] px-3 py-2 text-sm"
                value={maxLoss}
                onChange={(e) => setMaxLoss(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Auto Square Off Time
              </label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2d33] px-3 py-2 text-sm"
                value={autoSquareOffTime || ""}
                onChange={(e) => setAutoSquareOffTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Max Trade (from strategy)
              </label>
              <input
                disabled
                value={details?.MaxTrade ?? "-"}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#2a2d33] px-3 py-2 text-sm text-gray-600"
              />
            </div>
          </div>
        )}

        {/* Terms & Conditions acceptance */}
        <div className="mt-4 flex items-start gap-2 text-sm">
          <input
            id="accept-terms"
            type="checkbox"
            className="mt-1"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <label htmlFor="accept-terms" className="select-none">
            I accept all the{" "}
            <a
              href="https://algorooms.com/privacy-policy.html"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[#0096FF] hover:underline"
            >
              terms & conditions
            </a>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={onClose}
            disabled={deploying}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-lg bg-[#0096FF] text-white hover:bg-blue-600 disabled:opacity-60"
            disabled={deploying || loading || brokersLoading || !termsAccepted}
          >
            {deploying ? "Deploying…" : "Deploy"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeployStrategyModal;
