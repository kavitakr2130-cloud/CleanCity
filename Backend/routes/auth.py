from flask import Blueprint, jsonify, request
import bcrypt
import jwt
from datetime import datetime, timedelta
from database import get_db_connection
from twilio.rest import Client
from config import Config

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

    print("ADMIN DATA:", admin)

    if not admin:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Account not found."
        }),404


    print("PASSWORD RECEIVED:", password)

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
        SELECT *
        FROM supervisors
        WHERE employee_id=%s
           OR email=%s
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
            "zone_id": supervisor["zone_id"]
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
# Send OTP
# -------------------------------
@auth_bp.route("/send-otp", methods=["POST"])
def send_otp():

    data = request.json
    mobile_number = data.get("mobile_number")

    if not mobile_number:
        return jsonify({
            "message": "Mobile number is required"
        }), 400


    # Send OTP using Twilio Verify
    client = Client(
        Config.TWILIO_ACCOUNT_SID,
        Config.TWILIO_AUTH_TOKEN
    )

    client.verify.v2.services(
        Config.TWILIO_VERIFY_SERVICE_SID
    ).verifications.create(
        to="+91" + mobile_number,
        channel="sms"
    )


    return jsonify({
        "message": "OTP Sent Successfully"
    })
# -------------------------------
# Verify OTP
# -------------------------------
@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():

    data = request.json
    mobile_number = data.get("mobile_number")
    otp = data.get("otp")
    full_name = data.get("full_name", "Citizen")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Verify OTP using Twilio
    client = Client(
        Config.TWILIO_ACCOUNT_SID,
        Config.TWILIO_AUTH_TOKEN
    )

    verification_check = client.verify.v2.services(
        Config.TWILIO_VERIFY_SERVICE_SID
    ).verification_checks.create(
        to="+91" + mobile_number,
        code=otp
    )

    if verification_check.status != "approved":
        cursor.close()
        conn.close()
        return jsonify({
            "message": "Invalid or Expired OTP"
        }), 400

    # Check if user already exists
    cursor.execute(
        "SELECT * FROM users WHERE mobile_number=%s",
        (mobile_number,)
    )

    user = cursor.fetchone()

    # Create new citizen if not exists
    if not user:

        cursor.execute("""
        INSERT INTO users
        (full_name, mobile_number, is_verified)
        VALUES (%s, %s, TRUE)
        """, (full_name, mobile_number))

        conn.commit()

        cursor.execute(
            "SELECT * FROM users WHERE mobile_number=%s",
            (mobile_number,)
        )

        user = cursor.fetchone()

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
        "user_type": "Citizen",
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
        