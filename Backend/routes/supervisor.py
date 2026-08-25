from flask import Blueprint, jsonify, request
import os
import uuid
from werkzeug.utils import secure_filename
import bcrypt
import jwt
from datetime import datetime, timedelta

from database import get_db_connection
from config import Config
from auth_middleware import token_required

supervisor_bp = Blueprint("supervisor", __name__)
UPLOAD_FOLDER = Config.UPLOAD_FOLDER


# ----------------------------------------------------
# Test API
# ----------------------------------------------------
@supervisor_bp.route("/test", methods=["GET"])
def supervisor_test():

    return jsonify({
        "message": "Supervisor Module Working Successfully!"
    })


# ----------------------------------------------------
# Supervisor Login
# ----------------------------------------------------
@supervisor_bp.route("/login", methods=["POST"])
def supervisor_login():

    data = request.get_json()

    login = data.get("login")
    password = data.get("password")

    if not login or not password:
        return jsonify({
            "message": "Login and Password are required"
        }), 400

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

        # Check Admin
        cursor.execute("""
            SELECT admin_id
            FROM admins
            WHERE employee_id=%s
               OR email=%s
        """, (login, login))

        if cursor.fetchone():
            cursor.close()
            conn.close()

            return jsonify({
                "message": "This account belongs to Admin Portal. Please select Admin."
            }),400

        # Check Worker
        cursor.execute("""
            SELECT worker_id
            FROM workers
            WHERE employee_id=%s
               OR email=%s
        """, (login, login))

        if cursor.fetchone():
            cursor.close()
            conn.close()

            return jsonify({
                "message": "This account belongs to Worker Portal. Please select Worker."
            }),400

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Account not found."
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

        "supervisor": {
            "supervisor_id": supervisor["supervisor_id"],
            "employee_id": supervisor["employee_id"],
            "full_name": supervisor["full_name"],
            "email": supervisor["email"],
            "zone_id": supervisor["zone_id"],
            "status": supervisor["status"]
        }

    })


# ----------------------------------------------------
# Supervisor Dashboard
# ----------------------------------------------------
@supervisor_bp.route("/dashboard", methods=["GET"])
@token_required
def dashboard(current_supervisor):

    if current_supervisor["role"] != "Supervisor":

        return jsonify({
            "message":"Access denied"
        }),403

    supervisor_id = current_supervisor["supervisor_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

 SELECT
    SUM(status != 'Resolved') AS total_assigned,

    IFNULL(SUM(status='Assigned'),0) AS assigned,

    IFNULL(SUM(status='In Progress'),0) AS in_progress,

    IFNULL(SUM(status='Completed'),0) AS completed,

    IFNULL(SUM(status='Verified'),0) AS verified

FROM complaints

WHERE supervisor_id=%s

    """,(supervisor_id,))

    dashboard = cursor.fetchone()
    print("SUPERVISOR KPI:", dashboard)

    cursor.close()
    conn.close()

    return jsonify(dashboard)


# ----------------------------------------------------
# View Assigned Complaints
# ----------------------------------------------------
@supervisor_bp.route("/assigned-complaints", methods=["GET"])
@token_required
def assigned_complaints(current_supervisor):

    if current_supervisor["role"] != "Supervisor":
        return jsonify({
            "message": "Access denied"
        }), 403

    supervisor_id = current_supervisor["supervisor_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
      SELECT
    c.complaint_id,
    c.complaint_code,
    c.category,
    c.description,
    c.address,
    c.priority,
    c.status,
    c.image_before,
    c.image_after,
    c.submitted_at,
    c.worker_id,
    c.vehicle_id,

    w.full_name AS worker_name,

    v.vehicle_number,
    v.vehicle_type

FROM complaints c

LEFT JOIN workers w
ON c.worker_id = w.worker_id

LEFT JOIN vehicles v
ON c.vehicle_id = v.vehicle_id

WHERE c.zone_id = (
    SELECT zone_id 
    FROM supervisors 
    WHERE supervisor_id = %s
)

ORDER BY c.complaint_id DESC
    """, (supervisor_id,))

    complaints = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({

        "count": len(complaints),
        "complaints": complaints

    })


# ----------------------------------------------------
# View Available Workers
# ----------------------------------------------------
@supervisor_bp.route("/available-workers", methods=["GET"])
@token_required
def available_workers(current_supervisor):

    if current_supervisor["role"] != "Supervisor":
        return jsonify({
            "message": "Access denied"
        }), 403

    zone_id = current_supervisor["zone_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT

            w.worker_id,
            w.employee_id,
            w.full_name,
            w.mobile_number,
            w.crew_name,
            w.status,
            w.average_rating,
            d.department_name
         FROM workers w
            JOIN departments d
            ON w.department_id = d.department_id

            WHERE w.zone_id=%s
           

            ORDER BY w.full_name

    """, (zone_id,))

    workers = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({

        "count": len(workers),
        "workers": workers

    })

# ----------------------------------------------------
# View Available Vehicles
# ----------------------------------------------------
@supervisor_bp.route("/available-vehicles", methods=["GET"])
@token_required
def available_vehicles(current_supervisor):

    if current_supervisor["role"] != "Supervisor":
        return jsonify({
            "message": "Access denied"
        }), 403

    zone_id = current_supervisor["zone_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            vehicle_id,
            vehicle_number,
            vehicle_type,
            driver_name,
            driver_phone,
            status
        FROM vehicles
        WHERE zone_id=%s
        ORDER BY vehicle_number
    """, (zone_id,))

    vehicles = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "count": len(vehicles),
        "vehicles": vehicles
    })    
    
# ----------------------------------------------------
# Assign Worker + Vehicle
# ----------------------------------------------------
@supervisor_bp.route("/assign-worker", methods=["POST"])
@token_required
def assign_worker(current_supervisor):

    if current_supervisor["role"] != "Supervisor":
        return jsonify({
            "message": "Access denied"
        }), 403

    data = request.get_json()

    complaint_id = data.get("complaint_id")
    worker_id = data.get("worker_id")
    vehicle_id = data.get("vehicle_id")

    print("Complaint ID:", complaint_id)
    print("Worker ID:", worker_id)
    print("Vehicle ID:", vehicle_id)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # -----------------------------
    # Check Complaint
    # -----------------------------
    cursor.execute("""
    SELECT complaint_id, citizen_id
    FROM complaints
    WHERE complaint_id=%s
    """, (
        complaint_id,
    ))

    complaint = cursor.fetchone()

    if not complaint:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Complaint not found"
        }), 404

    # -----------------------------
    # Check Worker
    # -----------------------------
    cursor.execute("""
        SELECT worker_id
        FROM workers
        WHERE worker_id=%s
          AND zone_id=%s
    """, (
        worker_id,
        current_supervisor["zone_id"]
    ))

    worker = cursor.fetchone()

    if not worker:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Worker not found"
        }), 404

    # -----------------------------
    # Check Vehicle
    # -----------------------------
    cursor.execute("""
        SELECT vehicle_id
        FROM vehicles
        WHERE vehicle_id=%s
          AND zone_id=%s
    """, (
        vehicle_id,
        current_supervisor["zone_id"]
    ))

    vehicle = cursor.fetchone()

    if not vehicle:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Vehicle not found"
        }), 404

    # -----------------------------
    # Update Complaint
    # -----------------------------
    cursor.execute("""
       UPDATE complaints
SET
    worker_id=%s,
    vehicle_id=%s,
    status='Assigned'
WHERE complaint_id=%s
    """, (
        worker_id,
        vehicle_id,
        complaint_id
    ))

    print("Rows updated:", cursor.rowcount)

    # -----------------------------
    # Update Worker Status
    # -----------------------------
    cursor.execute("""
        UPDATE workers
        SET status='Busy'
        WHERE worker_id=%s
    """, (worker_id,))

    # -----------------------------
    # Update Vehicle Status
    # -----------------------------
    cursor.execute("""
        UPDATE vehicles
        SET status='Busy'
        WHERE vehicle_id=%s
    """, (vehicle_id,))
    
#     cursor.execute("""
# INSERT INTO notifications
# (citizen_id, complaint_id, title, message, notification_type)
# VALUES (%s, %s, %s, %s, %s)
# """, (
#     complaint["citizen_id"],
#     complaint_id,
#     "Worker & Vehicle Assigned",
#     "A worker and municipal vehicle have been assigned to your complaint.",
#     "Complaint"
# ))

    # Supervisor Notification
    cursor.execute("""
    INSERT INTO supervisor_notifications
    (supervisor_id, complaint_id, title, message)
    VALUES (%s, %s, %s, %s)
    """, (
        current_supervisor["supervisor_id"],
        complaint_id,
        "Worker Assigned",
        f"Worker and vehicle assigned for complaint CC{int(complaint_id):06d}."
    ))

    conn.commit()
    # -----------------------------
    # Notify Admin
    # -----------------------------
    cursor.execute("""
    SELECT admin_id
    FROM admins
    LIMIT 1
    """)

    admin = cursor.fetchone()

    if admin:
        cursor.execute("""
        INSERT INTO admin_notifications
        (admin_id, title, message)
        VALUES (%s, %s, %s)
        """, (
            admin["admin_id"],
            "Worker & Vehicle Assigned",
            f"Complaint CC{int(complaint_id):06d} has been assigned to a worker and vehicle."
        ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Worker and Vehicle assigned successfully."
    })
# ----------------------------------------------------
# Verify Complaint
# ----------------------------------------------------
@supervisor_bp.route("/verify-complaint", methods=["PUT"])
@token_required
def verify_complaint(current_supervisor):

    if current_supervisor["role"] != "Supervisor":
        return jsonify({
            "message": "Access denied"
        }), 403

    data = request.get_json()

    complaint_id = data.get("complaint_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # # Get citizen
    # cursor.execute("""
    #     SELECT citizen_id
    #     FROM complaints
    #     WHERE complaint_id=%s
    # """, (complaint_id,))

    # complaint = cursor.fetchone()

    # Verify complaint
    cursor.execute("""
        UPDATE complaints
        SET
            status='Resolved',
            verification_status='Approved',
            verified_at=NOW()
        WHERE complaint_id=%s
    """, (complaint_id,))

    # # Final notification
    # cursor.execute("""
    #     INSERT INTO notifications
    #     (
    #         citizen_id,
    #         complaint_id,
    #         title,
    #         message,
    #         notification_type
    #     )
    #     VALUES
    #     (%s,%s,%s,%s,%s)
    # """, (
    #     complaint["citizen_id"],
    #     complaint_id,
    #     "Complaint Resolved",
    #     "Your complaint has been successfully resolved. Thank you for helping keep the city clean!",
    #     "Complaint"
    # ))

    conn.commit()
    # -----------------------------
    # Notify Admin
    # -----------------------------
    cursor.execute("""
    SELECT admin_id
    FROM admins
    LIMIT 1
    """)

    admin = cursor.fetchone()

    if admin:
        cursor.execute("""
        INSERT INTO admin_notifications
        (admin_id, title, message)
        VALUES (%s, %s, %s)
        """, (
            admin["admin_id"],
            "Complaint Resolved",
            f"Complaint CC{int(complaint_id):06d} has been verified and marked as resolved."
        ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Complaint verified successfully."
    }) 
# ----------------------------------------------------
#  Worker
# ----------------------------------------------------   
    
@supervisor_bp.route("/workers", methods=["GET"])
@token_required
def get_workers(current_supervisor):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            worker_id,
            full_name,
            status
        FROM workers
        WHERE zone_id=%s
    """, (
        current_supervisor["zone_id"],
    ))

    workers = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "workers": workers
    })    


# ----------------------------------------------------
# Update Complaint Status
# ----------------------------------------------------
@supervisor_bp.route("/update-status", methods=["PUT"])
@token_required
def update_status(current_supervisor):

    if current_supervisor["role"] != "Supervisor":

        return jsonify({
            "message":"Access denied"
        }),403

    data=request.get_json()

    complaint_id=data.get("complaint_id")
    status=data.get("status")

    allowed_status = [
    "Assigned",
    "In Progress",
    "Verification",
    "Resolved"
]

    if status not in allowed_status:

        return jsonify({
            "message":"Invalid Status"
        }),400

    conn=get_db_connection()
    cursor=conn.cursor()

    cursor.execute("""

        UPDATE complaints

        SET status=%s

        WHERE complaint_id=%s
          AND supervisor_id=%s

    """,(

        status,
        complaint_id,
        current_supervisor["supervisor_id"]

    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({

        "message":"Complaint status updated successfully."

    })


# ----------------------------------------------------
# Supervisor Profile
# ----------------------------------------------------
@supervisor_bp.route("/profile", methods=["GET"])
@token_required
def profile(current_supervisor):

    if current_supervisor["role"] != "Supervisor":

        return jsonify({
            "message":"Access denied"
        }),403

    conn=get_db_connection()
    cursor=conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT

            supervisor_id,
            employee_id,
            full_name,
            email,
            mobile_number,
            zone_id,
            status,
            profile_photo,
            created_at

        FROM supervisors

        WHERE supervisor_id=%s

    """,(current_supervisor["supervisor_id"],))

    profile=cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(profile)   

# ----------------------------------------------------
# Update Supervisor Profile
# ----------------------------------------------------
@supervisor_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_supervisor):

    if current_supervisor["role"] != "Supervisor":
        return jsonify({
            "message": "Access denied"
        }), 403

    data = request.form

    

    full_name = data.get("full_name")
    email = data.get("email")
    mobile_number = data.get("phone")
    profile_photo = request.files.get("profile_photo")
    profile_photo_path = None

    if profile_photo:
       filename = f"{uuid.uuid4().hex}_{secure_filename(profile_photo.filename)}"
       profile_photo_path = os.path.join(UPLOAD_FOLDER, filename)
       profile_photo.save(profile_photo_path)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE supervisors
        SET
            full_name=%s,
            email=%s,
            mobile_number=%s,
            profile_photo=%s
        WHERE supervisor_id=%s
    """,(
        full_name,
        email,
        mobile_number,
        profile_photo_path,
        current_supervisor["supervisor_id"]
    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message":"Profile updated successfully"
    }),200 

# ----------------------------------------------------
# Get Supervisor Notifications
# ----------------------------------------------------
@supervisor_bp.route("/notifications", methods=["GET"])
@token_required
def get_notifications(current_supervisor):
    
    print("Current Supervisor:", current_supervisor)
    print("Supervisor ID:", current_supervisor["supervisor_id"])

    if current_supervisor["role"] != "Supervisor":
        return jsonify({
            "message": "Access denied"
        }), 403

    supervisor_id = current_supervisor["supervisor_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            notification_id,
            complaint_id,
            title,
            message,
            is_read,
            created_at
        FROM supervisor_notifications
        WHERE supervisor_id=%s
        ORDER BY notification_id DESC
    """, (supervisor_id,))

    notifications = cursor.fetchall()
    print("Notifications:", notifications)

    cursor.close()
    conn.close()

    return jsonify({
        "notifications": notifications
    })
