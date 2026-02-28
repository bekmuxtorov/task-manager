import sqlite3
import os

db_path = r'd:\Loyihalar\task-management\backend\db.sqlite3'
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(tasks_task)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns in tasks_task: {columns}")

    cursor.execute("SELECT * FROM django_migrations WHERE app='tasks'")
    migrations = cursor.fetchall()
    print(f"Applied migrations for tasks: {migrations}")
    conn.close()
