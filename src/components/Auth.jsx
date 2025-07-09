import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { googleIcon } from "../assets";
import { jwtDecode } from "jwt-decode";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();

  const handleOtpChange = (value, index) => {
    if (/^\d*$/.test(value)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = value;
      setOtp(updatedOtp);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.info("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/home/loginUser", {
        UserId: email,
        Password: password,
        ApiKey: "abc",
      });

      if (res.data.Status === "Success") {
        localStorage.setItem("token", res.data.Data.AccessToken);
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${res.data.Data.AccessToken}`;
        navigate("/");
      } else {
        toast.error(res.data.Message || "Login failed");
      }
    } catch (err) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOtp = async () => {
    if (!email) return toast.info("Enter email/client ID");

    setLoading(true);
    try {
      const res = await axiosInstance.post("/home/requestEmailOTP", {
        EmailID: email,
        OTPType: "ForgetPassword",
        ApiKey: "abc",
      });

      if (res.data.Status === "Success") {
        setMode("verify");
      } else {
        toast.error(res.data.Message || "Failed to send OTP");
      }
    } catch (err) {
      toast.error("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) return toast.info("Enter valid 6-digit OTP");

    setLoading(true);
    try {
      const res = await axiosInstance.post("/home/ValidateEmailOTP", {
        EmailID: email,
        OTP: parseInt(code),
        ApiKey: "abc",
      });

      if (res.data.Status === "Success") {
        setMode("reset");
      } else {
        toast.error(res.data.Message || "Invalid OTP");
      }
    } catch (err) {
      toast.error("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword) return toast.info("Enter new password");

    setLoading(true);
    try {
      const res = await axiosInstance.post("/home/forgotPassword", {
        EmailID: email,
        NewPassword: newPassword,
        OTP: parseInt(otp.join("")),
        ApiKey: "abc",
      });

      if (res.data.Status === "Success") {
        toast.success("Password reset successful. Please log in.");
        setMode("login");
      } else {
        toast.error(res.data.Message || "Reset failed");
      }
    } catch (err) {
      toast.error("Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const decoded = jwtDecode(tokenResponse.credential);
      const { email, picture, name } = decoded;

      try {
        const res = await axiosInstance.post("/home/ThirdPartyLogin", {
          EmailID: email,
          Token: tokenResponse.credential,
          AvtarUrl: picture,
          CreatedBy: name,
          ApiKey: "abc",
        });

        if (res.data.Status === "Success") {
          localStorage.setItem("token", res.data.Data.AccessToken);
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${res.data.Data.AccessToken}`;
          navigate("/");
        } else {
          toast.error(res.data.Message || "Google login failed");
        }
      } catch (err) {
        toast.error("Google login error");
      }
    },
    onError: () => {
      toast.error("Google login failed");
    },
  });

  return (
    <div className="min-h-screen flex dark:bg-[#0B0C10]">
      <div className="w-1/2 hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-white to-[#E8F0FF] dark:from-[#0B0C10] dark:to-[#15171C] text-black dark:text-white px-12">
        <h1 className="text-5xl font-extrabold leading-tight mb-6">
          Lorem ipsum <br />
          dolor sit amet <br />
          consectetur.
        </h1>
        <div className="bg-gradient-to-br from-[#2D5EFF] to-[#00C2FF] px-6 py-3 rounded-xl text-sm mt-4 text-white w-fit">
          Lorem ipsum dolor sit amet
        </div>
        <div className="mt-10 text-xs space-x-4">
          <span>#Trading</span>
          <span>#Stockmarket</span>
          <span>#Strategy</span>
        </div>
        <div className="mt-4 font-medium">Try now</div>
        <div className="mt-2 text-[10px] rotate-90 font-semibold text-gray-500">
          www.Algorooms.com
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <div className="max-w-sm w-full space-y-6 text-[#2E3A59] dark:text-white">
          <h2 className="text-2xl font-bold text-center">
            {mode === "login"
              ? "Sign In"
              : mode === "signup"
              ? "Sign Up"
              : mode === "forget"
              ? "Welcome!"
              : mode === "verify"
              ? "Verifying OTP"
              : "Reset Password"}
          </h2>
          <p className="text-sm text-center text-gray-400">
            It was popularised in the 1960s with the release of Letraset...
          </p>

          <button
            onClick={() => googleLogin()}
            className="w-full py-2 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-left flex items-center px-4"
          >
            <img src={googleIcon} alt="Google" className="w-5 h-5 mr-2" />
            Continue with Google
          </button>

          {mode !== "verify" && (
            <>
              <div className="text-center text-xs text-gray-400">Or</div>
              <input
                type="email"
                placeholder="Email Id / Client Id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm focus:outline-none"
              />
            </>
          )}

          {mode === "login" && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm focus:outline-none"
              />
              <div
                className="absolute top-1/3 right-3 -translate-y-1/2 cursor-pointer"
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
                  className="w-10 h-12 rounded-lg bg-gray-100 text-center text-xl focus:outline-none"
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
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm focus:outline-none"
              />
              <div
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </div>
            </div>
          )}

          <button
            className="w-full bg-[#0096FF] hover:bg-blue-600 text-white font-semibold py-3 rounded-lg"
            disabled={loading}
            onClick={() => {
              if (mode === "login") handleLogin();
              else if (mode === "forget") sendEmailOtp();
              else if (mode === "verify") verifyOtp();
              else if (mode === "reset") resetPassword();
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

          <div className="text-center text-xs text-gray-500">
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
