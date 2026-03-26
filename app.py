from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests from frontend

# Database connection using SQLite
def get_db():
    # Auto-creates jenie.db file natively, requiring zero external server setup!
    # Render uses ephemeral filesystems, so we must point to an explicit persistent Disk mount (/data/) if live
    DB_PATH = '/data/jenie.db' if os.environ.get('RENDER') else 'jenie.db'
    
    try:
        con = sqlite3.connect(DB_PATH)
        con.row_factory = sqlite3.Row  # Allow accessing columns by name
        cursor = con.cursor()
        
        # 1. Create User Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                phone_number TEXT UNIQUE
            );
        """)
        
        # 2. Create Tax Slabs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tax_slabs(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year INTEGER NOT NULL,
                regime TEXT NOT NULL DEFAULT 'Old',
                category TEXT NOT NULL DEFAULT 'Normal',
                min_income INTEGER NOT NULL,
                max_income INTEGER,
                tax_rate INTEGER NOT NULL
            );
        """)
        
        con.commit()
        return con
    except Exception as e:
        print(f"Database Initialization Error: {e}")
        return None

# API ENDPOINTS

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    db = get_db()
    if not db:
        return jsonify({"error": "Failed to connect to database"}), 500
        
    try:
        cursor = db.cursor()
        # SQLite uses ? for parameterization instead of %s
        query = "INSERT INTO user (username, password, role, name, email, phone_number) VALUES (?, ?, ?, ?, ?, ?)"
        values = (data['username'], data['password'], 'user', data['name'], data['email'], data['phone'])
        cursor.execute(query, values)
        db.commit()
        return jsonify({"message": "User registered successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username, email, or phone number already exists."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    db = get_db()
    
    try:
        cursor = db.cursor()
        query = "SELECT * FROM user WHERE username = ? AND password = ?"
        cursor.execute(query, (data['username'], data['password']))
        user_row = cursor.fetchone()
        
        if user_row:
            user = dict(user_row)
            # Mask password before sending back
            user['password'] = "****"
            return jsonify({"message": "Login successful", "user": user}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if db: db.close()

@app.route('/api/slabs', methods=['GET', 'POST'])
def manage_slabs():
    db = get_db()
    if request.method == 'GET':
        cursor = db.cursor()
        cursor.execute("SELECT * FROM tax_slabs ORDER BY min_income ASC")
        rows = cursor.fetchall()
        slabs = [dict(row) for row in rows]
        db.close()
        return jsonify({"slabs": slabs}), 200
        
    elif request.method == 'POST':
        data = request.json
        try:
            cursor = db.cursor()
            query = "INSERT INTO tax_slabs (year, regime, category, min_income, max_income, tax_rate) VALUES (?, ?, ?, ?, ?, ?)"
            values = (
                data['year'], 
                data.get('regime', 'Old'), 
                data.get('category', 'Normal'), 
                data['min_income'], 
                data.get('max_income'), 
                data['tax_rate']
            )
            cursor.execute(query, values)
            db.commit()
            return jsonify({"message": "Tax slab added successfully!"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            db.close()

@app.route('/api/slabs/sync', methods=['POST'])
def sync_slabs():
    data = request.json
    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute("DELETE FROM tax_slabs")
        for s in data.get('slabs', []):
            query = "INSERT INTO tax_slabs (year, regime, category, min_income, max_income, tax_rate) VALUES (?, ?, ?, ?, ?, ?)"
            max_val = None if (s.get('maxIncome') == "No Limit" or str(s.get('maxIncome')) == "") else s.get('maxIncome')
            values = (
                s['year'], 
                s.get('regime', 'Old'), 
                s.get('category', 'Normal'), 
                s.get('minIncome', 0), 
                max_val, 
                s['taxRate']
            )
            cursor.execute(query, values)
        db.commit()
        return jsonify({"message": "Global Slabs successfully synchronized!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

if __name__ == '__main__':
    # Initialize DB schema before running
    get_db()
    app.run(debug=True, port=5000)
