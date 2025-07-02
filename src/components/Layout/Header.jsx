import { FiBell, FiMoon, FiSun, FiCreditCard } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full bg-white dark:bg-darkbg p-6 flex justify-end border-b border-[#26272F33] dark:border-gray-700 items-center h-16 fixed top-0 z-30 space-x-6">
      <Link to="/wallet">
        <FiCreditCard
          className="text-black dark:text-white cursor-pointer hover:opacity-80 transition"
          size={20}
        />
      </Link>

      {theme === "light" ? (
        <FiMoon
          className="text-black cursor-pointer hover:opacity-80 transition"
          size={20}
          onClick={toggleTheme}
        />
      ) : (
        <FiSun
          className="text-white cursor-pointer hover:opacity-80 transition"
          size={20}
          onClick={toggleTheme}
        />
      )}

      <Link to="/notifications">
        <FiBell
          className="text-black dark:text-white cursor-pointer hover:opacity-80 transition"
          size={20}
        />
      </Link>
    </header>
  );
};

export default Header;
