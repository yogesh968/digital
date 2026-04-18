# Golf Charity Platform

A full-stack subscription platform where Stableford golf scores enter players into monthly prize draws while funding their chosen charity.

**GitHub:** [yogesh968](https://github.com/yogesh968)

## Stack
- **Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Stripe
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Zustand

## Getting Started

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run both services
cd backend && npm run dev   # API on :3000
cd frontend && npm run dev  # UI on :5173
```

## Environment

Copy `backend/.env.example` to `backend/.env` and fill in:
```
MONGODB_URI=mongodb://localhost:27017/golf_charity
PORT=3000
JWT_SECRET=<your_secret>
STRIPE_SECRET_KEY=<your_stripe_key>
```
