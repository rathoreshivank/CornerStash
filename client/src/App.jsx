import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import AddItem from './pages/AddItem';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Scrolls window to top smoothly on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Redirects logged-in users away from auth pages (e.g. visiting /login when already signed in)
function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

// Redirects unauthenticated users to the login page
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

// The main app: wraps everything in AuthProvider so all pages can read auth state
function AppRoutes() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F6F5EE] text-[#19211E] antialiased flex flex-col">
      <ScrollToTop />
      <Navbar />
      <div key={location.pathname} className="page-enter flex-1">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route
            path="/register"
            element={
              <RedirectIfAuthed>
                <Register />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <Login />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/add"
            element={
              <RequireAuth>
                <AddItem />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          {/* Catch-all: redirect unknown URLs to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
