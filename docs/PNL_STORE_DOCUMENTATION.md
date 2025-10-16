# Centralized PNL Store - Documentation

## Overview

Yeh centralized PNL management system hai jo **Zustand** aur **TanStack Query** ka hybrid approach use karta hai for optimal performance and state management.

## Architecture

### 1. **TanStack Query** - Server State

- Initial API data fetch karta hai
- Automatic caching and refetching
- Already project mein use ho raha tha

### 2. **Zustand Store** - Live WebSocket State

- Real-time PNL updates manage karta hai
- Single source of truth for live data
- Centralized WebSocket subscription management
- Optimized re-renders with selectors

## Benefits ✅

### 1. **Centralized WebSocket Management**

- ✅ Ek hi jagah se sab WebSocket connections manage hote hain
- ✅ Multiple components mein duplicate subscriptions nahi hote
- ✅ Automatic cleanup on unmount
- ✅ Prevents memory leaks

### 2. **Optimized Performance**

- ✅ Selective re-renders with Zustand selectors
- ✅ Components sirf apne required data ko subscribe karte hain
- ✅ Unnecessary re-renders avoid hote hain
- ✅ Better than useState for global state

### 3. **Code Reusability**

- ✅ Same PNL logic Dashboard aur StrategiesPage dono mein reuse
- ✅ Helper functions ek jagah centralized
- ✅ Easy to maintain and debug

### 4. **Developer Experience**

- ✅ Simple API with custom hooks
- ✅ TypeScript-ready (can add types easily)
- ✅ DevTools support (Zustand devtools)

## File Structure

```
src/
├── stores/
│   └── pnlStore.js          # Centralized Zustand store for PNL
├── hooks/
│   ├── dashboardHooks.js    # TanStack Query hooks for API
│   └── useLivePnlData.js    # Custom hook for StrategiesPage
└── components/
    └── Routes/
        └── Dashboard/
            └── DashboardPage.jsx  # Uses centralized store
```

## Usage Examples

### 1. **Initialize Store with API Data**

```javascript
import { usePnlStore } from "../stores/pnlStore";
import { useBrokerwiseStrategies } from "../hooks/dashboardHooks";

const MyComponent = () => {
  // Get API data via TanStack Query
  const { data: apiData, isLoading, isError } = useBrokerwiseStrategies();

  // Get store action
  const subscribeToLiveUpdates = usePnlStore(
    (state) => state.subscribeToLiveUpdates
  );
  const unsubscribeFromLiveUpdates = usePnlStore(
    (state) => state.unsubscribeFromLiveUpdates
  );

  useEffect(() => {
    if (!apiData || isLoading || isError) return;

    // Subscribe to live updates
    subscribeToLiveUpdates(apiData);

    // Cleanup on unmount
    return () => {
      unsubscribeFromLiveUpdates();
    };
  }, [apiData, isLoading, isError]);
};
```

### 2. **Use Optimized Selectors (Best Performance)**

```javascript
import {
  useBrokerPnl,
  useBrokerStrategies,
  useTopGainerLoser,
} from "../stores/pnlStore";

const DashboardComponent = ({ selectedBrokerCode }) => {
  // These hooks will only trigger re-render when their specific data changes
  const brokerPnl = useBrokerPnl(selectedBrokerCode);
  const strategies = useBrokerStrategies(selectedBrokerCode);
  const { topGainer, topLoser } = useTopGainerLoser(selectedBrokerCode);

  return (
    <div>
      <h2>Broker PNL: ₹{brokerPnl.toFixed(2)}</h2>
      <p>Top Gainer: {topGainer?.name}</p>
      <p>Top Loser: {topLoser?.name}</p>
    </div>
  );
};
```

### 3. **Access Full Store Data**

```javascript
import { usePnlStore } from "../stores/pnlStore";

const FullDataComponent = () => {
  // Get all brokers (will re-render on any broker update)
  const brokers = usePnlStore((state) => state.brokers);
  const grandTotalPnl = usePnlStore((state) => state.grandTotalPnl);

  return (
    <div>
      <h1>Grand Total: ₹{grandTotalPnl.toFixed(2)}</h1>
      {brokers.map((broker) => (
        <div key={broker.broker.code}>
          {broker.broker.name}: ₹{broker.brokerPNL.toFixed(2)}
        </div>
      ))}
    </div>
  );
};
```

### 4. **Manual Store Actions**

```javascript
import { usePnlStore } from "../stores/pnlStore";

const ControlComponent = () => {
  const getBrokerByCode = usePnlStore((state) => state.getBrokerByCode);
  const reset = usePnlStore((state) => state.reset);

  const handleLogout = () => {
    // Reset store on logout
    reset();
  };

  const checkBroker = (code) => {
    const broker = getBrokerByCode(code);
    console.log("Broker PNL:", broker?.brokerPNL);
  };

  return <button onClick={handleLogout}>Logout</button>;
};
```

## Store API Reference

### State

- `brokers`: Array of broker objects with strategies and PNL
- `grandTotalPnl`: Total PNL across all brokers
- `isSubscribed`: Boolean indicating WebSocket subscription status
- `wsHandlers`: Array of WebSocket handler references

### Actions

- `initializeFromApi(apiData)`: Initialize store with API data
- `subscribeToLiveUpdates(apiData)`: Start WebSocket subscriptions
- `unsubscribeFromLiveUpdates()`: Stop all WebSocket subscriptions
- `getBrokerByCode(brokerCode)`: Get specific broker by code
- `getStrategiesForBroker(brokerCode)`: Get strategies for a broker
- `getBrokerPnl(brokerCode)`: Get PNL for specific broker
- `getTopGainerAndLoser(brokerCode)`: Get top performing strategies
- `reset()`: Reset entire store

### Custom Selector Hooks

- `useBrokerPnl(brokerCode)`: Subscribe to broker's PNL only
- `useBrokerStrategies(brokerCode)`: Subscribe to broker's strategies only
- `useTopGainerLoser(brokerCode)`: Subscribe to top gainer/loser only
- `useGrandTotalPnl()`: Subscribe to grand total PNL only

## Performance Optimization Tips

### 1. **Use Selective Selectors**

```javascript
// ❌ Bad - Re-renders on every store change
const allBrokers = usePnlStore((state) => state.brokers);

// ✅ Good - Re-renders only when specific broker changes
const brokerPnl = useBrokerPnl(brokerCode);
```

### 2. **Memoize Selector Functions**

```javascript
// ✅ Good - Memoized selector
const strategies = usePnlStore(
  useCallback(
    (state) => state.brokers.find((b) => b.broker.code === code)?.strategies,
    [code]
  )
);
```

### 3. **Avoid Prop Drilling**

```javascript
// ❌ Bad - Passing data through multiple components
<Parent>
  <Child pnl={pnl} strategies={strategies} />
</Parent>;

// ✅ Good - Direct store access in child
const Child = ({ brokerCode }) => {
  const pnl = useBrokerPnl(brokerCode);
  return <div>{pnl}</div>;
};
```

## Migration Guide

### From Local State to Centralized Store

**Before (Local State):**

```javascript
const [livePnlData, setLivePnlData] = useState({
  brokers: [],
  grandTotalPnl: 0,
});
const wsHandlersRef = useRef([]);

useEffect(() => {
  // Complex WebSocket subscription logic
  // 50+ lines of code
}, [dependencies]);
```

**After (Centralized Store):**

```javascript
const subscribeToLiveUpdates = usePnlStore(
  (state) => state.subscribeToLiveUpdates
);
const unsubscribeFromLiveUpdates = usePnlStore(
  (state) => state.unsubscribeFromLiveUpdates
);

useEffect(() => {
  if (!apiData || isLoading || isError) return;
  subscribeToLiveUpdates(apiData);
  return () => unsubscribeFromLiveUpdates();
}, [apiData, isLoading, isError]);

const brokerPnl = useBrokerPnl(selectedBrokerCode);
```

## Testing

```javascript
import { usePnlStore } from "../stores/pnlStore";

// Reset store before each test
beforeEach(() => {
  usePnlStore.getState().reset();
});

// Mock API data
const mockApiData = [
  /* your mock data */
];

// Test initialization
test("initializes store correctly", () => {
  const { initializeFromApi } = usePnlStore.getState();
  initializeFromApi(mockApiData);

  const brokers = usePnlStore.getState().brokers;
  expect(brokers.length).toBe(1);
});
```

## Debugging

### Enable Zustand DevTools

```javascript
import { devtools } from "zustand/middleware";

export const usePnlStore = create(
  devtools(
    (set, get) => ({
      // your store logic
    }),
    { name: "PNL Store" }
  )
);
```

### Log State Changes

```javascript
const brokerPnl = usePnlStore((state) => {
  console.log("Broker PNL updated:", state.brokers);
  return state.getBrokerPnl(brokerCode);
});
```

## Future Enhancements

1. **TypeScript Support**: Add proper types for better developer experience
2. **Persistence**: Add persistence middleware to save PNL data in localStorage
3. **Middleware**: Add logging, error tracking, or analytics middleware
4. **Optimistic Updates**: Update UI before API confirmation
5. **Offline Support**: Queue updates when offline and sync when online

## Comparison: TanStack Query vs Zustand

| Feature            | TanStack Query | Zustand          |
| ------------------ | -------------- | ---------------- |
| **Purpose**        | Server state   | Client/App state |
| **Caching**        | Automatic      | Manual           |
| **Refetching**     | Automatic      | Manual           |
| **Loading states** | Built-in       | Manual           |
| **WebSocket**      | Not ideal      | Perfect ✅       |
| **Bundle size**    | ~13kb          | ~1kb             |
| **Learning curve** | Medium         | Low              |

## Conclusion

Yeh hybrid approach best of both worlds provide karta hai:

- **TanStack Query** for initial API data fetching
- **Zustand** for real-time WebSocket updates

Result: Fast, maintainable, aur scalable solution! 🚀
