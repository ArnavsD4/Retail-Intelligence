# Retail Intelligence frontend

React + Vite + Tailwind + Recharts + Lucide. Talks only to the FastAPI backend (no secrets in the browser).

## Run (Windows PowerShell)

Terminal 1, from the project root (start your backend the way you normally do), e.g.:

    uvicorn api:app --reload

Terminal 2:

    cd frontend
    npm install
    Copy-Item .env.example .env   # optional; defaults to http://127.0.0.1:8000
    npm run dev

Open http://localhost:5173

## CORS (required)

api.py has no CORS middleware, so the browser will block requests from :5173. Add this to api.py after `app = FastAPI(...)`:

    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

## Notes
- Forecast output is weekly sales revenue in USD, never units.
- Inventory inputs are physical units and are never auto-filled from the revenue forecast.
- Historical sales chart is an empty state: no endpoint exposes data/raw/train.csv.
- Activity history is session-only (resets on reload).
