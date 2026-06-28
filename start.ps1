# CodeAtlas AI - Start Script

Write-Host "🚀 Starting CodeAtlas AI..." -ForegroundColor Cyan

# Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (!(Test-Path venv)) { python -m venv venv }; .\venv\Scripts\activate; pip install -r requirements.txt; uvicorn app.main:app --reload" -WindowStyle Normal

# Start Frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm run dev" -WindowStyle Normal

Write-Host "✅ Both services are launching in new windows." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173 | Backend: http://localhost:8000" -ForegroundColor Yellow
