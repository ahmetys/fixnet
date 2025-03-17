// src/contexts/AuthContext.js
import { createContext, useState, useEffect, useContext } from "react";
import api from "../services/api.js";
import { useNotification } from "./NotificationContext";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { handleApiError } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token bulunamadı");
      }

      const { data } = await api.get("/auth/me");
      if (data) {
        setUser(data);
      } else {
        throw new Error("Kullanıcı bilgileri alınamadı");
      }
    } catch (error) {
      handleApiError(error);
      localStorage.removeItem("token");
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await api.post("/auth/login", credentials);
      const { token, user: userData } = data;
      localStorage.setItem("token", token);
      setUser(userData);
      return true;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      handleApiError(error);
      throw error;
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
