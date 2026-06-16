from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, users, calls, org_employees, web_auth, webhooks

# Create database tables automatically if not already present
# (In production with existing tables, SQLAlchemy skips creating existing tables safely)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Shoption Call Tracker Backend",
    description="Role-based call tracker service for Warriors, Group Leaders, and Admins.",
    version="1.0.0"
)

# CORS middleware for mobile client communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(calls.router)
app.include_router(org_employees.router)
app.include_router(web_auth.router)
app.include_router(webhooks.router)

@app.get("/")
def read_root():
    return {"status": "online", "service": "Shoption Call Tracker Backend"}
