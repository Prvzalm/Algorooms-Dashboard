const stringifyNumberToIndianLocale = (number, precision = 0) => {
  // console.log(number)
  return number.toLocaleString("en-IN", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};
const arrExchangeConfig = [
  { name: "NSE", code: 1, multiplier: 100 },
  { name: "NFO", code: 2, multiplier: 100 },
  { name: "CDS", code: 3, multiplier: 10000000 },
  { name: "MCX", code: 4, multiplier: 100 },
  { name: "MCXSX", code: 5, multiplier: 100 },
  { name: "BSE", code: 6, multiplier: 100 },
  { name: "BFO", code: 7, multiplier: 100 },
  { name: "BCD", code: 8, multiplier: 10000000 },
  { name: "NSE_INDICES", code: 9, multiplier: 100 },
  { name: "NCDEX", code: 10, multiplier: 100 },
  { name: "NCO", code: 11, multiplier: 100 },
  { name: "NSLBM", code: 12, multiplier: 100 },
  { name: "NOFS", code: 13, multiplier: 100 },
  { name: "DSE", code: 14, multiplier: 100 },
  { name: "BSLBM", code: 15, multiplier: 100 },
];

const exchangeStrikeOptions = [
  { name: "NSE", multiplier: 100 },
  { name: "NFO", multiplier: 100 },
];

const exchangesPrecision = {
  NSE: 2,
  NFO: 2,
  CDS: 4,
  MCX: 2,
  MCXSX: 2,
  BSE: 2,
  BFO: 2,
  BCD: 4,
  NSE_INDICES: 2,
  NCDEX: 2,
  NCO: 2,
  NSLBM: 2,
  NOFS: 2,
  DSE: 2,
  BSLBM: 2,
};

function exchangeSpecificStringifiedNumber(exchange, number) {
  if (typeof number !== "number") return "";
  const precision = exchangesPrecision[exchange];
  return stringifyNumberToIndianLocale(number, precision);
}

function exchangeSpecificForOptionChain(exchange, number) {
  if (typeof number !== "number") return 0;
  const precision = exchangesPrecision[exchange];
  return stringifyNumberToIndianLocale(number, precision);
}

export function exchangeSpecificFloatingPointNumber(exchange, number) {
  if (typeof number !== "number") return "";
  const precision = exchangesPrecision[exchange];
  const multiplier = Math.pow(10, precision);
  return Math.round(number * multiplier) / multiplier;
}

export function getTurnOverValue(exchange, number) {
  if (typeof number !== "number") return "";
  const precision = exchangesPrecision[exchange];
  if (number >= 10000000) {
    const value = number / 10000000;
    return stringifyNumberToIndianLocale(value, precision) + " Cr";
  } else if (number >= 100000) {
    const value = number / 100000;
    return stringifyNumberToIndianLocale(value, precision) + " Lac";
  } else if (number >= 1000) {
    const value = number / 1000;
    return stringifyNumberToIndianLocale(value, precision) + " K";
  } else {
    const value = number;
    return stringifyNumberToIndianLocale(value, precision);
  }
}

function getExchangeCode(exchangeName) {
  for (let exchange of arrExchangeConfig) {
    if (exchangeName === exchange.name) return exchange.code;
  }
  throw new Error(`exchange name: ${exchangeName} not supported`);
}

function getExchangeName(exchangeCode) {
  for (let exchange of arrExchangeConfig) {
    if (exchangeCode === exchange.code) return exchange.name;
  }
  throw new Error(`exchange code: ${exchangeCode} not defined`);
}

function getStrike(exchangeName, strike) {
  for (let exchange of exchangeStrikeOptions) {
    if (exchangeName === exchange.name) return strike / exchange.multiplier;
  }
}

function getExchangeMultiplier(exchangeNameOrCode) {
  for (let exchange of arrExchangeConfig) {
    if (exchangeNameOrCode === exchange.name || exchangeNameOrCode === exchange.code) return exchange.multiplier;
  }
  throw new Error(`exchange: ${exchangeNameOrCode} not supported`);
}

function getCurrencyPrecision(exchangeName) {
  return exchangesPrecision[exchangeName] || 2;
}

function getExchangeSegment(exchange) {
  switch (exchange) {
    case "NSE":
    case "BSE":
      return "Capital";
    case "CDS":
      return "Currency";
    case "MCX":
    case "NFO":
      return "FutOpt";
    default:
      return "";
  }
}

function getExchangeSeries(exchange) {
  switch (exchange) {
    case "MCX":
      return "FUTCOM";
    case "NFO":
      return "FUTIDX";
    case "CDS":
      return "FUTCUR";
    case "NSE":
      return "EQ";
    case "BSE":
      return "E";
    default:
      return "EQ";
  }
}

export {
  getExchangeCode,
  getExchangeName,
  getExchangeMultiplier,
  getCurrencyPrecision,
  exchangeSpecificStringifiedNumber,
  exchangeSpecificForOptionChain,
  getStrike,
  getExchangeSegment,
  getExchangeSeries,
  stringifyNumberToIndianLocale,
};
