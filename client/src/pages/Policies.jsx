import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMyPolicies } from '../services/api'
import PolicyCard from '../components/PolicyCard'
import { ShieldCheck, Plus, Loader2 } from 'lucide-react'

export default function Policies() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPolicies()
  }, [user])

  const loadPolicies = async () => {
    if (!user?.uid) return
    setLoading(true)
    try {
      const res = await getMyPolicies(user.uid)
      setPolicies(res.data?.policies || res.data || [])
    } catch {
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }

  const activePolicies = policies.filter((p) => p.status === 'active')
  const pastPolicies = policies.filter((p) => p.status !== 'active')

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Policies</h1>
            <p className="text-gray-500 mt-1">Manage your insurance coverage</p>
          </div>
          <Link
            to="/buy-policy"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Buy New Policy
          </Link>
        </div>

        {policies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Policies Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Protect your delivery earnings against weather disruptions, pollution, and unexpected curfews.
            </p>
            <Link
              to="/buy-policy"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Get Your First Policy
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Policies */}
            {activePolicies.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Coverage</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activePolicies.map((p, i) => (
                    <PolicyCard key={p._id || i} policy={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Policy History */}
            {pastPolicies.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Policy History</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Plan</th>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Coverage</th>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Premium</th>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Period</th>
                          <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pastPolicies.map((p, i) => (
                          <tr key={p._id || i} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-medium text-gray-900 capitalize">{p.planName || p.planId || '—'}</td>
                            <td className="px-6 py-3 text-gray-600">{p.coveragePercent || p.coverage || '—'}%</td>
                            <td className="px-6 py-3 text-gray-600">₹{p.weeklyPremium || p.premium || '—'}</td>
                            <td className="px-6 py-3 text-gray-600">
                              {p.startDate ? new Date(p.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                              {' — '}
                              {p.endDate ? new Date(p.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                            </td>
                            <td className="px-6 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
