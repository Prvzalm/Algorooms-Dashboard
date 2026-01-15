import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import {
  bellHeaderIcon,
  darkModeHeaderIcon,
  lightHeaderIcon,
  walletHeaderIcon,
} from "../../assets";
import { useEffect, useState } from "react";
import octopusInstance from "../../services/WebSockets/feeds/octopusInstance";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const [isBetaEnabled, setIsBetaEnabled] = useState(false);

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
    } else {
      document.cookie = "ui=v1; path=/";
    }
  };

  return (
    <header className="w-full bg-white dark:bg-darkbg p-6 flex justify-end border-b border-[#26272F33] dark:border-gray-700 items-center h-16 fixed top-0 z-30 space-x-6">
      {/* Beta Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Beta
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
