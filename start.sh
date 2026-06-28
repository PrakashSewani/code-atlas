#!/bin/bash

# CodeAtlas AI - Start Script (macOS/Linux)

echo "🚀 Starting CodeAtlas AI..."

# Start Backend
echo "Starting Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
# Launch uvicorn in background
uvicorn app.main:app --reload &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Both services are launching in the background."
echo "Frontend: http://localhost:5173 | Backend: http://localhost:8000"
echo "To stop both services, use: kill $BACKEND_PID $FRONTEND_PID"

# Keep script alive to maintain background processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
