# 🚀 GigShield: AI-Powered Income Protection for Delivery Partners

## 📌 Problem Overview

Food delivery partners depend entirely on their ability to move across the city and complete deliveries. Their income is not fixed and varies based on the number of deliveries completed.

In real-world conditions, external factors significantly impact their ability to work. These factors either:

- Reduce the number of available orders  
- Make travel difficult or unsafe  

As a result, delivery partners experience income loss despite being willing to work.

---

## 🌍 1. Key Challenges

### 1.1 Environmental Factors

Environmental conditions directly affect outdoor work:

- Heavy rainfall → reduced visibility and safety  
- Flooding → blocked roads  
- Extreme heat → limited working hours  
- High pollution → unsafe conditions  

These factors slow down or completely stop deliveries.

---

### 1.2 Administrative & External Restrictions

- Curfews  
- Zone closures  
- Emergency situations  

These restrict movement and prevent delivery operations.

---

### 1.3 Resulting Impact

- Reduced number of orders  
- Increased delivery time  
- Decreased working hours  

➡️ Leads to direct income loss  

❗ **Current Gap:** No system exists to automatically compensate this loss.

---

## 💡 2. Solution Approach

We propose an **AI-powered parametric insurance system** that:

1. Detects external disruptions  
2. Validates their authenticity  
3. Verifies actual impact on rider activity  
4. Automatically triggers payouts  

✔ No manual claims required  
✔ Fully automated decision-making  

---

## ⚡ 3. Disruption Detection

### 3.1 Rainfall Conditions
- Rainfall ≥ 50 mm/hour  
- Duration ≥ 2 hours  

➡️ Mark as disruption  

---

### 3.2 Flooding & Waterlogging
- Flood alert active  
OR  
- Traffic speed < 30% of normal  

➡️ Mark as disruption  

---

### 3.3 Extreme Heat
- Temperature ≥ 42°C  
- Duration ≥ 3 hours  

➡️ Mark as disruption  

---

### 3.4 Pollution
- AQI ≥ 300  
- Duration ≥ 4 hours  

➡️ Mark as disruption  

---

### 3.5 Restrictions
- Curfews / emergency alerts  

➡️ Mark as disruption  

---

## 🏗️ 4. System Architecture

### 4.1 Data Collection
Collects:
- Weather data  
- Pollution data  
- Traffic data  
- News alerts  
- Delivery activity  

---

### 4.2 Trigger Detection
- Checks disruption conditions  
- Generates potential events  

---

### 4.3 Multi-Source Validation

Process:
- Collect data from 3 sources  
- Convert to TRUE/FALSE  
- If ≥ 2 sources agree → Accept  

✔ Reduces false positives  

---

### 4.4 Activity Validation

Condition:
- If deliveries ≥ 70% of normal → No payout  
- Else → Income affected  

✔ Ensures real loss  

---

### 4.5 Fraud Detection
- Validates user behavior  
- Detects anomalies  

---

### 4.6 Decision Engine
Combines all signals for final decision.

---

## ⚠️ 5. Edge Case Handling

### Data Issues
- Multi-source validation  
- Zone-based validation  
- Backup APIs & caching  

---

### No Impact Cases
- Normal activity → no payout  
- Short disruptions → ignored  

---

### System Issues
- Unique event IDs → prevent duplicates  
- Policy time validation  

---

### Fraud Cases
- Historical behavior checks  
- Activity validation  

---

## 🛡️ 6. Adversarial Defense (GPS Spoofing)

### Detection Techniques:

#### Movement Analysis
- Detect unrealistic jumps  

#### Activity Verification
- No deliveries + movement → suspicious  

#### Group Detection
- Identify coordinated fraud  

---

## 🧠 7. Decision Engine

### Signals Used:

| Signal | Importance |
|------|-----------|
| Disruption Validity | High |
| Activity Impact | High |
| Movement Consistency | Medium |
| Network Reliability | Medium |

---

### Final Decision:
- High score → Payout  
- Medium → Delay & verify  
- Low → Reject  

---

## 🤖 8. Machine Learning Usage

- Income estimation  
- Fraud detection  
- Pattern recognition  
- Group anomaly detection  

---

## 🧰 9. Tech Stack

### 🎨 Frontend
- React (Vite)
- Tailwind CSS

---

### ⚙️ Backend
- Node.js
- Express.js

---

### 🧠 AI/ML Layer
- Python
- Scikit-learn
- Pandas

---

### 🗄️ Database
- MongoDB (Atlas)

---

### ⚡ Queue & Event System
- Redis (caching + queues)
- RabbitMQ (event-driven system)

---

### 🌍 APIs
- Weather API (OpenWeatherMap)
- AQI APIs (optional)
- News APIs (optional)

---

### 💳 Payment
- Razorpay (Test Mode) / Mock System

---

### 🔐 Authentication
- JWT
- bcrypt

---

## 🔄 10. System Flow

1. User purchases weekly policy  
2. System continuously monitors environment  
3. Disruption detected  
4. Multi-source validation applied  
5. Activity impact verified  
6. Fraud checks executed  
7. Decision engine evaluates  
8. Automatic payout triggered  

---

## 🎯 11. Key Features

✔ Fully automated claims  
✔ Real-time disruption detection  
✔ AI-based risk assessment  
✔ Fraud-resistant system  
✔ Weekly subscription model  
✔ Scalable architecture  

---

## 🏁 12. Conclusion

This system provides a **fair, automated, and scalable solution** to protect gig workers’ income.

It ensures:

- Accurate disruption detection  
- Verified income impact  
- Fraud prevention  
- Real-world applicability  

---

## 💥 One-Line Pitch

**“An AI-powered parametric insurance platform that automatically compensates delivery partners for income loss caused by real-world disruptions using real-time data and intelligent validation.”**

---