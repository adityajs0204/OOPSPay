import { Shield, ShieldCheck, ShieldX, Clock } from 'lucide-react'

const tierColors = {
  basic: 'border-blue-200 bg-blue-50',
  standard: 'border-emerald-200 bg-emerald-50',
  premium: 'border-amber-200 bg-amber-50',
}

const tierAccent = {
  basic: 'text-blue-700',
  standard: 'text-emerald-700',
  premium: 'text-amber-700',
}

const statusBadge = {
  active: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
}

export default function PolicyCard({ policy, onAction }) {
  const tier = policy.planId?.toLowerCase() || policy.tier?.toLowerCase() || 'basic'
  const status = policy.status?.toLowerCase() || 'active'

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className={`rounded-xl border-2 shadow-sm overflow-hidden ${tierColors[tier] || 'border-gray-200 bg-white'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {status === 'active' ? (
              <ShieldCheck className={`w-5 h-5 ${tierAccent[tier] || 'text-gray-600'}`} />
            ) : status === 'expired' ? (
              <ShieldX className="w-5 h-5 text-gray-400" />
            ) : (
              <Shield className="w-5 h-5 text-gray-400" />
            )}
            <h3 className={`text-lg font-bold capitalize ${tierAccent[tier] || 'text-gray-900'}`}>
              {policy.planName || `${tier} Plan`}
            </h3>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Coverage</p>
            <p className="text-lg font-bold text-gray-900">{policy.coveragePercent || policy.coverage || '—'}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Premium</p>
            <p className="text-lg font-bold text-gray-900">₹{policy.weeklyPremium || policy.premium || '—'}/wk</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Clock className="w-4 h-4" />
          <span>{formatDate(policy.startDate)} — {formatDate(policy.endDate)}</span>
        </div>

        {policy.coveredDisruptions && policy.coveredDisruptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {policy.coveredDisruptions.map((d) => (
              <span key={d} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/70 text-gray-600 border border-gray-200 capitalize">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>

      {onAction && status === 'active' && (
        <div className="border-t border-gray-200/50 px-6 py-3 bg-white/40">
          <button
            onClick={() => onAction(policy)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  )
}
