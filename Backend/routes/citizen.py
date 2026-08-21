from flask import Blueprint, jsonify, request
import os
import json
from werkzeug.utils import secure_filename
from database import get_db_connection
from auth_middleware import token_required
from google import genai
from config import Config
from google.genai import types
import uuid


print("Gemini Key:", Config.GEMINI_API_KEY)

client = genai.Client(api_key=Config.GEMINI_API_KEY)

citizen_bp = Blueprint("citizen", __name__)

UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# -------------------------------
# Test API
# -------------------------------
@citizen_bp.route("/test", methods=["GET"])
def test():
    return jsonify({
        "message": "Citizen Module Working Successfully!"
    })
# -------------------------------------------------
# Profile API
# -------------------------------------------------
@citizen_bp.route("/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    print("TOKEN DATA:", current_user)

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            u.user_id,
            u.full_name,
            u.mobile_number,
            u.email,
            u.role,
            u.is_verified,
            u.clean_points,
            u.profile_photo,
            u.created_at,

            (
                SELECT COUNT(*)
                FROM complaints c
                WHERE c.citizen_id = u.user_id
            ) AS total_complaints,

            (
                SELECT COUNT(*)
                FROM complaints c
                WHERE c.citizen_id = u.user_id
                AND c.status = 'Submitted'
            ) AS submitted_complaints,

            (
                SELECT COUNT(*)
                FROM complaints c
                WHERE c.citizen_id = u.user_id
                AND c.status = 'Resolved'
            ) AS resolved_complaints

        FROM users u
        WHERE u.user_id = %s
        """,
        (current_user["user_id"],)
    )

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({
            "message": "Citizen not found"
        }), 404

    return jsonify({
        "message": "Profile fetched successfully",
        "user": user
    }), 200
    
# -------------------------------------------------
# Get Citizen Notifications
# -------------------------------------------------
@citizen_bp.route("/notifications", methods=["GET"])
@token_required
def get_notifications(current_user):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            notification_id,
            title,
            message,
            notification_type,
            is_read,
            created_at
        FROM notifications
        WHERE user_id=%s
        ORDER BY created_at DESC
    """, (current_user["user_id"],))

    notifications = cursor.fetchall()

    for n in notifications:
        if n["created_at"]:
            n["created_at"] = n["created_at"].strftime("%Y-%m-%d %H:%M:%S")

    cursor.close()
    conn.close()

    return jsonify({
        "notifications": notifications
    }), 200    
    
# -------------------------------------------------
# Mark Notification Read
# -------------------------------------------------
@citizen_bp.route("/notification-read/<int:notification_id>", methods=["PUT"])
@token_required
def mark_notification_read(current_user, notification_id):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE notifications
        SET is_read=TRUE
        WHERE notification_id=%s
        AND user_id=%s
    """, (
        notification_id,
        current_user["user_id"]
    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Notification marked as read"
    }), 200   

# -------------------------------------------------
# Clear Notifications
# -------------------------------------------------
@citizen_bp.route("/clear-notifications", methods=["DELETE"])
@token_required
def clear_notifications(current_user):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM notifications
        WHERE user_id=%s
    """, (
        current_user["user_id"],
    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Notifications cleared"
    }), 200     
    
# -------------------------------------------------
# Update Profile API
# -------------------------------------------------
@citizen_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user):

    full_name = request.form.get("full_name")
    email = request.form.get("email")
    mobile_number = request.form.get("mobile_number")

    profile_photo = request.files.get("profile_photo")

    profile_photo_path = None

    # Save profile photo if uploaded
    if profile_photo:
        filename = f"{uuid.uuid4().hex}_{secure_filename(profile_photo.filename)}"
        profile_photo_path = os.path.join(UPLOAD_FOLDER, filename)

        profile_photo.save(profile_photo_path)

    conn = get_db_connection()
    cursor = conn.cursor()

    if profile_photo_path:
        cursor.execute(
            """
            UPDATE users
            SET
                full_name = %s,
                email = %s,
                mobile_number = %s,
                profile_photo = %s
            WHERE user_id = %s
            """,
            (
                full_name,
                email,
                mobile_number,
                profile_photo_path,
                current_user["user_id"]
            )
        )
    else:
        cursor.execute(
            """
            UPDATE users
            SET
                full_name = %s,
                email = %s,
                mobile_number = %s
            WHERE user_id = %s
            """,
            (
                full_name,
                email,
                mobile_number,
                current_user["user_id"]
            )
        )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Profile updated successfully",
        "profile_photo": profile_photo_path
    }), 200   
    
# -------------------------------
# Analyze only (NEW)
# -------------------------------

@citizen_bp.route("/analyze-complaint", methods=["POST"])
@token_required
def analyze_complaint(current_user):  
    
    image = request.files.get("image")
    category = request.form.get("category")
    description = request.form.get("description")  
    filename = f"{uuid.uuid4().hex}_{secure_filename(image.filename)}"
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    image.save(image_path)
    # -------------------------------------------------
    # AI Complaint Analysis
    # -------------------------------------------------
    
    ai_category = category
    ai_priority = "Medium"
    ai_confidence = 0
    ai_reason = "AI not available"
    
    try:
    
                prompt = f"""
            You are an AI for Smart Grievance Management.
    
            Analyze BOTH the uploaded image and the complaint description.
    
            Citizen Selected Category:
            {category}
    
            Description:
            {description}
    
            Return ONLY valid JSON.
    
            {{
                "category":"",
                "priority":"",
                "confidence":0,
                "reason":""
            }}
    
            Categories allowed:
            Household
            Plastic
            Construction
            Hazardous
            Other
    
            Priority allowed:
            Low
            Medium
            High
    
            If the image contains:
            - Chemical drums
            - Toxic liquid
            - Medical waste
            - Industrial waste
            - Oil leakage
            - Dangerous chemicals
    
            Always classify as Hazardous.
    
            Use BOTH the image and description before deciding.
            """
    
                with open(image_path, "rb") as f:
                    image_bytes = f.read()

                response = client.models.generate_content(
                   model="gemini-3.5-flash",
                    contents=[
                        prompt,
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=image.mimetype,
                        ),
                    ],
                )
                print(response.text)
                clean_text = response.text.replace("```json", "").replace("```", "").strip()
                result = json.loads(clean_text)
                print("Gemini Result:", result)
            
    
                ai_category = result["category"]
                ai_priority = result["priority"]
                ai_confidence = result["confidence"]
                ai_reason = result["reason"]
    
    except Exception as e:
                import traceback
                traceback.print_exc()
    
                ai_category = category
                ai_priority = "Medium"
                ai_confidence = 0
                ai_reason = "AI not available"
    return jsonify({
    "ai_category": ai_category,
    "priority": ai_priority,
    "confidence": ai_confidence,
    "reason": ai_reason
}), 200            
                
         

# -------------------------------
# Submit Complaint
# -------------------------------
@citizen_bp.route("/submit-complaint", methods=["POST"])
@token_required
def submit_complaint(current_user):

        image = request.files.get("image")

        citizen_id = current_user["user_id"]
        zone_id = request.form.get("zone_id")
        category = request.form.get("category")
        description = request.form.get("description")
        latitude = request.form.get("latitude")
        longitude = request.form.get("longitude")
        address = request.form.get("address")

        if image is None:
            return jsonify({
                "message": "Image is required"
            }), 400

        filename = f"{uuid.uuid4().hex}_{secure_filename(image.filename)}"
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        image.save(image_path)

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # -------------------------------------------------
        # Duplicate Complaint Detection
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                complaint_id,
                complaint_code,
                latitude,
                longitude
            FROM complaints
            WHERE
                citizen_id=%s
                AND category=%s
                AND submitted_at>=NOW()-INTERVAL 1 DAY
            """,
            (
                citizen_id,
                category
            )
        )
        
        print("Citizen ID:", citizen_id)
        print("Category:", category)
        print("Latitude:", latitude)
        print("Longitude:", longitude)


        existing = cursor.fetchall()
        print("Existing complaints:", existing)
       
        current_lat = float(latitude)
        current_lon = float(longitude)

        for complaint in existing:

            old_lat = float(complaint["latitude"])
            old_lon = float(complaint["longitude"])

            if (
                abs(current_lat-old_lat) <= 0.0003
                and
                abs(current_lon-old_lon) <= 0.0003
            ):

                cursor.close()
                conn.close()

                return jsonify({
                    "message": "You have already reported this issue within the last 24 hours.",
                    "existing_complaint": complaint["complaint_code"]
                }),409
        # -------------------------------------------------
        # AI Complaint Analysis
        # -------------------------------------------------

        ai_category = category
        ai_priority = "Medium"
        ai_confidence = 0
        ai_reason = "AI not available"

        try:

            prompt = f"""
        You are an AI for Smart Grievance Management.

        Analyze BOTH the uploaded image and the complaint description.

        Citizen Selected Category:
        {category}

        Description:
        {description}

        Return ONLY valid JSON.

        {{
            "category":"",
            "priority":"",
            "confidence":0,
            "reason":""
        }}

        Categories allowed:
        Household
        Plastic
        Construction
        Hazardous
        Other

        Priority allowed:
        Low
        Medium
        High

        If the image contains:
        - Chemical drums
        - Toxic liquid
        - Medical waste
        - Industrial waste
        - Oil leakage
        - Dangerous chemicals

        Always classify as Hazardous.

        Use BOTH the image and description before deciding.
        """

            with open(image_path, "rb") as f:
                image_bytes = f.read()

            response =  client.models.generate_content(
                 model="gemini-3.5-flash",
                 contents=[
                    prompt,
                     types.Part.from_bytes(
            data=image_bytes,
            mime_type=image.mimetype,
                     ),
                    
                ]
            )
            print(response.text)
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean_text)
            print("Gemini Result:", result)
        

            ai_category = result["category"]
            ai_priority = result["priority"]
            ai_confidence = result["confidence"]
            ai_reason = result["reason"]

        except Exception as e:
            import traceback
            traceback.print_exc()

            ai_category = category
            ai_priority = "Medium"
            ai_confidence = 0
            ai_reason = "AI not available"
            
        #     return jsonify({
        #     "ai_category": ai_category,
        #     "priority": ai_priority,
        #     "confidence": ai_confidence,
        #     "reason": ai_reason
        # }), 200
            
     # TODO: Create "AI Analysis Completed" notification here

    # -------------------------------------------------
    # Insert Complaint
    # -------------------------------------------------

        query = """
        INSERT INTO complaints
        (
            citizen_id,
            zone_id,
            image_before,
            category,
            ai_category,
            ai_confidence,
            ai_reason,
            priority,
            description,
            latitude,
            longitude,
            address
        )
        VALUES
        (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        cursor.execute(
            query,
            (
                citizen_id,
                zone_id,
                f"uploads/{filename}",
                category,
                ai_category,
                ai_confidence,
                ai_reason,
                ai_priority,
                description,
                latitude,
                longitude,
                address
            )
        )

        conn.commit()

        complaint_id = cursor.lastrowid

        complaint_code = f"CC{complaint_id:06d}"

        cursor.execute(
            """
            UPDATE complaints
            SET complaint_code=%s
            WHERE complaint_id=%s
            """,
            (
                complaint_code,
                complaint_id
            )
        )

        conn.commit()
        # -------------------------------------------------
        # Create Notification for Citizen
        # -------------------------------------------------

        cursor.execute(
            """
            INSERT INTO notifications
            (
                user_id,
                title,
                message,
                notification_type
            )
            VALUES
            (%s,%s,%s,%s)
            """,
            (
                citizen_id,
                "Complaint Submitted",
                f"Your complaint {complaint_code} has been submitted successfully and is waiting for verification.",
                "Complaint"
            )
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Complaint Submitted Successfully",
            "complaint_id": complaint_id,
            "complaint_code": complaint_code,
            "citizen_category": category,
            "ai_category": ai_category,
            "priority": ai_priority,
            "confidence": ai_confidence,
            "reason": ai_reason
        }), 201

# -------------------------------
# View My Complaints
# -------------------------------


@citizen_bp.route("/my-complaints", methods=["GET"])
@token_required
def my_complaints(current_user):

    citizen_id = current_user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT
    c.complaint_id,
    c.complaint_code,
    c.category,
    c.ai_category,
    c.ai_confidence,
    c.ai_reason,
    c.description,
    c.priority,
    c.status,
    c.submitted_at,
    c.image_before,

    w.full_name AS worker_name,
    v.vehicle_number AS vehicle_number

FROM complaints c

LEFT JOIN workers w
    ON c.worker_id = w.worker_id

LEFT JOIN vehicles v
    ON c.vehicle_id = v.vehicle_id

WHERE c.citizen_id = %s

ORDER BY c.complaint_id DESC
"""

    cursor.execute(query, (citizen_id,))
    complaints = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "count": len(complaints),
        "complaints": complaints
    })  
# -------------------------------------------------
# Complaint Statistics API
# -------------------------------------------------
@citizen_bp.route("/complaint-stats", methods=["GET"])
@token_required
def complaint_stats(current_user):

    citizen_id = current_user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            COUNT(*) AS total,
            SUM(status='Submitted') AS submitted,
            SUM(status='Assigned') AS assigned,
            SUM(status='In Progress') AS in_progress,
            SUM(status='Verification') AS verification,
            SUM(status='Resolved') AS resolved
        FROM complaints
        WHERE citizen_id=%s
    """, (citizen_id,))

    stats = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(stats), 200  

# -------------------------------------------------
# Clean Points API
# -------------------------------------------------
@citizen_bp.route("/clean-points", methods=["GET"])
@token_required
def clean_points(current_user):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            clean_points
        FROM users
        WHERE user_id=%s
        """,
        (current_user["user_id"],)
    )

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({
            "message": "Citizen not found"
        }), 404

    return jsonify({
        "clean_points": user["clean_points"]
    }), 200  
    
# -------------------------------
# Update Complaint
# -------------------------------
@citizen_bp.route("/update-complaint/<int:complaint_id>", methods=["PUT"])
@token_required
def update_complaint(current_user, complaint_id):

    data = request.get_json()

    category = data.get("category")
    description = data.get("description")
    address = data.get("address")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check if complaint exists
    cursor.execute(
    """
    SELECT status
    FROM complaints
    WHERE complaint_id = %s
      AND citizen_id = %s
    """,
    (
        complaint_id,
        current_user["user_id"]
    )
)

    complaint = cursor.fetchone()

    if not complaint:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Complaint not found."
        }), 404

    # Allow update only if complaint is still submitted
    if complaint["status"] != "Submitted":
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Complaint can no longer be updated."
        }), 400

    # Update complaint
    cursor.execute(
        """
        UPDATE complaints
        SET
            category = %s,
            description = %s,
            address = %s
        WHERE complaint_id = %s
        """,
        (
            category,
            description,
            address,
            complaint_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Complaint updated successfully."
    }), 200   
     
# -------------------------------
# Delete Complaint
# -------------------------------
@citizen_bp.route("/delete-complaint/<int:complaint_id>", methods=["DELETE"])
@token_required
def delete_complaint(current_user, complaint_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
    """
    SELECT status
    FROM complaints
    WHERE complaint_id = %s
      AND citizen_id = %s
    """,
    (
        complaint_id,
        current_user["user_id"]
    )
)

    complaint = cursor.fetchone()

    if not complaint:
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Complaint not found."
        }), 404

    if complaint["status"] != "Submitted":
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Complaint cannot be deleted."
        }), 400

    cursor.execute(
        """
        DELETE FROM complaints
        WHERE complaint_id = %s
        """,
        (complaint_id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Complaint deleted successfully."
    }), 200   

# -------------------------------
# View Assigned Vehicle
# -------------------------------
@citizen_bp.route("/assigned-vehicle/<int:complaint_id>", methods=["GET"])
@token_required
def assigned_vehicle(current_user, complaint_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            c.complaint_code,
            c.status AS complaint_status,
            v.vehicle_number,
            v.vehicle_type,
            v.driver_name,
            v.driver_phone,
            v.status AS vehicle_status,
            v.current_latitude,
            v.current_longitude
        FROM complaints c
        LEFT JOIN vehicles v
            ON c.vehicle_id = v.vehicle_id
        WHERE
            c.complaint_id=%s
            AND c.citizen_id=%s
        """,
        (
            complaint_id,
            current_user["user_id"]
        )
    )

    result = cursor.fetchone()

    cursor.close()
    conn.close()

    if not result:
        return jsonify({
            "message": "Complaint not found."
        }),404

    if result["vehicle_number"] is None:
        return jsonify({
            "message":"Vehicle not assigned yet."
        }),200

    return jsonify(result),200      

# -----------------------------------------
# Get Single Complaint
# -----------------------------------------
@citizen_bp.route("/complaint/<int:complaint_id>", methods=["GET"])
@token_required
def get_single_complaint(current_user, complaint_id):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
    SELECT
        c.*,
        s.full_name AS supervisor_name,
        w.full_name AS worker_name,
        v.vehicle_number AS vehicle_number
    FROM complaints c
    LEFT JOIN supervisors s
        ON c.supervisor_id = s.supervisor_id
    LEFT JOIN workers w
        ON c.worker_id = w.worker_id
    LEFT JOIN vehicles v
        ON c.vehicle_id = v.vehicle_id
    WHERE c.complaint_id = %s
      AND c.citizen_id = %s
""", (
    complaint_id,
    current_user["user_id"]
))

    complaint = cursor.fetchone()

    cursor.close()
    conn.close()

    if not complaint:
        return jsonify({
            "message": "Complaint not found"
        }), 404
    if complaint["submitted_at"]:
       complaint["submitted_at"] = complaint["submitted_at"].strftime("%Y-%m-%d %H:%M:%S")    

    return jsonify({
        "complaint": complaint
    }), 200   
     
# ----------------------------------------------------
# Get Pending Feedback Complaints
# ----------------------------------------------------
@citizen_bp.route("/pending-feedback", methods=["GET"])
@token_required
def pending_feedback(current_user):

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            complaint_id,
            complaint_code,
            category,
            priority,
            status,
            image_before,
            submitted_at,
            address,
            description
        FROM complaints
        WHERE
            citizen_id=%s
            AND status='Resolved'
            AND feedback_given=FALSE
        ORDER BY submitted_at DESC
    """, (current_user["user_id"],))

    complaints = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "complaints": complaints
    })     
    
# ----------------------------------------------------
# Submit Feedback
# ----------------------------------------------------
@citizen_bp.route("/submit-feedback", methods=["POST"])
@token_required
def submit_feedback(current_user):

    data = request.get_json()

    complaint_id = data["complaint_id"]
    resolution_quality = data["resolution_quality"]
    worker_conduct = data["worker_conduct"]
    overall_experience = data["overall_experience"]
    comment = data["comment"]

    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert feedback
    cursor.execute("""
        INSERT INTO feedback
        (
            complaint_id,
            citizen_id,
            resolution_quality,
            worker_conduct,
            overall_experience,
            comment
        )
        VALUES
        (%s,%s,%s,%s,%s,%s)
    """, (
        complaint_id,
        current_user["user_id"],
        resolution_quality,
        worker_conduct,
        overall_experience,
        comment
    ))

    # Mark complaint as feedback submitted
    cursor.execute("""
        UPDATE complaints
        SET feedback_given = TRUE
        WHERE complaint_id = %s
    """, (complaint_id,))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Feedback submitted successfully."
    }), 200    