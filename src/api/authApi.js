import axiosInstance from "./axiosInstance";

export const loginUser = (data) => axiosInstance.post("/home/loginUser", data);

export const requestEmailOtp = (email) =>
  axiosInstance.post("/home/requestEmailOTP", {
    EmailID: email,
    OTPType: "ForgetPassword",
    ApiKey: "abc",
  });
