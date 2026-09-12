import sqlite3

conn = sqlite3.connect("analytics.db")
cursor = conn.cursor()

cursor.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
)

print("\nTABLES:\n")

for table in cursor.fetchall():
    print(table[0])

conn.close()