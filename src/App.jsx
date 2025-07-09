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

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="text-center pt-20">Loading...</div>;
  }

  return token ? children : <Navigate to="/signin" replace />;
};

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/signin";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );

  const sidebarWidth = isSidebarCollapsed ? "md:ml-16" : "md:ml-64";

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
      />
      {isAuthPage ? (
        <Routes>
          <Route path="/signin" element={<Auth />} />
        </Routes>
      ) : (
        <div className="min-h-screen">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
          <Header />
          <main
            className={`pt-20 p-4 space-y-6 transition-all duration-200 ${sidebarWidth}`}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trading/strategy-builder"
                element={
                  <ProtectedRoute>
                    <StrategyBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trading/signals"
                element={
                  <ProtectedRoute>
                    <TradingviewSignalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <SubscriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <WalletPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute>
                    <SubscriptionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/strategies"
                element={
                  <ProtectedRoute>
                    <StrategiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/raalgo"
                element={
                  <ProtectedRoute>
                    <RaAlgosPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backtesting/strategybacktest"
                element={
                  <ProtectedRoute>
                    <BacktestStrategyComponent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backtesting/simulator"
                element={
                  <ProtectedRoute>
                    <SimulatorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backtesting/simulator/addfuture"
                element={
                  <ProtectedRoute>
                    <SimulatorAddFuture />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/broker"
                element={
                  <ProtectedRoute>
                    <BrokerSection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-broker"
                element={
                  <ProtectedRoute>
                    <AddBrokerPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
