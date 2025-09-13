import { useQuery } from '@tanstack/react-query';
import { getUserReport, getTradeEngineLogs } from '../api/reportsApi';

// Hook to fetch user reports
export const useUserReports = (params, options = {}) => {
    return useQuery({
        queryKey: ['userReports', params],
        queryFn: () => getUserReport(params),
        enabled: !!(params.fromDate && params.toDate), // Only fetch if dates are provided
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
        ...options
    });
};

// Hook to fetch trade engine logs
export const useTradeEngineLogs = (params, options = {}) => {
    return useQuery({
        queryKey: ['tradeEngineLogs', params],
        queryFn: () => getTradeEngineLogs(params),
        enabled: !!(params.fromDate && params.toDate), // Only fetch if dates are provided
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
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
