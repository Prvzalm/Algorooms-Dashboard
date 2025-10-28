import { useEffect, useRef, useState } from "react";
import {
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  accountHolder,
  algoLogo,
  backTestingIcon,
  brokerIcon,
  dashboardIcon,
  raAlgosIcon,
  selectedBackTestingIcon,
  selectedBrokerIcon,
  selectedDashboardIcon,
  selectedRaAlgosIcon,
  selectedStrategyIcon,
  selectedSubscriptionIcon,
  selectedTradingIcon,
  shrinkLogo,
  strategiesIcon,
  subscriptionIcon,
  tradingIcon,
} from "../../assets";
import { useAuth } from "../../context/AuthContext";
import { useProfileQuery } from "../../hooks/profileHooks";
import Avatar from "../common/Avatar";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const hideTimeout = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: profile, isLoading } = useProfileQuery();

  const isMobile = window.innerWidth < 768;
  const sidebarExpanded = isMobile ? true : !isCollapsed || isHovered;

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setIsCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", isCollapsed);
  }, [isCollapsed]);

  const handleMouseEnter = () => {
    clearTimeout(hideTimeout.current);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setIsVisible(false);
    }, 200);
  };

  const handleSignOut = () => {
    logout();
    navigate("/signin");
  };

  const navItems = [
    {
      icon: dashboardIcon,
      selectedIcon: selectedDashboardIcon,
      name: "Dashboard",
      path: "/",
    },
    {
      icon: tradingIcon,
      selectedIcon: selectedTradingIcon,
      name: "Trading",
      isParent: true,
      children: [
        { name: "Strategy Builder", path: "/trading/strategy-builder" },
        // { name: "Tradingview Signals Trading", path: "/trading/signals" },
      ],
    },
    {
      icon: strategiesIcon,
      selectedIcon: selectedStrategyIcon,
      name: "Strategies",
      path: "/strategies",
    },
    // {
    //   icon: raAlgosIcon,
    //   selectedIcon: selectedRaAlgosIcon,
    //   name: "Ra Algos",
    //   path: "/raalgo",
    // },
    {
      icon: backTestingIcon,
      selectedIcon: selectedBackTestingIcon,
      name: "Backtesting",
      isParent: true,
      children: [
        { name: "Strategy Backtest", path: "/backtesting/strategybacktest" },
        { name: "Simulator", path: "/backtesting/simulator" },
      ],
    },
    {
      icon: brokerIcon,
      selectedIcon: selectedBrokerIcon,
      name: "Broker",
      path: "/broker",
    },
    {
      icon: strategiesIcon,
      selectedIcon: selectedStrategyIcon,
      name: "Reports",
      path: "/reports",
    },
    {
      icon: subscriptionIcon,
      selectedIcon: selectedSubscriptionIcon,
      name: "Subscription",
      path: "/subscription",
    },
  ];

  return (
    <>
      <div className="md:hidden p-4 fixed top-0 left-0 z-50">
        <button onClick={() => setIsOpen(!isOpen)}>
          <FiMenu size={24} />
        </button>
      </div>
      <div
        className={`fixed inset-0 z-50 md:static md:inset-auto md:z-40 ${
          isOpen ? "block" : "hidden"
        } md:block`}
      >
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`bg-[#F8F9FB] dark:bg-[#131419] transition-all duration-300
            ${sidebarExpanded ? "w-64" : "w-16"}
            fixed h-full z-40 border-r border-[#26272F33] dark:border-[#1E2027]`}
        >
          {isOpen && (
            <button
              className="absolute top-4 right-4 z-50 md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <FiX size={24} />
            </button>
          )}
          <div className="bg-white dark:bg-[#0F1014] w-full h-16 px-4 border-b border-[#26272F33] dark:border-[#1E2027] flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="focus:outline-none"
            >
              <img
                src={sidebarExpanded ? algoLogo : shrinkLogo}
                alt="Logo"
                className={`${
                  sidebarExpanded ? "w-auto" : "w-6 h-6"
                } hover:opacity-90 transition`}
              />
            </button>
            {!isOpen && (
              <button
                onClick={() =>
                  setIsCollapsed((prev) => {
                    localStorage.setItem("sidebar-collapsed", !prev);
                    return !prev;
                  })
                }
                className="ml-auto bg-white dark:bg-[#0F1014] border rounded-full shadow p-1"
              >
                {isCollapsed ? (
                  <FiChevronRight size={16} />
                ) : (
                  <FiChevronLeft size={16} />
                )}
              </button>
            )}
          </div>

          <ul
            className={`mt-4 text-sm space-y-1 text-gray-700 dark:text-gray-300 ${
              sidebarExpanded ? "px-6" : "px-2"
            }`}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isParentActive = item.children?.some(
                (child) => location.pathname === child.path
              );

              return (
                <li key={item.name}>
                  {item.children ? (
                    <>
                      <button
                        className={`flex items-center w-full ml-2 space-x-3 py-3 px-3 rounded-lg transition-all focus:outline-none relative group ${
                          isParentActive
                            ? "bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] text-white font-semibold shadow-md"
                            : "hover:bg-gray-200 dark:hover:bg-[#1E2027] text-gray-700 dark:text-gray-400"
                        }`}
                        onClick={() =>
                          setOpenMenus((prev) => ({
                            ...prev,
                            [item.name]: !prev[item.name],
                          }))
                        }
                      >
                        <div className="relative group">
                          <img
                            src={isParentActive ? item.selectedIcon : item.icon}
                            alt={item.name}
                            className={`w-5 h-5 ${
                              isParentActive ? "brightness-0 invert" : ""
                            }`}
                          />
                          {!sidebarExpanded && (
                            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
                              {item.name}
                            </span>
                          )}
                        </div>
                        {sidebarExpanded && (
                          <>
                            <span className="flex-1 text-left">
                              {item.name}
                            </span>
                            {openMenus[item.name] ? (
                              <FiChevronDown size={14} />
                            ) : (
                              <FiChevronRight size={14} />
                            )}
                          </>
                        )}
                      </button>
                      {openMenus[item.name] && sidebarExpanded && (
                        <ul className="ml-8 mt-2 space-y-1">
                          {item.children.map((sub) => (
                            <li key={sub.name}>
                              <NavLink
                                to={sub.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                  `block py-1 text-sm ${
                                    isActive
                                      ? "text-[#0096FF] dark:text-blue-400 font-semibold"
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
                    </>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 ml-2 py-3 px-3 rounded-lg transition-all group ${
                          isActive
                            ? "bg-[radial-gradient(circle,_#1B44FE_0%,_#5375FE_100%)] text-white font-semibold shadow-md"
                            : "hover:bg-gray-200 dark:hover:bg-[#1E2027] text-gray-700 dark:text-gray-400"
                        }`
                      }
                    >
                      <div className="relative">
                        <img
                          src={
                            location.pathname === item.path
                              ? item.selectedIcon
                              : item.icon
                          }
                          alt={item.name}
                          className={`w-5 h-5 ${
                            location.pathname === item.path
                              ? "brightness-0 invert"
                              : ""
                          }`}
                        />
                        {!sidebarExpanded && (
                          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition">
                            {item.name}
                          </span>
                        )}
                      </div>
                      {sidebarExpanded && <span>{item.name}</span>}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>

          <div
            className={`absolute bottom-4 left-0 w-full ${
              sidebarExpanded ? "px-6" : "px-2"
            } group`}
          >
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className={`relative ${
                sidebarExpanded
                  ? "flex space-x-3 items-center"
                  : "flex justify-center"
              }`}
            >
              <Avatar
                src={profile?.AvtarURL}
                name={profile?.Name}
                className="w-10 h-10 rounded-full"
                fontSize="text-xs"
              />
              {sidebarExpanded && (
                <div className="flex flex-col text-sm">
                  <span className="text-gray-400">{profile?.UserId}</span>
                  <span className="font-semibold text-black dark:text-white">
                    {profile?.Name}
                  </span>
                </div>
              )}
            </div>

            {isVisible && sidebarExpanded && !isLoading && (
              <div
                className="absolute bottom-full left-0 mb-4 z-50"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="w-64 rounded-2xl border border-[#DFEAF2] dark:border-[#1E2027] bg-[#F8F9FB] dark:bg-[#131419] p-4 space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={profile?.AvtarURL}
                      name={profile?.Name}
                      className="w-14 h-14 rounded-full"
                      fontSize="text-lg"
                    />
                    <div>
                      <div className="text-xs text-gray-500">
                        {profile?.UserId}
                      </div>
                      <div className="text-base font-semibold text-[#2E3A59] dark:text-white">
                        {profile?.Name}
                      </div>
                      <span className="inline-block mt-1 px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                        {profile?.ProfileDescription}
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
                    <button
                      onClick={handleSignOut}
                      className="block hover:underline text-left w-full"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
