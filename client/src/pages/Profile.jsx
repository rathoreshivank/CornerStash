import { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Camera,
  CheckCircle2,
  Calendar,
  MapPin,
  Package,
  Gift,
  HeartHandshake,
  AlertCircle,
  Check,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

function formatMemberSince(dateString) {
  if (!dateString) return 'Recent neighbor';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Recent neighbor';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function Profile() {
  const { user, token, updateUser } = useAuth();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood || '');

  // Photo upload state
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef(null);

  // Form saving state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Community stats state
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch full profile info including stats
  useEffect(() => {
    if (!user?._id) return;

    let isMounted = true;
    async function loadProfileData() {
      try {
        const res = await fetch(`${API_URL}/api/users/${user._id}/profile`);
        const data = await res.json();
        if (res.ok && isMounted) {
          setStats(data.stats);
          if (data.user) {
            setName(data.user.name || '');
            setBio(data.user.bio || '');
            setNeighborhood(data.user.neighborhood || '');
            if (data.user.avatarUrl) setAvatarPreview(data.user.avatarUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    loadProfileData();
    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  // Handle avatar file selection
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarError('');
    setAvatarSuccess('');

    // Client-side file type and size check
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size exceeds 5 MB. Please choose a smaller file.');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  }

  // Upload avatar to backend & Cloudinary
  async function handleUploadAvatar() {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    setAvatarError('');
    setAvatarSuccess('');

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const res = await fetch(`${API_URL}/api/users/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      setAvatarSuccess('Profile photo updated successfully!');
      setAvatarFile(null);
      if (data.user) {
        updateUser(data.user);
      }
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  // Save profile text fields
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!name.trim()) {
      setProfileError('Name cannot be blank.');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          neighborhood: neighborhood.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileSuccess('Profile details saved successfully!');
      if (data.user) {
        updateUser(data.user);
      }
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#19211E] tracking-tight">
          Neighbor Profile & Credibility
        </h1>
        <p className="text-sm text-stone-600 mt-1">
          Manage your neighborhood identity, profile photo, and view your community trust record.
        </p>
      </div>

      {/* Grid: Left Column (Photo & Identity Card) / Right Column (Edit Form & Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Photo & Trust Badge */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center space-y-4 h-fit">
          <div className="relative group">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-emerald-50 shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center font-bold text-3xl border-4 border-emerald-50 shadow-md">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-[#1B5E3C] hover:bg-[#164E31] text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105"
              title="Change profile photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {avatarFile && (
            <div className="w-full space-y-2 pt-1">
              <button
                type="button"
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                className="w-full py-1.5 px-3 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadingAvatar ? 'Uploading…' : 'Save New Photo'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(user?.avatarUrl || '');
                }}
                className="text-[11px] text-stone-500 hover:text-stone-700 underline"
              >
                Cancel
              </button>
            </div>
          )}

          {avatarSuccess && (
            <p className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
              {avatarSuccess}
            </p>
          )}
          {avatarError && (
            <p className="text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
              {avatarError}
            </p>
          )}

          <div className="space-y-1">
            <h2 className="text-base font-bold text-stone-900">{user?.name}</h2>
            <p className="text-xs text-stone-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B5E3C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified Community Member
            </span>
          </div>

          <div className="w-full border-t border-stone-100 pt-3 text-xs text-stone-500 text-left space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Neighbor since {formatMemberSince(user?.createdAt)}</span>
            </div>
            {neighborhood && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Area: {neighborhood}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Edit Details & Credibility Metrics */}
        <div className="md:col-span-2 space-y-6">
          {/* Quick Stats Grid */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
              Community Impact
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-stone-50 border border-stone-100 rounded-lg p-3">
                <Package className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                <span className="block text-xl font-bold text-stone-900">
                  {stats ? stats.itemsListedCount : '—'}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">Items Listed</span>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3">
                <Gift className="w-4 h-4 text-[#1B5E3C] mx-auto mb-1" />
                <span className="block text-xl font-bold text-[#1B5E3C]">
                  {stats ? stats.itemsGiftedCount : '—'}
                </span>
                <span className="text-[11px] text-stone-600 font-medium">Items Gifted</span>
              </div>
              <div className="bg-stone-50 border border-stone-100 rounded-lg p-3">
                <HeartHandshake className="w-4 h-4 text-stone-400 mx-auto mb-1" />
                <span className="block text-xl font-bold text-stone-900">
                  {stats ? stats.itemsReceivedCount : '—'}
                </span>
                <span className="text-[11px] text-stone-500 font-medium">Items Received</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-stone-900">Edit Profile Details</h3>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs min-h-[38px] px-3 rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1B5E3C]"
                />
              </div>

              <div>
                <label htmlFor="neighborhood" className="block text-xs font-semibold text-stone-700 mb-1">
                  Neighborhood / Locality
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  placeholder="e.g. Maple Heights, Indiranagar, Sector 62"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full text-xs min-h-[38px] px-3 rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1B5E3C]"
                />
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Helps nearby neighbors recognize your general vicinity without disclosing your exact house address.
                </p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-xs font-semibold text-stone-700 mb-1">
                  About You (Bio)
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  maxLength={300}
                  placeholder="Tell neighbors a little about yourself (e.g. avid reader, love DIY projects, decluttering before a move)."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-xs p-3 rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1B5E3C]"
                />
                <div className="text-[10px] text-stone-400 text-right mt-0.5">
                  {bio.length} / 300 characters
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full text-xs min-h-[38px] px-3 rounded-md border border-stone-200 bg-stone-100 text-stone-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Verified login identifier. Only shared with neighbors when a giveaway request is officially accepted.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="min-h-[40px] px-5 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
              >
                {savingProfile ? 'Saving…' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
