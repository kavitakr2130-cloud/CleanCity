import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Award, Calendar, Hash, BadgeCheck, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface RedeemedReward {
  id: string;
  name: string;
  cost: number;
  date: string;
  code: string;
  status?: string; // e.g., 'Active', 'Redeemed', 'Claimed'
}

export const RewardHistory: React.FC = () => {
  const { user, currentLanguage } = useApp();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<RedeemedReward[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`cleancity_redeemed_rewards_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure status field is present
        const mapped = parsed.map((item: any) => ({
          ...item,
          status: item.status || (currentLanguage === 'hindi' ? 'सक्रिय / मान्य' : 'Active / Valid')
        }));
        setRewards(mapped);
      } else {
        const defaultHistory = [
          {
            id: 'history_1',
            name: currentLanguage === 'hindi' ? 'देसी पौधा (नीम)' : 'Indigenous Tree Sapling (Neem)',
            cost: 75,
            date: '2026-07-10 14:32',
            code: 'CC-SAP-98F1A',
            status: currentLanguage === 'hindi' ? 'सक्रिय / मान्य' : 'Active / Valid'
          }
        ];
        localStorage.setItem(`cleancity_redeemed_rewards_${user.id}`, JSON.stringify(defaultHistory));
        setRewards(defaultHistory);
      }
    } catch (e) {
      console.error('Error loading redeemed rewards:', e);
    }
  }, [user.id, currentLanguage]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center gap-3">
        <button
          id="back-to-profile-btn"
          onClick={() => navigate('/profile')}
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-100 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="Back to Profile"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">
            {currentLanguage === 'hindi' ? 'पुरस्कार इतिहास' : 'Redeemed Reward History'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {currentLanguage === 'hindi' ? 'दावा किए गए वाउचर और लाभ' : 'Claimed Vouchers & Benefits'}
          </p>
        </div>
      </div>

      {/* Rewards List Container */}
      <div id="reward-history-container" className="space-y-4">
        {rewards.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>
            <p className="text-xs font-black text-slate-700">
              {currentLanguage === 'hindi' ? 'कोई पुरस्कार नहीं मिला' : 'No Redeemed Rewards'}
            </p>
            <p className="text-[11px] text-slate-400 font-medium max-w-xs mx-auto">
              {currentLanguage === 'hindi' 
                ? 'अभी तक कोई पुरस्कार प्राप्त नहीं किया गया है। क्लीनपॉइंट्स अर्जित करने के लिए शिकायतें हल करवाएं।'
                : 'You have not redeemed any rewards yet. Solve municipal complaints to earn CleanPoints and claim rewards.'}
            </p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              {currentLanguage === 'hindi' ? 'स्टोर पर जाएं' : 'Go to Reward Store'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 text-left transition-all hover:border-slate-200"
              >
                {/* Top header row */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100/50">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-800 leading-tight truncate">{reward.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        {reward.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="inline-block text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      -{reward.cost} Pts
                    </span>
                  </div>
                </div>

                {/* Details list inside card */}
                <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Redemption ID</span>
                    <p className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      {reward.code}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Status</span>
                    <p className="text-xs font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                      {reward.status}
                    </p>
                  </div>
                </div>

                {/* Interactive visual note to present to municipal officers */}
                <p className="text-[9px] text-slate-400 font-semibold text-center italic border-t border-slate-50 pt-2.5">
                  {currentLanguage === 'hindi'
                    ? 'अधिकारियों को दावों का सत्यापन कराने के लिए यह कूपन आईडी प्रस्तुत करें।'
                    : 'Show this unique Coupon ID / QR reference to corresponding service counters to avail your benefit.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick summary of rewards system */}
      <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/30 text-emerald-800 flex items-start gap-2.5 text-left">
        <Award className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div className="space-y-1">
          <h5 className="text-[11px] font-black uppercase tracking-wider">{currentLanguage === 'hindi' ? 'क्लीनपॉइंट्स लाभ नियम' : 'CleanPoints Voucher Rules'}</h5>
          <p className="text-[10px] leading-relaxed text-emerald-700">
            {currentLanguage === 'hindi'
              ? 'प्रत्येक कूपन केवल एक बार उपयोग के लिए मान्य है। आपके वर्तमान स्तर के आधार पर विशेष छूट और अतिरिक्त वाउचर हर महीने रीफ्रेश होते हैं।'
              : 'Each voucher/code generated is valid for single-use. Depending on your current Citizen Rank, exclusive offers and benefits might refresh monthly.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RewardHistory;
