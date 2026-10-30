import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import NeighborProfileModal from '../components/NeighborProfileModal';
import RatingModal from '../components/RatingModal';
import {
  Package,
  Inbox,
  CheckCircle2,
  Trash2,
  Clock,
  Check,
  X,
  AlertCircle,
  PlusCircle,
  Mail,
  Store,
  ShieldCheck,
  Calendar,
  Star,
  User,
} from 'lucide-react';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'requests'

  // Listings state
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // Requests state
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Action feedback
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Reviews and neighbor profile inspection
  const [reviewsMap, setReviewsMap] = useState({});
  const [selectedNeighborId, setSelectedNeighborId] = useState(null);
  const [ratingModalData, setRatingModalData] = useState(null); // { item, targetName, role }

  // Fetch submitted reviews map
  const fetchReviewsMap = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/reviews/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviewsMap(data.reviews || {});
      }
    } catch {
      // Non-critical, ignore
    }
  }, [token]);

  // Fetch listings and requests
  const fetchListings = useCallback(async () => {
    if (!token) return;
    setLoadingListings(true);
    try {
      const res = await fetch(`${API_URL}/api/items/my-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data.items || []);
      }
    } catch {
      setActionError('Could not load your listings.');
    } finally {
      setLoadingListings(false);
    }
  }, [token]);

  const fetchMyRequests = useCallback(async () => {
    if (!token) return;
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_URL}/api/requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data.requests || []);
      }
    } catch {
      setActionError('Could not load your requests.');
    } finally {
      setLoadingRequests(false);
    }
  }, [token]);

  useEffect(() => {
    fetchListings();
    fetchMyRequests();
    fetchReviewsMap();
  }, [fetchListings, fetchMyRequests, fetchReviewsMap]);

  // Accept request
  async function handleAccept(requestId) {
    setProcessingId(requestId);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'Failed to accept request.');
        return;
      }

      setActionSuccess('Request accepted! The item is claimed and contact information is now unlocked.');
      fetchListings();
      fetchMyRequests();
    } catch {
      setActionError('Network error. Could not accept request.');
    } finally {
      setProcessingId(null);
    }
  }

  // Reject request
  async function handleReject(requestId) {
    setProcessingId(requestId);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'Failed to reject request.');
        return;
      }

      setActionSuccess('Request rejected.');
      fetchListings();
    } catch {
      setActionError('Network error. Could not reject request.');
    } finally {
      setProcessingId(null);
    }
  }

  // Delete listing
  async function handleDeleteListing(itemId) {
    if (!window.confirm('Delete this listing? Any pending requests for it will also be cancelled.')) {
      return;
    }

    setProcessingId(itemId);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'Failed to delete listing.');
        return;
      }

      setActionSuccess('Listing deleted successfully.');
      fetchListings();
    } catch {
      setActionError('Network error. Could not delete listing.');
    } finally {
      setProcessingId(null);
    }
  }

  // Real statistics computed directly from backend arrays
  const activeListingsCount = listings.filter((i) => i.status === 'available').length;
  const claimedListingsCount = listings.filter((i) => i.status === 'claimed').length;
  const totalRequestsReceived = listings.reduce(
    (sum, item) => sum + (item.requests ? item.requests.length : 0),
    0
  );
  const acceptedRequestsCount = myRequests.filter((r) => r.status === 'accepted').length;

  return (
    <main className="min-h-[calc(100vh-64px)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B5E3C] uppercase tracking-wider mb-1">
              <Store className="w-3.5 h-3.5" />
              Neighborhood Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Manage Items & Requests
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Review your neighborhood listings and coordinate giveaway handoffs.
            </p>
          </div>

          <Link
            to="/add"
            className="self-start sm:self-auto min-h-[42px] px-4 py-2 bg-[#1B5E3C] hover:bg-[#164E31] text-white font-semibold text-sm rounded-lg transition-colors shadow-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List new item</span>
          </Link>
        </div>

        {/* Live Metrics Summary */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Available
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-stone-900">{activeListingsCount}</span>
              <span className="text-[11px] font-bold text-[#1B5E3C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Claimed
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-stone-900">{claimedListingsCount}</span>
              <span className="text-[11px] font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                Handed off
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Requests Received
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-stone-900">{totalRequestsReceived}</span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Incoming
              </span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Items You Requested
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-stone-900">{myRequests.length}</span>
              {acceptedRequestsCount > 0 && (
                <span className="text-[11px] font-bold text-[#1B5E3C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {acceptedRequestsCount} Accepted
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Action feedback banners */}
        {actionError && (
          <div role="alert" className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div role="status" className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs sm:text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#1B5E3C]" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-stone-200 flex gap-4 sm:gap-8" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'listings'}
            onClick={() => setActiveTab('listings')}
            className={`min-h-[44px] pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] ${
              activeTab === 'listings'
                ? 'border-[#1B5E3C] text-[#1B5E3C]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Listings ({listings.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'requests'}
            onClick={() => setActiveTab('requests')}
            className={`min-h-[44px] pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E3C] ${
              activeTab === 'requests'
                ? 'border-[#1B5E3C] text-[#1B5E3C]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>My Requests ({myRequests.length})</span>
          </button>
        </div>

        {/* TAB 1: My Listings */}
        {activeTab === 'listings' && (
          <section className="space-y-5">
            {loadingListings ? (
              <div className="text-center py-12 text-sm text-stone-500">
                Loading your listings…
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-10 text-center shadow-sm max-w-lg mx-auto">
                <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-900">You haven&apos;t listed anything yet</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  List items you no longer need. Neighbors within 5 km will see them and request them.
                </p>
                <Link
                  to="/add"
                  className="inline-flex items-center min-h-[40px] mt-4 px-4 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  List an item now
                </Link>
              </div>
            ) : (
              listings.map((item) => {
                const isClaimed = item.status === 'claimed';
                const requestsCount = item.requests ? item.requests.length : 0;
                const acceptedReq = (item.requests || []).find((r) => r.status === 'accepted');

                return (
                  <article
                    key={item._id}
                    className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4"
                  >
                    {/* Top row: Item summary and Delete */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-lg border border-stone-200 bg-stone-100 flex-shrink-0"
                          loading="lazy"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-stone-900">
                              {item.title}
                            </h2>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isClaimed
                                  ? 'bg-stone-100 text-stone-600 border-stone-300'
                                  : 'bg-emerald-50 text-[#1B5E3C] border-emerald-200'
                              }`}
                            >
                              {isClaimed ? 'Claimed' : 'Available'}
                            </span>
                          </div>

                          <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                            <span>{item.category}</span>
                            <span>&middot;</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </p>
                          <p className="text-xs sm:text-sm text-stone-600 mt-1 line-clamp-1 max-w-xl">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Delete button (available items only) */}
                      {!isClaimed && (
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(item._id)}
                          disabled={processingId === item._id}
                          className="self-start sm:self-center min-h-[36px] px-3 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{processingId === item._id ? 'Deleting…' : 'Delete'}</span>
                        </button>
                      )}
                    </div>

                    {/* Clean Contact & Rating Card for Accepted Item */}
                    {isClaimed && acceptedReq && (
                      <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-5 h-5 text-[#1B5E3C]" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-stone-900">
                              Claimed by {acceptedReq.requester?.name}
                            </h4>
                            <p className="text-xs text-stone-600">
                              Direct neighbor contact for pickup coordination:
                            </p>
                            <span className="inline-block text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-stone-800 font-medium">
                              {acceptedReq.requester?.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
                          {acceptedReq.requester?.email && (
                            <a
                              href={`mailto:${acceptedReq.requester.email}?subject=CornerStash%20Pickup:%20${encodeURIComponent(item.title)}`}
                              className="min-h-[38px] px-4 py-2 bg-[#1B5E3C] hover:bg-[#164E31] text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email to Coordinate</span>
                            </a>
                          )}

                          {reviewsMap[item._id] ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100/70 text-amber-900 rounded-lg text-xs font-semibold border border-amber-300">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                              You rated {reviewsMap[item._id].rating}★
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setRatingModalData({
                                  item,
                                  targetName: acceptedReq.requester?.name,
                                  role: 'claimant',
                                })
                              }
                              className="min-h-[38px] px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-600" />
                              <span>Rate Receiver</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Requests received section */}
                    <div className="pt-3 border-t border-stone-100 bg-stone-50/60 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-xl">
                      <div className="flex items-center justify-between mb-2.5">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-600">
                          Requests received ({requestsCount})
                        </h3>
                        {requestsCount > 0 && !isClaimed && (
                          <span className="text-[11px] text-stone-500 font-medium">
                            Accepting one request safely marks this item as claimed
                          </span>
                        )}
                      </div>

                      {requestsCount === 0 ? (
                        <p className="text-xs text-stone-500 italic">
                          No requests received yet. Neighbors within 5 km can see this item and request it.
                        </p>
                      ) : (
                        <div className="divide-y divide-stone-200/80 bg-white border border-stone-200 rounded-lg overflow-hidden">
                          {item.requests.map((req) => (
                            <div
                              key={req._id}
                              className="p-3.5 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedNeighborId(req.requester?._id)}
                                  className="flex items-center gap-3 text-left group/req hover:opacity-85 transition-opacity"
                                  title="View neighbor credibility & profile"
                                >
                                  {req.requester?.avatarUrl ? (
                                    <img
                                      src={req.requester.avatarUrl}
                                      alt={req.requester.name}
                                      className="w-9 h-9 rounded-full object-cover border border-stone-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#1B5E3C] border border-emerald-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                      {req.requester?.name ? req.requester.name[0].toUpperCase() : 'N'}
                                    </div>
                                  )}
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-stone-900 text-sm group-hover/req:text-[#1B5E3C] flex items-center gap-1.5">
                                      <span>{req.requester?.name || 'Neighbor'}</span>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E3C]" title="Verified Neighbor" />
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                      Requested on {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                  </div>
                                </button>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                                    req.status === 'accepted'
                                      ? 'bg-emerald-50 text-[#1B5E3C] border-emerald-200'
                                      : req.status === 'rejected'
                                      ? 'bg-stone-100 text-stone-600 border-stone-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {req.status === 'accepted'
                                    ? 'Accepted'
                                    : req.status === 'rejected'
                                    ? 'Not selected'
                                    : 'Pending'}
                                </span>

                                {req.status === 'pending' && !isClaimed && (
                                  <div className="flex items-center gap-1.5 ml-2">
                                    <button
                                      type="button"
                                      onClick={() => handleAccept(req._id)}
                                      disabled={processingId === req._id}
                                      className="min-h-[32px] px-3 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Accept</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReject(req._id)}
                                      disabled={processingId === req._id}
                                      className="min-h-[32px] px-2.5 bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}

        {/* TAB 2: My Requests */}
        {activeTab === 'requests' && (
          <section className="space-y-4">
            {loadingRequests ? (
              <div className="text-center py-12 text-sm text-stone-500">
                Loading your requests…
              </div>
            ) : myRequests.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-10 text-center shadow-sm max-w-lg mx-auto">
                <Inbox className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-stone-900">You haven&apos;t requested any items yet</h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Discover free goods listed by neighbors within 5 km.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center min-h-[40px] mt-4 px-4 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Browse nearby items
                </Link>
              </div>
            ) : (
              myRequests.map((req) => {
                const isAccepted = req.status === 'accepted';
                return (
                  <article
                    key={req._id}
                    className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {req.item?.imageUrl ? (
                          <img
                            src={req.item.imageUrl}
                            alt={req.item.title || 'Item'}
                            className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-lg border border-stone-200 bg-stone-100 flex-shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-18 h-18 sm:w-20 sm:h-20 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-center text-xs text-stone-400">
                            No image
                          </div>
                        )}

                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-stone-900">
                            {req.item?.title || 'Listing no longer available'}
                          </h2>
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                            <span>Listed by</span>
                            <button
                              type="button"
                              onClick={() => setSelectedNeighborId(req.owner?._id)}
                              className="font-bold text-stone-800 hover:text-[#1B5E3C] inline-flex items-center gap-1"
                              title="View neighbor profile & credibility"
                            >
                              <span>{req.owner?.name || 'Neighbor'}</span>
                              <CheckCircle2 className="w-3 h-3 text-[#1B5E3C]" />
                            </button>
                            <span>&middot;</span>
                            <span>Requested on {new Date(req.createdAt).toLocaleDateString()}</span>
                          </div>
                          {req.item?.description && (
                            <p className="text-xs sm:text-sm text-stone-600 mt-1 line-clamp-1 max-w-lg">
                              {req.item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="self-start sm:self-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                            isAccepted
                              ? 'bg-emerald-50 text-[#1B5E3C] border-emerald-200'
                              : req.status === 'rejected'
                              ? 'bg-stone-100 text-stone-600 border-stone-300'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {isAccepted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E3C]" />
                              Accepted — Item Claimed for you!
                            </>
                          ) : req.status === 'rejected' ? (
                            <>
                              <X className="w-3.5 h-3.5 text-stone-400" />
                              Not selected
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Pending owner review
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Unlocked Owner Contact card & Review for Accepted requests */}
                    {isAccepted && (
                      <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-5 h-5 text-[#1B5E3C]" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-stone-900">
                              Pickup Unlocked from {req.owner?.name}
                            </h4>
                            <p className="text-xs text-stone-600">
                              Direct owner contact for pickup address and timing:
                            </p>
                            <span className="inline-block text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-stone-800 font-medium">
                              {req.owner?.email || 'Contact through platform'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
                          {req.owner?.email && (
                            <a
                              href={`mailto:${req.owner.email}?subject=CornerStash%20Pickup:%20${encodeURIComponent(req.item?.title || 'Item')}`}
                              className="min-h-[38px] px-4 py-2 bg-[#1B5E3C] hover:bg-[#164E31] text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email for Address</span>
                            </a>
                          )}

                          {req.item && reviewsMap[req.item._id] ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100/70 text-amber-900 rounded-lg text-xs font-semibold border border-amber-300">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                              You rated {reviewsMap[req.item._id].rating}★
                            </span>
                          ) : req.item ? (
                            <button
                              type="button"
                              onClick={() =>
                                setRatingModalData({
                                  item: req.item,
                                  targetName: req.owner?.name,
                                  role: 'giver',
                                })
                              }
                              className="min-h-[38px] px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-600" />
                              <span>Rate Giver</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        )}

      </div>

      {/* Neighbor Profile Modal */}
      {selectedNeighborId && (
        <NeighborProfileModal
          userId={selectedNeighborId}
          onClose={() => setSelectedNeighborId(null)}
        />
      )}

      {/* Rating & Review Modal */}
      {ratingModalData && (
        <RatingModal
          item={ratingModalData.item}
          targetName={ratingModalData.targetName}
          role={ratingModalData.role}
          onClose={() => setRatingModalData(null)}
          onSuccess={(newReview) => {
            setReviewsMap((prev) => ({
              ...prev,
              [ratingModalData.item._id]: {
                rating: newReview.rating,
                comment: newReview.comment,
                createdAt: newReview.createdAt,
              },
            }));
            setActionSuccess('Thank you for submitting your rating and building community trust!');
          }}
        />
      )}
    </main>
  );
}
