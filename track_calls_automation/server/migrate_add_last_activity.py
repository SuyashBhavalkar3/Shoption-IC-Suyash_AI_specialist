import os
import sys
# Add server to path
sys.path.append("/Users/suyash3/Desktop/Suyash/shoption_Suyash_IC/track_calls_automation/server")

from app.database import engine

def migrate():
    connection = engine.connect()
    try:
        print("Adding last_activity_timestamp column to users table...")
        from sqlalchemy import text
        connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_timestamp TIMESTAMP WITHOUT TIME ZONE;"))
        connection.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    migrate()
