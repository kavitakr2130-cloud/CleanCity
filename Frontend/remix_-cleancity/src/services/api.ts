export const BASE_URL = "http://127.0.0.1:5000";

// ---------------------------
// Citizen APIs
// ---------------------------

export const sendOtp = async (mobile_number: string) => {
  const response = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mobile_number,
    }),
  });

  return response.json();
};

export const verifyOtp = async (
  mobile_number: string,
  otp: string
) => {
  const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mobile_number,
      otp,
    }),
  });

  return response.json();
};

// ---------------------------
// Google Login
// ---------------------------

export const googleLogin = async (credential: string) => {
  const response = await fetch(`${BASE_URL}/auth/google-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      credential,
    }),
  });

  return response.json();
};

export const completeGoogleRegistration = async (
  email: string,
  full_name: string,
  mobile_number: string,
  dob: string
) => {
  const response = await fetch(`${BASE_URL}/auth/google-register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      full_name,
      mobile_number,
      dob,
    }),
  });

  return response.json();
};

// ---------------------------
// Admin Login
// ---------------------------

export const adminLogin = async (
  login: string,
  password: string
) => {
  const response = await fetch(`${BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login,
      password,
    }),
  });

  return response.json();
};

// ---------------------------
// Supervisor Login
// ---------------------------

export const supervisorLogin = async (
  login: string,
  password: string
) => {
  const response = await fetch(`${BASE_URL}/auth/supervisor/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      login,
      password,
    }),
  });

 const data = await response.json();
console.log("Supervisor API:", response.status, data);
return data;
};

// ---------------------------
// worker login
// ---------------------------

export const workerLogin = async (login: string, password: string) => {
  const response = await fetch("http://127.0.0.1:5000/worker/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      login,
      password
    })
  });

  return await response.json();
};

// ---------------------------
// Dashboard
// ---------------------------

export const getProfile = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/citizen/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

// ---------------------------
// Update Profile
// ---------------------------

export const updateProfile = async (
  full_name: string,
  email: string,
  mobile_number: string,
  profile_photo?: File | null
) => {
  const token = localStorage.getItem("token");

  const formData = new FormData();

  formData.append("full_name", full_name);
  formData.append("email", email);
  formData.append("mobile_number", mobile_number);

  if (profile_photo) {
    formData.append("profile_photo", profile_photo);
  }

  const response = await fetch(`${BASE_URL}/citizen/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};

// ---------------------------
// Get My Complaints
// ---------------------------

export const getMyComplaints = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/citizen/my-complaints`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};

// ---------------------------
// Get Single Complaint
// ---------------------------

export const getComplaintById = async (complaintId: number | string) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/citizen/complaint/${complaintId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// ---------------------------
// Submit Complaint
// ---------------------------

export const submitComplaint = async (formData: FormData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/citizen/submit-complaint`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};

// ---------------------------
// Analyze Complaint (AI Only)
// ---------------------------

export const analyzeComplaint = async (formData: FormData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/citizen/analyze-complaint`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  return response.json();
};

// ---------------------------
// Admin - All Complaints
// ---------------------------

export const getAllComplaints = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/admin/all-complaints`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

export const getSupervisors = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch("http://127.0.0.1:5000/admin/supervisors", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};
export const getWorkers = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    "http://127.0.0.1:5000/supervisor/workers",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
}; 

export const assignSupervisor = async (
  complaint_id: number,
  supervisor_id: number
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/admin/assign-supervisor`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        complaint_id,
        supervisor_id,
      }),
    }
  );

  return response.json();
};

export const assignWorker = async (
  complaint_id: number,
 worker_id: number,
  vehicle_id: number
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/supervisor/assign-worker`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        complaint_id,
        worker_id,
  vehicle_id,
      }),
    }
  );

  return response.json();
};
// ---------------------------
// Supervisor - Assigned Complaints
// ---------------------------

export const getSupervisorComplaints = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/supervisor/assigned-complaints`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// ---------------------------
// Worker - Assigned Complaints
// ---------------------------

export const getWorkerComplaints = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/worker/assigned-complaints`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// ---------------------------
// Worker - Start Work
// ---------------------------

export const startWorkerTask = async (complaintId: number) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/worker/start-work`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        complaint_id: complaintId,
      }),
    }
  );

  return response.json();
};

// --------------------------------
// Supervisor - Available Workers
// -------------------------------

export const getAvailableWorkers = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/supervisor/available-workers`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// --------------------------------
// Supervisor - Available Vehicles
// -------------------------------

export const getAvailableVehicles = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/supervisor/available-vehicles`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// ---------------------------
// Worker Dashboard Data
// ---------------------------
export const getWorkerDashboardData = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
     "http://127.0.0.1:5000/worker/dashboard-data",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await response.json();
};



export const completeComplaint = async (
  complaintId: number,
  image: File
) => {

  const token = localStorage.getItem("token");

  const formData = new FormData();

  formData.append("complaint_id", String(complaintId));
  formData.append("image", image);

const response = await fetch(
  "http://127.0.0.1:5000/worker/complete-complaint",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  return response.json();
};
// ---------------------------
// Supervisor - Verify Complaint
// ---------------------------

export const verifyComplaint = async (
  complaintId: number
) => {

  const token = localStorage.getItem("token");

  const response = await fetch(
    "http://127.0.0.1:5000/supervisor/verify-complaint",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        complaint_id: complaintId,
      }),
    }
  );

  return await response.json();

};

// ---------------------------
// Citizen - Pending Feedback
// ---------------------------

export const getPendingFeedback = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/citizen/pending-feedback`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// ---------------------------
// Get Notifications
// ---------------------------
export const getNotifications = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/citizen/notifications`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// ---------------------------
// Mark Notification Read
// ---------------------------
export const markNotificationRead = async (notificationId: number) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/citizen/notification-read/${notificationId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// ---------------------------
// Clear Notifications
// ---------------------------
export const clearNotificationsAPI = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/citizen/clear-notifications`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};

// ---------------------------
// Citizen - Submit Feedback
// ---------------------------

export const submitFeedback = async (
  complaint_id: number,
  resolution_quality: number,
  worker_conduct: number,
  overall_experience: number,
  comment: string
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/citizen/submit-feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        complaint_id,
        resolution_quality,
        worker_conduct,
        overall_experience,
        comment,
      }),
    }
  );

  return response.json();
};

export const getAdminNotifications = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/admin/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json();
};

export const markAdminNotificationRead = async (id: number) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/admin/notification-read/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json();
};

export const clearAdminNotifications = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/admin/notifications`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json();
};

export const getSupervisorNotifications = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/supervisor/notifications`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};