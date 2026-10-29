import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

// Register page: collects name, email, password and creates an account
export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep form state in sync with each input field
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Send registration data to the backend and log the user in on success
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Store token and user, then redirect to home
      login(data.token, data.user);
      navigate('/');
    } catch {
      setError('Could not reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-md p-8">

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create an account</h1>
        <p className="text-sm text-gray-600 mb-6">
          Already have one?{' '}
          <Link to="/login" className="text-green-700 underline hover:text-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 rounded">
            Sign in
          </Link>
        </p>

        {/* Error message – tells the user exactly what went wrong */}
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="block w-full min-h-[44px] rounded border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="block w-full min-h-[44px] rounded border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="block w-full min-h-[44px] rounded border border-gray-200 px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] bg-green-700 text-white text-sm font-medium rounded hover:bg-green-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

        </form>
      </div>
    </main>
  );
}
