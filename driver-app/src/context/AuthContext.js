import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= RESTORE SESSION =================
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.log('Restore session failed', e);
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
  }, []);

  // ================= LOGIN =================
  const login = useCallback(async (email, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('=== LOGIN RESPONSE ===');
      console.log('Response:', response);
      console.log('User from response:', response.user);
      console.log('Token from response:', response.token ? response.token.substring(0, 20) + '...' : 'NO TOKEN');

      const { token: newToken, user: userData } = response;
      
      if (!newToken || !userData) {
        throw new Error('Invalid login response from server');
      }

      setUser(userData);
      setToken(newToken);
      
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      console.log('=== LOGIN SUCCESS ===');
      console.log('User set to:', userData);
    } catch (e) {
      console.error('=== LOGIN ERROR ===', e);
      throw new Error(e.message || 'Invalid email or password');
    }
  }, []);

  // ================= REGISTER =================
  const register = useCallback(async ({ name, email, password, phone }) => {
    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          phone,
          role: 'driver'
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('=== REGISTER SUCCESS ===');
      console.log('User created:', response);

      // Now login to get the token
      await login(email, password);
    } catch (e) {
      console.error('=== REGISTER ERROR ===', e);
      throw new Error(e.message || 'Registration failed');
    }
  }, [login]);

  // ================= LOGOUT =================
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= MEMOIZED VALUE (CRITICAL FIX) =================
  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ================= HOOK =================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
