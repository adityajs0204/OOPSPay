import { Link } from 'react-router-dom'
import {
  Shield, Zap, Eye, CreditCard, CloudRain, Thermometer, Wind, AlertTriangle,
  ArrowRight, CheckCircle, ChevronRight
} from 'lucide-react'

const features = [
  {
    icon: Eye,
    title: 'Real-Time Monitoring',
    desc: 'We track weather, air quality, and city conditions 24/7 so you never have to file a claim manually.',
  },
  {
    icon: Zap,
    title: 'Zero-Touch Claims',
    desc: 'When conditions trigger your policy, we validate automatically with multi-source verification.',
  },
  {
    icon: CreditCard,
    title: 'Instant Payouts',
    desc: 'Approved claims are paid to your account within minutes. No paperwork, no waiting.',
  },
]

const steps = [
  { num: '01', title: 'Purchase a Plan', desc: 'Choose from flexible weekly plans starting at just ₹49.' },
  { num: '02', title: 'We Monitor', desc: 'Our AI watches weather, pollution, and disruption feeds for your city and zone.' },
  { num: '03', title: 'Disruption Detected', desc: 'When conditions breach your policy thresholds, a claim is auto-initiated.' },
  { num: '04', title: 'Get Paid', desc: 'After multi-source validation, payouts hit your account — no action needed.' },
]

const disruptions = [
  { icon: CloudRain, label: 'Heavy Rain', desc: 'Coverage when rainfall exceeds safe delivery thresholds' },
  { icon: Thermometer, label: 'Extreme Heat', desc: 'Protection during dangerous heat wave conditions' },
  { icon: Wind, label: 'Air Pollution', desc: 'Compensation when AQI levels make outdoor work hazardous' },
  { icon: AlertTriangle, label: 'City Curfew', desc: 'Income protection during unexpected shutdowns and curfews' },
]

export default function Landing() {
  return (
    <div className="bg-[#0f172a] text-white min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-32 sm:pb-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              AI-Powered Parametric Insurance
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Income Protection for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                Delivery Partners
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
              When rain, heat, pollution, or curfews disrupt your earnings, Earnly automatically detects it and pays you — zero claims to file, zero paperwork.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 text-white font-semibold text-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25"
              >
                Get Protected Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-gray-300 font-semibold text-lg hover:bg-white/5 transition-colors"
              >
                Demo Login
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Plans from ₹49/week</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Automated payouts</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No paperwork</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 bg-[#0b1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Why Delivery Partners Trust Earnly</h2>
            <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
              Built specifically for gig workers who depend on daily earnings and can not afford unpredictable income loss.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 hover:bg-white/[0.07] transition-all group">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 text-emerald-400 mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-gray-400 text-lg">Four simple steps to income protection</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full">
                  <span className="text-5xl font-extrabold text-emerald-500/20">{s.num}</span>
                  <h3 className="text-lg font-bold mt-4 mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-emerald-500/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disruption types */}
      <section className="py-24 bg-[#0b1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Disruptions We Cover</h2>
            <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
              Our AI monitors real-time data sources to detect these income-threatening conditions
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {disruptions.map((d) => (
              <div key={d.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto mb-4">
                  <d.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-2">{d.label}</h3>
                <p className="text-gray-400 text-sm">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Protect Your Earnings?</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of delivery partners who never worry about weather disrupting their income.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-emerald-500 text-white font-semibold text-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/25"
          >
            Start Your Protection
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="font-bold">Earnly</span>
          </div>
          <p className="text-sm text-gray-500">Parametric insurance for the gig economy. Built with AI.</p>
        </div>
      </footer>
    </div>
  )
}
