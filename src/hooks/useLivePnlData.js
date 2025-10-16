// Custom hook to use centralized PNL store in StrategiesPage
import { useEffect } from "react";
import { usePnlStore } from "../stores/pnlStore";

export const useLivePnlData = (deployedData, isLoading, isError) => {
    const subscribeToLiveUpdates = usePnlStore(
        (state) => state.subscribeToLiveUpdates
    );
    const unsubscribeFromLiveUpdates = usePnlStore(
        (state) => state.unsubscribeFromLiveUpdates
    );
    const brokers = usePnlStore((state) => state.brokers);
    const grandTotalPnl = usePnlStore((state) => state.grandTotalPnl);

    useEffect(() => {
        if (!deployedData || isLoading || isError) return;

        // Subscribe to live updates via centralized store
        subscribeToLiveUpdates(deployedData);

        // Cleanup on unmount
        return () => {
            unsubscribeFromLiveUpdates();
        };
    }, [
        deployedData,
        isLoading,
        isError,
        subscribeToLiveUpdates,
        unsubscribeFromLiveUpdates,
    ]);

    return {
        brokers,
        grandTotalPnl,
    };
};
