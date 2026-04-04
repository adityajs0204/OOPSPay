import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRiskProfile } from '../services/api'
import toast from 'react-hot-toast'
import {
  Loader2, MapPin, Map, Sun, Smartphone, ClipboardList,
  Heart, TrendingDown, TrendingUp, ArrowRight, Lightbulb,
  Shield, IndianRupee, Activity
} from 'lucide-react'

const demoProfile = {
  overallScore: 5.2,
  factors: {
    cityRisk: { label: 'City Risk', city: 'Mumbai', score: 6.5 },
    zoneRisk: { label: 'Zone Risk', zone: 'Western Suburbs', score: 4.8 },
    seasonRisk: { label: 'Season Risk', season: 'Monsoon', score: 7.2 },
    platformRisk: { label: 'Platform Risk', platform: 'Zomato', score: 4.0 },
    claimsHistory: { label: 'Claims History', count: 2, score: 3.5 },
    loyaltyDiscount: { label: 'Loyalty Discount', weeks: 6, score: -1.5 },
  },
  premium: {
    base: 149,
    cityAdjustment: 22,
    seasonAdjustment: 18,
    loyaltyDiscount: -15,
    final: 174,
  },
  recommendations: [
    'Maintain 4+ consecutive weeks for loyalty discount.',
    'Your zone has moderate flood risk. Stay alert during monsoon.',
    'Low claims history -- great! Keep it up for lower premiums.',
    'Consider upgrading to a monthly plan for better value.',
  ],
}

function scoreColor(score) {
  if (score <= 3) return 'text-emerald-500'
  if (score <= 6) return 'text-yellow-500'
  return 'text-red-500'
}

function scoreBg(score) {
  if (score <= 3) return 'bg-emerald-500'
  if (score <= 6) return 'bg-yellow-500'
  return 'bg-red-500'
}

function scoreBarBg(score) {
  if (score <= 3) return 'bg-emerald-100'
  if (score <= 6) return 'bg-yellow-100'
  return 'bg-red-100'
}

const factorIcons = {
  cityRisk: MapPin,
  zoneRisk: Map,
  seasonRisk: Sun,
  platformRisk: Smartphone,
  claimsHistory: ClipboardList,
  loyaltyDiscount: Heart,
}

export default function RiskProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user?.uid) {
      setProfile(demoProfile)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await getRiskProfile(user.uid)
      const data = res.data?.riskProfile || res.data
      setProfile(data && data.overallScore != null ? data : demoProfile)
    } catch {
      setProfile(demoProfile)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  const p = profile || demoProfile
  const overallScore = p.overallScore ?? 5.2
  const factors = p.factors || demoProfile.factors
  const premium = p.premium || demoProfile.premium
  const recommendations = p.recommendations || demoProfile.recommendations

  // Gauge math: semicircle
  const gaugeAngle = (overallScore / 10) * 180
  const radius = 90
  const cx = 100
  const cy = 100
  const startAngle = Math.PI
  const endAngle = startAngle - (gaugeAngle * Math.PI) / 180
  const x1 = cx + radius * Math.cos(startAngle)
  const y1 = cy + radius * Math.sin(startAngle)
  const x2 = cx + radius * Math.cos(endAngle)
  const y2 = cy + radius * Math.sin(endAngle)
  const largeArc = gaugeAngle > 180 ? 1 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-500" />
            Risk Profile
          </h1>
          <p className="text-gray-500 mt-1">Your personalized risk analysis and premium breakdown</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Gauge + Factors */}
          <div className="lg:col-span-2 space-y-8">
            {/* Risk Score Gauge */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Overall Risk Score</h2>
              <div className="flex justify-center mb-4">
                <div className="relative" style={{ width: 200, height: 120 }}>
                  <svg viewBox="0 0 200 120" className="w-full h-full">
                    {/* Background arc */}
                    <path
                      d="M 10 100 A 90 90 0 0 1 190 100"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    {/* Green zone (0-3) */}
                    <path
                      d="M 10 100 A 90 90 0 0 1 46.23 28.21"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="14"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    {/* Yellow zone (3-6) */}
                    <path
                      d="M 46.23 28.21 A 90 90 0 0 1 153.77 28.21"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="14"
                      opacity="0.3"
                    />
                    {/* Red zone (6-10) */}
                    <path
                      d="M 153.77 28.21 A 90 90 0 0 1 190 100"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="14"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    {/* Needle indicator arc */}
                    <path
                      d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`}
                      fill="none"
                      stroke={overallScore <= 3 ? '#10b981' : overallScore <= 6 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                    <p className={`text-4xl font-bold ${scoreColor(overallScore)}`}>{overallScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">out of 10</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Low (0-3)</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Medium (4-6)</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> High (7-10)</div>
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors Breakdown</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(factors).map(([key, factor]) => {
                  const Icon = factorIcons[key] || Shield
                  const score = factor.score ?? 0
                  const absScore = Math.abs(score)
                  const isDiscount = score < 0
                  return (
                    <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${isDiscount ? 'bg-emerald-50 text-emerald-600' : scoreBarBg(absScore)} ${isDiscount ? '' : scoreColor(absScore).replace('text-', 'text-')}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900">{factor.label}</h3>
                          <p className="text-xs text-gray-400">
                            {factor.city || factor.zone || factor.season || factor.platform || (factor.count != null ? `${factor.count} claims` : (factor.weeks != null ? `${factor.weeks} weeks` : ''))}
                          </p>
                        </div>
                        <span className={`text-lg font-bold ${isDiscount ? 'text-emerald-500' : scoreColor(absScore)}`}>
                          {isDiscount ? '' : ''}{score.toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${isDiscount ? 'bg-emerald-500' : scoreBg(absScore)}`}
                          style={{ width: `${Math.min(100, (absScore / 10) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Premium Impact */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-500" />
                Premium Breakdown
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-500">Base Premium</span>
                  <span className="text-sm font-bold text-gray-900">₹{premium.base}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                    City Adjustment
                  </span>
                  <span className="text-sm font-medium text-red-500">+₹{premium.cityAdjustment}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                    Season Adjustment
                  </span>
                  <span className="text-sm font-medium text-red-500">+₹{premium.seasonAdjustment}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-50">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    Loyalty Discount
                  </span>
                  <span className="text-sm font-medium text-emerald-500">-₹{Math.abs(premium.loyaltyDiscount)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-t-2 border-gray-200 mt-2">
                  <span className="text-base font-bold text-gray-900">Final Premium</span>
                  <span className="text-xl font-bold text-emerald-600">₹{premium.final}/wk</span>
                </div>
              </div>

              {/* Visual flow */}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-1 rounded bg-gray-50 font-medium">₹{premium.base}</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="px-2 py-1 rounded bg-red-50 text-red-500 font-medium">+₹{premium.cityAdjustment + premium.seasonAdjustment}</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 font-medium">-₹{Math.abs(premium.loyaltyDiscount)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="px-2 py-1 rounded bg-emerald-500 text-white font-bold">₹{premium.final}</span>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Tips to Lower Premium
              </h2>
              <div className="space-y-3">
                {recommendations.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
