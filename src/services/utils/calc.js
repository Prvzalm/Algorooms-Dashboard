export function calculatePnlRow(row) {
  if (!row || !row.TransactionType) return row;
  if (["EXECUTED", "COMPLETED"].includes(row.OrderStatus)) {
    let PNL = 0;
    const { TransactionType, Qty, EntryPrice, LTP, ExitPrice } = row;
    if (TransactionType === "BUY") {
      PNL =
        ExitPrice > 0
          ? (ExitPrice - EntryPrice) * Qty
          : (LTP - EntryPrice) * Qty;
    } else {
      PNL =
        ExitPrice > 0
          ? (EntryPrice - ExitPrice) * Qty
          : (EntryPrice - LTP) * Qty;
    }
    return {
      ...row,
      PNL,
    };
  }
  return {
    ...row,
    PNL: 0,
  };
}

export function calculateNetPnlRow(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((net_pnl, row) => {
    return net_pnl + calculatePnlRow(row).PNL;
  }, 0);
}

export function calcTotalPnlByBroker(data) {
  let brokers = {};

  if (!data || data.length === 0) return brokers;

  for (let i = 0; i < data.length; i++) {
    if (brokers[data[i]["BrokerClientId"]]) {
      brokers[data[i]["BrokerClientId"]].push(...data[i]["positions"]);
    } else {
      brokers[data[i]["BrokerClientId"]] = data[i]["positions"];
    }
  }
  Object.keys(brokers).forEach((key) => {
    brokers[key] = calculateNetPnlRow(brokers[key]);
  });
  return brokers;
}
