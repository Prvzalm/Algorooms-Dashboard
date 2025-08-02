import { toHHmm } from "./time";

export function mapToApi(values) {
  const {
    StrategyName,
    ProductType,
    TradeStartTime,
    TradeStopTime,
    ActiveDays,
    StrategyScriptList,
    SL,
    Target,
    ExitWhenTotalLoss,
    ExitWhenTotalProfit,
    Trail_SL,
    IsChartOnOptionStrike,
    isBtSt,
    OrderType,
    StrategyType,
  } = values;

  const days = (ActiveDays || []).map((d) => String(d).toUpperCase());

  const legs = (StrategyScriptList || []).map((leg) => ({
    InstrumentToken: leg.InstrumentToken || "",
    InstrumentName: leg.InstrumentName || "",
    Qty: Number(leg.Qty || 0),
    LongEquationoptionStrikeList: (leg.LongEquationoptionStrikeList || []).map(
      (r) => normalizeRow(r)
    ),
    ShortEquationoptionStrikeList: (
      leg.ShortEquationoptionStrikeList || []
    ).map((r) => normalizeRow(r)),
    StrikeTickValue: Number(leg.StrikeTickValue || 0),
  }));

  const payload = {
    StrategyName: StrategyName || "",
    StrategyId: 0,
    Interval: 0,

    SL: Number(SL || 0),
    Target: Number(Target || 0),
    ExitWhenTotalLoss: Number(ExitWhenTotalLoss || 0),
    ExitWhenTotalProfit: Number(ExitWhenTotalProfit || 0),
    Trail_SL: Number(Trail_SL || 0),

    Privacy: "Private",
    Copy_Allowed: true,
    StrategyExecuterId: 0,

    OrderType: OrderType || "INTRADAY",
    TransactionType: "",

    TradeStartTime: toHHmm(TradeStartTime || "09:16"),
    TradeStopTime: toHHmm(TradeStopTime || "15:14"),

    TpSLType: "Percent",
    SquareOffAllOptionLegOnSl: true,

    EntryRule: "",
    ExitRule: "",
    MinimumCapital: 0,

    LockProfit: 0,
    LockProfitAt: 0,
    TrailProfitBy: 0,
    ProfitTranches: 0,
    TrailProfitType: 0,

    strategyTag: "",
    RiskDescription: "",
    subscriptionprice: 0,
    subscriptiondays: 0,

    ProductType: ProductType || "MIS",

    AutoSquareOffTime: toHHmm("15:14"),
    MaxTrade: 0,
    MaxDD: 0,
    Roi: 0,

    isTradeOnTriggerCandle: false,
    BuyWhen: "",
    ShortWhen: "",
    IsContiniousTriggerCandle: false,

    StrategyType: StrategyType || "indicator",
    ProdType: "",
    ChartType: 0,
    StrategySegmentType: "Options",
    StrategyExecutionType: "Live",

    isBtSt: ProductType === "BTST" ? true : !!isBtSt,

    EntryDaysBeforExpiry: 0,
    ExitDaysBeforExpiry: 0,

    ActiveDays: days,

    StrategyTagList: [],

    LongEntryEquation: [],
    ShortEntryEquation: [],
    Long_ExitEquation: [],
    Short_ExitEquation: [],

    StrategyScriptList: legs,

    IsChartOnOptionStrike: Boolean(IsChartOnOptionStrike),
  };

  return payload;
}

function normalizeRow(r) {
  return {
    TransactionType: r.TransactionType || "BUY",
    StrikeType: r.StrikeType || "ATM",
    StrikeValueType: Number(r.StrikeValueType || 0),
    StrikeValue: Number(r.StrikeValue || 0),

    SLActionTypeId: r.SLActionTypeId || "",
    TargetActionTypeId: r.TargetActionTypeId || "",

    isTrailSL: !!r.isTrailSL,
    IsRecursive: !!r.IsRecursive,
    IsMoveSLCTC: !!r.IsMoveSLCTC,
    isExitAll: !!r.isExitAll,

    TargetType: r.TargetType || "TP%",
    SLType: r.SLType || "SL%",

    Target: Number(r.Target || 0),
    StopLoss: Number(r.StopLoss || 0),
    Qty: Number(r.Qty || 0),

    isPrePunchSL: !!r.isPrePunchSL,
    IsPriceDiffrenceConstrant: !!r.IsPriceDiffrenceConstrant,
    PriceDiffrenceConstrantValue: Number(r.PriceDiffrenceConstrantValue || 0),

    ExpiryType: r.ExpiryType || "Weekly",

    reEntry: {
      isRentry: !!r?.reEntry?.isRentry,
      RentryType: r?.reEntry?.RentryType || "",
      TradeCycle: Number(r?.reEntry?.TradeCycle || 0),
      RentryActionTypeId: r?.reEntry?.RentryActionTypeId || "",
    },

    waitNTrade: {
      isWaitnTrade: !!r?.waitNTrade?.isWaitnTrade,
      isPerPt: r?.waitNTrade?.isPerPt || "",
      typeId: r?.waitNTrade?.typeId || "",
      MovementValue: Number(r?.waitNTrade?.MovementValue || 0),
    },

    TrailingSL: {
      TrailingType: r?.TrailingSL?.TrailingType || "",
      InstrumentMovementValue: Number(
        r?.TrailingSL?.InstrumentMovementValue || 0
      ),
      TrailingValue: Number(r?.TrailingSL?.TrailingValue || 0),
    },

    strikeTypeobj: {
      type: r?.strikeTypeobj?.type || "",
      StrikeValue: Number(r?.strikeTypeobj?.StrikeValue || 0),
      RangeFrom: Number(r?.strikeTypeobj?.RangeFrom || 0),
      RangeTo: Number(r?.strikeTypeobj?.RangeTo || 0),
    },
  };
}
