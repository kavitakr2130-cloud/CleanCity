import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Award, Clock, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TranslatedText } from '../components/TranslatedText';
import {
  getNotifications,
  markNotificationRead,
  clearNotificationsAPI
} from "../services/api";

export const Notifications: React.FC = () => {
const {
  currentLanguage,
  notifications,
  setNotifications
} = useApp();


  const navigate = useNavigate();
  useEffect(() => {
  const loadNotifications = async () => {
    const data = await getNotifications();
    console.log(data);
console.log(data.notifications);

    if (data.notifications) {
      for (const n of data.notifications) {
  if (!n.is_read) {
    await markNotificationRead(n.notification_id);
  }
}

      const updated = await getNotifications();
     setNotifications(
  (updated.notifications || []).map((n: any) => ({
    id: String(n.notification_id),
    title: n.title,
    message: n.message,
    time: n.created_at,
    read: n.is_read === 1,
    complaintId: undefined
  }))
);
    }
  };

  loadNotifications();
}, []);
 const handleNotifClick = async (id: number, complaintId?: number) => {
  await markNotificationRead(id);

 setNotifications((prev: any[]) =>
    prev.map((n: any) =>
      n.id === id
       ? { ...n, read: true }
        : n
    )
  );

  if (complaintId) {
    navigate(`/complaint/${complaintId}`);
  }
};

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            {currentLanguage === 'hindi' ? 'सूचनाएं' : 'Alert Notifications'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {currentLanguage === 'hindi' ? 'आपके द्वारा दर्ज शिकायतों की लाइव स्थिति' : 'Live status updates regarding your reported issues'}
          </p>
        </div>
        {notifications.length > 0 && (
          <button
           onClick={async () => {
                await clearNotificationsAPI();
                setNotifications([]);
              }}
           className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-100 hover:bg-red-50 text-[10px] font-bold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {currentLanguage === 'hindi' ? 'सभी हटाएं' : 'Clear All'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h4 className="text-sm font-black text-slate-500">
              {currentLanguage === 'hindi' ? 'कोई सूचना नहीं!' : 'Inbox is clean!'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
              {currentLanguage === 'hindi' 
                ? 'जब नगरपालिका दल आपकी शिकायत सत्यापित या हल करेगा, तब आपको यहाँ सूचना मिलेगी।' 
                : "You'll receive alert updates when our dispatch team verifies or clears your reports."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isAward = n.title.includes('Points') || n.title.includes('क्लीनपॉइंट्स');
            return (
              <div
               key={n.id}
              onClick={() => handleNotifClick(Number(n.id))}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-start ${
                 n.read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-emerald-50/40 border-emerald-100/50 shadow-sm text-slate-900 font-medium'
                }`}
              >
                {/* Icon wrapper */}
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                  isAward
                    ? 'bg-amber-100 text-amber-700'
                    :n.read
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isAward ? <Award className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </div>

                {/* Text details */}
                <div className="flex-grow space-y-1 min-w-0">
                  <div className="flex justify-between items-center gap-2 text-left">
                    <h3 className={`text-xs font-extrabold truncate ${n.read ? 'text-slate-700' : 'text-slate-950'}`}>
                      <TranslatedText text={n.title} />
                    </h3>
                    <span className="text-[8px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                     {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed text-left">
                    <TranslatedText text={n.message} />
                  </p>
                  {!n.read && (
                    <span className="inline-block text-[8px] font-black tracking-widest text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full uppercase">
                      {currentLanguage === 'hindi' ? 'नया अपडेट' : 'New Update'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
