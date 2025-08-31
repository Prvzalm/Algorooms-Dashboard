import { createContext, useContext, useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { queryClient } from "../queryClient";
import { getProfileData } from "../api/profileApi";

const AuthContext = createContext({
  token: null,
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadingProfileRef = useRef(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${storedToken}`;
      ensureProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const ensureProfile = async () => {
    if (loadingProfileRef.current || user) return; // avoid duplicate
    loadingProfileRef.current = true;
    try {
      // Try cache first
      const cached = queryClient.getQueryData(["profile"]);
      if (cached) {
        setUser(cached);
        return;
      }
      const data = await getProfileData();
      setUser(data);
      queryClient.setQueryData(["profile"], data);
    } catch (err) {
      console.error("Profile fetch error", err);
    } finally {
      loadingProfileRef.current = false;
      setLoading(false);
    }
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
        setToken(Data.AccessToken);
        localStorage.setItem("token", Data.AccessToken);

        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${Data.AccessToken}`;

        await ensureProfile();

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
      localStorage.removeItem("token");
      delete axiosInstance.defaults.headers.common["Authorization"];
      queryClient.clear();
    } catch (error) {
      console.error("Logout API failed", error);
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
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
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
