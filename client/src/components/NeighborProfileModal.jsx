import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  MapPin,
  Calendar,
  Package,
  Gift,
  HeartHandshake,
  User as UserIcon,
} from 'lucide-react';
import API_URL from '../config';

// Helper to format ISO date to "Month Year" (e.g. "October 2026")
function formatMemberSince(dateString) {
  if (!dateString) return 'Recent neighbor';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Recent neighbor';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function NeighborProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'listings' | 'reviews'

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/api/users/${userId}/profile`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
          aria-label="Close profile"
        >
          <X className="w-4 h-4" />
        </button>

        {loading && (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-stone-200 animate-pulse mx-auto" />
            <div className="h-5 bg-stone-200 rounded w-1/2 mx-auto animate-pulse" />
            <div className="h-3 bg-stone-100 rounded w-1/3 mx-auto animate-pulse" />
            <p className="text-xs text-stone-500 pt-2">Loading neighbor credibility profile…</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-semibold rounded-md hover:bg-stone-200"
            >
              Close
            </button>
          </div>
        )}

        {!loading && profile && (
          <div>
            {/* Header / Hero */}
            <div className="bg-stone-50 border-b border-stone-200 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                {profile.user.avatarUrl ? (
                  <img
                    src={profile.user.avatarUrl}
                    alt={profile.user.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#1B5E3C] shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center font-bold text-2xl border-2 border-emerald-300 shadow-sm">
                    {profile.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Verified badge icon */}
                <div
                  className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow"
                  title="Verified Community Member"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#1B5E3C] fill-emerald-100" />
                </div>
              </div>

              {/* Identity & Tenure */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-stone-900">{profile.user.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B5E3C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Neighbor
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-stone-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    Neighbor since {formatMemberSince(profile.user.createdAt)}
                  </span>
                  {profile.user.neighborhood && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {profile.user.neighborhood}
                    </span>
                  )}
                </div>

                {profile.user.bio && (
                  <p className="text-xs text-stone-600 pt-2 leading-relaxed italic bg-white p-2.5 rounded border border-stone-200 mt-2">
                    &ldquo;{profile.user.bio}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Quick Stats Grid */}
            {/* Quick Community Stats Grid */}
            <div className="grid grid-cols-3 divide-x divide-stone-200 border-b border-stone-200 bg-white text-center py-3.5">
              <div className="px-3">
                <span className="block text-base sm:text-lg font-bold text-stone-900">
                  {profile.stats.itemsListedCount || 0}
                </span>
                <span className="block text-[10px] sm:text-xs text-stone-500 font-medium mt-0.5">
                  Items Listed
                </span>
              </div>
              <div className="px-3">
                <span className="block text-base sm:text-lg font-bold text-[#1B5E3C]">
                  {profile.stats.itemsGiftedCount || 0}
                </span>
                <span className="block text-[10px] sm:text-xs text-stone-500 font-medium mt-0.5">
                  Gifted to Neighbors
                </span>
              </div>
              <div className="px-3">
                <span className="block text-base sm:text-lg font-bold text-stone-900">
                  {profile.stats.itemsReceivedCount || 0}
                </span>
                <span className="block text-[10px] sm:text-xs text-stone-500 font-medium mt-0.5">
                  Items Received
                </span>
              </div>
            </div>

            {/* Active Listings Section */}
            <div className="p-5 max-h-72 overflow-y-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#1B5E3C]" />
                <span>Active Listings ({profile.activeListings?.length || 0})</span>
              </h4>

              {profile.activeListings?.length === 0 ? (
                <div className="text-center py-6 text-stone-500 text-xs">
                  No other active items listed by this neighbor right now.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {profile.activeListings.map((item) => (
                    <div
                      key={item._id}
                      className="border border-stone-200 rounded-lg p-2.5 bg-stone-50 flex gap-2.5 items-center"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded object-cover bg-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#1B5E3C] uppercase block">
                          {item.category}
                        </span>
                        <p className="text-xs font-semibold text-stone-900 truncate">
                          {item.title}
                        </p>
                        {item.condition && (
                          <span className="text-[10px] text-stone-400">
                            {item.condition}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-stone-50 border-t border-stone-200 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white border border-stone-300 rounded hover:bg-stone-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
