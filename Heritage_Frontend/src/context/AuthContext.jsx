// src/context/AuthContext.jsx
// React context managing authentication state, localStorage token syncing, and user session restoration

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // 1. Check for token in URL query parameter (Google OAuth callback redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        let activeToken = localStorage.getItem('heritage_token');

        if (tokenFromUrl) {
          localStorage.setItem('heritage_token', tokenFromUrl);
          activeToken = tokenFromUrl;
          // Clear query params from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 2. Fetch user profile if a token exists
        if (activeToken) {
          setToken(activeToken);
          const userData = await api.getMe();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to restore user session:', error);
        // Clear broken token
        localStorage.removeItem('heritage_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      // Backend returns { success: true, data: { token, user: { id, name, email, role } } }
      const { token: receivedToken, user: receivedUser } = response;
      localStorage.setItem('heritage_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await api.register(name, email, password);
      // Backend returns { success: true, data: { token, user } }
      const { token: receivedToken, user: receivedUser } = response;
      localStorage.setItem('heritage_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In redirect handler
  const loginWithGoogle = () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://heritageai-pakistan.onrender.com';
    window.location.href = `${API_URL}/api/auth/google`;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('heritage_token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
