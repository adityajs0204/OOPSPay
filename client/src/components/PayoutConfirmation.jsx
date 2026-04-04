import { useEffect, useState } from 'react'
import { CheckCircle, X, Wallet, Clock, Hash, User, FileText } from 'lucide-react'

export default function PayoutConfirmation({ claim, onClose }) {
  const [visible, setVisible] = useState(false)
  const [checkVisible, setCheckVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => setCheckVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  if (!claim) return null

  const amount = claim.payoutAmount || claim.amount || 0
  const txnId = claim.transactionId || claim._id || 'TXN-' + Math.random().toString(36).slice(2, 10).toUpperCase()
  const riderName = claim.riderName || claim.name || 'Rider'
  const type = claim.disruptionType || claim.type || 'Disruption'
  const hoursLost = claim.hoursLost || claim.disruption?.hoursLost || 4
  const dailyAvg = claim.dailyAverage || claim.avgDailyEarnings || Math.round(amount / (hoursLost / 8) || 800)
  const coveragePct = claim.coveragePercent || claim.coverage || 80
  const timestamp = claim.payoutDate || claim.updatedAt || claim.createdAt || new Date().toISOString()

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-md mx-4 transition-all duration-300 ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Green header */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-8 pb-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_70%)]" />

            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Animated checkmark */}
            <div className={`relative mx-auto w-20 h-20 mb-4 transition-all duration-500 ${
              checkVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}>
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm">
                <CheckCircle className="w-12 h-12 text-white" strokeWidth={1.5} />
              </div>
            </div>

            <p className="text-sm font-medium text-emerald-100 mb-1">Payout Successful</p>
            <p className="text-4xl font-bold text-white">
              ₹{Number(amount).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <Hash className="w-4 h-4" />
                Transaction ID
              </span>
              <span className="text-sm font-mono font-medium text-gray-900">{txnId}</span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                Paid To
              </span>
              <span className="text-sm font-medium text-gray-900">{riderName}</span>
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                Timestamp
              </span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payout Breakdown</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Disruption Type</span>
                <span className="font-medium text-gray-900 capitalize">{type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hours Lost</span>
                <span className="font-medium text-gray-900">{hoursLost}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Daily Average</span>
                <span className="font-medium text-gray-900">₹{Number(dailyAvg).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Coverage</span>
                <span className="font-medium text-gray-900">{coveragePct}%</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5 mt-1">
                <span className="font-semibold text-gray-900">Final Amount</span>
                <span className="font-bold text-emerald-600">₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-sm font-medium text-white hover:bg-emerald-400 transition-colors"
            >
              <FileText className="w-4 h-4" />
              View in Claims
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
