import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import {
  bellHeaderIcon,
  darkModeHeaderIcon,
  lightHeaderIcon,
  walletHeaderIcon,
} from "../../assets";
import { useEffect } from "react";
import octopusInstance from "../../services/WebSockets/feeds/octopusInstance";

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    octopusInstance.connect();
  }, []);

  return (
    <header className="w-full bg-white dark:bg-darkbg p-6 flex justify-end border-b border-[#26272F33] dark:border-gray-700 items-center h-16 fixed top-0 z-30 space-x-6">
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
