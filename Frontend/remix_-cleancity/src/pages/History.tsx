import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShieldAlert, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Complaint } from '../types';
import { TranslatedText } from '../components/TranslatedText';
import { useEffect } from "react";
import { getMyComplaints } from "../services/api";

export const History: React.FC = () => {
  const { user, t, currentLanguage } = useApp();
  const [complaints, setComplaints] = useState<any[]>([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  useEffect(() => {
  const loadComplaints = async () => {
    try {
      const data = await getMyComplaints();
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error(err);
    }
  };

  loadComplaints();
}, []);

  // Filter for the logged-in citizen
  const citizenComplaints = complaints;

const getDaysPending = (priority: string, status: string) => {
  if (status === "Resolved") {
    return "Completed";
  }

  if (priority === "High") {
    return "24 Hours";
  }

  if (priority === "Medium") {
    return "3 Days";
  }

  return "7 Days";
};
  
  const filtered = citizenComplaints.filter((comp) => {
  const text = (
    (comp.description || "") +
    " " +
    (comp.category || "") +
    " " +
    (comp.complaint_code || "")
  ).toLowerCase();

  const matchesSearch = text.includes(searchTerm.toLowerCase());
  const matchesStatus =
    statusFilter === "ALL" || comp.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            {currentLanguage === 'hindi' ? 'मेरी शिकायतें' : 'My Complaint History'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {currentLanguage === 'hindi' ? 'आपकी दर्ज की गई शिकायतों की वर्तमान स्थिति और सूची' : 'Tracking and history of your reported concerns'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={currentLanguage === 'hindi' ? 'आईडी या शीर्षक खोजें...' : 'Search by ID or summary...'}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 shadow-sm"
          />
        </div>
        <div className="relative flex-shrink-0">
          <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
         <select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
  className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 shadow-sm appearance-none cursor-pointer"
>
  <option value="ALL">
    {currentLanguage === "hindi" ? "सभी स्थिति" : "All Statuses"}
  </option>

  <option value="Submitted">
    {currentLanguage === "hindi" ? "प्रस्तुत" : "Submitted"}
  </option>

  <option value="Assigned">
    {currentLanguage === "hindi" ? "आवंटित" : "Assigned"}
  </option>

  <option value="Verification">
    {currentLanguage === "hindi" ? "सत्यापित" : "Verification"}
  </option>

  <option value="Resolved">
    {currentLanguage === "hindi" ? "सुलझाई गई" : "Resolved"}
  </option>
</select>
        </div>
      </div>

      {/* History Items list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
          <Clock className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
          <div>
            <h4 className="text-sm font-black text-slate-500">
              {currentLanguage === 'hindi' ? 'कोई शिकायत नहीं मिली' : 'No records found'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
              {citizenComplaints.length === 0
                ? (currentLanguage === 'hindi' ? "आपने कोई शिकायत दर्ज नहीं की है। शिकायत दर्ज करने के लिए 'कचरा रिपोर्ट' बटन का उपयोग करें।" : "You haven't submitted any complaints. Use the 'Report Garbage' button to file one.")
                : (currentLanguage === 'hindi' ? "आपके खोज या फ़िल्टर से कोई शिकायत मेल नहीं खाती।" : "No complaints match your search or status filter.")}
            </p>
          </div>
          {citizenComplaints.length === 0 && (
            <button
              onClick={() => navigate('/submit')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all shadow cursor-pointer"
            >
              {currentLanguage === 'hindi' ? 'अभी शिकायत दर्ज करें' : 'Report Garbage Now'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((comp) => {
            console.log("Complaint Status:", comp.status);
          console.log("IMAGE:", comp.image_before);

          return (
            <div
              key={comp.complaint_id}
              onClick={() => navigate(`/complaint/${comp.complaint_id}`)}
              className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden group"
            >
              <div className="p-4 flex gap-4 items-center">
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 relative">
                  <img
                    src={`http://127.0.0.1:5000/${(comp.image_before || "").replace(/\\/g, "/")}`}
                    alt={comp.description} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-1 left-1 bg-black/40 backdrop-blur-md text-[8px] font-black text-white px-1.5 py-0.5 rounded-md">
                    {comp.category}
                  </span>
                </div>

                {/* Text Info */}
                <div className="flex-grow min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-slate-500">{comp.complaint_code}</span>
                    <span>•</span>
                    <span>{comp.submitted_at.split(',')[0]}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-xs truncate leading-snug">
                    <TranslatedText text={comp.description} />
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate">
                    <TranslatedText text={comp.category} />
                  </p>
                </div>

                {/* Action Chevron */}
                <div className="text-slate-300 group-hover:text-emerald-600 transition-colors flex-shrink-0">
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Status Grid Pillars Section */}
              <div className="grid grid-cols-3 border-t border-slate-50 bg-slate-50/50 text-center py-2.5 px-2 gap-1">
                {/* Column 1: Status */}
                <div className="flex flex-col items-center justify-center border-r border-slate-100">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                    {currentLanguage === 'hindi' ? 'स्थिति' : 'Status'}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                   comp.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      :comp.status === 'In Progress'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        :comp.status === 'Assigned'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          :comp.status === 'Verification'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                   {comp.status}
                  </span>
                </div>

                {/* Column 2: Priority */}
                <div className="flex flex-col items-center justify-center border-r border-slate-100">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                    {currentLanguage === 'hindi' ? 'प्राथमिकता' : 'Priority'}
                  </span>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                   comp.status === 'Resolved'
                      ? 'bg-slate-50 text-slate-400 border border-slate-100'
                      : comp.priority === 'HIGH' || comp.priority === 'URGENT'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : comp.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {comp.status === 'RESOLVED' ? '-' : comp.priority}
                  </span>
                </div>

                {/* Column 3: Days Pending */}
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                    {currentLanguage === 'hindi' ? 'लंबित दिन' : 'Days Pending'}
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                  {getDaysPending(comp.priority, comp.status)}
                  </span>
                </div>
              </div>
            </div>
            );
})}
        </div>
      )}
    </div>
  );
};
