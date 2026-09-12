# check_users.py

import sqlite3

conn = sqlite3.connect("analytics.db")
cursor = conn.cursor()

cursor.execute("""
SELECT name,email,role,is_active
FROM auth_users
""")

for row in cursor.fetchall():
    print(row)

conn.close()
