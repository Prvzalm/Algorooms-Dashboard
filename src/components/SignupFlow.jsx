import { useRef, useState } from "react";
import { toast } from "react-toastify";
import PrimaryButton from "./common/PrimaryButton";
import {
  useRegisterMutation,
  useRequestEmailOtpMutation,
  useValidateEmailOtpMutation,
} from "../hooks/loginHooks";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SignupFlow({ email, setEmail, setMode }) {
  const [signupStep, setSignupStep] = useState(1);
  const [signupOtp, setSignupOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const otpRefs = useRef([]);

  const { mutate: requestEmailOtp } = useRequestEmailOtpMutation();
  const { mutate: validateEmailOtp } = useValidateEmailOtpMutation();
  const { mutate: registerUser } = useRegisterMutation();
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const getApiErrorMessage = (error, fallbackMessage) =>
    error?.response?.data?.Message || error?.message || fallbackMessage;

  const handleRequestOtp = () => {
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
            setSignupStep(2);
          } else {
            toast.error(res.data.Message || "Failed to send OTP");
          }
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Request OTP failed")),
      }
    );
  };

  const handleVerifyOtp = () => {
    const otpValue = signupOtp.join("");
    if (otpValue.length !== 6) return toast.info("Enter a 6-digit OTP");

    validateEmailOtp(
      {
        EmailID: email,
        OTP: parseInt(otpValue),
        ApiKey: "abc",
      },
      {
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("OTP verified");
            setSignupStep(3);
          } else {
            toast.error(res.data.Message || "OTP incorrect");
          }
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "OTP verification failed")),
      }
    );
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...signupOtp];
    updated[index] = value.slice(-1);
    setSignupOtp(updated);
    if (value && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !signupOtp[index] && index > 0) {
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
    setSignupOtp(filled);
    const nextEmpty = filled.findIndex((d) => d === "");
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    otpRefs.current[focusIndex]?.focus();
  };

  const handleRegister = () => {
    if (!name || !mobile || !signupPassword)
      return toast.info("Please fill all fields");

    registerUser(
      {
        Name: name,
        EmailAddress: email,
        Mobile_Number: mobile,
        Password: signupPassword,
        OTP: parseInt(signupOtp.join("")),
        ApiKey: "abc",
      },
      {
        onSuccess: async (res) => {
          if (res.data.Status === "Success") {
            toast.success("Registration successful!");

            // Registration now returns an AccessToken; apply it immediately so the user is logged in
            const tokenFromResponse =
              res?.data?.Data?.AccessToken ||
              res?.data?.AccessToken ||
              res?.data?.Data?.Token ||
              res?.data?.token;

            if (tokenFromResponse) {
              const result = await loginWithToken(tokenFromResponse);
              if (result?.success) {
                navigate("/");
                return;
              }
              toast.error(
                result?.message ||
                  "Registered but auto login failed. Please sign in manually."
              );
              setMode("login");
              return;
            }

            const loginResult = await login({
              UserId: email,
              Password: signupPassword,
              ApiKey: "abc",
            });
            if (loginResult?.success) {
              navigate("/");
            } else {
              toast.error(
                loginResult?.message ||
                  "Registered successfully, please log in manually."
              );
              setMode("login");
            }
          } else {
            toast.error(res.data.Message || "Registration failed");
          }
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Error during registration")),
      }
    );
  };

  return (
    <>
      {signupStep === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestOtp();
          }}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 rounded-lg bg-gray-100 text-sm focus:outline-none text-black placeholder:text-gray-500"
          />
          <PrimaryButton
            type="submit"
            className="w-full py-4 rounded-lg font-semibold"
          >
            Send OTP to Email
          </PrimaryButton>
        </form>
      )}

      {signupStep === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyOtp();
          }}
          className="space-y-4"
        >
          <div className="flex justify-between">
            {signupOtp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleOtpKeyDown(e, i)}
                onPaste={handleOtpPaste}
                className="w-10 h-12 rounded-lg bg-gray-100 text-center text-xl focus:outline-none text-black placeholder:text-gray-500"
              />
            ))}
          </div>
          <PrimaryButton
            type="submit"
            className="w-full py-4 rounded-lg font-semibold"
          >
            Verify OTP
          </PrimaryButton>
        </form>
      )}

      {signupStep === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-4 rounded-lg bg-gray-100 text-sm focus:outline-none text-black placeholder:text-gray-500"
          />
          <input
            type="tel"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full px-4 py-4 rounded-lg bg-gray-100 text-sm focus:outline-none text-black placeholder:text-gray-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            className="w-full px-4 py-4 rounded-lg bg-gray-100 text-sm focus:outline-none text-black placeholder:text-gray-500"
          />
          <PrimaryButton
            type="submit"
            className="w-full py-4 rounded-lg font-semibold"
          >
            Register
          </PrimaryButton>
        </form>
      )}
    </>
  );
}
