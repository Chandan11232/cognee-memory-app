#!/usr/bin/env bash
set -e

echo "================================================"
echo "  Cognee Memory Hub - Startup Script"
echo "================================================"
echo ""

# --- Backend ---
echo "[1/2] Starting backend..."
cd backend

if [ ! -d "venv" ]; then
  echo "  -> Creating Python virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

if ! pip show cognee > /dev/null 2>&1; then
  echo "  -> Installing Python dependencies..."
  pip install -q -r requirements.txt
fi

if [ ! -f ".env" ]; then
  echo "  -> Copying .env.example -> .env (edit with your API keys!)"
  cp .env.example .env
  echo "  !!! WARNING: Edit backend/.env and add your API keys before using !!!"
fi

echo "  -> Starting API server on http://localhost:8000"
uvicorn app:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# --- Frontend ---
echo "[2/2] Starting frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
  echo "  -> Installing Node dependencies..."
  npm install
fi

echo "  -> Starting dev server on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "================================================"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  API Docs: http://localhost:8000/docs"
echo "================================================"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
