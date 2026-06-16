import psycopg2

db_url = "postgresql://postgres.rtxyhcsxakkmrklxvpqd:eQk87e%25BsvK%23%2F-z@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

print("Connecting to database...")
try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("Adding organisation_id column to web_users table...")
    cur.execute("""
        ALTER TABLE web_users 
        ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL;
    """)
    conn.commit()
    print("Migration successful! Column 'organisation_id' added to 'web_users'.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error executing migration: {e}")
