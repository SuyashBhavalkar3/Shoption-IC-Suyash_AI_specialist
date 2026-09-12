# Analytics Platform MVP

A lightweight full-stack analytics platform for tracking user events and visualizing funnel conversion.

## What’s included

- FastAPI backend with SQLAlchemy and PostgreSQL
- Pydantic request/response validation
- Alembic migrations and sample seed data
- React + Vite + TypeScript dashboard
- Tailwind CSS styling and Recharts funnel visualization
- Standalone browser SDK for client-side event tracking

## Project structure

- `backend/` FastAPI API, models, services, Alembic migrations
- `frontend/` dashboard app
- `sdk/` standalone JavaScript analytics SDK
- `docs/` API, tracking plan, and architecture notes

## Local setup

### 1. Start PostgreSQL

Use the included Docker Compose file or your own local PostgreSQL instance.

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m app.utils.seed
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### 4. SDK usage

```html
<script type="module">
  import Analytics from './sdk/src/analytics.js';

  Analytics.init({
    apiKey: 'pk_live_bcd39b8924457c7be39983e0117dd57f',
    endpoint: 'http://localhost:8000',
  });

  Analytics.track('product_view', { product_id: 'P001' });
</script>
```

## API highlights

- `POST /api/events/track`
- `GET /api/events`
- `GET /api/analytics/funnel`
- `GET /api/analytics/overview`

## Notes

- The backend auto-creates tables on startup for local development.
- Use Alembic for controlled schema changes.
- The SDK stores an anonymous ID in `localStorage` and fails closed on network errors.
