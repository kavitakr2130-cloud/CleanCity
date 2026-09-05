import { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Clock, Truck, ShieldAlert, Share2, Phone, Send, Info, Star, ChevronLeft, MapPin, CheckCircle, Camera, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TranslatedText } from '../components/TranslatedText';
import { getComplaintById } from "../services/api";

export const TrackComplaint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const navigate = useNavigate();
  const { addComplaintComment, rateComplaint, reopenComplaint, t, currentLanguage } = useApp();
 
  const [complaints, setComplaints] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showToast, setShowToast] = useState(true);

  // Rating interface local state
  const [selectedStars, setSelectedStars] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

 useEffect(() => {
  const loadComplaint = async () => {
    try {
      const data = await getComplaintById(id!);

      const c = data.complaint;
      console.log("Priority from backend:", c.priority);
      console.log("Submitted at:", c.submitted_at);

      setComplaints([
        {
          ...c,
          assignedSupervisorName: c.supervisor_name,
          id: c.complaint_id,
          complaint_code: c.complaint_code,

          submitTime: new Date(c.submitted_at).toLocaleString(),
          submitTimestamp: c.submitted_at,

         beforeImage: `http://127.0.0.1:5000/${c.image_before.replace(/\\/g, "/")}`,
          afterImage: c.image_after
          ? `http://127.0.0.1:5000/${c.image_after.replace(/\\/g, "/")}`
          : null,
          liveUpdates: [],
          comments: [],
          assignedVehicle: null,
          assignedTeamName: null,
          estimatedCompletionTime: "",
          remainingSlaTime: "",
          resolveTime: "",
          isDirectSubmit: false,
        },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  loadComplaint();
}, [id]);
  // Retrieve the selected complaint details
  const comp = complaints.find(
  c => String(c.complaint_id) === id
   );
   console.log("Current Status:", comp?.status);
   const priority = (comp?.priority || "").toUpperCase();

  // Dynamic SLA calculations
  const getSlaInfo = () => {
    if (!comp) return { remainingStr: "24 hours", estimatedStr: "Within 24h", isOverdue: false };
    
    let isOverdue = false;
    let remainingStr = "";
    let estimatedStr = "";
    const priority = (comp.priority || "").toUpperCase();

    try {
      let submitDate = new Date();
      if (comp.submitTimestamp) {
        submitDate = new Date(comp.submitTimestamp);
      } else {
        const parsed = Date.parse(comp.submitTime);
        if (!isNaN(parsed)) {
          submitDate = new Date(parsed);
        } else {
          submitDate = new Date();
        }
      }

      // SLA Duration based on Priority: High – 24 hours, Medium – 3 days, Low – 7 days
      let durationMs = 24 * 60 * 60 * 1000; // default for HIGH or URGENT (24 hours)
      if (priority === 'MEDIUM') {
        durationMs = 3 * 24 * 60 * 60 * 1000; // 3 days
      } else if (priority === 'LOW') {
        durationMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      }

      const slaTargetDate = new Date(submitDate.getTime() + durationMs);
      const diffMs = slaTargetDate.getTime() - Date.now();

      estimatedStr = slaTargetDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      if (diffMs <= 0) {
        isOverdue = true;
        const overdueMs = Math.abs(diffMs);
        const overdueHrs = Math.floor(overdueMs / (1000 * 60 * 60));
        
        if (priority === 'HIGH') { 
          // Express in hours (e.g. ⚠ Overdue by XX hours)
          remainingStr = currentLanguage === 'hindi' 
            ? `⚠ ${overdueHrs} घंटे विलंबित`
            : `⚠ Overdue by ${overdueHrs} hours`;
        } else {
          // Express in days and hours (e.g. ⚠ Overdue by X days Y hours)
          const overdueDays = Math.floor(overdueHrs / 24);
          const remainingHrs = overdueHrs % 24;
          if (overdueDays > 0) {
            remainingStr = currentLanguage === 'hindi'
              ? `⚠ ${overdueDays} दिन ${remainingHrs} घंटे विलंबित`
              : `⚠ Overdue by ${overdueDays} days ${remainingHrs} hours`;
          } else {
            remainingStr = currentLanguage === 'hindi'
              ? `⚠ ${overdueHrs} घंटे विलंबित`
              : `⚠ Overdue by ${overdueHrs} hours`;
          }
        }
      } else {
        isOverdue = false;
        const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60));
        
        if (priority === 'HIGH') { 
          // Express in hours
          remainingStr = currentLanguage === 'hindi'
            ? `${diffHrs} घंटे`
            : `${diffHrs} hours`;
        } else {
          // Express in days and hours
          const diffDays = Math.floor(diffHrs / 24);
          const remainingHrs = diffHrs % 24;
          if (diffDays > 0) {
            remainingStr = currentLanguage === 'hindi'
              ? `${diffDays} दिन ${remainingHrs} घंटे`
              : `${diffDays} days ${remainingHrs} hours`;
          } else {
            remainingStr = currentLanguage === 'hindi'
              ? `${diffHrs} घंटे`
              : `${diffHrs} hours`;
          }
        }
      }
    } catch (e) {
      console.error("Error calculating SLA times", e);
      remainingStr = "24 hours";
      estimatedStr = "Within 24h";
    }

    return { remainingStr, estimatedStr, isOverdue };
  };

  const slaInfo = getSlaInfo();

  if (!comp) {
    return (
      <div className="text-center py-12 space-y-4 font-sans">
        <p className="text-sm text-slate-500 font-medium">Grievance report not found.</p>
        <button
          onClick={() => navigate('/home')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComplaintComment(comp.id, commentText, false);
    setCommentText('');
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rateComplaint(comp.id, selectedStars, feedbackText.trim() || 'Good cleanup!');
    setRatingSubmitted(true);
  };

  const handleReopenSubmit = () => {
    if (window.confirm(currentLanguage === 'hindi' ? 'क्या आप वाकई इस शिकायत को फिर से खोलना चाहते हैं?' : 'Are you sure you want to reopen this resolved complaint?')) {
      reopenComplaint(comp.id);
      setRatingSubmitted(false);
    }
  };

 const isSubmitted = true;

const isVerified =
  comp.status === "Assigned" ||
  comp.status === "In Progress" ||
  comp.status === "Verification" ||
  comp.status === "Resolved";

const isAssigned =
  comp.status === "Assigned" ||
  comp.status === "In Progress" ||
  comp.status === "Verification" ||
  comp.status === "Resolved";

const isInProgress =
  comp.status === "In Progress" ||
  comp.status === "Verification" ||
  comp.status === "Resolved";

const isResolved =
  comp.status === "Resolved";

const isReopened = false;

const aiCompleted = !!comp.complaint_id;
  return (
    <div className="space-y-6 font-sans">
      {/* Detail Core Card */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                comp.status === 'RESOLVED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : comp.status === 'IN_PROGRESS'
                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : comp.status === 'ASSIGNED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : comp.status === 'VERIFIED'
                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                        : comp.status === 'REOPENED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
              }`}>
                {comp.status === 'RESOLVED' 
                  ? (currentLanguage === 'hindi' ? 'समाधान' : 'RESOLVED') 
                  : comp.status === 'IN_PROGRESS' 
                    ? (currentLanguage === 'hindi' ? 'प्रगति पर' : 'IN PROGRESS') 
                    : comp.status === 'ASSIGNED' 
                      ? (currentLanguage === 'hindi' ? 'आवंटित' : 'ASSIGNED') 
                      : comp.status === 'VERIFIED'
                        ? (currentLanguage === 'hindi' ? 'सत्यापित' : 'VERIFIED')
                        : comp.status === 'REOPENED'
                          ? (currentLanguage === 'hindi' ? 'फिर से खुला' : 'REOPENED')
                          : (currentLanguage === 'hindi' ? 'प्रस्तुत' : 'SUBMITTED')}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Created: {comp.submitted_at ? new Date(comp.submitted_at).toLocaleDateString() : "N/A"}</span>
            </div>
            <h2 className="text-base font-black text-slate-800">Complaint ID: {comp.complaint_code}</h2>
            
            {/* Category and Priority Details near ID */}
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Category: {comp.category}
              </span>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                comp.status === 'RESOLVED'
                  ? 'bg-slate-50 text-slate-400 border-slate-100'
                  : comp.priority === 'HIGH' || comp.priority === 'URGENT'
                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                    : comp.priority === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                Priority: {comp.status === 'RESOLVED' ? '-' : comp.priority}
              </span>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                comp.status === 'RESOLVED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : comp.status === 'IN_PROGRESS'
                    ? 'bg-amber-50 text-amber-700 border border-amber-100'
                    : comp.status === 'ASSIGNED'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : comp.status === 'VERIFIED'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                Status: {comp.status}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-extrabold">
              <TranslatedText text={comp.description} />
            </p>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(`https://cleancity.gov/complaint/${comp.complaint_id}`);
              alert(currentLanguage === 'hindi' ? 'शिकायत लिंक कॉपी किया गया!' : 'Share Link Copied to clipboard!');
            }}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            {currentLanguage === 'hindi' ? 'शेयर करें' : 'Share Report'}
          </button>
        </div>

        {/* Status Vertical Timeline */}
        <div className="relative py-2 pl-4">
          {/* Vertical Connecting Rod */}
          <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-slate-100" />

          <div className="space-y-6 relative animate-fade-in">
           {/* 1. Complaint Submitted */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
                        isSubmitted
                          ? "bg-emerald-600 text-white"
                          : "bg-white border-2 border-slate-200 text-slate-300"
                      }`}
                    >
                      {isSubmitted ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>

                    <div className="pt-1 text-left">
                      <h4 className="text-xs font-black text-slate-800">
                        {currentLanguage === 'hindi' ? 'शिकायत प्रस्तुत की गई' : 'Complaint Submitted'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {comp.submitTime} 
                      </p>
                    </div>
                  </div>

           {/* 2. AI Analysis Completed */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
                        aiCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-white border-2 border-slate-200 text-slate-300"
                      }`}
                    >
                     {aiCompleted ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>

                    <div className="pt-1 text-left">
                     <h4
                      className={`text-xs font-black ${
                        aiCompleted ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                        {currentLanguage === 'hindi' ? 'एआई विश्लेषण पूर्ण' : 'AI Analysis Completed'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {comp.aiAnalysis
                              ? `Classified as ${comp.category}`
                              : 'Completed AI analysis'}
                      </p>
                    </div>
                  </div>

            {/* 3. Supervisor Assigned */}
            {(() => {
            const supervisorAssigned =
    comp.supervisor_name ||
    comp.status === "Assigned" ||
    comp.status === "In Progress" ||
    comp.status === "Verification" ||
    comp.status === "Resolved";
              return (
                <div className="flex items-start gap-4">
                  <div
                     className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
                        supervisorAssigned
                          ? "bg-emerald-600 text-white"
                          : "bg-white border-2 border-slate-200 text-slate-300"
                      }`}
                    >
                    {supervisorAssigned ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="pt-1 text-left">
                    <h4 className={`text-xs font-black ${supervisorAssigned ? 'text-slate-800' : 'text-slate-400'}`}>
                      {currentLanguage === 'hindi' ? 'पर्यवेक्षक नियुक्त' : 'Supervisor Assigned'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
  {comp.supervisor_name
    ? `Supervisor: ${comp.supervisor_name}`
    : "Awaiting Supervisor Assignment"}
</p>
                  </div>
                </div>
              );
            })()}
          
{/* 4. Worker & Vehicle Assigned */}
{(() => {
  const workerVehicleAssigned =
    !!comp.worker_name && !!comp.vehicle_number;

  return (
    <div className="flex items-start gap-4">
      <div
        className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
          workerVehicleAssigned
            ? "bg-emerald-600 text-white"
            : "bg-white border-2 border-slate-200 text-slate-300"
        }`}
      >
        {workerVehicleAssigned ? (
          <Check className="w-5 h-5" />
        ) : (
          <Clock className="w-5 h-5" />
        )}
      </div>

      <div className="pt-1 text-left">
        <h4
          className={`text-xs font-black ${
            workerVehicleAssigned
              ? "text-slate-800"
              : "text-slate-400"
          }`}
        >
          {currentLanguage === "hindi"
            ? "कर्मचारी और वाहन नियुक्त"
            : "Worker & Vehicle Assigned"}
        </h4>

        <p className="text-[10px] text-slate-500 font-medium">
          {workerVehicleAssigned
            ? `Worker: ${comp.worker_name} • Vehicle: ${comp.vehicle_number}`
            : "Awaiting worker and vehicle assignment"}
        </p>
      </div>
    </div>
  );
})()}
            {/* 6. Cleaning Started */}
            {/* {(() => {
             const cleaningStarted = !!comp.started_at;     
                  return (
                <div className="flex items-start gap-4">
                  <div className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
                    cleaningStarted ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'
                  }`}>
                    {cleaningStarted ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="pt-1 text-left">
                    <h4 className={`text-xs font-black ${cleaningStarted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {currentLanguage === 'hindi' ? 'सफाई शुरू हुई' : 'Cleaning Started'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {cleaningStarted ?  'Cleaning work has started' : 'Waiting for cleaning to start'}
                    </p>
                  </div>
                </div>
              );
            })()} */}

            {/* 7. Cleaning Completed */}
            {(() => {
               const cleaningCompleted =
              !!comp.image_after ||
              comp.status === "Verification" ||
              comp.status === "Resolved";
              return (
                <div className="flex items-start gap-4">
                  <div className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
                    cleaningCompleted ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'
                  }`}>
                    {cleaningCompleted ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="pt-1 text-left">
                    <h4 className={`text-xs font-black ${cleaningCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {currentLanguage === 'hindi' ? 'सफाई पूर्ण' : 'Cleaning Completed'}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                     {cleaningCompleted
                        ? "Garbage cleared. After-cleaning proof uploaded."
                        : "Waiting for worker to complete cleaning"}
                    </p>
                  </div>
                </div>
              );
            })()}

         {/* 8. Supervisor Verified */}
{(() => {
  const verified = comp.status === "Resolved";

  return (
    <div className="flex items-start gap-4">
      <div
        className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
          verified
            ? "bg-emerald-600 text-white"
            : "bg-white border-2 border-slate-200 text-slate-300"
        }`}
      >
        {verified ? (
          <Check className="w-5 h-5" />
        ) : (
          <Clock className="w-5 h-5" />
        )}
      </div>

      <div className="pt-1 text-left">
        <h4
          className={`text-xs font-black ${
            verified ? "text-slate-800" : "text-slate-400"
          }`}
        >
          {currentLanguage === "hindi"
            ? "पर्यवेक्षक द्वारा सत्यापित"
            : "Supervisor Verified"}
        </h4>

        <p className="text-[10px] text-slate-500 font-medium">
          {verified
            ? "Complaint verified successfully"
            : "Awaiting supervisor verification"}
        </p>
      </div>
    </div>
  );
})()}

            {/* 9. Complaint Resolved */}
            <div className="flex items-start gap-4">
              <div className={`z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
                isResolved ? 'bg-emerald-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'
              }`}>
                {isResolved ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
              </div>
              <div className="pt-1 text-left">
                <h4 className={`text-xs font-black ${isResolved ? 'text-slate-800' : 'text-slate-400'}`}>
                  {currentLanguage === 'hindi' ? 'निवारण किया गया' : 'Complaint Resolved'}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium">
                  {isResolved 
                    ? `${comp.resolveTime} • Thank you for your support!` 
                    : `${currentLanguage === 'hindi' ? 'अनुमानित:' : 'Estimated limit:'} ${comp.estimatedCompletionTime || slaInfo.estimatedStr}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚛 Assigned Municipal Vehicle Section */}
      {comp.assignedVehicle && (
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 text-left">
            <span className="text-lg">🚛</span>
            {currentLanguage === 'hindi' ? 'आवंटित नगर पालिका वाहन' : 'Assigned Municipal Vehicle'}
          </h3>
          
          {comp.assignedVehicle ? (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded font-mono">
                    {comp.assignedVehicle.number}
                  </span>
                  <span className="text-xs font-black text-slate-700">
                    {comp.assignedVehicle.type}
                  </span>
                </div>
                {comp.assignedVehicle.driverName && (
                  <p className="text-[10px] text-slate-500 font-medium">
                    {currentLanguage === 'hindi' ? `चालक: ${comp.assignedVehicle.driverName}` : `Driver: ${comp.assignedVehicle.driverName}`}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {currentLanguage === 'hindi' ? 'स्थिति' : 'Status'}
                </span>
                <span className={`text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 border uppercase ${
                  comp.assignedVehicle.status === 'Work Completed' || comp.assignedVehicle.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : comp.assignedVehicle.status === 'Cleaning in Progress' || comp.assignedVehicle.status === 'Cleaning'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : comp.assignedVehicle.status === 'On Route'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    comp.assignedVehicle.status === 'Work Completed' || comp.assignedVehicle.status === 'Completed'
                      ? 'bg-emerald-500'
                      : comp.assignedVehicle.status === 'Cleaning in Progress' || comp.assignedVehicle.status === 'Cleaning'
                        ? 'bg-amber-500 animate-pulse'
                        : comp.assignedVehicle.status === 'On Route'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-slate-500'
                  }`} />
                  {comp.assignedVehicle.status === 'Work Completed' || comp.assignedVehicle.status === 'Completed'
                    ? (currentLanguage === 'hindi' ? 'कार्य पूर्ण' : 'Work Completed')
                    : comp.assignedVehicle.status === 'Cleaning in Progress' || comp.assignedVehicle.status === 'Cleaning'
                      ? (currentLanguage === 'hindi' ? 'सफाई जारी' : 'Cleaning in Progress')
                      : comp.assignedVehicle.status === 'On Route'
                        ? (currentLanguage === 'hindi' ? 'मार्ग में' : 'On Route')
                        : (currentLanguage === 'hindi' ? 'आवंटित' : 'Assigned')}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3 text-left">
              <span className="text-lg">⏳</span>
              <div>
                <h4 className="text-xs font-black text-slate-700">
                  {currentLanguage === 'hindi' ? 'वाहन आवंटन लंबित' : 'Awaiting Assignment'}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {currentLanguage === 'hindi' ? 'नगर पालिका जल्द ही सफाई वाहन आवंटित करेगी।' : 'Municipality is allocating a garbage clearance vehicle shortly.'}
                </p>
              </div>
            </div>
          )}
        </section>
      )}
      {/* Before / After Photo Comparison Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Before Photo */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group">
          <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow animate-fade-in">
            {currentLanguage === 'hindi' ? 'पहले' : 'Before'}
          </div>
          {/* Dynamic SLA Badge - Beside/Over the "Before" photo */}
          <div className={`absolute top-3 right-3 z-10 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow animate-fade-in ${
            slaInfo.isOverdue 
              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }`}>
            {slaInfo.remainingStr}
          </div>
          <div className="aspect-video w-full bg-slate-100">
            <img src={comp.beforeImage} alt="Debris before cleanup" className="w-full h-full object-cover" />
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {currentLanguage === 'hindi' ? 'रिपोर्ट दर्ज की गई:' : 'Report Filed:'} {comp.submitTime}
            </p>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              slaInfo.isOverdue ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100'
            }`}>
              {slaInfo.remainingStr}
            </span>
          </div>
        </div>

        {/* After Photo or Awaiting Completion Photo Placeholder / SLA details */}
        {comp.afterImage ? (
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group animate-fade-in">
            <div className="absolute top-3 left-3 z-10 bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
              {currentLanguage === 'hindi' ? 'बाद में (साफ़ किया हुआ)' : 'After (Cleaned)'}
            </div>
            <div className="aspect-video w-full bg-slate-100">
              <img src={comp.afterImage} alt="Cleared spot" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {currentLanguage === 'hindi' ? 'स्थान साफ़ किया गया:' : 'Site Cleared:'} {comp.resolveTime || (currentLanguage === 'hindi' ? 'अभी-अभी' : 'Just Now')}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-sm min-h-[160px] animate-fade-in">
            <div>
              {/* Header section with Icon and Title */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400">
                    <Camera className="w-4 h-4 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-800 tracking-tight uppercase">
                    {currentLanguage === 'hindi' ? 'बाद में (साफ़ सफ़ाई सबूत)' : 'After Evidence'}
                  </h4>
                </div>
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                  comp.status === 'IN_PROGRESS'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : comp.status === 'ASSIGNED'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : comp.status === 'VERIFIED'
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {comp.status === 'IN_PROGRESS'
                    ? (currentLanguage === 'hindi' ? 'प्रगति पर' : 'In Progress')
                    : comp.status === 'ASSIGNED'
                      ? (currentLanguage === 'hindi' ? 'आवंटित' : 'Assigned')
                      : comp.status === 'VERIFIED'
                        ? (currentLanguage === 'hindi' ? 'सत्यापित' : 'Verified')
                        : (currentLanguage === 'hindi' ? 'प्रस्तुत' : comp.status)}
                </span>
              </div>

              {/* Reserved same aspect ratio box for Completion Photo */}
              <div className="aspect-video w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4 mb-4 relative group">
                <div className="absolute top-2.5 left-2.5 bg-slate-500/85 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  {currentLanguage === 'hindi' ? 'बाद की तस्वीर का क्षेत्र' : 'After Photo Space'}
                </div>
                <Image className="w-8 h-8 text-slate-300 mb-1.5 animate-pulse" />
                <p className="text-xs font-black text-slate-600">
                  {currentLanguage === 'hindi' ? 'सफाई की तस्वीर का इंतज़ार है' : 'Awaiting Completion Photo'}
                </p>
                <p className="text-[9px] text-slate-400 font-bold mt-1 max-w-[200px] leading-tight">
                  {currentLanguage === 'hindi' ? 'सफाई टीम कार्य स्थल साफ करने के बाद यहाँ तस्वीर अपलोड करेगी' : 'Field worker will upload photo once cleanup is successfully completed'}
                </p>
              </div>
            </div>

            {/* Systematic Info Rows inside placeholder card */}
            <div className="border-t border-slate-100 pt-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentLanguage === 'hindi' ? 'एसएलए समय सीमा' : 'SLA Target Window'}
                </span>
                <span className="font-extrabold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {priority === 'HIGH'
                    ? (currentLanguage === 'hindi' ? '24 घंटे' : '24 Hours')
                    : priority === 'MEDIUM'
                    ? (currentLanguage === 'hindi' ? '3 दिन' : '3 Days')
                    : (currentLanguage === 'hindi' ? '7 दिन' : '7 Days')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentLanguage === 'hindi' ? 'अनुमानित पूरा होने का समय' : 'Estimated Completion'}
                </span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded border border-emerald-100/40">
                  {comp.estimatedCompletionTime || slaInfo.estimatedStr}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {currentLanguage === 'hindi' ? 'शेष एसएलए समय' : 'Remaining SLA Time'}
                </span>
                <span className={`font-extrabold px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                  slaInfo.isOverdue 
                    ? 'text-rose-700 bg-rose-50 border-rose-100' 
                    : 'text-amber-700 bg-amber-50 border-amber-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${slaInfo.isOverdue ? 'animate-ping' : 'animate-pulse'}`} />
                  {comp.remainingSlaTime || slaInfo.remainingStr}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
      {/* RATING & REOPEN INTERFACE (WHEN RESOLVED) */}
      {comp.status === 'RESOLVED' && (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-sm font-extrabold text-slate-800">
              {currentLanguage === 'hindi' ? 'सफाई रेटिंग और फ़ीडबैक' : 'Rate Cleanup Quality & Resolution'}
            </h3>
          </div>

          {!ratingSubmitted && !comp.rating ? (
            <form onSubmit={handleRatingSubmit} className="space-y-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {currentLanguage === 'hindi' 
                  ? 'इस समाधान से आप कितने संतुष्ट हैं? कृपया रेटिंग दें और फ़ीडबैक दर्ज करें।' 
                  : 'How satisfied are you with the cleanup? Provide a rating to improve our dispatch team scores.'}
              </p>

              {/* Stars selector */}
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedStars(star)}
                    className="p-1 cursor-pointer transform hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={`w-8 h-8 ${
                        star <= selectedStars 
                          ? 'text-amber-500 fill-amber-500' 
                          : 'text-slate-200'
                      }`} 
                    />
                  </button>
                ))}
              </div>

              {/* Feedback text input */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={currentLanguage === 'hindi' ? 'उदा. शानदार काम किया, धन्यवाद!' : 'e.g. Excellent work, fully cleared!'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md cursor-pointer"
                >
                  {currentLanguage === 'hindi' ? 'रेटिंग सबमिट करें' : 'Submit Rating'}
                </button>
                <button
                  type="button"
                  onClick={handleReopenSubmit}
                  className="bg-rose-50 border border-rose-100 hover:bg-rose-100/50 text-rose-700 font-extrabold text-xs py-3 px-5 rounded-xl cursor-pointer"
                >
                  {currentLanguage === 'hindi' ? 'असंतोष: फिर से खोलें' : 'Unsatisfied? Reopen'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center space-y-3">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <div>
                <h4 className="text-xs font-black text-slate-800">
                  {currentLanguage === 'hindi' ? 'फ़ीडबैक सबमिट किया गया' : 'Feedback Registered'}
                </h4>
                <div className="flex justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`w-4 h-4 ${
                        star <= (comp.rating || selectedStars) 
                          ? 'text-amber-500 fill-amber-500' 
                          : 'text-slate-200'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">
                  "<TranslatedText text={comp.feedback || feedbackText || 'Good cleanup!'} />"
                </p>
              </div>

              {/* Allow reopening even after rating */}
              <button
                type="button"
                onClick={handleReopenSubmit}
                className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer block mx-auto"
              >
                {currentLanguage === 'hindi' ? 'शिकायत फिर से खोलें' : 'Issue still not fully solved? Reopen Complaint'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Map Location Card */}
      <section className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 fill-emerald-100" />
            <span className="text-xs font-bold text-slate-800 truncate">
              <TranslatedText text={comp.address} />
            </span>
          </div>
        </div>
        <div className="h-40 w-full bg-slate-100 relative">
          <img
            className="w-full h-full object-cover grayscale opacity-60"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjCbwTbmgvd3ztsfg_EcswJVaCo2GDrFPGNlT0Qed8O2wgxYc4eJuYxYcfd2kYUgmdBLkcQhpWHX7EIaTvBWPdtGz8l7uitYO_w_5n_pkEnBEBmH-790YJKDaedyxX4MbssgweAfIutnD7WSfrJUky4X5MCwP7-6ou9And_tth068u2PAVsuahYNpUZyUI-6V2V06OgK_93dpN5GPXvUjY61lcEHlPEnYkpcH2J1NeVpfWXp6HZg-WAxQm-5uvOsKGtVkr-9sT6KM"
            alt="Complaint Map Location"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-3 bg-emerald-500/20 rounded-full animate-ping animate-duration-1000" />
              <MapPin className="w-8 h-8 text-emerald-600 fill-emerald-100 relative z-10 animate-bounce" />
            </div>
          </div>
        </div>
      </section>
      {/* Dispatched Crew Details Card */}
      {comp.assignedTeamName && (
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Dispatched Team</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=facearea&facepad=2&w=150&h=150&q=80"
                alt="Crew Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">{comp.assignedTeamName}</h4>
              <p className="text-[10px] text-slate-400 font-bold">Crew Lead: Sarah J.</p>
              <div className="flex items-center gap-1.5 mt-0.5 text-emerald-600">
                <Star className="w-3.5 h-3.5 fill-emerald-500 stroke-none" />
                <span className="text-[10px] font-black">4.9 / 5.0 Rating</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert('Opening live chat with Dispatch Crew...')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl transition-all cursor-pointer"
            >
              Message Crew
            </button>
            <button
              onClick={() => alert('Dialing Crew Lead: +91 98765 12121')}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </section>
      )}

      {/* Telemetry Logs & Public Discussion Feed */}
      <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm flex flex-col h-[320px]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates & Crew Chat</h3>
          </div>
        </div>

        {/* Scroll Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Logs */}
          <div className="space-y-3 border-b border-slate-50 pb-4">
           {(comp.liveUpdates || [
            {
              time: "Just now",
              text: `Complaint ${comp.status}`
            }
           ])
             .filter((update: any) => {
                if (comp.isDirectSubmit) {
                  const txt = update.text.toLowerCase();
                  return !txt.includes('ai auto-analysis') && !txt.includes('severity') && !txt.includes('classified as');
                }
                return true;
              })
             .map((update: any, idx: number) => (
                <div key={idx} className="relative pl-5 text-[11px] font-semibold text-slate-700 leading-normal">
                  <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-[9px] text-slate-400 block font-normal">{update.time}</span>
                  <span className="font-bold text-slate-600">
                    <TranslatedText text={update.text} />
                  </span>
                </div>
              ))}
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Discussion Board</p>
            {comp.comments.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-medium italic">No comments posted yet.</p>
            ) : (
             comp.comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-100 flex-shrink-0">
                    <img src={comment.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-[10px] font-extrabold ${comment.isAdmin ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {comment.authorName}
                      </span>
                      <span className="text-[8px] text-slate-400">{comment.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      <TranslatedText text={comment.text} />
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Input Footer */}
        <form onSubmit={handlePostComment} className="p-3 border-t border-slate-100 flex-shrink-0 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ask crew or post update..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
            <button
              type="submit"
              className="absolute right-2 p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </section>

      {showToast && comp.status === 'ASSIGNED' && (
        <div
          onClick={() => setShowToast(false)}
          className="fixed bottom-20 right-4 z-40 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce cursor-pointer border border-slate-800"
        >
          <Info className="text-emerald-400 w-5 h-5 flex-shrink-0" />
          <div className="font-sans text-left">
            <p className="text-xs font-black">Crew is 200m away from site</p>
            <p className="text-[10px] text-slate-400 opacity-90 font-medium">Estimated arrival in 3 mins</p>
          </div>
        </div>
      )}
    </div>
  );
};
