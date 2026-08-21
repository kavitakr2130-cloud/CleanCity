import React, { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile, BASE_URL } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Award, Sparkles, CheckCircle2, Gift, Check, Edit3, Camera, Upload, X, 
  Video, VideoOff, AlertCircle, Mail, Phone, User, Hash, Bell, LogOut, 
  ShieldCheck, ArrowRight, Bookmark, ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
];

export const Profile: React.FC = () => {
const { complaints, updateUserProfile, logoutUser, t, currentLanguage } = useApp();

const [user, setUser] = useState<any>(null);

useEffect(() => {
  const loadProfile = async () => {
    const data = await getProfile();

    console.log("PROFILE API DATA:", data.user);

    setUser(data.user);
    setPoints(data.user.clean_points || 0);
    setEditName(data.user.full_name || "");
    setEditEmail(data.user.email || "");
    setEditPhone(data.user.mobile_number || "");

    if (data.user.profile_photo) {
      const photoPath = data.user.profile_photo.replace(/\\/g, "/");
      setEditAvatar(`${BASE_URL}/${photoPath}`);
    } else {
      setEditAvatar(AVATAR_PRESETS[0]);
    }
  };

  loadProfile();
}, []);

  const navigate = useNavigate();

  const [points, setPoints] = useState(0);
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);

  // Profile Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  
  // Notification Settings states
  const [pushNotifications, setPushNotifications] = useState(() => {
    return localStorage.getItem('cleancity_push_notifications') !== 'false';
  });
  const [smsAlerts, setSmsAlerts] = useState(() => {
    return localStorage.getItem('cleancity_sms_alerts') !== 'false';
  });
 

  // Camera & Upload states for Profile Edit
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reward History state
  const [redeemedRewards, setRedeemedRewards] = useState<{
    id: string;
    name: string;
    cost: number;
    date: string;
    code: string;
  }[]>([]);
   

  // Load Redeemed Rewards History
  useEffect(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(`cleancity_redeemed_rewards_${user.user_id}`);
      if (stored) {
        setRedeemedRewards(JSON.parse(stored));
      } else {
        const defaultHistory = [
          {
            id: 'history_1',
            name: currentLanguage === 'hindi' ? 'देसी पौधा (नीम)' : 'Indigenous Tree Sapling (Neem)',
            cost: 75,
            date: '2026-07-10 14:32',
            code: 'CC-SAP-98F1A'
          }
        ];
        localStorage.setItem(`cleancity_redeemed_rewards_${user.user_id}`, JSON.stringify(defaultHistory));
        setRedeemedRewards(defaultHistory);
      }
    } catch (e) {
      console.error('Error loading redeemed rewards:', e);
    }
  }, [user, currentLanguage]);

  // Keep state in sync if context user changes
useEffect(() => {
  if (!user) return;

  setEditName(user.full_name || '');
  setEditEmail(user.email || '');
  setEditPhone(user.mobile_number || '');
  setPoints(user.clean_points || 0);
}, [user]);

  // Camera stream source binding
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraActive]);

  // Clean up camera stream on unmount or mode change
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);
  if (!user) {
  return <div className="p-8 text-center">Loading Profile...</div>;
  }

  // Camera handling
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported or disabled in this iframe context.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setCameraStream(stream);
    } catch (err: any) {
      console.error("Profile camera error:", err);
      setCameraError(err.message || "Failed to access front camera.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 300;
        canvas.height = video.videoHeight || 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setEditAvatar(dataUrl);
          stopCamera();
        }
      } catch (err) {
        console.error("Error capturing profile photo:", err);
        alert("Failed to capture image frame.");
      }
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (file) {
    setProfilePhotoFile(file);

    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        setEditAvatar(event.target.result as string);
      }
    };

    reader.readAsDataURL(file);
  }
};

const handleSave = async () => {
  if (!editName.trim()) {
    alert("Name cannot be empty.");
    return;
  }

  if (!editPhone.trim()) {
    alert("Mobile number cannot be empty.");
    return;
  }

  try {
    const response = await updateProfile(
  editName,
  editEmail,
  editPhone,
  profilePhotoFile
);

    updateUserProfile(
      editName,
      editEmail,
      editPhone,
      undefined,
      editAvatar
    );

    setUser((prev: any) => ({
      ...prev,
      full_name: editName,
      email: editEmail,
      mobile_number: editPhone,
    }));

    setIsEditing(false);

    setRedeemMessage(
      currentLanguage === "hindi"
        ? "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!"
        : "Profile updated successfully!"
    );

    setTimeout(() => setRedeemMessage(null), 3000);

  } catch (err) {
    console.error(err);
    alert("Failed to update profile.");
  }
};

  const handlePushToggle = () => {
    const val = !pushNotifications;
    setPushNotifications(val);
    localStorage.setItem('cleancity_push_notifications', String(val));
    setRedeemMessage(
      val 
        ? (currentLanguage === 'hindi' ? 'पुश सूचनाएं सक्षम की गईं!' : 'Push notifications enabled!')
        : (currentLanguage === 'hindi' ? 'पुश सूचनाएं अक्षम की गईं!' : 'Push notifications disabled!')
    );
    setTimeout(() => setRedeemMessage(null), 2500);
  };

  const handleSmsToggle = () => {
    const val = !smsAlerts;
    setSmsAlerts(val);
    localStorage.setItem('cleancity_sms_alerts', String(val));
    setRedeemMessage(
      val 
        ? (currentLanguage === 'hindi' ? 'एसएमएस अलर्ट सक्षम किए गए!' : 'SMS alerts enabled!')
        : (currentLanguage === 'hindi' ? 'एसएमएस अलर्ट अक्षम किए गए!' : 'SMS alerts disabled!')
    );
    setTimeout(() => setRedeemMessage(null), 2500);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  // Stats calculations: show only Total Complaints, Submitted, and Resolved
 const totalReported = user?.total_complaints || 0;
const totalSubmitted = user?.submitted_complaints || 0;
const totalResolved = user?.resolved_complaints || 0;

  const rewardItems = [
    { 
      id: 'item_1', 
      name: currentLanguage === 'hindi' ? 'मेट्रो/बस ट्रांजिट पास' : 'Metro/Bus Transit Pass', 
      cost: 100, 
      desc: currentLanguage === 'hindi' ? 'शहर के सभी मेट्रो और बस रूट पर १ निःशुल्क सवारी पास।' : '1-Ride validation pass across all public city buses and metro rail routes.', 
      icon: '🚌' 
    },
    { 
      id: 'item_2', 
      name: currentLanguage === 'hindi' ? 'जैविक खाद बोरी' : 'Premium Organic Compost Bag', 
      cost: 150, 
      desc: currentLanguage === 'hindi' ? 'नगरपालिका संयंत्र से १० किलोग्राम प्रीमियम जैविक खाद।' : '10kg organic nutrient-rich soil compost bag produced by city waste sorting plants.', 
      icon: '🌱' 
    },
    { 
      id: 'item_3', 
      name: currentLanguage === 'hindi' ? 'देसी पौधा' : 'Indigenous Tree Sapling', 
      cost: 75, 
      desc: currentLanguage === 'hindi' ? 'नगरपालिका वन नर्सरी से नीम, पीपल या तुलसी का पौधा।' : 'Choose from Neem, Peepal, or Tulsi saplings from the Municipal Forest Nursery.', 
      icon: '🌳' 
    },
    { 
      id: 'item_4', 
      name: currentLanguage === 'hindi' ? 'नगरपालिका सेवा कूपन' : 'Municipal Service Coupon', 
      cost: 250, 
      desc: currentLanguage === 'hindi' ? 'अगले कचरा संग्रहण या जल उपयोगिता बिल पर २०% की छूट।' : '20% discount coupon on your next municipal waste-collection or water utility bill.', 
      icon: '🎫' 
    },
  ];

  const handleRedeem = (name: string, cost: number) => {
    if (points < cost) {
      alert(currentLanguage === 'hindi' ? 'आपके पास पर्याप्त क्लीनपॉइंट नहीं हैं!' : "Oops! You don't have enough CleanPoints to redeem this reward yet.");
      return;
    }
    
    const newPoints = points - cost;
    setPoints(newPoints);
    updateUserProfile(user.full_name, user.email, user.mobile_number, undefined, user.avatar, newPoints);

    // Add to history
    const couponCode = `CC-${name.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newHistoryItem = {
      id: `history_${Date.now()}`,
      name,
      cost,
      date: nowStr,
      code: couponCode
    };

    const updatedHistory = [newHistoryItem, ...redeemedRewards];
    setRedeemedRewards(updatedHistory);
    localStorage.setItem(`cleancity_redeemed_rewards_${user.user_id}`, JSON.stringify(updatedHistory));

    setRedeemMessage(
      currentLanguage === 'hindi' 
        ? `सफलतापूर्वक दावा किया: ${name}! कूपन कोड: ${couponCode}` 
        : `Successfully redeemed: ${name}! Code: ${couponCode}`
    );
    setTimeout(() => setRedeemMessage(null), 4000);
  };

  const getNextRank = () => {
    if (user.rank === 'BRONZE') return { name: 'SILVER', target: 1000 };
    if (user.rank === 'SILVER') return { name: 'GOLD', target: 1500 };
    if (user.rank === 'GOLD') return { name: 'PLATINUM', target: 2000 };
    return { name: 'ELITE', target: 5000 };
  };

  const nextRank = getNextRank();
  const currentLevelMin = user.rank === 'SILVER' ? 1000 : user.rank === 'GOLD' ? 1500 : 0;
  const progressPercent = Math.min(
    Math.max(((points - currentLevelMin) / (nextRank.target - currentLevelMin)) * 100, 0),
    100
  );

  return (
    <div className="space-y-6">
      {/* Citizen Card Block / Editor Panel */}
      {isEditing ? (
        <section id="edit-profile-card" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5 animate-fade-in text-left">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              {currentLanguage === 'hindi' ? 'प्रोफ़ाइल बदलें' : 'Edit Citizen Profile'}
            </h3>
            <button
              id="close-edit-btn"
              onClick={() => {
                stopCamera();
                setIsEditing(false);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Edit Picture Block */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Profile Photo</label>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative flex-shrink-0 w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-600 bg-slate-900 shadow-md">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img className="w-full h-full object-cover" src={editAvatar} alt="Profile Preview" />
                )}
                {isCameraActive && (
                  <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-pulse" />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="flex gap-2">
                  {isCameraActive ? (
                    <>
                      <button
                        id="capture-selfie-btn"
                        type="button"
                        onClick={capturePhoto}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Capture Selfie
                      </button>
                      <button
                        id="cancel-camera-btn"
                        type="button"
                        onClick={stopCamera}
                        className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <VideoOff className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        id="live-camera-btn"
                        type="button"
                        onClick={startCamera}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Live Camera
                      </button>
                      <button
                        id="gallery-upload-btn"
                        type="button"
                        onClick={handleGalleryClick}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-3.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        From Gallery
                      </button>
                    </>
                  )}
                </div>
                
                {cameraError && (
                  <p className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {cameraError}
                  </p>
                )}
              </div>
            </div>

            {/* CURATED AVATARS */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Curated Avatar Presets</span>
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setEditAvatar(preset);
                    }}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                      editAvatar === preset ? 'border-emerald-600 scale-105 shadow-md' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <img src={preset} className="w-full h-full object-cover" alt={`Preset ${idx + 1}`} />
                    {editAvatar === preset && (
                      <span className="absolute inset-0 bg-emerald-600/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
              <input
                id="edit-name-field"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mobile Number</label>
              <input
                id="edit-phone-field"
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Mobile Number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
              <input
                id="edit-email-field"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              id="save-changes-btn"
              onClick={handleSave}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 px-4 rounded-xl shadow-md shadow-emerald-600/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
            <button
              id="cancel-edit-btn"
              onClick={() => {
                stopCamera();
                setIsEditing(false);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </section>
      ) : (
        <section id="citizen-badge-card" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-600 shadow-md">
              <img className="w-full h-full object-cover" src={user.avatar} alt="Citizen Profile" />
            </div>
            <span className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow border-2 border-white flex items-center justify-center">
              <Award className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-800">{user.full_name}</h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-semibold">
              <Phone className="w-3.5 h-3.5 text-slate-300" />
              <span>{user.mobile_number}</span>
            </div>

             {/*
            <div className="inline-flex gap-2 mt-2">
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
                {user.rank} LEVEL
              </span>
              <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {points} CleanPoints
              </span>
            </div>
            */}
          </div>
          
          
      

          {/* Level Progress Gauge */}
          <div className="w-full space-y-2 pt-3 border-t border-slate-50 text-left">
          {/*
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {currentLanguage === 'hindi' ? `${nextRank.name} स्तर प्रगति` : `Progress to ${nextRank.name}`}
              </span>
              <span>{points} / {nextRank.target} PTS</span>
            </div>
         */}  
               
         {/* 
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
        */}  

           {/* 
            <p className="text-[10px] text-slate-400 font-medium text-center">
              {currentLanguage === 'hindi' 
                ? `अगला स्तर अनलॉक करने के लिए ${nextRank.target - points} और क्लीनपॉइंट अर्जित करें!` 
                : `Earn ${nextRank.target - points} more CleanPoints to unlock higher tier municipal benefits!`}
            </p>
           */}   
          </div>
          
        </section>
        
      )}
      

      {/* Citizen Profile Details Section */}
      <section id="profile-details-card" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <User className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'खाता विवरण' : 'Citizen Account Information'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</span>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {user.full_name}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">User ID</span>
            <p className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 inline-flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              {user.user_id}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</span>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {user.mobile_number}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</span>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user.email || (currentLanguage === 'hindi' ? 'ईमेल लिंक नहीं है' : 'Not linked')}
            </p>
          </div>
           
          {/* 
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Citizen Level</span>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-slate-400" />
             <span>{user.role || "Citizen"}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current CleanPoints</span>
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              {points} Points Available
            </p>
          </div>
          */}

        </div>
      </section>

      {/* Citizen Complaint Statistics Grid */}
      <section id="complaint-stats-section" className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-xl font-black text-slate-800">{totalReported}</p>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'कुल शिकायतें' : 'Total Complaints'}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-xl font-black text-amber-500">{totalSubmitted}</p>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'दर्ज की गई' : 'Submitted'}
          </p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-xl font-black text-emerald-600">{totalResolved}</p>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'सुलझाई गई' : 'Resolved'}
          </p>
        </div>
      </section>

      
      {/* CleanPoints Reward Store & History */}
      {false && (
      <section id="rewards-store-card" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5 text-left">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3 justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-800 leading-none">
              {currentLanguage === 'hindi' ? 'क्लीनपॉइंट्स पुरस्कार स्टोर' : 'CleanPoints Reward Store'}
            </h3>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
            Balance: {points} Pts
          </span>
        </div>

        {/* Informative Disclaimer Note */}
        <div className="p-3 bg-amber-50/55 rounded-xl border border-amber-100 flex items-start gap-2 text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold leading-relaxed">
            {currentLanguage === 'hindi'
              ? 'ध्यान दें: क्लीनपॉइंट केवल शिकायत के सफलतापूर्वक समाधान और सत्यापन के बाद ही प्रदान किए जाते हैं, न कि सबमिशन पर।'
              : 'Notification: CleanPoints are awarded strictly ONLY after a complaint is successfully resolved and verified by municipal officers, not when it is initially submitted.'}
          </p>
        </div>

        {/* Reward Store Items */}
        <div className="space-y-3">
          {rewardItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4"
            >
              <div className="flex gap-3 items-center min-w-0">
                <span className="text-2xl flex-shrink-0 select-none bg-white p-2 rounded-xl shadow-xs border border-slate-100">{item.icon}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-800 truncate">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">{item.desc}</p>
                  <span className="inline-block mt-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Cost: {item.cost} Pts
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleRedeem(item.name, item.cost)}
                disabled={points < item.cost}
                className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold text-xs py-2 px-3.5 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Claim
              </button>
            </div>
          ))}
        </div>

        {/* Reward History Quick Navigation Link */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">
                {currentLanguage === 'hindi' ? 'दावा किए गए पुरस्कारों का इतिहास' : 'Redemption & Reward History'}
              </h4>
              <p className="text-[9px] text-slate-400 font-semibold">
                {currentLanguage === 'hindi' ? 'अपने सभी सक्रिय कूपन और पूर्व दावे देखें' : 'View all redeemed vouchers, coupons & codes'}
              </p>
            </div>
          </div>
          <button
            id="view-reward-history-btn"
            onClick={() => navigate('/reward-history')}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            {currentLanguage === 'hindi' ? 'इतिहास' : 'View History'}
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </section>
      )}

      {/* Profile Actions: Notification Settings & Logout */}
      <section id="actions-and-settings" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
          <Bell className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'सेटिंग्स और क्रियाएं' : 'Account Actions & Settings'}
          </h3>
        </div>

        {/* Notification Settings */}
        <div className="space-y-3 pt-1">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notification Settings</h4>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-black text-slate-700">Push Notifications</p>
              <p className="text-[9px] text-slate-400 font-bold">Receive instant device updates on complaint status changes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={pushNotifications} 
                onChange={handlePushToggle} 
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-xs font-black text-slate-700">SMS Alerts</p>
              <p className="text-[9px] text-slate-400 font-bold">Coming Soon • SMS alerts will be available in a future update.</p>
            </div>
           <label className="relative inline-flex items-center cursor-not-allowed opacity-60">
              <input 
                type="checkbox" 
                checked={smsAlerts} 
               disabled
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Dynamic Change Password placeholder (Hiding it for OTP-only login as requested) */}
        {/* We hide it here entirely since Citizen is OTP-only. No Change Password card is shown. */}

        {/* Profile Actions: Edit Profile & Logout Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
          <button
            id="trigger-edit-profile-btn"
            onClick={() => {
              setEditName(user.full_name);
              setEditEmail(user.email || '');
              setEditPhone(user.mobile_number || '');
              setIsEditing(true);
            }}
            className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            {currentLanguage === 'hindi' ? 'संपादित करें' : 'Edit Profile'}
          </button>
          
          <button
            id="profile-logout-btn"
            onClick={handleLogout}
            className="py-3 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-red-100"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            {currentLanguage === 'hindi' ? 'लॉग आउट' : 'Logout'}
          </button>
        </div>
      </section>

      {/* Dynamic Toast Feedback when Points Gained or Action Taken */}
      {redeemMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2.5 z-50 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold font-sans">{redeemMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Profile;
