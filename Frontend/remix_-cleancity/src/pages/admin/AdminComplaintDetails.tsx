import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Clock, Users, ShieldAlert, Phone, Send, Image, HelpCircle, CheckCircle2, FileCheck, Star, Calendar, Activity, FileText, MessageSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ComplaintPriority, VehicleStatus } from '../../types';
import { TranslatedText } from '../../components/TranslatedText';

export const AdminComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    complaints, 
    teams, 
    feedbacks, 
    assignWorkforce, 
    updateComplaintStatus, 
    updateComplaintPriority, 
    addComplaintComment,
    vehicles,
    assignComplaintResources,
    updateVehicleStatus,
    authoritySubRole
  } = useApp();

  // Retrieve selected complaint
  const comp = complaints.find(c => c.id === id);

  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || 'team_1');
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>(comp?.priority || 'HIGH');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResolveOverlay, setShowResolveOverlay] = useState(false);

  // Helper to determine complaint Zone/Sector based on its address or ID
  const getZoneOfComplaint = (comp: any): string => {
    if (!comp) return 'Sector 19';
    const addressLower = (comp.address || '').toLowerCase();
    if (addressLower.includes('sector 4') || addressLower.includes('sector 04') || comp.address.includes('4') || addressLower.includes('central park')) {
      return 'Sector 04';
    }
    if (comp.id === 'CC-9210' || addressLower.includes('42nd') || addressLower.includes('market')) {
      return 'Sector 12';
    }
    if (comp.id === 'CC-9195' || addressLower.includes('town') || addressLower.includes('square')) {
      return 'Sector 19';
    }
    const codeDigit = parseInt(comp.id.replace('CC-', '')) || 0;
    if (codeDigit % 3 === 0) return 'Sector 12';
    if (codeDigit % 3 === 1) return 'Sector 04';
    return 'Sector 19';
  };

  // Helper to get Assigned Worker's Name based on their crew assignment
  const getAssignedWorker = (comp: any): string => {
    if (!comp || !comp.assignedTeamName) return 'Not Assigned';
    if (comp.assignedTeamName.includes('Delta-4')) return 'Amit Sharma';
    if (comp.assignedTeamName.includes('Alpha-1')) return 'John Davis';
    if (comp.assignedTeamName.includes('Omega-3')) return 'Carlos Mendez';
    return 'Amit Sharma';
  };

  // Helper to get Assigned Supervisor Name based on Sector
  const getAssignedBy = (comp: any): string => {
    if (!comp || !comp.assignedTeamName) return '—';
    const zone = getZoneOfComplaint(comp);
    if (zone === 'Sector 04') return 'Supervisor Rajesh';
    if (zone === 'Sector 12') return 'Supervisor Kapoor';
    if (zone === 'Sector 19') return 'Supervisor Nair';
    return 'Admin Dispatcher';
  };

  // Helper to get Assigned Date & Time
  const getAssignedTime = (comp: any): string => {
    if (!comp || !comp.assignedTeamName) return '—';
    return comp.assignTime || 'Oct 25, 2023, 08:45 AM';
  };

  // Helper to format assigned date for compact view
  const formatAssignmentDate = (dateTimeStr: string): string => {
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

  if (!comp) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-slate-500 font-medium">Grievance record not found.</p>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-colors"
        >
          Return to Console
        </button>
      </div>
    );
  }

  // Handle Workforce crew allocation dispatch
  const handleDispatchCrew = async () => {
    setIsUpdating(true);
    // Simulate API delay
    setTimeout(() => {
      const selectedTeam = teams.find(t => t.id === selectedTeamId);
      assignComplaintResources(comp.id, {
        teamId: selectedTeamId,
        teamName: selectedTeam?.name,
        supervisorId: 'EMP-SUPER-02', // Rajesh
        supervisorName: 'Supervisor Rajesh',
        vehicleId: selectedVehicleId || undefined
      });
      updateComplaintPriority(comp.id, selectedPriority);
      setIsUpdating(false);
    }, 800);
  };

  // Handle Mock Clearance and After Image upload
  const handleClearSpotSimulated = () => {
    setIsUpdating(true);
    const mockAfterImage = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800'; // shiny cleared road/sidewalk

    setTimeout(() => {
      updateComplaintStatus(
        comp.id,
        'RESOLVED',
        mockAfterImage
      );
      setIsUpdating(false);
      setShowResolveOverlay(false);
    }, 1000);
  };

  const handlePostAdminComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComplaintComment(comp.id, commentText, true);
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* Back Navigator */}
      <button
        onClick={() => navigate('/admin/complaints')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to list
      </button>

      {/* Header detail */}
      <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-50 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                comp.status === 'RESOLVED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : comp.status === 'ASSIGNED'
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {comp.status}
              </span>
              <span className="text-[10px] font-bold text-slate-400">Filed: {comp.submitTime}</span>
            </div>
            <h2 className="text-base font-black text-slate-900">Grievance: {comp.id}</h2>
            <p className="text-xs text-slate-500 font-medium">
              <TranslatedText text={comp.title} />
            </p>
          </div>
        </div>

        {/* Reporter contact card details */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Filing Citizen</span>
          <p className="text-xs font-extrabold text-slate-800">{comp.citizenName}</p>
          <p className="text-[10px] text-slate-500 font-medium">Citizen ID: {comp.citizenId} • Location: <TranslatedText text={comp.address} /></p>
        </div>
      </section>

      {/* Before / After Photo Comparison */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative">
          <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
            BEFORE (Reported Scene)
          </div>
          <div className="aspect-video w-full bg-slate-100">
            <img src={comp.beforeImage} alt="Before" className="w-full h-full object-cover" />
          </div>
        </div>

        {comp.afterImage ? (
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative">
            <div className="absolute top-3 left-3 z-10 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
              AFTER (Cleared spot)
            </div>
            <div className="aspect-video w-full bg-slate-100">
              <img src={comp.afterImage} alt="After" className="w-full h-full object-cover" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-center shadow-sm relative">
            <div className="absolute top-3 left-3 bg-slate-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
              AFTER (Resolution)
            </div>
            <Image className="w-8 h-8 text-slate-300 mb-2" />
            <h4 className="text-xs font-black text-slate-400">Resolution Pending</h4>
            <button
              onClick={() => setShowResolveOverlay(true)}
              className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow transition-colors active:scale-95"
            >
              Verify & Complete Clearance
            </button>
          </div>
        )}
      </section>

      {/* Verification Pending Action Board */}
      {comp.afterImage && comp.status !== 'RESOLVED' && (
        <section className="bg-purple-50 p-5 rounded-2xl border border-purple-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-purple-600 animate-pulse" />
            <h3 className="text-sm font-extrabold text-purple-900">Verification Pending</h3>
          </div>
          <p className="text-xs text-purple-700 font-medium">
            The field cleaning crew has uploaded proof of completion. Please review the "After" image above and verify if the debris has been fully cleared to the required standard.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResolveOverlay(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-5 text-xs rounded-xl shadow transition-colors active:scale-95"
            >
              Verify & Approve Proof
            </button>
          </div>
        </section>
      )}

      {/* 2-Column Action & Log Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Dispatch/Control Board, Feedback & Comments */}
        <div className="space-y-6">
          {authoritySubRole === 'Supervisor' ? (
            <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <span className="text-base">🚛</span>
                <h3 className="text-sm font-extrabold text-slate-800 leading-none">Assigned Vehicle</h3>
              </div>

              {comp.assignedVehicle ? (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Vehicle</span>
                      <p className="text-xs font-black text-slate-800">{comp.assignedVehicle.number}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{comp.assignedVehicle.type}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        comp.assignedVehicle.status === 'Completed' || comp.assignedVehicle.status === 'Work Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : comp.assignedVehicle.status === 'Cleaning' || comp.assignedVehicle.status === 'Cleaning in Progress'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : comp.assignedVehicle.status === 'On Route'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {comp.assignedVehicle.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned By</span>
                      <p className="text-xs font-extrabold text-slate-700">Admin</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Time</span>
                      <p className="text-xs font-bold text-slate-700">{comp.vehicleAssignedTime || '15 Jul 2026 • 10:30 AM'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vehicle Status</span>
                  <p className="text-xs font-black text-amber-600 uppercase">Awaiting Admin Assignment</p>
                </div>
              )}

              {/* Progress to In Progress state if ASSIGNED */}
              {comp.status === 'ASSIGNED' && (
                <button
                  onClick={() => updateComplaintStatus(comp.id, 'IN_PROGRESS')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs rounded-xl shadow-lg shadow-blue-600/10 transition-all cursor-pointer"
                >
                  Change Status to In Progress
                </button>
              )}

              {comp.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => setShowResolveOverlay(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs rounded-xl shadow-lg shadow-emerald-600/10 transition-colors cursor-pointer"
                >
                  Mark Clearance Achieved
                </button>
              )}
            </section>
          ) : (
            <>
              {/* Workforce Allocation Control Desk */}
              {comp.status === 'SUBMITTED' && (
                <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-800 leading-none">Workforce Dispatch & Routing</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Choose Crew */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">
                        Select Sanitation Crew
                      </label>
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 appearance-none"
                      >
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (Lead: {t.leader}) - {t.status === 'BUSY' ? 'Busy' : 'Available'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Vehicle */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">
                        Assign Municipal Vehicle
                      </label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none text-slate-800 appearance-none"
                      >
                        <option value="">Awaiting Assignment (No Vehicle)</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.number} - {v.type} ({v.status}) • Driver: {v.driverName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Set Priority */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block ml-1">
                        Override Caseload Priority
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['LOW', 'MEDIUM', 'HIGH'] as ComplaintPriority[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setSelectedPriority(p)}
                            className={`py-2 px-3 rounded-xl border text-[10px] font-black tracking-wider uppercase transition-all ${
                              selectedPriority === p
                                ? p === 'HIGH'
                                  ? 'bg-red-50 text-red-700 border-red-500'
                                  : p === 'MEDIUM'
                                    ? 'bg-amber-50 text-amber-700 border-amber-500'
                                    : 'bg-slate-50 text-slate-700 border-slate-500'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleDispatchCrew}
                      disabled={isUpdating}
                      className="w-full bg-slate-800 hover:bg-slate-950 text-white font-bold py-3.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isUpdating ? 'Allocating Resources...' : 'Approve & Dispatch Sanitation Crew'}
                    </button>
                  </div>
                </section>
              )}

              {/* Dispatched Crew & Assigned Vehicle Control Board */}
              {(comp.status === 'ASSIGNED' || comp.status === 'IN_PROGRESS') && (
                <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-800 leading-none">Dispatched Sanitation Unit</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-slate-800">{comp.assignedTeamName || 'Green Squad Delta-4'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Crew ID: {comp.assignedTeamId || 'TEAM_DELTA_4'} • Active</p>
                    </div>
                    <a href="tel:180055531" className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </a>
                  </div>

                  {/* Vehicle Management Block for Admin */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>🚛</span> Assigned Municipal Vehicle
                    </h4>

                    {comp.assignedVehicle ? (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded font-mono mr-2">
                              {comp.assignedVehicle.number}
                            </span>
                            <span className="text-xs font-extrabold text-slate-700">
                              {comp.assignedVehicle.type}
                            </span>
                            <p className="text-[10px] text-slate-500 font-bold mt-1">Driver: {comp.assignedVehicle.driverName || 'N/A'}</p>
                          </div>
                          <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full border uppercase ${
                            comp.assignedVehicle.status === 'Completed' || comp.assignedVehicle.status === 'Work Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : comp.assignedVehicle.status === 'Cleaning' || comp.assignedVehicle.status === 'Cleaning in Progress'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : comp.assignedVehicle.status === 'On Route'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {comp.assignedVehicle.status}
                          </span>
                        </div>

                        {/* Change Vehicle Status buttons */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Update Vehicle Status:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {(['Assigned', 'On Route', 'Cleaning', 'Completed', 'Maintenance'] as VehicleStatus[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => updateVehicleStatus(comp.assignedVehicle!.id, st)}
                                className={`px-2.5 py-1 rounded text-[9px] font-black tracking-wider uppercase border transition-all ${
                                  comp.assignedVehicle?.status === st
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col gap-2">
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase">No Vehicle Assigned Yet</p>
                        <div className="flex gap-2">
                          <select
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                          >
                            <option value="">Choose Vehicle...</option>
                            {vehicles.filter(v => v.status === 'Available').map(v => (
                              <option key={v.id} value={v.id}>{v.number} - {v.type}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              if (selectedVehicleId) {
                                assignComplaintResources(comp.id, { vehicleId: selectedVehicleId });
                              }
                            }}
                            className="bg-slate-800 hover:bg-slate-950 text-white font-bold text-[10px] px-3.5 py-2 rounded-lg"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress to In Progress state if ASSIGNED */}
                  {comp.status === 'ASSIGNED' && (
                    <button
                      onClick={() => updateComplaintStatus(comp.id, 'IN_PROGRESS')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs rounded-xl shadow-lg shadow-blue-600/10 transition-all cursor-pointer"
                    >
                      Change Status to In Progress
                    </button>
                  )}

                  <button
                    onClick={() => setShowResolveOverlay(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-xs rounded-xl shadow-lg shadow-emerald-600/10 transition-colors cursor-pointer"
                  >
                    Mark Clearance Achieved
                  </button>
                </section>
              )}
            </>
          )}

          {/* Citizen Feedback Rating */}
          {(comp.status === 'RESOLVED' || comp.status === 'VERIFIED') && (
            <section className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">Citizen Satisfaction & Feedback</h3>
              </div>
              <div className="p-4 bg-emerald-50/20 rounded-2xl border border-emerald-100/50 space-y-2.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-[10px] text-slate-500 font-extrabold ml-1">5.0 / 5.0 Rating</span>
                </div>
                <p className="text-xs text-slate-600 italic font-medium leading-relaxed">
                  "The crew from CleanCity resolved our ticket within the day. Unbelievable responsiveness, garbage heap fully cleared and disinfected."
                </p>
                <div className="text-[9px] text-slate-400 font-bold flex items-center gap-2">
                  <span>Submitted by {comp.citizenName}</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-black">Verified Citizen Account</span>
                </div>
              </div>
            </section>
          )}

          {/* Admin Comments & Thread Logs */}
          <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs flex flex-col h-[340px]">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex-shrink-0 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Thread & Audit Log</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {comp.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-100 flex-shrink-0">
                    <img src={comment.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-[10px] font-extrabold ${comment.isAdmin ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {comment.authorName} {comment.isAdmin && '(Authority)'}
                      </span>
                      <span className="text-[8px] text-slate-400">{comment.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      <TranslatedText text={comment.text} />
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handlePostAdminComment} className="p-4 border-t border-slate-100 flex-shrink-0 bg-white">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post internal logs, team updates..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
                <button
                  type="submit"
                  className="absolute right-2 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: Case Assignment Info, History Log & Timeline */}
        <div className="space-y-6">
          
          {/* Complete Assignment Information */}
          <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-800 leading-none">Assignment Dossier</h3>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100/50">
                <span className="text-slate-400 font-bold">Assigned Worker</span>
                <span className="font-extrabold text-slate-700">{getAssignedWorker(comp)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100/50">
                <span className="text-slate-400 font-bold">Assigned Supervisor</span>
                <span className="font-extrabold text-slate-700">{getAssignedBy(comp)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100/50">
                <span className="text-slate-400 font-bold">Assignment Timestamp</span>
                <span className="font-extrabold text-slate-700">{getAssignedTime(comp)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400 font-bold">Operational Sector</span>
                <span className="font-extrabold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono text-[10px]">
                  {getZoneOfComplaint(comp)}
                </span>
              </div>
            </div>
          </section>

          {/* Dispatch History & Reassignment Logs */}
          <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-800 leading-none">Routing & Reassignment History</h3>
            </div>
            
            <div className="space-y-4 text-xs">
              {comp.assignedTeamName ? (
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <div>
                      <strong className="block text-slate-800 font-extrabold">Active Allocation Authorized</strong>
                      <span className="text-[9px] text-slate-400 font-bold">{getAssignedTime(comp)}</span>
                      <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                        Sanitation unit lead <strong>{getAssignedWorker(comp)}</strong> mobilized for site inspection. Supervised by {getAssignedBy(comp)}.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start border-t border-slate-100 pt-4">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                    <div>
                      <strong className="block text-slate-800 font-extrabold">Reassignment & SLA Monitor</strong>
                      <span className="text-[9px] text-amber-600 font-bold uppercase font-mono">Standby</span>
                      <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                        No previous re-routing required. Dispatchers can override and reassign the ticket to another operational squad in real time if bottlenecks occur.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-6 space-y-1">
                  <Users className="w-8 h-8 text-slate-200 mx-auto" />
                  <p className="italic font-bold text-xs">Awaiting Primary Allocation</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto font-medium">Use the workforce dispatch panel to authorize a sanitation squad.</p>
                </div>
              )}
            </div>
          </section>

          {/* Case Resolution Timeline */}
          <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-800 leading-none">Municipal Action Timeline</h3>
            </div>
            
            <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-5 text-xs">
              <div className="relative">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                <h4 className="font-extrabold text-slate-800">Grievance Registered</h4>
                <p className="text-[10px] text-slate-400 font-bold">{comp.submitTime}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Reported by citizen {comp.citizenName} in zone {getZoneOfComplaint(comp)}.</p>
              </div>
              
              {comp.assignedTeamName && (
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                  <h4 className="font-extrabold text-slate-800">Resource Dispatched</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{getAssignedTime(comp)}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Sanitation Crew {comp.assignedTeamName} dispatched. Field lead: {getAssignedWorker(comp)}.</p>
                </div>
              )}
              
              {comp.afterImage && (
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-white" />
                  <h4 className="font-extrabold text-slate-800">Clearance Evidence Uploaded</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{comp.submitTime.split(',')[0]}, 11:30 AM</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Crew finished cleaning debris and uploaded before-and-after validation photographs.</p>
                </div>
              )}
              
              {(comp.status === 'RESOLVED' || comp.status === 'VERIFIED') && (
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <h4 className="font-extrabold text-slate-800">Case Declared Clean & Resolved</h4>
                  <p className="text-[10px] text-emerald-600 font-black uppercase">Completed Successfully</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Municipal authority approved evidence of site clearance. Ticket closed.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Resolution & Verification Modal Overlay */}
      {showResolveOverlay && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-2xl">
            <h3 className="font-extrabold text-sm text-slate-800">Clearance Photo Verification</h3>
            <p className="text-xs text-slate-500">
              In production, the dispatched crew uploads this from the field via the crew terminal app. For this demo, we mock clearance photograph validation.
            </p>

            <div className="aspect-video bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center p-4">
              <Image className="w-8 h-8 text-emerald-600 mb-2 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">cleared_site_view.jpg</p>
              <p className="text-[8px] text-slate-400 mt-1">Automatic verification complete: 98% clean confidence match</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResolveOverlay(false)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-2.5 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleClearSpotSimulated}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4" />
                Approve & Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
