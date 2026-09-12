import sqlite3

conn = sqlite3.connect("analytics.db")
cursor = conn.cursor()

cursor.execute("""
SELECT code, used, expires_at
FROM registration_codes
""")

for row in cursor.fetchall():
    print(row)

conn.close()