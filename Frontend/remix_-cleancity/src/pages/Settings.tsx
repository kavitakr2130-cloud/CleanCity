import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Globe, Bell, ShieldCheck, Phone, LogOut, HelpCircle, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Settings: React.FC = () => {
  const { user, logoutUser, currentLanguage, setLanguage, t, currentRole, authoritySubRole, updateUserProfile } = useApp();
  const navigate = useNavigate();

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [bulletinAlerts, setBulletinAlerts] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    updateUserProfile(user.name, user.email || '', user.phoneNumber, newPassword, user.avatar);
    setPasswordSuccess('Password updated successfully!');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const LANGUAGES_LIST = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'हिन्दी (Hindi)' },
    { value: 'marathi', label: 'मराठी (Marathi)' },
    { value: 'bengali', label: 'बंगाली (Bengali)' },
    { value: 'tamil', label: 'तमिल (Tamil)' },
    { value: 'telugu', label: 'తెలుగు (Telugu)' },
    { value: 'kannada', label: 'ಕನ್ನಡ (Kannada)' },
    { value: 'malayalam', label: 'मलयालम (Malayalam)' },
    { value: 'gujarati', label: 'गुजराती (Gujarati)' },
    { value: 'punjabi', label: 'पंजाबी (Punjabi)' },
    { value: 'odia', label: 'ओड़िया (Odia)' }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            {currentLanguage === 'hindi' ? 'प्राथमिकताएं और सेटिंग्स' : 'Preferences & Settings'}
          </h2>
        
        </div>
      </div>

      {/* Profile summary banner */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100 flex-shrink-0">
            <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800">{user.name}</h3>
            {currentRole === 'admin' ? (
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                {authoritySubRole === 'Admin' ? 'Central Admin Dispatcher' : authoritySubRole === 'Supervisor' ? 'Zone Supervisor' : 'Field crew leader'} • Secure Access
              </p>
            ) : null}
             
          </div>
        </div>
        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
          <UserCheck className="w-4 h-4" />
        </div>
      </section>

      {/* Language Section */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <Globe className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'भाषा चयन' : 'Language Preference'}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {LANGUAGES_LIST.map((lang) => (
            <button
              key={lang.value}
              onClick={() => setLanguage(lang.value)}
              className={`py-2.5 px-3 rounded-xl border text-[10px] font-black tracking-tight transition-all cursor-pointer ${
                currentLanguage === lang.value
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-600'
                  : 'bg-white text-slate-500 border-slate-250 hover:bg-slate-50'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>


      {/* Change Password Section for secure pre-created Government Accounts */}
      {currentRole === 'admin' && (
        <section id="gov-password-change-card" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Change Password
            </h3>
          </div>

          <form id="gov-password-change-form" onSubmit={handlePasswordChange} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label htmlFor="new-password-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                New Password
              </label>
              <input
                id="new-password-input"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3.5 py-3 border border-slate-200 focus:border-emerald-600 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm-password-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password-input"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3.5 py-3 border border-slate-200 focus:border-emerald-600 rounded-xl bg-slate-50 text-xs font-semibold focus:outline-none text-slate-800"
              />
            </div>
            {passwordError && (
              <p id="password-change-error" className="text-[11px] font-bold text-red-500 ml-1">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p id="password-change-success" className="text-[11px] font-bold text-emerald-600 ml-1">{passwordSuccess}</p>
            )}
            <button
              id="submit-password-change-btn"
              type="submit"
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-98 cursor-pointer mt-2"
            >
              Update Password
            </button>
          </form>
        </section>
      )}

      {/* Support & Help Contact */}
      <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'मदद और नगरपालिका संपर्क' : 'Help & Municipal Contacts'}
          </h3>
        </div>

        <div className="space-y-3 pt-1">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-extrabold text-slate-800">
                {currentLanguage === 'hindi' ? 'सिटीजन हेल्पलाइन' : 'Citizen Helpline'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Direct reporting hot-channel</p>
            </div>
            <a href="tel:1800555311" className="text-emerald-600 font-bold hover:underline">
              1800-555-0199
            </a>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-extrabold text-slate-800">
                {currentLanguage === 'hindi' ? 'नगरपालिका प्रेषण कार्यालय' : 'Municipal Dispatch Office'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium font-mono">General administrative support</p>
            </div>
            <a href="mailto:support@cleancity.gov" className="text-emerald-600 font-bold hover:underline">
              support@cleancity.gov
            </a>
          </div>
        </div>
      </section>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-4 rounded-xl border border-red-200 hover:border-red-500 hover:bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        {currentLanguage === 'hindi' ? 'खाता लॉग आउट करें' : 'Log Out of Account'}
      </button>
    </div>
  );
};
