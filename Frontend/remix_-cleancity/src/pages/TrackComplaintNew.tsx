import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getComplaintById } from "../services/api";

export const TrackComplaint: React.FC = () => {
  const { id } = useParams();

  const [complaint, setComplaint] = useState<any>(null);

  useEffect(() => {
    const loadComplaint = async () => {
      try {
        const data = await getComplaintById(id!);
        console.log("Complaint:", data.complaint);
        setComplaint(data.complaint);
      } catch (err) {
        console.error(err);
      }
    };

    loadComplaint();
  }, [id]);

 if (!complaint) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  );
}

return (
  <div className="max-w-3xl mx-auto p-6">
    <h1 className="text-3xl font-bold mb-6">Complaint Details</h1>

    <img
      src={`http://127.0.0.1:5000/${complaint.image_before.replace(/\\/g, "/")}`}
      alt="Complaint"
      className="w-full h-72 object-cover rounded-xl mb-6"
    />

    <div className="space-y-3 bg-white p-6 rounded-xl shadow">

      <p><b>Complaint Code:</b> {complaint.complaint_code}</p>

      <p><b>Description:</b> {complaint.description}</p>

      <p><b>Category:</b> {complaint.category}</p>

      <p><b>Priority:</b> {complaint.priority}</p>

      <p><b>Status:</b> {complaint.status}</p>

      <p><b>Submitted:</b> {new Date(complaint.submitted_at).toLocaleString()}</p>

      <p><b>Address:</b> {complaint.address}</p>

      <hr />

      <p><b>AI Category:</b> {complaint.ai_category}</p>

      <p><b>AI Confidence:</b> {complaint.ai_confidence}</p>

      <p><b>AI Reason:</b> {complaint.ai_reason}</p>

    </div>
  </div>
);
};