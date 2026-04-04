import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Menu, X, LogOut, User, LayoutDashboard, FileText, ClipboardList, Settings, Activity } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    setMobileOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const navLink = (to, label, icon) => {
    const Icon = icon
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive(to)
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500 group-hover:bg-emerald-400 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Earnly</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {user && (
              <>
                {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
                {navLink('/policies', 'Policies', FileText)}
                {navLink('/claims', 'Claims', ClipboardList)}
                {navLink('/risk-profile', 'Risk', Activity)}
                {user.role === 'admin' && navLink('/admin', 'Admin', Settings)}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-gray-200">{user.name || user.email || 'Rider'}</span>
                </div>
                <NotificationBell />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0f172a] px-4 pb-4 pt-2 space-y-1">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-gray-200">{user.name || user.email || 'Rider'}</span>
              </div>
              {navLink('/dashboard', 'Dashboard', LayoutDashboard)}
              {navLink('/policies', 'Policies', FileText)}
              {navLink('/claims', 'Claims', ClipboardList)}
              {navLink('/risk-profile', 'Risk', Activity)}
              {user.role === 'admin' && navLink('/admin', 'Admin', Settings)}
              <div className="px-3 py-2"><NotificationBell /></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 transition-colors text-center"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
