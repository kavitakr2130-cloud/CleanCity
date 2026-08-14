import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Key, 
  Mail, 
  Phone, 
  Bell, 
  Sun, 
  Moon, 
  Monitor, 
  Globe, 
  Lock, 
  ShieldAlert, 
  Info, 
  ArrowLeft, 
  ChevronRight, 
  Save, 
  X, 
  CheckCircle,
  HelpCircle,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { AdminLayout } from '../../components/Layouts';

interface SettingsData {
  // Account
  email: string;
  phone: string;
  passwordNew: string;
  passwordConfirm: string;
  pushNotifications: boolean;
  
  // Notifications
  highPriorityAlerts: boolean;
  newComplaintAlerts: boolean;
  workerUploadAlerts: boolean;
  citizenFeedbackAlerts: boolean;
  emailDigest: boolean;
  
  // Appearance & Localization
  theme: 'light' | 'dark' | 'system';
  language: 'English' | 'Hindi';
}

const DEFAULT_SETTINGS: SettingsData = {
  email: 'kavitakr2130@gmail.com',
  phone: '+91 98765 43210',
  passwordNew: '',
  passwordConfirm: '',
  pushNotifications: true,
  highPriorityAlerts: true,
  newComplaintAlerts: true,
  workerUploadAlerts: true,
  citizenFeedbackAlerts: false,
  emailDigest: true,
  
  theme: 'light',
  language: 'English'
};

export const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load existing settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('cleancity_admin_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          passwordNew: '', // clear password inputs for security
          passwordConfirm: ''
        });
      } catch (e) {
        console.error('Error parsing settings from local storage', e);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = (field: keyof SettingsData) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field] as any
    }));
  };

  const handleThemeSelect = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({
      ...prev,
      theme
    }));
  };

 const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  if (settings.passwordNew && settings.passwordNew !== settings.passwordConfirm) {
    alert("Error: New passwords do not match.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const response = await fetch("http://127.0.0.1:5000/admin/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        new_password: settings.passwordNew,
        confirm_password: settings.passwordConfirm,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert("Password changed successfully");

    setSettings(prev => ({
      ...prev,
      passwordNew: "",
      passwordConfirm: "",
    }));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

  } catch (error) {
    console.error("Password update error:", error);
  }
};

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to revert all customized parameters to municipal default standards?')) {
      setSettings(DEFAULT_SETTINGS);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-h-full overflow-y-auto pb-10 text-left">
        
        {/* Header Breadcrumbs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>Dashboard</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600">Console Settings</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">System & Account Settings</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 font-sans">Configure Password,notification,language parameters</p>
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </div>

        {/* Success Prompt banner */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-slide-up">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Operational settings saved successfully. Local database rules & alert hooks have been hot-reloaded.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main settings options column (Left & Middle) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Account Settings Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3 flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Account Settings</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Change current credentials</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
             

               

               

                {/* Change Password (New) */}
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    New Password
                  </label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="passwordNew"
                    value={settings.passwordNew}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-7 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Confirm New Password
                  </label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="passwordConfirm"
                    value={settings.passwordConfirm}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* 2. Notification Settings Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3 flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                  <Bell className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Notification</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Notification updates </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 pt-1">
                
                {/*
                
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">High Priority Complaint Alerts</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Show urgent dispatch requirements on dashboard immediately</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('highPriorityAlerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.highPriorityAlerts ? 'bg-emerald-600' : 'bg-slate-250'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.highPriorityAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

        
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">New Complaint Notifications</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Notify when a citizen submits any new grievance ticket</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('newComplaintAlerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.newComplaintAlerts ? 'bg-emerald-600' : 'bg-slate-250'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.newComplaintAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

              
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Worker Upload Notifications</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Trigger alerts when crews upload visual proof of resolution</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('workerUploadAlerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.workerUploadAlerts ? 'bg-emerald-600' : 'bg-slate-250'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.workerUploadAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Citizen Feedback Notifications</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Notify of feedback ratings below 3 stars immediately</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('citizenFeedbackAlerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.citizenFeedbackAlerts ? 'bg-emerald-600' : 'bg-slate-250'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.citizenFeedbackAlerts ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

          
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Daily Email Digest</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Send daily resolution rate logs to {settings.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('emailDigest')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.emailDigest ? 'bg-emerald-600' : 'bg-slate-250'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.emailDigest ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                */}

  {/* Push Notifications */}
  <div className="flex items-center justify-between py-3">
    <div className="space-y-0.5">
      <span className="text-xs font-bold text-slate-800 block">
        Push Notifications
      </span>
      <span className="text-[10px] text-slate-400 font-medium block">
        Receive complaint assignments, verification updates and system alerts.
      </span>
    </div>

    <button
      type="button"
      onClick={() => handleToggleChange("pushNotifications")}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full ${
        settings.pushNotifications ? "bg-emerald-600" : "bg-slate-250"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          settings.pushNotifications ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
     </div>
               
              </div>
            </div>
        
            
            {/*
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3 flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                  <Sun className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Appearance</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Customize console workspace styling parameters</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
             
                <button
                  type="button"
                  onClick={() => handleThemeSelect('light')}
                  className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all text-center cursor-pointer ${
                    settings.theme === 'light' 
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 shadow-xs' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Sun className={`w-5 h-5 ${settings.theme === 'light' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold">Light Theme</span>
                </button>

             
                <button
                  type="button"
                  onClick={() => handleThemeSelect('dark')}
                  className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all text-center cursor-pointer ${
                    settings.theme === 'dark' 
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 shadow-xs' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Moon className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold">Dark Theme</span>
                </button>

         
                <button
                  type="button"
                  onClick={() => handleThemeSelect('system')}
                  className={`p-4 border rounded-2xl flex flex-col items-center gap-2 transition-all text-center cursor-pointer ${
                    settings.theme === 'system' 
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-800 shadow-xs' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Monitor className={`w-5 h-5 ${settings.theme === 'system' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold">System Theme</span>
                </button>
                
              </div>
              
              
            </div>
            
 */}
            {/* 4. Localization / Language */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3 flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                  <Globe className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Language / क्षेत्रीय भाषा</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Change default language interface for the Admin Console</p>
                </div>
              </div>

              <div className="pt-1">
                <select
                  name="language"
                  value={settings.language}
                  onChange={handleInputChange}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer w-full md:w-64"
                >
                  <option value="English">English (United States)</option>
                  <option value="Hindi">हिन्दी (Hindi)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Right Column (Security, About, Actions) */}
          {false && (
          <div className="space-y-6">
            
            {/* 5. Security & Device Sessions */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3 flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Security</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Active access controls & sessions</p>
                </div>
              </div>

              <div className="space-y-3.5 pt-1">
                {/* 2FA Coming Soon */}
                <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-2xl flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Two Factor Auth</span>
                    <span className="text-[9px] text-amber-600 font-semibold block">Coming Soon (Municipal Security Upgrade Phase 3)</span>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="text-left space-y-1 bg-slate-50/40 border border-slate-100 p-3 rounded-2xl">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Sessions (1)</span>
                  <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold">
                    <span>This Web Browser</span>
                    <span className="text-emerald-600 text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Live Session</span>
                  </div>
                  <span className="text-[8px] text-slate-400 block font-semibold">IP Address: 192.168.1.182 • Bangalore Mainframe</span>
                </div>

                <button
                  type="button"
                  onClick={() => alert('All remote device tokens have been successfully cleared. Current browser token preserved.')}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold transition-all cursor-pointer text-center"
                >
                  Logout from all other devices
                </button>
              </div>
            </div>

            {/* 6. About Municipal Console */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-3 flex items-center gap-2">
                <span className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                  <Info className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">About Console</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Software build logs and legal terms</p>
                </div>
              </div>

              <div className="space-y-3 pt-1 text-left">
                {/* Build version */}
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold">Application Version</span>
                  <span className="text-xs font-black text-slate-700 font-mono">v2.4.0-stable</span>
                </div>

                {/* Municipality Name */}
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold">Municipality</span>
                  <span className="text-[10px] font-bold text-slate-700 text-right">Municipal Corp. of CleanCity</span>
                </div>

                {/* Support contact info */}
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold">Support Desk</span>
                  <a href="mailto:support@cleancity.gov" className="text-[10px] font-extrabold text-emerald-600 hover:underline">
                    support@cleancity.gov
                  </a>
                </div>

                {/* Privacy Policy */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold">Privacy Policy</span>
                  <button 
                    type="button" 
                    onClick={() => alert('Terms of Service & Citizen Privacy: All logs, GPS coordinates, and uploaded photographs are protected under Municipal Data Sovereignty Laws of 2026. Data is preserved locally in sandbox context.')}
                    className="text-[10px] font-extrabold text-emerald-600 hover:underline cursor-pointer"
                  >
                    View Terms
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Form Action Controls (Reset to Defaults) */}
            <div className="bg-slate-50/40 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-semibold mb-2">Need to restore original administrative parameters?</p>
              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Reset to default configuration
              </button>
            </div>

          </div>

          )}

        </div>

      </form>
  );
};
