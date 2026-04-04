import { CloudRain, Thermometer, Wind, AlertTriangle, Droplets, ShieldAlert } from 'lucide-react'

const typeConfig = {
  rain: { icon: CloudRain, label: 'Heavy Rain', color: 'bg-blue-100 text-blue-700' },
  flood: { icon: Droplets, label: 'Flood', color: 'bg-indigo-100 text-indigo-700' },
  heat: { icon: Thermometer, label: 'Extreme Heat', color: 'bg-orange-100 text-orange-700' },
  pollution: { icon: Wind, label: 'High Pollution', color: 'bg-gray-200 text-gray-700' },
  curfew: { icon: AlertTriangle, label: 'Curfew / Shutdown', color: 'bg-red-100 text-red-700' },
}

const severityColors = {
  low: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
}

function getSeverityLabel(score) {
  if (score >= 8) return 'critical'
  if (score >= 6) return 'high'
  if (score >= 4) return 'moderate'
  return 'low'
}

export default function DisruptionCard({ disruption }) {
  const type = disruption.type?.toLowerCase() || 'rain'
  const config = typeConfig[type] || { icon: ShieldAlert, label: type, color: 'bg-gray-100 text-gray-700' }
  const Icon = config.icon
  const severity = disruption.severity || 5
  const sevLabel = getSeverityLabel(severity)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`flex items-center justify-center w-11 h-11 rounded-lg ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{config.label}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[sevLabel]}`}>
              Severity {severity}/10
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{disruption.city || 'Unknown city'}</p>
          {disruption.duration && (
            <p className="text-xs text-gray-400 mt-1">Duration: {disruption.duration}</p>
          )}
          {disruption.confidence != null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Confidence</span>
                <span>{Math.round(disruption.confidence * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${disruption.confidence * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
