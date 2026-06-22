import os
import psycopg2


SUPABASE_URL = os.getenv(
    "SUPABASE_DATABASE_URL"
)
AZURE_URL = os.getenv(
    "AZURE_DATABASE_URL"
)


ALTER_SQL = """
ALTER TABLE call_logs
ADD COLUMN IF NOT EXISTS call_status VARCHAR(20) NOT NULL DEFAULT 'Answered';
"""


def apply_migration(db_url: str, label: str):
    conn = None
    try:
        print(f"Connecting to {label}...")
        conn = psycopg2.connect(db_url)
        conn.autocommit = False

        with conn.cursor() as cur:
            print(f"Applying migration on {label}...")
            cur.execute(ALTER_SQL)

        conn.commit()
        print(f"{label}: migration successful.")
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"{label}: migration failed: {e}")
    finally:
        if conn:
            conn.close()


def main():
    apply_migration(SUPABASE_URL, "Supabase")
    apply_migration(AZURE_URL, "Azure")


if __name__ == "__main__":
    main()
