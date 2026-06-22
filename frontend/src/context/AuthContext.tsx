import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (organizationName: string, adminName: string, adminEmail: string, password: string) => Promise<void>;
  googleLogin: (email: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set default configurations for Axios
  axios.defaults.baseURL = '';

  useEffect(() => {
    // Axios request interceptor to inject JWT header
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const activeToken = localStorage.getItem('token');
        if (activeToken) {
          config.headers.Authorization = `Bearer ${activeToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Axios response interceptor to handle token expiry (401 Unauthorized)
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const res = await axios.get('/api/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Failed fetching user info", err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: jwtToken, name, role } = res.data;
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    setUser({
      id: res.data.userId,
      organizationId: res.data.organizationId,
      name,
      email,
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
  };

  const register = async (organizationName: string, adminName: string, adminEmail: string, password: string) => {
    const res = await axios.post('/api/auth/register', { organizationName, adminName, adminEmail, password });
    const { token: jwtToken, name, role, userId, organizationId } = res.data;
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    setUser({
      id: userId,
      organizationId,
      name,
      email: adminEmail,
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
  };

  const googleLogin = async (email: string, name: string) => {
    const res = await axios.post('/api/auth/google', { email, name });
    const { token: jwtToken, name: resName, email: resEmail, role, userId, organizationId } = res.data;
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    setUser({
      id: userId,
      organizationId,
      name: resName,
      email: resEmail,
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
