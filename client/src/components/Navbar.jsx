import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Top navigation bar shared across every page
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Log out and send the user to the login page
  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 rounded"
        >
          Giveaway
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          {user ? (
            <>
              <span className="text-gray-600 hidden sm:inline">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="min-h-[44px] px-4 text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 rounded"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="min-h-[44px] flex items-center px-4 text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 rounded"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="min-h-[44px] flex items-center px-4 bg-green-700 text-white rounded hover:bg-green-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
