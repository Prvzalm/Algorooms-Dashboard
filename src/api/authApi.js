import axiosInstance from "./axiosInstance";

export const loginUser = (data) => axiosInstance.post("/home/loginUser", data);

export const googleLogin = (data) =>
  axiosInstance.post("/home/ThirdPartyLogin", data);

export const changePassword = (data) =>
  axiosInstance.post("/home/changePassword", data);

export const forgotPassword = (data) =>
  axiosInstance.post("/home/forgotPassword", data);

export const resetPassword = (data) =>
  axiosInstance.post("/home/resetPassword", data);

export const requestEmailOTP = (data) =>
  axiosInstance.post("/home/requestEmailOTP", data);

export const validateEmailOTP = (data) =>
  axiosInstance.post("/home/ValidateEmailOTP", data);

export const requestMobileOTP = (data) =>
  axiosInstance.post("/home/requestMobileOTP", data);

export const validateMobileOTP = (data) =>
  axiosInstance.post("/home/ValidateMobileOTP", data);

export const registerUser = (data) =>
  axiosInstance.post("/home/registration", data);
