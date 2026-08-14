import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye } from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  getSupervisorComplaints,
  getAvailableWorkers,
  getAvailableVehicles,
  assignWorker,
  verifyComplaint,
} from "../../services/api";

export const SupervisorComplaints: React.FC = () => {
  const navigate = useNavigate();
  const { authoritySubRole } = useApp();

  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = React.useState<any>(null);
const [showDetailsModal, setShowDetailsModal] = React.useState(false);
const [showAssignModal, setShowAssignModal] = React.useState(false);

const [workers, setWorkers] = React.useState<any[]>([]);
const [vehicles, setVehicles] = React.useState<any[]>([]);
const [priorityFilter, setPriorityFilter] = React.useState("");
const [categoryFilter, setCategoryFilter] = React.useState("");
const [statusFilter, setStatusFilter] = React.useState("");


const [selectedWorker, setSelectedWorker] = React.useState("");
const [selectedVehicle, setSelectedVehicle] = React.useState("");


  React.useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {

  const data = await getSupervisorComplaints();

  if (data.complaints) {
    setComplaints(data.complaints);
  }

  const workerData = await getAvailableWorkers();

  if (workerData.workers) {
    setWorkers(workerData.workers);
    console.log("Workers:", workerData.workers);
  }

  const vehicleData = await getAvailableVehicles();

  if (vehicleData.vehicles) {
    setVehicles(vehicleData.vehicles);
    console.log("Vehicles:", vehicleData.vehicles);
  }

};
const handleVerifyComplaint = async () => {

  if (!selectedComplaint) return;

  await verifyComplaint(
    selectedComplaint.complaint_id
  );

  alert("Complaint Verified Successfully");

  setShowDetailsModal(false);

  loadComplaints();

};

const handleAssign = async () => {

  if (!selectedWorker || !selectedVehicle) {
    alert("Please select both Worker and Vehicle.");
    return;
  }

  const result = await assignWorker(
    selectedComplaint.complaint_id,
    Number(selectedWorker),
    Number(selectedVehicle)
  );

  alert(result.message);

  setShowAssignModal(false);

  await loadComplaints();

};

const filteredComplaints = complaints.filter((c: any) => {

  const priorityMatch =
    !priorityFilter || c.priority === priorityFilter;

  const categoryMatch =
    !categoryFilter || c.category === categoryFilter;

const statusMatch =
  !statusFilter ||
  (statusFilter === "Submitted"
    ? !c.worker_name && !c.vehicle_number
    : c.status === statusFilter);

console.log(
  "STATUS CHECK:",
  c.complaint_code,
  "DB STATUS =",
  JSON.stringify(c.status),
  "FILTER =",
  JSON.stringify(statusFilter),
  "MATCH =",
  c.status === statusFilter
);

  return (
    priorityMatch &&
    categoryMatch &&
    statusMatch
  );

});
console.log(
  "STATUS FILTER:",
  statusFilter,
  "FILTERED:",
  filteredComplaints.map((c: any) => ({
    code: c.complaint_code,
    status: c.status,
  }))
);
console.log(complaints);

  return (
   <div className="p-8 bg-slate-50 min-h-screen">

  <div className="mb-8">
    <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
      Assigned Control District
    </span>

    <h1 className="text-2xl font-bold text-slate-900 mt-3">
      Shivajinagar Zone
    </h1>

    <p className="text-sm text-slate-500 mt-1">
      Zone Supervisor Terminal • Monitor, dispatch and assign complaints
    </p>
</div>

<div className="bg-white rounded-2xl p-5 border border-slate-200">

  <div className="relative mb-5">
    <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />

    <input
      type="text"
      placeholder="Search complaints..."
      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
  </div>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

   <select
  className="border border-slate-200 rounded-xl p-3 text-sm"
  value={priorityFilter}
  onChange={(e) => setPriorityFilter(e.target.value)}
>
  <option value="">All Priorities</option>
  <option value="High">High</option>
  <option value="Medium">Medium</option>
  <option value="Low">Low</option>
</select>

    <select
  className="border border-slate-200 rounded-xl p-3 text-sm"
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value)}
>
  <option value="">All Categories</option>
  <option value="Household">Household</option>
  <option value="Plastic">Plastic</option>
  <option value="Construction">Construction</option>
  <option value="Hazardous">Hazardous</option>
</select>

  <select
  className="border border-slate-200 rounded-xl p-3 text-sm"
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
  <option value="">All Status</option>
  <option value="Submitted">Unassigned</option>
  
  <option value="In Progress">In Progress</option>
  <option value="Verification">Awaiting Verification</option>
  <option value="Resolved">Resolved</option>
</select>

  

  </div>

</div>
<div className="mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden">

  <table className="w-full">

    <thead className="bg-slate-50">

      <tr className="text-xs text-slate-500 uppercase">

        <th className="text-left px-6 py-4">Complaint</th>
        <th className="text-left px-6 py-4">Location</th>
        <th className="text-left px-6 py-4">Priority</th>
        <th className="text-left px-6 py-4">Worker</th>
        <th className="text-left px-6 py-4">Vehicle</th>
        <th className="text-center px-6 py-4">Action</th>

      </tr>

    </thead>

    <tbody>

     {filteredComplaints.map((c: any) => (

        <tr
          key={c.complaint_id}
          className="border-t border-slate-100 hover:bg-slate-50 transition"
        >

          <td className="px-6 py-5">
            <div className="font-semibold text-sm">
              {c.complaint_code}
            </div>

            <div className="text-xs text-slate-500">
              {c.category}
            </div>
          </td>

          <td className="px-6 py-5 text-sm">
            {c.address}
          </td>

          <td className="px-6 py-5">
            <span className="text-xs font-semibold text-red-600">
              {c.priority}
            </span>
          </td>

         <td className="px-6 py-5 text-sm">
  {c.worker_name ?? "-"}
</td>

         <td className="px-6 py-5 text-sm">
  {c.vehicle_number ?? "-"}
</td>

          <td className="px-6 py-5 text-center">

          <button
  className="mr-3 text-blue-600 hover:text-blue-800"
  onClick={() => {
    setSelectedComplaint(c);
    setShowDetailsModal(true);
  }}
>
  <Eye size={18} />
  </button>
{c.worker_name && c.vehicle_number ? (

  c.status === "Verification" ? (
<button
  className="px-3 py-1 rounded-lg bg-yellow-500 text-white text-xs font-semibold"
  onClick={() => {
    setSelectedComplaint(c);
    setShowDetailsModal(true);
  }}
>
  Awaiting Verification
</button>

  ) : c.status === "Resolved" ? (

    <button
      className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold cursor-not-allowed"
      disabled
    >
      ✓ Resolved
    </button>

  ) : (

    <button
  className="px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-semibold cursor-not-allowed"
  disabled
>
  In Progress
</button>

  )

) : (

  <button
    className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
    onClick={() => {
      setSelectedComplaint(c);
      setSelectedWorker("");
      setSelectedVehicle("");
      setShowAssignModal(true);
    }}
  >
    Assign
  </button>

)}


          </td>

        </tr>

      ))}

    </tbody>

  </table>

</div>

{showDetailsModal && selectedComplaint && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-2xl w-full max-w-2xl p-6">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">
          Complaint Details
        </h2>

        <button
          onClick={() => setShowDetailsModal(false)}
          className="text-slate-500 text-xl"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-5 text-sm">

        <div>
          <p className="text-slate-500">Complaint ID</p>
          <p className="font-semibold">{selectedComplaint.complaint_code}</p>
        </div>

        <div>
          <p className="text-slate-500">Category</p>
          <p className="font-semibold">{selectedComplaint.category}</p>
        </div>

        <div>
          <p className="text-slate-500">Priority</p>
          <p className="font-semibold">{selectedComplaint.priority}</p>
        </div>

        <div>
          <p className="text-slate-500">Location</p>
          <p className="font-semibold">{selectedComplaint.address}</p>
        </div>

        <div className="col-span-2">
          <p className="text-slate-500">Description</p>
          <p className="font-semibold">
            {selectedComplaint.description}
          </p>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-4 mt-4">

  <div>
    <p className="text-slate-500 mb-2">
      Before Cleaning
    </p>

    <img
      src={
        selectedComplaint.image_before
          ? `http://127.0.0.1:5000/${selectedComplaint.image_before}`
          : "https://placehold.co/400x250?text=No+Image"
      }
      className="rounded-xl w-full h-52 object-cover"
    />
  </div>

  <div>
    <p className="text-slate-500 mb-2">
      After Cleaning
    </p>

    <img
      src={
        selectedComplaint.image_after
          ? `http://127.0.0.1:5000/${selectedComplaint.image_after}`
          : "https://placehold.co/400x250?text=No+After+Image"
      }
      className="rounded-xl w-full h-52 object-cover"
    />
  </div>

</div>

        <div>
          <p className="text-slate-500">Assigned Worker</p>
         <p className="font-semibold">
  {selectedComplaint.worker_name || "Not Assigned"}
</p>
        </div>

        <div>
          <p className="text-slate-500">Assigned Vehicle</p>
        <p className="font-semibold">
  {selectedComplaint.vehicle_number || "Not Assigned"}
</p>
        </div>
        <div className="col-span-2">

  {selectedComplaint.status === "Verification" && (

    <button
      onClick={handleVerifyComplaint}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold mt-6"
    >
      Verify Complaint
    </button>

  )}

</div>

      </div>

    </div>

  </div>
  
)}

{showAssignModal && selectedComplaint && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

    <div className="bg-white rounded-2xl w-full max-w-xl p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-lg font-bold">
          Assign Complaint
        </h2>

        <button
          onClick={() => setShowAssignModal(false)}
          className="text-xl"
        >
          ×
        </button>

      </div>

      <div className="space-y-5">

        <div>
          <label className="text-sm font-semibold">
            Worker
          </label>

        <select
  className="w-full mt-2 border rounded-xl p-3 text-sm"
  value={selectedWorker}
  onChange={(e) => setSelectedWorker(e.target.value)}
>
  <option value="">Select Worker</option>

  {workers.map((w: any) => (
    <option
      key={w.worker_id}
      value={w.worker_id}
    >
      {w.full_name}
    </option>
  ))}
</select>
        </div>

        <div>
          <label className="text-sm font-semibold">
            Vehicle
          </label>

        <select
  className="w-full mt-2 border rounded-xl p-3 text-sm"
  value={selectedVehicle}
  onChange={(e) => setSelectedVehicle(e.target.value)}
>
  <option value="">Select Vehicle</option>

  {vehicles.map((v: any) => (
    <option
      key={v.vehicle_id}
      value={v.vehicle_id}
    >
      {v.vehicle_number}
    </option>
  ))}
</select>
        </div>

       <button
  onClick={handleAssign}
  className="w-full bg-emerald-600 text-white rounded-xl py-3 font-semibold hover:bg-emerald-700 transition"
>
  Assign
</button>

      </div>

    </div>

  </div>
)}

</div>
  );
};