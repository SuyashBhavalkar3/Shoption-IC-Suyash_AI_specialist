import sys
import os
import psycopg2
import json
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine

# Add server directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# MUST import models so they are registered on Base.metadata
from app import models
from app.database import Base, engine as azure_engine

# Connection Strings
SUPABASE_URL = "postgresql://postgres.rtxyhcsxakkmrklxvpqd:eQk87e%25BsvK%23%2F-z@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
AZURE_URL = "postgresql://shoptionadmin:DB%402026%21@shoption-call-trackdb.postgres.database.azure.com:5432/calltracking_testing?sslmode=require"

def run_migration():
    print("--- STEP 1: Recreating database tables on Azure via SQLAlchemy ---")
    try:
        # Drop all tables first to ensure fresh matching schema without any stale columns/rows
        Base.metadata.drop_all(bind=azure_engine)
        print("Dropped existing tables on Azure database.")
        
        # Create all tables on Azure
        Base.metadata.create_all(bind=azure_engine)
        print("SQLAlchemy tables recreated on Azure database successfully.")
    except Exception as e:
        print(f"Error recreating tables on Azure: {e}")
        return

    print("\n--- STEP 2: Establishing connections to source (Supabase) and target (Azure) ---")
    try:
        src_conn = psycopg2.connect(SUPABASE_URL)
        tgt_conn = psycopg2.connect(AZURE_URL)
        src_cur = src_conn.cursor(cursor_factory=RealDictCursor)
        tgt_cur = tgt_conn.cursor()
        print("Successfully connected to both databases.")
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    # Order of tables for insertion
    tables = [
        "organisations",
        "users",
        "org_employees",
        "web_users",
        "webhook_subscriptions",
        "webhook_logs",
        "call_logs",
        "otps"
    ]

    try:
        print("\nDisabling foreign key constraints temporarily using session replica mode...")
        tgt_cur.execute("SET session_replication_role = 'replica';")
        tgt_conn.commit()

        for table in tables:
            print(f"\nMigrating table: {table}...")
            
            # Get only columns that exist on the target Azure database schema
            tgt_cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='{table}';")
            target_columns = [row[0] for row in tgt_cur.fetchall()]
            
            if not target_columns:
                print(f"Table '{table}' has no columns in target database. Skipping.")
                continue
            
            # Fetch data from source (only selecting the columns present in the target schema)
            cols_str = ", ".join(target_columns)
            src_cur.execute(f"SELECT {cols_str} FROM {table};")
            rows = src_cur.fetchall()
            print(f"Found {len(rows)} records in source '{table}' (columns: {cols_str}).")
            
            if not rows:
                continue
            
            # Build insert query
            placeholders = ", ".join(["%s"] * len(target_columns))
            insert_query = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;"
            
            # Prepare values list, serializing dicts/lists to JSON strings
            values_list = []
            for row in rows:
                row_vals = []
                for col in target_columns:
                    val = row[col]
                    if isinstance(val, (dict, list)):
                        val = json.dumps(val)
                    row_vals.append(val)
                values_list.append(tuple(row_vals))
                
            # Execute batch insert on target
            tgt_cur.executemany(insert_query, values_list)
            tgt_conn.commit()
            print(f"Migrated {len(values_list)} records into target '{table}'.")

        print("\nRe-enabling constraints and triggers on target...")
        tgt_cur.execute("SET session_replication_role = 'origin';")
        tgt_conn.commit()

        print("\n--- STEP 3: Resetting auto-increment sequences ---")
        # For tables with Serial integer primary keys (call_logs, otps), we need to update the sequence
        serial_tables = [
            ("call_logs", "id", "call_logs_id_seq"),
            ("otps", "id", "otps_id_seq")
        ]
        for tbl, col, seq in serial_tables:
            try:
                tgt_cur.execute(f"SELECT MAX({col}) FROM {tbl};")
                max_val = tgt_cur.fetchone()[0]
                if max_val is not None:
                    tgt_cur.execute(f"SELECT setval('{seq}', {max_val});")
                    tgt_conn.commit()
                    print(f"Sequence '{seq}' reset to {max_val}.")
            except Exception as seq_err:
                print(f"Warning: could not reset sequence {seq}: {seq_err}")
                tgt_conn.rollback()

        print("\nMigration completed successfully!")

    except Exception as e:
        # Re-enable origin replication role in case of crash
        try:
            tgt_cur.execute("SET session_replication_role = 'origin';")
            tgt_conn.commit()
        except:
            pass
        tgt_conn.rollback()
        print(f"Migration failed during data copy: {e}")
    finally:
        src_cur.close()
        src_conn.close()
        tgt_cur.close()
        tgt_conn.close()

if __name__ == "__main__":
    run_migration()
