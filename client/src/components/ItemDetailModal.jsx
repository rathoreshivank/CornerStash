import { X, MapPin, CheckCircle2, Calendar, Clock, Check, User } from 'lucide-react';

function formatMemberSince(dateString) {
  if (!dateString) return 'Recent neighbor';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Recent neighbor';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ItemDetailModal({
  item,
  onClose,
  onRequest,
  isOwner,
  isRequested,
  requesting,
  onOpenOwnerProfile,
}) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200 relative my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-white/90 backdrop-blur-sm text-stone-600 hover:text-stone-900 shadow-sm border border-stone-200 transition-colors"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1">
          {/* Main Photo View */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-stone-100">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://placehold.co/800x500/f5f5f4/57534e?text=Giveaway+Item';
              }}
            />
            {/* Overlay Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span className="bg-white/95 backdrop-blur-sm text-stone-900 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-stone-200/60">
                {item.category}
              </span>
              {item.condition && (
                <span className="bg-[#1B5E3C] text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">
                  {item.condition}
                </span>
              )}
            </div>

            <div className="absolute bottom-3 right-3 bg-stone-950/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-md shadow-sm flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {item.locationName ? `${item.locationName} · ` : ''}
                {typeof item.distanceKm === 'number'
                  ? `${item.distanceKm} km away`
                  : item.distance
                  ? `${(item.distance / 1000).toFixed(1)} km away`
                  : 'Nearby'}
              </span>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-5 sm:p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1B5E3C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  100% Free
                </span>
                <span className="text-xs text-stone-400">
                  Listed {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                {item.title}
              </h2>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Description
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                {item.description}
              </p>
            </div>

            {/* Pickup Preferences */}
            {item.pickupNotes && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                <span className="font-bold block text-amber-950 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Pickup Instructions from Neighbor:
                </span>
                <p className="text-stone-700">{item.pickupNotes}</p>
              </div>
            )}

            {/* Giver Trust & Profile Card */}
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => onOpenOwnerProfile(item.owner?._id)}
                className="flex items-center gap-3 text-left group hover:opacity-85 transition-opacity"
              >
                {item.owner?.avatarUrl ? (
                  <img
                    src={item.owner.avatarUrl}
                    alt={item.owner.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center font-bold text-base shrink-0 border border-emerald-200">
                    {item.owner?.name?.charAt(0) || 'N'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-stone-900 group-hover:text-[#1B5E3C] transition-colors">
                      {item.owner?.name || 'Neighbor'}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E3C]" title="Verified Neighbor" />
                  </div>
                  <p className="text-xs text-stone-500">
                    Neighbor since {formatMemberSince(item.owner?.createdAt)}
                  </p>
                </div>
              </button>

              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => onOpenOwnerProfile(item.owner?._id)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#1B5E3C] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                >
                  View neighbor profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Close
          </button>

          {isOwner ? (
            <span className="text-xs font-semibold text-stone-500 bg-stone-200/80 px-4 py-2.5 rounded-lg cursor-not-allowed">
              This is your listing
            </span>
          ) : isRequested ? (
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B5E3C] bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg">
              <Check className="w-4 h-4" />
              Requested
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onRequest(item._id)}
              disabled={requesting}
              className="min-h-[42px] px-6 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {requesting ? 'Sending request…' : 'Request this Item'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
