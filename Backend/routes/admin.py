from flask import Blueprint, jsonify, request
from auth_middleware import token_required
from database import get_db_connection

admin_bp = Blueprint("admin", __name__)


# -------------------------------
# Test API
# -------------------------------
@admin_bp.route("/test", methods=["GET"])
def test():
    return jsonify({
        "message": "Admin Module Working Successfully!"
    })


# -------------------------------
# View All Complaints
# -------------------------------
@admin_bp.route("/all-complaints", methods=["GET"])
@token_required
def all_complaints(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({
            "message": "Access denied"
        }), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT
    c.complaint_id,
    c.complaint_code,
    c.image_before,
    u.full_name,
    u.mobile_number,
    z.zone_name,
    s.full_name AS supervisor_name,
    c.category,
    c.description,
    c.priority,
    c.status,
    c.submitted_at,
    c.sla_deadline,
    TIMESTAMPDIFF(
        HOUR,
        c.submitted_at,
        NOW()
    ) AS pending_hours
FROM complaints c
JOIN users u
ON c.citizen_id = u.user_id
JOIN zones z
ON c.zone_id = z.zone_id
LEFT JOIN supervisors s
ON c.supervisor_id = s.supervisor_id
ORDER BY c.complaint_id DESC;
    """

    cursor.execute(query)
    complaints = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "count": len(complaints),
        "complaints": complaints
    })
    
# -------------------------------
# Assign Supervisor
# -------------------------------
@admin_bp.route("/assign-supervisor", methods=["POST"])
@token_required
def assign_supervisor(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({
            "message": "Access denied"
        }), 403

    data = request.get_json()

    complaint_id = data.get("complaint_id")
    supervisor_id = data.get("supervisor_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check complaint exists
        cursor.execute(
            """
            SELECT complaint_id, citizen_id
            FROM complaints
            WHERE complaint_id = %s
            """,
            (complaint_id,)
        )

        complaint = cursor.fetchone()

        if not complaint:
            return jsonify({
                "message": "Complaint not found"
            }), 404

        # Assign supervisor
        cursor.execute(
            """
            UPDATE complaints
            SET supervisor_id = %s,
                status = 'In Progress',
                assigned_at = NOW()
            WHERE complaint_id = %s
            """,
            (
                supervisor_id,
                complaint_id
            )
        )

        print("Rows updated:", cursor.rowcount)

        # Citizen notification
        cursor.execute(
            """
            INSERT INTO notifications
            (user_id, title, message, notification_type)
            VALUES (%s, %s, %s, %s)
            """,
            (
                complaint["citizen_id"],
                "Supervisor Assigned",
                "A supervisor has been assigned to your complaint.",
                "Complaint"
            )
        )
        
        
        # Supervisor Notification ✅ NEW
        cursor.execute(
             """
    INSERT INTO supervisor_notifications
    (supervisor_id, complaint_id, title, message)
    VALUES (%s, %s, %s, %s)
    """,
    (
        supervisor_id,
        complaint_id,
        "New Complaint Assigned",
        f"Complaint CC{int(complaint_id):06d} has been assigned to you by Admin."
    )
)
        
        

        conn.commit()
        
        # -----------------------------
        # Admin Notification
        # -----------------------------
        cursor.execute("""
        INSERT INTO admin_notifications
        (admin_id, title, message)
        VALUES (%s,%s,%s)
        """, (
            current_admin["admin_id"],
            "Supervisor Assigned",
           f"Complaint CC{int(complaint_id):06d} has been assigned to a supervisor."
        
        ))

        conn.commit()

        return jsonify({
            "message": "Supervisor assigned successfully."
        }), 200

    except Exception as e:
        conn.rollback()
        print("Assign Supervisor Error:", e)
        return jsonify({
            "message": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()
# -------------------------------
# Add Vehicle
# -------------------------------
@admin_bp.route("/add-vehicle", methods=["POST"])
@token_required
def add_vehicle(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({
            "message": "Access denied"
        }), 403

    data = request.get_json()

    vehicle_number = data.get("vehicle_number")
    vehicle_type = data.get("vehicle_type")
    zone_id = data.get("zone_id")
    driver_name = data.get("driver_name")
    driver_phone = data.get("driver_phone")

    if (
        not vehicle_number
        or not vehicle_type
        or not zone_id
        or not driver_name
        or not driver_phone
    ):
        return jsonify({
            "message": "All fields are required."
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check duplicate vehicle
    cursor.execute(
        """
        SELECT vehicle_id
        FROM vehicles
        WHERE vehicle_number = %s
        """,
        (vehicle_number,)
    )

    existing = cursor.fetchone()

    if existing:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Vehicle number already exists."
        }), 409

    cursor.execute(
        """
        INSERT INTO vehicles
        (
            vehicle_number,
            vehicle_type,
            zone_id,
            driver_name,
            driver_phone
        )
        VALUES
        (%s,%s,%s,%s,%s)
        """,
        (
            vehicle_number,
            vehicle_type,
            zone_id,
            driver_name,
            driver_phone
        )
    )

    conn.commit()

    vehicle_id = cursor.lastrowid

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Vehicle added successfully.",
        "vehicle_id": vehicle_id
    }), 201
# -------------------------------
# View All Vehicles
# -------------------------------
@admin_bp.route("/all-vehicles", methods=["GET"])
@token_required
def all_vehicles(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({
            "message": "Access denied"
        }), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM vehicles
        ORDER BY vehicle_id DESC
        """
    )

    vehicles = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "count": len(vehicles),
        "vehicles": vehicles
    }), 200


# -------------------------------
# Update Vehicle
# -------------------------------
@admin_bp.route("/update-vehicle/<int:vehicle_id>", methods=["PUT"])
@token_required
def update_vehicle(current_admin, vehicle_id):

    if current_admin["role"] != "Admin":
        return jsonify({
            "message": "Access denied"
        }), 403

    data = request.get_json()

    vehicle_type = data.get("vehicle_type")
    zone_id = data.get("zone_id")
    driver_name = data.get("driver_name")
    driver_phone = data.get("driver_phone")
    status = data.get("status")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT vehicle_id
        FROM vehicles
        WHERE vehicle_id=%s
        """,
        (vehicle_id,)
    )

    vehicle = cursor.fetchone()

    if not vehicle:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Vehicle not found."
        }), 404

    cursor.execute(
        """
        UPDATE vehicles
        SET
            vehicle_type=%s,
            zone_id=%s,
            driver_name=%s,
            driver_phone=%s,
            status=%s
        WHERE vehicle_id=%s
        """,
        (
            vehicle_type,
            zone_id,
            driver_name,
            driver_phone,
            status,
            vehicle_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Vehicle updated successfully."
    }), 200    
# -------------------------------
# Delete Vehicle
# -------------------------------
@admin_bp.route("/delete-vehicle/<int:vehicle_id>", methods=["DELETE"])
@token_required
def delete_vehicle(current_admin, vehicle_id):

    if current_admin["role"] != "Admin":
        return jsonify({"message": "Access denied"}), 403


    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT vehicle_id FROM vehicles WHERE vehicle_id=%s",
        (vehicle_id,)
    )

    vehicle = cursor.fetchone()

    if not vehicle:
        cursor.close()
        conn.close()
        return jsonify({"message": "Vehicle not found."}), 404

    cursor.execute(
        "DELETE FROM vehicles WHERE vehicle_id=%s",
        (vehicle_id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Vehicle deleted successfully."
    }), 200


# -------------------------------
# Update Vehicle Location
# -------------------------------
@admin_bp.route("/update-vehicle-location/<int:vehicle_id>", methods=["PUT"])
@token_required
def update_vehicle_location(current_admin, vehicle_id):

    data = request.get_json()

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    status = data.get("status")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE vehicles
        SET
            current_latitude=%s,
            current_longitude=%s,
            status=%s
        WHERE vehicle_id=%s
        """,
        (
            latitude,
            longitude,
            status,
            vehicle_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Vehicle location updated."
    }), 200


# -------------------------------
# Find Available Vehicles
# -------------------------------
@admin_bp.route("/available-vehicles/<int:zone_id>", methods=["GET"])
@token_required
def available_vehicles(current_admin, zone_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM vehicles
        WHERE
            zone_id=%s
            AND status='Available'
        """,
        (zone_id,)
    )

    vehicles = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "count": len(vehicles),
        "vehicles": vehicles
    })

# -------------------------------
# Find & Assign Nearest Vehicle
# -------------------------------
@admin_bp.route("/nearest-vehicle", methods=["POST"])
@token_required
def nearest_vehicle(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({
            "message": "Access denied"
        }), 403

    data = request.get_json()

    complaint_id = data.get("complaint_id")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get complaint location
    cursor.execute(
        """
        SELECT
            complaint_id,
            latitude,
            longitude,
            zone_id
        FROM complaints
        WHERE complaint_id=%s
        """,
        (complaint_id,)
    )

    complaint = cursor.fetchone()

    if not complaint:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Complaint not found."
        }), 404

    complaint_lat = float(complaint["latitude"])
    complaint_lon = float(complaint["longitude"])
    zone_id = complaint["zone_id"]

    # Get all available vehicles in same zone
    cursor.execute(
        """
        SELECT *
        FROM vehicles
        WHERE
            zone_id=%s
            AND status='Available'
            AND current_latitude IS NOT NULL
            AND current_longitude IS NOT NULL
        """,
        (zone_id,)
    )

    vehicles = cursor.fetchall()

    if not vehicles:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "No available vehicle found."
        }), 404

    nearest = None
    shortest_distance = float("inf")

    for vehicle in vehicles:

        distance = (
            (complaint_lat - float(vehicle["current_latitude"])) ** 2 +
            (complaint_lon - float(vehicle["current_longitude"])) ** 2
        ) ** 0.5

        if distance < shortest_distance:
            shortest_distance = distance
            nearest = vehicle

    # Assign vehicle to complaint
    cursor.execute(
        """
        UPDATE complaints
        SET vehicle_id=%s
        WHERE complaint_id=%s
        """,
        (
            nearest["vehicle_id"],
            complaint_id
        )
    )

    # Update vehicle status
    cursor.execute(
        """
        UPDATE vehicles
        SET status='On Route'
        WHERE vehicle_id=%s
        """,
        (
            nearest["vehicle_id"],
        )
    )

    conn.commit()
    nearest["status"] = "On Route"
    cursor.close()
    conn.close()

    return jsonify({
        "message": "Nearest vehicle assigned successfully.",
        "distance": shortest_distance,
        "vehicle": nearest
    }), 200

# -------------------------------
# Assign Vehicle To Complaint
# -------------------------------
@admin_bp.route("/assign-vehicle", methods=["POST"])
@token_required
def assign_vehicle(current_admin):

    data = request.get_json()

    complaint_id = data.get("complaint_id")
    vehicle_id = data.get("vehicle_id")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE complaints
        SET vehicle_id=%s
        WHERE complaint_id=%s
        """,
        (
            vehicle_id,
            complaint_id
        )
    )

    cursor.execute(
        """
        UPDATE vehicles
        SET status='On Route'
        WHERE vehicle_id=%s
        """,
        (vehicle_id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Vehicle assigned successfully."
    }), 200  
    
    # -------------------------------
# Get All Supervisors
# -------------------------------
@admin_bp.route("/supervisors", methods=["GET"])
@token_required
def get_supervisors(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({"message": "Access denied"}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        
    SELECT
            s.supervisor_id,
            s.full_name,
            s.mobile_number,
            s.email,
            s.status,
            z.zone_name
        FROM supervisors s
        JOIN zones z
            ON s.zone_id = z.zone_id
        ORDER BY s.full_name;
    """)

    supervisors = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "supervisors": supervisors
    })

# -------------------------------
# Get Admin Profile
# -------------------------------
@admin_bp.route("/profile", methods=["GET"])
@token_required
def get_admin_profile(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({"message": "Access denied"}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                employee_id,
                full_name,
                email,
                mobile_number,
                designation
            FROM admins
            WHERE admin_id = %s
        """, (current_admin["admin_id"],))

        admin = cursor.fetchone()

        if not admin:
            return jsonify({"message": "Admin not found"}), 404

        return jsonify(admin), 200

    finally:
        cursor.close()
        conn.close()     

# -------------------------------
# Update Admin Profile
# -------------------------------
@admin_bp.route("/profile", methods=["PUT"])
@token_required
def update_admin_profile(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({"message": "Access denied"}), 403

    data = request.get_json()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE admins
            SET
                full_name = %s,
                email = %s,
                mobile_number = %s,
                designation = %s
            WHERE admin_id = %s
        """, (
            data["name"],
            data["email"],
            data["phone"],
            data["role"],
            current_admin["admin_id"]
        ))

        conn.commit()

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()  
        
# ----------------------------------------------------
# Get Admin Notifications
# ----------------------------------------------------
@admin_bp.route("/notifications", methods=["GET"])
@token_required
def get_admin_notifications(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({"message": "Access denied"}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            notification_id,
            title,
            message,
            is_read,
            created_at
        FROM admin_notifications
        WHERE admin_id = %s
        ORDER BY notification_id DESC
    """, (current_admin["admin_id"],))

    notifications = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "notifications": notifications
    }), 200 
    
# ----------------------------------------------------
# Mark Admin Notification Read
# ----------------------------------------------------
@admin_bp.route("/notification-read/<int:notification_id>", methods=["PUT"])
@token_required
def mark_admin_notification_read(current_admin, notification_id):

    if current_admin["role"] != "Admin":
        return jsonify({"message": "Access denied"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE admin_notifications
        SET is_read = TRUE
        WHERE notification_id = %s
          AND admin_id = %s
    """, (
        notification_id,
        current_admin["admin_id"]
    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Notification marked as read."
    }), 200 
# ----------------------------------------------------
# Clear Admin Notifications
# ----------------------------------------------------
@admin_bp.route("/notifications", methods=["DELETE"])
@token_required
def clear_admin_notifications(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({"message": "Access denied"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM admin_notifications
        WHERE admin_id = %s
    """, (current_admin["admin_id"],))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "All notifications cleared."
    }), 200   
    
# -------------------------------
# Change Admin Password
# -------------------------------
@admin_bp.route("/change-password", methods=["PUT"])
@token_required
def change_admin_password(current_admin):

    if current_admin["role"] != "Admin":
        return jsonify({"message": "Access denied"}), 403

    data = request.get_json()

    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")

    if new_password != confirm_password:
        return jsonify({"message": "Passwords do not match"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE admins
            SET password = %s,
                must_change_password = FALSE
            WHERE admin_id = %s
        """, (
            new_password,
            current_admin["admin_id"]
        ))

        conn.commit()

        return jsonify({
            "message": "Password changed successfully"
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"message": str(e)}), 500

    finally:
        cursor.close()
        conn.close()                      