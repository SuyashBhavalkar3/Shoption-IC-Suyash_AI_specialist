from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

db_url = os.getenv("DATABASE_URL")

# Optimized production connection pool configuration
engine = create_engine(
    db_url,
    pool_size=15,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=600,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()