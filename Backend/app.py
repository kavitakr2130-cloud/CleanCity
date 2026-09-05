import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from database import get_db_connection
from routes.auth import auth_bp
from routes.citizen import citizen_bp
from routes.admin import admin_bp
from routes.supervisor import supervisor_bp
from routes.worker import worker_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(citizen_bp, url_prefix="/citizen")
app.register_blueprint(admin_bp, url_prefix="/admin")
app.register_blueprint(supervisor_bp, url_prefix="/supervisor")
app.register_blueprint(worker_bp, url_prefix="/worker")

@app.route("/")
def home():
    try:
        conn = get_db_connection()
        conn.close()
        return {
            "message": "✅ CleanCity Backend Running",
            "database": "Connected Successfully"
        }
    except Exception as e:
        return {
            "message": "❌ Database Connection Failed",
            "error": str(e)
        }, 500

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    return send_from_directory(upload_folder, filename)

if __name__ == "__main__":
    app.run(debug=True)