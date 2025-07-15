import { useState } from "react";
import { toast } from "react-toastify";
import {
  useRegisterMutation,
  useRequestEmailOtpMutation,
  useValidateEmailOtpMutation,
} from "../hooks/loginHooks";

export default function SignupFlow({ email, setEmail, setMode }) {
  const [signupStep, setSignupStep] = useState(1);
  const [signupOtp, setSignupOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const { mutate: requestEmailOtp } = useRequestEmailOtpMutation();
  const { mutate: validateEmailOtp } = useValidateEmailOtpMutation();
  const { mutate: registerUser } = useRegisterMutation();

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
            setMode("verify");
          } else {
            toast.error(res.data.Message || "Failed to send OTP");
          }
        },
        onError: () => toast.error("Request OTP failed"),
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
            setMode("registration");
          } else {
            toast.error(res.data.Message || "OTP incorrect");
          }
        },
        onError: () => toast.error("OTP verification failed"),
      }
    );
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
        onSuccess: (res) => {
          if (res.data.Status === "Success") {
            toast.success("Registration successful. Please log in.");
            setMode("login");
          } else {
            toast.error(res.data.Message || "Registration failed");
          }
        },
        onError: () => toast.error("Error during registration"),
      }
    );
  };

  return (
    <>
      {signupStep === 1 && (
        <>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-4 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-500"
          />
          <button
            className="w-full bg-[#0096FF] hover:bg-blue-600 text-white font-semibold py-4 rounded-lg"
            onClick={handleRequestOtp}
          >
            Send OTP to Email
          </button>
        </>
      )}

      {signupStep === 2 && (
        <>
          <div className="flex justify-between">
            {signupOtp.map((digit, i) => (
              <input
                key={i}
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const updated = [...signupOtp];
                  updated[i] = e.target.value;
                  setSignupOtp(updated);
                }}
                className="w-10 h-12 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-center text-xl focus:outline-none text-black dark:text-white placeholder:text-gray-500"
              />
            ))}
          </div>
          <button
            onClick={handleVerifyOtp}
            className="w-full bg-[#0096FF] hover:bg-blue-600 text-white font-semibold py-4 rounded-lg mt-4"
          >
            Verify OTP
          </button>
        </>
      )}

      {signupStep === 3 && (
        <>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-4 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-500"
          />
          <input
            type="tel"
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full px-4 py-4 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={signupPassword}
            onChange={(e) => setSignupPassword(e.target.value)}
            className="w-full px-4 py-4 rounded-lg bg-gray-100 dark:bg-[#1E2027] text-sm focus:outline-none text-black dark:text-white placeholder:text-gray-500"
          />
          <button
            onClick={handleRegister}
            className="w-full bg-[#0096FF] hover:bg-blue-600 text-white font-semibold py-4 rounded-lg"
          >
            Register
          </button>
        </>
      )}
    </>
  );
}
