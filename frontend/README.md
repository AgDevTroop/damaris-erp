# ERP Damaris

A mobile-first web-based ERP system built for a leather bag and wallet business called Damaris.

## Features

- 📊 Dashboard — real-time business summary
- 🧮 HPP Calculator — production cost calculator with automatic selling price
- 🏷️ Product Management — populated automatically from HPP calculations
- 💰 Cash Flow — income and expense tracker with real-time balance
- 🧵 Raw Material Inventory — stock monitoring with low-stock alerts
- 📦 Order Management — order tracking from placement to completion

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Frontend

Create frontend/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000

## Backend

Create backend/.env:
DATABASE_URL=postgresql://user:password@localhost:5432/erp_kulit
