import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Map, FileText, Award, Bell, ArrowLeft, Menu, LogOut, Users, Truck, BarChart2, Settings, Search, Globe, CheckCircle, MessageSquare, Camera, User, HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp, languageOptions } from '../context/AppContext';
import { Logo } from './Logo';
import { getNotifications } from "../services/api";
import {
  getAdminNotifications,
  
  markAdminNotificationRead,
  clearAdminNotifications
} from "../services/api";

export const CitizenLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
 const {
  user,
  logoutUser,
  currentLanguage,
  setLanguage,
  showLanguageModal,
  setShowLanguageModal,
  t
} = useApp();
const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
React.useEffect(() => {
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();

      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  if (user) {
    loadNotifications();
  }
}, [user, location.pathname]);


  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  console.log("Unread count:", unreadCount);
console.log("Notifications:", notifications);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path.startsWith('/submit')) return 'submit';
    if (path.startsWith('/history') || path.startsWith('/complaint')) return 'complaints';
    if (path.startsWith('/feedback')) return 'feedback';
    return '';
  };

  const activeTab = getActiveTab();

  const handleBack = () => {
    if (location.pathname === '/' || location.pathname === '/home') {
      return;
    }
    navigate(-1);
  };

  const isHome = location.pathname === '/' || location.pathname === '/home';

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen pb-20 flex flex-col font-sans">
      {/* Top App Bar */}
      <header className="flex justify-between items-center w-full px-4 h-16 bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          {!isHome ? (
            <button
              onClick={handleBack}
              className="hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              id="citizen-back-btn"
            >
              <ArrowLeft className="w-5 h-5 text-emerald-700" />
            </button>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-600 focus:outline-none cursor-pointer"
              >
                <img className="w-full h-full object-cover" src={user.avatar} alt="User" />
              </button>
              {showDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-bold"
                    onClick={() => setShowDropdown(false)}
                  >
                    {t('profile')}
                  </Link>
                  <Link 
                    to="/settings" 
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-bold"
                    onClick={() => setShowDropdown(false)}
                  >
                    {t('settings')}
                  </Link>
                  <hr className="my-1 border-slate-100" />
                  <button 
                    onClick={() => {
                      logoutUser();
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> {t('logout')}
                  </button>
                </div>
              )}
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {isHome
                ? (localStorage.getItem("hasLoggedIn")
                    ? (currentLanguage === "hindi" ? "वापसी पर स्वागत है" : "Welcome Back")
                    : (currentLanguage === "hindi" ? "स्वागत है" : "Welcome"))
                : "CleanCity"}
           </p>

            <h1 className="text-sm font-black text-emerald-800 leading-tight">
              {isHome ? "👋" : t("report_btn")}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Language Trigger Button */}
          <button
            onClick={() => setShowLanguageModal(true)}
            className="hover:bg-slate-100 rounded-full p-2.5 transition-colors relative text-slate-600 flex items-center justify-center cursor-pointer"
            title="Choose Language"
          >
            <Globe className="w-5 h-5" />
          </button>

          <Link
            to="/notifications"
            className="hover:bg-slate-100 rounded-full p-2.5 transition-colors relative flex items-center justify-center"
            id="citizen-notification-btn"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </Link>
        </div>
      </header>

      {/* Main Content Scroll Container */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] flex justify-around items-center z-40">
        <Link
          to="/home"
          className={`flex flex-col items-center justify-center py-1 px-4 transition-all rounded-xl ${
            activeTab === 'home'
              ? 'bg-emerald-50 text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-bold'
          }`}
          id="nav-home-tab"
        >
          <Home className="w-4 h-4" />
          <span className="text-[9px] tracking-wide mt-1">{t('dashboard')}</span>
        </Link>

        <Link
          to="/submit"
          className={`flex flex-col items-center justify-center py-1 px-4 transition-all rounded-xl ${
            activeTab === 'submit'
              ? 'bg-emerald-50 text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-bold'
          }`}
          id="nav-submit-tab"
        >
          <Camera className="w-4 h-4" />
          <span className="text-[9px] tracking-wide mt-1">{currentLanguage === 'hindi' ? 'शिकायत दर्ज करें' : 'Report Complaint'}</span>
        </Link>

        <Link
          to="/history"
          className={`flex flex-col items-center justify-center py-1 px-4 transition-all rounded-xl ${
            activeTab === 'complaints'
              ? 'bg-emerald-50 text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-bold'
          }`}
          id="nav-complaints-tab"
        >
          <FileText className="w-4 h-4" />
          <span className="text-[9px] tracking-wide mt-1">{t('my_complaints')}</span>
        </Link>

        <Link
          to="/feedback"
          className={`flex flex-col items-center justify-center py-1 px-4 transition-all rounded-xl ${
            activeTab === 'feedback'
              ? 'bg-emerald-50 text-emerald-700 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-bold'
          }`}
          id="nav-feedback-tab"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[9px] tracking-wide mt-1">{currentLanguage === 'hindi' ? 'प्रतिपुष्टि' : 'Feedback'}</span>
        </Link>
      </nav>

      {/* Language Selection Modal Overlay (Shown after login or when clicked) */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 max-h-[85vh]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-700">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">Choose Language</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ऐप भाषा का चयन करें</p>
              </div>
            </div>

            <div className="overflow-y-auto space-y-1 flex-1 pr-1 custom-scrollbar">
              {languageOptions.map((opt) => {
                const isSelected = currentLanguage === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setLanguage(opt.value)}
                    className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold'
                        : 'hover:bg-slate-50 border border-transparent text-slate-700 font-bold'
                    }`}
                  >
                    <span className="text-xs">{opt.label}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowLanguageModal(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              {currentLanguage === 'hindi' ? 'सहेजें और जारी रखें' : 'Save & Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logoutUser, authoritySubRole, setAuthoritySubRole, complaints, feedbacks } = useApp();

const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
React.useEffect(() => {
  const loadNotifications = async () => {
    const data = await getAdminNotifications();

    if (data.notifications) {
      setNotifications(data.notifications);
    }
  };

  loadNotifications();
}, [location.pathname]);
 const isAdminDashboard =
  location.pathname === "/admin/dashboard";

  const handleAdminBack = () => {
    if (isAdminDashboard) return;
    navigate(-1);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getMenuItems = () => {
    switch (authoritySubRole) {
   case 'Supervisor':
  return [
    { label: 'Zone Dashboard', path: '/supervisor/dashboard', icon: Home },
    { label: 'Zone Complaints', path: '/supervisor/complaints', icon: FileText },

    // Temporarily hidden until these pages are completed
    // { label: 'GIS Hotspots Map', path: '/supervisor/map', icon: Map },
    // { label: 'Zone Reports', path: '/supervisor/reports', icon: BarChart2 },
  ];
    case 'Field Worker':
  return [
    { label: 'My Tasks Dashboard', path: '/worker/dashboard', icon: Home },

    // Temporarily hidden until the Tasks Map & GPS page is completed
    // { label: 'Tasks Map & GPS', path: '/worker/map', icon: Map },
  ];
     case 'Admin':
default:
  return [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: Home },
    { label: 'Complaint Management', path: '/admin/complaints', icon: FileText },

    // Temporarily hidden until these pages are completed
    // { label: 'GIS Live Map', path: '/admin/map', icon: Map },
    // { label: 'Analytics & Reports', path: '/admin/reports', icon: BarChart2 },
  ];
    }
  };

  const menuItems = getMenuItems();

  const getRoleDetails = () => {
    switch (authoritySubRole) {
     case 'Supervisor':
  return {
    title: 'Supervisor Portal',
    subtitle: 'Zone Supervisor',
    name: 'Rahul Sharma',
    roleLabel: 'Shivajinagar Zone',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  };
      case 'Field Worker':
        return {
          title: 'Worker Portal',
          subtitle: 'Sanitation Worker',
          name: 'Crew Leader Amit',
          roleLabel: 'Field Crew #4 (Idle)',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        };
      case 'Admin':
      default:
        return {
          title: 'Admin Portal',
          subtitle: 'Central Administrator',
          name: 'Admin Dispatcher',
          roleLabel: 'Central Control',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        };
    }
  };

  const roleDetails = getRoleDetails();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex h-screen overflow-hidden font-sans">
      {/* Desktop Sidebar Navigation Drawer */}
      <aside className="hidden md:flex flex-col h-screen w-72 bg-slate-900 text-slate-100 border-r border-slate-800 z-40 pt-6 transition-all duration-300 flex-shrink-0">
        {/* Header Branding */}
        <div className="px-6 pb-6 flex items-center gap-3 border-b border-slate-800">
          <Logo size={40} className="rounded-full overflow-hidden bg-slate-800/50 p-0.5 border border-slate-700" />
          <div>
            <h2 className="font-bold text-white text-sm leading-tight">{roleDetails.title}</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{roleDetails.subtitle}</p>
          </div>
        </div>



        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-950/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Log Out Block */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/50 transition-all group cursor-pointer"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Right Side Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top App Bar */}
        <header className="flex justify-between items-center w-full px-6 py-4 h-16 bg-white border-b border-slate-100 shadow-xs z-30 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            {!isAdminDashboard && (
              <button
                onClick={handleAdminBack}
                className="hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
                id="admin-back-btn"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5 text-emerald-700" />
              </button>
            )}
            <h1 className="text-lg font-extrabold text-emerald-800 tracking-tight flex items-center gap-2">
              CleanCity <span className="hidden sm:inline text-[10px] font-normal bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{roleDetails.subtitle}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search complaint, team, ward..."
                className="bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64 transition-all"
              />
            </div>

            {/* Interactive Admin Notification Dropdown Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="hover:bg-slate-100 rounded-full p-2.5 transition-colors relative cursor-pointer flex items-center justify-center"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {(() => {
                  const getDynamicAlerts = () => {
                    const list: { id: string; type: string; title: string; desc: string; time: string; icon: string; badge: string; colorClass: string }[] = [];
                    if (!complaints) return list;

                    complaints.forEach(c => {
                      if (c.status === 'SUBMITTED' && (c.priority === 'HIGH' || c.priority === 'URGENT')) {
                        list.push({
                          id: `lay_high_${c.id}`,
                          type: 'priority',
                          title: `New Dispatch Required`,
                          desc: `Case ${c.id} (${c.category}) needs dispatch.`,
                          time: c.submitTime || 'Just now',
                          icon: '⚠️',
                          badge: 'DISPATCH',
                          colorClass: 'bg-red-50 text-red-700 border-red-100'
                        });
                      }
                    });

                    complaints.forEach(c => {
                      if (c.status !== 'RESOLVED' && c.afterImage) {
                        list.push({
                          id: `lay_photo_${c.id}`,
                          type: 'photo',
                          title: `Proof Photo Uploaded`,
                          desc: `Resolution proof uploaded for ${c.id}.`,
                          time: c.resolveTime || 'Recently',
                          icon: '📸',
                          badge: 'VERIFY',
                          colorClass: 'bg-purple-50 text-purple-700 border-purple-100'
                        });
                      }
                    });

                    if (feedbacks) {
                      feedbacks.forEach(fb => {
                        const c = complaints.find(comp => comp.id === fb.complaintId);
                        if (c && c.status === 'RESOLVED') {
                          list.push({
                            id: `lay_fb_${fb.id}`,
                            type: 'feedback',
                            title: `Feedback: ${fb.overallExperience}/5★`,
                            desc: `"${fb.citizenComment}"`,
                            time: fb.submissionDate || 'Recently',
                            icon: '⭐',
                            badge: 'FEEDBACK',
                            colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          });
                        }
                      });
                    }

                    return list;
                  };

                 const alertsList = notifications;
                  const count = alertsList.length;

                  return (
                    <>
                      {count > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
                      )}

                      {notifDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 p-4 text-left space-y-3 animate-slide-up">
                          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">System Alerts ({count})</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifDropdownOpen(false);
                              }}
                              className="text-xs font-black text-slate-400 hover:text-slate-600"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                            {count === 0 ? (
                              <div className="p-6 text-center text-slate-400 text-[10px] font-bold">
                                🔔 Telemetry nominal. No pending alerts.
                              </div>
                            ) : (
                              alertsList.map((alert) => (
                                <div 
                                 key={alert.notification_id}
                                 onClick={async () => {
                                    await markAdminNotificationRead(alert.notification_id);

                                    setNotifications(prev =>
                                      prev.map(n =>
                                        n.notification_id === alert.notification_id
                                          ? { ...n, is_read: true }
                                          : n
                                      )
                                    );

                                    setNotifDropdownOpen(false);

                                    navigate(
                                      authoritySubRole === "Supervisor"
                                        ? "/supervisor/dashboard"
                                        : authoritySubRole === "Field Worker"
                                        ? "/worker/dashboard"
                                        : "/admin/dashboard"
                                    );
                                  }}
                                  className={`p-2.5 rounded-xl border flex gap-2 items-start hover:bg-slate-50 cursor-pointer transition-colors ${alert.colorClass}`}
                                >
                                  <span className="text-xs mt-0.5">{alert.icon}</span>
                                  <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[8px] font-black uppercase tracking-wider">{alert.badge}</span>
                                      <span className="text-[8px] opacity-80 font-semibold">{alert.time}</span>
                                    </div>
                                    <h5 className="text-[10px] font-black mt-1 truncate">{alert.title}</h5>
                                    <p className="text-[9px] opacity-90 truncate mt-0.5">{alert.message}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </button>
            </div>

            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 border-l border-slate-100 pl-4 cursor-pointer hover:bg-slate-50/80 p-1.5 rounded-xl transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-50 shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    src={roleDetails.avatar}
                    alt={roleDetails.name}
                  />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-bold text-slate-800">{roleDetails.name}</p>
                  <p className="text-[9px] text-slate-500">{roleDetails.roleLabel}</p>
                </div>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 py-1.5 text-left animate-slide-up">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      if (authoritySubRole === "Admin") {
  navigate("/admin/profile");
} else if (authoritySubRole === "Supervisor") {
  navigate("/supervisor/profile");
} else {
  navigate("/worker/profile");
}
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors cursor-pointer text-left"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                     if (authoritySubRole === "Admin") {
  navigate("/admin/settings");
} else if (authoritySubRole === "Supervisor") {
  navigate("/supervisor/settings");
} else {
  navigate("/worker/settings");
}
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      alert('CleanCity Admin Support: If you need assistance with assigning tickets, GIS calibration, or dispatching crews, please contact our support desk at support@cleancity.gov or dial extension 4100.');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors cursor-pointer text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    Help
                  </button>
                  <div className="border-t border-slate-100 my-1.5"></div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
 
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative flex-grow-0 flex-shrink-0 flex flex-col max-w-xs w-72 bg-slate-900 text-slate-100 pt-5 pb-4 z-10 shadow-2xl"
              >
                <div className="px-6 pb-6 flex items-center gap-3 border-b border-slate-800">
                  <Logo size={36} className="rounded-full overflow-hidden bg-slate-800/50 p-0.5 border border-slate-700" />
                  <div>
                    <h2 className="font-bold text-white text-xs">{roleDetails.title}</h2>
                    <p className="text-[10px] text-slate-400">{roleDetails.subtitle}</p>
                  </div>
                </div>
 

 
                <nav className="mt-2 px-3 space-y-1 overflow-y-auto flex-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
 
                <div className="p-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:bg-red-950/30 hover:text-red-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Content Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
