import React, { useEffect, useState } from "react";
import {
  getWorkerDashboardData,

  completeComplaint,
} from "../../services/api";

const WorkerDashboard = () => {

  const [worker, setWorker] = useState<any>(null);

  const [kpi, setKpi] = useState<any>(null);

  const [complaints, setComplaints] = useState<any[]>([]);
  const [completedHistory, setCompletedHistory] = useState<any[]>([]);

  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
const [showCompleted, setShowCompleted] = useState(false);
const [showResolved, setShowResolved] = useState(false);


  const [afterImage, setAfterImage] = useState<File | null>(null);

  useEffect(() => {

    loadDashboard();

  }, []);

const loadDashboard = async () => {

  setSelectedComplaint(null);

  try {

      const data = await getWorkerDashboardData();
      console.log("WORKER DASHBOARD DATA:", data);
      console.log("WORKER ZONE NAME:", data.worker?.zone_name);


      setWorker(data.worker);

      setKpi(data.kpi);

      setComplaints(data.complaints);
      setCompletedHistory(data.completed_history);

  
    } catch (err) {

      console.log(err);

    }

  };

  {/* 
const handleStartWork = async () => {

  if (!selectedComplaint) return;

  try {

    await startWorkerTask(selectedComplaint.complaint_id);

    setSelectedComplaint({
      ...selectedComplaint,
      status: "In Progress",
    });

    loadDashboard();

  } catch (err) {

    console.log(err);

    alert("Failed to start work");

  }

};
 */}

const handleCompleteComplaint = async () => {
    console.log("Mark Completed clicked");

  if (!selectedComplaint) return;

  if (!afterImage) {

    alert("Please upload After Image.");

    return;

  }

 await completeComplaint(
  selectedComplaint.complaint_id,
  afterImage
);

alert("Sent for Verification");

setComplaints((prev) =>
  prev.filter(
    (c) => c.complaint_id !== selectedComplaint.complaint_id
  )
);

setSelectedComplaint(null);

setAfterImage(null);

loadDashboard();

};

  return (

    <div className="p-8 bg-slate-100 min-h-screen">
{/* Header */}

<h1 className="text-3xl font-bold text-slate-800">
  Worker Dashboard
</h1>

<p className="text-sm text-slate-500 mt-1">
  Zone : {worker?.zone_name ?? "Loading..."}
</p>

{/* Worker Profile */}

<div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mt-6 sm:mt-8">

  <div className="flex items-center">

    <div className="flex items-center gap-4 sm:gap-5">

    

      <div>

       <h2 className="text-2xl font-bold">
  {worker?.full_name ?? "Loading..."}
</h2>

<p className="text-sm text-slate-500 mt-1">
  Employee ID : {worker?.employee_id ?? "--"}
</p>



<p
  className={`text-sm font-semibold mt-2 ${
    worker?.status === "Available"
      ? "text-green-600"
      : "text-orange-600"
  }`}
>
  {worker?.status ?? "--"}
</p>

      </div>

    </div>

  </div>

</div>

{/* KPI */}

<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">

  {/* Total Tasks */}
  <div className="bg-white rounded-xl shadow-sm p-5">
    <p className="text-sm text-slate-500">
      Total Tasks
    </p>

    <h2 className="text-3xl font-bold mt-2">
      {kpi?.total_tasks || 0}
    </h2>
  </div>


  {/* Verification */}
  <div
    onClick={() => setShowCompleted(true)}
    className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:bg-slate-50 transition"
  >
    <p className="text-sm text-slate-500">
      Verification
    </p>

    <h2 className="text-3xl font-bold text-orange-600 mt-2">
      {kpi?.verification || 0}
    </h2>
  </div>


  {/* Resolved */}
<div
  onClick={() => setShowResolved(true)}
  className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:bg-slate-50 transition"
>
  <p className="text-sm text-slate-500">
    Resolved
  </p>

  <h2 className="text-3xl font-bold text-green-600 mt-2">
    {kpi?.resolved || 0}
  </h2>
</div>

</div>
{/* Main Section */}

<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">

  {/* Left Side */}

  <div className="col-span-1 lg:col-span-4">

    <div className="bg-white rounded-2xl shadow-sm p-5">

   <div className="flex justify-between items-center mb-4">

  <h2 className="text-lg font-semibold text-slate-800">
  {showResolved
  ? "Resolved Jobs"
  : showCompleted
  ? "Verification Jobs"
  : "My Tasks"}
  </h2>

  {showCompleted && (
    <button
      onClick={() => {
  setShowCompleted(false);
  setShowResolved(false);
}}
      className="text-sm text-blue-600 hover:underline"
    >
      ← Back to My Tasks
    </button>
  )}

</div>

   {(showResolved
  ? completedHistory.filter((item: any) => item.status === "Resolved")
  : showCompleted
  ? completedHistory.filter((item: any) => item.status === "Verification")
  : complaints
).length > 0 ? (

       <div className="space-y-3 max-h-[500px] overflow-y-auto">

{(showResolved
  ? completedHistory.filter((item: any) => item.status === "Resolved")
  : showCompleted
  ? completedHistory.filter((item: any) => item.status === "Verification")
  : complaints
).map((item: any) => (

    <div
      key={item.complaint_id}
      onClick={() => setSelectedComplaint(item)}
      className={`border rounded-xl p-4 cursor-pointer transition

      ${
        selectedComplaint?.complaint_id === item.complaint_id
          ? "border-green-600 bg-green-50"
          : "border-slate-200 hover:bg-slate-50"
      }`}
    >

      <div className="flex justify-between">

       <div className="flex items-center gap-2">

  <div
    className={`w-3 h-3 rounded-full ${
      item.status === "In Progress"
        ? "bg-orange-500"
        : "bg-blue-600"
    }`}
  ></div>

  <span className="font-semibold">
    {item.complaint_code}
  </span>

</div>

        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
          {item.priority}
        </span>

      </div>

      <p className="text-sm text-slate-500 mt-2">
        {item.category}
      </p>

      <p className="text-xs text-slate-400 mt-1">
        {item.address}
      </p>

    </div>

  ))}

</div>
      ) : (

        <div className="space-y-3">
  {(showResolved
  ? completedHistory.filter((item: any) => item.status === "Resolved")
  : showCompleted
  ? completedHistory.filter((item: any) => item.status === "Verification")
  : complaints
).map((item: any) => (
            <div
              key={item.complaint_id}
              onClick={() => setSelectedComplaint(item)}
              className={`cursor-pointer rounded-xl border p-4 transition-all
              ${
                selectedComplaint?.complaint_id === item.complaint_id
                  ? "border-green-600 bg-green-50"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
  <div
    className={`w-3 h-3 rounded-full ${
      item.status === "In Progress"
        ? "bg-orange-500"
        : "bg-blue-600"
    }`}
  ></div>
  <span className="font-semibold">
    {item.complaint_code}
  </span>
</div>
             <span
  className={`text-xs px-2 py-1 rounded-full ${
    showCompleted
      ? item.status === "Verification"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700"
      : item.priority === "High"
      ? "bg-red-100 text-red-600"
      : item.priority === "Medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700"
  }`}
>
  {showCompleted ? item.status : item.priority}
</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {item.category}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {item.address}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  {/* Right Side */}
<div className="col-span-1 lg:col-span-8">
  <div className="bg-white rounded-2xl shadow-sm p-6">
    {selectedComplaint ? (
<div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
  <div>
    <p className="text-sm font-semibold text-slate-600 mb-2">
      Before Cleaning
    </p>
    <img
      src={
        selectedComplaint.image_before
          ? `http://127.0.0.1:5000/${selectedComplaint.image_before}`
          : "https://placehold.co/500x300?text=No+Image"
      }
      className="w-full h-64 rounded-xl object-cover"
    />
  </div>
  <div>
    <p className="text-sm font-semibold text-slate-600 mb-2">
      After Cleaning
    </p>
    <img
      src={
        afterImage
          ? URL.createObjectURL(afterImage)
          : selectedComplaint.image_after
          ? `http://127.0.0.1:5000/${selectedComplaint.image_after}`
          : "https://placehold.co/500x300?text=No+After+Image"
      }
      className="w-full h-64 rounded-xl object-cover"
    />
  </div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
  <div>
    <p className="text-sm text-slate-500">Complaint Code</p>
    <p className="font-semibold">{selectedComplaint.complaint_code}</p>
  </div>
  <div>
    <p className="text-sm text-slate-500">Status</p>
    <p className="font-semibold text-blue-600">
      {selectedComplaint.status}
    </p>
  </div>
  <div>
    <p className="text-sm text-slate-500">Category</p>
    <p className="font-semibold">
      {selectedComplaint.category}
    </p>
  </div>
  <div>
  <p className="text-sm text-slate-500">
    Vehicle Number
  </p>

  <p className="font-semibold">
    {selectedComplaint.vehicle_number || "--"}
  </p>
</div>

<div>
  <p className="text-sm text-slate-500">
    Vehicle Type
  </p>

  <p className="font-semibold">
    {selectedComplaint.vehicle_type || "--"}
  </p>
</div>

<div className="col-span-2">
  <p className="text-sm text-slate-500">Address</p>
  <p>{selectedComplaint.address}</p>
</div>
  <div className="col-span-2">
    <p className="text-sm text-slate-500">Description</p>
    <p>{selectedComplaint.description}</p>
  </div>
</div>
<div className="flex flex-wrap gap-4 mt-8">
{!showCompleted && (
  selectedComplaint.status === "Assigned" ? (
 <div className="w-full sm:w-auto bg-orange-100 text-orange-700 px-6 py-3 rounded-xl font-semibold text-center">
  Awaiting Dispatch
</div>

) : selectedComplaint.status === "In Progress" ? (

  <button
    disabled
   className="w-full sm:w-auto bg-orange-500 text-white px-6 py-3 rounded-xl cursor-not-allowed"
  >
    In Progress
  </button>

) : selectedComplaint.status === "Verification" ? (

  <button
    disabled
   className="w-full sm:w-auto bg-yellow-500 text-white px-6 py-3 rounded-xl cursor-not-allowed"
  >
    Awaiting Verification
  </button>

) : (

  <button
    disabled
    className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-xl cursor-not-allowed"
  >
    Resolved
  </button>
)
)}
{!showCompleted && (
<label className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-xl cursor-pointer">
  Upload After
  <input
    type="file"
    hidden
    accept="image/*"
    onChange={(e)=>
      setAfterImage(
        e.target.files
          ? e.target.files[0]
          : null
      )
    }
  />
</label>
)}

{!showCompleted && (

<button
  onClick={handleCompleteComplaint}
 className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-xl"
>
  Mark Completed
</button>

)}
</div>

</div>

) : (

  <p className="text-slate-500">
    Select a complaint.
  </p>
)}
</div>
</div>
</div>
</div>
);
};
export default WorkerDashboard;