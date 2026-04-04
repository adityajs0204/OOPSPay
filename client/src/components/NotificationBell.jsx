import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getNotifications, markNotificationRead, markAllRead, getUnreadCount } from '../services/api'
import {
  Bell, CloudRain, FileText, CheckCircle, XCircle, Wallet, Shield, X, CheckCheck
} from 'lucide-react'

const typeConfig = {
  disruption_alert: { icon: CloudRain, color: 'text-red-500', bg: 'bg-red-50' },
  claim_created: { icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  claim_approved: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  claim_rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  payout_sent: { icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  policy_activated: { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const demoNotifications = [
  { _id: '1', type: 'disruption_alert', title: 'Heavy Rain Alert', message: 'Heavy rainfall detected in your area. Your policy is active.', createdAt: new Date(Date.now() - 120000).toISOString(), read: false },
  { _id: '2', type: 'claim_created', title: 'Claim Initiated', message: 'Auto-claim CLM-2847 created for rain disruption.', createdAt: new Date(Date.now() - 300000).toISOString(), read: false },
  { _id: '3', type: 'claim_approved', title: 'Claim Approved', message: 'Your claim CLM-2841 has been approved. Payout: Rs.2,400', createdAt: new Date(Date.now() - 3600000).toISOString(), read: false },
  { _id: '4', type: 'payout_sent', title: 'Payout Processed', message: 'Rs.2,400 transferred to your account.', createdAt: new Date(Date.now() - 7200000).toISOString(), read: true },
  { _id: '5', type: 'policy_activated', title: 'Policy Activated', message: 'Your Weekly Shield plan is now active.', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
]

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!user?.uid) return
    fetchNotifications()
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 15000)
    return () => clearInterval(interval)
  }, [user?.uid])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications(user.uid)
      const data = res.data?.notifications || res.data || []
      setNotifications(data.length > 0 ? data : demoNotifications)
    } catch {
      setNotifications(demoNotifications)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount(user.uid)
      setUnreadCount(res.data?.count ?? res.data ?? 0)
    } catch {
      setUnreadCount(demoNotifications.filter((n) => !n.read).length)
    }
  }

  const handleOpen = () => {
    setOpen(!open)
    if (!open) fetchNotifications()
  }

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
    } catch {}
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead(user.uid)
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[480px] rounded-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[400px] divide-y divide-white/5">
            {notifications.length > 0 ? notifications.map((n) => {
              const cfg = typeConfig[n.type] || typeConfig.claim_created
              const Icon = cfg.icon
              return (
                <button
                  key={n._id}
                  onClick={() => !n.read && handleMarkRead(n._id)}
                  className={`w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-white/5 transition-colors ${
                    !n.read ? 'bg-white/[0.02]' : ''
                  }`}
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${cfg.bg} shrink-0 mt-0.5`}>
                    <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              )
            }) : (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
