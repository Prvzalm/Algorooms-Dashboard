import axiosInstance from "./axiosInstance";

/**
 * Get TradingView signal settings for a strategy
 * @param {number} strategyId - The strategy ID
 * @returns {Promise} Response with signal settings
 */
export const getTradingViewSignalSettings = async (strategyId) => {
    const response = await axiosInstance.get(
        `/ExternalSignals/SignalSettings?StrategyId=${strategyId}`
    );
    return response.data;
};

/**
 * Save TradingView signal settings
 * @param {Object} payload - Signal settings payload
 * @returns {Promise} Response from server
 */
export const saveTradingViewSignalSettings = async (payload) => {
    const response = await axiosInstance.post(
        "/ExternalSignals/SignalSettings",
        payload
    );
    return response.data;
};

/**
 * Delete TradingView signal settings
 * @param {number} strategyId - The strategy ID
 * @returns {Promise} Response from server
 */
export const deleteTradingViewSignalSettings = async (strategyId) => {
    const response = await axiosInstance.delete(
        `/ExternalSignals/SignalSettings?StrategyId=${strategyId}`
    );
    return response.data;
};
