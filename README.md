# SmartConstruct AI — Construction Delay Prediction & Risk Management

A production-quality AI-powered SaaS platform that analyzes 19 construction features, predicts delay probability and risk score, identifies key risk factors, and provides actionable recommendations.

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | React 18, React Router v6, Recharts, Lucide, Plain CSS |
| Backend     | Node.js, Express.js, JWT, bcrypt, Mongoose      |
| Database    | MongoDB                                         |
| ML Service  | Python, Flask, scikit-learn, XGBoost, joblib    |

---

## Prerequisites

Install these before running:

1. **Node.js v18+** — https://nodejs.org/  
2. **MongoDB** — https://www.mongodb.com/try/download/community (or use MongoDB Atlas)  
3. **Python 3.9+** — https://www.python.org/downloads/  

---

## Installation & Startup

### Step 1 — Install Server Dependencies

```bash
cd smartconstruct/server
npm install
```

### Step 2 — Configure Server Environment

The `.env` file is already created. Edit `server/.env` and set your values:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartconstruct
JWT_SECRET=smartconstruct_jwt_secret_2026_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
ML_SERVICE_URL=http://localhost:8000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
NODE_ENV=development
```

> For email: use a Gmail App Password (not your main password). Forgot-password emails require a working email config. The rest of the app works without it.

### Step 3 — Install Frontend Dependencies

```bash
cd smartconstruct/client
npm install
```

### Step 4 — Set Up Python ML Service

```bash
cd smartconstruct/ml-service
pip install -r requirements.txt
```

> Or use a virtual environment:
> ```bash
> python -m venv venv
> venv\Scripts\activate        # Windows
> pip install -r requirements.txt
> ```

### Step 5 — Train the ML Model

```bash
cd smartconstruct/ml-service
python training/train.py
```

This generates `artifacts/model.pkl`, `artifacts/scaler.pkl`, and `artifacts/model_meta.json`.

> Expected output: ~5000 samples, 4 models evaluated, best model saved.  
> Takes ~30–60 seconds.

---

## Running the Application

Open **3 terminal windows**:

### Terminal 1 — MongoDB

```bash
mongod
```

Or if using MongoDB Atlas, make sure your cluster is running and update `MONGO_URI` in `.env`.

### Terminal 2 — Backend API (Port 5000)

```bash
cd smartconstruct/server
npm run dev
```

Expected: `MongoDB Connected: localhost` + `SmartConstruct API running on port 5000`

### Terminal 3 — Python ML Service (Port 8000)

```bash
cd smartconstruct/ml-service
python app.py
```

Expected: `SmartConstruct ML Service running on port 8000`

### Terminal 4 — React Frontend (Port 3000)

```bash
cd smartconstruct/client
npm run dev
```

Expected: `VITE v5.x.x  ready in xxx ms` → `http://localhost:3000/`

---

## Access

| URL                        | Description           |
|----------------------------|-----------------------|
| http://localhost:3000/     | Landing page          |
| http://localhost:3000/register | Create account    |
| http://localhost:3000/login    | Sign in           |
| http://localhost:3000/dashboard | Main dashboard   |
| http://localhost:5000/api/health | API health check |
| http://localhost:8000/health    | ML service health |

---

## First Use Walkthrough

1. **Register** — Go to `/register`, create an account
2. **Login** — Sign in at `/login`  
3. **Create a Project** — Go to Projects → New Project
4. **Run a Prediction** — Go to New Prediction, fill in the 19 features or click a **Quick Demo** button
5. **View Results** — See delay probability, predicted risk score, risk factors, and recommendations
6. **View History** — Prediction History shows all past analyses
7. **Analytics** — Charts and trend analysis across all predictions
8. **Reports** — View and print full prediction reports

---

## Architecture

```
React (port 3000)
       ↓  /api proxy
Node.js/Express (port 5000)
       ↓  HTTP POST /predict
Python/Flask ML Service (port 8000)
       ↓
scikit-learn model (Random Forest / XGBoost)
       ↓
Prediction result
       ↓
Express saves to MongoDB
       ↓
React displays results
```

---

## ML Service Fallback

If the ML service is **not running**, the Node.js backend automatically falls back to a **mock prediction** engine. Mock predictions are clearly labeled with a warning banner:  
`⚠ Demo mode — ML service unavailable`

This allows you to use the full UI without Python running.

---

## Project Structure

```
smartconstruct/
├── client/          React frontend
├── server/          Node.js/Express backend  
└── ml-service/      Python ML service
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoDB connection error` | Ensure `mongod` is running, check `MONGO_URI` in `.env` |
| `ML service unavailable` | App runs in mock mode — start `python app.py` to use real ML |
| `Port 3000 in use` | Change `server.port` in `vite.config.js` |
| `Port 5000 in use` | Change `PORT` in `server/.env` |
| `npm not recognized` | Install Node.js from https://nodejs.org/ |
| `python not recognized` | Install Python from https://python.org/ |
| `model.pkl not found` | Run `python training/train.py` in `ml-service/` |
| JWT errors after restart | Clear browser localStorage and log in again |

---

## Security Notes

- Never commit `.env` to version control
- Change `JWT_SECRET` to a long random string in production
- Use environment variables for all secrets
- The app uses bcrypt (cost 12) for password hashing
- Rate limiting is applied to auth endpoints (20 req/15min)
