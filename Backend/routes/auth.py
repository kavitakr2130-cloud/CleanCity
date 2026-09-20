from flask import Blueprint, jsonify, request
import bcrypt
import jwt
from datetime import datetime, timedelta
from database import get_db_connection

from config import Config

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

import google.generativeai as genai

genai.configure(api_key=Config.GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-3.5-flash")


auth_bp = Blueprint("auth", __name__)

# -------------------------------
# Test API
# -------------------------------
@auth_bp.route("/test", methods=["GET"])
def test_auth():
    return jsonify({
        "message": "Authentication Module Working Successfully!"
    })

# -------------------------------
# Admin Login
# -------------------------------
@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():

    print("ADMIN LOGIN ROUTE HIT")

    data = request.json

    login = data.get("login")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM admins
        WHERE employee_id=%s
           OR email=%s
        """,
        (login, login)
    )

    admin = cursor.fetchone()

    if not admin:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Account not found."
        }),404


    result = bcrypt.checkpw(
        password.encode(),
        admin["password"].encode()
    )

    print("BCRYPT RESULT:", result)


    if not result:

        print("ENTERED INVALID PASSWORD BLOCK")

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Invalid Password"
        }),401


    print("PASSWORD VERIFIED SUCCESS")


    token = jwt.encode(
        {
            "admin_id": admin["admin_id"],
            "role": "Admin",
            "exp": datetime.utcnow() + timedelta(days=30)
        },
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )


    cursor.close()
    conn.close()


    return jsonify({
        "message": "Login Successful",
        "user_type": "Admin",
        "token": token,
        "admin": {
            "admin_id": admin["admin_id"],
            "employee_id": admin["employee_id"],
            "full_name": admin["full_name"],
            "email": admin["email"],
            "designation": admin["designation"]
        }
    })

# -------------------------------
# Supervisor Login
# -------------------------------
@auth_bp.route("/supervisor/login", methods=["POST"])
def supervisor_login():

    data = request.json

    login = data.get("login")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT s.*, z.zone_name
        FROM supervisors AS s
        LEFT JOIN zones AS z
            ON s.zone_id = z.zone_id
        WHERE s.employee_id=%s
           OR s.email=%s
    """, (login, login))

    supervisor = cursor.fetchone()

    if not supervisor:

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Supervisor account not found."
        }),404

    if not bcrypt.checkpw(
        password.encode(),
        supervisor["password"].encode()
    ):

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Invalid Password"
        }),401

    token = jwt.encode(
    {
        "supervisor_id": supervisor["supervisor_id"],
        "zone_id": supervisor["zone_id"],
        "role": "Supervisor",
        "exp": datetime.utcnow() + timedelta(days=30)
    },
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Login Successful",
        "user_type": "Supervisor",
        "token": token,
        "must_change_password": supervisor["must_change_password"],
        "supervisor": {
            "supervisor_id": supervisor["supervisor_id"],
            "employee_id": supervisor["employee_id"],
            "full_name": supervisor["full_name"],
            "email": supervisor["email"],
            "zone_name": supervisor["zone_name"]
        }
    })  
    
# -------------------------------
# Worker Login
# -------------------------------
@auth_bp.route("/worker/login", methods=["POST"])
def worker_login():

    data = request.json

    login = data.get("login")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM workers
        WHERE employee_id=%s
           OR email=%s
    """, (login, login))

    worker = cursor.fetchone()

    if not worker:

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Worker account not found."
        }),404

    if not bcrypt.checkpw(
        password.encode(),
        worker["password"].encode()
    ):

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Invalid Password"
        }),401

    token = jwt.encode(
        {
            "worker_id": worker["worker_id"],
            "role": "Worker",
            "exp": datetime.utcnow() + timedelta(days=30)
        },
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Login Successful",
        "user_type": "Worker",
        "token": token,
        "must_change_password": worker["must_change_password"],
        "worker": {
            "worker_id": worker["worker_id"],
            "employee_id": worker["employee_id"],
            "full_name": worker["full_name"],
            "email": worker["email"],
            "supervisor_id": worker["supervisor_id"],
            "zone_id": worker["zone_id"]
        }
    })  
        
# -------------------------------
# Citizen Email Login
# -------------------------------
@auth_bp.route("/citizen/login", methods=["POST"])
def citizen_login():

    data = request.json
    email = data.get("email")

    if not email:
        return jsonify({
            "message": "Email is required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE email=%s
        """,
        (email.strip(),)
    )

    user = cursor.fetchone()

    if not user:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Citizen account not found.",
            "existing_user": False
        }), 404

    token = jwt.encode(
        {
            "user_id": user["user_id"],
            "role": "Citizen",
            "exp": datetime.utcnow() + timedelta(days=30)
        },
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Login Successful",
        "existing_user": True,
        "user_type": "Citizen",
        "token": token,
        "user": user
    }), 200
    

    
# -------------------------------
# Google Login
# -------------------------------
@auth_bp.route("/google-login", methods=["POST"])
def google_login():

    data = request.json
    credential = data.get("credential")

    if not credential:
        return jsonify({
            "message": "Google credential is required"
        }), 400

    try:
        # Verify Google credential
        google_user = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            Config.GOOGLE_CLIENT_ID
        )

        google_email = google_user.get("email")
        google_name = google_user.get("name", "Citizen")

        if not google_email:
            return jsonify({
                "message": "Google account email not available"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check existing citizen by email
        cursor.execute(
            "SELECT * FROM users WHERE email=%s",
            (google_email,)
        )

        user = cursor.fetchone()

        # Existing user
        if user:

            token = jwt.encode(
                {
                    "user_id": user["user_id"],
                    "role": "Citizen",
                    "exp": datetime.utcnow() + timedelta(days=30)
                },
                Config.JWT_SECRET_KEY,
                algorithm="HS256"
            )

            cursor.close()
            conn.close()

            return jsonify({
                "message": "Login Successful",
                "existing_user": True,
                "token": token,
                "user": user
            })

        # New user
        cursor.close()
        conn.close()

        return jsonify({
            "message": "New Citizen",
            "existing_user": False,
            "email": google_email,
            "full_name": google_name
        })

    except ValueError:
        return jsonify({
            "message": "Invalid Google credential"
        }), 401

    except Exception as e:
        return jsonify({
            "message": "Google login failed",
            "error": str(e)
        }), 500    

# -------------------------------
# Complete Google Citizen Registration
# -------------------------------
@auth_bp.route("/google-register", methods=["POST"])
def google_register():

    data = request.json

    email = data.get("email")
    full_name = data.get("full_name", "Citizen")
    mobile_number = data.get("mobile_number")
    dob = data.get("dob")

    if not email or not mobile_number or not dob:
        return jsonify({
            "message": "Email, mobile number and date of birth are required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check if email already exists
    cursor.execute(
        "SELECT * FROM users WHERE email=%s",
        (email,)
    )

    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Google account already registered"
        }), 409

    # Check if mobile number already exists
    cursor.execute(
        "SELECT * FROM users WHERE mobile_number=%s",
        (mobile_number,)
    )

    existing_mobile = cursor.fetchone()

    if existing_mobile:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Mobile number already registered"
        }), 409

    # Create citizen
    cursor.execute(
        """
        INSERT INTO users
        (full_name, mobile_number, email, dob, is_verified)
        VALUES (%s, %s, %s, %s, TRUE)
        """,
        (full_name, mobile_number, email, dob)
    )

    conn.commit()

    user_id = cursor.lastrowid

    cursor.execute(
        "SELECT * FROM users WHERE user_id=%s",
        (user_id,)
    )

    user = cursor.fetchone()

    # Create JWT
    token = jwt.encode(
        {
            "user_id": user["user_id"],
            "role": "Citizen",
            "exp": datetime.utcnow() + timedelta(days=30)
        },
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Registration Successful",
        "existing_user": False,
        "token": token,
        "user": user
    })    
# -------------------------------
# Gemini AI Test
# -------------------------------
@auth_bp.route("/gemini-test", methods=["POST"])
def gemini_test():

    data = request.json
    prompt = data.get("prompt")

    try:
        response = model.generate_content(prompt)

        return jsonify({
            "response": response.text
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500
        