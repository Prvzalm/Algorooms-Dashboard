import axiosInstance from './axiosInstance';

// Get user reports with date range and filters
export const getUserReport = async (params) => {
    try {
        const requestData = {
            fromdate: params.fromDate,
            todate: params.toDate,
            BrokerClientFilter: params.brokerClientFilter || "all",
            StrategyMode: params.strategyMode || "live"
        };

        const response = await axiosInstance.post('/Reports/GetUserReport', requestData);

        if (response.data.Status === 'Success') {
            return response.data.Data;
        } else {
            throw new Error(response.data.Message || 'Failed to fetch reports');
        }
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
    }
};

// Get trade engine logs
export const getTradeEngineLogs = async (params) => {
    try {
        const requestData = {
            fromdate: params.fromDate,
            todate: params.toDate,
            BrokerClientFilter: params.brokerClientFilter || "all",
            StrategyMode: params.strategyMode || "live"
        };

        const response = await axiosInstance.post('/Reports/GetTradeEngineLogs', requestData);

        if (response.data.Status === 'Success') {
            return response.data.Data;
        } else {
            throw new Error(response.data.Message || 'Failed to fetch trade engine logs');
        }
    } catch (error) {
        console.error('Error fetching trade engine logs:', error);
        throw error;
    }
};
