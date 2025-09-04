export function compactMarketData(dataview) {
  if (dataview.byteLength === 42) {
    return {
      exchange: dataview.getInt8(1),
      instrumentToken: dataview.getInt32(2),
      ltp: dataview.getInt32(6),
      change: dataview.getInt32(10),
      ltt: dataview.getInt32(14),
      lowDpr: dataview.getInt32(18),
      highDpr: dataview.getInt32(22),
      currentOpenInterest: dataview.getInt32(26),
      initialOpenInterest: dataview.getInt32(30),
      bidPrice: dataview.getInt32(34),
      askPrice: dataview.getInt32(38),
    };
  } else {
    return {
      exchange: dataview.getInt8(1),
      instrumentToken: dataview.getInt32(2),
      ltp: dataview.getInt32(6),
      change: dataview.getInt32(10),
      ltt: dataview.getInt32(14),
      lowDpr: dataview.getInt32(18),
      highDpr: dataview.getInt32(22),
      currentOpenInterest: 0,
      initialOpenInterest: 0,
      bidPrice: 0,
      askPrice: 0,
    };
  }
}
