import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, currentRole } = useApp();

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-center bg-slate-50 overflow-hidden px-6 font-sans">
      {/* Mesh Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 animate-bounce text-emerald-500/30 opacity-40">
        <MapPin className="w-10 h-10" />
      </div>
      <div className="absolute bottom-1/4 right-1/4 animate-pulse text-blue-500/30 opacity-40">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-[600px] w-full">
        {/* Animated App Icon Logo with high-quality picture */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center overflow-hidden border border-slate-100 relative group p-2">
            <div className="absolute inset-2 border-2 border-dashed border-emerald-500/20 rounded-2xl overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=320&h=320&q=80"
                alt="CleanCity Eco Sphere"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Brand Name with sleek animation */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-3xl md:text-4xl font-extrabold text-emerald-800 tracking-tight mb-2"
        >
          CleanCity
        </motion.h1>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-sm md:text-base text-slate-500 font-medium max-w-[280px] md:max-w-none mb-12"
        >
          Report Garbage, Build a Cleaner City
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="w-full sm:w-auto"
        >
          <button
            onClick={() => {
              const token = localStorage.getItem("token");

              if (token) {
                localStorage.setItem("hasLoggedIn", "true");
                navigate("/home");
              } else {
                navigate("/login");
              }
           }}
            className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all duration-200 rounded-xl shadow-lg shadow-emerald-600/20 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2 tracking-wide text-sm">
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </motion.div>
      </div>

      {/* Footer System Version */}
      <footer className="absolute bottom-8 left-0 w-full text-center px-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60 flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 inline" />
          Civic Stewardship Platform • v1.0.2
        </p>
      </footer>
    </div>
  );
};
