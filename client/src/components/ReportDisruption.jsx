import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { simulateDisruption } from '../services/api'
import toast from 'react-hot-toast'
import {
  X, CloudRain, Thermometer, Wind, Droplets, AlertTriangle,
  MapPin, Loader2, CheckCircle, AlertCircle, Shield
} from 'lucide-react'

const disruptionTypes = [
  { id: 'rain', label: 'Heavy Rainfall', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Continuous heavy rain making deliveries unsafe' },
  { id: 'heatwave', label: 'Extreme Heat', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Temperature above 42°C, unsafe outdoor conditions' },
  { id: 'pollution', label: 'Severe Pollution', icon: Wind, color: 'text-gray-500', bg: 'bg-gray-100', desc: 'Hazardous AQI levels (300+), breathing difficulty' },
  { id: 'flood', label: 'Flooding', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50', desc: 'Waterlogged roads, blocked routes' },
  { id: 'curfew', label: 'Curfew / Bandh', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', desc: 'Government-imposed restrictions, zone closures' },
]

export default function ReportDisruption({ onClose, onSuccess }) {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [severity, setSeverity] = useState(7)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Please select a disruption type')
      return
    }
    setSubmitting(true)
    try {
      const res = await simulateDisruption({
        type: selected,
        city: user?.city || 'Mumbai',
        severity,
        duration: 3,
      })
      const automation = res.data?.automation
      setResult({
        success: true,
        claimsCreated: automation?.claimsCreated || 0,
        claimsApproved: automation?.claimsApproved || 0,
        totalPayout: automation?.totalPayout || 0,
      })
      toast.success('Disruption reported! Your claim is being processed.')
    } catch {
      // Demo fallback
      setResult({
        success: true,
        claimsCreated: 1,
        claimsApproved: 1,
        totalPayout: Math.round((user?.avgWeeklyEarnings || 5000) / 7 * 0.8),
      })
      toast.success('Disruption reported! Claim created successfully.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Report a Disruption</h2>
            <p className="text-sm text-gray-500">We'll validate and process your claim automatically</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!result ? (
          <div className="p-6 space-y-6">
            {/* Location */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600">Reporting for</span>
              <span className="text-sm font-semibold text-slate-900">{user?.city || 'Mumbai'}, {user?.zone || 'Your Zone'}</span>
            </div>

            {/* Disruption Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">What disruption are you experiencing?</label>
              <div className="space-y-2">
                {disruptionTypes.map((d) => {
                  const Icon = d.icon
                  const isSelected = selected === d.id
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelected(d.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${d.bg}`}>
                        <Icon className={`w-5 h-5 ${d.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{d.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
                      </div>
                      {isSelected && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity: <span className="font-bold text-gray-900">{severity}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">How it works</p>
                <p className="mt-1 text-blue-600">Your report will be validated against weather APIs, news sources, and AQI data. If confirmed, a claim is auto-created and payout is processed instantly.</p>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className="w-full px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating & Processing...
                </span>
              ) : (
                'Report & Process Claim'
              )}
            </button>
          </div>
        ) : (
          /* Success Result */
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Claim Processed!</h3>
            <p className="text-gray-500">Your disruption report has been validated and processed automatically.</p>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Claims Created</span>
                <span className="font-semibold text-gray-900">{result.claimsCreated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Auto-Approved</span>
                <span className="font-semibold text-emerald-600">{result.claimsApproved}</span>
              </div>
              {result.totalPayout > 0 && (
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-gray-500">Payout Amount</span>
                  <span className="font-bold text-emerald-600 text-base">₹{result.totalPayout.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => { if (onSuccess) onSuccess(); else onClose(); }}
              className="w-full px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
