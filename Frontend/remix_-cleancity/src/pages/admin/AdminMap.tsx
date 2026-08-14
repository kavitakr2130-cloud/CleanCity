import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MockMap } from '../../components/MockMap';
import { Complaint } from '../../types';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Clock, TrendingUp, Users, Check, CheckCircle2, Activity, 
  MapPin, Navigation, Truck, Play, Compass, Trash2, 
  Map, AlertCircle, ArrowRight, RotateCw, X, Award, ShieldCheck, Info
} from 'lucide-react';

export const AdminMap: React.FC = () => {
  const { complaints, authoritySubRole, updateComplaintStatus, addComplaintComment } = useApp();
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // SUB-VIEW: FIELD WORKER PORTAL REDESIGNED GIS (TACTICAL GPS NAVIGATION)
  // -------------------------------------------------------------------------
  if (authoritySubRole === 'Field Worker') {
    const crewId = 'TEAM_DELTA_4';
    const workerName = "Amit Kumar";
    const workerId = "WRK001";
    const crewName = "Delta-4 Clean-Up Crew";
    const assignedVehicleId = "TX-2204";

    // Retrieve crew's tasks
    const myCrewsTasks = complaints.filter(c => c.assignedTeamId === crewId);
    
    // Find active assignment
    const activeAssignment = myCrewsTasks.find(c => (c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS') && !c.afterImage);
    const queuedAssignments = myCrewsTasks.filter(c => c.id !== activeAssignment?.id && !c.afterImage && c.status === 'ASSIGNED');
    const completedTasks = myCrewsTasks.filter(c => c.status === 'RESOLVED' || c.status === 'VERIFIED' || !!c.afterImage);

    // Navigation and simulation state
    const [simulatedProgress, setSimulatedProgress] = useState(0); // 0 to 100
    const [workStatus, setWorkStatus] = useState<'Assigned' | 'On Route' | 'Cleaning' | 'Completed'>('Assigned');
    const [workerStatus, setWorkerStatus] = useState<'Available' | 'Busy' | 'Offline'>(activeAssignment ? 'Busy' : 'Available');
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [workerRemarks, setWorkerRemarks] = useState('');
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
    const [successToast, setSuccessToast] = useState('');
    const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);

    // Sync workStatus with the actual complaint status inside AppContext
    useEffect(() => {
      if (activeAssignment) {
        if (activeAssignment.status === 'IN_PROGRESS') {
          setWorkStatus('Cleaning');
        } else if (activeAssignment.status === 'ASSIGNED') {
          setWorkStatus(prev => prev === 'On Route' ? 'On Route' : 'Assigned');
        }
      }
    }, [activeAssignment?.status]);

    // Preselected after-cleaning photos for simulator
    const simulatedAfterPhotos = [
      { id: '1', name: 'Cleared Sidewalk', url: 'https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?auto=format&fit=crop&q=80&w=800' },
      { id: '2', name: 'Cleaned Pathway', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800' },
      { id: '3', name: 'Dustbin Sanitized', url: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800' }
    ];

    // Turn-by-turn directions based on simulated progress
    const navigationSteps = [
      "Head North on Station Road toward Park Street (150m)",
      "Turn right onto Main Boulevard at the traffic signal (400m)",
      "Take the 2nd exit at the roundabout onto Municipal Ave (250m)",
      "In 100m, turn left into the complaint alleyway",
      "Arrived at waste site destination on your left!"
    ];

    const getActiveNavigationStepIndex = () => {
      if (simulatedProgress < 20) return 0;
      if (simulatedProgress < 40) return 1;
      if (simulatedProgress < 60) return 2;
      if (simulatedProgress < 85) return 3;
      return 4;
    };

    // Calculate simulated positions on coordinate grid
    const getSvgCoords = (lat: number, lng: number) => {
      const mapLatMin = 40.70;
      const mapLatMax = 40.82;
      const mapLngMin = -74.02;
      const mapLngMax = -73.93;

      const x = ((lng - mapLngMin) / (mapLngMax - mapLngMin)) * 100;
      const y = (1 - (lat - mapLatMin) / (mapLatMax - mapLatMin)) * 100;

      return {
        x: Math.min(Math.max(x, 10), 90),
        y: Math.min(Math.max(y, 10), 90)
      };
    };

    // Map base coords and target coords
    const baseLat = 40.712;
    const baseLng = -74.006;
    const targetLat = activeAssignment?.latitude || 40.735;
    const targetLng = activeAssignment?.longitude || -73.990;

    const baseCoords = getSvgCoords(baseLat, baseLng);
    const targetCoords = getSvgCoords(targetLat, targetLng);

    // Current position interpolated along the route path
    const getWorkerCoords = () => {
      if (workStatus === 'Assigned') {
        return baseCoords;
      }
      if (workStatus === 'Cleaning' || workStatus === 'Completed') {
        return targetCoords;
      }
      // On Route -> Interpolate based on progress
      const factor = simulatedProgress / 100;
      return {
        x: baseCoords.x + (targetCoords.x - baseCoords.x) * factor,
        y: baseCoords.y + (targetCoords.y - baseCoords.y) * factor
      };
    };

    const workerCoords = getWorkerCoords();

    // Telemetry calculations
    const fullDistance = 1.6; // km
    const fullEta = 7; // mins
    const factorRemaining = 1 - (workStatus === 'Assigned' ? 0 : workStatus === 'Cleaning' || workStatus === 'Completed' ? 1 : simulatedProgress / 100);
    const distanceRemaining = parseFloat((fullDistance * factorRemaining).toFixed(2));
    const etaRemaining = Math.ceil(fullEta * factorRemaining);

    // Action triggers
    const handleStartRoute = () => {
      setWorkStatus('On Route');
      setSimulatedProgress(0);
      setWorkerStatus('Busy');
      setSuccessToast("GPS Navigation Activated! Driving route opened.");
      setTimeout(() => setSuccessToast(''), 3500);

      /*
        FUTURE INTEGRATION (Flask + MySQL):
        PATCH /api/worker/route-status
        Payload: { crewId: 'TEAM_DELTA_4', status: 'ON_ROUTE', timestamp: new Date() }
      */
    };

    const handleSimulateMovement = () => {
      if (isSimulatingDrive) return;
      setIsSimulatingDrive(true);
      setSuccessToast("Driving Simulator Engaged...");
      setTimeout(() => setSuccessToast(''), 1500);

      let currentVal = simulatedProgress;
      const interval = setInterval(() => {
        currentVal += 10;
        if (currentVal >= 100) {
          currentVal = 100;
          setSimulatedProgress(100);
          setIsSimulatingDrive(false);
          setWorkStatus('Cleaning');
          updateComplaintStatus(activeAssignment!.id, 'IN_PROGRESS');
          addComplaintComment(activeAssignment!.id, "Delta-4 Crew has arrived on-site and initiated clean-up operations.", true);
          setSuccessToast("Destination Arrived! Initiating heavy sweepers & washers.");
          setTimeout(() => setSuccessToast(''), 4000);
          clearInterval(interval);
        } else {
          setSimulatedProgress(currentVal);
        }
      }, 700);

      /*
        FUTURE INTEGRATION (Flask + MySQL):
        POST /api/worker/gps-telemetry
        Payload: { vehicleId: 'TX-2204', latitude: curLat, longitude: curLng }
      */
    };

    const handleMarkArrivedManual = () => {
      setSimulatedProgress(100);
      setWorkStatus('Cleaning');
      if (activeAssignment) {
        updateComplaintStatus(activeAssignment.id, 'IN_PROGRESS');
        addComplaintComment(activeAssignment.id, "Delta-4 Crew checked in manually via GPS overrides.", true);
      }
      setSuccessToast("Checked-in at Destination. Cleaning active.");
      setTimeout(() => setSuccessToast(''), 3000);
    };

    const handleUploadProofSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeAssignment) return;

      const photoUrl = simulatedAfterPhotos[selectedPhotoIndex].url;
      updateComplaintStatus(activeAssignment.id, 'RESOLVED', photoUrl);
     addComplaintComment(activeAssignment.id, `Proof of cleaning uploaded by ${workerName}: "${workerRemarks || 'Debris completely swept, area sanitized.'}"`, true);

      setSuccessToast("Job completed! Work order submitted for supervisor audit.");
      setShowCompleteModal(false);
      setWorkerRemarks('');
      setSimulatedProgress(0);
      setWorkStatus('Assigned');
      setWorkerStatus('Available');
      setTimeout(() => setSuccessToast(''), 4000);

      /*
        FUTURE INTEGRATION (Flask + MySQL):
        POST /api/worker/proof-submit
        Payload: {
          complaint_id: activeAssignment.id,
          remarks: workerRemarks,
          after_image_url: photoUrl,
          worker_id: 'WRK-4029'
        }
      */
    };

    return (
      <div className="space-y-6 max-w-md mx-auto sm:max-w-xl md:max-w-4xl text-left font-sans pb-20">
        
        {/* SUCCESS TOAST NOTIFICATION */}
        {successToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 animate-fadeIn">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            🚚 {successToast}
          </div>
        )}

        {/* 1. WORKER PROFILE & DUTY HUD */}
        <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-600/20 rounded-full blur-xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-800 shrink-0">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt={workerName} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Delta-4 Field Operator</p>
                <h2 className="text-base font-black text-white">{workerName}</h2>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Crew: {crewName} • Veh: <span className="text-white font-bold">{assignedVehicleId}</span></p>
              </div>
            </div>

            <div className="flex gap-1.5 w-full sm:w-auto">
              {(['Available', 'Offline'] as const).map((status) => {
                const isActive = workerStatus === status;
                const activeStyle = status === 'Available' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-700 text-slate-200 border-slate-600';
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setWorkerStatus(status);
                      setSuccessToast(`Duty status updated to ${status.toUpperCase()}`);
                      setTimeout(() => setSuccessToast(''), 3000);
                    }}
                    className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-[10px] font-black uppercase border transition-all cursor-pointer ${
                      isActive ? activeStyle : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {activeAssignment ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: VISUAL NAVIGATION MAP (8/12) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-emerald-600 animate-pulse" />
                    Live Tactical GPS Route
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    GPS Tracking Synced
                  </div>
                </div>

                {/* SIMULATED GEOSPATIAL VECTOR MAP */}
                <div className="h-64 sm:h-80 bg-slate-100 rounded-2xl relative border border-slate-200 overflow-hidden shadow-inner">
                  <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 select-none pointer-events-none">
                    {/* Waterways */}
                    <path d="M 80 0 Q 75 30 85 60 T 95 100 L 100 100 L 100 0 Z" fill="#dbeafe" />

                    {/* Park zones */}
                    <rect x="40" y="15" width="22" height="35" fill="#e2f0d9" rx="1.5" />
                    <text x="51" y="32" fontSize="2.2" fill="#15803d" fontWeight="bold" textAnchor="middle">
                      Central Park
                    </text>

                    {/* Town square circle */}
                    <circle cx="23" cy="74" r="6" fill="#e2f0d9" />
                    <text x="23" y="74.5" fontSize="1.8" fill="#15803d" fontWeight="bold" textAnchor="middle">
                      Town Sq
                    </text>

                    {/* Urban grid street lines */}
                    <line x1="15" y1="0" x2="15" y2="100" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="30" y1="0" x2="30" y2="100" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="40" y1="0" x2="40" y2="100" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="62" y1="0" x2="62" y2="100" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="75" y1="0" x2="75" y2="100" stroke="#ffffff" strokeWidth="0.8" />

                    <line x1="0" y1="15" x2="100" y2="15" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="35" x2="100" y2="35" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="68" x2="100" y2="68" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="85" x2="100" y2="85" stroke="#ffffff" strokeWidth="0.8" />

                    {/* Street labels */}
                    <text x="15" y="95" fontSize="1.8" fill="#94a3b8" textAnchor="middle">5th Ave</text>
                    <text x="62" y="95" fontSize="1.8" fill="#94a3b8" textAnchor="middle">Market St</text>
                    <text x="5" y="49" fontSize="1.8" fill="#94a3b8">42nd St</text>
                  </svg>

                  {/* 1. DEPOT BASE MARKER */}
                  <div 
                    style={{ left: `${baseCoords.x}%`, top: `${baseCoords.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                  >
                    <div className="bg-slate-800 text-white p-1 rounded-md border border-slate-700 shadow text-[7px] font-black uppercase">
                      Sector 4 Depot
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white" />
                  </div>

                  {/* 2. PLOTTED ROUTE LINE */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-10">
                    {/* Dashed Route Map line */}
                    <line 
                      x1={`${baseCoords.x}%`} 
                      y1={`${baseCoords.y}%`} 
                      x2={`${targetCoords.x}%`} 
                      y2={`${targetCoords.y}%`} 
                      stroke="#3b82f6" 
                      strokeWidth="2.5" 
                      strokeDasharray="4 4"
                      className="opacity-70"
                    />
                    {/* Solid green progress tracking line */}
                    {(workStatus === 'On Route' || workStatus === 'Cleaning' || workStatus === 'Completed') && (
                      <line 
                        x1={`${baseCoords.x}%`} 
                        y1={`${baseCoords.y}%`} 
                        x2={`${workerCoords.x}%`} 
                        y2={`${workerCoords.y}%`} 
                        stroke="#10b981" 
                        strokeWidth="3.2" 
                      />
                    )}
                  </svg>

                  {/* 3. TARGET COMPLAINT MARKER (PULSING RED PIN) */}
                  <div 
                    style={{ left: `${targetCoords.x}%`, top: `${targetCoords.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group"
                  >
                    {/* Pulse wave if not completed */}
                    {workStatus !== 'Completed' && (
                      <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping pointer-events-none" />
                    )}
                    <div className={`p-1.5 rounded-full border-2 bg-white shadow-md flex items-center justify-center transition-all ${
                      workStatus === 'Completed' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-red-500 bg-red-50 text-red-600'
                    }`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-1.5 h-1.5 bg-red-500 rotate-45 -mt-0.5" />
                    <div className="absolute bottom-full mb-1 bg-slate-950 text-white text-[8px] font-bold py-0.5 px-1.5 rounded shadow whitespace-nowrap">
                      {activeAssignment.id} (Target)
                    </div>
                  </div>

                  {/* 4. WORKER INTERPOLATED POSITION MARKER (GREEN COMPASS PIN) */}
                  <div 
                    style={{ left: `${workerCoords.x}%`, top: `${workerCoords.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 transition-all duration-300"
                  >
                    <div className="absolute -inset-2 bg-emerald-400/20 rounded-full animate-ping pointer-events-none" />
                    <div className="p-1.5 rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-600 shadow-md">
                      <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                    </div>
                    <div className="bg-slate-900/90 text-white text-[8px] px-1.5 py-0.5 rounded border border-slate-800 font-bold mt-1 shadow whitespace-nowrap">
                      My Crew GPS
                    </div>
                  </div>

                  {/* 5. FUTURE-READY ASSIGNED VEHICLE POSITION TRACKER */}
                  <div 
                    style={{ left: `${workerCoords.x - 3}%`, top: `${workerCoords.y + 3}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30 transition-all duration-300"
                  >
                    <div className="p-1 rounded-full border border-blue-500 bg-blue-600 text-white shadow">
                      <Truck className="w-2.5 h-2.5" />
                    </div>
                    <div className="bg-slate-950 text-blue-300 text-[6px] px-1 py-0.2 rounded font-black tracking-tight whitespace-nowrap">
                      VEH: TX-2204
                    </div>
                  </div>

                </div>

                {/* TURN BY TURN DIRECTIVE BAR */}
                {workStatus === 'On Route' && (
                  <div className="bg-slate-950 text-white p-3.5 rounded-2xl flex items-center justify-between gap-4 shadow-md border border-slate-800 animate-fadeIn">
                    <div className="min-w-0 flex-1">
                      <p className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">Active Turn-by-Turn GPS</p>
                      <p className="text-xs font-black text-white leading-relaxed mt-0.5 flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse flex-shrink-0" />
                        {navigationSteps[getActiveNavigationStepIndex()]}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateMovement}
                      disabled={isSimulatingDrive}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold shadow-sm flex items-center gap-1 shrink-0 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSimulatingDrive ? "Driving..." : "Drive Step ➜"}
                    </button>
                  </div>
                )}
              </div>

              {/* OTHER QUEUED COMPLAINTS CARDS */}
              {queuedAssignments.length > 0 && (
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Next Assigned Queue ({queuedAssignments.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {queuedAssignments.map((qc) => (
                      <div key={qc.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono font-black text-slate-400 block">{qc.id} • {qc.category}</span>
                          <h4 className="font-extrabold text-slate-800 truncate mt-0.5">{qc.title}</h4>
                          <p className="text-[10px] text-slate-500 truncate">{qc.address}</p>
                        </div>
                        <span className="bg-slate-200 text-slate-700 text-[8px] font-black px-2 py-0.5 rounded-lg border border-slate-300 whitespace-nowrap">
                          QUEUED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: DISPATCH HUD, TELEMETRY & CONTROLS (4/12) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* CURRENT JOB DATA HUD */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="pb-3 border-b border-slate-50 text-left">
                  <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {activeAssignment.priority} Priority
                  </span>
                  <h3 className="text-base font-black text-slate-800 mt-1">{activeAssignment.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    {activeAssignment.address}
                  </p>
                </div>

                {/* TELEMETRY READOUTS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Remaining GPS Distance</span>
                    <p className="text-xl font-black text-slate-800 mt-1 font-mono">
                      {workStatus === 'Cleaning' || workStatus === 'Completed' ? '0.00' : distanceRemaining} <span className="text-xs text-slate-500">km</span>
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Estimated travel time</span>
                    <p className="text-xl font-black text-slate-800 mt-1 font-mono">
                      {workStatus === 'Cleaning' || workStatus === 'Completed' ? '0' : etaRemaining} <span className="text-xs text-slate-500">mins</span>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-semibold">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Citizen Briefing</span>
                  "{activeAssignment.description || 'No supplementary description provided.'}"
                </div>
              </div>

              {/* TACTICAL WORK FLOW STEPPER AND ACTIONS */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Tactical Stepper Logs
                </h3>

                {/* Stepper graphical line */}
                <div className="flex justify-between items-center relative px-2 py-3">
                  {/* line background */}
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0" />
                  
                  {/* active line background */}
                  <div 
                    className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 z-0 transition-all duration-300"
                    style={{ 
                      width: workStatus === 'Assigned' ? '0%' : workStatus === 'On Route' ? '33%' : workStatus === 'Cleaning' ? '66%' : '100%' 
                    }}
                  />

                  {/* Step indicators */}
                  {[
                    { id: 'Assigned', label: 'Assign' },
                    { id: 'On Route', label: 'Route' },
                    { id: 'Cleaning', label: 'Clean' },
                    { id: 'Completed', label: 'Done' }
                  ].map((step, idx) => {
                    const stepStatusMap = ['Assigned', 'On Route', 'Cleaning', 'Completed'];
                    const currentIdx = stepStatusMap.indexOf(workStatus);
                    const isDone = idx < currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step.id} className="flex flex-col items-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                          isDone 
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                            : isCurrent
                              ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-100'
                              : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[8px] font-extrabold uppercase mt-1 ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* STEPPER EXPLANATION */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-bold leading-relaxed text-center">
                  {workStatus === 'Assigned' && "Job Dispatched. Tap 'Start Fleet Navigation' to open spatial route guidelines."}
                  {workStatus === 'On Route' && "Driving to Target. Click 'Drive Step' on the map to simulate travel progress."}
                  {workStatus === 'Cleaning' && "Active Sanitation Zone. Sweeping and wash cycles are currently running. Press 'Execute completion' to submit proof."}
                  {workStatus === 'Completed' && "Verification Audit Pending. Final audit uploaded. Returning to depot base."}
                </div>

                {/* PRIMARY ACTIONS BUTTON PANEL */}
                <div className="space-y-2 pt-2 border-t border-slate-50">
                  {workStatus === 'Assigned' && (
                    <button
                      type="button"
                      onClick={handleStartRoute}
                      className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 fill-white" /> Start Fleet Navigation
                    </button>
                  )}

                  {workStatus === 'On Route' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleMarkArrivedManual}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold text-xs py-3 rounded-xl transition-all text-center cursor-pointer"
                      >
                        Manual Check-in
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulateMovement}
                        disabled={isSimulatingDrive}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow transition-all text-center cursor-pointer disabled:opacity-50"
                      >
                        {isSimulatingDrive ? "Driving..." : "Simulate Drive"}
                      </button>
                    </div>
                  )}

                  {workStatus === 'Cleaning' && (
                    <button
                      type="button"
                      onClick={() => setShowCompleteModal(true)}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Execute Completion Proof
                    </button>
                  )}

                  {workStatus === 'Completed' && (
                    <div className="text-center text-[11px] text-emerald-600 font-black py-2 uppercase bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> WORK ORDER COMPLETED SUCCESSFULLY
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* NO ACTIVE TASK - BEAUTIFUL EMPTY STATE */
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 p-8 py-14 rounded-3xl text-center max-w-md mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Navigation className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h4 className="text-base font-black text-slate-800">No active assignment. Waiting for supervisor dispatch.</h4>
                <p className="text-xs text-slate-400 font-extrabold max-w-[280px] mx-auto leading-relaxed">
                  Delta-4 Crew is currently on standby. Enjoy the downtime or keep your status toggled to Available to receive real-time push dispatches!
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest inline-block">
                ● Status: Connected & Registered (TX-2204)
              </div>
            </div>

            {/* COMPLETED JOBS LOG */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-emerald-600" />
                Crew Finished Tasks History (Today)
              </h3>
              
              <div className="space-y-2.5">
                {completedTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-bold text-center py-4">No completions recorded for today's shift yet.</p>
                ) : (
                  completedTasks.map((tk) => (
                    <div key={tk.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs gap-4">
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-slate-400 block font-mono">{tk.id} • {tk.category}</span>
                        <h4 className="font-extrabold text-slate-800 truncate mt-0.5">{tk.title}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{tk.address}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md uppercase">
                          {tk.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* COMPLETION PROOF MODAL */}
        {showCompleteModal && activeAssignment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

      </div>
    );
  }

  // -------------------------------------------------------------------------
  // SUB-VIEW: ADMIN / SUPERVISOR GIS PORTAL (ANALYTICS & HOTSPOTS)
  // -------------------------------------------------------------------------
  const handleSelectComplaint = (comp: Complaint) => {
    navigate(`/admin/complaints?id=${comp.id}`);
  };

  const zoneComplaints = React.useMemo(() => {
    return complaints.filter(c => {
      if (authoritySubRole === 'Supervisor') {
        const code = parseInt(c.id.replace('CC-', '')) || 0;
        return code % 2 === 1 || c.address.includes('4') || c.address.toLowerCase().includes('park');
      }
      return true;
    });
  }, [complaints, authoritySubRole]);

  // Statistics calculation for active hotspots
  const totalActiveHotspots = React.useMemo(() => {
    return zoneComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'VERIFIED').length;
  }, [zoneComplaints]);

  const totalRegistered = zoneComplaints.length;

  const highDensityArea = React.useMemo(() => {
    const addresses = zoneComplaints.map(c => c.address);
    if (addresses.length === 0) return 'None';
    let parkCount = 0;
    let marketCount = 0;
    let centralCount = 0;
    addresses.forEach(a => {
      const low = a.toLowerCase();
      if (low.includes('park')) parkCount++;
      if (low.includes('market')) marketCount++;
      if (low.includes('central')) centralCount++;
    });
    if (parkCount >= marketCount && parkCount >= centralCount) return 'Park Circus & Sector 4 Greenbelt';
    if (marketCount >= parkCount && marketCount >= centralCount) return 'Central Market Square';
    return 'Main Transit Corridor & Junctions';
  }, [zoneComplaints]);

  // Category Case Loads (Category-wise complaint distribution)
  const categoryCount = React.useMemo(() => {
    return zoneComplaints.reduce((acc: { [key: string]: number }, cur) => {
      const cat = cur.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
  }, [zoneComplaints]);

  const barChartData = React.useMemo(() => {
    return Object.keys(categoryCount).map(key => ({
      name: key,
      value: categoryCount[key]
    }));
  }, [categoryCount]);

  // Priority breakdown
  const priorityCountGrouped = React.useMemo(() => {
    return zoneComplaints.reduce((acc: { High: number; Medium: number; Low: number }, cur) => {
      const prio = (cur.priority || '').toUpperCase();
      if (prio === 'HIGH' || prio === 'URGENT') {
        acc.High += 1;
      } else if (prio === 'MEDIUM') {
        acc.Medium += 1;
      } else {
        acc.Low += 1;
      }
      return acc;
    }, { High: 0, Medium: 0, Low: 0 });
  }, [zoneComplaints]);

  const pieChartData = React.useMemo(() => {
    return [
      { name: 'High Priority', value: priorityCountGrouped.High, color: '#ef4444' },
      { name: 'Medium Priority', value: priorityCountGrouped.Medium, color: '#f97316' },
      { name: 'Low Priority', value: priorityCountGrouped.Low, color: '#eab308' }
    ].filter(item => item.value > 0);
  }, [priorityCountGrouped]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-50 flex justify-between items-center text-left">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {authoritySubRole === 'Supervisor' ? 'GIS Hotspots Map (Sector 4)' : 'GIS Command Center'}
          </h2>
          <p className="text-xs text-slate-500 font-semibold">
            {authoritySubRole === 'Supervisor'
              ? 'Visualizing sanitation fleet and garbage hotspots specifically within Sector 04'
              : 'Track sanitation fleet positioning and active garbage hot spots'}
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse shadow-sm shadow-emerald-500/10">
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
            SPATIAL ENGINE LIVE
          </span>
        </div>
      </div>

      {/* Full-width GIS Interactive Map */}
      <div className="h-[480px] rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative w-full">
        <MockMap
          complaints={zoneComplaints}
          onSelectComplaint={handleSelectComplaint}
          isAdminMode={true}
        />
      </div>

      {/* Analytics & Legend below the Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* 1. Category Case Loads */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3 text-left">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Category-wise Case Loads</h3>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '9px' }} />
                <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} barSize={20} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Priority Distribution */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3 text-left">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Priority-wise Distribution</h3>
          <div className="flex items-center justify-between min-h-[160px] gap-2 pt-2">
            <div className="h-36 w-36 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '9px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-grow space-y-2 pl-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0" />
                <span>High: {priorityCountGrouped.High}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shrink-0" />
                <span>Medium: {priorityCountGrouped.Medium}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] shrink-0" />
                <span>Low: {priorityCountGrouped.Low}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Map Legend */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3 text-left flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Map Legend</h4>
            <div className="flex flex-col gap-3.5 pt-3 text-xs font-bold text-slate-600">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="font-extrabold text-slate-800">🔴 High Priority</span>
                <span className="text-[10px] text-slate-400 font-semibold">(SLA: 24h)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0" />
                <span className="font-extrabold text-slate-800">🟠 Medium Priority</span>
                <span className="text-[10px] text-slate-400 font-semibold">(SLA: 3d)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 shrink-0" />
                <span className="font-extrabold text-slate-800">🟡 Low Priority</span>
                <span className="text-[10px] text-slate-400 font-semibold">(SLA: 7d)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-extrabold text-slate-800">🟢 Resolved</span>
                <span className="text-[10px] text-slate-400 font-semibold">(Cleared & Verified)</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-4 pt-2 border-t border-slate-50">
            * Color indicators map directly to active geospatial reports in the system.
          </p>
        </div>

      

      </div>
    </div>
  );
};
