import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import NeighborProfileModal from '../components/NeighborProfileModal';
import ItemDetailModal from '../components/ItemDetailModal';
import SafetyTipsModal from '../components/SafetyTipsModal';
import {
  MapPin,
  Search,
  LayoutGrid,
  BookOpen,
  Tv,
  Armchair,
  Shirt,
  Package,
  RotateCw,
  SlidersHorizontal,
  X,
  Check,
  User,
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Star,
} from 'lucide-react';

function formatMemberSince(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const CATEGORIES = [
  { name: 'All', icon: LayoutGrid },
  { name: 'Books', icon: BookOpen },
  { name: 'Electronics', icon: Tv },
  { name: 'Furniture', icon: Armchair },
  { name: 'Clothes', icon: Shirt },
  { name: 'Other', icon: Package },
];

export default function Home() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Location state (persisted in sessionStorage)
  const [coords, setCoords] = useState(() => {
    const savedLat = sessionStorage.getItem('giveaway_lat');
    const savedLng = sessionStorage.getItem('giveaway_lng');
    if (savedLat && savedLng) {
      return { lat: savedLat, lng: savedLng };
    }
    return null;
  });

  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [showManualLoc, setShowManualLoc] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Search & Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeSearch, setActiveSearch] = useState(searchParams.get('q') || '');

  // Neighbor profile modal state
  const [selectedNeighborId, setSelectedNeighborId] = useState(null);

  // Item detail modal state
  const [detailItem, setDetailItem] = useState(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Synchronize when URL query param changes
  useEffect(() => {
    const qFromUrl = searchParams.get('q') || '';
    setSearchQuery(qFromUrl);
    setActiveSearch(qFromUrl);
  }, [searchParams]);

  // Results state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Request state
  const [requestedItemIds, setRequestedItemIds] = useState([]);
  const [requestingId, setRequestingId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ id: null, text: '', isError: false });

  // Detect location via browser GPS
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      setShowManualLoc(true);
      return;
    }

    setLocating(true);
    setLocError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setCoords({ lat, lng });
        sessionStorage.setItem('giveaway_lat', lat);
        sessionStorage.setItem('giveaway_lng', lng);
        setLocating(false);
        setShowManualLoc(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) {
          setLocError('Location permission denied. Please enter your coordinates manually.');
        } else {
          setLocError('Could not detect location. Please enter your coordinates manually.');
        }
        setShowManualLoc(true);
      },
      { timeout: 10000 }
    );
  }, []);

  // Detect location on initial load if not saved
  useEffect(() => {
    if (!coords) {
      detectLocation();
    }
  }, [coords, detectLocation]);

  // Load items previously requested by current user
  useEffect(() => {
    async function loadUserRequests() {
      if (!token) {
        setRequestedItemIds([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/requests/my-requested-ids`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const ids = (data.requests || []).map((r) => r.item.toString());
          setRequestedItemIds(ids);
        }
      } catch {
        // Fail silently
      }
    }
    loadUserRequests();
  }, [token]);

  // Fetch items nearby
  const fetchNearbyItems = useCallback(async () => {
    if (!coords) return;

    setLoading(true);
    setFetchError('');

    try {
      const params = new URLSearchParams({
        lat: coords.lat,
        lng: coords.lng,
      });

      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      if (activeSearch.trim()) {
        params.append('q', activeSearch.trim());
      }

      const res = await fetch(`${API_URL}/api/items/nearby?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error || 'Failed to fetch items');
        return;
      }

      setItems(data.items || []);
    } catch {
      setFetchError('Could not connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [coords, selectedCategory, activeSearch]);

  useEffect(() => {
    fetchNearbyItems();
  }, [fetchNearbyItems]);

  // Handle manual coordinate submit
  function handleManualLocationSubmit(e) {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setLocError('Latitude must be between -90 and 90');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setLocError('Longitude must be between -180 and 180');
      return;
    }

    const cleanLat = lat.toFixed(6);
    const cleanLng = lng.toFixed(6);
    setCoords({ lat: cleanLat, lng: cleanLng });
    sessionStorage.setItem('giveaway_lat', cleanLat);
    sessionStorage.setItem('giveaway_lng', cleanLng);
    setLocError('');
    setShowManualLoc(false);
  }

  // Handle search submit
  function handleSearchSubmit(e) {
    e.preventDefault();
    setActiveSearch(searchQuery);
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  }

  // Clear search filter
  function handleClearSearch() {
    setSearchQuery('');
    setActiveSearch('');
    setSearchParams({});
  }

  // Handle requesting an item
  async function handleRequestItem(itemId) {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    setRequestingId(itemId);
    setActionMessage({ id: null, text: '', isError: false });

    try {
      const res = await fetch(`${API_URL}/api/items/${itemId}/request`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setActionMessage({
          id: itemId,
          text: data.error || 'Failed to request item',
          isError: true,
        });
        return;
      }

      setRequestedItemIds((prev) => [...prev, itemId]);
      setActionMessage({
        id: itemId,
        text: 'Request sent to owner!',
        isError: false,
      });
    } catch {
      setActionMessage({
        id: itemId,
        text: 'Network error. Please try again.',
        isError: true,
      });
    } finally {
      setRequestingId(null);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] pb-16">

      {/* Hero & Neighborhood Banner */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            {/* Left intro text */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1B5E3C] text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#1B5E3C]" />
                CornerStash &middot; Free Neighborhood Marketplace
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-900 leading-tight">
                Give what you don&apos;t need. Stash what you do.
              </h1>
              <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed">
                Connect with verified neighbors within <span className="font-bold text-stone-900">5 km</span>. No buying, no selling, no hassle. When an owner accepts one request, the item is claimed and passes on directly.
              </p>

              {/* Value props */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-stone-600">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1B5E3C]" />
                  Direct neighbor handoffs
                </span>
                <span className="flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-[#1B5E3C]" />
                  One claim per item
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1B5E3C]" />
                  Strictly 5 km radius
                </span>
              </div>
            </div>

            {/* Right Location & Radius Card */}
            <div className="w-full lg:w-80 bg-[#F7F7F2] border border-stone-200 rounded-lg p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1B5E3C]" />
                  Your Location
                </span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-[#1B5E3C] px-2 py-0.5 rounded">
                  5 km radius
                </span>
              </div>

              {coords ? (
                <div className="text-xs text-stone-700">
                  <p className="font-medium text-stone-900">
                    Lat: {coords.lat}, Lng: {coords.lng}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Showing available items nearby
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-500">
                  Allow location access or set coordinates to view nearby items.
                </p>
              )}

              {locError && (
                <p className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  {locError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-stone-200/80">
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex-1 min-h-[36px] px-3 text-xs font-medium text-[#1B5E3C] bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? 'Locating…' : 'Use GPS'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualLoc(!showManualLoc)}
                  className="min-h-[36px] px-3 text-xs font-medium text-stone-600 bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
                  {showManualLoc ? 'Cancel' : 'Set manually'}
                </button>
              </div>

              {/* Manual coordinate form modal/dropdown */}
              {showManualLoc && (
                <form
                  onSubmit={handleManualLocationSubmit}
                  className="mt-2 pt-2 border-t border-stone-300 space-y-2 text-xs"
                >
                  <div>
                    <label htmlFor="manualLat" className="block text-stone-600 font-medium mb-1">
                      Latitude (-90 to 90)
                    </label>
                    <input
                      id="manualLat"
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 28.6139"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      className="w-full min-h-[36px] px-2.5 rounded border border-stone-300 text-xs text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B5E3C]"
                    />
                  </div>
                  <div>
                    <label htmlFor="manualLng" className="block text-stone-600 font-medium mb-1">
                      Longitude (-180 to 180)
                    </label>
                    <input
                      id="manualLng"
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 77.2090"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                      className="w-full min-h-[36px] px-2.5 rounded border border-stone-300 text-xs text-stone-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B5E3C]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full min-h-[36px] bg-[#1B5E3C] text-white text-xs font-medium rounded hover:bg-[#164E31] transition-colors"
                  >
                    Apply Coordinates
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Main Browse Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        {/* Search & Categories Bar */}
        <section className="space-y-4">

          {/* Prominent Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search items by title (e.g. monitor, desk, novel)…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-9 rounded-md border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="min-h-[44px] px-5 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-sm font-medium rounded-md transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] focus-visible:ring-offset-2"
            >
              Search
            </button>
          </form>

          {/* Categories with Lucide icons (Flipkart / Marketplace pill style) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin" role="group" aria-label="Filter by category">
            {CATEGORIES.map(({ name, icon: Icon }) => {
              const isSelected = selectedCategory === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedCategory(name)}
                  className={`min-h-[42px] px-4 py-2 flex items-center gap-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] ${
                    isSelected
                      ? 'bg-[#1B5E3C] text-white shadow-emerald-900/10'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>

        </section>

        {/* Section Heading & Result count */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              Nearby Items
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {coords
                ? `Available within 5 km of your location`
                : 'Showing listings (location needed for exact distance)'}
            </p>
          </div>

          {activeSearch && (
            <div className="flex items-center gap-2 text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-md">
              <span>Matching: &ldquo;{activeSearch}&rdquo;</span>
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Remove search filter"
                className="text-stone-500 hover:text-stone-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Error notification */}
        {fetchError && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {fetchError}
          </div>
        )}

        {/* Prompt to set location */}
        {!coords && !locating && (
          <div className="text-center py-12 bg-white border border-stone-200 rounded-lg p-8 shadow-sm max-w-lg mx-auto">
            <MapPin className="w-10 h-10 text-[#1B5E3C] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-900">Set your location to see items near you</h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-md mx-auto">
              Giveaway shows free items within 5 km of your home. Allow browser location or set your coordinates above.
            </p>
            <button
              type="button"
              onClick={detectLocation}
              className="mt-4 min-h-[40px] px-5 bg-[#1B5E3C] text-white text-xs sm:text-sm font-medium rounded-md hover:bg-[#164E31] transition-colors"
            >
              Enable location
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(8)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm animate-pulse flex flex-col"
              >
                <div className="aspect-[4/3] bg-stone-200 w-full" />
                <div className="p-3.5 space-y-2.5 flex-1">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-100 rounded w-full" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                  <div className="h-8 bg-stone-200 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {coords && !loading && items.length === 0 && (
          <div className="text-center py-16 bg-white border border-stone-200 rounded-lg p-8 shadow-sm max-w-lg mx-auto">
            <Package className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-stone-900">No items found within 5 km</h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
              {activeSearch || selectedCategory !== 'All'
                ? 'No items matched your current filters. Try searching for something else or switching categories.'
                : 'There are no free items listed in your immediate neighborhood right now.'}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {(activeSearch || selectedCategory !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    handleClearSearch();
                  }}
                  className="min-h-[40px] px-4 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                >
                  Reset filters
                </button>
              )}
              {user ? (
                <Link
                  to="/add"
                  className="min-h-[40px] px-4 flex items-center bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs sm:text-sm font-medium rounded-md transition-colors shadow-sm"
                >
                  List an item yourself
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="min-h-[40px] px-4 flex items-center bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs sm:text-sm font-medium rounded-md transition-colors shadow-sm"
                >
                  Sign up to give items
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Product Grid: 4 columns on desktop, 3 on tablet, 2 on mobile */}
        {coords && !loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {items.map((item) => {
              const isOwner = user && item.owner?._id === user._id;
              const isRequested = requestedItemIds.includes(item._id);

              return (
                <article
                  key={item._id}
                  className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group"
                >
                  {/* Image container with fixed 4:3 aspect ratio */}
                  <div
                    onClick={() => setDetailItem(item)}
                    className="relative aspect-[4/3] w-full bg-stone-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/600x450/f5f5f4/57534e?text=Giveaway+Item';
                      }}
                    />

                    {/* Category & Condition overlay badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                      <span className="bg-white/95 backdrop-blur-sm text-stone-800 text-[11px] font-semibold px-2 py-0.5 rounded shadow-sm">
                        {item.category}
                      </span>
                      {item.condition && (
                        <span className="bg-[#1B5E3C] text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow-sm">
                          {item.condition}
                        </span>
                      )}
                    </div>

                    {/* Distance & Locality overlay badge */}
                    <span className="absolute top-2.5 right-2.5 bg-stone-900/85 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded shadow-sm flex items-center gap-1 max-w-[150px] truncate">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {item.locationName ? `${item.locationName} · ` : ''}
                        {typeof item.distanceKm === 'number'
                          ? `${item.distanceKm} km`
                          : `${(item.distance / 1000).toFixed(1)} km`}
                      </span>
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      {/* Price / Free Pill & Giver Credibility Bar */}
                      <div className="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-stone-100">
                        <button
                          type="button"
                          onClick={() => setSelectedNeighborId(item.owner?._id)}
                          className="flex items-center gap-1.5 min-w-0 text-left group/owner hover:opacity-80 transition-opacity"
                          title="View neighbor credibility & profile"
                        >
                          {item.owner?.avatarUrl ? (
                            <img
                              src={item.owner.avatarUrl}
                              alt={item.owner.name}
                              className="w-5 h-5 rounded-full object-cover shrink-0 border border-stone-200"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center font-bold text-[10px] shrink-0">
                              {item.owner?.name?.charAt(0) || 'N'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="flex items-center gap-1 text-xs font-semibold text-stone-800 truncate group-hover/owner:text-[#1B5E3C]">
                              {item.owner?.name || 'Neighbor'}
                              <CheckCircle2 className="w-3 h-3 text-[#1B5E3C] shrink-0" title="Verified Community Member" />
                            </span>
                            {item.owner?.createdAt && (
                              <span className="block text-[10px] text-stone-400 truncate">
                                Neighbor since {formatMemberSince(item.owner.createdAt)}
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="shrink-0 flex items-center gap-1">
                          {item.owner?.ratingCount > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                              {item.owner.ratingAverage}
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400 font-medium bg-stone-50 px-1 py-0.5 rounded">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setDetailItem(item)}
                        className="text-sm sm:text-base font-semibold text-stone-900 line-clamp-1 group-hover:text-[#1B5E3C] transition-colors cursor-pointer"
                        title="Click to view full photo and details"
                      >
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Request CTA */}
                    <div className="pt-2 border-t border-stone-100">
                      {isOwner ? (
                        <button
                          type="button"
                          disabled
                          className="w-full min-h-[38px] bg-stone-100 text-stone-500 text-xs font-medium rounded-md cursor-not-allowed"
                        >
                          Your listing
                        </button>
                      ) : isRequested ? (
                        <button
                          type="button"
                          disabled
                          className="w-full min-h-[38px] bg-emerald-50 text-[#1B5E3C] border border-emerald-200 text-xs font-semibold rounded-md cursor-default flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Requested
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestItem(item._id)}
                          disabled={requestingId === item._id}
                          className="w-full min-h-[38px] bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs sm:text-sm font-medium rounded-md transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] focus-visible:ring-offset-2 disabled:opacity-50"
                        >
                          {requestingId === item._id ? 'Sending…' : 'Request item'}
                        </button>
                      )}

                      {actionMessage.id === item._id && (
                        <p
                          role="status"
                          className={`text-[11px] mt-1.5 text-center font-medium ${
                            actionMessage.isError ? 'text-red-600' : 'text-[#1B5E3C]'
                          }`}
                        >
                          {actionMessage.text}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>

      {/* Neighbor Profile Modal */}
      {selectedNeighborId && (
        <NeighborProfileModal
          userId={selectedNeighborId}
          onClose={() => setSelectedNeighborId(null)}
        />
      )}

      {/* Item Detail Modal */}
      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onRequest={handleRequestItem}
          isOwner={user && detailItem.owner?._id === user._id}
          isRequested={requestedItemIds.includes(detailItem._id)}
          requesting={requestingId === detailItem._id}
          onOpenOwnerProfile={(ownerId) => {
            setDetailItem(null);
            setSelectedNeighborId(ownerId);
          }}
        />
      )}

      {/* Safety Tips Modal */}
      {showSafetyModal && (
        <SafetyTipsModal onClose={() => setShowSafetyModal(false)} />
      )}
    </main>
  );
}
