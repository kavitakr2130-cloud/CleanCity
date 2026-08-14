import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TranslatedText } from '../../components/TranslatedText';
import { 
  AlertTriangle, 
  Search, 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  Star, 
  ArrowLeft, 
  Eye, 
  ChevronRight,
  Info,
  UserPlus,
  Camera,
  MessageSquare,
  AlertCircle,
  FileCheck
} from 'lucide-react';

/**
 * FUTURE DATABASE AND API COMPATIBILITY SHEET
 * 
 * To connect this page to your MySQL database and REST APIs, map the following tables:
 * 
 * 1. `complaints` table:
 *    - Columns: id (VARCHAR), title (VARCHAR), description (TEXT), category (VARCHAR), 
 *      status (VARCHAR), priority (VARCHAR), address (VARCHAR), submit_time (DATETIME), after_image (VARCHAR)
 *    - Query: SELECT * FROM complaints WHERE status != 'RESOLVED' OR priority = 'HIGH'
 * 
 * 2. `worker_uploads` table (or resolution audit):
 *    - Columns: id, complaint_id, worker_id, after_image_url, upload_timestamp
 *    - Mapping: Corresponds to "Verification Pending" event types.
 * 
 * 3. `feedback` table:
 *    - Columns: id, complaint_id, overall_experience (INT), citizen_comment (TEXT), submission_date (DATETIME)
 *    - Mapping: Corresponds to "Citizen Feedback" event types.
 * 
 * 4. `alerts` or `notifications` system tables:
 *    - Standard monitoring log of automated actions / warnings.
 */

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
        now = new Date(2023, 9, 28, 12, 0, 0); // Simulated current time Oct 28, 2023 for old mock data
      }
      const diffTime = now.getTime() - submitDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      daysPending = Math.max(1, diffDays);
    }
  } catch (e) {
    console.error("Error calculating SLA:", e);
  }

  let slaLimitText = '';
  if (priority === 'HIGH' || priority === 'URGENT') {
    slaLimitText = '24 Hours';
    isOverdue = daysPending >= 1;
  } else if (priority === 'MEDIUM') {
    slaLimitText = '3 Days';
    isOverdue = daysPending >= 3;
  } else {
    slaLimitText = '7 Days';
    isOverdue = daysPending >= 7;
  }

  return { daysPending, slaLimitText, isOverdue };
};

interface AlertItem {
  id: string;
  type: 'priority' | 'sla' | 'photo' | 'feedback';
  title: string;
  desc: string;
  time: string;
  badge: string; // Meaningful Municipal Workflow Labels
  colorClass: string;
  icon: React.ReactNode;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  complaintId?: string;
  priority?: string;
  category?: string;
  location?: string;
  currentStatus?: string;
  overdueDuration?: string;
  afterImage?: string;
  rating?: number;
  comment?: string;
}

export const AdminAlerts: React.FC = () => {
  const { complaints, feedbacks } = useApp();
  const navigate = useNavigate();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Build dynamic alerts list mapped to actual database structures
  const allAlerts = useMemo(() => {
    const list: AlertItem[] = [];
    if (!complaints) return list;

    // 1. High/Urgent Priority Dispatch warnings
    complaints.forEach(c => {
      if (c.status === 'SUBMITTED' && (c.priority === 'HIGH' || c.priority === 'URGENT')) {
        list.push({
          id: `alert_high_${c.id}`,
          type: 'priority',
          title: `Crew Assignment Pending`,
          desc: `High priority grievance requires immediate dispatch of field cleaning crew to avoid backlog.`,
          time: c.submitTime,
          badge: 'High Priority Complaint',
          colorClass: 'bg-red-50 border-red-100 text-red-700 hover:bg-red-100/30',
          icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
          severity: 'CRITICAL',
          complaintId: c.id,
          priority: c.priority,
          category: c.category,
          location: c.address,
          currentStatus: c.status
        });
      }
    });

    // 2. SLA Overdue breaches
    complaints.forEach(c => {
      if (c.status !== 'RESOLVED' && c.status !== 'VERIFIED') {
        const { isOverdue, daysPending, slaLimitText } = getSlaInfo(c.submitTime, c.priority);
        if (isOverdue) {
          list.push({
            id: `alert_sla_${c.id}`,
            type: 'sla',
            title: `SLA Time Breach Alarm`,
            desc: `Grievance has exceeded its designated SLA threshold limit of ${slaLimitText}.`,
            time: `${daysPending}d Overdue`,
            badge: 'SLA Violation',
            colorClass: 'bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100/30',
            icon: <Clock className="w-5 h-5 text-orange-500" />,
            severity: 'CRITICAL',
            complaintId: c.id,
            priority: c.priority,
            category: c.category,
            location: c.address,
            currentStatus: c.status,
            overdueDuration: `${daysPending} days pending`
          });
        }
      }
    });

    // 3. Worker uploaded completion photo / Verification check (Verification Pending)
    complaints.forEach(c => {
      if (c.status !== 'RESOLVED' && c.afterImage) {
        list.push({
          id: `alert_photo_${c.id}`,
          type: 'photo',
          title: `Resolution Verification Request`,
          desc: `Field cleaning supervisor uploaded "After Cleaning" proof. Administrator audit pending.`,
          time: c.resolveTime || 'Recently',
          badge: 'Verification Pending',
          colorClass: 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100/30',
          icon: <FileCheck className="w-5 h-5 text-purple-500" />,
          severity: 'WARNING',
          complaintId: c.id,
          priority: c.priority,
          category: c.category,
          location: c.address,
          currentStatus: c.status,
          afterImage: c.afterImage
        });
      }
    });

    // 4. Citizen feedback (only for verified & resolved cases)
    if (feedbacks) {
      feedbacks.forEach(fb => {
        const c = complaints.find(comp => comp.id === fb.complaintId);
        if (c && c.status === 'RESOLVED') {
          const severityValue = fb.overallExperience <= 2 ? 'WARNING' : 'INFO';
          list.push({
            id: `alert_fb_${fb.id}`,
            type: 'feedback',
            title: `Citizen Survey Submitted`,
            desc: `User submitted feedback score card for resolved municipal complaint.`,
            time: fb.submissionDate,
            badge: 'Citizen Feedback',
            colorClass: 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/30',
            icon: <Star className="w-5 h-5 text-emerald-500 fill-emerald-100" />,
            severity: severityValue,
            complaintId: fb.complaintId,
            category: fb.complaintCategory || (c ? c.category : 'Other'),
            location: c ? c.address : 'CleanCity Block',
            currentStatus: c.status,
            priority: c.priority,
            rating: fb.overallExperience,
            comment: fb.citizenComment || 'No additional written details provided.'
          });
        }
      });
    }

    return list;
  }, [complaints, feedbacks]);

  // Statistics dynamically mapped from complaints/feedbacks state
  const stats = useMemo(() => {
    // Total Active Alerts = Unresolved/pending actionable events generated by complaints
    const totalActive = allAlerts.length;

    // Critical Breaches = Complaints whose SLA has already expired
    const criticalBreaches = complaints.filter(c => {
      if (c.status === 'RESOLVED' || c.status === 'VERIFIED') return false;
      const { isOverdue } = getSlaInfo(c.submitTime, c.priority);
      return isOverdue;
    }).length;

    // SLA Time Violations = Complaints approaching or exceeding their SLA limit
    const slaTimeViolations = complaints.filter(c => {
      if (c.status === 'RESOLVED' || c.status === 'VERIFIED') return false;
      const { daysPending, isOverdue } = getSlaInfo(c.submitTime, c.priority);
      // Approaching or crossed (e.g. pending more than 1 day or overdue)
      return isOverdue || daysPending >= 1;
    }).length;

    // Audits Pending = Worker uploaded completion proof waiting for administrator verification
    const auditsPending = complaints.filter(c => c.status !== 'RESOLVED' && c.afterImage).length;

    return { totalActive, criticalBreaches, slaTimeViolations, auditsPending };
  }, [allAlerts, complaints]);

  // Filtering alerts based on search query and dropdown selections
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter(alert => {
      const matchesSearch = searchQuery === '' || 
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (alert.complaintId && alert.complaintId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (alert.location && alert.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (alert.category && alert.category.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type Filter (re-mapped internally)
      const matchesType = typeFilter === 'ALL' || alert.type === typeFilter;

      // Severity Filter
      const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;

      // Priority Filter
      const matchesPriority = priorityFilter === 'ALL' || 
        (alert.priority && alert.priority.toUpperCase() === priorityFilter.toUpperCase());

      return matchesSearch && matchesType && matchesSeverity && matchesPriority;
    });
  }, [allAlerts, searchQuery, typeFilter, severityFilter, priorityFilter]);

  return (
    <div className="space-y-6 max-h-full overflow-y-auto pb-10 text-left">
        
        {/* Header Breadcrumb */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600">Monitoring & SLA Alerts</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">System Monitoring Alerts</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Automated workflow logs, critical SLA violations, and worker proof audits</p>
          </div>
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
        </div>


        {/* Filter Toolbar Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col xl:flex-row gap-4 items-center justify-between">
          
          {/* Search bar */}
          <div className="relative w-full xl:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search ID, category, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800"
            />
          </div>

         
        </div>

        {/* Alerts List Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-left">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Live Alert Incidents ({filteredAlerts.length})</h3>
            <span className="text-[10px] text-slate-400 font-bold">Standard Administrative SLA Priority Sequence</span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredAlerts.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No matching system alerts found</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Try resetting or broadening your filters.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                // Style variables based on municipal event category
                let borderCol = 'border-l-red-500';
                let alertThemeClass = 'bg-red-50/20';
                let typeIcon = <ShieldAlert className="w-4 h-4 text-red-600" />;
                let actionBtnLabel = 'Assign Crew';
                let actionBtnIcon = <UserPlus className="w-3.5 h-3.5" />;

                if (alert.type === 'sla') {
                  borderCol = 'border-l-orange-500';
                  alertThemeClass = 'bg-orange-50/25';
                  typeIcon = <Clock className="w-4 h-4 text-orange-600" />;
                  actionBtnLabel = 'Open Complaint';
                  actionBtnIcon = <Eye className="w-3.5 h-3.5" />;
                } else if (alert.type === 'photo') {
                  borderCol = 'border-l-purple-500';
                  alertThemeClass = 'bg-purple-50/25';
                  typeIcon = <Camera className="w-4 h-4 text-purple-600" />;
                  actionBtnLabel = 'Review Proof';
                  actionBtnIcon = <CheckCircle className="w-3.5 h-3.5" />;
                } else if (alert.type === 'feedback') {
                  borderCol = 'border-l-emerald-500';
                  alertThemeClass = 'bg-emerald-50/20';
                  typeIcon = <MessageSquare className="w-4 h-4 text-emerald-600" />;
                  actionBtnLabel = 'View Feedback';
                  actionBtnIcon = <Star className="w-3.5 h-3.5" />;
                }

                return (
                  <div 
                    key={alert.id}
                    className={`p-5 transition-all flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between border-l-4 ${borderCol} ${alertThemeClass}`}
                  >
                    <div className="flex gap-4 items-start min-w-0 flex-1">
                      {/* Icon container */}
                      <span className="p-2 bg-white rounded-xl shadow-xs border border-slate-100 mt-0.5 shrink-0 flex items-center justify-center">
                        {typeIcon}
                      </span>
                      
                      {/* Detail section */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black tracking-widest uppercase bg-white px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                            {alert.badge}
                          </span>
                          <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-md ${
                            alert.severity === 'CRITICAL' 
                              ? 'bg-red-100 text-red-800 border border-red-200/55' 
                              : alert.severity === 'WARNING' 
                                ? 'bg-purple-100 text-purple-800 border border-purple-200/55' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200/55'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{alert.time}</span>
                          {alert.complaintId && (
                            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-150 px-2 py-0.5 rounded border border-slate-200">
                              {alert.complaintId}
                            </span>
                          )}
                        </div>

                        {/* Title and description */}
                        <h4 className="text-xs font-black text-slate-800">
                          <TranslatedText text={alert.title} />
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-3xl">
                          <TranslatedText text={alert.desc} />
                        </p>

                        {/* Event specific visual data modules */}
                        {alert.type === 'photo' && alert.afterImage && (
                          <div className="mt-2.5 p-2 bg-white rounded-xl border border-slate-100 flex items-center gap-3 w-fit max-w-full">
                            <img 
                              src={alert.afterImage} 
                              alt="After Cleaning Proof" 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-left pr-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Resolution Proof Attached</span>
                              <span className="text-[10px] text-slate-500 font-bold block">Awaiting Acceptance Verification</span>
                            </div>
                          </div>
                        )}

                        {alert.type === 'feedback' && (
                          <div className="mt-2.5 p-3 bg-white rounded-xl border border-slate-100 text-left max-w-xl">
                            <div className="flex items-center gap-1 mb-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-3 h-3 ${
                                    star <= (alert.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                  }`} 
                                />
                              ))}
                              <span className="text-[10px] text-slate-400 font-bold ml-1">({alert.rating}/5 rating)</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 italic">
                              "<TranslatedText text={alert.comment ?? ""} />"
                            </p>
                          </div>
                        )}

                        {alert.type === 'sla' && alert.overdueDuration && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>This grievance has exceeded standard municipal timeline constraints: ({alert.overdueDuration})</span>
                          </div>
                        )}

                        {/* Unified Structural Metadata Grid for Future REST & MySQL mapping */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-3 pt-3 border-t border-slate-100/70 text-[10.5px]">
                          <div>
                            <span className="text-slate-400 font-medium block">Category</span>
                            <span className="text-slate-700 font-bold">{alert.category || 'Household'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">Location</span>
                            <span className="text-slate-700 font-bold truncate block max-w-[150px]" title={alert.location}>
                              <TranslatedText text={alert.location || 'Sector Area'} />
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">Priority Level</span>
                            <span className={`font-black uppercase text-[10px] ${
                              alert.priority === 'URGENT' || alert.priority === 'HIGH' ? 'text-red-600' : 'text-slate-600'
                            }`}>{alert.priority || 'MEDIUM'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">Grievance Status</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black text-[9px] border border-slate-200/50">
                              {alert.currentStatus || 'SUBMITTED'}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Context-aware buttons per alert type */}
                    {alert.complaintId && (
                      <button
                        onClick={() => navigate(`/admin/complaint/${alert.complaintId}`)}
                        className="w-full lg:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        {actionBtnIcon}
                        {actionBtnLabel}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
  );
};
