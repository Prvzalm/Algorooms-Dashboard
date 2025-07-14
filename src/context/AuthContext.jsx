import { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { queryClient } from "../queryClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${storedToken}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axiosInstance.get("/profile/getProfileData");
      if (res.data.Status === "Success") {
        setUser(res.data.Data);
      }
    } catch (err) {
      console.error("Profile fetch error", err);
    } finally {
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

        await fetchUserProfile();

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
