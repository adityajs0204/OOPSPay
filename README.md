<div align="center">

# 🛡️ GigShield

### AI-Powered Income Protection for Delivery Partners

[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)](/)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Python-blue?style=for-the-badge)](/)
[![Database](https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](/)

> **"An AI-powered parametric insurance platform that automatically compensates delivery partners for income loss caused by real-world disruptions — using real-time data and intelligent validation."**

</div>

---

## 📌 The Problem

Food delivery partners earn entirely based on deliveries completed — no fixed salary, no safety net. Real-world conditions can wipe out their income overnight.

<table>
<tr>
<td width="50%">

### 🌧️ Environmental Factors
- Heavy rainfall → reduced visibility
- Flooding → blocked roads
- Extreme heat → limited working hours
- High pollution → unsafe conditions

</td>
<td width="50%">

### 🚫 Administrative Restrictions
- City-wide curfews
- Zone closures
- Emergency situations
- Protest blockades

</td>
</tr>
</table>

**Result:** Reduced orders → Increased delivery time → **Direct income loss**

❗ *No system currently exists to automatically compensate for these losses.*

---

## 💡 Our Solution

GigShield is an **AI-powered parametric insurance system** that:

| Step | Action |
|------|--------|
| 1️⃣ | Detects real-world disruptions via live data feeds |
| 2️⃣ | Validates authenticity across multiple trusted sources |
| 3️⃣ | Verifies actual impact on individual rider activity |
| 4️⃣ | **Automatically triggers payouts** — zero manual claims |

✅ No paperwork &nbsp;&nbsp; ✅ No delays &nbsp;&nbsp; ✅ Fully automated

---

## ⚡ Disruption Detection Rules

| Disruption Type | Trigger Condition |
|---|---|
| 🌧️ **Heavy Rainfall** | Rainfall ≥ 50 mm/hr for ≥ 2 hours |
| 🌊 **Flooding** | Flood alert active OR traffic speed < 30% of normal |
| 🌡️ **Extreme Heat** | Temperature ≥ 42°C for ≥ 3 hours |
| 💨 **Air Pollution** | AQI ≥ 300 for ≥ 4 hours |
| 🚷 **Curfew / Emergency** | Government-issued alerts active |

---

## 🏗️ System Architecture

GigShield is built on a **microservices + event-driven** architecture using Redis queues, RabbitMQ, and Pub/Sub messaging to ensure high throughput and zero-downtime payouts.

```
╔══════════════════════════════════════════════════════════════════════════╗
║                       CORE SERVICE PIPELINE                             ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   ┌──────────┐    ┌─────────────────────┐  [Redis Queue]                ║
║   │   Auth   │───▶│   Policy Service    │══════════════▶┐               ║
║   │ Service  │    │  (Plans/Billings/   │               │               ║
║   └──────────┘    │       Data)         │               ▼               ║
║                   └─────────────────────┘    ┌──────────────────┐      ║
║                                              │  Payment Service │      ║
║   ┌───────────────────┐                      │    (PayPal)      │      ║
║   │  Admin Dashboard  │                      └────────┬─────────┘      ║
║   │  (Manual Checks)  │◀─────────────────────────────┤                 ║
║   └───────────────────┘                               │                ║
║                                              ┌────────▼─────────┐      ║
║                                              │  Notification    │      ║
║                                              │    Service       │      ║
║                                              └────────┬─────────┘      ║
║                                                       │                ║
║                                              ┌────────▼─────────┐      ║
║                                              │ Address Polling  │      ║
║                                              │    Service       │      ║
║                                              └──────────────────┘      ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║                    ML MODELS & MESSAGE BROKER                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   ┌──────────────────────────────────┐  ┌──────────────────────────┐   ║
║   │           ML Models              │  │       RabbitMQ           │   ║
║   │  ┌────────────┐ ┌─────────────┐ │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   ║
║   │  │  News API  │ │ Weather API │ │  │ ▓ Message Queue Broker  ▓ │   ║
║   │  └────────────┘ └─────────────┘ │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │   ║
║   └──────────────────────────────────┘  └──────────────────────────┘   ║
║                                                       │                 ║
║   [Redis Cache] ◀─────────────────────────────────────┘                 ║
║   (Hot Data / Session / Rate Limits)                                    ║
╚══════════════════════════════════════════════════════════════════════════╝

```

### 📡 Service Communication Summary

| Component | Role |
|---|---|
| **Auth Service** | JWT-based authentication, session management |
| **Policy Service** | Plans, billing, and user data management |
| **Payment Service** | PayPal-powered payout execution |
| **Notification Service** | Rider alerts and status updates |
| **Address Polling Service** | Real-time location & GPS validation |
| **Admin Dashboard** | Manual review and override for edge cases |
| **Redis Queue** | High-speed inbound event buffering |
| **Redis Cache** | Hot data caching, session store, rate limiting |
| **RabbitMQ** | Reliable async message broker across services |
| **ML Models** | Disruption validation via News API & Weather API |

---

## 🤖 Decision Engine

| Signal | Weight |
|---|---|
| Disruption Validity | 🔴 High |
| Activity Impact | 🔴 High |
| Movement Consistency | 🟡 Medium |
| Network Reliability | 🟡 Medium |

**Outcomes:**
- 🟢 **High Score** → Payout triggered immediately
- 🟡 **Medium Score** → Flagged for additional verification
- 🔴 **Low Score** → Claim rejected

---

## 🛡️ Adversarial Defense — GPS Spoofing

| Technique | What it catches |
|---|---|
| 🏃 Movement Analysis | Unrealistic location jumps |
| 📦 Activity Verification | Movement with zero deliveries |
| 👥 Group Detection | Coordinated mass fraud patterns |

---

## 🧰 Tech Stack

<table>
<tr>
<td><b>🎨 Frontend</b></td>
<td>React (Vite), Tailwind CSS</td>
</tr>
<tr>
<td><b>⚙️ Backend</b></td>
<td>Node.js, Express.js</td>
</tr>
<tr>
<td><b>🤖 AI / ML</b></td>
<td>Python, Scikit-learn, Pandas</td>
</tr>
<tr>
<td><b>🗄️ Database</b></td>
<td>Firebase (Firestore + Realtime DB)</td>
</tr>
<tr>
<td><b>⚡ Queue & Events</b></td>
<td>Redis (caching + queues), RabbitMQ</td>
</tr>
<tr>
<td><b>🌍 External APIs</b></td>
<td>OpenWeatherMap, AQI APIs, News APIs</td>
</tr>
<tr>
<td><b>💳 Payments</b></td>
<td>Razorpay (Test Mode)</td>
</tr>
<tr>
<td><b>🔐 Auth</b></td>
<td>Firebase Auth + JWT</td>
</tr>
</table>

---

## 🔄 How It Works — End to End

```
User purchases weekly policy
        ↓
System monitors environment in real-time
        ↓
Disruption detected
        ↓
Multi-source validation (≥ 2/3 sources must agree)
        ↓
Activity impact verified (< 70% normal deliveries)
        ↓
Fraud checks executed
        ↓
Decision engine evaluates all signals
        ↓
💸 Automatic payout triggered
```

---

## 🎯 Key Features

| Feature | Description |
|---|---|
| ⚡ Zero-Claim Payouts | Fully automated — riders never need to file a claim |
| 📡 Real-Time Monitoring | Continuous data streams from weather, traffic, and news |
| 🤖 AI Risk Assessment | ML models for fraud detection and income estimation |
| 🔒 Fraud-Resistant | Multi-layer validation and GPS anomaly detection |
| 📅 Subscription Model | Simple weekly policy for gig workers |
| 📈 Scalable | Event-driven architecture built for high throughput |

---

## ⚠️ Edge Case Handling

| Scenario | How It's Handled |
|---|---|
| Bad/missing data | Multi-source validation + backup APIs + caching |
| No actual impact | Activity threshold check (≥ 70% normal = no payout) |
| Short disruptions | Minimum duration filters per disruption type |
| Duplicate events | Unique event IDs + policy time validation |
| Fraudulent claims | Historical behavior analysis + anomaly detection |

---

<div align="center">

## 🏁 Conclusion

GigShield provides a **fair, automated, and scalable** safety net for gig economy workers.

By combining real-time data intelligence with AI-driven validation, it ensures that delivery partners are compensated quickly and accurately — **without lifting a finger.**

---

*Built with ❤️ to protect the backbone of the gig economy.*

</div>