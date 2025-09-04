import { useEffect, useState } from "react";
import octopusInstance from "services/WebSockets/feeds/octopusInstance";
import { calculatePnlRow } from "services/utils/calc";
import { getExchangeCode } from "services/utils/exchanges";

export default function useLiveDeployedStrategies(initialData = []) {
  const [deployedStrategies, setDeployedStrategies] = useState(initialData);
  const [brokerwisePnl, setBrokerwisePnl] = useState({});
  const [totalPnl, setTotalPnl] = useState(0);

  useEffect(() => {
    if (!deployedStrategies || deployedStrategies.length === 0) return;
    const handlers = [];

    deployedStrategies.forEach((brokerWiseStgy, i) => {
      brokerWiseStgy.DeploymentDetail.forEach((stgy, j) => {
        stgy.positions.forEach((pos, k) => {
          const subscriptionLocation = `${pos.OrderId}_${i}_${j}_${k}`;
          const identifier = `${i}_${j}_${k}`;
          const exchangeCode =
            getExchangeCode(pos.exchange || pos.orderRequest?._exchange) || "-";
          const instrumentToken = pos.ExchangeToken || -1;

          const handler = octopusInstance.wsHandler({
            messageType: "CompactMarketDataMessage",
            subscriptionLocation,
            identifier,
            payload: { exchangeCode, instrumentToken },
          });

          handlers.push(handler);

          handler.subscribe(({ msg }) => {
            setDeployedStrategies((prev) => {
              const updated = [...prev];
              const strategy = updated[i].DeploymentDetail[j];
              const position = strategy.positions[k];

              // update LTP + recalc PNL
              position.LTP = msg.ltp;
              position.PNL = calculatePnlRow(position).PNL;

              // recalc strategy pnl
              strategy.strategyPNL = strategy.positions.reduce(
                (sum, p) => sum + (p.PNL ?? 0),
                0
              );

              // recalc broker pnl
              updated[i].brokerPNL = updated[i].DeploymentDetail.reduce(
                (sum, s) => sum + (s.strategyPNL ?? 0),
                0
              );

              // recalc total pnl
              const total = updated.reduce(
                (sum, b) => sum + (b.brokerPNL ?? 0),
                0
              );

              setBrokerwisePnl(
                Object.fromEntries(
                  updated.map((b) => [b.BrokerClientId, b.brokerPNL])
                )
              );
              setTotalPnl(total);

              return updated;
            });
          });
        });
      });
    });

    return () => {
      handlers.forEach((h) => h.unsubscribe());
    };
  }, [deployedStrategies]);

  return { deployedStrategies, brokerwisePnl, totalPnl, setDeployedStrategies };
}
