import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Award, ShieldAlert, Sparkles, MapPin, Eye, CheckCircle2, ChevronRight, Bot, Send, HelpCircle, RefreshCw, User, Megaphone, Clock, AlertCircle, ChevronDown, ChevronUp, Home as HomeIcon, LogOut, FileText, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TranslatedText } from '../components/TranslatedText';
import { useEffect } from "react";
import { getProfile, getMyComplaints } from "../services/api";

export const Home: React.FC = () => {
  const { t, currentLanguage, logoutUser } = useApp();
  const [user, setUser] = useState<any>({});
  const [complaints, setComplaints] = useState<any[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
  const loadDashboard = async () => {
    try {
      const profileData = await getProfile();
      console.log(profileData);

      const complaintData = await getMyComplaints();

      setUser(profileData.user);
      setComplaints(complaintData.complaints || []);
      console.log("Complaints from API:", complaintData.complaints);
    } catch (err) {
      console.error(err);
    }
  };

  loadDashboard();
}, []);
// Filter complaints logged by current user
const citizenComplaints = complaints;

const totalReported = citizenComplaints.length;

const totalSubmitted = citizenComplaints.filter(
  c => c.status === "Submitted"
).length;

const inProgressCount = citizenComplaints.filter(
  c => c.status === "Assigned" || c.status === "In Progress"
).length;

const resolvedCount = citizenComplaints.filter(
  c => c.status === "Resolved"
).length;

  // Sanitation Questions AI Chat Bar State
  const [chatInput, setChatInput] = useState('');
  const [chatResponses, setChatResponses] = useState<{ id: string; sender: 'user' | 'ai'; text: string }[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: currentLanguage === 'hindi' 
        ? "नमस्ते! मैं क्लीनबॉट हूं। मुझसे स्वच्छता या कचरा प्रबंधन के बारे में कुछ भी पूछें।"
        : "Hello! I am CleanBot. Ask me any sanitation or waste management questions, or about earning CleanPoints!"
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Mock Announcements from municipality
  const announcements = [
    {
      id: 'ann_1',
      date: 'Today',
      title: currentLanguage === 'hindi' 
        ? 'स्वच्छता अभियान २०२६: रविवार को विशेष प्लास्टिक-मुक्त अभियान!'
        : 'Swachhata Drive 2026: Special Plastic-Free campaign this Sunday!',
      desc: currentLanguage === 'hindi' 
        ? 'नगर निगम सभी नागरिकों से गीला और सूखा कचरा अलग करने की अपील करता है।'
        : 'The Municipal Corporation urges citizens to separate wet and dry waste.'
    },
    {
      id: 'ann_2',
      date: 'Yesterday',
      title: currentLanguage === 'hindi'
        ? 'आपके वार्ड में नया कचरा ट्रांसफर स्टेशन शुरू किया गया है।'
        : 'New waste transfer station opened in your sector.',
      desc: currentLanguage === 'hindi'
        ? 'कचरा निपटान और परिवहन समय में ३०% की कमी आएगी।'
        : 'This will reduce garbage transport transit times by over 30%.'
    }
  ];

  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      sender: 'user' as const,
      text: questionText
    };

    setChatResponses(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: questionText })
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      setChatResponses(prev => [...prev, {
        id: `ai_${Date.now()}`,
        sender: 'ai' as const,
        text: data.text
      }]);
    } catch {
      // Fallback response with localized context
      setTimeout(() => {
        let answer = "Thank you for asking! For clean streets, report garbage by snapping a photo. Earn 100 CleanPoints upon resolution.";
        const lower = questionText.toLowerCase();
        if (lower.includes('point') || lower.includes('earn') || lower.includes('reward') || lower.includes('पॉइंट') || lower.includes('अंक')) {
          answer = currentLanguage === 'hindi'
            ? "आपको प्रत्येक हल की गई शिकायत के लिए **१०० क्लीनपॉइंट्स (CleanPoints)** मिलते हैं! आप इन्हें अपने प्रोफाइल में रिवार्ड्स के लिए भुना सकते हैं।"
            : "You earn **100 CleanPoints** for every resolved garbage report you log! Redeem them in your Profile for rewards and discounts.";
        } else if (lower.includes('category') || lower.includes('waste') || lower.includes('कचरा') || lower.includes('श्रेणी')) {
          answer = currentLanguage === 'hindi'
            ? "हम कचरे को निम्नलिखित श्रेणियों में वर्गीकृत करते हैं:\n- ♻️ **प्लास्टिक और धातु**\n- 🍎 **जैविक कचरा**\n- ⚠️ **खतरनाक सामग्री**\n- 🪵 **निर्माण कचरा**"
            : "We classify waste into:\n- ♻️ **Plastic & Metal**\n- 🍎 **Organic/Household Waste**\n- ⚠️ **Hazardous Materials**\n- 🪵 **Construction/Debris Waste**";
        }
        setChatResponses(prev => [...prev, {
          id: `ai_${Date.now()}`,
          sender: 'ai' as const,
          text: answer
        }]);
      }, 850);
    } finally {
      setIsChatLoading(false);
    }
  };
  if (!user) {
  return (
    <div className="flex items-center justify-center h-64">
      Loading Dashboard...
    </div>
  );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Slogan Message */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
        <span className="text-2xl">🌿</span>
        <div>
          <p className="text-slate-800 font-extrabold text-sm leading-relaxed">
            {t('welcome_msg')}
          </p>
        </div>
      </div>

      {/* Primary Hero CTA Card: Report Garbage */}
      <section
        onClick={() => navigate('/submit')}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 md:p-8 shadow-xl shadow-emerald-950/20 group cursor-pointer active:scale-[0.99] hover:shadow-2xl transition-all duration-300"
      >
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="bg-white/10 backdrop-blur-md text-white p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
            <Camera className="w-10 h-10 stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-white font-extrabold text-2xl md:text-3xl tracking-tight">
              {t('report_btn')}
            </h2>
            <p className="text-emerald-50 max-w-sm mx-auto text-xs font-medium opacity-90 leading-relaxed">
              {currentLanguage === 'hindi' 
                ? 'कचरे की फोटो लें और भेजें। हमारा एआई मॉडल तुरंत जांच करेगा और १०० अंक इनाम देगा।'
                : 'Snap a photo of the waste to notify authorities instantly. Earn 100 points upon resolution.'}
            </p>
          </div>
          <button className="bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs py-3 px-8 rounded-full shadow-md transition-all">
            {currentLanguage === 'hindi' ? 'शिकायत शुरू करें' : 'Start Reporting'}
          </button>
        </div>

        {/* Dynamic Abstract Background Elements */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-emerald-500/30 rounded-full blur-xl" />
      </section>

      {/* Reward Points and Rank */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
         <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
  {currentLanguage === 'hindi' ? 'कुल शिकायतें' : 'Total Complaints'}
</p>

<div className="mt-2">
  <p className="text-xl font-black text-emerald-800 leading-none">
    {totalReported}
  </p>

  <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">
    {currentLanguage === 'hindi' ? 'इतिहास' : 'History'}
  </p>
</div>
        </div>

        <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'कुल शिकायत' : 'Submitted'}
          </p>
          <div className="mt-2">
            <p className="text-xl font-black text-blue-800 leading-none">{totalSubmitted}</p>
            <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Reports</p>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
            {currentLanguage === 'hindi' ? 'सुलझाई गई' : 'Resolved'}
          </p>
          <div className="mt-2">
            <p className="text-xl font-black text-emerald-800 leading-none">{resolvedCount}</p>
            <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">
              {currentLanguage === 'hindi' ? 'समाधान' : 'Solved'}
            </p>
          </div>
        </div>
      </div>

      {/* My Complaints Summary feed */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 leading-none">
              {t('my_complaints')}
            </h3>
            {totalSubmitted > 0 && (
              <p className="text-[11px] text-slate-400 mt-1">
                {totalSubmitted} {currentLanguage === 'hindi' ? 'कुल दर्ज शिकायतें' : 'total complaints registered'}
              </p>
            )}
          </div>
          <Link
            to="/history"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
          >
            {currentLanguage === 'hindi' ? 'सभी देखें' : 'View All'} <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {citizenComplaints.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-100">
            <p className="text-xs text-slate-400 font-medium">You haven't reported any complaints yet.</p>
            <button
              onClick={() => navigate('/submit')}
              className="text-emerald-600 font-bold text-xs mt-2 inline-block hover:underline"
            >
              Report your first issue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {citizenComplaints.slice(0, 3).map((comp) => (
              <div
                key={comp.complaint_id}
                onClick={() => navigate(`/complaint/${comp.complaint_id}`)}
                className="flex items-center gap-4 p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                 <img src={`http://127.0.0.1:5000/${comp.image_before.replace("\\", "/")}`} alt={comp.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{comp.complaint_code}</span>
                    <span className="text-[10px] text-slate-400">
                      •{comp.submitted_at
                          ? new Date(comp.submitted_at).toLocaleDateString()
                          : "No Date"}
                    </span> 
                  </div>
                  <p className="font-bold text-slate-800 text-xs truncate">
                    <TranslatedText text={comp.description} />
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    <TranslatedText text={comp.category} />
                  </p>
                </div>
                <div>
                  <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                   comp.status === 'Resolved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : comp.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        :comp.status === 'Assigned'|| comp.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                   {comp.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Latest Announcements Board */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('announcements')}
            </h3>
            <h2 className="text-sm font-extrabold text-slate-800">
              {currentLanguage === 'hindi' ? 'नगर निगम घोषणाएं' : 'Municipal Bulletin Board'}
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex gap-3 items-start">
              <div className="p-1 bg-white border border-slate-200 rounded-lg text-[9px] text-slate-400 font-bold uppercase tracking-wider flex-shrink-0">
                {ann.date}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">
                  <TranslatedText text={ann.title} />
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  <TranslatedText text={ann.desc} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ask CleanBot AI Interactive Panel / Chatting Bar (Size Small / Thin) */}
      <section 
        className={`bg-gradient-to-r from-emerald-800 to-slate-950 rounded-2xl shadow-md border border-emerald-950/20 transition-all duration-300 ${
          isChatExpanded ? 'p-5 space-y-3' : 'p-3.5 hover:brightness-105 cursor-pointer active:scale-[0.995]'
        }`}
        onClick={() => {
          if (!isChatExpanded) {
            setIsChatExpanded(true);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/20 text-emerald-300 p-1.5 rounded-lg flex-shrink-0">
              <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-extrabold text-xs">
                {currentLanguage === 'hindi' ? 'क्लीनबॉट एआई सहायक' : 'CleanBot Q&A Assistant'}
              </h3>
              <p className="text-slate-300 text-[10px] font-medium opacity-80 leading-snug">
                {currentLanguage === 'hindi' ? 'गीला/सूखा कचरा और इनाम के बारे में पूछें' : 'Ask anything about recycling or rewards!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isChatExpanded ? (
              <>
                {chatResponses.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatResponses([{ id: 'welcome', sender: 'ai', text: 'Hello! I am CleanBot. Ask me anything about waste management.' }]);
                    }}
                    className="text-[9px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-black border border-slate-700 px-2 py-0.5 rounded-lg bg-slate-800/40"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> {currentLanguage === 'hindi' ? 'साफ़ करें' : 'Clear'}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChatExpanded(false);
                  }}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
                  title="Collapse"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </>
            ) : (
              <ChevronDown className="w-4 h-4 text-emerald-400 animate-bounce" />
            )}
          </div>
        </div>

        {isChatExpanded && (
          <>
            {/* Small box view */}
            <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-[11px] mt-2">
              {chatResponses.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-1.5 max-w-[95%] ${msg.sender === 'ai' ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${
                    msg.sender === 'ai' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
                  }`}>
                    {msg.sender === 'ai' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>
                  <div className={`px-2.5 py-1.5 rounded-xl text-xs font-medium leading-relaxed shadow-xs ${
                    msg.sender === 'ai'
                      ? 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none'
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}>
                    <TranslatedText text={msg.text} />
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-1.5 mr-auto">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                    <Bot className="w-3 h-3 animate-pulse" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl rounded-tl-none px-2.5 py-1 text-[10px] text-slate-300 shadow-xs flex items-center gap-1">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                    <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Queries */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                t('how_to_earn'),
                t('waste_categories'),
                t('resolve_time')
              ].map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAskQuestion(suggestion);
                  }}
                  disabled={isChatLoading}
                  className="text-[9px] font-extrabold text-emerald-300 hover:text-white bg-white/5 hover:bg-white/10 border border-emerald-700/20 px-2 py-0.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAskQuestion(chatInput);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800 mt-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={currentLanguage === 'hindi' ? 'सफाई संबंधी कोई प्रश्न पूछें...' : 'Ask a sanitation question...'}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </>
        )}
      </section>

      {/* Nearby Hotspots Preview */}
      <section
        onClick={() => navigate('/map')}
        className="relative h-44 rounded-2xl overflow-hidden shadow-lg border border-slate-200 cursor-pointer group active:scale-[0.99] transition-transform"
      >
        <div
          className="w-full h-full bg-cover bg-center absolute inset-0 grayscale contrast-75 brightness-75 group-hover:scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent flex flex-col justify-end p-5">
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                <MapPin className="w-4 h-4 fill-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {currentLanguage === 'hindi' ? 'इंटरएक्टिव जीआईएस ट्रैकिंग' : 'Interactive GIS Tracking'}
                </span>
              </div>
              <h3 className="text-white font-extrabold text-base leading-tight">
                {currentLanguage === 'hindi' ? 'आसपास के कचरा हॉटस्पॉट' : 'Nearby Garbage Hotspots'}
              </h3>
              <p className="text-slate-200 text-xs opacity-90 mt-0.5">
                {currentLanguage === 'hindi' ? 'आपके क्षेत्र में कचरा रिपोर्ट का नक्शा देखें' : 'View garbage reported maps in your sector'}
              </p>
            </div>
            <button className="bg-emerald-600 text-white p-3 rounded-full shadow-lg group-hover:bg-emerald-500 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};