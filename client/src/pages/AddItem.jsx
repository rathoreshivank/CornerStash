import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import {
  UploadCloud,
  MapPin,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  Image as ImageIcon,
  BookOpen,
  Tv,
  Armchair,
  Shirt,
  Package,
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Books', icon: BookOpen },
  { name: 'Electronics', icon: Tv },
  { name: 'Furniture', icon: Armchair },
  { name: 'Clothes', icon: Shirt },
  { name: 'Other', icon: Package },
];

export default function AddItem() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'Gently Used',
    pickupNotes: '',
    locationName: '',
    latitude: '',
    longitude: '',
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  // Sync text inputs
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Handle image file selection
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError('');
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  // Detect GPS coordinates and auto-resolve neighborhood locality
  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationStatus('Detecting your GPS location…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setLocationStatus('Location detected.');
        setLocating(false);

        // Reverse-geocode to find friendly neighborhood name
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then((res) => res.json())
          .then((data) => {
            if (data && data.address) {
              const suburb =
                data.address.suburb ||
                data.address.neighbourhood ||
                data.address.residential ||
                data.address.city_district ||
                data.address.city ||
                '';
              if (suburb) {
                setForm((prev) => ({
                  ...prev,
                  locationName: prev.locationName || suburb,
                }));
              }
            }
          })
          .catch(() => {});
      },
      (err) => {
        setLocating(false);
        setLocationStatus(
          err.code === 1
            ? 'Permission denied. Please enter coordinates manually.'
            : 'Could not detect location. Please enter coordinates manually.'
        );
      },
      { timeout: 10000 }
    );
  }

  // Form submit
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(null);

    // Validation
    if (!form.title.trim()) {
      return setError('Please provide an item title.');
    }
    if (!form.description.trim()) {
      return setError('Please describe your item.');
    }
    if (!form.category) {
      return setError('Please select a category.');
    }
    if (!image) {
      return setError('Please upload a photo of the item.');
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return setError('Latitude and longitude are required numbers.');
    }
    if (lat < -90 || lat > 90) {
      return setError('Latitude must be between -90 and 90.');
    }
    if (lng < -180 || lng > 180) {
      return setError('Longitude must be between -180 and 180.');
    }

    // Build multipart data
    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('description', form.description.trim());
    data.append('category', form.category);
    data.append('condition', form.condition);
    data.append('pickupNotes', form.pickupNotes.trim());
    data.append('locationName', form.locationName.trim());
    data.append('latitude', lat);
    data.append('longitude', lng);
    data.append('image', image);

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Failed to list item.');
        return;
      }

      setSuccess(result.item);
      setForm({
        title: '',
        description: '',
        category: '',
        condition: 'Gently Used',
        pickupNotes: '',
        locationName: '',
        latitude: '',
        longitude: '',
      });
      setImage(null);
      setPreview(null);
      setLocationStatus('');
    } catch {
      setError('Could not reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // Post-submission success view
  if (success) {
    return (
      <main className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-lg p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Your item is now live!</h1>
          <p className="text-sm text-stone-600 mt-1 max-w-md mx-auto">
            Neighbors within 5 km can now find your listing on the Home page and send you requests.
          </p>

          <div className="mt-6 bg-[#F7F7F2] border border-stone-200 rounded-lg p-4 text-left flex gap-4 items-center">
            <img
              src={success.imageUrl}
              alt={success.title}
              className="w-20 h-20 object-cover rounded-md border border-stone-200 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold bg-emerald-100 text-[#1B5E3C] px-2 py-0.5 rounded">
                {success.category}
              </span>
              <h3 className="text-base font-semibold text-stone-900 mt-1 truncate">
                {success.title}
              </h3>
              <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                {success.description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="flex-1 min-h-[42px] px-4 bg-[#1B5E3C] hover:bg-[#164E31] text-white font-medium text-sm rounded-md transition-colors shadow-sm"
            >
              List another item
            </button>
            <Link
              to="/dashboard"
              className="flex-1 min-h-[42px] px-4 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page Heading */}
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B5E3C] uppercase tracking-wider mb-1">
            <PlusCircle className="w-4 h-4" />
            CornerStash Listing
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            List an item for your neighborhood
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Free-first community sharing. Items appear to neighbors within a 5 km radius.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two-Column Desktop Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Item Details (span 7) */}
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-lg p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-stone-900 pb-2 border-b border-stone-100">
                1. Item Details
              </h2>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Item Title *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. 24-inch LCD Monitor, Wooden Coffee Table, Physics Textbook"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full min-h-[44px] px-3.5 rounded-md border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(({ name, icon: Icon }) => {
                    const isSelected = form.category === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setForm({ ...form, category: name })}
                        className={`min-h-[44px] p-2.5 rounded-md text-xs font-medium border flex items-center gap-2 transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] ${
                          isSelected
                            ? 'bg-[#1B5E3C] text-white border-[#1B5E3C] shadow-sm'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
                        <span>{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Item Condition
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Like New', 'Gently Used', 'Fair', 'For Parts / Upcycle'].map((cond) => {
                    const isSelected = form.condition === cond;
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setForm({ ...form, condition: cond })}
                        className={`min-h-[38px] px-2 py-1.5 rounded-md text-xs font-medium border text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] ${
                          isSelected
                            ? 'bg-emerald-50 text-[#1B5E3C] border-[#1B5E3C] font-bold shadow-xs'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  required
                  placeholder="Mention key details, working state, age, and why you are giving it away…"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
                />
              </div>

              {/* Pickup Notes */}
              <div>
                <label htmlFor="pickupNotes" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                  Pickup Instructions (Optional)
                </label>
                <input
                  id="pickupNotes"
                  name="pickupNotes"
                  type="text"
                  maxLength={150}
                  placeholder="e.g. Porch pickup available, Flexible hours, Bring help to carry"
                  value={form.pickupNotes}
                  onChange={handleChange}
                  className="w-full min-h-[40px] px-3.5 rounded-md border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
                />
              </div>
            </div>

            {/* Right Column: Photo & Location (span 5) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Photo Upload Card */}
              <div className="bg-white border border-stone-200 rounded-lg p-5 sm:p-6 shadow-sm space-y-3">
                <h2 className="text-base font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center justify-between">
                  <span>2. Photo</span>
                  <span className="text-[11px] font-normal text-stone-500">Max 5 MB</span>
                </h2>

                <div>
                  <label
                    htmlFor="image"
                    className="block cursor-pointer border-2 border-dashed border-stone-300 rounded-lg p-4 text-center hover:border-stone-400 hover:bg-stone-50/50 transition-colors"
                  >
                    <UploadCloud className="w-8 h-8 text-[#1B5E3C] mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-stone-900 block">
                      {image ? image.name : 'Click to choose an image'}
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      JPEG, PNG, or WebP up to 5 MB
                    </span>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {/* Preview */}
                {preview && (
                  <div className="relative aspect-[4/3] rounded-md overflow-hidden border border-stone-200 bg-stone-100">
                    <img
                      src={preview}
                      alt="Listing preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-stone-900/80 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                      Image Preview
                    </span>
                  </div>
                )}
              </div>

              {/* Location Card */}
              <div className="bg-white border border-stone-200 rounded-lg p-5 sm:p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h2 className="text-base font-bold text-stone-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#1B5E3C]" />
                    <span>3. Neighborhood Location</span>
                  </h2>
                  <span className="text-[11px] bg-emerald-50 text-[#1B5E3C] px-2 py-0.5 rounded font-medium">
                    5 km feed
                  </span>
                </div>

                <p className="text-xs text-stone-600">
                  Items appear on the local browse feed within a 5 km neighborhood radius.
                </p>

                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="w-full min-h-[40px] px-3 text-xs font-medium text-[#1B5E3C] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                  <span>{locating ? 'Detecting coordinates…' : 'Use my current location (GPS)'}</span>
                </button>

                {locationStatus && (
                  <p className="text-xs text-stone-500 italic">{locationStatus}</p>
                )}

                {/* Friendly Neighborhood / Locality Name */}
                <div>
                  <label htmlFor="locationName" className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Locality / Neighborhood Name
                  </label>
                  <input
                    id="locationName"
                    name="locationName"
                    type="text"
                    placeholder="e.g. Indiranagar, Sector 62, Downtown"
                    value={form.locationName}
                    onChange={handleChange}
                    className="w-full min-h-[38px] px-3 rounded-md border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#1B5E3C]"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Displayed to neighbors on the listing card for quick recognition.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label htmlFor="latitude" className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Latitude (-90 to 90) *
                    </label>
                    <input
                      id="latitude"
                      name="latitude"
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="e.g. 28.6139"
                      value={form.latitude}
                      onChange={handleChange}
                      className="w-full min-h-[38px] px-3 rounded-md border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#1B5E3C]"
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Longitude (-180 to 180) *
                    </label>
                    <input
                      id="longitude"
                      name="longitude"
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="e.g. 77.2090"
                      value={form.longitude}
                      onChange={handleChange}
                      className="w-full min-h-[38px] px-3 rounded-md border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#1B5E3C]"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Prominent Publish CTA */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Ready to publish your listing?
              </p>
              <p className="text-xs text-stone-500">
                Your listing will immediately be shared with neighbors within 5 km.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="min-h-[46px] px-8 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-sm font-semibold rounded-md transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Publishing listing…</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Giveaway Listing</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}
