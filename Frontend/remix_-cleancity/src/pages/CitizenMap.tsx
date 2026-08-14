import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Info, Trash2, ShieldAlert, CheckCircle2, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MockMap } from '../components/MockMap';
import { Complaint } from '../types';

export const CitizenMap: React.FC = () => {
  const { complaints } = useApp();
  const navigate = useNavigate();

  const handleSelectComplaint = (comp: Complaint) => {
    navigate(`/complaint/${comp.id}`);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-180px)] flex flex-col">
      <div className="pb-2 border-b border-slate-50 flex-shrink-0">
        <h2 className="text-xl font-extrabold text-slate-800">Local Area Map</h2>
        <p className="text-xs text-slate-400 font-medium">Real-time coordinates of reported issues and dispatched sanitation crews</p>
      </div>

      <div className="flex-grow rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative">
        <MockMap
          complaints={complaints}
          onSelectComplaint={handleSelectComplaint}
          isAdminMode={false}
        />
      </div>
    </div>
  );
};
