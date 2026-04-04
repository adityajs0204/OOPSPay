import { useState } from 'react'
import { CloudRain, Thermometer, Wind, AlertTriangle, Droplets, ShieldAlert, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react'

const typeIcons = {
  rain: CloudRain,
  flood: Droplets,
  heat: Thermometer,
  pollution: Wind,
  curfew: AlertTriangle,
}

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
  processing: { color: 'bg-blue-100 text-blue-700', icon: Clock },
}

export default function ClaimCard({ claim }) {
  const [expanded, setExpanded] = useState(false)

  const type = claim.disruptionType?.toLowerCase() || claim.type?.toLowerCase() || 'rain'
  const status = claim.status?.toLowerCase() || 'pending'
  const Icon = typeIcons[type] || ShieldAlert
  const cfg = statusConfig[status] || statusConfig.pending
  const StatusIcon = cfg.icon

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 text-gray-600">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 capitalize">{type} Disruption</h3>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>{formatDate(claim.createdAt || claim.date)}</span>
              {claim.amount != null && (
                <span className="font-medium text-gray-900">₹{Number(claim.amount).toLocaleString('en-IN')}</span>
              )}
              {claim.payoutAmount != null && status === 'approved' && (
                <span className="font-medium text-emerald-600">Payout: ₹{Number(claim.payoutAmount).toLocaleString('en-IN')}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-3">
          {claim.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700">{claim.description}</p>
            </div>
          )}
          {claim.validationSources && claim.validationSources.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Validation Sources</p>
              <div className="flex flex-wrap gap-1.5">
                {claim.validationSources.map((s, i) => (
                  <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white text-gray-600 border border-gray-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {claim.fraudScore != null && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fraud Check Score</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${claim.fraudScore < 0.3 ? 'bg-emerald-500' : claim.fraudScore < 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${claim.fraudScore * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{(claim.fraudScore * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
          {claim.decisionBreakdown && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Decision Breakdown</p>
              <p className="text-sm text-gray-700">{claim.decisionBreakdown}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
