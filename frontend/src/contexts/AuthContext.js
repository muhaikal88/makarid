import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        // Try up to 2 times for network issues
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const response = await axios.get(`${API}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000
            });
            setUser(response.data);
            setLoading(false);
            return;
          } catch (error) {
            const status = error.response?.status;
            // Only clear token on auth errors (401/403)
            if (status === 401 || status === 403) {
              localStorage.removeItem('token');
              setToken(null);
              setUser(null);
              setLoading(false);
              return;
            }
            // Network/server error - retry once
            if (attempt === 0) {
              await new Promise(r => setTimeout(r, 1000));
              continue;
            }
            // After retries, keep token but no user (will retry on navigation)
            console.error('Auth init failed after retries:', error);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`
  });

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, getAuthHeaders, setUser, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
