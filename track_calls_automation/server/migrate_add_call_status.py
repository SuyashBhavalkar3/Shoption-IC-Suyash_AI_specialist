import sys
import os

# Add server to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine


def migrate():
    connection = engine.connect()
    try:
        print("Adding call_status column to call_logs table...")
        connection.execute(text("""
            ALTER TABLE call_logs
            ADD COLUMN IF NOT EXISTS call_status VARCHAR(20) NOT NULL DEFAULT 'Answered';
        """))
        connection.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Migration failed: {e}")
        connection.rollback()
    finally:
        connection.close()


if __name__ == "__main__":
    migrate()
