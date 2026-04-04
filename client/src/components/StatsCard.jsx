import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatsCard({ icon: Icon, label, value, trend, trendValue, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}
