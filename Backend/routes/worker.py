from flask import Blueprint, jsonify, request
import bcrypt
import jwt
from datetime import datetime, timedelta
from database import get_db_connection
from config import Config
from auth_middleware import token_required

worker_bp = Blueprint("worker", __name__)

# ----------------------------------------------------
# Test API
# ----------------------------------------------------
@worker_bp.route("/test", methods=["GET"])
def worker_test():

    return jsonify({
        "message": "Worker Module Working Successfully!"
    })

# ----------------------------------------------------
# Worker Login
# ----------------------------------------------------
@worker_bp.route("/login", methods=["POST"])
def worker_login():

    data = request.get_json()

    login = data.get("login")
    password = data.get("password")

    if not login or not password:
        return jsonify({
            "message": "Login and Password are required"
        }),400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM workers
        WHERE employee_id=%s
           OR email=%s
    """,(login,login))

    worker = cursor.fetchone()

    if not worker:

        # Check Admin
        cursor.execute("""
            SELECT admin_id
            FROM admins
            WHERE employee_id=%s
               OR email=%s
        """,(login,login))

        if cursor.fetchone():
            cursor.close()
            conn.close()

            return jsonify({
                "message":"This account belongs to Admin Portal. Please select Admin."
            }),400

        # Check Supervisor
        cursor.execute("""
            SELECT supervisor_id
            FROM supervisors
            WHERE employee_id=%s
               OR email=%s
        """,(login,login))

        if cursor.fetchone():
            cursor.close()
            conn.close()

            return jsonify({
                "message":"This account belongs to Supervisor Portal. Please select Supervisor."
            }),400

        cursor.close()
        conn.close()

        return jsonify({
            "message":"Account not found."
        }),404

    if not bcrypt.checkpw(
        password.encode(),
        worker["password"].encode()
    ):

        cursor.close()
        conn.close()

        return jsonify({
            "message":"Invalid Password"
        }),401

    token = jwt.encode(
        {
            "worker_id":worker["worker_id"],
            "supervisor_id":worker["supervisor_id"],
            "zone_id":worker["zone_id"],
            "role":"Worker",
            "exp":datetime.utcnow()+timedelta(days=30)
        },
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )

    cursor.close()
    conn.close()

    return jsonify({

        "message":"Login Successful",
        "user_type":"Worker",
        "token":token,

        "worker":{

            "worker_id":worker["worker_id"],
            "employee_id":worker["employee_id"],
            "full_name":worker["full_name"],
            "email":worker["email"],
            "crew_name":worker["crew_name"],
            "zone_id":worker["zone_id"],
            "status":worker["status"]

        }

    })


# ----------------------------------------------------
# Worker Dashboard
# ----------------------------------------------------
@worker_bp.route("/dashboard",methods=["GET"])
@token_required
def dashboard(current_worker):

    if current_worker["role"]!="Worker":

        return jsonify({
            "message":"Access denied"
        }),403

    worker_id=current_worker["worker_id"]

    conn=get_db_connection()
    cursor=conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT

            COUNT(*) total_jobs,

            IFNULL(SUM(status='Assigned'),0) assigned,

            IFNULL(SUM(status='In Progress'),0) in_progress,

            IFNULL(SUM(status='verification'),0) completed

        FROM complaints

        WHERE worker_id=%s

    """,(worker_id,))

    dashboard=cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(dashboard)

# ----------------------------------------------------
# Worker Dashboard Data
# ----------------------------------------------------
@worker_bp.route("/dashboard-data", methods=["GET"])
@token_required
def worker_dashboard_data(current_worker):

    if current_worker["role"] != "Worker":
        return jsonify({
            "message": "Access denied"
        }), 403

    worker_id = current_worker["worker_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

        # Worker Profile
    cursor.execute("""
        SELECT
            w.worker_id,
            w.employee_id,
            w.full_name,
            w.status,
            w.crew_name,
            w.profile_photo,
            w.zone_id,
            z.zone_name
        FROM workers w
        LEFT JOIN zones z
              ON w.zone_id = z.zone_id
        WHERE w.worker_id=%s
    """, (worker_id,))

    worker = cursor.fetchone()

    # KPI
    cursor.execute("""
    SELECT
        COUNT(*) AS total_tasks,
        IFNULL(SUM(status='Verification'), 0) AS verification,
        IFNULL(SUM(status='Resolved'), 0) AS resolved
    FROM complaints
    WHERE worker_id=%s
    """, (worker_id,))

    kpi = cursor.fetchone()
    

  # Assigned Complaints
    cursor.execute("""
SELECT
    c.complaint_id,
    c.complaint_code,
    c.category,
    c.description,
    c.address,
    c.status,
    c.image_before,
    c.image_after,
    c.completed_at,
    v.vehicle_number,
    v.vehicle_type
FROM complaints c
LEFT JOIN vehicles v
ON c.vehicle_id = v.vehicle_id
WHERE c.worker_id=%s
AND c.status IN ('Assigned','In Progress')
ORDER BY c.complaint_id DESC
""", (worker_id,))

    complaints = cursor.fetchall()
    # Completed History
    cursor.execute("""
    SELECT
        complaint_id,
        complaint_code,
        category,
        address,
        status,
        image_before,
        image_after,
        completed_at
    FROM complaints
  WHERE worker_id=%s
AND status IN ('Verification','Resolved')
ORDER BY completed_at DESC
""", (worker_id,))

    completed_history = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
    "worker": worker,
    "kpi": kpi,
    "complaints": complaints,
    "completed_history": completed_history
})

# ----------------------------------------------------
# View Assigned Complaints
# ----------------------------------------------------
@worker_bp.route("/assigned-complaints", methods=["GET"])
@token_required
def assigned_complaints(current_worker):

    if current_worker["role"] != "Worker":

        return jsonify({
            "message": "Access denied"
        }),403

    worker_id = current_worker["worker_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT

            complaint_id,
            complaint_code,
            category,
            description,
            address,
            priority,
            status,
            image_before,
            submitted_at

        FROM complaints

        WHERE worker_id=%s

        ORDER BY complaint_id DESC

    """,(worker_id,))

    complaints = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({

        "count":len(complaints),
        "complaints":complaints

    })

# ---------------------------
# ---------------------------
# Worker - Start Work
# ---------------------------

@worker_bp.route("/start-work", methods=["PUT"])
@token_required
def start_work(current_worker):

    if current_worker["role"] != "Worker":
        return jsonify({
            "message": "Access denied"
        }), 403

    data = request.get_json()

    complaint_id = data.get("complaint_id")

    if not complaint_id:
        return jsonify({
            "message": "Complaint ID is required"
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # # Get citizen for notification
    # cursor.execute("""
    #     SELECT citizen_id
    #     FROM complaints
    #     WHERE complaint_id=%s
    # """, (complaint_id,))

    # complaint = cursor.fetchone()

    # Update complaint
    cursor.execute("""
        UPDATE complaints
        SET
            status='In Progress',
            started_at=NOW()
        WHERE complaint_id=%s
          AND worker_id=%s
          AND status='Assigned'
    """, (
        complaint_id,
        current_worker["worker_id"]
    ))

    if cursor.rowcount == 0:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Complaint cannot be started. It may not be assigned to you or may already be started."
        }), 400

    # # Notification
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
    #     "Cleaning Started",
    #     "The cleaning team has started working on your complaint.",
    #     "Complaint"
    # ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Work Started Successfully"
    }), 200


# ----------------------------------------------------
# Worker Profile
# ----------------------------------------------------
@worker_bp.route("/profile", methods=["GET"])
@token_required
def profile(current_worker):

    if current_worker["role"] != "Worker":

        return jsonify({
            "message":"Access denied"
        }),403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT

            worker_id,
            employee_id,
            full_name,
            email,
            mobile_number,
            profile_photo,
            crew_name,
            average_rating,
            status,
            zone_id,
            created_at

        FROM workers

        WHERE worker_id=%s

    """,(current_worker["worker_id"],))

    worker = cursor.fetchone()
  

    cursor.close()
    conn.close()
    if not worker:
      return jsonify({
        "message": "Worker not found"
    }), 404
    return jsonify(worker)

# ----------------------------------------------------
# Update Worker Profile
# ----------------------------------------------------
@worker_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_worker):

    if current_worker["role"] != "Worker":
        return jsonify({
            "message": "Access denied"
        }), 403

    # ---------------------------------------------
    # Get data from FormData
    # ---------------------------------------------
    employee_id = request.form.get("employeeId")
    full_name = request.form.get("name")
    email = request.form.get("email")
    mobile_number = request.form.get("phone")

    # Uploaded profile photo
    profile_photo = request.files.get("profile_photo")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ---------------------------------------------
        # Update basic worker information
        # ---------------------------------------------
        cursor.execute("""
            UPDATE workers
            SET
                employee_id=%s,
                full_name=%s,
                email=%s,
                mobile_number=%s
            WHERE worker_id=%s
        """, (
            employee_id,
            full_name,
            email,
            mobile_number,
            current_worker["worker_id"]
        ))

        # ---------------------------------------------
        # Save profile photo if a new one was selected
        # ---------------------------------------------
        if profile_photo:

            import os
            from werkzeug.utils import secure_filename

            upload_folder = os.path.join(
                "uploads",
                "worker_profiles"
            )

            os.makedirs(upload_folder, exist_ok=True)

            original_name = secure_filename(
                profile_photo.filename
            )

            extension = os.path.splitext(
                original_name
            )[1]

            filename = (
                f"worker_{current_worker['worker_id']}"
                f"{extension}"
            )

            file_path = os.path.join(
                upload_folder,
                filename
            )

            profile_photo.save(file_path)

            # Store path in database
            photo_path = file_path.replace("\\", "/")

            cursor.execute("""
                UPDATE workers
                SET profile_photo=%s
                WHERE worker_id=%s
            """, (
                photo_path,
                current_worker["worker_id"]
            ))

        # ---------------------------------------------
        # Commit changes
        # ---------------------------------------------
        conn.commit()

        # ---------------------------------------------
        # Get updated worker profile
        # ---------------------------------------------
        cursor.execute("""
            SELECT
                worker_id,
                employee_id,
                full_name,
                email,
                mobile_number,
                crew_name,
                average_rating,
                status,
                zone_id,
                profile_photo,
                created_at
            FROM workers
            WHERE worker_id=%s
        """, (
            current_worker["worker_id"],
        ))

        worker = cursor.fetchone()

        return jsonify({
            "message": "Worker profile updated successfully",
            "worker": worker
        }), 200

    except Exception as e:

        conn.rollback()

        print("Worker profile update error:", e)

        return jsonify({
            "message": "Failed to update worker profile"
        }), 500

    finally:

        cursor.close()
        conn.close()


# ----------------------------------------------------
# Update Live Location
# ----------------------------------------------------
@worker_bp.route("/update-location", methods=["PUT"])
@token_required
def update_location(current_worker):

    if current_worker["role"] != "Worker":

        return jsonify({
            "message":"Access denied"
        }),403

    data = request.get_json()

    latitude = data.get("latitude")
    longitude = data.get("longitude")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""

        UPDATE workers

        SET

            current_latitude=%s,
            current_longitude=%s

        WHERE worker_id=%s

    """,(

        latitude,
        longitude,
        current_worker["worker_id"]

    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({

        "message":"Location updated successfully."

    })
import os
from werkzeug.utils import secure_filename


# ----------------------------------------------------
# Upload After Cleaning Image & Mark Completed
# ----------------------------------------------------
@worker_bp.route("/complete-complaint", methods=["PUT"])
@token_required
def complete_complaint(current_worker):

    if current_worker["role"] != "Worker":
        return jsonify({
            "message": "Access denied"
        }), 403

    complaint_id = request.form.get("complaint_id")
    image = request.files.get("image")

    if image is None:
        return jsonify({
            "message": "After image is required"
        }), 400

    filename = secure_filename(image.filename)

    upload_folder = "uploads"

    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    filepath = os.path.join(upload_folder, filename)

    image.save(filepath)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

  

    # Update complaint
    cursor.execute("""
        UPDATE complaints
        SET
            image_after=%s,
            status='Verification',
            completed_at=NOW()
        WHERE complaint_id=%s
          AND worker_id=%s
    """, (
        filepath,
        complaint_id,
        current_worker["worker_id"]
    ))

    # Worker available again
    cursor.execute("""
        UPDATE workers
        SET status='Available'
        WHERE worker_id=%s
    """, (current_worker["worker_id"],))

  

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Complaint marked as completed."
    })
    
# ----------------------------------------------------
# Change Worker Password
# ----------------------------------------------------
@worker_bp.route("/change-password", methods=["PUT"])
@token_required
def change_worker_password(current_worker):

    if current_worker["role"] != "Worker":
        return jsonify({"message": "Access denied"}), 403

    data = request.get_json()

    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    if not new_password or not confirm_password:
        return jsonify({
            "message": "Password fields are required"
        }), 400

    if new_password != confirm_password:
        return jsonify({
            "message": "Passwords do not match"
        }), 400

    hashed_password = bcrypt.hashpw(
        new_password.encode(),
        bcrypt.gensalt()
    ).decode()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE workers
            SET password = %s,
                must_change_password = FALSE
            WHERE worker_id = %s
        """, (
            hashed_password,
            current_worker["worker_id"]
        ))

        conn.commit()

        return jsonify({
            "message": "Password changed successfully"
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()    