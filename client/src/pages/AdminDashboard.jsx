import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminDashboard, getFraudFlags, simulateDisruption, overrideClaim, getLiveFeed } from '../services/api'
import StatsCard from '../components/StatsCard'
import toast from 'react-hot-toast'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  FileText, ClipboardList, IndianRupee, TrendingDown, AlertTriangle,
  Zap, Loader2, CheckCircle, XCircle, ShieldAlert, Radio,
  Users, Bot, Eye, CloudRain, Thermometer, Wind, Droplets, ShieldOff,
  Clock, ArrowRight, Activity
} from 'lucide-react'

// Mock data for charts when API unavailable
const mockClaimsOverTime = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  claims: Math.floor(Math.random() * 15) + 2,
}))

const mockDisruptionsByType = [
  { type: 'Rain', count: 42 },
  { type: 'Heat', count: 28 },
  { type: 'Pollution', count: 19 },
  { type: 'Flood', count: 8 },
  { type: 'Curfew', count: 5 },
]

const mockClaimStatus = [
  { name: 'Approved', value: 68, color: '#10b981' },
  { name: 'Pending', value: 18, color: '#f59e0b' },
  { name: 'Rejected', value: 14, color: '#ef4444' },
]

const mockLiveFeed = [
  { _id: 'lf1', riderName: 'Rahul S.', type: 'rain', amount: 2400, status: 'auto_approved', timestamp: new Date(Date.now() - 30000).toISOString() },
  { _id: 'lf2', riderName: 'Priya M.', type: 'heat', amount: 1800, status: 'pending', timestamp: new Date(Date.now() - 120000).toISOString() },
  { _id: 'lf3', riderName: 'Amit K.', type: 'pollution', amount: 3100, status: 'auto_approved', timestamp: new Date(Date.now() - 300000).toISOString() },
  { _id: 'lf4', riderName: 'Sneha R.', type: 'rain', amount: 2000, status: 'auto_approved', timestamp: new Date(Date.now() - 600000).toISOString() },
  { _id: 'lf5', riderName: 'Vikram T.', type: 'curfew', amount: 4500, status: 'flagged', timestamp: new Date(Date.now() - 900000).toISOString() },
  { _id: 'lf6', riderName: 'Meena D.', type: 'flood', amount: 3800, status: 'auto_rejected', timestamp: new Date(Date.now() - 1200000).toISOString() },
]

const mockForecast = [
  { type: 'Rain', icon: CloudRain, probability: 72, color: 'text-blue-500', bg: 'bg-blue-50' },
  { type: 'Heat', icon: Thermometer, probability: 45, color: 'text-orange-500', bg: 'bg-orange-50' },
  { type: 'Pollution', icon: Wind, probability: 58, color: 'text-gray-500', bg: 'bg-gray-50' },
  { type: 'Flood', icon: Droplets, probability: 28, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { type: 'Curfew', icon: ShieldOff, probability: 5, color: 'text-red-500', bg: 'bg-red-50' },
]

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur']
const disruptionTypes = ['rain', 'flood', 'heat', 'pollution', 'curfew']

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

const feedStatusConfig = {
  auto_approved: { label: 'Auto-Approved', color: 'bg-emerald-100 text-emerald-700' },
  auto_rejected: { label: 'Auto-Rejected', color: 'bg-red-100 text-red-700' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  flagged: { label: 'Manual Review', color: 'bg-orange-100 text-orange-700' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [fraudFlags, setFraudFlags] = useState([])
  const [recentClaims, setRecentClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [liveFeed, setLiveFeed] = useState([])
  const [newFeedIds, setNewFeedIds] = useState(new Set())

  // Simulator state
  const [simType, setSimType] = useState('rain')
  const [simCity, setSimCity] = useState('Mumbai')
  const [simSeverity, setSimSeverity] = useState(5)
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)

  // Automation stats
  const autoApproved = liveFeed.filter(f => f.status === 'auto_approved').length || 4
  const autoRejected = liveFeed.filter(f => f.status === 'auto_rejected').length || 1
  const manualReview = liveFeed.filter(f => f.status === 'flagged' || f.status === 'pending').length || 2
  const totalAuto = autoApproved + autoRejected + manualReview

  useEffect(() => {
    loadData()
  }, [])

  // Live feed polling every 10 seconds
  useEffect(() => {
    fetchLiveFeed()
    const interval = setInterval(fetchLiveFeed, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchLiveFeed = async () => {
    try {
      const res = await getLiveFeed()
      const data = res.data?.feed || res.data || []
      if (data.length > 0) {
        setLiveFeed((prev) => {
          const prevIds = new Set(prev.map(p => p._id))
          const newOnes = data.filter(d => !prevIds.has(d._id))
          if (newOnes.length > 0) {
            setNewFeedIds(new Set(newOnes.map(n => n._id)))
            setTimeout(() => setNewFeedIds(new Set()), 3000)
          }
          return data
        })
      } else {
        setLiveFeed(mockLiveFeed)
      }
    } catch {
      setLiveFeed(mockLiveFeed)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [dashRes, fraudRes] = await Promise.allSettled([
        getAdminDashboard(),
        getFraudFlags(),
      ])
      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value?.data
        setStats(d?.stats || d)
        setRecentClaims(d?.recentClaims || [])
      }
      if (fraudRes.status === 'fulfilled') {
        setFraudFlags(fraudRes.value?.data?.flags || fraudRes.value?.data || [])
      }
    } catch {
      // Use mock data
    } finally {
      setLoading(false)
    }
  }

  const handleSimulate = async () => {
    setSimulating(true)
    setSimResult(null)
    try {
      const res = await simulateDisruption({ type: simType, city: simCity, severity: simSeverity })
      const data = res.data
      setSimResult(data?.result || data || null)
      toast.success(`Simulated ${simType} disruption in ${simCity} (severity ${simSeverity})`)
    } catch {
      // Demo result
      const ridersAffected = Math.floor(simSeverity * 3.5 + Math.random() * 10)
      const claimsCreated = ridersAffected
      const autoApp = Math.floor(claimsCreated * 0.7)
      const flagged = claimsCreated - autoApp
      setSimResult({
        ridersAffected,
        claimsCreated,
        autoApproved: autoApp,
        flaggedForReview: flagged,
        totalPayout: autoApp * (1500 + Math.floor(Math.random() * 2000)),
      })
      toast.success(`Simulated ${simType} disruption in ${simCity} (severity ${simSeverity}) -- demo mode`)
    } finally {
      setSimulating(false)
    }
  }

  const handleOverride = async (claimId, action) => {
    try {
      await overrideClaim(claimId, { action })
      toast.success(`Claim ${action}`)
      loadData()
    } catch {
      toast.success(`Claim ${action} -- demo mode`)
      setRecentClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c))
      )
    }
  }

  const selectClass = 'px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and disruption management</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard icon={FileText} label="Total Policies" value={stats?.totalPolicies ?? 247} />
          <StatsCard icon={ClipboardList} label="Active Claims" value={stats?.activeClaims ?? 18} />
          <StatsCard icon={IndianRupee} label="Total Payouts" value={`₹${(stats?.totalPayouts ?? 156400).toLocaleString('en-IN')}`} />
          <StatsCard icon={TrendingDown} label="Loss Ratio" value={`${stats?.lossRatio ?? 34}%`} />
          <StatsCard icon={AlertTriangle} label="Fraud Flags" value={(stats?.fraudFlags ?? fraudFlags.length) || 3} />
        </div>

        {/* Live Feed + Automation Stats */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Live Claims Feed */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                Live Claims Feed
              </h2>
              <span className="text-xs text-gray-400">Auto-refreshes every 10s</span>
            </div>
            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
              {liveFeed.map((entry) => {
                const cfg = feedStatusConfig[entry.status] || feedStatusConfig.pending
                const isNew = newFeedIds.has(entry._id)
                return (
                  <div
                    key={entry._id}
                    className={`flex items-center gap-4 px-6 py-3.5 transition-colors duration-1000 ${
                      isNew ? 'bg-emerald-50' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{entry.riderName || 'Rider'}</span>
                        <span className="text-xs text-gray-400 capitalize">{entry.type || entry.disruptionType || '--'}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(entry.timestamp || entry.createdAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">₹{(entry.amount || 0).toLocaleString('en-IN')}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
              {liveFeed.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-gray-400">No live feed data</div>
              )}
            </div>
          </div>

          {/* Automation Stats + Forecast */}
          <div className="space-y-6">
            {/* Automation Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-500" />
                Automation Stats
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Auto-Approved</span>
                    <span className="font-bold text-emerald-600">{autoApproved}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100">
                    <div className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${totalAuto ? (autoApproved / totalAuto) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Auto-Rejected</span>
                    <span className="font-bold text-red-500">{autoRejected}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100">
                    <div className="h-2.5 rounded-full bg-red-500 transition-all duration-500" style={{ width: `${totalAuto ? (autoRejected / totalAuto) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Manual Review</span>
                    <span className="font-bold text-orange-500">{manualReview}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100">
                    <div className="h-2.5 rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${totalAuto ? (manualReview / totalAuto) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400">Automation Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {totalAuto ? Math.round(((autoApproved + autoRejected) / totalAuto) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Disruption Forecast */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Next Week Forecast
              </h2>
              <div className="space-y-3">
                {mockForecast.map((f) => {
                  const Icon = f.icon
                  return (
                    <div key={f.type} className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${f.bg}`}>
                        <Icon className={`w-4 h-4 ${f.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium">{f.type}</span>
                          <span className={`font-bold ${f.probability > 50 ? 'text-red-500' : f.probability > 30 ? 'text-yellow-500' : 'text-emerald-500'}`}>{f.probability}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-100">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${f.probability > 50 ? 'bg-red-400' : f.probability > 30 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                            style={{ width: `${f.probability}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Claims over time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Claims -- Last 30 Days</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.claimsOverTime || mockClaimsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={6} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="claims" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Disruptions by type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Disruptions by Type</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.disruptionsByType || mockDisruptionsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Claim status pie */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Claim Status</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats?.claimStatusDist || mockClaimStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {(stats?.claimStatusDist || mockClaimStatus).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Disruption Simulator (enhanced) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Disruption Simulator
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Disruption Type</label>
                <select className={selectClass + ' w-full'} value={simType} onChange={(e) => setSimType(e.target.value)}>
                  {disruptionTypes.map((t) => (
                    <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">City</label>
                <select className={selectClass + ' w-full'} value={simCity} onChange={(e) => setSimCity(e.target.value)}>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Severity: <span className="font-bold text-gray-900">{simSeverity}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={simSeverity}
                onChange={(e) => setSimSeverity(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>Critical</span>
              </div>
            </div>
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-400 disabled:opacity-40 transition-colors"
            >
              {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {simulating ? 'Simulating...' : 'Simulate Disruption'}
            </button>

            {/* Simulation Results */}
            {simResult && (
              <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Automation Pipeline Results
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 mx-auto mb-2">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold">{simResult.ridersAffected}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Riders Affected</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/20 mx-auto mb-2">
                      <ClipboardList className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold">{simResult.claimsCreated}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Claims Created</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20 mx-auto mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold">{simResult.autoApproved}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Auto-Approved</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/20 mx-auto mb-2">
                      <Eye className="w-5 h-5 text-orange-400" />
                    </div>
                    <p className="text-2xl font-bold">{simResult.flaggedForReview}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Flagged for Review</p>
                  </div>
                </div>
                {simResult.totalPayout != null && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Estimated Total Payout</span>
                    <span className="text-lg font-bold text-emerald-400">₹{Number(simResult.totalPayout).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {/* Pipeline flow */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 flex-wrap">
                  <span className="px-2 py-1 rounded bg-white/5 text-blue-400">Disruption</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span className="px-2 py-1 rounded bg-white/5 text-yellow-400">{simResult.claimsCreated} Claims</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span className="px-2 py-1 rounded bg-white/5 text-emerald-400">{simResult.autoApproved} Approved</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span className="px-2 py-1 rounded bg-white/5 text-orange-400">{simResult.flaggedForReview} Flagged</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Claims Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Claims</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Rider</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">City</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(recentClaims.length > 0 ? recentClaims : [
                  { _id: '1', riderName: 'Rahul S.', disruptionType: 'rain', city: 'Mumbai', amount: 2400, status: 'pending' },
                  { _id: '2', riderName: 'Priya M.', disruptionType: 'heat', city: 'Delhi', amount: 1800, status: 'pending' },
                  { _id: '3', riderName: 'Amit K.', disruptionType: 'pollution', city: 'Delhi', amount: 3100, status: 'approved' },
                  { _id: '4', riderName: 'Sneha R.', disruptionType: 'rain', city: 'Bangalore', amount: 2000, status: 'approved' },
                  { _id: '5', riderName: 'Vikram T.', disruptionType: 'curfew', city: 'Chennai', amount: 4500, status: 'rejected' },
                ]).map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.riderName || c.riderId || '--'}</td>
                    <td className="px-6 py-3 text-gray-600 capitalize">{c.disruptionType || c.type || '--'}</td>
                    <td className="px-6 py-3 text-gray-600">{c.city || '--'}</td>
                    <td className="px-6 py-3 text-gray-900">₹{(c.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {c.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOverride(c._id, 'approve')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOverride(c._id, 'reject')}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fraud Flags */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Fraud Flags
          </h2>
          {(fraudFlags.length > 0 ? fraudFlags : [
            { _id: '1', riderName: 'Unknown Rider', reason: 'Multiple claims from same location within 1 hour', fraudScore: 0.87, claimId: 'CLM-001' },
            { _id: '2', riderName: 'Raj P.', reason: 'Claim submitted outside registered zone', fraudScore: 0.72, claimId: 'CLM-002' },
            { _id: '3', riderName: 'Meena S.', reason: 'Unusual pattern: 5 claims in 3 days', fraudScore: 0.65, claimId: 'CLM-003' },
          ]).map((flag) => (
            <div key={flag._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{flag.riderName || flag.riderId || 'Unknown'}</span>
                  <span className="text-xs text-gray-400">{flag.claimId}</span>
                </div>
                <p className="text-sm text-gray-500">{flag.reason}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Fraud Score</p>
                  <p className={`text-lg font-bold ${flag.fraudScore >= 0.7 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {(flag.fraudScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
