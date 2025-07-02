import { useRef, useState } from "react";
import { FiMenu, FiX, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";
import {
  accountHolder,
  algoLogo,
  backTestingIcon,
  brokerIcon,
  dashboardIcon,
  raAlgosIcon,
  strategiesIcon,
  subscriptionIcon,
  tradingIcon,
} from "../../assets";

const Sidebar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeout = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(hideTimeout.current);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();
  const isSimulator = location.pathname.startsWith("/backtesting/simulator");

  const navItems = [
    {
      icon: dashboardIcon,
      name: "Dashboard",
      path: "/",
    },
    {
      icon: tradingIcon,
      name: "Trading",
      isParent: true,
      children: [
        { name: "Strategy Builder", path: "/trading/strategy-builder" },
        { name: "Tradingview Signals Trading", path: "/trading/signals" },
      ],
    },
    {
      icon: strategiesIcon,
      name: "Strategies",
      path: "/strategies",
    },
    {
      icon: raAlgosIcon,
      name: "Ra Algos",
      path: "/raalgo",
    },
    {
      icon: backTestingIcon,
      name: "Backtesting",
      isParent: true,
      children: [
        { name: "Strategy Backtest", path: "/backtesting/strategybacktest" },
        { name: "Simulator", path: "/backtesting/simulator" },
      ],
    },
    {
      icon: brokerIcon,
      name: "Broker",
      path: "/broker",
    },
    {
      icon: subscriptionIcon,
      name: "Subscription",
      path: "/subscription",
    },
  ];

  return (
    <>
      <div className="md:hidden p-4 fixed top-0 left-0 z-50">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <aside
        className={`${
          isOpen ? "block" : "hidden"
        } md:block bg-white dark:bg-[#15171C] ${
          isSimulator ? "w-16" : "w-64"
        } fixed border-r border-[#26272F33] dark:border-[#1E2027] h-full z-40 transition-all duration-200`}
      >
        <div className="w-full p-4 border-b border-[#26272F33] dark:border-[#1E2027] flex items-center justify-center">
          <img src={algoLogo} alt="Logo" />
        </div>

        <ul
          className={`mt-4 text-sm space-y-2 text-gray-700 dark:text-gray-300 ${
            isSimulator ? "px-2" : "px-6"
          }`}
        >
          {navItems.map((item) => {
            const isParentActive = item.children?.some(
              (child) => location.pathname === child.path
            );

            if (item.children) {
              return (
                <li key={item.name}>
                  <button
                    className={`flex items-center w-full ml-2 space-x-3 py-2 focus:outline-none relative group ${
                      isParentActive
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-gray-700 dark:text-gray-400"
                    }`}
                    onClick={() =>
                      !isSimulator &&
                      setOpenMenus((prev) => ({
                        ...prev,
                        [item.name]: !prev[item.name],
                      }))
                    }
                  >
                    <div className="relative group">
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-5 h-5 cursor-pointer"
                      />
                      {isSimulator && (
                        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
                          {item.name}
                        </span>
                      )}
                    </div>

                    {!isSimulator && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {openMenus[item.name] ? (
                          <FiChevronDown size={14} />
                        ) : (
                          <FiChevronRight size={14} />
                        )}
                      </>
                    )}
                  </button>

                  {openMenus[item.name] && !isSimulator && (
                    <ul className="ml-8 mt-2 space-y-1">
                      {item.children.map((sub) => (
                        <li key={sub.name}>
                          <NavLink
                            to={sub.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                              `block py-1 text-sm ${
                                isActive
                                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                                  : "text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300"
                              }`
                            }
                          >
                            • {sub.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 ml-2 py-2 transition-colors group ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : "hover:text-blue-500 dark:hover:text-blue-300 text-gray-700 dark:text-gray-400"
                    }`
                  }
                >
                  <div className="relative">
                    <img src={item.icon} alt={item.name} className="w-5 h-5" />
                    {isSimulator && (
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
                        {item.name}
                      </span>
                    )}
                  </div>
                  {!isSimulator && <span>{item.name}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div
          className={`absolute bottom-4 ${
            isSimulator ? "left-2" : "left-6"
          } group`}
        >
          <div className="relative">
            {!isSimulator && (
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={accountHolder}
                  alt="User"
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex flex-col text-sm">
                  <span className="text-gray-400">Hello</span>
                  <span className="font-semibold text-black dark:text-white">
                    Jasnek Singh
                  </span>
                </div>
              </div>
            )}

            {isVisible && !isSimulator && (
              <div
                className="absolute bottom-full left-0 mb-4 z-50"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="w-64 rounded-2xl border border-[#DFEAF2] dark:border-[#1E2027] bg-white dark:bg-[#15171C] p-4 space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={accountHolder}
                      alt="User"
                      className="w-14 h-14 rounded-full"
                    />
                    <div>
                      <div className="text-xs text-gray-500">AR1001</div>
                      <div className="text-base font-semibold text-[#2E3A59] dark:text-white">
                        Jasnek Singh
                      </div>
                      <span className="inline-block mt-1 px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                        Pro
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#E6EDF4] dark:border-[#1E2027] pt-4 space-y-3 text-sm text-[#4C5A71] dark:text-gray-300">
                    <NavLink to="/profile" className="block hover:underline">
                      My Profile
                    </NavLink>
                    <NavLink
                      to="/subscriptions"
                      className="block hover:underline"
                    >
                      My Subscription
                    </NavLink>
                    <button className="block hover:underline text-left w-full">
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
