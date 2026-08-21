import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Hash, 
  Clock, 
  Activity, 
  Edit3, 
  Save, 
  X, 
  ChevronRight, 
  ArrowLeft, 
  Camera,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { AdminLayout } from '../../components/Layouts';
import { useApp } from "../../context/AppContext";

interface AdminProfileData {
  avatar: string;
  name: string;
  role: string;
  employeeId: string;
  email: string;
  phone: string;
  ward: string;
  officeLocation: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
}

const DEFAULT_PROFILE: AdminProfileData = {
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  name: 'Admin Dispatcher',
  role: 'Municipal Administrator / Dispatcher',
  employeeId: 'EMP-2026-0984',
  email: 'Radhika@gmail.com',
  phone: '+91 98765 43210',
  ward: 'Ward 12 - Central Sector (Zone A)',
  officeLocation: 'Municipal Corporation Head Office, Hall 4, Floor 3',
  lastLogin: 'July 14, 2026 • 01:45 AM',
  status: 'Active'
};

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
];

export const AdminProfile: React.FC = () => {
  const navigate = useNavigate();
  const { currentRole } = useApp();
  const [profile, setProfile] = useState<AdminProfileData>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<AdminProfileData>(DEFAULT_PROFILE);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://127.0.0.1:5000/admin/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      const adminProfile: AdminProfileData = {
       avatar: data.profile_photo
  ? `http://127.0.0.1:5000/${data.profile_photo.replace(/\\/g, "/")}`
  : DEFAULT_PROFILE.avatar,
        name: data.full_name,
        role: data.designation || "Administrator",
        employeeId: data.employee_id,
        email: data.email,
        phone: data.mobile_number || "",
        ward: "Municipal Corporation",
        officeLocation: DEFAULT_PROFILE.officeLocation,
        lastLogin: DEFAULT_PROFILE.lastLogin,
        status: "Active",
      };

      setProfile(adminProfile);
      setEditForm(adminProfile);
    } catch (err) {
      console.error("Error loading admin profile:", err);
    }
  };

  fetchProfile();
}, []);

  const handleEditClick = () => {
    setEditForm(profile);
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowAvatarPicker(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePresetSelect = (url: string) => {
    setEditForm(prev => ({
      ...prev,
      avatar: url
    }));
    setShowAvatarPicker(false);
  };

 const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

  const formData = new FormData();

formData.append("name", editForm.name);
formData.append("email", editForm.email);
formData.append("phone", editForm.phone);
formData.append("role", editForm.role);

if (profilePhotoFile) {
  formData.append("profile_photo", profilePhotoFile);
}

const response = await fetch("http://127.0.0.1:5000/admin/profile", {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const data = await response.json();

if (!response.ok) {
  alert(data.message);
  return;
}

setProfile(editForm);
setProfilePhotoFile(null);
setIsEditing(false);
setSaveSuccess(true);
setTimeout(() => setSaveSuccess(false), 3000);
  } catch (err) {
    console.error("Update profile error:", err);
  }
};

  return (
    <div className="space-y-6 max-h-full overflow-y-auto pb-10 text-left">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate(
  currentRole === "supervisor"
    ? "/supervisor/dashboard"
    : currentRole === "worker"
    ? "/worker/dashboard"
    : "/admin/dashboard"
)}>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600">My Profile</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Admin Profile</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage your administrator credentials and account information.</p>
          </div>
          <button 
            onClick={() => navigate(
  currentRole === "supervisor"
    ? "/supervisor/dashboard"
    : currentRole === "worker"
    ? "/worker/dashboard"
    : "/admin/dashboard"
)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-slide-up">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile information updated successfully in local session database index. Ready for API endpoints sync.</span>
          </div>
        )}

        {/* Profile Card & Info Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Summary Avatar & Status Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-md">
                <img 
                  src={isEditing ? editForm.avatar : profile.avatar} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="absolute bottom-1 right-1 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  title="Choose Avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

        {showAvatarPicker && isEditing && (
  <div className="w-full border-t border-slate-100 pt-4 space-y-3">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      Select Preset Avatar
    </p>

    <div className="flex justify-center gap-2">
      {AVATAR_PRESETS.map((url, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handlePresetSelect(url)}
          className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer ${
            editForm.avatar === url
              ? 'border-emerald-500 scale-105'
              : 'border-transparent'
          }`}
        >
          <img
            src={url}
            alt={`preset ${i}`}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>

    {/* Upload Profile Photo */}
    <div className="flex justify-center">
      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
        Upload Profile Photo

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (!file) return;

            setProfilePhotoFile(file);

            const reader = new FileReader();

           reader.onload = (event) => {
  const result = event.target?.result;

  if (typeof result === "string") {
    setEditForm(prev => ({
      ...prev,
      avatar: result
    }));
  }
};

            reader.readAsDataURL(file);
          }}
        />
      </label>
    </div>

    <div className="text-[9px] text-slate-400 font-semibold">
      Or input any URL directly in the profile settings form.
    </div>
  </div>
)}

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800">{profile.name}</h3>
              <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
                {profile.role}
              </p>
            </div>

            <div className="w-full border-t border-slate-50 pt-4 divide-y divide-slate-50 text-left text-[11px] space-y-2.5">
              <div className="flex justify-between items-center py-1.5 pt-0">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Account Status</span>
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  {profile.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Employee ID</span>
                <span className="font-extrabold text-slate-700 font-mono bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                  {profile.employeeId}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Last Login Trace</span>
                <span className="font-semibold text-slate-500 text-right">
                  {profile.lastLogin}
                </span>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleEditClick}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile Information
              </button>
            )}
          </div>

          {/* Right Column: Detailed Fields Profile / Edit Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  {isEditing ? 'Modify Profile Fields' : 'Official Employee Credentials'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isEditing ? 'Provide current credentials below. All fields can be synced to database controllers.' : 'These fields identify your authorization within the municipal sector.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input 
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      required
                    />
                  ) : (
                    <p className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                      {profile.name}
                    </p>
                  )}
                </div>

                {/* Admin Role */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Admin Role
                  </label>
                  {isEditing ? (
                    <select 
                      name="role"
                      value={editForm.role}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer"
                    >
                      <option value="Municipal Administrator / Dispatcher">Municipal Administrator / Dispatcher</option>
                      <option value="Municipal Administrator">Municipal Administrator</option>
                      <option value="Zone Supervisor">Zone Supervisor</option>
                      <option value="Field Crew Leader">Field Crew Leader</option>
                    </select>
                  ) : (
                    <p className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                      {profile.role}
                    </p>
                  )}
                </div>

                {/* Employee ID */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    Employee ID
                  </label>
                  {isEditing ? (
                    <input 
                      type="text"
                      name="employeeId"
                      value={editForm.employeeId}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      required
                    />
                  ) : (
                    <p className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-mono font-bold text-slate-700">
                      {profile.employeeId}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email Address
                  </label>
                  {isEditing ? (
                    <input 
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      required
                    />
                  ) : (
                    <p className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                      {profile.email}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input 
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      required
                    />
                  ) : (
                    <p className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                      {profile.phone}
                    </p>
                  )}
                </div>

                {/* Assigned Ward */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Assigned Ward / Zone
                  </label>
                  {isEditing ? (
                    <input 
                      type="text"
                      name="ward"
                      value={editForm.ward}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      required
                    />
                  ) : (
                    <p className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                      {profile.ward}
                    </p>
                  )}
                </div>

                {/* Office Location */}
                <div className="md:col-span-2 space-y-1 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Physical Office Location
                  </label>
                  {isEditing ? (
                    <input 
                      type="text"
                      name="officeLocation"
                      value={editForm.officeLocation}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      required
                    />
                  ) : (
                    <p className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                      {profile.officeLocation}
                    </p>
                  )}
                </div>

                {/* Custom Avatar URL input inside Edit mode */}
                {isEditing && (
                  <div className="md:col-span-2 space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      Custom Avatar URL
                    </label>
                    <input 
                      type="text"
                      name="avatar"
                      value={editForm.avatar}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>
                )}

              </div>

              {/* Edit Mode Buttons */}
              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-150 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Profile Changes
                  </button>
                </div>
              )}
            </form>
          </div>

        </div>

      </div>
  );
};
