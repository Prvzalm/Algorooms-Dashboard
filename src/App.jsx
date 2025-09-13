import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";

import DashboardPage from "./components/Routes/Dashboard/DashboardPage";
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
import ConnectBroker from "./components/Routes/Broker/ConnectBroker";
import Reports from "./components/Reports/Reports";

import Auth from "./components/Auth";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { Outlet } from "react-router-dom";
import { algoLogo } from "./assets";

//Protected layout with Sidebar + Header
const ProtectedLayout = () => {
  const { token, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );
  const sidebarWidth = isSidebarCollapsed ? "md:ml-16" : "md:ml-64";

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1115]">
        <div className="flex flex-col items-center gap-6">
          <img src={algoLogo} alt="Algorooms" className="select-none" />
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-[#0096FF] border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    );
  if (!token) return <Navigate to="/signin" replace />;

  return (
    <div className="min-h-screen">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      <Header />
      <main
        className={`pt-20 p-4 space-y-6 transition-all duration-200 ${sidebarWidth}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  const { token, loading } = useAuth();
  const location = useLocation();

  const normalizedPath = (location.pathname || "/").replace(/\/+$/, "") || "/";
  const isAuthPage = normalizedPath === "/signin";

  // Redirect logged-in users away from signin
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

      <Routes>
        {/* Public route */}
        <Route path="/signin" element={<Auth />} />

        {/* Protected layout routes */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/trading/strategy-builder"
            element={<StrategyBuilder />}
          />
          <Route
            path="/trading/strategy-builder/:strategyId"
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
          <Route
            path="/backtesting/strategybacktest/:strategyId"
            element={<BacktestStrategyComponent />}
          />
          <Route path="/backtesting/simulator" element={<SimulatorPage />} />
          <Route
            path="/backtesting/simulator/addfuture"
            element={<SimulatorAddFuture />}
          />
          <Route path="/broker" element={<BrokerSection />} />
          <Route path="/add-broker" element={<AddBrokerPage />} />
          <Route path="/connect-broker" element={<ConnectBroker />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Catch-all: redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
