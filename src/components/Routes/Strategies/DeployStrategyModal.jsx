import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  useStrategyDetailsById,
  useDeployStrategy,
} from "../../../hooks/strategyHooks";
import { useUserBrokerData } from "../../../hooks/dashboardHooks";
import PrimaryButton from "../../common/PrimaryButton";

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

const DeployStrategyModal = ({
  open,
  onClose,
  strategy,
  initialDeployment = null,
}) => {
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

  // Track initialization for details/broker defaults separately per open
  const initRef = useRef({ details: false, brokers: false, deployment: false });
  useEffect(() => {
    if (!open) {
      initRef.current = { details: false, brokers: false, deployment: false };
      return;
    }

    const state = initRef.current;

    if (!state.deployment && initialDeployment) {
      if (initialDeployment.isLiveMode !== undefined) {
        setIsLiveMode(!!initialDeployment.isLiveMode);
      }
      if (initialDeployment.qtyMultiplier !== undefined) {
        const val = initialDeployment.qtyMultiplier;
        setQtyMultiplier(
          val === undefined || val === null || val === "" ? "" : String(val)
        );
      }
      if (initialDeployment.maxProfit !== undefined) {
        const val = initialDeployment.maxProfit;
        setMaxProfit(
          val === undefined || val === null || val === "" ? "" : String(val)
        );
      }
      if (initialDeployment.maxLoss !== undefined) {
        const val = initialDeployment.maxLoss;
        setMaxLoss(
          val === undefined || val === null || val === "" ? "" : String(val)
        );
      }
      if (initialDeployment.autoSquareOffTime !== undefined) {
        setAutoSquareOffTime(initialDeployment.autoSquareOffTime || "");
      }
      if (
        Array.isArray(initialDeployment.brokerClientIds) &&
        initialDeployment.brokerClientIds.length > 0
      ) {
        setSelectedBrokerIds(initialDeployment.brokerClientIds);
      }
      state.deployment = true;
    }

    if (!state.details && details) {
      if (
        !(
          state.deployment &&
          initialDeployment &&
          initialDeployment.autoSquareOffTime !== undefined
        )
      ) {
        setAutoSquareOffTime(details.AutoSquareOffTime || "");
      }
      const profit = details.ExitWhenTotalProfit;
      const loss = details.ExitWhenTotalLoss;
      if (
        !(
          state.deployment &&
          initialDeployment &&
          initialDeployment.maxProfit !== undefined
        )
      ) {
        setMaxProfit(
          profit === undefined || profit === null ? "" : String(profit)
        );
      }
      if (
        !(
          state.deployment &&
          initialDeployment &&
          initialDeployment.maxLoss !== undefined
        )
      ) {
        setMaxLoss(loss === undefined || loss === null ? "" : String(loss));
      }
      state.details = true;
    }

    if (!state.brokers && brokerOptions.length > 0) {
      setSelectedBrokerIds((prev) => {
        if (prev.length > 0) {
          state.brokers = true;
          return prev;
        }
        const defaults =
          Array.isArray(initialDeployment?.brokerClientIds) &&
          initialDeployment.brokerClientIds.length > 0
            ? initialDeployment.brokerClientIds
            : brokerOptions.map((o) => o.value);
        state.brokers = true;
        return defaults;
      });
    }
  }, [open, details, brokerOptions, initialDeployment]);

  if (!open) return null;
  const loading = !!detailsLoading && !!open;

  const submit = () => {
    const maxTradeCycle =
      initialDeployment?.maxTradeCycle !== undefined &&
      initialDeployment?.maxTradeCycle !== null
        ? Number(initialDeployment.maxTradeCycle) || 1
        : Number(details?.MaxTrade) || 1;
    const payload = {
      StrategyId: strategyId,
      isLiveMode,
      MaxTradeCycle: maxTradeCycle,
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
        onClose?.();
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
              className="text-[#1B44FE] hover:underline"
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
          <PrimaryButton
            onClick={submit}
            disabled={deploying || loading || brokersLoading || !termsAccepted}
            className="px-4 py-2 rounded-lg"
          >
            {deploying ? "Deploying…" : "Deploy"}
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeployStrategyModal;
