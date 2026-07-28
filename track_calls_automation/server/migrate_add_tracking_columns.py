import os
import sys
from sqlalchemy import text

# Add current server directory to path to allow importing app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

def migrate():
    connection = engine.connect()
    try:
        print("Adding missing columns to the 'users' table if they do not exist...")
        
        # PostgreSQL supports ADD COLUMN IF NOT EXISTS
        queries = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_tracking_enabled BOOLEAN NOT NULL DEFAULT TRUE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_tracking_active BOOLEAN NOT NULL DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR;"
        ]
        
        for query in queries:
            print(f"Executing: {query}")
            connection.execute(text(query))
            
        connection.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    migrate()
