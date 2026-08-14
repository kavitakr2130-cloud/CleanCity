import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  FileText, 
  Clock, 
  User, 
  ThumbsUp, 
  MapPin, 
  History, 
  ClipboardList,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Complaint } from '../types';
import { TranslatedText } from '../components/TranslatedText';
import { getPendingFeedback } from "../services/api";

export const Feedback: React.FC = () => {
  const { 
    complaints, 
    feedbacks = [], 
    submitDetailedFeedback, 
    currentLanguage, 
    user 
  } = useApp();
  const navigate = useNavigate();
  
  const [activeView, setActiveView] = useState<'pending' | 'form' | 'success' | 'history'>('pending');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  
  // Form rating states
  const [resolutionQuality, setResolutionQuality] = useState<number>(0);
  const [staffBehaviour, setStaffBehaviour] = useState<number>(0);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [overallExperience, setOverallExperience] = useState<number>(0);
  const [appUsabilityRating, setAppUsabilityRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
const [dbComplaints, setDbComplaints] = useState<any[]>([]);

const loadPendingFeedback = async () => {
  const data = await getPendingFeedback();

  if (data.complaints) {
    setDbComplaints(data.complaints);
    console.log("Pending Feedback:", data.complaints);
  }
};

useEffect(() => {
  loadPendingFeedback();
}, []);

const isHindi = currentLanguage === 'hindi';

 const pendingFeedbackComplaints = dbComplaints;

  const selectedComplaint = dbComplaints.find(
  (c: any) => c.complaint_id == selectedComplaintId
);

  const handleOpenForm = (complaintId: string) => {
    setSelectedComplaintId(complaintId);
    setResolutionQuality(0);
    setStaffBehaviour(0);
    setResponseTime(0);
    setOverallExperience(0);
    setAppUsabilityRating(0);
    setComment('');
    setActiveView('form');
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submit button clicked");
    if (!selectedComplaintId) return;

   await submitDetailedFeedback(
  selectedComplaintId,
  resolutionQuality,
  staffBehaviour,
  responseTime,
  overallExperience,
  comment.trim() || (isHindi ? 'बढ़िया निवारण गुणवत्ता' : 'Great resolution quality!'),
  appUsabilityRating > 0 ? appUsabilityRating : undefined
);

await loadPendingFeedback();
setActiveView("pending");
setActiveView('success');
  };

  // Helper component to render stars
  const StarRatingInput = ({
    label,
    subLabel,
    value,
    onChange,
    required = true
  }: {
    label: string;
    subLabel?: string;
    value: number;
    onChange: (val: number) => void;
    required?: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-bold text-slate-700 tracking-wide block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {subLabel && <span className="text-[10px] text-slate-400 font-medium">{subLabel}</span>}
      </div>
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
        {Array.from({ length: 5 }).map((_, idx) => {
          const starVal = idx + 1;
          const isFilled = starVal <= value;
          return (
            <button
              type="button"
              key={idx}
              onClick={() => onChange(starVal)}
              className="p-1 hover:scale-125 transition-transform duration-150 cursor-pointer text-slate-200"
              title={`${starVal} Star`}
            >
              <Star 
                className={`w-7 h-7 ${
                  isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                }`} 
              />
            </button>
          );
        })}
        <span className="text-xs font-black text-slate-500 ml-3">
          {value > 0 ? `${value}/5` : (isHindi ? 'चुनें' : 'Select')}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-fade-in">
      
      {/* HEADER SECTION */}
      {activeView !== 'success' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-600" />
              {isHindi ? 'नागरिक सेवा संतुष्टि' : 'Citizen Service Feedback'}
            </h2>
            <p className="text-xs text-slate-400 font-bold mt-1">
              {isHindi 
                ? 'गुणवत्ता मूल्यांकन, कर्मचारी आचरण और निवारण समय का आकलन करें'
                : 'Assess resolution quality, worker behavior, and response duration for resolved complaints.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {activeView !== 'history' ? (
              <button
                onClick={() => setActiveView('history')}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <History className="w-4 h-4" />
                {isHindi ? 'फीडबैक इतिहास देखें' : 'View Feedback History'}
              </button>
            ) : (
              <button
                onClick={() => setActiveView('pending')}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                {isHindi ? 'लंबित फीडबैक' : 'Pending Feedbacks'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 1: PENDING FEEDBACK */}
      {activeView === 'pending' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 flex items-start gap-3.5">
            <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                {isHindi ? 'संतुष्टि-आधारित शासन' : 'Performance-Linked Grievance Resolution'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-600 leading-relaxed mt-1">
                {isHindi
                  ? 'आपकी प्रतिक्रिया सीधे टीम मूल्यांकन और वार्ड रैंकिंग को प्रभावित करती है। प्रतिक्रिया केवल शिकायत हल होने के बाद ही उपलब्ध होती है।'
                  : 'To ensure maximum transparency, ratings directly impact field-worker rankings and supervisor scores. Feedback is unlocked only after resolution.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              {isHindi ? `लंबित रेटिंग (${pendingFeedbackComplaints.length})` : `Resolved Awaiting Feedback (${pendingFeedbackComplaints.length})`}
            </h3>

            {pendingFeedbackComplaints.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-800">
                    {isHindi ? 'कोई लंबित प्रतिक्रिया नहीं' : 'No Resolved Grievances Pending Rating'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                    {isHindi
                      ? 'वर्तमान में आपके पास कोई हल की गई शिकायत नहीं है जो प्रतिक्रिया की प्रतीक्षा कर रही हो। शिकायत हल होने पर यहाँ दिखाई देगी।'
                      : 'All resolved complaints submitted by you have been rated. Once a complaint is marked as "Resolved" by our crew, it will appear here.'}
                  </p>
                </div>
               <button
                onClick={() => navigate('/history')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                {isHindi ? 'मेरी शिकायतों का इतिहास' : 'My Complaint History'}
              </button>
                </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingFeedbackComplaints.map((comp) => (
                  <div 
                   key={comp.complaint_id}
                    className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm p-5 space-y-4 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 tracking-wide">
                           {comp.complaint_code}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                            {comp.category}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-500 leading-normal">
                         {comp.description}
                        </h4>
                      </div>
                      
                      <button
                       onClick={() => handleOpenForm(comp.complaint_id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        {isHindi ? 'समाधान को रेट करें' : 'Rate Resolution'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-slate-600 truncate max-w-[200px]">{comp.address}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        <span>{isHindi ? 'हल किया गया:' : 'Resolved:'} <strong className="text-slate-600 font-bold">{comp.submitted_at}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: FEEDBACK FORM (PRE-LINKED TO A COMPLAINT) */}
      {activeView === 'form' && selectedComplaint && (
        <div className="space-y-6">
          <button
            onClick={() => setActiveView('pending')}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-extrabold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {isHindi ? 'लंबित सूचियों पर वापस जाएं' : 'Back to Pending Feedbacks'}
          </button>

          <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-400">
                  {isHindi ? 'प्रतिक्रिया लिंक की गई है:' : 'Pre-linked Complaint:'}
                </span>
                <span className="text-xs font-black bg-white/10 px-2 py-0.5 rounded text-emerald-400">
                  {selectedComplaint.id}
                </span>
              </div>
              <h3 className="text-sm font-black text-white">{selectedComplaint.title}</h3>
              <p className="text-[11px] text-slate-400 font-semibold">{selectedComplaint.address}</p>
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-emerald-400 font-black text-[10px] uppercase tracking-wider">
              {isHindi ? 'समाधान सत्यापित' : 'Resolution Verified'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-50 pb-3">
              <h3 className="text-sm font-black text-slate-800">
                {isHindi ? '१. समाधान सेवा मूल्यांकन' : '1. Resolution Service Performance'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {isHindi ? 'कृपया प्रत्येक श्रेणी में काम की गुणवत्ता का मूल्यांकन करें' : 'Please provide star ratings based on the physical service completed on-site.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <StarRatingInput 
                label={isHindi ? 'निवारण गुणवत्ता' : 'Resolution Quality'} 
                subLabel={isHindi ? 'क्या कचरा पूरी तरह से साफ किया गया?' : 'Was site cleared completely?'}
                value={resolutionQuality} 
                onChange={setResolutionQuality} 
              />
              <StarRatingInput 
                label={isHindi ? 'कर्मचारी/कार्यकर्ता व्यवहार' : 'Staff/Worker Conduct'} 
                subLabel={isHindi ? 'क्या टीम विनम्र और पेशेवर थी?' : 'Was the field crew professional?'}
                value={staffBehaviour} 
                onChange={setStaffBehaviour} 
              />
              <StarRatingInput 
                label={isHindi ? 'प्रतिक्रिया समय' : 'Response Time Speed'} 
                subLabel={isHindi ? 'शिकायत समाधान की गति' : 'Speed of dispatch and clearance'}
                value={responseTime} 
                onChange={setResponseTime} 
              />
              <StarRatingInput 
                label={isHindi ? 'कुल समाधान अनुभव' : 'Overall Experience'} 
                subLabel={isHindi ? 'समाधान प्रक्रिया से समग्र संतुष्टि' : 'Total satisfaction with grievance resolution'}
                value={overallExperience} 
                onChange={setOverallExperience} 
              />
            </div>

            {/* App Rating - Optional separate category */}
            <div className="border-t border-slate-50 pt-5 space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  {isHindi ? '२. एप्लिकेशन अनुभव (वैकल्पिक)' : '2. Application Experience (Optional)'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {isHindi ? 'क्लीनसिटी मोबाइल ऐप के इंटरफ़ेस और उपयोगिता की रेटिंग' : 'Provide feedback on CleanCity platform design and interface usability.'}
                </p>
              </div>

              <StarRatingInput 
                label={isHindi ? 'ऐप इंटरफ़ेस और उपयोगिता' : 'App Interface & Usability'} 
                value={appUsabilityRating} 
                onChange={setAppUsabilityRating} 
                required={false}
              />
            </div>

            {/* Comments & Suggestions */}
            <div className="space-y-2 border-t border-slate-50 pt-5">
              <label className="text-xs font-bold text-slate-700 tracking-wide block">
                {isHindi ? '३. टिप्पणियाँ और सुझाव' : '3. Citizen Comment'} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isHindi 
                    ? 'कृपया निवारण गुणवत्ता या सुझावों के बारे में विस्तार से बताएं...' 
                    : 'Detail your cleaning satisfaction, report workforce behavior, or suggest civic enhancements...'
                }
                rows={4}
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 shadow-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveView('pending')}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-3.5 rounded-xl border border-slate-100 transition-all active:scale-95 cursor-pointer"
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
              
              <button
                type="submit"
                disabled={resolutionQuality === 0 || staffBehaviour === 0 || responseTime === 0 || overallExperience === 0 || !comment.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isHindi ? 'प्रतिक्रिया सबमिट करें' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW 3: SUCCESS CONFIRMATION PAGE */}
      {activeView === 'success' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6 max-w-md mx-auto my-8 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">
              {isHindi ? 'प्रतिक्रिया के लिए धन्यवाद!' : 'Feedback Successfully Saved'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto font-medium">
              {isHindi 
                ? 'आपका मूल्यांकन दर्ज कर लिया गया है। यह नागरिक सेवा गुणवत्ता में सुधार करने में हमारे प्रशासन की मदद करेगा।'
                : 'Your ratings have been successfully recorded. They are saved in your personal feedback history and queued for backend synchronization.'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>{isHindi ? 'शिकायत आईडी:' : 'Complaint ID:'}</span>
              <span className="font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-100">
                {selectedComplaintId}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>{isHindi ? 'कुल रेटिंग:' : 'Overall Rating Given:'}</span>
              <span className="flex text-amber-500 gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < overallExperience ? 'fill-current' : 'text-slate-200'}`} />
                ))}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span>{isHindi ? 'प्रतिक्रिया स्थिति:' : 'Sync Status:'}</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                {isHindi ? 'दर्ज' : 'Logged'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => setActiveView('history')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <History className="w-4 h-4" />
              {isHindi ? 'प्रतिक्रिया इतिहास देखें' : 'View Feedback History'}
            </button>
            <button
              onClick={() => setActiveView('pending')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              {isHindi ? 'लंबित सूची पर वापस' : 'Back to Pending Grievances'}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: DETEDICATED FEEDBACK HISTORY PAGE */}
      {activeView === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveView('pending')}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-extrabold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {isHindi ? 'लंबित सूचियों पर वापस जाएं' : 'Back to Pending Feedbacks'}
            </button>
            
            <div className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {isHindi ? `कुल प्रविष्टियाँ: ${feedbacks.length}` : `History Records: ${feedbacks.length}`}
            </div>
          </div>

          {feedbacks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                <History className="w-8 h-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">
                  {isHindi ? 'कोई फीडबैक इतिहास नहीं मिला' : 'No Feedback Records Found'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                  {isHindi
                    ? 'आपने अभी तक कोई हल की गई शिकायत रेट नहीं की है। हल की गई शिकायतों को रेट करने के बाद आपका फीडबैक यहाँ सहेजा जाएगा।'
                    : 'You have not submitted detailed feedback for any resolved grievances yet. Once submitted, your history records will accumulate here.'}
                </p>
              </div>
              <button
                onClick={() => setActiveView('pending')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {isHindi ? 'लंबित शिकायतों को रेट करें' : 'Rate Pending Grievances'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div 
                  key={fb.id} 
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 hover:border-slate-200 transition-all"
                >
                  {/* Row 1: ID, Category & Sync Status */}
                  <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-50 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 tracking-wide">
                          {fb.complaintId}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {fb.complaintCategory}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {isHindi ? 'जमा करने की तिथि:' : 'Submitted on:'} {fb.submissionDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {isHindi ? 'स्थिति:' : 'Status:'}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {fb.feedbackStatus}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Ratings Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-50 text-[10px] font-black text-slate-600">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">{isHindi ? 'निवारण गुणवत्ता' : 'Resolution Quality'}</span>
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < fb.resolutionQuality ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">{isHindi ? 'कर्मचारी व्यवहार' : 'Worker conduct'}</span>
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < fb.staffBehaviour ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">{isHindi ? 'प्रतिक्रिया समय' : 'Response Time'}</span>
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < fb.responseTime ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">{isHindi ? 'ऐप इंटरफ़ेस' : 'App Usability'}</span>
                      {fb.appUsabilityRating ? (
                        <div className="flex text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < (fb.appUsabilityRating || 0) ? 'fill-current' : 'text-slate-200'}`} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold">{isHindi ? 'छोड़ दिया' : 'Skipped'}</span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Overall & Comment */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span className="uppercase tracking-wider text-[10px] text-slate-400 font-black">{isHindi ? 'समग्र रेटिंग:' : 'Overall Service rating:'}</span>
                      <div className="flex text-amber-500 gap-0.5 bg-white px-2 py-0.5 rounded border border-slate-100">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < fb.overallExperience ? 'fill-current' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 text-xs font-medium text-slate-600 leading-normal pl-0.5 pt-1">
                      <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <p className="italic font-bold text-slate-700">
                        "<TranslatedText text={fb.citizenComment} />"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

     {/* FOOTER ACCOUNTABILITY */}
     {activeView !== 'form' && activeView !== 'success' && (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 text-white flex items-start gap-4 shadow-sm">
    <div className="bg-white/10 p-2.5 rounded-2xl flex-shrink-0 mt-0.5">
      <ShieldCheck className="w-5 h-5 text-emerald-400" />
    </div>

    <div>
      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
        {isHindi ? 'आपकी प्रतिक्रिया महत्वपूर्ण है' : 'Your Feedback Matters'}
      </h4>

      <p className="text-[11px] leading-relaxed opacity-90 mt-1 text-slate-200 font-semibold">
        {isHindi
          ? 'आपकी प्रतिक्रिया हमें स्वच्छता सेवाओं की गुणवत्ता सुधारने, कर्मचारियों के प्रदर्शन का मूल्यांकन करने और भविष्य में बेहतर सेवा प्रदान करने में सहायता करती है।'
          : 'Your feedback helps us improve the quality of CleanCity services, evaluate field staff performance, and deliver faster and better grievance resolution in the future.'}
      </p>
    </div>
  </div>
)}
    </div>
  );
};
