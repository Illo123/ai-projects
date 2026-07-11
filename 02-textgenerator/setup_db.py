import secrets
import sqlite3

conn = sqlite3.connect('lehrerbrief.db')
c = conn.cursor()

c.executescript("""
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS invite_codes;

    CREATE TABLE users (
        id            INTEGER PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE invite_codes (
        code    TEXT PRIMARY KEY,
        used_by INTEGER,
        used_at TEXT,
        FOREIGN KEY (used_by) REFERENCES users(id)
    );
""")

ANZAHL_CODES = 5
codes = [secrets.token_hex(4) for _ in range(ANZAHL_CODES)]
c.executemany("INSERT INTO invite_codes (code) VALUES (?)", [(code,) for code in codes])

conn.commit()
conn.close()

print(f"DB 'lehrerbrief.db' angelegt mit {ANZAHL_CODES} Einladungscodes:")
for code in codes:
    print(f"  {code}")
