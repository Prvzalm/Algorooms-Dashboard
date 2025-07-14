import { useMutation } from "@tanstack/react-query";
import {
  changePassword,
  forgotPassword,
  googleLogin,
  loginUser,
  registerUser,
  requestEmailOTP,
  requestMobileOTP,
  resetPassword,
  validateEmailOTP,
  validateMobileOTP,
} from "../api/authApi";

export const useLoginMutation = () => useMutation({ mutationFn: loginUser });

export const useGoogleLoginMutation = () =>
  useMutation({ mutationFn: googleLogin });

export const useChangePasswordMutation = () =>
  useMutation({ mutationFn: changePassword });

export const useForgotPasswordMutation = () =>
  useMutation({ mutationFn: forgotPassword });

export const useResetPasswordMutation = () =>
  useMutation({ mutationFn: resetPassword });

export const useRequestEmailOtpMutation = () =>
  useMutation({ mutationFn: requestEmailOTP });

export const useValidateEmailOtpMutation = () =>
  useMutation({ mutationFn: validateEmailOTP });

export const useRequestMobileOtpMutation = () =>
  useMutation({ mutationFn: requestMobileOTP });

export const useValidateMobileOtpMutation = () =>
  useMutation({ mutationFn: validateMobileOTP });

export const useRegisterMutation = () =>
  useMutation({ mutationFn: registerUser });
