import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Info, Trash2, ShieldAlert, CheckCircle, Truck, HelpCircle } from 'lucide-react';
import { Complaint } from '../types';
import { useApp } from '../context/AppContext';

interface LocationOption {
  id: string;
  name: string;
}

interface MockMapProps {
  complaints: Complaint[];
  selectedComplaintId?: string;
  onSelectComplaint?: (complaint: Complaint) => void;
  isAdminMode?: boolean;
  locations?: LocationOption[];
}

export const MockMap: React.FC<MockMapProps> = ({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  isAdminMode = false,
  locations = [],
}) => {
  const navigate = useNavigate();
  const { authoritySubRole } = useApp();
  const isSupervisor = authoritySubRole === 'Supervisor';

  const [activePin, setActivePin] = useState<Complaint | null>(() => {
    if (selectedComplaintId) {
      return complaints.find(c => c.id === selectedComplaintId) || null;
    }
    return null;
  });

  const [locationFilter, setLocationFilter] = useState(() => {
    return isSupervisor ? 'Sector-04' : 'All';
  });
  const [apiLocations, setApiLocations] = useState<LocationOption[]>([]);

  useEffect(() => {
    if (locations && locations.length > 0) {
      setApiLocations(locations);
      return;
    }

    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/locations');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setApiLocations(data);
          }
        }
      } catch (error) {
        console.log('Backend locations API not available yet, falling back to empty list.');
      }
    };

    fetchLocations();
  }, [locations]);

  // Sector 4 simulated zone data filtering
  const supervisorZoneFilter = (c: Complaint) => {
    const code = parseInt(c.id.replace('CC-', '')) || 0;
    return code % 2 === 1 || c.address.includes('4') || c.address.toLowerCase().includes('park');
  };

  const filteredComplaints = React.useMemo(() => {
    let list = complaints;
    
    // Automatically restrict to supervisor's assigned zone (Sector 04)
    if (isSupervisor) {
      list = list.filter(supervisorZoneFilter);
    } else if (locationFilter !== 'All') {
      const selectedLoc = apiLocations.find(l => l.id === locationFilter);
      if (selectedLoc) {
        list = list.filter(c => c.address.toLowerCase().includes(selectedLoc.name.toLowerCase()));
      }
    }
    return list;
  }, [complaints, isSupervisor, locationFilter, apiLocations]);

  const getPinColor = (complaint: Complaint) => {
    const isResolved = complaint.status === 'RESOLVED' || complaint.status === 'VERIFIED';
    if (isResolved) return 'text-emerald-500 fill-emerald-100 border-emerald-500 bg-emerald-50';
    
    const prio = (complaint.priority || '').toUpperCase();
    if (prio === 'HIGH' || prio === 'URGENT') return 'text-red-500 fill-red-100 border-red-500 bg-red-50';
    if (prio === 'MEDIUM') return 'text-orange-500 fill-orange-100 border-orange-500 bg-orange-50';
    return 'text-yellow-500 fill-yellow-100 border-yellow-400 bg-yellow-50'; // LOW
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Plastic':
        return <Trash2 className="w-4 h-4" />;
      case 'Hazardous':
        return <ShieldAlert className="w-4 h-4" />;
      case 'Construction':
        return <Info className="w-4 h-4" />;
      default:
        return <Trash2 className="w-4 h-4" />;
    }
  };

  const handlePinClick = (comp: Complaint) => {
    setActivePin(comp);
    if (onSelectComplaint) {
      onSelectComplaint(comp);
    }
  };

  // Convert lat/long mock values into SVG % coordinates for rendering
  const getSvgCoords = (lat: number, lng: number) => {
    // Base coords for mapping (lat approx 40.7, lng approx -73.9)
    // Map bounds: Lat [40.70 to 40.82], Lng [-73.93 to -74.02]
    const mapLatMin = 40.70;
    const mapLatMax = 40.82;
    const mapLngMin = -74.02;
    const mapLngMax = -73.93;

    const x = ((lng - mapLngMin) / (mapLngMax - mapLngMin)) * 100;
    // SVG coordinates start from top-left, so invert Y
    const y = (1 - (lat - mapLatMin) / (mapLatMax - mapLatMin)) * 100;

    // Constrain within bounds
    return {
      x: Math.min(Math.max(x, 10), 90),
      y: Math.min(Math.max(y, 10), 90)
    };
  };

  return (
    <div className="relative bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-full shadow-inner">
      {/* Map Control Bar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">
            {isSupervisor ? 'CleanCity Live GIS Map (Sector 04)' : 'CleanCity Live GIS Map'}
          </span>
        </div>
        <div className="flex gap-2">
          <select
            disabled={isSupervisor}
            value={isSupervisor ? 'Sector-04' : locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white border border-slate-200 text-[11px] font-medium rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none text-slate-700 cursor-pointer disabled:opacity-90 disabled:bg-slate-100/50"
          >
            {isSupervisor ? (
              <option value="Sector-04">Sector 04 (My Zone)</option>
            ) : (
              <>
                <option value="All">All Locations</option>
                {apiLocations && apiLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      {/* Map Vector Drawing */}
      <div className="flex-1 relative bg-slate-100 min-h-[300px] overflow-hidden">
        {/* Animated scale/pan layer for Supervisor zoom */}
        <div 
          className="w-full h-full absolute inset-0 transition-transform duration-700 origin-center"
          style={isSupervisor ? { transform: 'scale(1.6) translate(-12%, 10%)' } : undefined}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 select-none pointer-events-none opacity-90">
            {/* Waterway / East River */}
            <path
              d="M 80 0 Q 75 30 85 60 T 95 100 L 100 100 L 100 0 Z"
              fill="#dbeafe"
              className="transition-colors duration-500"
            />

            {/* Central Park Block */}
            <rect x="40" y="15" width="22" height="35" fill="#dcfce7" rx="1.5" />
            <text x="51" y="32" fontSize="2.2" fill="#15803d" fontWeight="bold" textAnchor="middle">
              Central Park
            </text>

            {/* Old Town Square Park */}
            <circle cx="25" cy="72" r="6" fill="#dcfce7" />
            <text x="25" y="72.5" fontSize="1.8" fill="#15803d" fontWeight="bold" textAnchor="middle">
              Town Sq
            </text>

            {/* Urban Street Grid Lines */}
            {/* Avenues (Vertical) */}
            <line x1="15" y1="0" x2="15" y2="100" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="30" y1="0" x2="30" y2="100" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="40" y1="0" x2="40" y2="100" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="62" y1="0" x2="62" y2="100" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="75" y1="0" x2="75" y2="100" stroke="#ffffff" strokeWidth="0.8" />

            {/* Streets (Horizontal) */}
            <line x1="0" y1="15" x2="100" y2="15" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="0" y1="35" x2="100" y2="35" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="0" y1="68" x2="100" y2="68" stroke="#ffffff" strokeWidth="0.8" />
            <line x1="0" y1="85" x2="100" y2="85" stroke="#ffffff" strokeWidth="0.8" />

            {/* Labels */}
            <text x="15" y="94" fontSize="1.8" fill="#94a3b8" textAnchor="middle">5th Ave</text>
            <text x="62" y="94" fontSize="1.8" fill="#94a3b8" textAnchor="middle">Market St</text>
            <text x="5" y="49" fontSize="1.8" fill="#94a3b8">42nd St</text>
            <text x="5" y="84" fontSize="1.8" fill="#94a3b8">10th St</text>
          </svg>

          {/* Real-time Glowing Heatmap layer underneath active high-priority complaints */}
          {filteredComplaints.map((comp) => {
            const isHigh = comp.priority === 'HIGH' || comp.priority === 'URGENT';
            if (isHigh && comp.status !== 'RESOLVED' && comp.status !== 'VERIFIED') {
              const { x, y } = getSvgCoords(comp.latitude, comp.longitude);
              return (
                <div
                  key={`heat-${comp.id}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className="absolute w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/15 blur-lg pointer-events-none animate-pulse z-10"
                />
              );
            }
            return null;
          })}

          {/* Sector 04 Major Hotspot Area Ambient Blur */}
          {isSupervisor && (
            <div
              style={{ left: '55%', top: '35%' }}
              className="absolute w-36 h-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-xl pointer-events-none animate-pulse z-10"
            />
          )}

          {/* Dynamic Complaint Pin Markers */}
          {filteredComplaints.map((comp) => {
            const { x, y } = getSvgCoords(comp.latitude, comp.longitude);
            const pinStyle = getPinColor(comp);
            const isActive = activePin?.id === comp.id;

            const isResolved = comp.status === 'RESOLVED' || comp.status === 'VERIFIED';
            const isHigh = comp.priority === 'HIGH' || comp.priority === 'URGENT';
            const isMedium = comp.priority === 'MEDIUM';

            return (
              <button
                key={comp.id}
                onClick={() => handlePinClick(comp)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group z-20 transition-all focus:outline-none ${
                  isActive ? 'scale-125 z-30' : 'hover:scale-110'
                }`}
              >
                <div className="relative flex flex-col items-center">
                  {/* Active pulse */}
                  {!isResolved && isHigh && (
                    <div className="absolute -inset-2 rounded-full bg-red-400/20 animate-ping pointer-events-none" />
                  )}
                  {!isResolved && isMedium && (
                    <div className="absolute -inset-2 rounded-full bg-orange-400/20 animate-ping pointer-events-none" />
                  )}

                  {/* SVG Pin design */}
                  <div className={`p-1.5 rounded-full border-2 bg-white shadow-md flex items-center justify-center transition-all ${
                    isResolved
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : isHigh
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : isMedium
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-yellow-400 bg-yellow-50 text-yellow-600'
                  }`}>
                    {isResolved ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                    ) : comp.status === 'ASSIGNED' ? (
                      <Truck className="w-4 h-4" />
                    ) : isHigh ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>

                  {/* Small indicator tip */}
                  <div className={`w-2 h-2 rotate-45 -mt-1 bg-white border-r border-b ${
                    isResolved
                      ? 'border-emerald-500 bg-emerald-50'
                      : isHigh
                        ? 'border-red-500 bg-red-50'
                        : isMedium
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-yellow-400 bg-yellow-50'
                  }`} />

                  {/* Compact tooltip on hover */}
                  <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-40">
                    {comp.id} - {comp.title} ({comp.status})
                  </div>
                </div>
              </button>
            );
          })}

          {/* Floating Simulated Delta-4 Cleanup Truck Icon when Assigned */}
          {complaints.some(c => c.id === 'CC-9821' && c.status === 'ASSIGNED') && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center select-none"
              style={{ left: '60%', top: '48%', transition: 'all 5s ease' }}
            >
              <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce">
                <Truck className="w-4 h-4 fill-white" />
              </div>
              <div className="bg-slate-900/90 text-white text-[9px] px-1.5 py-0.5 rounded border border-slate-700 font-bold mt-1 shadow whitespace-nowrap">
                TX-2204
              </div>
            </div>
          )}
        </div>



        {/* Floating Zone-Specific Hotspot statistics box */}
        {isSupervisor && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-slate-900/95 backdrop-blur-md p-2 sm:p-3 rounded-xl border border-slate-800 shadow-lg space-y-1.5 sm:space-y-2 z-10 text-[9px] sm:text-[10px] text-white w-32 sm:w-44 font-bold">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 sm:pb-1.5">
              <span className="uppercase text-slate-400 tracking-wider text-[7px] sm:text-[8px]">Sector 04 GIS</span>
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-1 sm:gap-2 text-center pt-0.5">
              <div className="bg-slate-800/80 p-1 rounded-md border border-slate-700/50">
                <p className="text-[11px] sm:text-[14px] text-rose-500 font-black">
                  {filteredComplaints.filter(c => (c.priority === 'HIGH' || c.priority === 'URGENT') && c.status !== 'RESOLVED').length}
                </p>
                <p className="text-[7px] sm:text-[8px] text-slate-400 uppercase tracking-tight mt-0.5">Critical</p>
              </div>
              <div className="bg-slate-800/80 p-1 rounded-md border border-slate-700/50">
                <p className="text-[11px] sm:text-[14px] text-emerald-400 font-black">
                  {filteredComplaints.filter(c => c.status === 'RESOLVED' || c.status === 'VERIFIED').length}
                </p>
                <p className="text-[7px] sm:text-[8px] text-slate-400 uppercase tracking-tight mt-0.5">Cleared</p>
              </div>
            </div>
            <div className="hidden sm:block space-y-1.5 pt-1 text-[9px] font-semibold text-slate-300">
              <div className="flex justify-between">
                <span>Active Grievances:</span>
                <span className="text-white font-bold">{filteredComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'VERIFIED').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Registered:</span>
                <span className="text-white font-bold">{filteredComplaints.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Item Detail Popup */}
      {activePin && (
        <div className="p-4 bg-white border-t border-slate-200 shadow-xl z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-slide-up">
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
              <img src={activePin.beforeImage} alt={activePin.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800">{activePin.id}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold ${
                  activePin.status === 'RESOLVED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : activePin.status === 'ASSIGNED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {activePin.status}
                </span>
                <span className="text-[10px] text-slate-400">{activePin.submitTime}</span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-800">{activePin.title}</h4>
              <p className="text-xs text-slate-500">{activePin.address}</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (isAdminMode) {
                  navigate(`/admin/complaints?id=${activePin.id}`);
                } else {
                  navigate(`/complaint/${activePin.id}`);
                }
              }}
              className="flex-1 sm:flex-initial text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors shadow"
            >
              {isAdminMode ? 'Manage Gievance' : 'Track Status'}
            </button>
            <button
              onClick={() => setActivePin(null)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2 px-3 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
