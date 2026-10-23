import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sc_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sc_token');
      if (!storedToken) { setLoading(false); return; }
      try {
        const res = await authService.getMe();
        setUser(res.data.user);
        setToken(storedToken);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [logout]);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { token: t, user: u } = res.data;
    localStorage.setItem('sc_token', t);
    localStorage.setItem('sc_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    const { token: t, user: u } = res.data;
    localStorage.setItem('sc_token', t);
    localStorage.setItem('sc_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return res;
  };

  const registerAdmin = async (data) => {
    const res = await authService.registerAdmin(data);
    const { token: t, user: u } = res.data;
    localStorage.setItem('sc_token', t);
    localStorage.setItem('sc_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, registerAdmin, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
