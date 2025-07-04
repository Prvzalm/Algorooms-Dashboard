import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import {
  profileActivePlanIcon,
  profileBacktestIcon,
  profileMan,
  profileWalletIcon,
} from "../../../assets";

const ProfilePage = () => {
  const [user, setUser] = useState({
    name: "Jasnek Singh",
    userId: "AR1001",
    email: "jasneksingh@gmail.com",
    mobile: "+91-9876543210",
    wallet: 0.0,
    credit: 0.0,
    plan: "Limited",
    joined: "02/05/2025",
    referral: "https://web.algorooms.com/login?referral_code=AR85105",
  });

  const [subscription, setSubscription] = useState({
    type: "Broker",
    name: "Unlimited",
    startDate: "21/05/2025",
    endDate: "25/08/2025",
    expiresIn: 20,
  });
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="p-6 text-sm text-gray-800 dark:text-white space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-1/3 rounded-2xl overflow-hidden">
          <img
            src={profileMan}
            alt={user.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#343C6A] to-[#343C6A00]" />
          <div className="absolute bottom-3 left-4 text-white font-semibold text-lg z-10">
            {user.name}
          </div>
        </div>

        <div className="bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl p-6 w-full space-y-4 text-sm text-[#2E3A59] dark:text-white">
          <div className="flex flex-wrap justify-between items-start gap-6">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                User Id
              </div>
              <div className="font-semibold">{user.userId}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Mail id
              </div>
              {isEditing ? (
                <input
                  type="email"
                  className="bg-[#F5F9FF] dark:bg-[#1E2027] rounded px-2 py-1"
                  value={user.email}
                  onChange={(e) =>
                    setUser((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              ) : (
                <div className="font-semibold">{user.email}</div>
              )}
            </div>

            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Mobile Number
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="bg-[#F5F9FF] dark:bg-[#1E2027] rounded px-2 py-1"
                  value={user.mobile}
                  onChange={(e) =>
                    setUser((prev) => ({ ...prev, mobile: e.target.value }))
                  }
                />
              ) : (
                <div className="font-semibold">{user.mobile}</div>
              )}
            </div>

            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="text-green-600 flex items-center space-x-1 mt-1 hover:underline"
              >
                <FiEdit2 size={14} />
                <span>Save</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 flex items-center space-x-1 mt-1 hover:underline"
              >
                <FiEdit2 size={14} />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-between items-start gap-6 pt-4">
            <div className="flex items-center space-x-2 mt-2">
              <div className="rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <img
                  src={profileWalletIcon}
                  alt="Wallet"
                  className="w-10 h-10"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Wallet Amount
                </div>
                <div className="text-base font-medium text-[#2E3A59] dark:text-white">
                  ₹ {user.wallet}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <img
                  src={profileBacktestIcon}
                  alt="Credit"
                  className="w-10 h-10"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Backtest Credit
                </div>
                <div className="text-base font-medium text-[#2E3A59] dark:text-white">
                  {user.credit}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <img
                  src={profileActivePlanIcon}
                  alt="Plan"
                  className="w-10 h-10"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Active Plan
                </div>
                <div className="text-base font-medium text-[#2E3A59] dark:text-white">
                  {user.plan}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-[#1E2027] flex flex-wrap justify-between text-xs">
            <div>
              <div className="text-[#718EBF]">Referral Link:</div>
              <a
                href={user.referral}
                className="text-[#2E3A59] dark:text-white break-all underline"
              >
                {user.referral}
              </a>
            </div>
            <div className="text-right">
              <div className="text-gray-500 dark:text-gray-400">Joined on</div>
              <div className="font-medium">{user.joined}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 space-y-3">
          <div className="text-xl font-semibold text-[#2E3A59] dark:text-white">
            Change Password
          </div>
          <div className="bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl p-6 space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#718EBF] dark:text-gray-400">
                Old Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full p-4 bg-[#F5F9FF] dark:bg-[#1E2027] text-gray-700 dark:text-white placeholder-gray-400 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#718EBF] dark:text-gray-400">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter your new password"
                className="w-full p-4 bg-[#F5F9FF] dark:bg-[#1E2027] text-gray-700 dark:text-white placeholder-gray-400 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button
              className="mt-4 py-2 px-4 w-1/2 bg-[#0096FF] hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all"
              onClick={() => alert("Password changed successfully")}
            >
              Change
            </button>
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="text-xl font-semibold text-[#2E3A59] dark:text-white">
            Subscriptions
          </div>
          <div className="bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-3 gap-6 text-sm text-[#2E3A59] dark:text-white">
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  Subscription Type
                </div>
                <div className="text-base font-semibold">
                  {subscription.type}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  Plan Name
                </div>
                <div className="text-base font-semibold">
                  {subscription.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  Start Date
                </div>
                <div className="text-base font-semibold">
                  {subscription.startDate}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  End Date
                </div>
                <div className="text-base font-semibold">
                  {subscription.endDate}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  End Date
                </div>
                <div className="text-base font-semibold text-blue-600 cursor-pointer hover:underline">
                  Change Plan
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#718EBF] mb-1 mt-4 dark:text-gray-400">
                Expire
              </div>
              <div className="text-sm text-red-500">
                Your current subscription expire in{" "}
                <span className="text-base font-semibold">
                  {subscription.expiresIn} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
