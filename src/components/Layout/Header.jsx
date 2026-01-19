import { useTheme } from "../../context/ThemeContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  bellHeaderIcon,
  darkModeHeaderIcon,
  lightHeaderIcon,
  walletHeaderIcon,
} from "../../assets";
import { useEffect, useState } from "react";
import octopusInstance from "../../services/WebSockets/feeds/octopusInstance";
import { useUpdateBrokerAuthCode } from "../../hooks/brokerHooks";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isBetaEnabled, setIsBetaEnabled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { mutateAsync } = useUpdateBrokerAuthCode();

  useEffect(() => {
    console.log({
      path: location.pathname,
      search: location.search,
      queryKey: localStorage.getItem("brokerAuthqueryString"),
    });

    if (!location.pathname.includes("connect-broker")) return;

    const params = new URLSearchParams(location.search);
    const queryKey = localStorage.getItem("brokerAuthqueryString");

    if (!queryKey) return;

    const requestToken = params.get(queryKey);
    console.log(requestToken, "request_Token");
    const brokerClientId = localStorage.getItem("BrokerClientId");
    const jwt = localStorage.getItem("Authorization");

    if (!requestToken || !brokerClientId || !jwt) return;

    (async () => {
      try {
        await mutateAsync({
          BrokerClientId: brokerClientId,
          RequestToken: requestToken,
          JwtToken: jwt,
        });
        navigate("/", { replace: true });
      } finally {
        localStorage.removeItem("BrokerClientId");
        localStorage.removeItem("brokerAuthqueryString");
      }
    })();
  }, [location, location.pathname, location.search, mutateAsync, navigate]);

  useEffect(() => {
    octopusInstance.connect();

    // Read cookie on mount to persist state
    const cookies = document.cookie.split(";");
    const uiCookie = cookies.find((cookie) => cookie.trim().startsWith("ui="));

    if (uiCookie) {
      const uiValue = uiCookie.split("=")[1];
      setIsBetaEnabled(uiValue === "v2");
    } else {
      // Set default cookie if not exists
      document.cookie = "ui=v1; path=/";
    }
  }, []);

  const handleBetaToggle = () => {
    const newValue = !isBetaEnabled;
    setIsBetaEnabled(newValue);

    if (newValue) {
      document.cookie = "ui=v2; path=/";
      window.location.reload();
    } else {
      document.cookie = "ui=v1; path=/";
      window.location.reload();
    }
  };

  return (
    <header className="w-full bg-white dark:bg-darkbg p-6 flex justify-end border-b border-[#26272F33] dark:border-gray-700 items-center h-16 fixed top-0 z-30 space-x-6">
      {/* Beta Toggle */}
      <div className="flex items-center space-x-2">
        <span className="px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
          BETA
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          V1
        </span>
        <button
          onClick={handleBetaToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isBetaEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isBetaEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          V2
        </span>
      </div>

      <Link to="/wallet">
        <img
          src={walletHeaderIcon}
          className="text-black dark:text-white cursor-pointer hover:opacity-80 transition"
        />
      </Link>

      {theme === "light" ? (
        <img
          src={darkModeHeaderIcon}
          className="text-black cursor-pointer hover:opacity-80 transition"
          onClick={toggleTheme}
        />
      ) : (
        <img
          src={lightHeaderIcon}
          className="text-white cursor-pointer hover:opacity-80 transition"
          onClick={toggleTheme}
        />
      )}

      <Link to="/notifications">
        <img
          src={bellHeaderIcon}
          className="text-black dark:text-white cursor-pointer hover:opacity-80 transition"
        />
      </Link>
    </header>
  );
};

export default Header;
