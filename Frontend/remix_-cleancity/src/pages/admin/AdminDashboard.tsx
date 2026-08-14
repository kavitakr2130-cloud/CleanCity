import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, CheckCircle2, Clock, MapPin, Eye, Filter, ArrowRight, TrendingUp, Truck, Play, Camera, Send, Check, AlertTriangle, Award, Navigation, ShieldCheck, X, UserPlus, Activity, Calendar, User, Compass, FileText, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MockMap } from '../../components/MockMap';
import { TranslatedText } from '../../components/TranslatedText';
import { Complaint, WorkforceTeam } from '../../types';
import {getAllComplaints,getSupervisorComplaints,getWorkerComplaints,startWorkerTask,getAvailableWorkers,getAvailableVehicles} from "../../services/api";


const priorityWeight = (p: string) => {
  const upper = (p || '').toUpperCase();
  if (upper === 'HIGH') return 3;
  if (upper === 'MEDIUM') return 2;
  return 1;
};

const getSlaInfo = (submitTimeStr: string, priority: string) => {
  let daysPending = 1;
  let isOverdue = false;

  try {
    const cleanStr = (submitTimeStr || '').replace(',', '');
    let submitDate = new Date(cleanStr);
    
    if (isNaN(submitDate.getTime())) {
      const parts = cleanStr.split(' ');
      if (parts.length >= 3) {
        const months: {[key: string]: number} = {
          Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
          Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };
        const month = months[parts[0].substring(0, 3)];
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(year) && month !== undefined) {
          submitDate = new Date(year, month, day);
        }
      }
    }

    if (!isNaN(submitDate.getTime())) {
      let now = new Date();
      if (submitDate.getFullYear() === 2023) {
        now = new Date(2023, 9, 28, 12, 0, 0); // Simulated "current date" Oct 28, 2023 for old mock data
      }
      const diffTime = now.getTime() - submitDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      daysPending = Math.max(1, diffDays);
    }
  } catch (e) {
    console.error("Error calculating SLA:", e);
  }

  let slaLimitText = '';
  if (priority === 'HIGH') {
    slaLimitText = '24 Hours';
    isOverdue = daysPending >= 1; // High SLA is 24 hours (1 day)
  } else if (priority === 'MEDIUM') {
    slaLimitText = '3 Days';
    isOverdue = daysPending >= 3; // Medium SLA is 3 days
  } else {
    slaLimitText = '7 Days';
    isOverdue = daysPending >= 7; // Low SLA is 7 days
  }

  return { daysPending, slaLimitText, isOverdue };
};

export const AdminDashboard: React.FC = () => {
  const [dbComplaints, setDbComplaints] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadComplaints = async () => {
      const subRole = localStorage.getItem("authoritySubRole");
      console.log("Current SubRole:", subRole);

    const data = await getAllComplaints();

      if (data.complaints) {
        setDbComplaints(data.complaints);
        console.log("Complaints from DB:", data.complaints);
      }
    };

    loadComplaints();
  }, []);

  
 const { 
  complaints, 
  updateComplaintStatus, 
  assignWorkforce, 
  teams, 
  authoritySubRole,
  setAuthoritySubRole,
  addComplaintComment,
  feedbacks,
  vehicles,
  updateVehicleStatus
} = useApp();
  const navigate = useNavigate();


  // Selected marker detail popup in map
  const [selectedMapComplaint, setSelectedMapComplaint] = useState<Complaint | null>(null);

  // Statistics calculation for City-Wide Admin
  const total = dbComplaints.length;
const pending = dbComplaints.filter(
  (c: any) =>
    c.status === "Submitted" ||
    c.status === "SUBMITTED" ||
    c.status === "Pending" ||
    c.status === "Awaiting Dispatch"
).length;
const inProgress = dbComplaints.filter((c: any) => {
  const status = (c.status || "").toLowerCase();

  return (
    status === "assigned" ||
    status === "in progress" ||
    status === "in_progress"
  );
}).length;
const awaitingVerify = dbComplaints.filter((c: any) => {
  const status = (c.status || "").toLowerCase();

  console.log(
    "AWAITING CHECK:",
    c.complaint_id,
    "status =",
    c.status,
    "worker_id =",
    c.worker_id,
    "vehicle_id =",
    c.vehicle_id
  );

  return (
    status === "awaiting dispatch" ||
    status === "verification" ||
    status === "assigned"
  );
}).length;
const resolved = dbComplaints.filter((c: any) => {
  const status = (c.status || "").toLowerCase();
  return status === "resolved";
}).length;
console.log(
  dbComplaints.map((c: any) => ({
    id: c.complaint_id,
    status: c.status
  }))
);

  // Handler for pin clicks from the MockMap
  const handleMarkerClick = (comp: Complaint) => {
    setSelectedMapComplaint(comp);
  };

  // ----------------------------------------------------
  // SUB-PORTAL 1: SUPERVISOR DASHBOARD (ZONE DISPATCH & VERIFY)
  // ----------------------------------------------------
  const SupervisorDashboard: React.FC = () => {
    const [availableWorkers, setAvailableWorkers] = React.useState<any[]>([]);
    const [availableVehicles, setAvailableVehicles] = React.useState<any[]>([]);
    const [showFleetModal, setShowFleetModal] = React.useState(false);
         // NEW
       const [selectedComplaint, setSelectedComplaint] = React.useState<any>(null);
       const [showComplaintModal, setShowComplaintModal] = React.useState(false);

    // Sector 4 simulated zone data filtering (showing only zone-specific data)
  const zoneComplaints = React.useMemo(() => {
  return dbComplaints.filter((c: any) => true);
}, [dbComplaints]);


    // Sector 04 Fleet containing the assigned municipal vehicles
   const zoneFleet = React.useMemo(() => {
  return availableVehicles.map((v: any) => ({
    id: v.vehicle_id,
    number: v.vehicle_number,
    type: v.vehicle_type,
    driver: v.driver_name,
    driverPhone: v.driver_phone,
    status: v.status,
  }));
}, [availableVehicles]);

    const zoneFleetStats = React.useMemo(() => {
      let total = zoneFleet.length;
      let available = zoneFleet.filter(v => v.status === 'Available').length;
      let onDuty = zoneFleet.filter(v => ['Assigned', 'On Route', 'Cleaning', 'Cleaning in Progress', 'Completed'].includes(v.status)).length;
      let maintenance = zoneFleet.filter(v => v.status === 'Maintenance').length;
      return { total, available, onDuty, maintenance };
    }, [zoneFleet]);

    React.useEffect(() => {
  const loadWorkers = async () => {
    const data = await getAvailableWorkers();

    if (data.workers) {
      setAvailableWorkers(data.workers);
      console.log("Available Workers:", data.workers);
    }
 const vehicleData = await getAvailableVehicles();

    if (vehicleData.vehicles) {
      setAvailableVehicles(vehicleData.vehicles);
      console.log("Available Vehicles:", vehicleData.vehicles);
    }

  };

  loadWorkers();
}, []);

   const zonePending = React.useMemo(() => {
    console.log(
  zoneComplaints.map((c: any) => ({
    code: c.complaint_code,
    status: c.status
  }))
);
  return zoneComplaints
    .filter((c: any) => c.status === "Submitted")
        .sort((a, b) => {
          const weightA = priorityWeight(a.priority);
          const weightB = priorityWeight(b.priority);
          if (weightA !== weightB) {
            return weightB - weightA; // Highest priority weight first
          }
          const timeA = Date.parse((a.submitTime || '').replace(',', '')) || 0;
          const timeB = Date.parse((b.submitTime || '').replace(',', '')) || 0;
          return timeA - timeB; // Oldest pending first
        });
    }, [zoneComplaints]);

    const zoneInProgress = React.useMemo(() => {
      return zoneComplaints.filter(c => (c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS') && !c.afterImage);
    }, [zoneComplaints]);

    const zoneAwaitingVerification = React.useMemo(() => {
      return zoneComplaints.filter(c => c.status !== 'RESOLVED' && c.afterImage);
    }, [zoneComplaints]);

    const zoneResolved = React.useMemo(() => {
      return zoneComplaints.filter(c => c.status === 'RESOLVED');
    }, [zoneComplaints]);

    const zoneActiveComplaintsCount = React.useMemo(() => {
      return zoneComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'VERIFIED').length;
    }, [zoneComplaints]);

    // Priority Counts Overview
    const priorityCounts = React.useMemo(() => {
      let high = 0;
      let medium = 0;
      let low = 0;
      zoneComplaints.forEach(c => {
        if (c.status !== 'RESOLVED' && c.status !== 'REJECTED') {
          if (c.priority === 'HIGH') high++;
          else if (c.priority === 'MEDIUM') medium++;
          else low++;
        }
      });
      return { high, medium, low };
    }, [zoneComplaints]);

    // Worker Status list: Name, ID, Status, Assigned Complaint
 const workerStatusList = React.useMemo(() => {
  return availableWorkers.map((w: any) => ({
    id: w.worker_id,
    name: w.full_name,
    teamName: w.department_name,
    status: w.status.toUpperCase(),
    assignedComplaint: "None",
    rating: w.average_rating,
    mobile: w.mobile_number,
    employeeId: w.employee_id,
  }));
}, [availableWorkers]);

    // Recent Zone Activity Feed: gathered from complaints' liveUpdates in reverse chronological order
    const recentActivityFeed = React.useMemo(() => {
      const activities: { id: string; type: string; text: string; time: string; badgeColor?: string }[] = [];
      
      zoneComplaints.forEach(c => {
        // Submission event
        activities.push({
          id: `${c.id}-submit`,
          type: 'SUBMISSION',
          text: `Grievance ${c.id} ("${c.title}") was submitted in Sector 4.`,
          time: c.submitTime,
          badgeColor: 'bg-amber-100 text-amber-800'
        });
        
        // Dispatch event
        if (c.assignTime) {
          activities.push({
            id: `${c.id}-assign`,
            type: 'ASSIGNMENT',
            text: `Crew ${c.assignedTeamName} dispatched to ${c.id}.`,
            time: c.assignTime,
            badgeColor: 'bg-blue-100 text-blue-800'
          });
        }

        // Vehicle assignment & tracking events
        if (c.assignedVehicle) {
          activities.push({
            id: `${c.id}-vehicle-dispatch`,
            type: 'VEHICLE_DISPATCH',
            text: `Vehicle ${c.assignedVehicle.number} (${c.assignedVehicle.type}) dispatched under Admin assignment.`,
            time: c.vehicleAssignedTime || c.assignTime || c.submitTime,
            badgeColor: 'bg-indigo-100 text-indigo-800'
          });

          if (['On Route', 'Cleaning', 'Cleaning in Progress', 'Completed'].includes(c.assignedVehicle.status)) {
            let statusText = '';
            if (c.assignedVehicle.status === 'On Route') {
              statusText = `Vehicle ${c.assignedVehicle.number} is On Route to location.`;
            } else if (c.assignedVehicle.status === 'Completed') {
              statusText = `Vehicle ${c.assignedVehicle.number} reached and successfully cleared site.`;
            } else {
              statusText = `Vehicle ${c.assignedVehicle.number} active on site (Cleaning Operations).`;
            }

            activities.push({
              id: `${c.id}-vehicle-status-${c.assignedVehicle.status}`,
              type: 'VEHICLE_TRACKING',
              text: statusText,
              time: 'Just Now',
              badgeColor: 'bg-slate-100 text-slate-800'
            });
          }
        }
        
        // Resolution or photo upload event
        if (c.resolveTime) {
          if (c.status === 'RESOLVED') {
            activities.push({
              id: `${c.id}-resolved`,
              type: 'RESOLUTION',
              text: `Complaint ${c.id} verified and closed by Supervisor Rajesh.`,
              time: c.resolveTime,
              badgeColor: 'bg-emerald-100 text-emerald-800'
            });
          } else {
            activities.push({
              id: `${c.id}-photo`,
              type: 'PHOTO_UPLOAD',
              text: `After-clean photograph uploaded for ${c.id} by field worker.`,
              time: c.resolveTime,
              badgeColor: 'bg-purple-100 text-purple-800'
            });
          }
        }
      });

      // Sort by simulated/actual timestamp or parse time
      return activities
        .sort((a, b) => {
          const tA = Date.parse(a.time.replace(',', '')) || 0;
          const tB = Date.parse(b.time.replace(',', '')) || 0;
          return tB - tA; // latest first
        })
        .slice(0, 5); // display top 5 activities
    }, [zoneComplaints]);

    // States for interactive assignment modal and verify modal
    const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [inspectTarget, setInspectTarget] = useState<Complaint | null>(null);
    const [inspectionRemarks, setInspectionRemarks] = useState('');
    const [successToast, setSuccessToast] = useState('');
    const [broadcastText, setBroadcastText] = useState('');
    const [activeSubView, setActiveSubView] = useState<'DASHBOARD' | 'PRIORITY' | 'WORKERS' | 'ACTIVITY' | 'BROADCAST'>('DASHBOARD');

    const handleAssignDispatch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!assignTarget || !selectedTeamId) return;
      assignWorkforce(assignTarget.id, selectedTeamId);
      setSuccessToast(`Dispatched crew to grievance site ${assignTarget.id}!`);
      setAssignTarget(null);
      setSelectedTeamId('');
      setTimeout(() => setSuccessToast(''), 3000);
    };

    const handleVerifyClosure = (approve: boolean) => {
      if (!inspectTarget) return;
      if (approve) {
        // Mark as RESOLVED (approved verification)
        updateComplaintStatus(inspectTarget.id, 'RESOLVED');
        addComplaintComment(inspectTarget.id, `Quality audit COMPLETED & APPROVED by Supervisor Rajesh: "${inspectionRemarks || 'Cleanup standards met.'}"`, true);
        setSuccessToast(`Grievance ${inspectTarget.id} verified and closed!`);
      } else {
        // Reject & send back to ASSIGNED with instructions
        updateComplaintStatus(inspectTarget.id, 'ASSIGNED');
        addComplaintComment(inspectTarget.id, `Quality audit REJECTED by Supervisor Rajesh. Reason: ${inspectionRemarks || 'Cleanup is incomplete, please sweep and wash the tiles again.'}`, true);
        setSuccessToast(`Work order ${inspectTarget.id} sent back for re-cleaning.`);
      }
      setInspectTarget(null);
      setInspectionRemarks('');
      setTimeout(() => setSuccessToast(''), 3000);
    };

    const handleBroadcastAnnouncement = (e: React.FormEvent) => {
      e.preventDefault();
      if (!broadcastText.trim()) return;
      setSuccessToast('Broadcast announcement transmitted to Sector 4 citizens!');
      setBroadcastText('');
      setTimeout(() => setSuccessToast(''), 3000);
    };

    if (activeSubView === 'PRIORITY') {
      return (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6 animate-fadeIn text-left">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <button 
              onClick={() => setActiveSubView('DASHBOARD')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600 border border-slate-200"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Sector Priority Overview
              </h3>
              <p className="text-xs text-slate-500">Distribution of outstanding active complaints in Sector 04</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Live Priority Metrics</h4>
              
              {/* High Priority */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    High Priority (SLA: 24h)
                  </span>
                  <span>{priorityCounts.high} items</span>
                </div>
                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-slate-250">
                  <div 
                    className="bg-red-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${zoneComplaints.length ? (priorityCounts.high / zoneComplaints.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Medium Priority */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Medium Priority (SLA: 3 Days)
                  </span>
                  <span>{priorityCounts.medium} items</span>
                </div>
                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-slate-250">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${zoneComplaints.length ? (priorityCounts.medium / zoneComplaints.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Low Priority */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    Low Priority (SLA: 7 Days)
                  </span>
                  <span>{priorityCounts.low} items</span>
                </div>
                <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-slate-250">
                  <div 
                    className="bg-slate-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${zoneComplaints.length ? (priorityCounts.low / zoneComplaints.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Compliance & Escalation Policies</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Priority values are determined based on environmental impact and public hazard severity. High priority items include open garbage dumps near schools, medical waste, or sewer blockages.
                </p>
                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-150 text-[11px] text-slate-600 space-y-1 font-semibold">
                  <p className="text-red-600 flex items-center gap-1.5">🔴 High Priority → Dispatch in 4h, resolve in 24h.</p>
                  <p className="text-amber-600 flex items-center gap-1.5">🟠 Medium Priority → Resolve in 3 business days.</p>
                  <p className="text-slate-500 flex items-center gap-1.5">⚫ Low Priority → Sweeping & clearing in 7 days.</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveSubView('DASHBOARD')}
                className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeSubView === 'WORKERS') {
      return (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6 animate-fadeIn text-left">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <button 
              onClick={() => setActiveSubView('DASHBOARD')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600 border border-slate-200"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Sanitation Worker Status Registry
              </h3>
              <p className="text-xs text-slate-500">Real-time status of assigned sanitation workers & crews in Sector 04</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workerStatusList.map((worker) => (
              <div key={worker.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border-2 border-white flex-shrink-0 shadow-xs">
                     <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-700 font-extrabold text-lg">
                          {worker.name.charAt(0)}
                    </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate">{worker.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{worker.teamName}</p>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">ID: <span className="font-mono">{worker.employeeId}</span></p>
                    </div>
                  </div>
                  
                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                    worker.status === 'IDLE' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {worker.status}
                  </span>
                </div>

               <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Mobile:</span>
              <span className="text-emerald-700 font-black">
                {worker.mobile}
              </span>
            </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button 
              onClick={() => setActiveSubView('DASHBOARD')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (activeSubView === 'ACTIVITY') {
      return (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6 animate-fadeIn text-left">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <button 
              onClick={() => setActiveSubView('DASHBOARD')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600 border border-slate-200"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />
                Sector 04 Live Activity Log
              </h3>
              <p className="text-xs text-slate-500">Real-time chronological events and dispatch actions from Sector 04</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-150">
            <div className="relative border-l-2 border-slate-200 pl-6 space-y-6">
              {recentActivityFeed.map((activity) => (
                <div key={activity.id} className="relative space-y-1">
                  {/* Circle bullet on timeline */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-xs" />
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-black">
                    <span>{activity.time}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${activity.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                      {activity.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-bold">
                    {activity.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button 
              onClick={() => setActiveSubView('DASHBOARD')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (activeSubView === 'BROADCAST') {
      return (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6 animate-fadeIn text-left">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <button 
              onClick={() => setActiveSubView('DASHBOARD')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-600 border border-slate-200"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Sector 04 Broadcaster Console
              </h3>
              <p className="text-xs text-slate-500">Transmit alerts, awareness posts, or notices specifically to Sector 04 citizens</p>
            </div>
          </div>

          <div className="max-w-xl mx-auto">
            <form onSubmit={handleBroadcastAnnouncement} className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-850 shadow-sm space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Broadcast Message</label>
                <textarea
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="e.g. Cleansing vehicle scheduled for 9:00 AM in Ward 04 tomorrow. Kindly avoid curb parking."
                  className="w-full h-28 bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder-slate-500 resize-none font-semibold"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBroadcastText('');
                    setActiveSubView('DASHBOARD');
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel & Exit
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow transition-all cursor-pointer"
                >
                  Transmit Broadcast
                </button>
              </div>
            </form>

            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-150 text-left text-xs font-semibold text-slate-500 space-y-2">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">⚠️ Notice Broadcast Guidelines:</p>
              <p>• Announcements are instantly pushed via notification feeds to all residents registered under Sector 04 geo-coordinates.</p>
              <p>• Only environmental notices, hygiene alerts, or sanitation schedules are authorized for transmission.</p>
            </div>
          </div>
        </div>
      );
    }

    // Default dashboard layout:
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-2 border-b border-slate-100">
          <div className="text-left">
            <h2 className="text-xl font-extrabold text-slate-900">Zone Operations Center</h2>
            <p className="text-xs text-slate-500 font-semibold">North District • Sector 04 Control Terminal</p>
          </div>
          <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs w-max">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            ZONE DESK ONLINE
          </span>
        </div>

        {/* KPI stats (optimised for mobile stacking) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Zone Workload</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-800">{zoneActiveComplaintsCount}</span>
              <span className="text-[10px] font-bold text-slate-400">Active Complaints</span>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-amber-600">Pending Assignment</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600">{zonePending.length}</span>
              <span className="text-[10px] font-bold text-slate-400">pending</span>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-blue-600">In Progress</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-600">{zoneInProgress.length}</span>
              <span className="text-[10px] font-bold text-slate-400">crews active</span>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs text-left">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-purple-600">Awaiting Verification</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-600">{zoneAwaitingVerification.length}</span>
              <span className="text-[10px] font-bold text-slate-400">audits</span>
            </div>
          </div>
          
          {/* Zone Fleet Status Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">🚛 Zone Fleet Status</span>

                <button
                  onClick={() => setShowFleetModal(true)}
                  className="text-slate-500 hover:text-emerald-600 transition-colors"
                  title="View Fleet Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-1.5 space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Total Vehicles:</span>
                  <span className="text-slate-900 font-extrabold">{zoneFleetStats.total}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Available:</span>
                  <span className="text-emerald-600 font-extrabold">{zoneFleetStats.available}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">On Duty:</span>
                  <span className="text-blue-600 font-extrabold">{zoneFleetStats.onDuty}</span>
                </div>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Maintenance:</span>
                  <span className="text-rose-600 font-extrabold">{zoneFleetStats.maintenance}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-slate-900 text-emerald-400 font-bold p-3.5 rounded-2xl border border-slate-800 shadow-md text-center text-xs animate-fadeIn">
            ⚡ {successToast}
          </div>
        )}

        {/* Secondary compact actions grid (Redesigned as compact cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Priority Overview */}
          <button
            onClick={() => setActiveSubView('PRIORITY')}
            className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-150 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-800 block truncate">Sector Priority Overview</span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {priorityCounts.high} High • {priorityCounts.medium} Med
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md group-hover:bg-emerald-100 transition-colors whitespace-nowrap">
              View Priority Overview
            </span>
          </button>

          {/* Card 2: Worker Status */}
          <button
            onClick={() => setActiveSubView('WORKERS')}
            className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-150 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-800 block truncate">Worker Status</span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {workerStatusList.filter(w => w.status === 'AVAILABLE').length} Idle • {workerStatusList.length} Crews
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md group-hover:bg-emerald-100 transition-colors whitespace-nowrap">
              View Workers
            </span>
          </button>

          {/* Card 3: Recent Activity */}
          <button
            onClick={() => setActiveSubView('ACTIVITY')}
            className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-150 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-800 block truncate">Recent Zone Activity</span>
                <span className="text-[10px] text-slate-500 font-bold">5 logs available</span>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md group-hover:bg-emerald-100 transition-colors whitespace-nowrap">
              View Activity Log
            </span>
          </button>

          {/* Card 4: Broadcaster Console */}
          <button
            onClick={() => setActiveSubView('BROADCAST')}
            className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-150 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl">
                <Send className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-800 block truncate">Broadcaster Console</span>
                <span className="text-[10px] text-slate-500 font-bold">Transmit alerts</span>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md group-hover:bg-emerald-100 transition-colors whitespace-nowrap">
              Broadcast Announcement
            </span>
          </button>
        </section>

        {/* Essential operational sections layout (expands naturally) */}
        <div className={`grid grid-cols-1 ${
          (zonePending.length === 0 && zoneAwaitingVerification.length === 0) 
            ? 'w-full' 
            : 'lg:grid-cols-2'
        } gap-6`}>
          {/* Sector Dispatch Queue */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Sector Dispatch Queue
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Assign pending environmental reports to available sanitation crews in Sector 04</p>
              {/* SLA Notice */}
              <div className="mt-2 text-[10px] text-slate-500 font-semibold bg-slate-50 border border-slate-100 p-2 rounded-xl">
                ℹ️ Overdue municipal complaints may have their priority automatically escalated by backend compliance rules.
              </div>
            </div>

            <div className="space-y-3">
              {zonePending.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                  No pending complaints in Sector 04.
                </p>
              ) : (
                zonePending.map((comp) => {
                  const { daysPending, slaLimitText, isOverdue } = getSlaInfo(comp.submitTime, comp.priority);
                  return (
                    <div 
                      key={comp.id} 
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                        isOverdue 
                          ? 'bg-rose-50/40 border-rose-100 hover:border-rose-200' 
                          : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1.5 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black text-slate-600 bg-slate-200 px-2 py-0.5 rounded font-mono">{comp.id}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{comp.submitTime}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            comp.priority === 'HIGH'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : comp.priority === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {comp.priority} Priority
                          </span>
                          {isOverdue && (
                            <span className="text-[8px] font-black text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                              OVERDUE SLA
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-x-3 gap-y-1">
                          <h4 className="font-extrabold text-slate-800 text-xs md:text-sm truncate">
                            <TranslatedText text={comp.title} />
                          </h4>
                          <span className="hidden md:inline text-slate-300">•</span>
                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-max">
                            {comp.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-semibold truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <TranslatedText text={comp.address} />
                        </p>
                        
                        {/* SLA Timer Indicators */}
                        <div className="flex items-center gap-3 text-[9px] font-mono font-bold text-slate-400">
                          <span>Pending: <strong className="text-slate-600">{daysPending}d</strong></span>
                          <span>SLA Limit: <strong className="text-slate-600">{slaLimitText}</strong></span>
                        </div>
                      </div>

                    <div className="flex gap-2">
  <button
  onClick={(e) => {
    e.stopPropagation();
    console.log("Eye clicked");
    setSelectedComplaint(comp);
    setShowComplaintModal(true);
  }}
  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl transition-all cursor-pointer"
>
  <span className="text-red-600 font-black">TEST</span>
</button>

  <button
    onClick={() => setAssignTarget(comp)}
    className="flex-1 bg-slate-900 hover:bg-slate-850 text-white text-[11px] font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
  >
    <UserPlus className="w-3.5 h-3.5" />
    Assign Worker
  </button>
</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Resolution Audits Awaiting Verification */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Resolution Audits Awaiting Verification
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Verify worker after-cleaning photos and approve work order closures in Sector 04</p>
            </div>

            <div className="space-y-3">
              {zoneAwaitingVerification.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                  No completed tasks pending quality approval.
                </p>
              ) : (
                zoneAwaitingVerification.map((comp) => (
                  <div 
                    key={comp.id} 
                    className="p-4 bg-emerald-50/10 rounded-2xl border border-emerald-100/60 flex flex-col justify-between gap-4 hover:shadow-xs transition-all"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-200 bg-slate-100 flex-shrink-0 shadow-xs relative">
                        <img src={comp.afterImage || comp.beforeImage} alt="After" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 text-left space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">{comp.id}</span>
                          <span className="text-[10px] text-slate-500 font-bold">Closed by <strong className="text-slate-700">{comp.assignedTeamName}</strong></span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-xs truncate">
                          <TranslatedText text={comp.title} />
                        </h4>
                        <p className="text-xs text-slate-400 truncate font-semibold">
                          <TranslatedText text={comp.address} />
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setInspectTarget(comp);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect & Audit
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MODAL 1: DISPATCH TEAM */}
        {assignTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleAssignDispatch} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="text-left">
                  <h3 className="font-extrabold text-base text-slate-800">Dispatch Crew</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Work Order {assignTarget.id}</p>
                </div>
                <button type="button" onClick={() => setAssignTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
                  <p className="text-[10px] text-slate-400 font-bold">LOCATION</p>
                  <p className="text-xs font-bold text-slate-700 truncate">{assignTarget.address}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-1">"{assignTarget.description}"</p>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block ml-1">Available Fleet Crew</label>
                  <select
                    required
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="">-- Choose sanitation team --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.status === 'IDLE' ? 'Available' : 'Busy'}) • Lead: {t.leader}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-950 hover:bg-slate-850 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer"
              >
                Launch Dispatch Vehicle
              </button>
            </form>
          </div>
        )}
        {/* COMPLAINT DETAILS MODAL */}
{showComplaintModal && selectedComplaint && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800">
            Complaint Details
          </h3>
          <p className="text-xs text-slate-500">
            {selectedComplaint.id}
          </p>
        </div>

        <button
          onClick={() => {
            setShowComplaintModal(false);
            setSelectedComplaint(null);
          }}
          className="p-2 hover:bg-slate-100 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-2 gap-6 p-6">

        <div>
          <img
            src={selectedComplaint.beforeImage}
            className="rounded-2xl w-full h-64 object-cover"
            alt=""
          />
        </div>

        <div className="space-y-3 text-left">

          <div>
            <p className="text-xs text-slate-500">Complaint</p>
            <h4 className="font-bold text-slate-800">
              {selectedComplaint.title}
            </h4>
          </div>

          <div>
            <p className="text-xs text-slate-500">Description</p>
            <p className="text-sm">
              {selectedComplaint.description}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Category</p>
            <p className="font-semibold">
              {selectedComplaint.category}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Priority</p>
            <p className="font-semibold">
              {selectedComplaint.priority}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Address</p>
            <p>{selectedComplaint.address}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Status</p>
            <p>{selectedComplaint.status}</p>
          </div>

        </div>
      </div>

    </div>
  </div>
)}
        {/* MODAL 2: INSPECT RESOLUTION PROOF */}
        {inspectTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="text-left">
                  <h3 className="font-extrabold text-base text-slate-800">Inspection Audit Panel</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Grievance {inspectTarget.id}</p>
                </div>
                <button onClick={() => setInspectTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photos Comparison */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block bg-rose-50 px-2 py-0.5 rounded w-max">BEFORE CLEANING</span>
                  <div className="aspect-video bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <img src={inspectTarget.beforeImage} alt="Before" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest block bg-emerald-50 px-2 py-0.5 rounded w-max">AFTER CLEANING</span>
                  <div className="aspect-video bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <img src={inspectTarget.afterImage || 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800'} alt="After" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Site detail summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left text-xs space-y-1">
                <p className="font-bold text-slate-700">{inspectTarget.title}</p>
                <p className="text-[10px] text-slate-500">Address: {inspectTarget.address}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-semibold italic">Remarks from Crew: "Cleared all plastics, power washed the sidewalk with disinfectant."</p>
              </div>

              {/* Verification Comments form */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase block ml-1">Supervisor Audit Remarks</label>
                <textarea
                  value={inspectionRemarks}
                  onChange={(e) => setInspectionRemarks(e.target.value)}
                  placeholder="e.g. Quality is pristine, tiles swept and limestone sprayed. Or: Sweeping is incomplete, please sweep the left curb again."
                  className="w-full h-16 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 font-semibold resize-none"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleVerifyClosure(false)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs py-3.5 rounded-xl border border-red-100 transition-all cursor-pointer"
                >
                  Reject & Re-clean
                </button>
                <button
                  onClick={() => handleVerifyClosure(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Approve & Close
                </button>
              </div>
            </div>
          </div>
        )}
       {/* Fleet Details Modal */}
{showFleetModal && (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            🚛 Zone Fleet Details
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            Vehicles assigned to Shivajinagar Zone
          </p>
        </div>

        <button
          onClick={() => setShowFleetModal(false)}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-100 hover:text-red-600 transition-all flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">

          <thead className="bg-slate-100">
            <tr className="text-left text-xs uppercase tracking-wide text-slate-600">
              <th className="px-6 py-4">Vehicle No.</th>
              <th className="px-6 py-4">Vehicle Type</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Driver Phone</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {availableVehicles.map((vehicle: any) => (
              <tr
                key={vehicle.vehicle_id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4 font-bold text-slate-800">
                  {vehicle.vehicle_number}
                </td>

                <td className="px-6 py-4 text-sm">
                  {vehicle.vehicle_type}
                </td>

                <td className="px-6 py-4 font-semibold">
                  {vehicle.driver_name}
                </td>

                <td className="px-6 py-4">
                  {vehicle.driver_phone}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
                      vehicle.status === "Available"
                        ? "bg-green-100 text-green-700"
                        : vehicle.status === "Maintenance"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-200 bg-slate-50">
        <button
          onClick={() => setShowFleetModal(false)}
          className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}
      </div>
      
    );
  };

  // ----------------------------------------------------
  // SUB-PORTAL 2: FIELD WORKER PORTAL (CLEANING JOBS)
  // ----------------------------------------------------
  const FieldWorkerDashboard: React.FC = () => {
    // Simulated crew and worker credentials
    const crewId = 'TEAM_DELTA_4';
    const workerName = "Amit Kumar";
    const workerId = "WRK001";
    const crewName = "Delta-4 Clean-Up Crew";
    const assignedVehicleId = "TX-2204";
    const assignedVehicleType = "Heavy Compactor & Washer";
    const assignedVehicleStatus = "Operational (84% Fuel)";
    const driverName = "Ramesh Kumar";
    const [workerComplaints, setWorkerComplaints] = useState<any[]>([]);

    // Filter tasks assigned to this crew
    const myCrewsTasks = workerComplaints;
    console.log(workerComplaints[0]);
    
    // Divide into Active Assignment (ASSIGNED or IN_PROGRESS and no afterImage) vs Completed/Pending Verification
   const activeAssignment = myCrewsTasks.find(
  c => (c.status === "Assigned" || c.status === "In Progress")
);

const myCompletedTasks = myCrewsTasks.filter(
  c => c.status === "Resolved" || c.status === "Verified"
);

    // States for local operations
    const [workerStatus, setWorkerStatus] = useState<'Available' | 'Busy' | 'Offline'>(activeAssignment ? 'Busy' : 'Available');
    const [isNavigating, setIsNavigating] = useState(false);
    const [navigationStep, setNavigationStep] = useState(0);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [workerRemarks, setWorkerRemarks] = useState('');
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
    const [successToast, setSuccessToast] = useState('');
    const [showDetailTarget, setShowDetailTarget] = useState<Complaint | null>(null);
    useEffect(() => {
  const loadWorkerTasks = async () => {
    const data = await getWorkerComplaints();

    if (data.complaints) {
      setWorkerComplaints(data.complaints);
      console.log("Worker complaints:", data.complaints);
    }
  };

  loadWorkerTasks();
}, []);

    // Auto-sync status to busy if there's an active assignment
    React.useEffect(() => {
      if (activeAssignment && workerStatus === 'Available') {
        setWorkerStatus('Busy');
      } else if (!activeAssignment && workerStatus === 'Busy') {
        setWorkerStatus('Available');
      }
    }, [activeAssignment]);

    // Preselected after-cleaning photos for worker simulation
    const simulatedAfterPhotos = [
      { id: '1', name: 'Cleared Sidewalk', url: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=800' },
      { id: '2', name: 'Cleaned Pathway', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800' },
      { id: '3', name: 'Dustbin Sanitized', url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800' }
    ];

    // Navigation directions simulation steps
    const navigationDirections = [
      "Head North on Station Road toward Park Street (150m)",
      "Turn right onto Main Boulevard at the traffic signal (400m)",
      "Take the 2nd exit at the roundabout onto Municipal Ave (250m)",
      "In 100m, turn left into the complaint alley",
      "Arrived at waste site destination on the left."
    ];

    // Status toggle helper
    const handleStatusChange = (status: 'Available' | 'Busy' | 'Offline') => {
      setWorkerStatus(status);
      setSuccessToast(`Status updated to ${status}`);
      setTimeout(() => setSuccessToast(''), 3000);
      /* 
         BACKEND INTEGRATION:
         POST /api/worker/status
         Payload: { workerId: 'WRK-4029', status: status }
      */
    };
const handleStartTask = async () => {
  if (!activeAssignment) return;

  const result = await startWorkerTask(activeAssignment.complaint_id);

  if (result.message) {
    setSuccessToast("Task started successfully!");

    // Reload worker complaints from database
    const data = await getWorkerComplaints();

    if (data.complaints) {
      setWorkerComplaints(data.complaints);
    }

    setTimeout(() => setSuccessToast(""), 3000);
  }
};

    const handleNavigate = () => {
      if (!activeAssignment) return;
      setIsNavigating(true);
      setNavigationStep(0);
      setSuccessToast(`GPS Routing started for ${activeAssignment.id}`);
      setTimeout(() => setSuccessToast(''), 3000);
    };

    const handleNextNavStep = () => {
      if (navigationStep < navigationDirections.length - 1) {
        setNavigationStep(prev => prev + 1);
      } else {
        setIsNavigating(false);
        setSuccessToast("You have arrived at the complaint destination!");
        setTimeout(() => setSuccessToast(''), 3000);
      }
    };

    const handleUploadProofSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeAssignment) return;
      
      const photoUrl = simulatedAfterPhotos[selectedPhotoIndex].url;
      // Mark as completed by setting to RESOLVED and adding remarks
      updateComplaintStatus(activeAssignment.id, 'RESOLVED', photoUrl);
      addComplaintComment(activeAssignment.id, `Proof of cleaning uploaded by ${workerName}: "${workerRemarks || 'Debris cleared and disinfected.'}"`, true);
      
      setSuccessToast(`Job marked as COMPLETED! Proof submitted for review.`);
      setShowCompleteModal(false);
      setWorkerRemarks('');
      setIsNavigating(false);
      setTimeout(() => setSuccessToast(''), 3000);

      /* 
         BACKEND INTEGRATION:
         POST /api/worker/assignment/complete
         Payload: {
           complaintId: activeAssignment.id,
           remarks: workerRemarks,
           afterImage: photoUrl,
           workerId: 'WRK-4029',
           completionTime: new Date().toISOString()
         }
      */
    };

    // Calculate simulated SLA text remaining
    const getSlaRemainingText = (priority: string) => {
      if (priority === 'HIGH' || priority === 'URGENT') {
        return { text: "14 Hours remaining", color: "text-rose-600 bg-rose-50 border-rose-100" };
      }
      if (priority === 'MEDIUM') {
        return { text: "2 Days remaining", color: "text-amber-700 bg-amber-50 border-amber-100" };
      }
      return { text: "5 Days remaining", color: "text-slate-600 bg-slate-50 border-slate-100" };
    };

    return (
      <div className="space-y-6 max-w-md mx-auto sm:max-w-xl md:max-w-4xl text-left font-sans pb-16">
        
        {/* SUCCESS TOAST NOTIFICATION */}
        {successToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 animate-fadeIn animate-duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            🧹 {successToast}
          </div>
        )}

        {/* 1. WORKER PROFILE SECTION */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-50 flex-shrink-0 shadow-sm">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt={workerName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                Active Field Operator
              </span>
              <h2 className="text-lg font-black text-slate-800 mt-1">{workerName}</h2>
              <p className="text-xs text-slate-400 font-bold">ID: <span className="font-mono font-black text-slate-600">{workerId}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Assigned Crew</span>
              <span className="font-bold text-slate-700 truncate block mt-0.5">{crewName}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Vehicle Assigned</span>
              <span className="font-mono font-black text-slate-700 block mt-0.5">{assignedVehicleId}</span>
            </div>
          </div>

          {/* Interactive Current Status Selectors */}
          <div className="pt-2 border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">My Duty Status</span>
            <div className="grid grid-cols-3 gap-2">
              {(['Available', 'Busy', 'Offline'] as const).map((status) => {
                const isActive = workerStatus === status;
                const colors = {
                  Available: isActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-emerald-700 border-slate-150 hover:bg-emerald-50/50',
                  Busy: isActive ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-amber-700 border-slate-150 hover:bg-amber-50/50',
                  Offline: isActive ? 'bg-slate-700 text-white border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-150 hover:bg-slate-100'
                };
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    className={`py-2 px-1 text-center font-black text-[10px] uppercase rounded-xl border transition-all cursor-pointer ${colors[status]}`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. CURRENT ASSIGNMENT (PRIMARY SECTION) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              Primary Field Assignment
            </h3>
            {activeAssignment && (
              <span className="bg-rose-50 text-rose-700 text-[9px] font-black px-2.5 py-1 rounded-full border border-rose-100 uppercase animate-pulse">
                Active Job
              </span>
            )}
          </div>

          {activeAssignment ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
               {activeAssignment.image_before ? (
  <img
    src={activeAssignment.image_before}
    alt="Complaint"
    className="w-full h-full object-cover"
  />
) : (
  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500">
    No complaint image uploaded
  </div>
)}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className="bg-slate-900/90 text-white text-[9px] font-mono font-black px-2.5 py-1 rounded-lg shadow-sm">
                   {activeAssignment.complaint_code}
                  </span>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm ${
                    activeAssignment.priority === 'HIGH' || activeAssignment.priority === 'URGENT'
                      ? 'bg-red-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {activeAssignment.priority} PRIORITY
                  </span>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Waste Category</span>
                    <span className="text-xs font-extrabold text-slate-800 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg block w-max mt-0.5">
                      {activeAssignment.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Complaint Address</span>
                    <p className="text-xs font-bold text-slate-700 flex items-start gap-1 mt-0.5">
                      <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      {activeAssignment.address}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Dispatch / Assigned Time</span>
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                     {new Date(activeAssignment.submitted_at).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">SLA Remaining Time</span>
                    <div className={`text-xs font-black px-2.5 py-1 rounded-lg border w-max mt-0.5 ${getSlaRemainingText(activeAssignment.priority).color}`}>
                      ⚠️ {getSlaRemainingText(activeAssignment.priority).text}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-semibold">
                <span className="font-bold text-slate-500 block uppercase text-[9px] mb-1">Citizen Notes</span>
                "{activeAssignment.description || 'No additional comments provided by the citizen.'}"
              </div>

              {/* ACTION BUTTONS PANEL */}
              <div className="pt-2 border-t border-slate-50 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Task Controls</span>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* BUTTON 1: Navigate */}
                  <button
                    type="button"
                    onClick={handleNavigate}
                    className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Compass className={`w-4 h-4 text-emerald-600 ${isNavigating ? 'animate-spin' : ''}`} />
                    Navigate
                  </button>

                  {/* BUTTON 2: Start Work */}
                  <button
                    type="button"
                    disabled={activeAssignment.status === 'In Progress'}
                    onClick={handleStartTask}
                    className={`font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                     activeAssignment.status === 'Assigned'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {activeAssignment.status === 'Assigned' ? "Start Work" : "Work In Progress"}
                  </button>

                  {/* BUTTON 3: Upload After Photo */}
                  <button
                    type="button"
                    disabled={activeAssignment.status !== 'In Progress'}
                    onClick={() => setShowCompleteModal(true)}
                    className={`font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      activeAssignment.status === 'In Progress'
                        ? 'bg-slate-900 hover:bg-slate-850 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    Upload After Photo
                  </button>

                  {/* BUTTON 4: Mark Completed */}
                  <button
                    type="button"
                    disabled={activeAssignment.status !== 'IN_PROGRESS'}
                    onClick={() => setShowCompleteModal(true)}
                    className={`font-extrabold text-xs py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      activeAssignment.status === 'IN_PROGRESS'
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Completed
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-black text-slate-800">All Assignments Cleared!</h4>
              <p className="text-xs text-slate-400 font-bold max-w-[280px] mx-auto">
                No active cleanups assigned. Enjoy the downtime or switch your duty status to Offline.
              </p>
            </div>
          )}
        </div>

        {/* 3. ASSIGNED VEHICLE DETAILS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
            <Truck className="w-4 h-4 text-emerald-600" />
            Assigned Operations Vehicle
          </h3>

          {activeAssignment?.assignedVehicle ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Vehicle Number</span>
                  <span className="font-mono font-black text-slate-800 block mt-0.5">{activeAssignment.assignedVehicle.number}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Vehicle Type</span>
                  <span className="font-bold text-slate-800 block mt-0.5 truncate">{activeAssignment.assignedVehicle.type}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Fleet Status</span>
                  <span className={`font-bold block mt-0.5 truncate ${
                    activeAssignment.assignedVehicle.status === 'Completed' ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    ● {activeAssignment.assignedVehicle.status}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Assigned Driver</span>
                  <span className="font-bold text-slate-800 block mt-0.5 truncate">{activeAssignment.assignedVehicle.driverName || "Designated Driver"}</span>
                </div>
              </div>

              {/* Interactive Status Controls for Worker */}
              <div className="pt-2 border-t border-slate-50 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Update Vehicle Work Status</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['Assigned', 'On Route', 'Cleaning', 'Completed'] as const).map((status) => {
                    const isCurrent = activeAssignment.assignedVehicle?.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          updateVehicleStatus(activeAssignment.assignedVehicle!.id, status);
                          setSuccessToast(`Vehicle status updated to: ${status}`);
                          setTimeout(() => setSuccessToast(''), 3000);
                        }}
                        className={`py-2 px-1 text-center font-black text-[10px] uppercase rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="text-sm font-bold text-slate-500 block">🚛 Vehicle</span>
              <p className="text-[10px] font-extrabold text-slate-400 mt-1 uppercase">Awaiting Assignment</p>
            </div>
          )}
        </div>

        {/* 4. NAVIGATION MAP SECTION */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-50">
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600 animate-pulse" />
                Target Navigation Compass
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Only showing map coordinates for your assigned cleanup spot</p>
            </div>
            {activeAssignment && !isNavigating && (
              <button
                type="button"
                onClick={handleNavigate}
                className="bg-slate-900 hover:bg-slate-850 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Compass className="w-3.5 h-3.5" />
                Start Navigate
              </button>
            )}
          </div>

          {activeAssignment ? (
            <div className="space-y-3">
              {/* COMPACT MAP SHOWING ONLY ACTIVE COMPLAINT */}
              <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                <MockMap complaints={[activeAssignment]} selectedComplaintId={activeAssignment.id} />
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-700 shadow-sm truncate flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  Destination: {activeAssignment.address}
                </div>
              </div>

              {/* Step-by-Step Simulated GPS Route Navigation Panel */}
              {isNavigating && (
                <div className="bg-emerald-950 text-white p-4 rounded-2xl space-y-3 shadow-md border border-emerald-900 animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-emerald-900">
                    <span className="text-[9px] font-black tracking-widest text-emerald-300 uppercase block">
                      Turn-by-Turn GPS Active
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-200">
                      Step {navigationStep + 1} of {navigationDirections.length}
                    </span>
                  </div>

                  <p className="text-xs font-extrabold leading-relaxed text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {navigationDirections[navigationStep]}
                  </p>

                  <button
                    type="button"
                    onClick={handleNextNavStep}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                  >
                    {navigationStep === navigationDirections.length - 1 ? "Finish Route" : "Next Driving Step →"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-2xl text-center text-xs text-slate-400 font-bold">
              <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No active navigation target. Awaiting assignment.
            </div>
          )}
        </div>

        {/* 5. COMPLETED JOBS HISTORY */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Completed History Log ({myCompletedTasks.length})
          </h3>

          <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            {myCompletedTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4 font-bold">No jobs completed today.</p>
            ) : (
              myCompletedTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-150 transition-all gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                        {task.id}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">
                        {task.resolveTime || task.submitTime || "Today"}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-700 text-xs truncate mt-1">{task.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold truncate">{task.address}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                      {task.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDetailTarget(task)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs cursor-pointer transition-all"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WORKER COMPLETION & PHOTO UPLOAD MODAL */}
        {showCompleteModal && activeAssignment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn animate-duration-150">
            <form onSubmit={handleUploadProofSubmit} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <h3 className="font-black text-slate-800 text-sm md:text-base">Upload Proof & Complete</h3>
                  <p className="text-[10px] text-slate-400 font-black font-mono mt-0.5">ID: {activeAssignment.id}</p>
                </div>
                <button type="button" onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Simulator Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Select AFTER cleaning photo proof</label>
                <div className="grid grid-cols-3 gap-2">
                  {simulatedAfterPhotos.map((photo, idx) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPhotoIndex === idx 
                          ? 'border-emerald-600 scale-102 ring-2 ring-emerald-500/20' 
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[8px] font-black text-center py-0.5 truncate">
                        {photo.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Remarks Form */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase block">Completion Remarks</label>
                <textarea
                  value={workerRemarks}
                  onChange={(e) => setWorkerRemarks(e.target.value)}
                  placeholder="e.g. Swept all plastics, pressure washed with sanitizers and cleared the garbage heap."
                  required
                  className="w-full h-20 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 font-semibold resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer text-center"
                >
                  Complete Job
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DETAILED VIEW POPUP FOR COMPLETED JOBS */}
        {showDetailTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn animate-duration-150">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-left max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <div>
                  <h3 className="font-black text-slate-800 text-sm md:text-base">Work Order Details</h3>
                  <p className="text-[10px] text-slate-400 font-mono font-black mt-0.5">ID: {showDetailTarget.id}</p>
                </div>
                <button type="button" onClick={() => setShowDetailTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded uppercase">Before</span>
                  <div className="aspect-square bg-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                    <img src={showDetailTarget.beforeImage} alt="Before" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">After</span>
                  <div className="aspect-square bg-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                    <img src={showDetailTarget.afterImage || "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=800"} alt="After" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Complaint Title</span>
                  <p className="font-extrabold text-slate-700">{showDetailTarget.title}</p>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Location</span>
                  <p className="font-bold text-slate-600 flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                    {showDetailTarget.address}
                  </p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Worker Report Comments</span>
                  <p className="font-medium text-slate-600 leading-relaxed italic">
                    "{showDetailTarget.comments.find(c => c.text.includes("Proof"))?.text || "Work order successfully executed and swept. Chemical disinfectants applied on spot."}"
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailTarget(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        )}

      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER CONDITIONAL DECISION MATRIX
  // ----------------------------------------------------
  if (authoritySubRole === 'Supervisor') {
    return <SupervisorDashboard />;
  }
  if (authoritySubRole === 'Field Worker') {
    return <FieldWorkerDashboard />;
  }

  // Fallback / Default: Standard Central Admin Dashboard

  // Calculate Alerts for the compact Card
  const dynamicAlerts = React.useMemo(() => {
    const list: { type: string; title: string; desc: string; severity: string; time: string; id: string }[] = [];
    if (!complaints) return list;

    // 1. High priority/urgent dispatch warnings
    complaints.forEach(c => {
      if (c.status === 'SUBMITTED' && (c.priority === 'HIGH' || c.priority === 'URGENT')) {
        list.push({
          id: c.id,
          type: 'DISPATCH',
          title: `New Dispatch Required`,
          desc: `High priority case ${c.id}`,
          severity: 'CRITICAL',
          time: c.submitTime
        });
      }
    });

    // 2. SLA Breaches
    complaints.forEach(c => {
      if (c.status !== 'RESOLVED' && c.status !== 'VERIFIED') {
        const { isOverdue } = getSlaInfo(c.submitTime, c.priority);
        if (isOverdue) {
          list.push({
            id: c.id,
            type: 'SLA',
            title: `SLA Breach Alarm`,
            desc: `Grievance ${c.id} crossed time limit`,
            severity: 'CRITICAL',
            time: 'Overdue'
          });
        }
      }
    });

    // 3. Worker proof photos (Verification Pending)
    complaints.forEach(c => {
      if (c.status !== 'RESOLVED' && c.afterImage) {
        list.push({
          id: c.id,
          type: 'VERIFICATION',
          title: `Resolution Proof Uploaded`,
          desc: `Proof photo for ${c.id}`,
          severity: 'WARNING',
          time: c.resolveTime || 'Recently'
        });
      }
    });

    // 4. Feedback (only for verified & resolved cases)
    if (feedbacks) {
      feedbacks.forEach(fb => {
        const c = complaints.find(comp => comp.id === fb.complaintId);
        if (c && c.status === 'RESOLVED') {
          list.push({
            id: fb.id,
            type: 'FEEDBACK',
            title: `Feedback: ${fb.overallExperience}/5★`,
            desc: `Grievance ${fb.complaintId} rated`,
            severity: 'INFO',
            time: fb.submissionDate
          });
        }
      });
    }

    return list;
  }, [complaints, feedbacks]);

  const totalActiveAlerts = dynamicAlerts.length;
  const criticalAlertsCount = dynamicAlerts.filter(a => a.severity === 'CRITICAL').length;
  const highestPriorityAlert = dynamicAlerts.find(a => a.severity === 'CRITICAL') 
    ? `${dynamicAlerts.find(a => a.severity === 'CRITICAL')?.type} violation on ${dynamicAlerts.find(a => a.severity === 'CRITICAL')?.id}`
    : dynamicAlerts.length > 0 
      ? `${dynamicAlerts[0].type} warning` 
      : 'No active alarms';

  // Calculate Activities for the compact Card
  const dynamicActivities = React.useMemo(() => {
    const list: { type: string; title: string; time: string; id: string }[] = [];
    if (!complaints) return list;

    complaints.forEach(c => {
      list.push({
        id: `z_sub_${c.id}`,
        type: 'SUBMITTED',
        title: `Grievance logged at ${c.address}`,
        time: c.submitTime
      });

      if (c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS' || c.status === 'RESOLVED' || c.status === 'VERIFIED') {
        list.push({
          id: `y_asg_${c.id}`,
          type: 'ASSIGNED',
          title: `Crew dispatched to ${c.address}`,
          time: c.assignTime || c.submitTime
        });
      }

      if (c.status === 'RESOLVED' || c.status === 'VERIFIED') {
        list.push({
          id: `x_res_${c.id}`,
          type: 'RESOLVED',
          title: `Grievance marked RESOLVED for ${c.id}`,
          time: c.resolveTime || 'Recently'
        });
      }
    });

    if (feedbacks) {
      feedbacks.forEach(fb => {
        list.push({
          id: `w_fb_${fb.id}`,
          type: 'FEEDBACK',
          title: `Feedback logged: ${fb.overallExperience}/5 ★`,
          time: fb.submissionDate
        });
      });
    }

    // Sort chronologically using custom alphabetical reverse matching
    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [complaints, feedbacks]);

  const totalActivitiesToday = React.useMemo(() => {
    return dynamicActivities.filter(act => {
      const time = act.time.toLowerCase();
      return time.includes('jul 14') || 
             time.includes('july 14') || 
             time.includes('ago') || 
             time.includes('today') || 
             time.includes('recently');
    }).length;
  }, [dynamicActivities]);

  const latestActivity = dynamicActivities.length > 0 ? dynamicActivities[0] : null;
  const lastUpdatedTime = latestActivity ? latestActivity.time : 'Recently';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-50">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Municipal Command Console</h2>
          <p className="text-xs text-slate-500 font-semibold">City-wide real-time environmental grievances overview</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse shadow-sm shadow-emerald-500/10">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            LIVE TELEMETRY
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Complaints */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Complaints</span>
            <span className="text-2xl font-black text-slate-800">{total}</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        {/* Pending Assignment */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Assignment</span>
            <span className="text-2xl font-black text-amber-600">{pending}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        {/* In Progress */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">In Progress</span>
            <span className="text-2xl font-black text-blue-600">{inProgress}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Awaiting Verification */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Awaiting Verification</span>
            <span className="text-2xl font-black text-purple-600">{awaitingVerify}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
            <Check className="w-5 h-5" />
          </div>
        </div>

        {/* Municipal Fleet Dashboard Summary Card */}
        <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between text-left">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-slate-500">Municipal Fleet</span>
            <div className="mt-1.5 space-y-0.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Total:</span>
                <span className="text-slate-700 font-extrabold">{vehicles?.length || 18}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Available:</span>
                <span className="text-emerald-600 font-extrabold">{vehicles?.filter(v => v.status === 'Available').length ?? 10}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Assigned:</span>
                <span className="text-blue-600 font-extrabold">{vehicles?.filter(v => ['Assigned', 'On Route', 'Cleaning', 'Completed'].includes(v.status)).length ?? 6}</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Maint.:</span>
                <span className="text-rose-600 font-extrabold">{vehicles?.filter(v => v.status === 'Maintenance').length ?? 2}</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      

      {/* GIS Analytics charts moved to dedicated Hotspot Map page */}

      {/* High Priority Dispatch Feed */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">Urgent Dispatch Priorities</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Top unresolved grievances sorted by priority and oldest submit date</p>
          </div>
          <button
            onClick={() => navigate('/admin/complaints')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
          >
            Review All Complaints
          </button>
        </div>

        <div className="space-y-3">
          {(() => {
            const getTimestamp = (timeStr: string) => {
              try {
                if (!timeStr) return 0;
                const cleanStr = timeStr.replace(',', '');
                const parsed = Date.parse(cleanStr);
                if (!isNaN(parsed)) return parsed;
                return 0;
              } catch {
                return 0;
              }
            };

            const getPriorityWeight = (prio: string) => {
              const u = (prio || '').toUpperCase();
              if (u === 'URGENT') return 4;
              if (u === 'HIGH') return 3;
              if (u === 'MEDIUM') return 2;
              return 1;
            };

            const unresolvedList = dbComplaints
              .filter(c => c.status !== 'RESOLVED' && c.status !== 'VERIFIED')
              .sort((a, b) => {
                const wA = getPriorityWeight(a.priority);
                const wB = getPriorityWeight(b.priority);
                if (wB !== wA) return wB - wA; // Highest priority first

                const tA = getTimestamp(a.submitTime);
                const tB = getTimestamp(b.submitTime);
                return tA - tB; // Oldest complaint first
              })
              .slice(0, 5);

            if (unresolvedList.length === 0) {
              return (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">All Grievances Dispatched</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">No unresolved complaints are currently awaiting crew assignment.</p>
                </div>
              );
            }

            return unresolvedList.map((comp) => {
              const weight = getPriorityWeight(comp.priority);
              const isUrgent = weight >= 3;
              return (
                <div
                  key={comp.complaint_id}
                  onClick={() => navigate(`/admin/complaints`)}
                  className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all hover:translate-x-0.5 ${
                    isUrgent
                      ? 'bg-rose-50/20 hover:bg-rose-50/40 border-rose-100/80'
                      : 'bg-slate-50/40 hover:bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                   <img
                      src={
                        comp.image_before
                          ? `http://127.0.0.1:5000/${comp.image_before.replace("\\", "/")}`
                          : ""
                      } alt="Debris" className="w-full h-full object-cover" />
                                      </div>
                  <div className="flex-grow min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                        comp.priority === 'URGENT'
                          ? 'text-purple-700 bg-purple-100/50 border border-purple-200/30'
                          : comp.priority === 'HIGH'
                            ? 'text-red-700 bg-red-100/50 border border-red-200/30'
                            : comp.priority === 'MEDIUM'
                              ? 'text-orange-700 bg-orange-100/50 border border-orange-200/30'
                              : 'text-yellow-700 bg-yellow-100/50 border border-yellow-200/30'
                      }`}>
                        {comp.priority} PRIORITY
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {comp.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{comp.complaint_code}</span>
                    </div>
                    <p className="font-extrabold text-slate-800 text-xs truncate mt-1">{comp.description}</p>
                    <p className="text-[10px] text-slate-500 truncate">{comp.zone_name} • Submitted: <span className="font-bold text-slate-600">{comp.submitted_at}</span></p>
                  </div>
                  <button 
                  
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-full transition-all cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              );
            });
          })()}
        </div>
      </section>

     
    </div>
  );
};
