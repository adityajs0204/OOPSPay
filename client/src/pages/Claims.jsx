import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyClaims } from '../services/api'
import ClaimCard from '../components/ClaimCard'
import PayoutConfirmation from '../components/PayoutConfirmation'
import ReportDisruption from '../components/ReportDisruption'
import { ClipboardList, Loader2, Wallet, AlertTriangle } from 'lucide-react'

const filters = ['all', 'pending', 'approved', 'rejected', 'flagged']

export default function Claims() {
  const { user } = useAuth()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [payoutClaim, setPayoutClaim] = useState(null)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    loadClaims()
  }, [user])

  const loadClaims = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const res = await getMyClaims(user.uid)
      setClaims(res.data?.claims || res.data || [])
    } catch {
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = activeFilter === 'all'
    ? claims
    : claims.filter((c) => c.status?.toLowerCase() === activeFilter)

  const filterColors = {
    all: 'bg-gray-900 text-white',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    flagged: 'bg-orange-100 text-orange-700',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Claims</h1>
            <p className="text-gray-500 mt-1">Track your automated insurance claims</p>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-400 transition-colors shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Disruption
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeFilter === f
                  ? filterColors[f]
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
              {f !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({claims.filter((c) => c.status?.toLowerCase() === f).length})
                </span>
              )}
              {f === 'all' && (
                <span className="ml-1.5 text-xs opacity-70">({claims.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Claims List */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((claim, i) => (
              <div key={claim._id || i}>
                <ClaimCard claim={claim} />
                {claim.status?.toLowerCase() === 'approved' && (
                  <div className="mt-2 ml-14 mb-2">
                    <button
                      onClick={() => setPayoutClaim({ ...claim, name: user?.name || 'Rider' })}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      View Payout Details
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {activeFilter === 'all' ? 'No Claims Yet' : `No ${activeFilter} claims`}
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {activeFilter === 'all'
                ? 'Your policy monitors disruptions automatically. When conditions trigger a claim, it will appear here.'
                : `You don't have any ${activeFilter} claims at the moment.`}
            </p>
          </div>
        )}
      </div>

      {/* Payout Confirmation Modal */}
      {payoutClaim && (
        <PayoutConfirmation
          claim={payoutClaim}
          onClose={() => setPayoutClaim(null)}
        />
      )}

      {/* Report Disruption Modal */}
      {showReport && (
        <ReportDisruption
          onClose={() => setShowReport(false)}
          onSuccess={() => {
            setShowReport(false)
            loadClaims()
          }}
        />
      )}
    </div>
  )
}
