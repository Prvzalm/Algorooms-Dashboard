import { useRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { authBg, authBgDark, googleIcon } from "../assets";
import { jwtDecode } from "jwt-decode";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import {
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useGoogleLoginMutation,
  useLoginMutation,
  useRegisterMutation,
  useRequestEmailOtpMutation,
  useRequestMobileOtpMutation,
  useResetPasswordMutation,
  useValidateEmailOtpMutation,
  useValidateMobileOtpMutation,
} from "../hooks/loginHooks";
import SignupFlow from "./SignupFlow";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [resetTicket, setResetTicket] = useState(null);
  const otpRefs = useRef([]);

  const { mutate: loginUser } = useLoginMutation();
  const { mutate: googleLoginUser } = useGoogleLoginMutation();
  const { mutate: forgotPasswordUser } = useForgotPasswordMutation();
  const { mutate: resetPasswordUser } = useResetPasswordMutation();
  const { mutate: requestEmailOtp } = useRequestEmailOtpMutation();
  const { mutate: validateEmailOtp } = useValidateEmailOtpMutation();
  const { mutate: requestMobileOtp } = useRequestMobileOtpMutation();
  const { mutate: validateMobileOtp } = useValidateMobileOtpMutation();

  const navigate = useNavigate();

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const updatedOtp = [...otp];
    updatedOtp[index] = value.slice(-1);
    setOtp(updatedOtp);
    if (value && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < otpRefs.current.length - 1)
      otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const arr = text.split("");
    const filled = Array(6)
      .fill("")
      .map((_, i) => arr[i] || "");
    setOtp(filled);
    const nextEmpty = filled.findIndex((d) => d === "");
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    otpRefs.current[focusIndex]?.focus();
  };

  const handleLogin = (email, password) => {
    if (!email || !password) return toast.info("Enter email and password");

    loginUser(
      {
        UserId: email,
        Password: password,
        ApiKey: "abc",
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            localStorage.setItem("token", res.data.Data.AccessToken);
            axiosInstance.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${res.data.Data.AccessToken}`;
            window.location.reload();
            toast.success("Logged in successfully");
            navigate("/");
          } else {
            toast.error(res.data.Message || "Login failed");
          }
        },
        onError: () => toast.error("Login error"),
      }
    );
  };

  const handleForgot = (email) => {
    if (!email) return toast.info("Enter your email");

    requestEmailOtp(
      {
        EmailID: email,
        OTPType: "FORGOTPASSWORD",
        ApiKey: "abc",
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("OTP sent to email");
            setMode("verify");
          } else {
            toast.error(res.data.Message || "Failed to send OTP");
          }
        },
        onError: () => toast.error("Request OTP failed"),
      }
    );
  };

  const handleVerifyOtp = (email, otp) => {
    if (otp.length !== 6) return toast.info("Enter 6-digit OTP");

    validateEmailOtp(
      {
        EmailID: email,
        OTP: parseInt(otp),
        ApiKey: "abc",
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("OTP verified");
            setResetTicket(res?.data?.Data?.ResetTicket || null);
            setMode("reset");
          } else {
            toast.error(res.data.Message || "OTP incorrect");
          }
        },
        onError: () => toast.error("OTP verification failed"),
      }
    );
  };

  const handleReset = (email, newPassword, otp) => {
    if (!newPassword) return toast.info("Enter new password");

    if (resetTicket) {
      // Use resetPassword when we have a reset ticket from OTP verification
      resetPasswordUser(
        {
          ResetTicket: resetTicket,
          NewPassword: newPassword,
          ApiKey: "abc",
        },
        {
          onSuccess: (res) => {
            if (res.data.Status === "Success") {
              toast.success("Password created successfully");
              setMode("login");
            } else {
              toast.error(res.data.Message || "Reset failed");
            }
          },
          onError: () => toast.error("Reset error"),
        }
      );
    } else {
      // Fallback to forgotPassword flow with OTP
      forgotPasswordUser(
        {
          EmailID: email,
          NewPassword: newPassword,
          OTP: parseInt(otp),
          ApiKey: "abc",
        },
        {
          onSuccess: (res) => {
            if (res.data.Status === "Success") {
              toast.success("Password reset successfully");
              setMode("login");
            } else {
              toast.error(res.data.Message || "Reset failed");
            }
          },
          onError: () => toast.error("Reset error"),
        }
      );
    }
  };

  const handleRequestMobileOtp = (mobileNumber, otpType = "REGISTRATION") => {
    if (!mobileNumber) return toast.info("Enter mobile number");

    requestMobileOtp(
      {
        MobileNumber: mobileNumber,
        OTPType: otpType,
        ApiKey: "abc",
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("OTP sent to mobile");
          } else {
            toast.error(res.data.Message || "Failed to send mobile OTP");
          }
        },
        onError: () => toast.error("Request mobile OTP failed"),
      }
    );
  };

  const handleValidateMobileOtp = (mobileNumber, otp) => {
    if (!otp || otp.length !== 6)
      return toast.info("Enter a valid 6-digit OTP");

    validateMobileOtp(
      {
        MobileNumber: mobileNumber,
        OTP: parseInt(otp),
        ApiKey: "abc",
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("Mobile OTP verified");
          } else {
            toast.error(res.data.Message || "Invalid mobile OTP");
          }
        },
        onError: () => toast.error("OTP verification failed"),
      }
    );
  };

  const handleResetViaTicket = (resetTicket, newPassword) => {
    if (!resetTicket || !newPassword)
      return toast.info("Missing reset ticket or password");

    resetPasswordUser(
      {
        ResetTicket: resetTicket,
        NewPassword: newPassword,
        ApiKey: "abc",
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("Password reset successfully");
            setMode("login");
          } else {
            toast.error(res.data.Message || "Reset failed");
          }
        },
        onError: () => toast.error("Reset error"),
      }
    );
  };

  const handleRequestEmailOtpForRegistration = (email) => {
    if (!email) return toast.info("Enter email");

    requestEmailOtp(
      {
        EmailID: email,
        OTPType: "REGISTRATION",
        ApiKey: "abc",
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("OTP sent to email");
          } else {
            toast.error(res.data.Message || "Failed to send OTP");
          }
        },
        onError: () => toast.error("Request failed"),
      }
    );
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());

        const { email: gEmail, name: gName, picture: gPicture } = userInfo;

        googleLoginUser(
          {
            EmailID: gEmail,
            Token: tokenResponse.access_token,
            AvtarUrl: gPicture,
            CreatedBy: gName,
            ApiKey: "abc",
          },
          {
            onSuccess: (res) => {
              if (res.data.Status === "Success") {
                localStorage.setItem("token", res.data.Data.AccessToken);
                axiosInstance.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${res.data.Data.AccessToken}`;
                toast.success("Logged in with Google");
                navigate("/");
              } else {
                toast.error(res.data.Message || "Google login failed");
              }
            },
            onError: () => toast.error("Google login error"),
          }
        );
      } catch (err) {
        toast.error("Invalid Google credentials");
      }
    },
    onError: () => toast.error("Google login error"),
    scope: "openid email profile",
  });

  return (
    <div className="min-h-screen flex dark:bg-[#0B0C10]">
      <div className="w-3/5 hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-white to-[#E8F0FF] dark:from-[#0B0C10] dark:to-[#15171C] text-black dark:text-white">
        <img src={authBg} alt="" className="block dark:hidden" />
        <img src={authBgDark} alt="" className="hidden dark:block" />
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center px-6 bg-white dark:bg-[#15171C]">
        <div className="max-w-sm w-full space-y-6 text-[#2E3A59] dark:text-[#61677D]">
          <h2 className="text-3xl text-[#0096FF] font-bold text-center">
            {mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Sign Up"
              : mode === "forget"
              ? "Welcome!"
              : mode === "verify"
              ? "Verifying OTP"
              : mode === "registration"
              ? "Registration"
              : "Reset Password"}
          </h2>

          <p className="text-sm text-center text-gray-400 dark:text-gray-500">
            It was popularised in the 1960s with the release of Letraset...
          </p>

          <button
            onClick={() => handleGoogleLogin()}
            className="w-full py-4 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-left flex items-center px-4"
          >
            <img src={googleIcon} alt="Google" className="w-5 h-5 mr-2" />
            Continue with Google
          </button>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="px-2 text-sm text-gray-400">Or</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {mode !== "verify" && mode !== "signup" && (
            <input
              type="email"
              placeholder="Email Id / Client Id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-500"
            />
          )}

          {mode === "login" && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-500"
              />
              <div
                className="absolute top-1/3 right-3 -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </div>
              <div
                className="text-right text-xs text-blue-500 mt-1 cursor-pointer"
                onClick={() => setMode("forget")}
              >
                Forget Password?
              </div>
            </div>
          )}

          {mode === "verify" && (
            <div className="flex justify-between">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  className="w-10 h-12 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-center text-xl focus:outline-none text-black dark:text-white"
                />
              ))}
            </div>
          )}

          {mode === "reset" && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-500"
              />
              <div
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-500 dark:text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </div>
            </div>
          )}

          {mode === "signup" && (
            <SignupFlow email={email} setEmail={setEmail} setMode={setMode} />
          )}

          {mode !== "signup" && (
            <button
              className="w-full bg-[#0096FF] hover:bg-blue-600 text-white font-semibold py-4 rounded-lg"
              disabled={loading}
              onClick={() => {
                if (mode === "login") handleLogin(email, password);
                else if (mode === "forget") handleForgot(email);
                else if (mode === "verify")
                  handleVerifyOtp(email, otp.join(""));
                else if (mode === "reset")
                  handleReset(email, newPassword, otp.join(""));
              }}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Log In"
                : mode === "forget"
                ? "Send OTP"
                : mode === "verify"
                ? "Verify"
                : "Reset Password"}
            </button>
          )}

          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            {mode === "login" ? (
              <>
                Don’t have account?{" "}
                <span
                  onClick={() => setMode("signup")}
                  className="text-blue-500 cursor-pointer"
                >
                  Sign Up
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => setMode("login")}
                  className="text-blue-500 cursor-pointer"
                >
                  Sign In
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
