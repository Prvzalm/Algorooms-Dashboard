import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiEye, FiEyeOff, FiCopy } from "react-icons/fi";
import {
  profileActivePlanIcon,
  profileBacktestIcon,
  profileWalletIcon,
} from "../../../assets";
import { useProfileQuery, useUpdateProfile } from "../../../hooks/profileHooks";
import { toast } from "react-toastify";
import {
  useChangePasswordMutation,
  useRequestMobileOtpMutation,
  useValidateMobileOtpMutation,
} from "../../../hooks/loginHooks";
import { useSubscriptionQuery } from "../../../hooks/subscriptionHooks";
import { useWalletQuery } from "../../../hooks/walletHooks";
import { useBackTestCounterDetails } from "../../../hooks/backTestHooks";
import Avatar from "../../common/Avatar";
import PrimaryButton from "../../common/PrimaryButton";

const MOBILE_OTP_API_KEY = "abc";
const MOBILE_OTP_TYPE = "MOBILE_UPDATE";
const MOBILE_OTP_LENGTH = 6;

const getApiErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.Message || error?.message || fallbackMessage;

const isApiStatusSuccess = (response) => {
  const status =
    response?.data?.Status ??
    response?.Status ??
    response?.data?.status ??
    response?.status;
  if (typeof status === "string") {
    return status.toLowerCase() === "success";
  }
  if (typeof status === "boolean") {
    return status;
  }
  return false;
};

const normalizeIndianMobileNumber = (mobileNumber) => {
  const digitsOnly = (mobileNumber || "").replace(/\D/g, "");
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return digitsOnly.slice(1);
  }
  return digitsOnly;
};

const isValidIndianMobileNumber = (mobileNumber) => {
  const normalized = normalizeIndianMobileNumber(mobileNumber);
  // Accepts plain 10-digit numbers starting 6-9, optionally prefixed with +91/91/0 in raw input
  const pattern = /^[6-9]\d{9}$/;
  return pattern.test(normalized);
};

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getSubscriptionStatus = (endDateStr) => {
  if (!endDateStr) {
    return { text: "N/A", isExpired: false, hasValidDate: false };
  }
  const parsed = Date.parse(endDateStr);
  if (Number.isNaN(parsed)) {
    return { text: "N/A", isExpired: false, hasValidDate: false };
  }

  const endDate = new Date(parsed);
  const today = new Date();
  endDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { text: "Expired", isExpired: true, hasValidDate: true };
  }

  return {
    text: `${diffDays} day${diffDays === 1 ? "" : "s"}`,
    isExpired: false,
    hasValidDate: true,
  };
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfileQuery();
  const { data: wallet } = useWalletQuery();
  const { data: subscriptionData } = useSubscriptionQuery();
  const { mutate: updateProfile, isPending, error } = useUpdateProfile();
  const { mutate: changePasswordUser } = useChangePasswordMutation();
  const { mutate: requestMobileOtp, isPending: requestingMobileOtp } =
    useRequestMobileOtpMutation();
  const { mutate: validateMobileOtp, isPending: validatingMobileOtp } =
    useValidateMobileOtpMutation();
  const { data: counter } = useBackTestCounterDetails();

  const [form, setForm] = useState({
    Name: "",
    EmailAddress: "",
    Mobile_Number: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [otpRequestedFor, setOtpRequestedFor] = useState("");
  const [otpVerifiedFor, setOtpVerifiedFor] = useState("");

  if (isLoading || !profile) return <div>Loading...</div>;

  const resetMobileOtpState = () => {
    setMobileOtp("");
    setOtpRequestedFor("");
    setOtpVerifiedFor("");
  };

  const handleEdit = () => {
    resetMobileOtpState();
    setIsEditing(true);
    setForm({
      Name: profile?.Name,
      EmailAddress: profile?.EmailAddress,
      Mobile_Number: profile?.Mobile_Number,
    });
  };

  const handleSave = () => {
    const normalizedMobile = normalizeIndianMobileNumber(form.Mobile_Number);
    const normalizedProfileMobile = normalizeIndianMobileNumber(
      profile?.Mobile_Number
    );
    const mobileChanged =
      normalizedMobile && normalizedMobile !== normalizedProfileMobile;

    if (mobileChanged && !isValidIndianMobileNumber(normalizedMobile)) {
      toast.info("Enter a valid Indian mobile number");
      return;
    }

    if (mobileChanged && otpVerifiedFor !== normalizedMobile) {
      toast.info("Verify the new mobile number via OTP before saving");
      return;
    }

    updateProfile(
      {
        Name: form.Name || profile?.Name,
        EmailAddress: form.EmailAddress || profile?.EmailAddress,
        Mobile_Number: mobileChanged
          ? normalizedMobile
          : normalizedProfileMobile,
        Address: profile?.Address,
        ProfileDescription: profile?.ProfileDescription,
      },
      {
        onSuccess: (res) => {
          toast.success(res?.Message || "Profile updated successfully");
          resetMobileOtpState();
          setIsEditing(false);
        },
        onError: (err) => {
          toast.error(err?.message || "Failed to update profile");
        },
      }
    );
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword)
      return toast.info("Enter both old and new password");

    changePasswordUser(
      {
        OldPassword: oldPassword,
        NewPassword: newPassword,
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("Password changed");
          } else {
            toast.error(res.data.Message || "Change failed");
          }
        },
        onError: () => toast.error("Error changing password"),
      }
    );
  };

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(profile?.referralLink);
      toast.success("Referral link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy referral link");
    }
  };

  const handleSendMobileOtp = () => {
    const normalizedMobile = normalizeIndianMobileNumber(form.Mobile_Number);
    if (!normalizedMobile) {
      toast.info("Enter a mobile number");
      return;
    }
    const normalizedProfileMobile = normalizeIndianMobileNumber(
      profile?.Mobile_Number
    );
    if (normalizedMobile === normalizedProfileMobile) {
      toast.info("Enter a new mobile number to update");
      return;
    }
    if (!isValidIndianMobileNumber(normalizedMobile)) {
      toast.info("Enter a valid Indian mobile number");
      return;
    }

    requestMobileOtp(
      {
        MobileNumber: normalizedMobile,
        OTPType: MOBILE_OTP_TYPE,
        ApiKey: MOBILE_OTP_API_KEY,
      },
      {
        onSuccess: (res) => {
          if (isApiStatusSuccess(res)) {
            toast.success("OTP sent to the entered mobile number");
            setOtpRequestedFor(normalizedMobile);
            setMobileOtp("");
          } else {
            toast.error(res?.data?.Message || "Failed to send mobile OTP");
          }
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Failed to send mobile OTP"));
        },
      }
    );
  };

  const handleVerifyMobileOtp = () => {
    const normalizedMobile = normalizeIndianMobileNumber(form.Mobile_Number);
    if (!normalizedMobile) {
      toast.info("Enter a mobile number");
      return;
    }
    const normalizedProfileMobile = normalizeIndianMobileNumber(
      profile?.Mobile_Number
    );
    if (normalizedMobile === normalizedProfileMobile) {
      toast.info("Mobile number is unchanged");
      return;
    }
    if (otpRequestedFor !== normalizedMobile) {
      toast.info("Send OTP to this mobile number first");
      return;
    }
    if (!mobileOtp || mobileOtp.length !== MOBILE_OTP_LENGTH) {
      toast.info(`Enter a valid ${MOBILE_OTP_LENGTH}-digit OTP`);
      return;
    }

    validateMobileOtp(
      {
        MobileNumber: normalizedMobile,
        OTP: Number(mobileOtp),
        ApiKey: MOBILE_OTP_API_KEY,
      },
      {
        onSuccess: (res) => {
          if (isApiStatusSuccess(res)) {
            toast.success("Mobile number verified");
            setOtpVerifiedFor(normalizedMobile);
            setMobileOtp("");
          } else {
            toast.error(res?.data?.Message || "Invalid mobile OTP");
          }
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "OTP verification failed"));
        },
      }
    );
  };

  const subscription = subscriptionData?.[0];
  const walletBalance = safeNumber(wallet?.WalletBalance);
  const allowedBacktests = safeNumber(counter?.AllowedBacktestCount);
  const runningBacktests = safeNumber(counter?.RunningBacktestCount);
  const availableBacktestCredits = Math.max(
    allowedBacktests - runningBacktests,
    0
  );
  const subscriptionStatus = getSubscriptionStatus(subscription?.EndDate);
  const subscriptionMessage = !subscriptionStatus.hasValidDate
    ? "No active subscription found."
    : subscriptionStatus.isExpired
    ? "Your current subscription has expired."
    : `Your current subscription expires in ${subscriptionStatus.text}.`;
  const subscriptionMessageClass = subscriptionStatus.isExpired
    ? "text-sm text-red-500"
    : subscriptionStatus.hasValidDate
    ? "text-sm text-green-600"
    : "text-sm text-gray-500 dark:text-gray-400";
  const normalizedFormMobile = normalizeIndianMobileNumber(form.Mobile_Number);
  const normalizedProfileMobile = normalizeIndianMobileNumber(
    profile?.Mobile_Number
  );
  const mobileChanged =
    isEditing &&
    normalizedFormMobile &&
    normalizedFormMobile !== normalizedProfileMobile;
  const hasOtpForCurrentMobile =
    mobileChanged && otpRequestedFor === normalizedFormMobile;
  const isOtpVerifiedForCurrentMobile =
    mobileChanged && otpVerifiedFor === normalizedFormMobile;

  return (
    <div className="text-sm text-gray-800 dark:text-white space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full md:w-1/3 rounded-2xl overflow-hidden">
          <Avatar
            src={profile?.AvtarURL}
            name={profile?.Name}
            className="w-full h-64 object-cover"
            fontSize="text-6xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#343C6A] to-[#343C6A00]" />
          {isEditing ? (
            <>
              <label
                htmlFor="name-input"
                className="absolute bottom-12 left-4 text-white text-sm z-10"
              >
                Name
              </label>
              <input
                id="name-input"
                type="text"
                className="absolute bottom-3 left-4 bg-[#F5F9FF] dark:bg-[#1E2027] rounded px-2 py-2 z-10"
                value={form.Name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    Name: e.target.value,
                  }))
                }
              />
            </>
          ) : (
            <div className="absolute bottom-3 left-4 text-white font-semibold text-lg z-10">
              {profile?.Name}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl p-6 w-full space-y-4 text-sm text-[#2E3A59] dark:text-white">
          <div className="flex flex-wrap justify-between items-start gap-6">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                User Id
              </div>
              <div className="font-semibold">{profile?.UserId}</div>
            </div>

            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Mail id
              </div>
              <div className="font-semibold">{profile?.EmailAddress}</div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Mobile Number
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={15}
                      value={form.Mobile_Number || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          Mobile_Number: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="flex-1 rounded-lg border border-[#DFEAF2] dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] px-3 py-2 text-sm"
                      placeholder="Enter mobile number"
                    />
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      disabled={!mobileChanged || requestingMobileOtp}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                        !mobileChanged || requestingMobileOtp
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-[#2D2F36]"
                          : "bg-[#E8EDFF] text-[#1B44FE] dark:bg-[#2D2F36]"
                      }`}
                    >
                      {requestingMobileOtp ? "Sending..." : "Send OTP"}
                    </button>
                  </div>

                  {mobileChanged && hasOtpForCurrentMobile && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={MOBILE_OTP_LENGTH}
                        value={mobileOtp}
                        onChange={(e) =>
                          setMobileOtp(e.target.value.replace(/\D/g, ""))
                        }
                        className="flex-1 rounded-lg border border-[#DFEAF2] dark:border-[#2D2F36] bg-white dark:bg-[#1E2027] px-3 py-2 text-sm"
                        placeholder="Enter OTP"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyMobileOtp}
                        disabled={
                          isOtpVerifiedForCurrentMobile || validatingMobileOtp
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                          isOtpVerifiedForCurrentMobile || validatingMobileOtp
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-[#2D2F36]"
                            : "bg-[#E8EDFF] text-[#1B44FE] dark:bg-[#2D2F36]"
                        }`}
                      >
                        {isOtpVerifiedForCurrentMobile
                          ? "Verified"
                          : validatingMobileOtp
                          ? "Verifying..."
                          : "Verify OTP"}
                      </button>
                    </div>
                  )}

                  {mobileChanged && !hasOtpForCurrentMobile && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Send OTP to verify the new mobile number.
                    </p>
                  )}

                  {isOtpVerifiedForCurrentMobile && (
                    <p className="text-xs text-green-600">
                      Mobile number verified.
                    </p>
                  )}
                </div>
              ) : (
                <div className="font-semibold">
                  {profile?.Mobile_Number || "--"}
                </div>
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
                  ₹ {walletBalance.toLocaleString("en-IN")}
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
                  {counter ? availableBacktestCredits : "--/--"}
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
            <div className="flex-1 min-w-0">
              <div className="text-[#718EBF]">Referral Link:</div>
              <div className="flex items-center gap-2 mt-1">
                <a
                  target="_blank"
                  href={profile?.referralLink}
                  className="text-[#2E3A59] dark:text-white break-all underline"
                >
                  {profile?.referralLink}
                </a>
                <button
                  onClick={handleCopyReferralLink}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#2A2A2E] transition-colors"
                  title="Copy referral link"
                >
                  <FiCopy className="w-4 h-4 text-[#718EBF] dark:text-gray-400" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 dark:text-gray-400">Joined on</div>
              <div className="font-medium">{profile?.JoiningDate}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-6">
        <div className="w-full md:w-1/3 space-y-3 flex flex-col">
          <div className="text-xl font-semibold text-[#2E3A59] dark:text-white">
            Change Password
          </div>
          <div className="bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl p-6 space-y-6 flex-1">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#718EBF] dark:text-gray-400">
                Old Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-4 bg-[#F5F9FF] dark:bg-[#1E2027] text-gray-700 dark:text-white placeholder-gray-400 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showOldPassword ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#718EBF] dark:text-gray-400">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="w-full p-4 bg-[#F5F9FF] dark:bg-[#1E2027] text-gray-700 dark:text-white placeholder-gray-400 text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNewPassword ? (
                    <FiEyeOff size={20} />
                  ) : (
                    <FiEye size={20} />
                  )}
                </button>
              </div>
            </div>
            <PrimaryButton
              className="mt-4 py-2 px-4 w-1/2 text-sm"
              onClick={handleChangePassword}
              disabled={changePasswordUser.isLoading}
            >
              {changePasswordUser.isLoading ? "Changing..." : "Change"}
            </PrimaryButton>
          </div>
        </div>

        <div className="w-full space-y-3 flex flex-col">
          <div className="text-xl font-semibold text-[#2E3A59] dark:text-white">
            Subscriptions
          </div>
          <div className="bg-white dark:bg-[#15171C] border border-[#DFEAF2] dark:border-[#1E2027] rounded-2xl p-6 space-y-6 flex-1">
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
                <div
                  className="text-base font-semibold text-blue-600 cursor-pointer hover:underline"
                  onClick={() => navigate("/subscriptions")}
                >
                  Change Plan
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#718EBF] mb-1 mt-4 dark:text-gray-400">
                Expire
              </div>
              <div className={subscriptionMessageClass}>
                {subscriptionMessage}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
