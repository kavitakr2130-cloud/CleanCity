import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  AlertTriangle,
  Users,
  Truck,
  CheckCircle2,
} from "lucide-react";

import { useApp } from "../../context/AppContext";

import {
  getSupervisorComplaints,
  getAvailableWorkers,
  getAvailableVehicles,
} from "../../services/api";
import { getSupervisorNotifications } from "../../services/api";

export const SupervisorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { authoritySubRole, user, supervisorZone } = useApp();

  const [complaints, setComplaints] = React.useState<any[]>([]);
  const [workers, setWorkers] = React.useState<any[]>([]);
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [showWorkersModal, setShowWorkersModal] = React.useState(false);
  const [showVehiclesModal, setShowVehiclesModal] = React.useState(false);
  const [selectedWorker, setSelectedWorker] = React.useState<any>(null);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const complaintData = await getSupervisorComplaints();

    if (complaintData.complaints) {
      setComplaints(complaintData.complaints);
    }

    const workerData = await getAvailableWorkers();

   if (workerData.workers) {
    setWorkers(workerData.workers);
  }

    const vehicleData = await getAvailableVehicles();

    if (vehicleData.vehicles) {
      setVehicles(vehicleData.vehicles);
    }
    
    console.log("Calling Supervisor Notifications API...");
    const notificationData = await getSupervisorNotifications();
    console.log("Supervisor Notifications:", notificationData);

if (notificationData.notifications) {
  setNotifications(notificationData.notifications);
}

  };

 return (
  <div className="p-8 bg-slate-50 min-h-screen">
    <div className="mb-8">
     <h1 className="text-3xl font-extrabold text-slate-800">
  Supervisor Dashboard
</h1>

<p className="text-emerald-600 font-semibold mt-2">
  Zone {supervisorZone}
</p>

<p className="text-slate-500">
  Welcome back • {user.name}
</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">
              Total Complaints
            </p>
            <h2 className="text-3xl font-black mt-2">
             {complaints.length}
            </h2>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Home className="w-7 h-7 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">
              Pending
            </p>

            <h2 className="text-3xl font-black mt-2">
              {
                complaints.filter(
                 (c: any) => !c.worker_id && !c.vehicle_id
                ).length
              }
            </h2>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
        </div>
      </div>

  <div
  onClick={() => {
    setSelectedWorker(workers);
    setShowWorkersModal(true);
  }}
  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">
              Workers
            </p>

            <h2 className="text-3xl font-black mt-2">
              {workers.length}
            </h2>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Users className="w-7 h-7 text-emerald-600" />
          </div>
        </div>
      </div>

    <div
  onClick={() => setShowVehiclesModal(true)}
  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition"
>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">
              Vehicles
            </p>

            <h2 className="text-3xl font-black mt-2">
              {vehicles.length}
            </h2>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Truck className="w-7 h-7 text-amber-600" />
          </div>
        </div>
      </div>

    </div>
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">

  <div className="flex justify-between items-center mb-6">
    <div>
      <h2 className="text-xl font-bold text-slate-800">
        Urgent Dispatch Priorities
      </h2>

      <p className="text-slate-500 text-sm">
        Pending complaints in your zone
      </p>
    </div>

    <button
      onClick={() => navigate("/supervisor/complaints")}
      className="text-emerald-600 font-bold hover:underline"
    >
      Review All Complaints
    </button>

  </div>

  {complaints.filter(
  (c:any) =>
    c.status === "Assigned" ||
    c.status === "Submitted"
).length===0 ? (

    <div className="text-center py-10 text-slate-400">
      No pending complaints.
    </div>

  ) : (

    <div className="space-y-4">

      {complaints
       .filter(
  (c:any) =>
    c.status === "Assigned" ||
    c.status === "Submitted"
)
        .slice(0,5)
        .map((c:any)=>(
          <div
            key={c.complaint_id}
            onClick={()=>navigate("/supervisor/complaints")}
            className="border rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition"
          >

            <div className="flex justify-between">

              <div>

                <h3 className="font-bold">
                  {c.complaint_code}
                </h3>

                <p className="text-sm text-slate-500">
                  {c.address}
                </p>

              </div>

              <span className="font-bold text-red-600">
                {c.priority}
              </span>

            </div>

          </div>
      ))}

    </div>

  )}

</div>
{showWorkersModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl w-[700px] max-h-[80vh] overflow-y-auto p-6">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Available Workers</h2>

        <button
          onClick={() => setShowWorkersModal(false)}
          className="text-xl"
        >
          ✕
        </button>
      </div>

      {workers.map((worker: any) => (
        <div
          key={worker.worker_id}
          className="border rounded-xl p-4 mb-3"
        >
          <h3 className="font-bold">{worker.full_name}</h3>

          <p>{worker.employee_id}</p>
          <p>Crew : {worker.crew_name}</p>
          <p>Status : {worker.status}</p>
          <p>⭐ {worker.average_rating}</p>
        </div>
      ))}

    </div>
  </div>
)}
{showVehiclesModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl w-[700px] p-6">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Zone Vehicles</h2>

        <button
          onClick={() => setShowVehiclesModal(false)}
          className="text-xl"
        >
          ✕
        </button>
      </div>

      {vehicles.map((vehicle: any) => (
        <div
          key={vehicle.vehicle_id}
          className="border rounded-xl p-4 mb-3"
        >
          <h3 className="font-bold">{vehicle.vehicle_number}</h3>

          <p>{vehicle.vehicle_type}</p>
          <p>Driver: {vehicle.driver_name}</p>
          <p>Status: {vehicle.status}</p>
        </div>
      ))}

    </div>
  </div>
)}

  </div>
  
  
);
};