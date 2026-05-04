# 🏠 SmartReach — AI-Powered Real Estate CRM

SmartReach is a premium SaaS platform designed for real estate agents and agencies to manage their leads with artificial intelligence. From automated lead scoring to AI-generated follow-up replies, SmartReach helps you close deals faster.

![Aesthetic Dashboard Preview](https://images.unsplash.com/photo-1460472178825-e5240623abe5?auto=format&fit=crop&q=80&w=2000)

## ✨ Key Features

- **🤖 AI Lead Extraction:** Paste raw text or emails and let AI automatically extract name, budget, property type, and intent.
- **🔥 Smart Lead Scoring:** Automatically categorize leads as Hot, Warm, or Cold based on AI analysis.
- **💬 AI-Generated Replies:** Generate professional, context-aware WhatsApp and Email replies in seconds.
- **💳 Multi-Payment SaaS:** Integrated subscription management with **Razorpay**, **PayPal**, and **Stripe**.
- **📊 Admin Dashboard:** Real-time stats and dynamic plan management (Update prices and limits instantly).
- **🔔 Real-time Notifications:** Socket.IO powered reminders for follow-ups and task completions.
- **🎨 Premium UI:** Stunning glassmorphism design with fluid animations and dark mode.

## 🛠 Tech Stack

- **Frontend:** React.js, Vite, Framer Motion, Lucide React, Recharts.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.IO.
- **AI Integration:** OpenRouter (Llama 3 / Gemini), Together AI.
- **Payments:** Razorpay, PayPal SDK, Stripe API.
- **Security:** JWT Authentication, Helmet, Rate Limiting, CORS.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/smartreach.git
cd smartreach
```

### 2. Setup Backend
```bash
cd backend
npm install
# Create .env file based on the guide in deployment_guide.md
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
# Create .env file (VITE_API_URL=http://localhost:5000/api)
npm run dev
```

### 4. Setup AI Service (Optional)
```bash
cd ../ai-service
pip install -r requirements.txt
python main.py
```

## 📖 Deployment

For detailed production deployment instructions (Vercel & Render), see **[deployment_guide.md](deployment_guide.md)**.

## 📄 License

This project is licensed under the MIT License.
