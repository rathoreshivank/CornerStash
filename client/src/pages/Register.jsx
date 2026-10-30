import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import { ShieldCheck, HeartHandshake, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

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

      login(data.token, data.user);
      navigate('/');
    } catch {
      setError('Could not reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12">

        {/* Left Side: Brand Intro (Split Layout) */}
        <div className="md:col-span-5 bg-[#F7F7F2] p-8 sm:p-10 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-md bg-[#1B5E3C] text-white flex items-center justify-center font-bold text-lg mb-6 shadow-sm">
              CS
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Join CornerStash in your neighborhood
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
              Connect with neighbours within 5 km to pass on good items and find useful free goods.
            </p>

            <div className="mt-8 space-y-3.5 text-xs text-stone-700">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#1B5E3C] flex-shrink-0 mt-0.5" />
                <span>Hyper-local within 5 km: convenient pickups</span>
              </div>
              <div className="flex items-start gap-2.5">
                <HeartHandshake className="w-4 h-4 text-[#1B5E3C] flex-shrink-0 mt-0.5" />
                <span>100% free: give second life to working items</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1B5E3C] flex-shrink-0 mt-0.5" />
                <span>One claim per item: no double claims or bidding</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 mt-8 pt-4 border-t border-stone-200">
            Neighbourhood Free-First Network
          </p>
        </div>

        {/* Right Side: Registration Form */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Create an account</h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 mb-6">
              Already have an account?{' '}
              <Link to="/login" className="text-[#1B5E3C] font-semibold hover:underline">
                Sign in
              </Link>
            </p>

            {error && (
              <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-3.5 rounded-md border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-3.5 rounded-md border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-3.5 rounded-md border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] mt-2 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-sm font-semibold rounded-md transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] focus-visible:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Creating account…' : 'Create account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  );
}
