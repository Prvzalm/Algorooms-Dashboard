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

const normalizeEntryOperators = (equations) => {
    if (!Array.isArray(equations)) return [];
    return equations.map((eq, idx) => {
        const isLast = idx === equations.length - 1;
        const opIdRaw = eq?.OperatorId;
        const opId = Number.isFinite(Number(opIdRaw)) ? Number(opIdRaw) : 0;
        const opName = eq?.OperatorName;

        if (isLast) {
            return {
                ...eq,
                OperatorId: 0,
                OperatorName: "End",
            };
        }

        // For non-last rows, default to AND when operator missing
        return {
            ...eq,
            OperatorId: opId,
            OperatorName: opName || "AND",
        };
    });
};

// Ensure indicator params carry numeric ParamId for API contract
const normalizeIndicatorParams = (indicator) => {
    if (!indicator) return { indicatorId: 0, IndicatorParamList: [] };

    const list = Array.isArray(indicator.IndicatorParamList)
        ? indicator.IndicatorParamList.map((p) => ({
            ...p,
            ParamId: Number(p?.ParamId) || 0,
            IndicatorParamValue:
                p?.IndicatorParamValue === undefined || p?.IndicatorParamValue === null
                    ? ""
                    : p.IndicatorParamValue,
        }))
        : [];

    return {
        ...indicator,
        indicatorId: Number(indicator.indicatorId) || 0,
        IndicatorParamList: list,
    };
};

const normalizeEquationIndicators = (eq) => ({
    ...eq,
    indicator: normalizeIndicatorParams(eq?.indicator),
    comparerIndicator: normalizeIndicatorParams(eq?.comparerIndicator),
});

const normalizeIndicatorEquations = (equations) =>
    normalizeEntryOperators(equations).map(normalizeEquationIndicators);

export function buildStrategyPayload({
    values,
    ui,
}) {
    const {
        AdvanceFeatures: _omitAdvanceFeatures,
        ActiveLegIndex: _omitActiveLegIndex,
        useCombinedChart: _omitUseCombinedChart,
        TargetOnEachScript: _omitTargetOnEachScript,
        StopLossOnEachScript: _omitStopLossOnEachScript,
        ...cleanValues
    } = values || {};

    const selectedStrategyTypes = ui.selectedStrategyTypes || ["time"]; // ["time"|"indicator"|"price"]
    const txType = Number(cleanValues.TransactionType ?? 0); // 0 both, 1 long, 2 short
    const onlyLong = txType === 1;
    const onlyShort = txType === 2;
    const isChartOnOptionStrike = cleanValues.IsChartOnOptionStrike;
    const isOptionOrCombinedChart =
        isChartOnOptionStrike === "combined" || isChartOnOptionStrike === "options";
    const selectedInstrument = ui.selectedInstrument || null;
    const selectedEquityInstruments = ui.selectedEquityInstruments || [];
    const showBacktestComponent = ui.showBacktestComponent || false;
    const createdStrategyId = ui.createdStrategyId || null;

    const indicatorSegment =
        selectedStrategyTypes[0] === "indicator"
            ? selectedEquityInstruments[0]?.SegmentType || cleanValues.StrategySegmentType
            : cleanValues.StrategySegmentType;

    const mappedSegment =
        segmentMap[indicatorSegment] || indicatorSegment;

    const executionType =
        selectedStrategyTypes[0] === "time"
            ? "tb"
            : selectedStrategyTypes[0] === "indicator"
                ? "ib"
                : "pa";

    const currentScripts = Array.isArray(cleanValues.StrategyScriptList)
        ? cleanValues.StrategyScriptList
        : [];
    const firstScript = currentScripts[0] || {};
    const lotSizeVal = selectedInstrument?.LotSize ?? 0;

    const pruneSidesByTransaction = (scripts) =>
        (Array.isArray(scripts) ? scripts : []).map((script) => ({
            ...script,
            LongEquationoptionStrikeList: onlyShort
                ? []
                : Array.isArray(script.LongEquationoptionStrikeList)
                    ? script.LongEquationoptionStrikeList
                    : [],
            ShortEquationoptionStrikeList: (onlyLong || selectedStrategyTypes[0] === "time")
                ? []
                : Array.isArray(script.ShortEquationoptionStrikeList)
                    ? script.ShortEquationoptionStrikeList
                    : [],
        }));

    const enrichStrike = (item) => ({
        ...item,
        // Convert blank/empty values to 0 for API
        Qty: item?.Qty === "" || item?.Qty === null || item?.Qty === undefined ? 0 : Number(item.Qty) || 0,
        lotSize: item?.lotSize === "" || item?.lotSize === null || item?.lotSize === undefined ? 0 : Number(item.lotSize) || 0,
        IsMoveSLCTC: item?.IsMoveSLCTC ?? false,
        IsPriceDiffrenceConstrant: item?.IsPriceDiffrenceConstrant ?? false,
        PriceDiffrenceConstrantValue: item?.PriceDiffrenceConstrantValue === "" || item?.PriceDiffrenceConstrantValue === null || item?.PriceDiffrenceConstrantValue === undefined ? 0 : Number(item.PriceDiffrenceConstrantValue) || 0,
        isPrePunchSL: item?.isPrePunchSL ?? false,
        reEntry: item?.reEntry ? {
            isRentry: item.reEntry.isRentry ?? false,
            RentryType: item.reEntry.RentryType ?? "REN",
            TradeCycle: item.reEntry.TradeCycle === "" || item.reEntry.TradeCycle === null || item.reEntry.TradeCycle === undefined ? 0 : Number(item.reEntry.TradeCycle) || 0,
            RentryActionTypeId: item.reEntry.RentryActionTypeId ?? "ON_CLOSE",
        } : {
            isRentry: false,
            RentryType: "REN",
            TradeCycle: 0,
            RentryActionTypeId: "ON_CLOSE",
        },
        waitNTrade: item?.waitNTrade ? {
            isWaitnTrade: item.waitNTrade.isWaitnTrade ?? false,
            isPerPt: item.waitNTrade.isPerPt ?? "wtpr_+",
            typeId: item.waitNTrade.typeId ?? "wtpr_+",
            MovementValue: item.waitNTrade.MovementValue === "" || item.waitNTrade.MovementValue === null || item.waitNTrade.MovementValue === undefined ? 0 : Number(item.waitNTrade.MovementValue) || 0,
        } : {
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
        TrailingSL: item?.TrailingSL ? {
            TrailingType: item.TrailingSL.TrailingType ?? "tslpr",
            InstrumentMovementValue: item.TrailingSL.InstrumentMovementValue === "" || item.TrailingSL.InstrumentMovementValue === null || item.TrailingSL.InstrumentMovementValue === undefined ? 0 : Number(item.TrailingSL.InstrumentMovementValue) || 0,
            TrailingValue: item.TrailingSL.TrailingValue === "" || item.TrailingSL.TrailingValue === null || item.TrailingSL.TrailingValue === undefined ? 0 : Number(item.TrailingSL.TrailingValue) || 0,
        } : {
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
        StrategyScriptListFinal = pruneSidesByTransaction(
            cleanValues.StrategyScriptList
        );
    } else {
        StrategyScriptListFinal = pruneSidesByTransaction([
            {
                InstrumentToken:
                    selectedInstrument?.InstrumentToken || firstScript.InstrumentToken || "",
                // Convert blank values to 0 for API
                Qty: firstScript.Qty === "" || firstScript.Qty === null || firstScript.Qty === undefined ? 0 : Number(firstScript.Qty) || 0,
                lotSize: firstScript.lotSize === "" || firstScript.lotSize === null || firstScript.lotSize === undefined ? 0 : Number(firstScript.lotSize) || 0,
                LongEquationoptionStrikeList: longOptionStrikes,
                ShortEquationoptionStrikeList: Array.isArray(
                    firstScript.ShortEquationoptionStrikeList
                )
                    ? firstScript.ShortEquationoptionStrikeList.map(enrichStrike)
                    : [],
            },
        ]);
    }

    const normalizeTpSlType = () => {
        const raw = cleanValues.TpSLType;
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

    const strategyIdForPayload = cleanValues.StrategyId || (showBacktestComponent && createdStrategyId ? createdStrategyId : 0);
    const tpSlTypeValue = normalizeTpSlType();

    const payloadBase = {
        ...cleanValues,
        StrategyType: null,
        StrategySegmentType:
            selectedStrategyTypes[0] === "time" ? "OPTION" : mappedSegment,
        StrategyExecutionType: executionType,
        StrategyScriptList: StrategyScriptListFinal,
        TradeStopTime: cleanValues.TradeStopTime || "15:15",
        AutoSquareOffTime: cleanValues.AutoSquareOffTime || "15:15",
        EntryRule: null,
        ExitRule: null,
        IsChartOnOptionStrike: Boolean(isOptionOrCombinedChart),
        StrategyId: strategyIdForPayload,
        ExitWhenTotalLoss: String(cleanValues.ExitWhenTotalLoss === "" || cleanValues.ExitWhenTotalLoss === null || cleanValues.ExitWhenTotalLoss === undefined ? 0 : cleanValues.ExitWhenTotalLoss),
        ExitWhenTotalProfit: String(cleanValues.ExitWhenTotalProfit === "" || cleanValues.ExitWhenTotalProfit === null || cleanValues.ExitWhenTotalProfit === undefined ? 0 : cleanValues.ExitWhenTotalProfit),
        TpSLType: tpSlTypeValue,
    };

    const normalizedLongExit = normalizeIndicatorEquations(cleanValues.Long_ExitEquation || []);
    const normalizedShortExit = normalizeIndicatorEquations(cleanValues.Short_ExitEquation || []);

    payloadBase.Long_ExitEquation = onlyShort
        ? null
        : toNullIfEmpty(normalizedLongExit);
    payloadBase.Short_ExitEquation = onlyLong
        ? null
        : toNullIfEmpty(normalizedShortExit);

    if (selectedStrategyTypes[0] === "indicator") {
        // When user selects single side, send the other side as null
        const normalizedLong = normalizeIndicatorEquations(cleanValues.LongEntryEquation || []);
        const normalizedShort = normalizeIndicatorEquations(cleanValues.ShortEntryEquation || []);

        payloadBase.LongEntryEquation = onlyShort
            ? null
            : toNullIfEmpty(normalizedLong);
        payloadBase.ShortEntryEquation = onlyLong
            ? null
            : toNullIfEmpty(normalizedShort);
    } else {
        payloadBase.LongEntryEquation = null;
        payloadBase.ShortEntryEquation = null;
    }

    return payloadBase;
}
