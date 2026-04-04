import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Policies from './pages/Policies'
import BuyPolicy from './pages/BuyPolicy'
import Claims from './pages/Claims'
import AdminDashboard from './pages/AdminDashboard'
import RiskProfile from './pages/RiskProfile'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/buy-policy" element={<BuyPolicy />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/risk-profile" element={<RiskProfile />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#0f172a',
              color: '#fff',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
