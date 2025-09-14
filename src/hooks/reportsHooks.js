import { useQuery } from '@tanstack/react-query';
import { getUserReport, getTradeEngineLogs } from '../api/reportsApi';

// Hook to fetch user reports
export const useUserReports = (params, options = {}) => {
    // Break queryKey into primitives to avoid re-fetches due to object identity changes
    const { fromDate, toDate, brokerClientFilter, strategyMode } = params || {};
    // Normalize dates to date-only (YYYY-MM-DD) so that time component changes (like new Date().toISOString())
    // don't create a brand new cache key when routing away/back quickly.
    const fromKey = fromDate ? new Date(fromDate).toISOString().split('T')[0] : null;
    const toKey = toDate ? new Date(toDate).toISOString().split('T')[0] : null;
    return useQuery({
        queryKey: [
            'userReports',
            fromKey,
            toKey,
            brokerClientFilter || 'all',
            strategyMode || 'live'
        ],
        queryFn: () => getUserReport({
            fromDate,
            toDate,
            brokerClientFilter: brokerClientFilter || 'all',
            strategyMode: strategyMode || 'live'
        }),
        enabled: !!(fromDate && toDate), // Only fetch if dates are provided
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options
    });
};

// Hook to fetch trade engine logs
export const useTradeEngineLogs = (params, options = {}) => {
    const { fromDate, toDate, brokerClientFilter, strategyMode } = params || {};
    const fromKey = fromDate ? new Date(fromDate).toISOString().split('T')[0] : null;
    const toKey = toDate ? new Date(toDate).toISOString().split('T')[0] : null;
    return useQuery({
        queryKey: [
            'tradeEngineLogs',
            fromKey,
            toKey,
            brokerClientFilter || 'all',
            strategyMode || 'live'
        ],
        queryFn: () => getTradeEngineLogs({
            fromDate,
            toDate,
            brokerClientFilter: brokerClientFilter || 'all',
            strategyMode: strategyMode || 'live'
        }),
        enabled: !!(fromDate && toDate), // Only fetch if dates are provided
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...options
    });
};

// Helper function to get default date range (current date - 1 year)
export const getDefaultDateRange = () => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setFullYear(fromDate.getFullYear() - 1);

    return {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString()
    };
};

// Helper function to format date for display
export const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

// Helper function to format currency
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0.00';
    return `₹${Number(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};
