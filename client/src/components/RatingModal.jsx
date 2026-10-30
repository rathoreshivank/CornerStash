import { useState } from 'react';
import { Star, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

export default function RatingModal({ item, targetName, role = 'neighbor', onClose, onSuccess }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) {
      setError('Please provide a comment with at least 3 characters.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemId: item._id,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      onSuccess(data.review);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 relative p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1 mb-5">
          <h3 className="text-lg font-bold text-stone-900">
            Rate your exchange with {targetName || 'your neighbor'}
          </h3>
          <p className="text-xs text-stone-500">
            Item: <span className="font-semibold text-stone-700">{item.title}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="flex flex-col items-center gap-1.5 py-2">
            <span className="text-xs font-medium text-stone-600">Your Rating</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-500 fill-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {rating === 5 && '🌟 Outstanding neighborly spirit!'}
              {rating === 4 && '👍 Great exchange'}
              {rating === 3 && '🙂 Fair and smooth'}
              {rating === 2 && '😕 Could have been better'}
              {rating === 1 && '👎 Poor communication or no-show'}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="review-comment" className="block text-xs font-medium text-stone-700 mb-1">
              Feedback note (visible on their public neighbor profile)
            </label>
            <textarea
              id="review-comment"
              rows={3}
              maxLength={400}
              placeholder="e.g. Very polite and prompt pickup! Item was as described. Glad it found a new home!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full text-xs p-2.5 rounded-md border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1B5E3C]"
            />
            <div className="text-[10px] text-stone-400 text-right mt-0.5">
              {comment.length} / 400 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 text-xs font-semibold text-white bg-[#1B5E3C] hover:bg-[#164E31] rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
