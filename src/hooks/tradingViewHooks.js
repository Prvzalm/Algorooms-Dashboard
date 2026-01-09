import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getTradingViewSignalSettings,
    saveTradingViewSignalSettings,
    deleteTradingViewSignalSettings,
} from "../api/tradingViewApi";/**
 * Hook to fetch TradingView signal settings for a specific strategy
 */
export const useTradingViewSettings = (strategyId, options = {}) => {
    return useQuery({
        queryKey: ["tradingViewSettings", strategyId],
        queryFn: () => getTradingViewSignalSettings(strategyId),
        enabled: !!strategyId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options,
    });
};

/**
 * Hook to fetch TradingView settings for multiple strategies
 */
export const useBulkTradingViewSettings = (strategyIds, options = {}) => {
    return useQuery({
        queryKey: ["tradingViewSettings", "bulk", [...(strategyIds || [])].sort().join(",")],
        queryFn: async () => {
            if (!strategyIds || strategyIds.length === 0) {
                return { enabledStrategies: new Set(), settingsMap: {} };
            }

            const enabledStrategies = new Set();
            const settingsMap = {};

            const settingsPromises = strategyIds.map(async (strategyId) => {
                try {
                    const response = await getTradingViewSignalSettings(strategyId);
                    if (
                        response?.Status === "Success" &&
                        response?.ExternalSignalsSettings
                    ) {
                        settingsMap[strategyId] = response.ExternalSignalsSettings;
                        if (response.ExternalSignalsSettings.Enabled) {
                            enabledStrategies.add(strategyId);
                        }
                    }
                } catch (error) {
                    console.error(
                        `Error fetching settings for strategy ${strategyId}:`,
                        error
                    );
                }
            });

            await Promise.all(settingsPromises);

            return { enabledStrategies, settingsMap };
        },
        enabled: !!strategyIds && strategyIds.length > 0,
        staleTime: 30 * 1000, // 30 seconds - reduced for faster updates
        ...options,
    });
};

/**
 * Hook to save TradingView signal settings
 */
export const useSaveTradingViewSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: saveTradingViewSignalSettings,
        onSuccess: (data, variables) => {
            // Invalidate the specific strategy's settings
            queryClient.invalidateQueries({
                queryKey: ["tradingViewSettings", variables.StrategyId],
            });
            // Invalidate bulk queries to refresh the lists
            queryClient.invalidateQueries({
                queryKey: ["tradingViewSettings", "bulk"],
            });
        },
    });
};

/**
 * Hook to delete TradingView signal settings
 */
export const useDeleteTradingViewSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteTradingViewSignalSettings,
        onSuccess: (data, strategyId) => {
            // Invalidate the specific strategy's settings
            queryClient.invalidateQueries({
                queryKey: ["tradingViewSettings", strategyId],
            });
            // Invalidate bulk queries to refresh the lists
            queryClient.invalidateQueries({
                queryKey: ["tradingViewSettings", "bulk"],
            });
        },
    });
};
