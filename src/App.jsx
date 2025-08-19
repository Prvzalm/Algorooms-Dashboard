import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import DashboardPage from "./components/Routes/Dashboard/DashboardPage";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import StrategyBuilder from "./components/Routes/StrategyBuilderComponents/StrategyBuilder";
import TradingviewSignalsPage from "./components/Routes/TradingViewSignalComponents/TradingviewSignalsPage";
import ProfilePage from "./components/Routes/ProfileComponents/ProfilePage";
import WalletPage from "./components/Routes/Wallet/WalletPage";
import SubscriptionsPage from "./components/Routes/Subscriptions/SubscriptionsPage";
import NotificationsPage from "./components/Routes/Notifications/NotificationsPage";
import RaAlgosPage from "./components/Routes/RaAlgos/RaAlgosPage";
import BacktestStrategyComponent from "./components/Routes/BackTest/BacktestStrategyComponent";
import StrategiesPage from "./components/Routes/Strategies/StrategiesPage";
import BrokerSection from "./components/Routes/Broker/BrokerSection";
import AddBrokerPage from "./components/Routes/Broker/AddBrokerPage";
import SimulatorPage from "./components/Routes/Simulator/SimulatorPage";
import SimulatorAddFuture from "./components/Routes/SimulatorAddFuture/SimulatorAddFuture";
import Auth from "./components/Auth";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import LivePCRGauge from "./components/LivePCR";
import { Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { token, loading } = useAuth();

  if (loading) return <div className="text-center pt-20">Loading...</div>;

  return token ? <Outlet /> : <Navigate to="/signin" replace />;
};

function App() {
  const { token, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === "/signin";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );

  const sidebarWidth = isSidebarCollapsed ? "md:ml-16" : "md:ml-64";

  if (!loading && token && isAuthPage) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
      />

{token && (
        <>
          <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
          <Header />
        </>
      )}

      <Routes>
        <Route path="/signin" element={<Auth />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/trading/strategy-builder"
            element={<StrategyBuilder />}
          />
          <Route path="/trading/signals" element={<TradingviewSignalsPage />} />
          <Route path="/subscription" element={<SubscriptionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/strategies" element={<StrategiesPage />} />
          <Route path="/raalgo" element={<RaAlgosPage />} />
          <Route
            path="/backtesting/strategybacktest"
            element={<BacktestStrategyComponent />}
          />
          <Route path="/backtesting/simulator" element={<SimulatorPage />} />
          <Route
            path="/backtesting/simulator/addfuture"
            element={<SimulatorAddFuture />}
          />
          <Route path="/broker" element={<BrokerSection />} />
          <Route path="/add-broker" element={<AddBrokerPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
