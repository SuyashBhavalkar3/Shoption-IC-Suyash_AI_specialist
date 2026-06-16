import psycopg2

db_url = "postgresql://postgres.rtxyhcsxakkmrklxvpqd:eQk87e%25BsvK%23%2F-z@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

print("Connecting to database...")
try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    print("Creating web_users table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS web_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT now()
        );
    """)

    print("Creating webhook_subscriptions table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS webhook_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            web_user_id UUID NOT NULL REFERENCES web_users(id) ON DELETE CASCADE,
            target_url VARCHAR(2048) NOT NULL,
            secret_token VARCHAR(255) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT now(),
            CONSTRAINT uq_web_user_webhook UNIQUE (web_user_id)
        );
    """)

    print("Creating webhook_logs table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS webhook_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
            event_type VARCHAR(50) NOT NULL,
            payload JSONB NOT NULL,
            response_status INTEGER,
            response_body TEXT,
            attempt_number INTEGER NOT NULL DEFAULT 1,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT now()
        );
    """)

    conn.commit()
    print("Migration successful! Tables 'web_users', 'webhook_subscriptions', and 'webhook_logs' created/verified.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error executing migration: {e}")
