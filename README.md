
# CleanCity - Smart Waste Grievance Management System

## Project Overview

CleanCity is a Smart Waste Grievance Management System developed to help citizens report waste-related complaints and enable municipal authorities to manage, assign, track, verify, and resolve complaints efficiently.

The system consists of separate Frontend and Backend servers that communicate through REST APIs.

---

## Technologies Used

### Frontend
- React.js
- TypeScript
- Tailwind CSS

### Backend
- Python
- Flask
- MySQL
- JWT Authentication
- Google Gemini AI
- Flask-CORS

---

## Project Architecture

The project uses separate Frontend and Backend servers.

### Frontend Server

Navigate to the frontend folder and install the dependencies:

```bash
npm install
````

Run the frontend:

```bash
npm run dev
```

### Backend Server

Navigate to the Backend folder.

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the Flask server:

```bash
python app.py
```

---

## Database Setup

1. Install MySQL Server and MySQL Workbench.
2. Create a MySQL database named **cleancity**.
3. Import the provided **cleancity.sql** file into the `cleancity` database.
4. Configure the `.env` file with your own database and API credentials.

The provided database backup contains the required tables, relationships, and initial system data.

Previous testing records such as users, complaints, feedback, and notifications have been removed so the project can be started with a fresh system.

---

## Environment Variables

Create a `.env` file inside the Backend folder.

Add your own credentials for:

* MySQL database
* JWT Secret Key
* Gemini API Key
* Twilio credentials (if used)

Example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cleancity
JWT_SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**Do not upload the actual `.env` file or any API keys/passwords to GitHub.**

---

## Important Note

**Please move the map pin to a different location each time before submitting a complaint.**

The application includes duplicate complaint detection based on the selected map location. Submitting multiple complaints with the same category and nearby location within the configured time period may be detected as a duplicate complaint.

---

## AI Complaint Analysis

CleanCity includes Google Gemini Vision AI for analyzing complaint images and descriptions.

The AI can analyze:

* Complaint category
* Priority
* Confidence
* Reason for classification

A valid Gemini API key is required to use the AI analysis feature.

If the Gemini service is temporarily unavailable, complaint submission can still continue using the citizen-selected category and default priority.

---

## Main Features

### Citizen

* Register and log in securely.
* Submit waste-related complaints with images.
* Duplicate complaint detection based on complaint location.
* Track complaint status.
* Use Vision AI to analyze complaints.
* Submit feedback after the complaint is resolved.
* Receive complaint notifications.

### Administrator

* View all complaints submitted by citizens.
* Monitor complaint statistics and analytics.
* Assign complaints to the appropriate supervisor.
* Manage departments and zones.
* Manage supervisors.
* Receive complaint-related notifications.

### Supervisor

* View complaints assigned by the administrator.
* Assign workers and vehicles to complaints.
* Monitor complaint progress.
* Verify completed work submitted by workers.
* Receive assignment and verification notifications.

### Worker

* View assigned complaints.
* Perform cleaning operations.
* Upload "After Cleaning" images as proof of completion.
* Mark complaints as completed for supervisor verification.

---

## Complaint Workflow

1. Citizen submits a complaint.
2. Administrator reviews and assigns the complaint to a Supervisor.
3. Supervisor assigns a Worker and Vehicle.
4. Worker completes the cleaning work and uploads the after-cleaning image.
5. Supervisor verifies the completed work.
6. The complaint is marked as **Resolved**.
7. Citizens can track every stage of the complaint and view the final **Resolved (Green)** status.
8. Citizen can submit feedback after the complaint is resolved.

---

## Important Files

The project includes:

* `cleancity.sql` - Clean database backup for setting up the MySQL database.
* `requirements.txt` - Python backend dependencies.
* `package.json` - Frontend dependencies and scripts.

The following are intentionally excluded from GitHub:

* `venv/`
* `node_modules/`
* `.env`
* `uploads/`
* `__pycache__/`
* `*.pyc`

These files/folders are either recreated during setup or contain local/private data.

---

## Security

Do not share or upload:

* MySQL passwords
* Gemini API keys
* JWT secret keys
* Twilio credentials
* `.env` files
* User-uploaded complaint images containing private data

---

## Developed By

CleanCity Project


