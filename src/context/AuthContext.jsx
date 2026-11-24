  import React, { createContext, useContext, useState, useEffect } from 'react';
  import { api } from '../api/client';

  const AuthContext = createContext(null);

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            const res = await api.get('/auth/me');
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          } catch {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
          }
        }
        setLoading(false);
      };
      checkAuth();
    }, []);

    const login = async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: loggedUser } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    };

    const logout = async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
    };

    return (
      <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
  }
