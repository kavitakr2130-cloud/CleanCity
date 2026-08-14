import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Trash2, 
  ArrowUpDown, 
  AlertTriangle, 
  AlertCircle, 
  UserPlus, 
  Check, 
  X, 
  ShieldCheck, 
  MapPin, 
  Truck, 
  Send, 
  MessageSquare, 
  Phone, 
  User, 
  Calendar, 
  Activity,
  Star,
  ExternalLink,
  FileText,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus, Complaint } from '../../types';
import { TranslatedText } from '../../components/TranslatedText';
import { getAllComplaints, getSupervisorComplaints, getWorkerComplaints,} from "../../services/api";
import {
  getSupervisors,
  getWorkers,
  assignSupervisor,
  assignWorker,
} from "../../services/api";

// ============================================================================
// FUTURE BACKEND INTEGRATION - DATABASE SCHEMA BLUEPRINTS (Flask + MySQL Ready)
// ============================================================================
// This section describes the relational schema mappings that this component's
// state structure is prepared for. After moving to Flask + MySQL, simply fetch
// these entities from your api endpoints (e.g., `/api/admin/complaints`) and
// bind them directly to the state variables.
//
// 1. complaints (ID, Title, Description, Category, Status, Priority, Latitude, Longitude, Address, BeforeImage, SubmitTime)
// 2. workers (ID, Name, TeamName, Avatar, Status, Phone)
// 3. supervisors (ID, Name, ZoneName, Avatar)
// 4. assignments (ComplaintID, WorkerID, SupervisorID, AssignedAt, Status)
// 5. worker_uploads (ComplaintID, PhotoURL, UploadedAt, Type: 'BEFORE'|'AFTER')
// 6. feedback (ComplaintID, ResolutionQuality, StaffBehaviour, ResponseTime, OverallExperience, CitizenComment, SubmissionDate)
// ============================================================================

// Helper to determine complaint Zone/Sector
export const getZoneOfComplaint = (comp: any): string => {
  return comp.zone_name || "Unknown Zone";
};

export const getAssignedWorker = (comp: any): string => {
  return comp.worker_name || "Not Assigned";
};

// Helper to get Assigned Supervisor Name based on Sector
export const getAssignedBy = (comp: Complaint): string => {
  if (!comp.assignedTeamName) return '—';
  const zone = getZoneOfComplaint(comp);
  if (zone === 'Sector 04') return 'Supervisor Rajesh';
  if (zone === 'Sector 12') return 'Supervisor Kapoor';
  if (zone === 'Sector 19') return 'Supervisor Nair';
  return 'Admin Dispatcher';
};

// Helper to get Assigned Date & Time
export const getAssignedTime = (comp: Complaint): string => {
  if (!comp.assignedTeamName) return '—';
  return comp.assignTime || 'Oct 25, 2023, 08:45 AM';
};

// Helper to format assigned date for compact view
export const formatAssignmentDate = (dateTimeStr: string): string => {
  if (!dateTimeStr || dateTimeStr === '—') return '—';
  try {
    const dateOnly = dateTimeStr.split(',')[0].trim();
    const dateObj = new Date(dateTimeStr);
    if (!isNaN(dateObj.getTime())) {
      const day = dateObj.getDate();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      return `${day} ${month} ${year}`;
    }
    const parts = dateOnly.replace(/,/g, '').split(' ');
    if (parts.length >= 2) {
      const day = parts[1];
      const month = parts[0];
      const year = parts[2] || '2023';
      return `${day} ${month} ${year}`;
    }
  } catch (e) {
    // ignore
  }
  return dateTimeStr.split(',')[0];
};

// Helper to compute SLA and days pending
export const getSlaInfo = (submitTimeStr: string, priority: string) => {
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
      // If it's a mock date from 2023, simulate "current date" of Oct 28, 2023
      if (submitDate.getFullYear() === 2023) {
        now = new Date(2023, 9, 28, 12, 0, 0); // Oct 28, 2023
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

export const ViewComplaints: React.FC = () => {
  const { 
    complaints, 
    teams, 
    feedbacks,
    authoritySubRole, 
    assignWorkforce, 
    updateComplaintStatus, 
    addComplaintComment 
  } = useApp();
  const [dbComplaints, setDbComplaints] = React.useState<any[]>([]);

React.useEffect(() => {
  const loadComplaints = async () => {
   const data =
  authoritySubRole === "Supervisor"
    ? await getSupervisorComplaints()
    : authoritySubRole === "Field Worker"
    ? await getWorkerComplaints()
    : await getAllComplaints();

    if (data.complaints) {
      setDbComplaints(data.complaints);
      console.log(data.complaints.length);
    }
  };

  loadComplaints();
}, []);
  const navigate = useNavigate();

  // Search and Filter States (shared names, but scoped in usage)
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [priority, setPriority] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  // New Admin Assignment & Jurisdiction Filters
  const [assignmentFilter, setAssignmentFilter] = useState<string>('ALL'); // ALL, ASSIGNED, UNASSIGNED
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');             // ALL, Sector 04, Sector 12, Sector 19
  const [workerFilter, setWorkerFilter] = useState<string>('ALL');         // ALL, Amit Sharma, John Davis, Carlos Mendez
  const [supervisorFilter, setSupervisorFilter] = useState<string>('ALL'); // ALL, Supervisor Rajesh, Supervisor Kapoor, Supervisor Nair, Admin Dispatcher
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Interactive Action States
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [inspectTargetId, setInspectTargetId] = useState<string | null>(null);
  const [viewTargetId, setViewTargetId] = useState<string | null>(null);
React.useEffect(() => {
  if (viewTargetId !== null) {
    alert("viewTargetId = " + viewTargetId);
  }
}, [viewTargetId]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [workers, setWorkers] = React.useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [supervisorDetailsTarget, setSupervisorDetailsTarget] = useState<any>(null);
  const [inspectionRemarks, setInspectionRemarks] = useState('');

  // Find active records based on selected IDs
const assignTarget = React.useMemo(
  () => dbComplaints.find(c => c.complaint_id === assignTargetId) || null,
  [dbComplaints, assignTargetId]
);
  console.log("assignTargetId:", assignTargetId);
  console.log("assignTarget:", assignTarget);
  const inspectTarget = React.useMemo(() => complaints.find(c => c.id === inspectTargetId) || null, [complaints, inspectTargetId]);
const viewTarget = React.useMemo(
  () =>
    dbComplaints.find(
      (c: any) => String(c.complaint_id) === String(viewTargetId)
    ) || null,
  [dbComplaints, viewTargetId]
);

  // Filter complaints based on Supervisor role jurisdiction (Sector 04)
  const zoneComplaints = React.useMemo(() => {
    return dbComplaints.filter((c: any) => {
      if (authoritySubRole === 'Supervisor') {
      const code = parseInt((c.complaint_code || "").replace("CC", "")) || 0;
        return code % 2 === 1 || c.address.includes('4') || c.address.toLowerCase().includes('park');
      }
      return true;
    });
  }, [dbComplaints, authoritySubRole]);

  // Zone specific stats for Supervisor panel
  const zoneStats = React.useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let awaitingVerification = 0;
    let resolved = 0;

    zoneComplaints.forEach(c => {
      if (c.status === 'SUBMITTED') {
        pending++;
      } else if ((c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS') && !c.afterImage) {
        inProgress++;
      } else if (c.status !== 'RESOLVED' && c.afterImage) {
        awaitingVerification++;
      } else if (c.status === 'RESOLVED' || c.status === 'VERIFIED') {
        resolved++;
      }
    });

    return {
      total: zoneComplaints.length,
      pending,
      inProgress,
      awaitingVerification,
      resolved
    };
  }, [zoneComplaints]);

  // Filter complaints based on search query, category, priority, status, date, and newly requested assignment parameters
  console.log("dbComplaints:", dbComplaints.length);
console.log("zoneComplaints:", zoneComplaints.length);
  const filtered = React.useMemo(() => {
    return zoneComplaints.filter(c => {
   const matchesSearch =
  (c.complaint_code || "").toLowerCase().includes(search.toLowerCase()) ||
  (c.description || "").toLowerCase().includes(search.toLowerCase()) ||
  (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
  (c.category || "").toLowerCase().includes(search.toLowerCase()) ||
  (c.zone_name || "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory = category === 'ALL' || c.category === category;
      const matchesPriority = priority === 'ALL' || c.priority === priority;
      
      const matchesStatus = status === 'ALL' || (
        status === 'Submitted' ? c.status === 'Submitted' :
        status === 'Assigned' ? (c.status === 'Assigned' || c.status === 'In Progress') && !c.afterImage :
        status === 'AWAITING_VERIFICATION' ? c.status !==  'Resolved' && c.afterImage :
        status === 'Resolved' ? c.status ===  'Resolved' || c.status === 'Verified' :
        c.status === status
      );

      const { daysPending } = getSlaInfo(c.submitted_at, c.priority);
      const matchesDate = dateFilter === 'ALL' || (
        dateFilter === 'TODAY' ? daysPending <= 1 :
        dateFilter === 'WEEK' ? daysPending <= 7 :
        dateFilter === 'MONTH' ? daysPending <= 30 :
        true
      );

      // City-wide Assignment status filter (🟢 Assigned / 🔴 Un
      // ed)
      const isAssigned = !!c.assignedTeamName;
      const matchesAssignment = assignmentFilter === 'ALL' || (
        assignmentFilter === 'ASSIGNED' ? isAssigned : !isAssigned
      );

      // Zone filter
     const matchesZone =
  zoneFilter === "ALL" ||
  (c.zone_name || "").trim() === zoneFilter.trim();
      // Worker name filter
      const matchesWorker = workerFilter === 'ALL' || getAssignedWorker(c) === workerFilter;

      // Supervisor filter
      const matchesSupervisor = supervisorFilter === 'ALL' || getAssignedBy(c) === supervisorFilter;

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesDate && matchesAssignment && matchesZone && matchesWorker && matchesSupervisor;
    });
  }, [zoneComplaints, search, category, priority, status, dateFilter, assignmentFilter, zoneFilter, workerFilter, supervisorFilter]);

  const priorityWeight = (p: string) => {
    const upper = (p || '').toUpperCase();
    if (upper === 'HIGH' || upper === 'URGENT') return 3;
    if (upper === 'MEDIUM') return 2;
    return 1;
  };

  // Sort complaints by priority weight first and then by oldest pending
  const sortedAndFiltered = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const weightA = priorityWeight(a.priority);
      const weightB = priorityWeight(b.priority);
      
      if (weightA !== weightB) {
        return weightB - weightA; // High priority weight first
      }
      
      const timeA = Date.parse((a.submitTime || '').replace(',', '')) || 0;
      const timeB = Date.parse((b.submitTime || '').replace(',', '')) || 0;
      return timeA - timeB; // Oldest pending first
    });
  }, [filtered]);

  // Handlers for Supervisor / Admin actions
 const handleAssignDispatch = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!assignTarget || !selectedTeamId) return;

 const result = await assignSupervisor(
  assignTarget.complaint_id,
  Number(selectedTeamId)
);

  console.log(result);

  if (result.message) {
   setSuccessToast("Supervisor assigned successfully.");

    // Reload complaints from database
   const data =
  authoritySubRole === "Supervisor"
    ? await getSupervisorComplaints()
    : authoritySubRole === "Field Worker"
    ? await getWorkerComplaints()
    : await getAllComplaints();
    if (data.complaints) {
      setDbComplaints(data.complaints);
    }
    setAssignTargetId(null);
    setSelectedTeamId("");
  }
  setTimeout(() => setSuccessToast(""), 3000);
};
  const handleVerifyClosure = (approve: boolean) => {
    if (!inspectTarget) return;
    if (approve) {
      updateComplaintStatus(inspectTarget.id, 'RESOLVED');
      addComplaintComment(inspectTarget.id, `Quality audit COMPLETED & APPROVED by Supervisor Rajesh: "${inspectionRemarks || 'Cleanup standards met.'}"`, true);
      setSuccessToast(`Grievance ${inspectTarget.id} verified and closed successfully!`);
    } else {
      updateComplaintStatus(inspectTarget.id, 'ASSIGNED');
      addComplaintComment(inspectTarget.id, `Quality audit REJECTED by Supervisor Rajesh. Reason: ${inspectionRemarks || 'Cleanup is incomplete, please sweep and wash the area again.'}`, true);
      setSuccessToast(`Work order ${inspectTarget.id} sent back to field crew for re-cleaning.`);
    }
    setInspectTargetId(null);
    setInspectionRemarks('');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewTarget || !newCommentText.trim()) return;
    addComplaintComment(viewTarget.id, newCommentText.trim(), true);
    setNewCommentText('');
  };

  // Render Supervisor Dashboard View if current role is supervisor
  if (authoritySubRole === 'Supervisor') {
    return (
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full uppercase">
              Assigned Control District
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5">
              North District – Sector 04
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Zone Supervisor Terminal • Monitor, dispatch, and approve local grievances
            </p>
          </div>
          <span className="bg-emerald-600 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            ZONE OPERATOR ONLINE
          </span>
        </div>

        {/* Zone Specific Active Filter Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-left">
          <span className="text-slate-600">📋 Complaint Registry Focus:</span>
          <span>Showing <strong className="text-slate-800 font-extrabold">{sortedAndFiltered.length}</strong> of <strong className="text-slate-800 font-extrabold">{zoneComplaints.length}</strong> complaints registered in Sector 04</span>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-slate-900 text-emerald-400 font-bold p-3.5 rounded-2xl border border-slate-850 shadow-lg text-center text-xs animate-fadeIn">
            ⚡ {successToast}
          </div>
        )}

        {/* Zone Specific Filters */}
        <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Sector 04 complaints by ID, title, address, or category..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 block mb-1">Filter Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted / Pending</option>
                <option value="ASSIGNED">Assigned / In Progress</option>
                <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
                <option value="RESOLVED">Resolved / Cleared</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 block mb-1">Filter Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 block mb-1">Filter Waste Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
              >
                <option value="ALL">All Waste Types</option>
                <option value="Household">Household Waste</option>
                <option value="Plastic">Plastic Debris</option>
                <option value="Construction">Construction Debris</option>
                <option value="Hazardous">Hazardous Waste</option>
                <option value="Other">Other Category</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 block mb-1">Filter Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 bg-white"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Filed Today (24h)</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
              </select>
            </div>
          </div>
        </section>

        {/* Complaint Table Layout (Desktop) & Cards Layout (Mobile) */}
        {sortedAndFiltered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
            <Filter className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-black text-slate-500">No zone grievances match criteria</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto font-medium">
              No local complaints belong to the current filter state in Sector 04.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-4 px-5">Grievance</th>
                    <th className="py-4 px-5">Location & Category</th>
                    <th className="py-4 px-5">Filed / SLA</th>
                    <th className="py-4 px-5">Worker/Crew</th>
                    <th className="py-4 px-5">Vehicle</th>
                    <th className="py-4 px-5 text-right">Jurisdiction Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedAndFiltered.map((comp) => {
                    const { daysPending, slaLimitText, isOverdue } = getSlaInfo(comp.submitTime, comp.priority);
                    const isAwaitingVerify = comp.status !== 'RESOLVED' && comp.afterImage;
                    const isResolved = comp.status === 'RESOLVED' || comp.status === 'VERIFIED';
              const isAssigned =
  !!comp.supervisor_name &&
  comp.status !== "Submitted";
                    return (
                      <tr 
                        key={comp.id} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isOverdue && !isResolved ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {/* ID and Image */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 relative">
                              <img src={
                                  comp.image_before
                                    ? `http://127.0.0.1:5000/${comp.image_before.replace(/\\/g, "/")}`
                                    : ""
                                } alt="Before" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-800 font-mono block">{comp.id}</span>
                              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">{comp.category}</span>
                            </div>
                          </div>
                        </td>

                        {/* Title and address */}
                        <td className="py-4 px-5 max-w-xs">
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-800 text-xs truncate">
                              <TranslatedText text={comp.title} />
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <TranslatedText text={comp.address} />
                            </p>
                          </div>
                        </td>

                        {/* Filed date & SLA */}
                        <td className="py-4 px-5">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">{comp.submitTime}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {isResolved ? (
                                <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                  Resolved SLA
                                </span>
                              ) : isOverdue ? (
                                <span className="text-[9px] font-black text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <span className="w-1 h-1 bg-rose-500 rounded-full animate-ping" />
                                  OVERDUE
                                </span>
                              ) : (
                                <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Within SLA ({slaLimitText})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Workforce Team info */}
                        <td className="py-4 px-5">
                          {!isResolved && (
                           comp.worker_name ? (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
<img
  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(comp.worker_name)}`}
  alt="Worker"
  className="w-full h-full object-cover"
/>
                           </div>
                                <span className="text-xs font-bold text-slate-700">{comp.worker_name}</span>
                              </div>
                            ) : (
                              ['SUBMITTED', 'REOPENED', 'REJECTED'].includes(comp.status) ? (
                                <span className="text-[10px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded">
                                  No Crew Assigned
                                </span>
                              ) : (
                                <div className="flex justify-center items-center w-20">
                                  <span className="font-black text-slate-900 text-base">
                                    -
                                  </span>
                                </div>
                              )
                            )
                          )}
                        </td>

                        {/* Compact Vehicle info */}
                        <td className="py-4 px-5 text-xs font-mono font-extrabold text-slate-700">
                          {comp.assignedVehicle ? comp.assignedVehicle.number : '—'}
                        </td>

                        {/* Scoped Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                             <div
  onClick={async () => {
    if (!isResolved && !isAwaitingVerify && !isAssigned) {
       console.log("Assign clicked");
      setAssignTargetId(comp.complaint_id);

      const data = await getWorkers();
          console.log(data);

      if (data.workers) {
        setWorkers(data.workers);
      }
    }
  }}
  className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer ${
    !isResolved && !isAwaitingVerify && !isAssigned
      ? "bg-emerald-600 text-white"
      : "bg-slate-50 border border-slate-100 text-slate-500"
  }`}
>
                              {!isResolved && !isAwaitingVerify && !isAssigned ? null :
                             <>
  <span>Status:</span>

  <strong
    className={
      comp.status === "RESOLVED"
        ? "text-emerald-600 font-extrabold"
        : comp.status === "VERIFIED"
        ? "text-purple-600 font-extrabold"
        : comp.status === "IN_PROGRESS"
        ? "text-blue-600 font-extrabold"
        : "text-amber-600 font-extrabold"
    }
  >
    {comp.status === "RESOLVED"
      ? "Resolved"
      : comp.status === "VERIFIED"
      ? "Awaiting Verification"
      : comp.status === "IN_PROGRESS"
      ? "In Progress"
      : "Submitted"}
  </strong>
</>
}
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                                onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                setViewTargetId(String(comp.complaint_id));
                            }}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                              title="View Complaint"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                              {/* Assign Crew */}
                             {(comp.status === "Submitted" || comp.status === "SUBMITTED") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                   setAssignTargetId(comp.complaint_id);
                                    setSelectedTeamId(teams[0]?.id || '');
                                  }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer flex items-center gap-1"
                                >
                                  <UserPlus className="w-3 h-3" />
                                 Assign Worker
                                </button>
                              )}

                              {/* Verify Clean */}
                              {isAwaitingVerify && (
                                <button
                                  type="button"
                                  onClick={() => setInspectTargetId(comp.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer flex items-center gap-1"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  Verify Clean
                                </button>
                              )}

                       
                              {/* Resolved Status */}
                              {isResolved && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md uppercase tracking-wider block">
                                  Clean Closed
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-3">
              {sortedAndFiltered.map((comp) => {
                const { daysPending, isOverdue } = getSlaInfo(comp.submitTime, comp.priority);
                const isAwaitingVerify = comp.status !== 'RESOLVED' && comp.afterImage;
                const isResolved = comp.status === 'RESOLVED' || comp.status === 'VERIFIED';
                const isAssigned = comp.status === 'ASSIGNED' || comp.status === 'IN_PROGRESS';

                return (
                  <div 
                    key={comp.id}
                    className={`p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3 ${
                      isOverdue && !isResolved ? 'border-rose-100 bg-rose-50/10' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                              src={
                                    comp.image_before
                                      ? `http://127.0.0.1:5000/${comp.image_before.replace(/\\/g, "/")}`
                                      : ""
                                  }
                               alt="Before" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 font-mono block">{comp.id}</span>
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase">{comp.category}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">
                        <TranslatedText text={comp.title} />
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <TranslatedText text={comp.address} />
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span>Filed: {comp.submitTime}</span>
                      {isOverdue && !isResolved ? (
                        <span className="text-[9px] text-rose-600 font-black">OVERDUE SLA</span>
                      ) : (
                        <span className="text-[9px] text-emerald-600 font-black">SLA Stable</span>
                      )}
                    </div>

         {/* Integrated Assigned Vehicle block for Mobile Card */}
<div className="flex items-center justify-between text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
  <span className="flex items-center gap-1">
    <Truck className="w-3.5 h-3.5 text-slate-400" />
    Vehicle:
  </span>

  <strong className="text-slate-700 font-extrabold">
    {comp.assignedVehicle
      ? `${comp.assignedVehicle.number} (${comp.assignedVehicle.type})`
      : "Not Assigned"}
  </strong>
</div>

<div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-3">

  {/* Assignment */}
  {comp.status === "Resolved" ? (
    <span className="text-[10px] font-bold text-slate-400">-</span>
  ) : comp.supervisor_name ? (
    <span className="text-[10px] font-bold text-slate-500">
      Assigned
    </span>
  ) : (
    <span className="text-[10px] font-extrabold text-slate-400">
      Unassigned
    </span>
  )}

  <div className="flex gap-1.5">

    <button
      type="button"
      onClick={() => setViewTargetId(comp.id)}
      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
    >
      <Eye className="w-3.5 h-3.5" />
      Details
    </button>

   {!comp.supervisor_name &&
  !["resolved", "verified"].includes(
    String(comp.status || "").toLowerCase()
  ) && (
      <button
        type="button"
        onClick={async () => {
          console.log("Assign clicked");

          setAssignTargetId(comp.complaint_id);

          const data = await getWorkers();

          if (data.workers) {
            setWorkers(data.workers);
          }
        }}
        className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Assign
      </button>
    )}

    {isAwaitingVerify && (
      <button
        type="button"
        onClick={() => setInspectTargetId(comp.id)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        Verify
      </button>
    )}

  </div>
</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. ASSIGN WORKER MODAL */}
        {assignTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleAssignDispatch} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">Assign Worker</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Work Order {assignTarget.id}</p>
                </div>
                <button type="button" onClick={() => setAssignTargetId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <h4 className="font-extrabold text-slate-800 text-xs">{assignTarget.title}</h4>
                  <p className="text-[10px] text-slate-500 truncate mt-1">"{assignTarget.description}"</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block ml-1">Available Workers</label>
                  <select
                    required
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                  >
                    <option value="">--Select Worker--</option>
                    {workers.map((worker: any) => (
  <option key={worker.worker_id} value={worker.worker_id}>
    {worker.full_name} - {worker.status}
  </option>
))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignTargetId(null)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold py-3 text-xs rounded-xl border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-bold py-3 text-xs rounded-xl transition-all shadow-md active:scale-95"
                >
                  Dispatch Crew
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. INSPECTION & VERIFICATION AUDIT MODAL */}
        {inspectTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">Inspection Audit Panel</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Grievance {inspectTarget.id}</p>
                </div>
                <button onClick={() => setInspectTargetId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Before Clean</span>
                    <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img src={inspectTarget.beforeImage} alt="Before" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider block">After Clean (Proof)</span>
                    <div className="aspect-square rounded-xl overflow-hidden border border-emerald-200 bg-slate-100 relative">
                      <img src={inspectTarget.afterImage || inspectTarget.beforeImage} alt="After" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                        FIELD UPLOADED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                  <h4 className="text-xs font-black text-slate-800">Field Activity Details</h4>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Assigned Unit: <strong>{inspectTarget.assignedTeamName || 'Unknown'}</strong> • Completed at: {inspectTarget.resolveTime || 'Just now'}
                  </p>
                  <p className="text-[11px] text-slate-600 italic font-medium mt-1">"{inspectTarget.description}"</p>
                </div>

                {/* Audit remarks */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block ml-1">Supervisor Audit Remarks</label>
                  <textarea
                    value={inspectionRemarks}
                    onChange={(e) => setInspectionRemarks(e.target.value)}
                    placeholder="Provide evaluation details... e.g., 'Tiles washed and area disinfected. Approved.'"
                    className="w-full h-20 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 resize-none font-semibold placeholder-slate-400 bg-white"
                  />
                </div>
              </div>

              {/* Approval Buttons */}
              <div className="flex gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => handleVerifyClosure(false)}
                  className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-3 text-xs rounded-xl border border-rose-100 transition-colors"
                >
                  Reject & Redo Clean
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyClosure(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 text-xs rounded-xl transition-all shadow-md active:scale-95"
                >
                  Verify & Approve Clean
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. VIEW COMPLAINT DETAILS MODAL */}
        {viewTarget && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800">Grievance Case File</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Case Record {viewTarget.id}</p>
                </div>
                <button onClick={() => setViewTargetId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                {/* Images */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">REPORTED BEFORE PHOTO</span>
                    <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
{viewTarget.image_before ? (
  <img
    src={`http://127.0.0.1:5000/${viewTarget.image_before.replace(/\\/g, "/")}`}
    alt="Before"
    className="w-full h-full object-cover"
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
    No Image
  </div>
)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">RESOLVED AFTER PHOTO</span>
                    {viewTarget.afterImage ? (
                      <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img src={viewTarget.afterImage} alt="After" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-3 text-slate-400">
                        <span className="text-[10px] font-bold">No After Photo</span>
                        <span className="text-[8px] text-slate-300 mt-0.5">Crew has not uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info block */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800">{viewTarget.title}</span>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                      viewTarget.priority === 'HIGH' || viewTarget.priority === 'URGENT'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {viewTarget.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    <strong>Reported Category:</strong> {viewTarget.category} <br />
                    <strong>Location Address:</strong> {viewTarget.address} <br />
                    <strong>Reporting Citizen:</strong> {viewTarget.citizenName} (ID: {viewTarget.citizenId}) <br />
                    <strong>Date Filed:</strong> {viewTarget.submitTime}
                  </p>
                  <div className="border-t border-slate-200/50 pt-2 text-[11px] text-slate-600 leading-relaxed italic font-medium">
                    "{viewTarget.description}"
                  </div>
                </div>

                {/* Comment Section */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Internal Thread & Timeline Logs
                  </h4>
                  <div className="max-h-[140px] overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100 custom-scrollbar">
                   {(!viewTarget.comments || viewTarget.comments.length === 0) ? (
                      <p className="text-slate-400 italic text-center text-[10px]">No logs or remarks recorded on this file yet.</p>
                    ) : (
                    (viewTarget.comments || []).map((c: any) => (
                        <div key={c.id} className="text-[11px] leading-relaxed pb-2 border-b border-slate-200/40 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center font-bold text-[10px]">
                            <span className={c.isAdmin ? "text-emerald-700" : "text-slate-600"}>
                              {c.authorName} {c.isAdmin && '(Authority)'}
                            </span>
                            <span className="text-[8px] text-slate-400 font-normal">{c.time}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5 font-medium">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add an internal log comment..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl p-2 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewTargetId(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all cursor-pointer"
                >
                  Close Case File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT ADMIN PORTAL VIEW (City-wide Controls Console)
  const adminStats = React.useMemo(() => {
    const total = dbComplaints.length;
 const assigned = dbComplaints.filter((c: any) => {
  const status = (c.status || "").toLowerCase();

  return (
    !!c.supervisor_name &&
    status !== "resolved" &&
    status !== "verified"
  );
}).length;

const unassigned = dbComplaints.filter((c: any) => {
  const status = (c.status || "").toLowerCase();

  return (
    !c.supervisor_name &&
    status === "submitted"
  );
}).length;
    
    // In Progress means assigned but no afterImage uploaded yet
   const inProgress = dbComplaints.filter((c: any) => {
  const status = (c.status || "").toLowerCase();

  return status === "in progress";
}).length;
    
    // Awaiting Verification means status is not resolved/verified but afterImage is uploaded
  const awaitingVerification = dbComplaints.filter((c: any) => {
  const status = (c.status || "").toLowerCase();

  return status === "verification";
}).length;
    
    // Resolved means RESOLVED or VERIFIED status
    const resolved = dbComplaints.filter((c: any) => {
  const status = (c.status || "").toLowerCase();

  return status === "resolved" || status === "verified";
}).length;

    return {
      total,
      assigned,
      unassigned,
      inProgress,
      awaitingVerification,
      resolved
    };
  }, [dbComplaints]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('ALL');
    setPriority('ALL');
    setStatus('ALL');
    setDateFilter('ALL');
    setAssignmentFilter('ALL');
    setZoneFilter('ALL');
    setWorkerFilter('ALL');
    setSupervisorFilter('ALL');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Dynamic Success Alert / Toast */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-xs font-bold py-3.5 px-6 rounded-2xl shadow-2xl border border-emerald-500/20 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            City-Wide Complaint Assignment Center
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Monitor, assign, and audit civic grievances across all municipal sectors. 
          </p>
        </div>
      </div>

      {/* Dynamic Dashboard KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
       

        {/* Assigned */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Assigned</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-800">{adminStats.assigned}</h3>
            <span className="text-[9px] font-bold text-emerald-500">Active dispatches</span>
          </div>
        </div>

        {/* Unassigned */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Unassigned</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <span className="w-2 h-2 bg-rose-500 rounded-full inline-block animate-pulse" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-slate-800">{adminStats.unassigned}</h3>
            <span className="text-[9px] font-bold text-rose-500">Needs crew routing</span>
          </div>
        </div>
      </div>
      {/* Redesigned City-Wide Multi-Criteria Filters Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 border-b border-slate-50 pb-3">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            City-Wide Multi-Criteria Filters
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
          
          </span>
        </div>

        {/* Primary Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Waste Category Dropdown */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 appearance-none bg-white cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Household">Household Waste</option>
              <option value="Plastic">Plastic Debris</option>
              <option value="Construction">Construction Debris</option>
              <option value="Hazardous">Hazardous Waste</option>
              <option value="Other">Other Waste</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <Filter className="w-3 h-3" />
            </div>
          </div>

          {/* Case Status Dropdown */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 appearance-none bg-white cursor-pointer"
            >
              <option value="ALL">All Case Statuses</option>
              <option value="SUBMITTED">Submitted / Unassigned</option>
              <option value="ASSIGNED">Assigned / In Progress</option>
              <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
              <option value="RESOLVED">Resolved / Verified</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <Filter className="w-3 h-3" />
            </div>
          </div>

        {/* Municipal Zone Dropdown */}
<div className="relative">
  <select
    value={zoneFilter}
    onChange={(e) => setZoneFilter(e.target.value)}
    className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 appearance-none bg-white cursor-pointer"
  >
    <option value="ALL">All Municipal Zones</option>
    <option value="Shivajinagar Zone">Shivajinagar Zone</option>
    <option value="Kothrud Zone">Kothrud Zone</option>
  </select>

  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
    <Filter className="w-3 h-3" />
  </div>
</div>

          {/* Toggle Advanced Filters Button & Clear Button */}
          <div className="flex gap-2">
            <button
              id="btn-toggle-advanced-filters"
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black tracking-wide border cursor-pointer transition-all ${
                showAdvanced 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>Advanced Filters ⚙️</span>
            </button>
            <button
              id="btn-clear-filters-main"
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-2.5 rounded-xl text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent transition-all cursor-pointer whitespace-nowrap"
              title="Clear All Active Filters"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    ⚙️ Advanced Filtration Panel
                  </span>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-850 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Priority Filter */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase ml-1 block">Priority</label>
                    <div className="relative">
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 appearance-none bg-white cursor-pointer"
                      >
                        <option value="ALL">All Priorities</option>
                        <option value="LOW">Low Priority</option>
                        <option value="MEDIUM">Medium Priority</option>
                        <option value="HIGH">High Priority</option>
                        <option value="URGENT">Urgent Priority</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <Filter className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

               </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    

      {/* Search Input Box Directly Above the Cases Count */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-complaint-id-list"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Complaint ID / Address..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
          />
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5 self-stretch sm:self-auto justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        
        </div>
      </div>

      {/* Complaints List Table / Grid */}
      {sortedAndFiltered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-black text-slate-500">No matching complaints found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto font-medium">
            There are no municipal complaints matching your search parameters. Try expanding your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop HTML Table View (Responsive hidden on mobile) */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Showing {filtered.length} Complaints
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                
              </span>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Complaint ID & Photo</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Category & Zone</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Priority</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Case Status</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Assignment</th>
                  <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAndFiltered.map((comp) => {
                 const isAssigned =
  comp.status === "Assigned" ||
  comp.status === "ASSIGNED" ||
  comp.supervisor_name;
                  const zone = getZoneOfComplaint(comp);
                  const workerName = getAssignedWorker(comp);
                  const supervisorName = getAssignedBy(comp);
                  const assignedDateTime = getAssignedTime(comp);
                  const { daysPending, slaLimitText, isOverdue } = getSlaInfo(comp.submitTime, comp.priority);

                  return (
                    <tr 
                      key={comp.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isOverdue && comp.status !== 'RESOLVED' && comp.status !== 'VERIFIED'
                          ? 'bg-rose-50/20'
                          : ''
                      }`}
                    >
                      {/* ID & Photo */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                            <img
                            src={
                              comp.image_before
                                ? `http://127.0.0.1:5000/${comp.image_before.replace(/\\/g, "/")}`
                                : ""
                            } alt={comp.id} className="w-full h-full object-cover" />
                                                      </div>
                          <div>
                            <span className="text-xs font-black text-slate-800 tracking-tight block">{comp.complaint_code}</span>
                            <span className="text-[9px] text-slate-400 font-bold block">{comp.submitTime}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Zone */}
                      <td className="p-4">
                        <span className="text-xs font-extrabold text-slate-700 block">{comp.category}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">{zone}</span>
                      </td>

                      {/* Priority Badge */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                          comp.priority === 'HIGH' || comp.priority === 'URGENT'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : comp.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {comp.priority}
                        </span>
                      </td>

                      {/* Case Status Badge */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                         comp.status === "Resolved"
  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
  : comp.status === "Verification"
  ? "bg-purple-50 text-purple-700 border border-purple-100"
  : comp.status === "In Progress"
  ? "bg-blue-50 text-blue-700 border border-blue-100"
  : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                       {comp.status === "Submitted"
  ? "SUBMITTED"
  : comp.status === "Assigned"
  ? "AWAITING DISPATCH"
  : comp.status === "In Progress"
  ? "IN PROGRESS"
  : comp.status === "Verification"
  ? "AWAITING VERIFICATION"
  : comp.status === "Resolved"
  ? "RESOLVED"
  : comp.status}
                        </span>
                      </td>

                      {/* Compact Assignment Column */}
                      <td className="p-4 whitespace-nowrap">
                       {comp.status === "Resolved" ? (
  <span className="text-slate-400 font-bold">-</span>
) : isAssigned ? (
  <span className="font-extrabold text-emerald-600 flex items-center gap-1.5 text-xs">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
    🟢 Assigned
  </span>
) : (
  <span className="font-extrabold text-rose-600 flex items-center gap-1.5 text-xs">
    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
    🔴 Unassigned
  </span>
)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                          onClick={() => setViewTargetId(comp.complaint_id)}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
                          
                      {!isAssigned &&
  !["resolved", "verified"].includes(
    String(comp.status || "").toLowerCase()
  ) && (
    <button
      onClick={async () => {
        console.log("Assign clicked");

        setAssignTargetId(comp.complaint_id);
        setSelectedTeamId("");

        try {
          const data = await getSupervisors();

          console.log("Supervisor API:", data);
          setSupervisors(data.supervisors || []);
        } catch (err) {
          console.error(err);
        }
      }}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
    >
      <UserPlus className="w-3.5 h-3.5" />
      Assign
    </button>
)}
                   
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid View representation */}
          <div className="lg:hidden space-y-4">
            {sortedAndFiltered.map((comp) => {
          const isAssigned =
  !!comp.supervisor_name &&
  comp.status !== "Submitted";
              const zone = getZoneOfComplaint(comp);
              const workerName = getAssignedWorker(comp);
              const supervisorName = getAssignedBy(comp);
              const assignedDateTime = getAssignedTime(comp);
              const { isOverdue } = getSlaInfo(comp.submitTime, comp.priority);

              return (
                <div
                  key={comp.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverdue && comp.status !== 'RESOLVED' && comp.status !== 'VERIFIED'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-slate-100 shadow-xs'
                  }`}
                >
                  <div className="flex gap-3 items-center pb-3 border-b border-slate-50">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                     <img
                       src={
                            comp.image_before
                              ? `http://127.0.0.1:5000/${comp.image_before.replace(/\\/g, "/")}`
                              : ""
                          } alt={comp.id} className="w-full h-full object-cover" />
                                              </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800">{comp.id}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase border ${
                          comp.priority === 'HIGH' || comp.priority === 'URGENT'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : comp.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {comp.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{comp.submitTime}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                       comp.status === "Resolved"
  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
  : comp.status === "Verification"
  ? "bg-purple-50 text-purple-700 border border-purple-100"
  : comp.status === "In Progress"
  ? "bg-blue-50 text-blue-700 border border-blue-100"
  : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                       {comp.status === "Resolved"
  ? "RESOLVED"
  : comp.status === "Verification"
  ? "AWAITING VERIFICATION"
  : comp.status === "In Progress"
  ? "IN PROGRESS"
  : "AWAITING DISPATCH"}
                      </span>
                    </div>
                  </div>

                  <div className="py-3 space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">Category & Zone</span>
                        <span className="font-extrabold text-slate-700 block">{comp.category}</span>
                        <span className="text-[10px] font-semibold text-slate-500 block">{zone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">Assignment</span>
                       {comp.status === "Resolved" ? (
  <span className="text-slate-400 font-bold">-</span>
) : isAssigned ? (
  <span className="font-extrabold text-emerald-600 flex items-center gap-1.5 text-xs">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
    🟢 Assigned
  </span>
) : (
  <span className="font-extrabold text-rose-600 flex items-center gap-1.5 text-xs">
    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
    🔴 Unassigned
  </span>
)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex gap-2">
                    <button
                      onClick={() => setViewTargetId(comp.id)}
                      className="flex-grow bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Details
                    </button>
                  {comp.status === "Submitted" && (
                      <button
                        onClick={() => {
                          setAssignTargetId(comp.id);
                          setSelectedTeamId(teams[0]?.id || '');
                        }}
                        className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Case File Details Modal (viewTarget) */}
      {viewTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 border border-slate-100 shadow-2xl relative scrollbar-none">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-50 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    CASE DOSSIER: {viewTarget.id}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    viewTarget.status === 'RESOLVED' || viewTarget.status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : viewTarget.status === 'ASSIGNED' || viewTarget.status === 'IN_PROGRESS'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}>
                    {viewTarget.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-800">
                  <TranslatedText text={viewTarget.title} />
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  <TranslatedText text={viewTarget.address} />
                </p>
              </div>
              <button
                onClick={() => setViewTargetId(null)}
                className="p-1.5 hover:bg-slate-50 rounded-full border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Layout Split: Left column comparison / details, Right column dispatch / history */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column */}
              <div className="space-y-6">
                
                {/* Before / After comparison */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Before & After Photo Verification</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden relative">
                      <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                        BEFORE
                      </div>
                      <div className="aspect-video">
                        <img src={viewTarget.beforeImage} alt="Before" className="w-full h-full object-cover" />
                      </div>
                    </div>

                    {viewTarget.afterImage ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                          AFTER
                        </div>
                        <div className="aspect-video">
                          <img src={viewTarget.afterImage} alt="After" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-3">
                        <Truck className="w-6 h-6 text-slate-300 mb-1" />
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase">After Proof Pending</span>
                        <span className="text-[8px] text-slate-400 mt-0.5 leading-normal max-w-[120px]">Field crew dispatch in progress</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Complaint details */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grievance Metadata</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold block">Waste Category</span>
                      <span className="font-extrabold text-slate-700">{viewTarget.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Override Priority</span>
                      <span className="font-extrabold text-slate-700">{viewTarget.priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Municipal Sector</span>
                      <span className="font-extrabold text-slate-700">{getZoneOfComplaint(viewTarget)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Submitted Date</span>
                      <span className="font-extrabold text-slate-700">{viewTarget.submitTime}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-400 font-bold block">Location Coordinates</span>
                    <span className="font-mono text-[11px] text-slate-600 block">
                      Latitude: {viewTarget.latitude || '28.6139'} • Longitude: {viewTarget.longitude || '77.2090'}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-400 font-bold block">Reporter Contact Card</span>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                        {viewTarget.citizenName ? viewTarget.citizenName.charAt(0) : 'C'}
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 block">{viewTarget.citizenName || 'Citizen Reporter'}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">ID: {viewTarget.citizenId || 'CIT-10928'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Citizen Feedback */}
                {(viewTarget.status === 'RESOLVED' || viewTarget.status === 'VERIFIED' || viewTarget.rating) && (
                  <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-3">
                    <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-wider flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-teal-500 text-teal-500" />
                      Citizen Satisfaction Audit Feedback
                    </h4>

                    {feedbacks.find(f => f.complaintId === viewTarget.id) ? (() => {
                      const f = feedbacks.find(fb => fb.complaintId === viewTarget.id)!;
                      return (
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-500 font-bold">Resolution Quality:</span>
                              <div className="flex gap-0.5 text-teal-600 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < f.resolutionQuality ? 'fill-teal-500 text-teal-500' : 'text-slate-200'}`} />
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold">Crew Behaviour:</span>
                              <div className="flex gap-0.5 text-teal-600 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < f.staffBehaviour ? 'fill-teal-500 text-teal-500' : 'text-slate-200'}`} />
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold">Response Speed:</span>
                              <div className="flex gap-0.5 text-teal-600 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < f.responseTime ? 'fill-teal-500 text-teal-500' : 'text-slate-200'}`} />
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500 font-bold">Overall Rating:</span>
                              <div className="flex gap-0.5 text-teal-600 mt-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < f.overallExperience ? 'fill-teal-500 text-teal-500' : 'text-slate-200'}`} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-teal-100/50 pt-2 text-[11px] text-teal-900 bg-white/60 p-2.5 rounded-xl">
                            <strong className="block mb-0.5">Citizen Remarks:</strong>
                            "<TranslatedText text={f.citizenComment || 'Cleared very clean.'} />"
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="text-xs space-y-1">
                        <div className="flex gap-0.5 text-teal-600">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < (viewTarget.rating || 5) ? 'fill-teal-500 text-teal-500' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        <p className="text-teal-900 italic font-semibold">
                          "<TranslatedText text={viewTarget.feedback || 'Debris cleared quickly and area washed down. Satisfactory action!'} />"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                
                {/* Dispatch Details */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sanitation Dispatch Status</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Assigned Worker</span>
                      <span className="font-extrabold text-slate-700">{getAssignedWorker(viewTarget)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Sanitation Crew</span>
                      <span className="font-extrabold text-slate-700">{viewTarget.assignedTeamName || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Dispatched By</span>
                      <span className="font-extrabold text-slate-700">{getAssignedBy(viewTarget)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Dispatch Timestamp</span>
                      <span className="font-extrabold text-slate-700">{getAssignedTime(viewTarget)}</span>
                    </div>
                  </div>

                  {!viewTarget.assignedTeamName && (
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                      >
                        {workers.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.name} (Lead: {t.leader})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          assignWorkforce(viewTarget.id, selectedTeamId || teams[0]?.id || '');
                          setSuccessToast(`Dispatched crew to ${viewTarget.id}!`);
                          setTimeout(() => setSuccessToast(''), 3000);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl transition-colors cursor-pointer"
                      >
                        Dispatch Crew
                      </button>
                    </div>
                  )}
                </div>

                {/* Assignment History logs */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Historical Dispatch & Routing Logs</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                    {viewTarget.assignedTeamName ? (
                      <div className="space-y-2.5">
                        <div className="flex gap-2 items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                          <div>
                            <strong className="block text-slate-700 font-extrabold">Crew Allocation Registered</strong>
                            <span className="text-[10px] text-slate-400">{getAssignedTime(viewTarget)}</span>
                            <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                              Supervisor {getAssignedBy(viewTarget)} approved route dispatch to grievance spot. Crew leads was notified automatically via cellular MDT.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-start border-t border-slate-200/55 pt-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 flex-shrink-0" />
                          <div>
                            <strong className="block text-slate-700 font-extrabold">Initial Routing Complete</strong>
                            <span className="text-[10px] text-slate-400">{viewTarget.submitTime}</span>
                            <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                              Incident classified under {viewTarget.category} waste catalog. Assigned to municipal zone {getZoneOfComplaint(viewTarget)}.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400">
                        <Users className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                        <span className="text-[11px] font-bold block">No allocation record on this case file.</span>
                        <span className="text-[9px] block text-slate-400">Route crew using dispatch selectors above.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical Timeline of status changes */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status & Verification Timeline</h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 max-h-[160px] overflow-y-auto scrollbar-none text-xs">
                    {viewTarget.liveUpdates && viewTarget.liveUpdates.length > 0 ? (
                      <div className="relative border-l border-slate-200 pl-3.5 space-y-4">
                      {viewTarget.liveUpdates.map((up: any, i: number) => (
                          <div key={i} className="relative">
                            {/* Bullet marker */}
                            <div className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-500" />
                            <div>
                              <span className="text-[9px] font-mono font-bold text-slate-400 block">{up.time}</span>
                              <span className="font-extrabold text-slate-700 block text-[11px]">
                                <TranslatedText text={up.text} />
                              </span>
                              {up.author && <span className="text-[9px] text-slate-400 italic">By: {up.author}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative border-l border-slate-200 pl-3.5 space-y-3">
                        <div className="relative">
                          <div className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-500 animate-ping" />
                          <div>
                            <span className="text-[9px] font-mono font-bold text-slate-400 block">{viewTarget.submitTime}</span>
                            <span className="font-extrabold text-slate-700 block">Citizen filed grievance on mobile portal. Awaiting administrative clearance.</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Internal logs comments thread */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Internal Audit Discussions & Notes</h4>
              <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {viewTarget.comments && viewTarget.comments.map((c: any) => (
                  <div key={c.id} className="flex gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold font-mono text-[10px]">
                      {c.authorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-700 font-extrabold">{c.authorName}</strong>
                        <span className="text-[9px] text-slate-400">{c.time}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        <TranslatedText text={c.text} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type administrative update log, override reason..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  Post Log
                </button>
              </form>
            </div>

            {/* Action panel footer */}
            <div className="border-t border-slate-50 pt-4 flex flex-wrap justify-between items-center gap-3">
              <button
                onClick={() => navigate(`/admin/complaint/${viewTarget.id}`)}
                className="text-xs font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Page Case File
              </button>
              <button
                onClick={() => setViewTargetId(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Close Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Crew Modal (assignTarget) */}
      {assignTarget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAssignDispatch}
            className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 border border-slate-100 shadow-2xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                 ASSIGN SUPERVISOR
                </span>
                <h3 className="font-extrabold text-sm text-slate-800 mt-1">Assign Supervisor: {assignTarget.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignTargetId(null)}
                className="p-1 hover:bg-slate-50 rounded-full border border-slate-200 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
               Assign a supervisor to review and manage this complaint.
               The supervisor will receive this complaint in their dashboard.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-400 block mb-1">Select Supervisor</span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- -- Choose Supervisor -- --</option>
                 {supervisors.map((s: any) => (
                    <option key={s.supervisor_id} value={s.supervisor_id}>
                      {s.full_name} ({s.zone_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignTargetId(null)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-2.5 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTeamId}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 text-xs rounded-xl shadow active:scale-95 transition-all"
              >
                Assign Supervisor
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Supervisor Details Modal */}
{supervisorDetailsTarget && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 w-[450px] shadow-xl">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          Assigned Supervisor
        </h2>

        <button
          onClick={() => setSupervisorDetailsTarget(null)}
          className="text-slate-500 hover:text-black"
        >
          <X className="w-5 h-5"/>
        </button>
      </div>

      <div className="space-y-3 text-sm">

        <p><strong>Name:</strong> {supervisorDetailsTarget.supervisor_name}</p>

        <p><strong>Zone:</strong> {supervisorDetailsTarget.zone_name}</p>

        <p><strong>Status:</strong> {supervisorDetailsTarget.status}</p>

      </div>

      <div className="mt-6 flex justify-end gap-3">

        <button
          onClick={() => setSupervisorDetailsTarget(null)}
          className="px-4 py-2 rounded-lg bg-slate-200"
        >
          Close
        </button>

        <button
          className="px-4 py-2 rounded-lg bg-amber-600 text-white"
        >
          Reassign Supervisor
        </button>

      </div>

    </div>
  </div>
)}

{/* Complaint Details Modal */}
{viewTargetId && (() => {
  console.log("Modal ID:", viewTargetId);
 console.log("viewTargetId:", viewTargetId);
console.log("dbComplaints:", dbComplaints);

const complaint =
  dbComplaints.find((c: any) => {
    console.log("Checking:", c);
    return (
      c.complaint_id == viewTargetId ||
      c.id == viewTargetId
    );
  });

console.log("FOUND:", complaint);
console.log("DETAIL MODAL STATUS:", complaint?.status);
  if (!complaint) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">
              Complaint Details
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {complaint.complaint_code}
            </p>
          </div>

          <button
            onClick={() => setViewTargetId(null)}
            className="p-2 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-2 gap-6 p-6">

          {/* Image */}
          <div>

            {complaint.image_before ? (
              <img
                src={`http://127.0.0.1:5000/${complaint.image_before.replace(/\\/g, "/")}`}
                className="w-full h-80 rounded-2xl object-cover border"
                alt=""
              />
            ) : (
              <div className="h-80 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                No Image
              </div>
            )}

          </div>

          {/* Details */}
          <div className="space-y-4 text-left">

            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Description
              </p>

              <p className="font-bold text-slate-800">
                {complaint.description}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Category
              </p>

              <p>{complaint.category_name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Priority
              </p>

              <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                {complaint.priority}
              </span>
            </div>

           <div>
  <p className="text-xs text-slate-500 font-semibold">
    Status
  </p>

  <p>
    {complaint.status === "Assigned"
      ? "Awaiting Dispatch"
      : complaint.status === "Resolved"
        ? "Resolved"
        : complaint.status === "Verification"
          ? "Awaiting Verification"
          : complaint.status}
  </p>
</div>

            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Address
              </p>

              <p>{complaint.address}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Zone
              </p>

              <p>{complaint.zone_name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Submitted
              </p>

              <p>{complaint.submitted_at}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Citizen
              </p>

              <p>{complaint.citizen_name}</p>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end">

          <button
            onClick={() => setViewTargetId(null)}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
})()}

    </div>
  );
};

