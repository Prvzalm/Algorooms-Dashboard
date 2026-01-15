import { createContext, useContext, useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { queryClient } from "../queryClient";
import { getProfileData } from "../api/profileApi";

const AuthContext = createContext({
  token: null,
  user: null,
  login: async () => ({ success: false }),
  loginWithToken: async () => ({ success: false }),
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("Authorization"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  if (token && !axiosInstance.defaults.headers.common["Authorization"]) {
    axiosInstance.defaults.headers.common["Authorization"] = `${token}`;
  }

  const loadingProfileRef = useRef(false);

  useEffect(() => {
    if (token) {
      ensureProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const ensureProfile = async () => {
    if (loadingProfileRef.current || user) return;
    loadingProfileRef.current = true;
    try {
      const data = await getProfileData();
      setUser(data);
      queryClient.setQueryData(["profile"], data);
    } catch (err) {
      console.error(
        "Profile fetch error",
        err.response?.status,
        err.response?.data
      );
    } finally {
      loadingProfileRef.current = false;
      setLoading(false);
    }
  };

  const applyTokenAndProfile = async (accessToken) => {
    if (!accessToken) {
      return { success: false, message: "Missing access token" };
    }
    setToken(`Bearer ${accessToken}`);
    localStorage.setItem("Authorization", `Bearer ${accessToken}`);
    axiosInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${accessToken}`;
    await ensureProfile();
    return { success: true };
  };

  const login = async ({ UserId, Password, ApiKey }) => {
    try {
      const res = await axiosInstance.post("/home/loginUser", {
        UserId,
        Password,
        ApiKey,
      });

      const { Data, Status, Message } = res.data;

      if (Status === "Success") {
        const result = await applyTokenAndProfile(Data?.AccessToken);
        if (!result.success) {
          return result;
        }
        return { success: true };
      } else {
        return { success: false, message: Message || "Login failed" };
      }
    } catch (error) {
      return {
        success: false,
        message: error?.response?.data?.Message || error.message,
      };
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/home/signOutUser");
      setToken(null);
      setUser(null);
      localStorage.removeItem("Authorization");
      delete axiosInstance.defaults.headers.common["Authorization"];
      queryClient.clear();
    } catch (error) {
      console.error("Logout API failed", error);
      setToken(null);
      setUser(null);
      localStorage.removeItem("Authorization");
      delete axiosInstance.defaults.headers.common["Authorization"];
      queryClient.clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        loginWithToken: applyTokenAndProfile,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
