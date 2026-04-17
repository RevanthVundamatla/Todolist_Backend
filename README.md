# 🚀 Todo App Backend

Production-ready Todo List API with **JWT Auth**, **Redis Caching**, **Razorpay Premium**.

## ✨ Features
- 🔐 JWT Authentication + Google OAuth ready
- 📝 Todo CRUD with Redis caching & MongoDB indexes
- 💳 Razorpay Premium (₹499/month - 30 days)
- ⚡ Auto-scaling ready (Kubernetes)
- 🐳 Dockerized microservices
- 📊 Rate limiting + Security headers

## 🛠 Quick Start

### Local Development
```bash
# Clone & Install
git clone <repo> todo-backend
cd todo-backend
npm install

# Start with Docker (Redis + Backend)
docker-compose up -d

# Or manually
docker run -d -p 6379:6379 redis:alpine
npm run dev