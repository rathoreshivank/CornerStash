import { X, ShieldCheck, HeartHandshake, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SafetyTipsModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 relative p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#1B5E3C] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900">Neighborhood Safety Guide</h3>
            <p className="text-xs text-stone-500">How we keep CornerStash safe, genuine, and friendly.</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-stone-700">
          <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <CheckCircle2 className="w-4 h-4 text-[#1B5E3C] shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block font-semibold">100% Free Always</strong>
              Never send money, courier fees, deposits, or advance shipping charges. Everything on CornerStash is given freely with zero financial transactions.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <HeartHandshake className="w-4 h-4 text-[#1B5E3C] shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block font-semibold">Safe Daylight Meetups</strong>
              Coordinate pickups during daytime hours in easy-to-reach locations like an apartment lobby, front porch, or nearby neighborhood landmark.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <Eye className="w-4 h-4 text-[#1B5E3C] shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block font-semibold">Inspect on Arrival</strong>
              Check the item when you meet to make sure it matches your expectations. Givers and receivers can leave credibility ratings to build mutual neighborhood trust.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200/80">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block font-semibold">Keep Communication Clear</strong>
              Notify your neighbor if you are delayed or need to reschedule. Neighbors with high completion ratings are prioritized for future giveaways.
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1B5E3C] hover:bg-[#164E31] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
