const octopusPacketStructures = {
  compactMarketData: [
    ["exchange", "int8"],
    ["instrumentToken", "int32"],
    ["ltp", "int32"],
    ["change", "int32"],
    ["ltt", "int32"],
    ["lowDpr", "int32"],
    ["highDpr", "int32"],
    ["currentOpenInterest", "int32"],
    ["initialOpenInterest", "int32"],
    ["bidPrice", "int32"],
    ["askPrice", "int32"],
  ],
  detailedMarketData: [
    ["exchange", "int8"],
    ["instrumentToken", "int32"],
    ["ltp", "int32"],
    ["ltt", "int32"],
    ["ltq", "int32"],
    ["volume", "int32"],
    ["bestBidPrice", "int32"],
    ["bestBidQuantity", "int32"],
    ["bestAskPrice", "int32"],
    ["bestAskQuantity", "int32"],
    ["totalBuyQuantity", "int64"],
    ["totalSellQuantity", "int64"],
    ["averageTradePrice", "int32"],
    ["exchangeTimestamp", "int32"],
    ["openPrice", "int32"],
    ["highPrice", "int32"],
    ["lowPrice", "int32"],
    ["closePrice", "int32"],
    ["yearlyHighPrice", "int32"],
    ["yearlyLowPrice", "int32"],
    ["lowDPR", "int32"],
    ["HighDPR", "int32"],
    ["currentOpenInterest", "int32"],
    ["initialOpenInterest", "int32"],
  ],
  snapquoteData: [
    ["exchange", "int8"],
    ["instrumentToken", "int32"],
    ["buyers", ["int32", 5]],
    ["bidPrices", ["int32", 5]],
    ["bidQtys", ["int32", 5]],
    ["sellers", ["int32", 5]],
    ["askPrices", ["int32", 5]],
    ["askQtys", ["int32", 5]],
    ["averageTradePrice", "int32"],
    ["open", "int32"],
    ["high", "int32"],
    ["low", "int32"],
    ["close", "int32"],
    ["totalBuyQty", "int64"],
    ["totalSellQty", "int64"],
    ["volume", "int32"],
  ],
  tbtSnapquoteData: [
    ["exchange", "int8"],
    ["instrumentToken", "int32"],
    ["exchangeTimeInNano", "int64"],
    ["lastTradePrice", "int32"],
    ["lastTradeQuantity", "int32"],
    ["totalTradeQuantity", "int64"],
    ["buyers", ["int32", 20]],
    ["bidPrices", ["int32", 20]],
    ["bidQtys", ["int32", 20]],
    ["sellers", ["int32", 20]],
    ["askPrices", ["int32", 20]],
    ["askQtys", ["int32", 20]],
    ["averageTradePrice", "int32"],
    ["open", "int32"],
    ["high", "int32"],
    ["low", "int32"],
    ["close", "int32"],
    ["totalBuyQty", "int64"],
    ["totalSellQty", "int64"],
    ["volume", "int32"],
  ],
  // marketStatus: [
  //   ['exchange', 'int8'],
  //   ['marketType', ['int16', 'string']],
  //   ['message', ['int16', 'string']],
  //   ['timestamp', 'int32'],
  // ],
  // exchangeMessage: [
  //   ['exchange', 'int8'],
  //   ['message', ['int16', 'string']],
  //   ['timestamp', 'int32'],
  // ]
};

const dataTypeToMethods = {
  int8: { method: "getInt8", size: 1 },
  int16: { method: "getInt16", size: 2 },
  int32: { method: "getInt32", size: 4 },
  int64: { method: "getInt64", size: 8 },
};

function createOctopusPacketDecoderFunction() {
  const decoderHeader = "export const octopusPacketDecoder = {";
  const decoderBody = Object.entries(octopusPacketStructures).map(([fncName, packetStructure]) => {
    const header = `\t${fncName}: (dataview) => {`;
    const body = packetStructure.reduce(
      ({ message, byteOffset }, [keyName, dataType]) => {
        let decodedValue;
        let staticOffset = byteOffset;

        if (Array.isArray(dataType)) {
          const [type, arrayLength] = dataType;
          const { method, size } = dataTypeToMethods[type];
          decodedValue = "[";
          for (let i = 0; i < arrayLength; i++) {
            decodedValue += `dataview.${method}(${staticOffset}), `;
            staticOffset += size;
          }
          decodedValue += "]";
        } else {
          const type = dataType;
          const { method, size } = dataTypeToMethods[type];
          decodedValue = `dataview.${method}(${staticOffset})`;
          staticOffset += size;
        }
        return {
          message: [...message, { [keyName]: decodedValue }],
          byteOffset: staticOffset,
        };
      },
      { message: [], byteOffset: 1 }
    );

    return {
      header,
      body,
      footer: "}",
    };
  });

  decoderBody.forEach(({ header, body, footer }) => {
    debugger;
    body.message
      .map((line) => Object.entries(line))
      .forEach(([[key, value]]) => {
        // console.log(`${key}:`, `${value},`);
      });
    // console.log("}");
  });
  // console.log("}");
}

createOctopusPacketDecoderFunction();
