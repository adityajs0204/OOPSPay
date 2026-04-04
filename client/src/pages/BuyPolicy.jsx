import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { calculatePremium, purchasePolicy } from '../services/api'
import toast from 'react-hot-toast'
import {
  Shield, ShieldCheck, Crown, CloudRain, Thermometer, Wind, AlertTriangle,
  Droplets, CheckCircle, ArrowLeft, Loader2, Star
} from 'lucide-react'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Shield,
    price: 49,
    coverage: 60,
    maxPayout: 3000,
    disruptions: ['rain', 'heat'],
    disruptionLabels: ['Heavy Rain', 'Extreme Heat'],
    color: 'border-blue-200 hover:border-blue-400',
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
    btnBg: 'bg-blue-600 hover:bg-blue-500',
    badge: null,
  },
  {
    id: 'standard',
    name: 'Standard',
    icon: ShieldCheck,
    price: 99,
    coverage: 80,
    maxPayout: 5000,
    disruptions: ['rain', 'heat', 'pollution', 'flood'],
    disruptionLabels: ['Heavy Rain', 'Extreme Heat', 'Air Pollution', 'Flooding'],
    color: 'border-emerald-300 hover:border-emerald-500 ring-2 ring-emerald-100',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
    btnBg: 'bg-emerald-600 hover:bg-emerald-500',
    badge: 'Most Popular',
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    price: 149,
    coverage: 100,
    maxPayout: 8000,
    disruptions: ['rain', 'heat', 'pollution', 'flood', 'curfew'],
    disruptionLabels: ['Heavy Rain', 'Extreme Heat', 'Air Pollution', 'Flooding', 'City Curfew'],
    color: 'border-amber-200 hover:border-amber-400',
    accent: 'text-amber-600',
    bg: 'bg-amber-50',
    btnBg: 'bg-amber-600 hover:bg-amber-500',
    badge: null,
  },
]

const disruptionIcons = {
  rain: CloudRain,
  heat: Thermometer,
  pollution: Wind,
  flood: Droplets,
  curfew: AlertTriangle,
}

export default function BuyPolicy() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [breakdown, setBreakdown] = useState(null)
  const [loadingCalc, setLoadingCalc] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  const handleSelect = async (plan) => {
    setSelected(plan.id)
    setLoadingCalc(true)
    setBreakdown(null)
    try {
      const res = await calculatePremium({
        planId: plan.id,
        city: user?.city || 'Mumbai',
        riderId: user?.uid,
      })
      setBreakdown(res.data?.breakdown || res.data || null)
    } catch {
      // Use mock breakdown for demo
      setBreakdown({
        basePremium: plan.price,
        cityRiskFactor: Math.round(plan.price * 0.1),
        seasonAdjustment: Math.round(plan.price * 0.05),
        loyaltyDiscount: 0,
        finalPremium: Math.round(plan.price * 1.15),
      })
    } finally {
      setLoadingCalc(false)
    }
  }

  const handlePurchase = async () => {
    if (!selected) return
    setPurchasing(true)
    try {
      await purchasePolicy({
        planId: selected,
        userId: user?.uid,
        city: user?.city || 'Mumbai',
        zone: user?.zone || '',
        platform: user?.platform || 'zomato',
      })
      toast.success('Policy purchased successfully! You are now protected.')
      navigate('/policies')
    } catch (err) {
      console.error('Purchase error:', err)
      toast.error(err?.response?.data?.error || 'Purchase failed. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  const selectedPlan = plans.find((p) => p.id === selected)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="text-gray-500 mt-1">Select the coverage that fits your delivery schedule</p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const PlanIcon = plan.icon
            const isSelected = selected === plan.id
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 shadow-sm transition-all cursor-pointer ${
                  isSelected ? plan.color + ' shadow-md scale-[1.02]' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelect(plan)}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-lg">
                      <Star className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="p-6 pt-8">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${plan.bg} ${plan.accent} mb-4`}>
                    <PlanIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-3 mb-6">
                    <span className="text-3xl font-extrabold text-gray-900">₹{plan.price}</span>
                    <span className="text-gray-500 text-sm">/week</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Coverage</span>
                      <span className="font-semibold text-gray-900">{plan.coverage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Max Payout</span>
                      <span className="font-semibold text-gray-900">₹{plan.maxPayout.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Covers</p>
                    <div className="space-y-2">
                      {plan.disruptions.map((d, i) => {
                        const DIcon = disruptionIcons[d]
                        return (
                          <div key={d} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            <DIcon className="w-4 h-4 text-gray-400 shrink-0" />
                            <span>{plan.disruptionLabels[i]}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <button
                    className={`w-full mt-6 px-4 py-3 rounded-xl text-white font-semibold transition-colors ${
                      isSelected ? plan.btnBg : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(plan)
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Premium Breakdown */}
        {selected && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Premium Calculation</h2>
              {loadingCalc ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              ) : breakdown ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base premium ({selectedPlan?.name})</span>
                    <span className="text-gray-900">₹{breakdown.basePremium || selectedPlan?.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">City risk factor ({user?.city || 'Mumbai'})</span>
                    <span className="text-gray-900">+ ₹{breakdown.cityRiskFactor || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Season adjustment</span>
                    <span className="text-gray-900">+ ₹{breakdown.seasonAdjustment || 0}</span>
                  </div>
                  {(breakdown.loyaltyDiscount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Loyalty discount</span>
                      <span className="text-emerald-600">- ₹{breakdown.loyaltyDiscount}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Total per week</span>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{breakdown.finalPremium || breakdown.total || selectedPlan?.price}
                    </span>
                  </div>
                </div>
              ) : null}

              <button
                onClick={handlePurchase}
                disabled={purchasing || loadingCalc}
                className="w-full mt-6 px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {purchasing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm & Pay ₹${breakdown?.finalPremium || breakdown?.total || selectedPlan?.price || '—'}/week`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
