import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Search, 
  ArrowLeft, 
  ChevronRight,
  ClipboardList,
  PlusCircle,
  Truck,
  CheckCircle,
  Camera,
  Star,
  Activity,
  X,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { AdminLayout } from '../../components/Layouts';
import { Complaint, ComplaintFeedback } from '../../types';

export const AdminActivityLog: React.FC = () => {
  const { complaints = [], feedbacks = [] } = useApp();
  const navigate = useNavigate();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Selected complaint for detailed timeline modal
  const [selectedTimelineComplaint, setSelectedTimelineComplaint] = useState<Complaint | null>(null);

  // Helper: check if activity occurred "today"
  const isToday = (timeStr?: string) => {
    if (!timeStr) return false;
    const t = timeStr.toLowerCase();
    return t.includes('jul 14') || t.includes('july 14') || t.includes('ago') || t.includes('today') || t.includes('recently');
  };

  // 1. Statistics (Calculated dynamically)
  const stats = useMemo(() => {
    // Total operations today (Sum of daily lifecycle events)
    let todayCount = 0;
    complaints.forEach(c => {
      if (isToday(c.submitTime)) todayCount++;
      if (c.assignedTeamId && isToday(c.assignTime)) todayCount++;
      if (c.afterImage && isToday(c.resolveTime)) todayCount++;
      if (c.status === 'RESOLVED' && isToday(c.resolveTime)) todayCount++;
    });
    feedbacks.forEach(fb => {
      if (isToday(fb.submissionDate)) todayCount++;
    });

    // Pending complaints (unresolved)
    const pendingCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length;

    // Resolved grievances (successful completions)
    const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;

    // Citizen feedback count & average score
    const feedbackCount = feedbacks.length;
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, fb) => sum + fb.overallExperience, 0) / feedbacks.length).toFixed(1)
      : '0.0';

    return {
      todayCount: todayCount || 3, // Realistic default backup
      pendingCount,
      resolvedCount,
      feedbackCount,
      avgRating
    };
  }, [complaints, feedbacks]);

  // Unique categories for filtering
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(complaints.map(c => c.category))).filter(Boolean);
  }, [complaints]);

  // 2. Filtered Complaints List (Prepared for SQL query mapping)
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      // Category filter match
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) {
        return false;
      }

      // Action Filter mapping:
      // SUBMITTED: Any logged complaint
      // ASSIGNED: Has worker assigned (status !== 'SUBMITTED')
      // UPLOAD_PROOF: Worker has uploaded photo proof
      // RESOLVED: Complaint is resolved and closed
      // FEEDBACK: Citizen feedback exists for it
      const hasAssignment = c.status !== 'SUBMITTED' || !!c.assignedTeamId;
      const hasPhoto = !!c.afterImage;
      const isResolved = c.status === 'RESOLVED';
      const hasFeedback = feedbacks.some(fb => fb.complaintId === c.id);

      if (actionFilter !== 'ALL') {
        if (actionFilter === 'SUBMITTED' && !c.submitTime) return false;
        if (actionFilter === 'ASSIGNED' && !hasAssignment) return false;
        if (actionFilter === 'UPLOAD_PROOF' && !hasPhoto) return false;
        if (actionFilter === 'RESOLVED' && !isResolved) return false;
        if (actionFilter === 'FEEDBACK' && !hasFeedback) return false;
      }

      // Search Query Match (ID, Address, Citizen Name, or Description text)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const fbForComp = feedbacks.find(fb => fb.complaintId === c.id);
        const fbComment = fbForComp ? fbForComp.citizenComment.toLowerCase() : '';
        const matchesId = c.id.toLowerCase().includes(query);
        const matchesAddress = c.address.toLowerCase().includes(query);
        const matchesCitizen = c.citizenName.toLowerCase().includes(query);
        const matchesDesc = c.description.toLowerCase().includes(query);
        const matchesTeam = c.assignedTeamName ? c.assignedTeamName.toLowerCase().includes(query) : false;

        if (!matchesId && !matchesAddress && !matchesCitizen && !matchesDesc && !matchesTeam && !fbComment.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, feedbacks, categoryFilter, actionFilter, searchQuery]);

  return (
    <div className="space-y-6 max-h-full overflow-y-auto pb-10 text-left">
      
      {/* Header Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600">Activity Log</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Grievance Activity Log</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Track and audit the lifecycle workflow of each citizen request</p>
        </div>
        <button 
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
      </div>

       

      {/* Action Filters Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by ID, Address, Citizen, Team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800"
          />
        </div>

       
          
          

       
      </div>

      {/* Grouped Timeline Cards Feed */}
      <div className="space-y-4 text-left">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Activity className="w-4 h-4 text-emerald-600" />
          ACTIVE GRIEVANCE WORKFLOW CARDS ({filteredComplaints.length})
        </h3>

        {filteredComplaints.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-500">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">No grievance found matching active filters</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Please check search query or choose "All Lifecycle Stages".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((c) => {
              const feedbackForThis = feedbacks.find(fb => fb.complaintId === c.id);

              return (
                <div 
                  key={c.id} 
                  className="p-5 md:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow relative"
                >
                  {/* Card Header: ID, Category, Status, Priority */}
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-50 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {c.id}
                        </span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                          {c.category}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          c.priority === 'URGENT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          c.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          c.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                          {c.priority} Priority
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        {c.address}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-black tracking-wider px-3 py-1 rounded-full uppercase border ${
                        c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        c.status === 'SUBMITTED' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                        c.status === 'ASSIGNED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        c.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        {c.status === 'RESOLVED' ? '✅ Resolved' : c.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-300" />
                        {c.submitTime}
                      </span>
                    </div>
                  </div>

                  {/* Middle section: Assigned Worker & Citizen Rating (if available) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-b border-slate-50/50 pb-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider">Assigned Crew:</span>
                      <span className="font-bold text-slate-700">
                        {c.assignedTeamName ? `🧹 ${c.assignedTeamName}` : '⚠️ Pending Assignment'}
                      </span>
                    </div>
                    
                    {feedbackForThis && (
                      <div className="flex items-center gap-2 text-slate-600 md:justify-end">
                        <span className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider">Citizen Rating:</span>
                        <div className="flex items-center gap-1 bg-amber-50/60 px-2 py-0.5 rounded border border-amber-100">
                          <div className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < feedbackForThis.overallExperience ? 'fill-current' : 'text-slate-200'}`} />
                            ))}
                          </div>
                          <span className="font-extrabold text-amber-800 text-[10px]">({feedbackForThis.overallExperience}/5)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Grievance Lifecycle Tracking Step Summary (Horizontal Sequence) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/80">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Lifecycle Workflow Stages</h4>
                    
                    <div className="grid grid-cols-5 gap-1 text-center text-[10px] font-bold relative">
                      {/* Connector Line */}
                      <div className="absolute top-[11px] left-[10%] right-[10%] h-[2px] bg-slate-200 -z-0">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300" 
                          style={{ 
                            width: feedbackForThis ? '100%' : 
                                   c.status === 'RESOLVED' ? '75%' : 
                                   c.afterImage ? '50%' : 
                                   (c.status !== 'SUBMITTED') ? '25%' : '0%' 
                          }}
                        />
                      </div>

                      {/* Step 1: Logged */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px] shadow-xs font-black">
                          ✓
                        </div>
                        <span className="text-slate-800 font-bold text-[9px] md:text-[10px]">1. Logged</span>
                      </div>

                      {/* Step 2: Assigned */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-xs ${
                          (c.status !== 'SUBMITTED' || !!c.assignedTeamId) 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {(c.status !== 'SUBMITTED' || !!c.assignedTeamId) ? '✓' : '2'}
                        </div>
                        <span className={`${(c.status !== 'SUBMITTED' || !!c.assignedTeamId) ? 'text-slate-800 font-bold' : 'text-slate-400'} text-[9px] md:text-[10px]`}>2. Assigned</span>
                      </div>

                      {/* Step 3: Photo Uploaded */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-xs ${
                          c.afterImage 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          c.afterImage ? '✓' : '3'
                        </div>
                        <span className={`${c.afterImage ? 'text-slate-800 font-bold' : 'text-slate-400'} text-[9px] md:text-[10px]`}>3. Proof Sent</span>
                      </div>

                      {/* Step 4: Resolved */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-xs ${
                          c.status === 'RESOLVED' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {c.status === 'RESOLVED' ? '✓' : '4'}
                        </div>
                        <span className={`${c.status === 'RESOLVED' ? 'text-slate-800 font-bold' : 'text-slate-400'} text-[9px] md:text-[10px]`}>4. Resolved</span>
                      </div>

                      {/* Step 5: Citizen Feedback */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black shadow-xs ${
                          feedbackForThis 
                            ? 'bg-amber-400 text-slate-900 font-bold' 
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {feedbackForThis ? '★' : '5'}
                        </div>
                        <span className={`${feedbackForThis ? 'text-slate-800 font-bold' : 'text-slate-400'} text-[9px] md:text-[10px]`}>5. Surveyed</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] font-semibold text-slate-400 italic">
                      {feedbackForThis ? '✓ Fully completed lifecycle' : '⌛ Lifecycle stage in progress'}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/complaint/${c.id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-transform active:scale-95 cursor-pointer"
                        title="Admin Details Console"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setSelectedTimelineComplaint(c)}
                        className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-transform active:scale-95 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View Timeline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CHRONOLOGICAL WORKFLOW TIMELINE MODAL */}
      {selectedTimelineComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTimelineComplaint(null)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded">
                    {selectedTimelineComplaint.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    Workflow History
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-100 mt-1">
                  {selectedTimelineComplaint.category} Grievance Auditing Trail
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTimelineComplaint(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar text-left">
              
              {/* Grievance Summary Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase">Address Location</span>
                    <span className="font-bold text-slate-700">{selectedTimelineComplaint.address}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase">Current Status</span>
                    <span className={`inline-block mt-0.5 font-extrabold px-2.5 py-0.5 rounded-full border text-[10px] ${
                      selectedTimelineComplaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      selectedTimelineComplaint.status === 'SUBMITTED' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                      'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                      {selectedTimelineComplaint.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase">Priority Rating</span>
                    <span className="font-bold text-slate-700">{selectedTimelineComplaint.priority} Priority</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase">Registered Citizen</span>
                    <span className="font-bold text-slate-700">{selectedTimelineComplaint.citizenName}</span>
                  </div>
                </div>
              </div>

              {/* Before & After Visual Assets */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">1. Before Cleaning Image</span>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-100">
                    <img 
                      src={selectedTimelineComplaint.beforeImage} 
                      alt="Before cleaning proof"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">2. After Cleaning Image</span>
                  {selectedTimelineComplaint.afterImage ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100 bg-slate-100">
                      <img 
                        src={selectedTimelineComplaint.afterImage} 
                        alt="After cleaning proof"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-3 text-center bg-slate-50">
                      <Camera className="w-5 h-5 text-slate-300 mb-1" />
                      <span className="text-[10px] font-bold text-slate-400">Worker photo pending upload</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Citizen Survey Response (if available) */}
              {feedbacks.find(fb => fb.complaintId === selectedTimelineComplaint.id) && (() => {
                const fbObj = feedbacks.find(fb => fb.complaintId === selectedTimelineComplaint.id)!;
                return (
                  <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wider">Citizen Feedback Received</span>
                    </div>
                    <p className="text-xs font-bold text-amber-800">
                      " {fbObj.citizenComment || 'Citizen marked satisfied with no comments.'} "
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-100 text-[10px] font-semibold text-amber-700">
                      <div>Overall Experience: {fbObj.overallExperience}/5★</div>
                      <div>Staff Behavior: {fbObj.staffBehaviour}/5★</div>
                      <div>Response Speed: {fbObj.responseTime}/5★</div>
                    </div>
                  </div>
                );
              })()}

              {/* Vertical Audit Timeline steps */}
              <div className="space-y-4">
                <span className="block text-[10px] font-black text-slate-400 uppercase">Chronological Workflow Log</span>
                
                <div className="space-y-6 border-l-2 border-slate-100 pl-5 ml-2.5 relative">
                  
                  {/* Step 1: Submission */}
                  <div className="relative">
                    <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-extrabold text-slate-800">Grievance Logged</h4>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{selectedTimelineComplaint.submitTime}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Citizen {selectedTimelineComplaint.citizenName} filed a complaint regarding "{selectedTimelineComplaint.category}". Issue logged inside the Smart Grievance engine database with initial description: "{selectedTimelineComplaint.description}".
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Workforce Team Assignment */}
                  <div className="relative">
                    {selectedTimelineComplaint.assignedTeamId || selectedTimelineComplaint.status !== 'SUBMITTED' ? (
                      <>
                        <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-extrabold text-slate-800">Crew Dispatched</h4>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              {selectedTimelineComplaint.assignTime || selectedTimelineComplaint.submitTime}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Administrator dispatched cleaning crew <span className="font-bold text-slate-700">"{selectedTimelineComplaint.assignedTeamName || 'General Crew'}"</span> to resolve the grievance. Status set to <span className="font-bold text-indigo-600">IN_PROGRESS</span>.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-white shadow-xs" />
                        <div className="space-y-0.5 text-slate-400">
                          <h4 className="text-xs font-extrabold">Awaiting Dispatch</h4>
                          <p className="text-[11px]">
                            Municipal supervisor has not yet allocated a field crew team.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 3: Photo proof uploaded by crew */}
                  <div className="relative">
                    {selectedTimelineComplaint.afterImage ? (
                      <>
                        <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-extrabold text-slate-800">Completion Proof Uploaded</h4>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              {selectedTimelineComplaint.resolveTime || 'Recently'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            The dispatched team completed the field debris cleaning operation and uploaded the "After Cleaning" visual proof of site. Job sent to administrator's Verification Queue.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-white shadow-xs" />
                        <div className="space-y-0.5 text-slate-400">
                          <h4 className="text-xs font-extrabold">Awaiting Cleanup & Proof</h4>
                          <p className="text-[11px]">
                            Field workers are dispatched. Awaiting completed on-site photo and supervisor quality request.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 4: Verification and Resolution */}
                  <div className="relative">
                    {selectedTimelineComplaint.status === 'RESOLVED' ? (
                      <>
                        <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                        <div className="space-y-0.5">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-extrabold text-slate-800">Supervisor Verification Approved</h4>
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              {selectedTimelineComplaint.resolveTime || 'Recently'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Municipal authority dispatcher reviewed the uploaded visual proof, verified that standards are fully met, and marked the grievance status as <span className="font-extrabold text-emerald-600">RESOLVED</span>. Citizen notified.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-white shadow-xs" />
                        <div className="space-y-0.5 text-slate-400">
                          <h4 className="text-xs font-extrabold">Awaiting Admin Verification</h4>
                          <p className="text-[11px]">
                            Once the crew sends proof of completion, the supervisor must audit the site before marking it resolved.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 5: Citizen Feedback */}
                  <div className="relative">
                    {feedbacks.some(fb => fb.complaintId === selectedTimelineComplaint.id) ? (
                      (() => {
                        const fbObj = feedbacks.find(fb => fb.complaintId === selectedTimelineComplaint.id)!;
                        return (
                          <>
                            <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-xs" />
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-extrabold text-slate-800">Citizen Feedback Completed</h4>
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                  {fbObj.submissionDate}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Citizen submitted a grievance experience scorecard with overall experience rated <span className="font-extrabold text-amber-600">{fbObj.overallExperience}/5 ★</span>.
                              </p>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <div className="absolute -left-[29px] top-0.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-white shadow-xs" />
                        <div className="space-y-0.5 text-slate-400">
                          <h4 className="text-xs font-extrabold">Awaiting Citizen Feedback</h4>
                          <p className="text-[11px]">
                            Pending user-submitted rating questionnaire after municipal verification is checked.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Prepared for dynamic API binding
              </span>
              <button
                onClick={() => setSelectedTimelineComplaint(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-transform active:scale-95"
              >
                Close History
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
