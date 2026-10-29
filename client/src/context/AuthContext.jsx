import { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config';

// AuthContext holds the logged-in user and token for the whole app
const AuthContext = createContext(null);

// Wraps the app so any component can read or update auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists try to fetch the current user
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token is expired or invalid – clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      } catch {
        // Network error – leave the token as-is; user can retry
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  // Save token to state and localStorage, set the user
  function login(newToken, newUser) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  // Remove all auth data – the user is now logged out
  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook so components don't have to import useContext themselves
export function useAuth() {
  return useContext(AuthContext);
}
