import { compactMarketData } from "./octopusPacketDecoder";
import { formatCompactMarketData } from "./octopusPacketDecoder/payloadFormatters";

export function decodeMessage(buffer) {
  const dataview = new DataView(buffer);
  const mode = dataview.getInt8(0);

  let msg = {};
  let topic = "";

  // console.log(mode,'modeee');
  switch (mode) {
    case 2: // compact_marketdata
      msg = compactMarketData(dataview) || {};
      topic = `CompactMarketDataMessage/${msg.exchange}/${msg.instrumentToken}`;
      return { topic, msg: formatCompactMarketData(msg) };

    default:
      return {};
  }
}
