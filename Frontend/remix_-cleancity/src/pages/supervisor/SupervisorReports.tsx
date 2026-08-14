import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  Award, 
  Clock, 
  TrendingUp, 
  Users, 
  Star, 
  Smile, 
  Sparkles, 
  CheckCircle,
  Coins,
  RefreshCw,
  FolderOpen,
  BarChart3,
  ArrowLeft,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Reusable "No Data" placeholder component
const NoDataState: React.FC<{ title?: string; message?: string }> = ({ 
  title = "No Data Available", 
  message = "There are currently no active records or feedback entries in Sector 04 to calculate this metric." 
}) => (
  <div id="no-data-placeholder" className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-300">
    <div className="p-3 bg-slate-100 rounded-2xl text-slate-400">
      <AlertCircle className="w-8 h-8" />
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-extrabold text-slate-850">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-semibold">{message}</p>
    </div>
  </div>
);

export const SupervisorReports: React.FC = () => {
  const { complaints = [], feedbacks = [] } = useApp();
  const [exporting, setExporting] = useState<'NONE' | 'PDF' | 'CSV'>('NONE');
  const [showToast, setShowToast] = useState<string | null>(null);
  
  // Track active detailed view: 'MAIN' or one of the detailed pages
  const [activeSubView, setActiveSubView] = useState<'MAIN' | 'MONTHLY_TRENDS' | 'RESOLUTION_ANALYTICS' | 'COMPLAINT_CATEGORIES' | 'WORKFORCE_PERFORMANCE' | 'ZONE_PERFORMANCE'>('MAIN');

  // Sector 04 specific complaints filter
  const zoneComplaints = useMemo(() => {
    return complaints.filter(c => {
      const code = parseInt(c.id.replace('CC-', '')) || 0;
      return code % 2 === 1 || c.address.includes('4') || c.address.toLowerCase().includes('park');
    });
  }, [complaints]);

  // Sector 04 specific feedbacks filter
  const zoneFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const comp = complaints.find(c => c.id === f.complaintId);
      if (!comp) return false;
      const code = parseInt(comp.id.replace('CC-', '')) || 0;
      return code % 2 === 1 || comp.address.includes('4') || comp.address.toLowerCase().includes('park');
    });
  }, [feedbacks, complaints]);

  // Zone specific metrics
  const zoneMetrics = useMemo(() => {
    const total = zoneComplaints.length;
    // Pending: Submitted or Reopened and not resolved
    const pending = zoneComplaints.filter(c => (c.status === 'SUBMITTED' || c.status === 'REOPENED') && !c.afterImage).length;
    const inProgress = zoneComplaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;
    // Awaiting Verification: status is not resolved but has afterImage
    const awaitingVerify = zoneComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'VERIFIED' && c.afterImage).length;
    const resolved = zoneComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'VERIFIED').length;

    // Avg resolution time
    let totalHrs = 0;
    let resolvedCount = 0;
    zoneComplaints.forEach(c => {
      if (c.status === 'RESOLVED' || c.status === 'VERIFIED') {
        resolvedCount++;
        let hours = 2.4;
        if (c.submitTime && c.resolveTime) {
          try {
            const t1 = Date.parse(c.submitTime.replace(',', ''));
            const t2 = Date.parse(c.resolveTime.replace(',', ''));
            if (t2 > t1) hours = (t2 - t1) / (1000 * 60 * 60);
          } catch (e) {}
        } else {
          const code = c.id.charCodeAt(c.id.length - 1) || 0;
          hours = 1.0 + (code % 3) * 0.8;
        }
        totalHrs += hours;
      }
    });
    const avgResolutionTime = resolvedCount > 0 
      ? `${(totalHrs / resolvedCount).toFixed(1)} hrs` 
      : '2.4 hrs';

    // Citizen Satisfaction
    let totalFbStars = 0;
    let fbCount = 0;
    zoneFeedbacks.forEach(f => {
      totalFbStars += f.overallExperience;
      fbCount++;
    });
    const satisfaction = fbCount > 0 
      ? `${(totalFbStars / fbCount).toFixed(1)} ★` 
      : '4.8 ★';

    // CleanPoints
    const points = zoneComplaints.reduce((sum, c) => {
      if (c.status === 'RESOLVED' || c.status === 'VERIFIED') {
        return sum + (c.cleanPointsAwarded || 150);
      }
      return sum;
    }, 0);
    const cleanPoints = Math.max(points, 950);

    return {
      total,
      pending,
      inProgress,
      awaitingVerify,
      resolved,
      avgResolutionTime,
      satisfaction,
      cleanPoints
    };
  }, [zoneComplaints, zoneFeedbacks]);

  // Sector 04 Trend Data
  const zoneMonthlyTrend = [
    { month: 'Feb', complaints: 3, resolved: 2 },
    { month: 'Mar', complaints: 5, resolved: 4 },
    { month: 'Apr', complaints: 8, resolved: 7 },
    { month: 'May', complaints: 12, resolved: 10 },
    { month: 'Jun', complaints: 11, resolved: 11 },
    { month: 'Jul', complaints: 14, resolved: 12 },
  ];

  const zoneResolutionTrend = [
    { month: 'Feb', avgHours: 5.6 },
    { month: 'Mar', avgHours: 4.8 },
    { month: 'Apr', avgHours: 4.2 },
    { month: 'May', avgHours: 3.5 },
    { month: 'Jun', avgHours: 2.9 },
    { month: 'Jul', avgHours: 2.1 },
  ];

  const zoneCategoryDistribution = useMemo(() => {
    const counts: Record<string, number> = { Household: 0, Plastic: 0, Construction: 0, Hazardous: 0, Other: 0 };
    zoneComplaints.forEach(c => {
      const cat = counts[c.category] !== undefined ? c.category : 'Other';
      counts[cat]++;
    });
    const total = zoneComplaints.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [zoneComplaints]);

  const zonePriorityDistribution = useMemo(() => {
    const counts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    zoneComplaints.forEach(c => {
      const p = counts[c.priority] !== undefined ? c.priority : 'MEDIUM';
      counts[p]++;
    });
    const total = zoneComplaints.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  }, [zoneComplaints]);

  const handleTriggerExport = (type: 'PDF' | 'CSV') => {
    setExporting(type);
    setTimeout(() => {
      setExporting('NONE');
      const filename = `CleanCity_Sector04_Zone_Report_${new Date().toISOString().split('T')[0]}.${type.toLowerCase()}`;
      setShowToast(`Export successful! "${filename}" is ready.`);
      setTimeout(() => setShowToast(null), 4000);
    }, 1500);
  };

  return (
    <div id="zone-reports-container" className="space-y-6 max-h-full overflow-y-auto pb-10 text-left animate-in fade-in duration-300">
      
      {/* Toast Alert Banner */}
      {showToast && (
        <div id="toast-banner" className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold">{showToast}</span>
        </div>
      )}

      {/* RENDER VIEW DEPENDING ON ACTIVE STATE */}
      {activeSubView === 'MAIN' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Title and Subtitle */}
          <div id="zone-reports-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 id="zone-reports-title" className="text-xl font-extrabold text-slate-900">Zone Performance Reports</h2>
              <p id="zone-reports-subtitle" className="text-xs text-slate-500 font-semibold mt-0.5">
                Performance analytics and operational reports for your assigned zone.
              </p>
            </div>
            
            <div id="zone-reports-badge" className="flex items-center gap-2 text-[10px] bg-indigo-50 text-indigo-700 font-black px-3 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
              Sector 04 Monitor • Active
            </div>
          </div>

          {/* Scorecard Grid - Exactly 6 summary metrics */}
          <div id="zone-reports-scorecard-grid" className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Total Complaints */}
            <div id="kpi-total-complaints" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-200">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Complaints</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{zoneMetrics.total}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-2 pt-1 border-t border-slate-50/50 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Total registered cases
              </p>
            </div>

            {/* 2. Pending Complaints */}
            <div id="kpi-pending-complaints" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-200">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-amber-600">Pending Complaints</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{zoneMetrics.pending}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-2 pt-1 border-t border-slate-50/50 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Awaiting dispatch
              </p>
            </div>

            {/* 3. In Progress */}
            <div id="kpi-in-progress" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-200">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-blue-600">In Progress</span>
                <span className="text-2xl font-black text-blue-600 mt-1 block">{zoneMetrics.inProgress}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-2 pt-1 border-t border-slate-50/50 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                Active cleaning orders
              </p>
            </div>

            {/* 4. Awaiting Verification */}
            <div id="kpi-awaiting-verification" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-200">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-purple-600">Awaiting Verification</span>
                <span className="text-2xl font-black text-purple-600 mt-1 block">{zoneMetrics.awaitingVerify}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-2 pt-1 border-t border-slate-50/50 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-purple-500" />
                Requires Supervisor audit
              </p>
            </div>

            {/* 5. Resolved Complaints */}
            <div id="kpi-resolved" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-200">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-emerald-600">Resolved Complaints</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{zoneMetrics.resolved}</span>
              </div>
              <p className="text-[9px] text-emerald-600/80 font-bold mt-2 pt-1 border-t border-emerald-50 flex items-center gap-1 bg-emerald-50/10 px-1 rounded">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Cleared cases
              </p>
            </div>

            {/* 6. Citizen Satisfaction */}
            <div id="kpi-satisfaction" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all duration-200">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-rose-500">Citizen Satisfaction</span>
                <span className="text-2xl font-black text-rose-500 mt-1 block">{zoneMetrics.satisfaction}</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold mt-2 pt-1 border-t border-slate-50/50 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-rose-500" />
                Survey average rating
              </p>
            </div>

          </div>

          {/* Clickable compact subview cards for detailed reports */}
          <div id="detailed-analytics-navigation" className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Detailed Zone Analytics</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: View Monthly Trends */}
              <button 
                id="btn-nav-monthly-trends"
                onClick={() => setActiveSubView('MONTHLY_TRENDS')}
                className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-100 transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">📈 View Monthly Trends</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Complaints filing rates vs resolutions trend</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Card 2: View Resolution Analytics */}
              <button 
                id="btn-nav-resolution-analytics"
                onClick={() => setActiveSubView('RESOLUTION_ANALYTICS')}
                className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl group-hover:bg-indigo-100 transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">⏱ View Resolution Analytics</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Mean cleanup time & supervisor validation speed</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Card 3: View Complaint Categories */}
              <button 
                id="btn-nav-complaint-categories"
                onClick={() => setActiveSubView('COMPLAINT_CATEGORIES')}
                className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-100 transition-colors">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">🗂 View Complaint Categories</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Distribution of waste category types</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Card 4: View Workforce Performance */}
              <button 
                id="btn-nav-workforce-performance"
                onClick={() => setActiveSubView('WORKFORCE_PERFORMANCE')}
                className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">👷 View Workforce Performance</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Cleanup crew operational indexes & ratings</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Card 5: View Zone Performance Report */}
              <button 
                id="btn-nav-zone-performance"
                onClick={() => setActiveSubView('ZONE_PERFORMANCE')}
                className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl shadow-xs transition-all text-left w-full group cursor-pointer sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-100 transition-colors">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">📊 View Zone Performance Report</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Priority distributions, citizen CleanPoints, and target parameters</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
              </button>

            </div>
          </div>

          {/* Zone Specific Export Banner - ALWAYS kept on main dashboard */}
          <section id="zone-reports-export-banner" className="bg-slate-950 text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-slate-900">
            <div className="space-y-1.5 relative z-10 max-w-xl">
              <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-900/50 inline-block mb-1">
                ZONE AUDIT & STATISTICAL EXPORT
              </span>
              <h3 className="font-extrabold text-base tracking-tight">Export Sector 04 Operations Dataset</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                Export complaint logs, supervisor quality audit comments, dispatch response times, workforce performance indices, and citizen rewards data specific to Sector 04.
              </p>
            </div>

            <div className="flex gap-2.5 relative z-10 w-full md:w-auto">
              <button
                id="btn-export-pdf"
                onClick={() => handleTriggerExport('PDF')}
                disabled={exporting !== 'NONE'}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 px-5 text-xs rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {exporting === 'PDF' ? 'Compiling PDF...' : 'Export PDF Report'}
              </button>
              <button
                id="btn-export-csv"
                onClick={() => handleTriggerExport('CSV')}
                disabled={exporting !== 'NONE'}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 disabled:bg-slate-800 text-white font-bold py-3 px-5 text-xs rounded-xl transition-all border border-white/10 active:scale-95 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                {exporting === 'CSV' ? 'Compiling CSV...' : 'Export CSV Dataset'}
              </button>
            </div>

            {/* Subtle glowing vector background */}
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          </section>

        </div>
      ) : activeSubView === 'MONTHLY_TRENDS' ? (
        
        /* DEDICATED PAGE: MONTHLY TRENDS */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">TREND ANALYSIS</span>
              <h2 className="text-lg font-extrabold text-slate-900">📈 Monthly Complaint Trends</h2>
              <p className="text-xs text-slate-500 font-semibold">Monthly registered vs. resolved complaints in Sector 04 jurisdiction.</p>
            </div>
            <button
              onClick={() => setActiveSubView('MAIN')}
              className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-xs self-start sm:self-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>

          {zoneComplaints.length === 0 ? (
            <NoDataState title="No Trend Data Available" message="There are currently no active complaints registered to generate monthly charts." />
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={zoneMonthlyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                      <Area type="monotone" name="Grievances Filed" dataKey="complaints" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorComplaints)" />
                      <Area type="monotone" name="Grievances Resolved" dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Monthly Breakdown</h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-4">Month</th>
                          <th className="py-2.5 px-2 text-center">Grievances Filed</th>
                          <th className="py-2.5 px-4 text-right">Resolved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {zoneMonthlyTrend.map((row) => (
                          <tr key={row.month} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-bold text-slate-700">{row.month} 2026</td>
                            <td className="py-2.5 px-2 text-center text-red-600 font-extrabold">{row.complaints}</td>
                            <td className="py-2.5 px-4 text-right text-emerald-600 font-extrabold">{row.resolved}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Trend Commentary</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Seasonal rains in Sector 04 during May and June caused a temporary increase in water-logging and waste-pileup reports. However, cleanup crew dispatch optimizations resulted in an all-time high resolution rate in July, achieving near 90% closure of newly logged items.
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-slate-800 rounded-2xl border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                    <p className="flex items-center gap-1.5">🎯 target monthly clearance: 95%</p>
                    <p className="flex items-center gap-1.5">🚀 current average clearance: 86.4%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      ) : activeSubView === 'RESOLUTION_ANALYTICS' ? (
        
        /* DEDICATED PAGE: RESOLUTION ANALYTICS */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">SPEED ANALYSIS</span>
              <h2 className="text-lg font-extrabold text-slate-900">⏱ Resolution Analytics</h2>
              <p className="text-xs text-slate-500 font-semibold">Average cleanup and quality audit completion time trend in Sector 04.</p>
            </div>
            <button
              onClick={() => setActiveSubView('MAIN')}
              className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-xs self-start sm:self-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>

          {zoneComplaints.length === 0 ? (
            <NoDataState title="No Resolution Data" message="There are currently no resolved complaints to calculate resolution times." />
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={zoneResolutionTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAvgHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                      <Area type="monotone" name="Avg Resolution Time (Hours)" dataKey="avgHours" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAvgHours)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* KPI stat box */}
                <div className="bg-indigo-600 text-white p-5 rounded-3xl border border-indigo-700 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-100 uppercase tracking-wider block">Zone Performance Indicator</span>
                    <span className="text-3xl font-black block">{zoneMetrics.avgResolutionTime}</span>
                    <p className="text-xs text-indigo-100 leading-relaxed font-semibold">
                      This represents the average time elapsed between when a complaint is reported by a citizen in Sector 04, to when a field crew has uploaded after-clean proofs and received quality supervisor approval.
                    </p>
                  </div>
                  <p className="text-[10px] text-indigo-200 mt-4 font-bold border-t border-indigo-500/30 pt-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Target resolution SLA is 24 hours
                  </p>
                </div>

                {/* Breakdown table */}
                <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">History Log</h3>
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-4">Reporting Window</th>
                          <th className="py-2.5 px-4 text-right">Average Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {zoneResolutionTrend.map((row) => (
                          <tr key={row.month} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-bold text-slate-700">{row.month} 2026</td>
                            <td className="py-2.5 px-4 text-right text-indigo-600 font-extrabold">{row.avgHours} hrs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      ) : activeSubView === 'COMPLAINT_CATEGORIES' ? (
        
        /* DEDICATED PAGE: COMPLAINT CATEGORIES */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">CATEGORIES</span>
              <h2 className="text-lg font-extrabold text-slate-900">🗂 Complaint Categories Breakdown</h2>
              <p className="text-xs text-slate-500 font-semibold">Distribution of outstanding active and resolved complaints in Sector 04.</p>
            </div>
            <button
              onClick={() => setActiveSubView('MAIN')}
              className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-xs self-start sm:self-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>

          {zoneComplaints.length === 0 ? (
            <NoDataState title="No Categories Data" message="There are currently no complaints reported to build category summaries." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Category distribution graph bars */}
              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4 md:col-span-1 text-left">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Zone Category Percentages</h3>
                <div className="space-y-4">
                  {zoneCategoryDistribution.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          {cat.name}
                        </span>
                        <span className="text-slate-500 font-extrabold">{cat.count} cases ({cat.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category workflow performance table (specific to Sector 04) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-xs space-y-4 md:col-span-2 text-left">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Operations Status by Category</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Complaint Category</th>
                        <th className="py-2.5 px-2 text-center">Total</th>
                        <th className="py-2.5 px-2 text-center">Pending</th>
                        <th className="py-2.5 px-2 text-center">In Progress</th>
                        <th className="py-2.5 px-3 text-right">Resolved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {['Household', 'Construction', 'Plastic', 'Hazardous', 'Other'].map((cat) => {
                        const catComplaints = zoneComplaints.filter(c => {
                          if (cat === 'Other') {
                            return !['Household', 'Construction', 'Plastic', 'Hazardous'].includes(c.category);
                          }
                          return c.category === cat;
                        });
                        const total = catComplaints.length;
                        const pending = catComplaints.filter(c => (c.status === 'SUBMITTED' || c.status === 'REOPENED') && !c.afterImage).length;
                        const inProgress = catComplaints.filter(c => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;
                        const resolved = catComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'VERIFIED').length;
                        
                        return (
                          <tr key={cat} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-extrabold text-slate-800">{cat}</td>
                            <td className="py-3 px-2 text-center font-bold text-slate-600">{total}</td>
                            <td className="py-3 px-2 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded font-black ${
                                pending > 0 ? 'bg-amber-50 text-amber-600 text-[10px]' : 'text-slate-400 font-semibold'
                              }`}>
                                {pending}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded font-black ${
                                inProgress > 0 ? 'bg-indigo-50 text-indigo-600 text-[10px]' : 'text-slate-400 font-semibold'
                              }`}>
                                {inProgress}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                              {resolved}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>

      ) : activeSubView === 'WORKFORCE_PERFORMANCE' ? (
        
        /* DEDICATED PAGE: WORKFORCE PERFORMANCE */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">WORKFORCE</span>
              <h2 className="text-lg font-extrabold text-slate-900">👷 Workforce Performance Summary</h2>
              <p className="text-xs text-slate-500 font-semibold">Active sanitation crews and team performance tracking inside Sector 04.</p>
            </div>
            <button
              onClick={() => setActiveSubView('MAIN')}
              className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-xs self-start sm:self-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Delta-4 Cleanup Crew', leader: 'Sarah J.', resolved: 18, rating: '4.9★', active: true, dispatch: '12m', icon: "🚒", description: "Primary solid waste and curbside collection operations." },
              { name: 'Sector 04 Sweep Squad', leader: 'John D.', resolved: 12, rating: '4.7★', active: false, dispatch: '15m', icon: "🧹", description: "Secondary sweeping and sidewalk maintenance crew." },
              { name: 'Delta-4 Rapid Response', leader: 'Carlos M.', resolved: 15, rating: '4.8★', active: true, dispatch: '10m', icon: "⚡", description: "Urgent hazards, sewer clogs, and water pileups responder." }
            ].map((worker) => (
              <div key={worker.name} className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-sm transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{worker.icon}</span>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{worker.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">Leader: {worker.leader}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      worker.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {worker.active ? 'Active' : 'Idle'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {worker.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Resolved</span>
                    <strong className="text-slate-850 font-black text-xs block mt-0.5">{worker.resolved} cases</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Avg Rating</span>
                    <strong className="text-emerald-600 font-black text-xs block mt-0.5">{worker.rating}</strong>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Avg Dispatch</span>
                    <strong className="text-slate-850 font-black text-xs block mt-0.5">{worker.dispatch}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-xs font-semibold text-slate-500 space-y-2 max-w-xl">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">💡 Dispatch Notice Guidelines:</p>
            <p className="leading-relaxed">• Crews are auto-dispatched within 15 minutes of citizen reporting unless emergency manual rerouting is triggered.</p>
            <p className="leading-relaxed">• Crew performance ratings are computed from citizen feedbacks on resolved items (threshold: 4.5★ is optimal).</p>
          </div>
        </div>

      ) : (
        
        /* DEDICATED PAGE: ZONE PERFORMANCE REPORT */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded">PERFORMANCE REPORT</span>
              <h2 className="text-lg font-extrabold text-slate-900">📊 Sector 04 Performance Report</h2>
              <p className="text-xs text-slate-500 font-semibold">Consolidated operational parameters and audits for Sector 04.</p>
            </div>
            <button
              onClick={() => setActiveSubView('MAIN')}
              className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-xs self-start sm:self-center"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CleanPoints and Rewards Summary */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4 text-left flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">CleanPoints & Citizen Rewards</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Awarded to registered citizens upon successful verification of their reported garbage dumps or cleanup contributions in Sector 04.
                </p>
              </div>
              
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">CleanPoints Awarded</span>
                  <strong className="text-slate-800 font-black text-lg block mt-0.5">{zoneMetrics.cleanPoints} Pts</strong>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Rewards Level</span>
                  <span className="text-emerald-600 font-black text-lg block mt-0.5">Level {Math.ceil(zoneMetrics.cleanPoints / 500)}</span>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4 text-left">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Priority Breakdown</h3>
              </div>
              
              {zoneComplaints.length === 0 ? (
                <NoDataState title="No Priority Breakdown Available" message="No registered cases in Sector 04 to calculate priority distributions." />
              ) : (
                <div className="space-y-3.5">
                  <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                    {zonePriorityDistribution.map((p) => {
                      const colorMap: Record<string, string> = {
                        URGENT: 'bg-rose-500',
                        HIGH: 'bg-orange-500',
                        MEDIUM: 'bg-amber-400',
                        LOW: 'bg-emerald-500'
                      };
                      return (
                        <div 
                          key={p.name} 
                          className={colorMap[p.name] || 'bg-slate-400'} 
                          style={{ width: `${p.percentage}%` }}
                          title={`${p.name}: ${p.count} cases`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-1.5 text-xs text-slate-600 font-bold">
                    {zonePriorityDistribution.map((p) => (
                      <div key={p.name} className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            p.name === 'URGENT' ? 'bg-rose-500' : p.name === 'HIGH' ? 'bg-orange-500' : p.name === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-500'
                          }`} />
                          {p.name.toLowerCase() === 'urgent' ? '🔴 Urgent' : p.name.toLowerCase() === 'high' ? '🟠 High' : p.name.toLowerCase() === 'medium' ? '🟡 Medium' : '🟢 Low'}
                        </span>
                        <span className="text-slate-500 font-extrabold">{p.count} cases ({p.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Key Audit Checklist */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Operational Checklist</h3>
              </div>
              <div className="space-y-3.5">
                {[
                  { text: 'Daily Cleanup Target: 92% Achieved', done: true },
                  { text: 'Average Time to Dispatch: 14 Mins', done: true },
                  { text: 'Citizen Feedback Positive: 96%', done: true },
                  { text: 'Reopen Rate: 2.1% (Optimal)', done: true }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SupervisorReports;