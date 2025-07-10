import { useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import {
  profileActivePlanIcon,
  profileBacktestIcon,
  profileMan,
  profileWalletIcon,
} from "../../../assets";
import {
  useProfileQuery,
  useSubscriptionQuery,
  useUpdateProfile,
  useWalletQuery,
} from "../../../hooks/profileHooks";
import { useChangePasswordMutation } from "../../../hooks/loginHooks";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const { data: profile, isLoading } = useProfileQuery();
  const { data: wallet } = useWalletQuery();
  const { data: subscriptionData } = useSubscriptionQuery();
  const { mutate: updateProfile, isPending, error } = useUpdateProfile();
  const { mutate: changePasswordMutation } = useChangePasswordMutation();

  const [form, setForm] = useState({
    Name: "",
    EmailAddress: "",
    Mobile_Number: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (isLoading || !profile) return <div>Loading...</div>;

  const handleEdit = () => {
    setIsEditing(true);
    setForm({
      Name: profile.Name,
      EmailAddress: profile.EmailAddress,
      Mobile_Number: profile.Mobile_Number,
    });
  };

  const handleSave = () => {
    updateProfile(
      {
        Name: form.Name || profile.Name,
        EmailAddress: form.EmailAddress,
        Mobile_Number: form.Mobile_Number,
        Address: profile.Address,
        ProfileDescription: profile.ProfileDescription,
      },
      {
        onSuccess: (res) => {
          toast.success(res?.Message || "Profile updated successfully");
          setIsEditing(false);
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to update profile");
        },
      }
    );
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword) {
      toast.error("Both fields are required");
      return;
    }

    changePasswordMutation(
      {
        OldPassword: oldPassword,
        NewPassword: newPassword,
      },
      {
        onSuccess: (data) => {
          toast.success(data.Message || "Password changed successfully");
          setOldPassword("");
          setNewPassword("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to change password");
        },
      }
    );
  };

  const subscription = subscriptionData?.[0];

  return (
    <div className="text-sm text-gray-800 dark:text-white space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-1/3 rounded-2xl overflow-hidden">
          <img
            src={profile.AvtarURL || profileMan}
            alt={profile.Name}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#343C6A] to-[#343C6A00]" />
          {isEditing ? (
            <input
              type="text"
              className="absolute bottom-3 left-4 bg-[#F5F9FF] dark:bg-[#1E2027] rounded px-2 py-1 z-10"
              value={form.Name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  Name: e.target.value,
                }))
              }
            />
          ) : (
            <div className="absolute bottom-3 left-4 text-white font-semibold text-lg z-10">
              {profile.Name}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl p-6 w-full space-y-4 text-sm text-[#2E3A59] dark:text-white">
          <div className="flex flex-wrap justify-between items-start gap-6">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                User Id
              </div>
              <div className="font-semibold">{profile.UserId}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Mail id
              </div>
              {isEditing ? (
                <input
                  type="email"
                  className="bg-[#F5F9FF] dark:bg-[#1E2027] rounded px-2 py-1"
                  value={form.EmailAddress}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      EmailAddress: e.target.value,
                    }))
                  }
                />
              ) : (
                <div className="font-semibold">{profile.EmailAddress}</div>
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
                  value={form.Mobile_Number}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      Mobile_Number: e.target.value,
                    }))
                  }
                />
              ) : (
                <div className="font-semibold">{profile.Mobile_Number}</div>
              )}
            </div>

            {isEditing ? (
              <button
                onClick={handleSave}
                className="text-green-600 flex items-center space-x-1 mt-1 hover:underline"
              >
                <FiEdit2 size={14} />
                <span>Save</span>
              </button>
            ) : (
              <button
                onClick={handleEdit}
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
                  ₹ {wallet?.WalletBalance ?? 0}
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
                  {subscription?.PlanDetail?.allowedBacktestCount ?? 0}
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
                  {subscription?.PlanName || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-[#1E2027] flex flex-wrap justify-between text-xs">
            <div>
              <div className="text-[#718EBF]">Referral Link:</div>
              <a
                target="_blank"
                href={profile.referralLink}
                className="text-[#2E3A59] dark:text-white break-all underline"
              >
                {profile.referralLink}
              </a>
            </div>
            <div className="text-right">
              <div className="text-gray-500 dark:text-gray-400">Joined on</div>
              <div className="font-medium">{profile.JoiningDate}</div>
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
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full p-4 bg-[#F5F9FF] dark:bg-[#1E2027] text-gray-700 dark:text-white placeholder-gray-400 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <button
              className="mt-4 py-2 px-4 w-1/2 bg-[#0096FF] hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isLoading}
            >
              {changePasswordMutation.isLoading ? "Changing..." : "Change"}
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
                  {subscription?.SubscriptionType || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  Plan Name
                </div>
                <div className="text-base font-semibold">
                  {subscription?.PlanName || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  Start Date
                </div>
                <div className="text-base font-semibold">
                  {subscription?.StartDate?.split("T")[0] || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  End Date
                </div>
                <div className="text-base font-semibold">
                  {subscription?.EndDate?.split("T")[0] || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#718EBF] mb-1 dark:text-gray-400">
                  Plan Action
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
                Your current subscription expires in{" "}
                <span className="text-base font-semibold">
                  <DaysRemaining endDateStr={subscription?.EndDate} /> days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DaysRemaining = ({ endDateStr }) => {
  const endDate = new Date(endDateStr);
  const today = new Date();
  const diffMs = endDate - today;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
};

export default ProfilePage;
