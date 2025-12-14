// Utility to map builder form values + UI state into API payload

const segmentMap = {
    Option: "OPTION",
    Equity: "NSE",
    Future: "NFO-FUT",
    Indices: "INDICES",
    CDS: "CDS-FUT",
    MCX: "MCX",
};

const toNullIfEmpty = (val) => {
    if (Array.isArray(val)) return val.length > 0 ? val : null;
    return val === "" ? null : val ?? null;
};

export function buildStrategyPayload({
    values,
    ui,
}) {
    const selectedStrategyTypes = ui.selectedStrategyTypes || ["time"]; // ["time"|"indicator"|"price"]
    const selectedInstrument = ui.selectedInstrument || null;
    const selectedEquityInstruments = ui.selectedEquityInstruments || [];
    const showBacktestComponent = ui.showBacktestComponent || false;
    const createdStrategyId = ui.createdStrategyId || null;

    const indicatorSegment =
        selectedStrategyTypes[0] === "indicator"
            ? selectedEquityInstruments[0]?.SegmentType || values.StrategySegmentType
            : values.StrategySegmentType;

    const mappedSegment =
        segmentMap[indicatorSegment] || indicatorSegment;

    const executionType =
        selectedStrategyTypes[0] === "time"
            ? "tb"
            : selectedStrategyTypes[0] === "indicator"
                ? "ib"
                : "pa";

    const currentScripts = Array.isArray(values.StrategyScriptList)
        ? values.StrategyScriptList
        : [];
    const firstScript = currentScripts[0] || {};
    const lotSizeVal = selectedInstrument?.LotSize || firstScript.Qty || 0;

    const enrichStrike = (item) => ({
        ...item,
        Qty: item?.Qty || lotSizeVal,
        lotSize: item?.lotSize || lotSizeVal,
        IsMoveSLCTC: item?.IsMoveSLCTC ?? false,
        IsPriceDiffrenceConstrant: item?.IsPriceDiffrenceConstrant ?? false,
        PriceDiffrenceConstrantValue: item?.PriceDiffrenceConstrantValue ?? 0,
        isPrePunchSL: item?.isPrePunchSL ?? false,
        reEntry:
            item?.reEntry ?? {
                isRentry: false,
                RentryType: "REN",
                TradeCycle: 0,
                RentryActionTypeId: "ON_CLOSE",
            },
        waitNTrade:
            item?.waitNTrade ?? {
                isWaitnTrade: false,
                isPerPt: "wtpr_+",
                typeId: "wtpr_+",
                MovementValue: 0,
            },
        strikeTypeobj: {
            type: item?.strikeTypeobj?.type ?? "ATM",
            StrikeValue: Number(item?.strikeTypeobj?.StrikeValue) || 0,
            RangeFrom: item?.strikeTypeobj?.RangeFrom ?? 0,
            RangeTo: item?.strikeTypeobj?.RangeTo ?? 0,
        },
        isExitAll: item?.isExitAll ?? false,
        isTrailSL: item?.isTrailSL ?? false,
        TrailingSL:
            item?.TrailingSL ?? {
                TrailingType: "tslpr",
                InstrumentMovementValue: 0,
                TrailingValue: 0,
            },
    });

    const longOptionStrikes = Array.isArray(
        firstScript.LongEquationoptionStrikeList
    )
        ? firstScript.LongEquationoptionStrikeList.map(enrichStrike)
        : [];

    const isIndicatorEquityMulti =
        selectedStrategyTypes[0] === "indicator" &&
        selectedEquityInstruments.length > 0;

    let StrategyScriptListFinal;
    if (isIndicatorEquityMulti) {
        StrategyScriptListFinal = values.StrategyScriptList;
    } else {
        StrategyScriptListFinal = [
            {
                InstrumentToken:
                    selectedInstrument?.InstrumentToken || firstScript.InstrumentToken || "",
                Qty: lotSizeVal,
                LongEquationoptionStrikeList: longOptionStrikes,
                ShortEquationoptionStrikeList: Array.isArray(
                    firstScript.ShortEquationoptionStrikeList
                )
                    ? firstScript.ShortEquationoptionStrikeList.map(enrichStrike)
                    : [],
            },
        ];
    }

    const normalizeTpSlType = () => {
        const raw = values.TpSLType;
        if (typeof raw === "number" && Number.isFinite(raw)) {
            return raw;
        }
        if (typeof raw === "string") {
            const upper = raw.toUpperCase();
            if (upper.includes("POINT")) return 1;
            if (upper.includes("PERCENT")) return 0;
            const numeric = Number(raw);
            if (!Number.isNaN(numeric)) {
                return numeric;
            }
        }
        return 0;
    };

    const strategyIdForPayload = values.StrategyId || (showBacktestComponent && createdStrategyId ? createdStrategyId : 0);
    const tpSlTypeValue = normalizeTpSlType();

    const payloadBase = {
        ...values,
        StrategyType: null,
        StrategySegmentType:
            selectedStrategyTypes[0] === "time" ? "OPTION" : mappedSegment,
        StrategyExecutionType: executionType,
        StrategyScriptList: StrategyScriptListFinal,
        TradeStopTime: values.TradeStopTime || "15:15",
        AutoSquareOffTime: values.AutoSquareOffTime || "15:15",
        EntryRule: null,
        ExitRule: null,
        Long_ExitEquation: toNullIfEmpty(values.Long_ExitEquation),
        Short_ExitEquation: toNullIfEmpty(values.Short_ExitEquation),
        StrategyId: strategyIdForPayload,
        ExitWhenTotalLoss: String(values.ExitWhenTotalLoss || 0),
        ExitWhenTotalProfit: String(values.ExitWhenTotalProfit || 0),
        TpSLType: tpSlTypeValue,
    };

    if (selectedStrategyTypes[0] === "indicator") {
        payloadBase.LongEntryEquation = toNullIfEmpty(values.LongEntryEquation);
        payloadBase.ShortEntryEquation = toNullIfEmpty(values.ShortEntryEquation);
    } else {
        payloadBase.LongEntryEquation = null;
        payloadBase.ShortEntryEquation = null;
    }

    return payloadBase;
}
