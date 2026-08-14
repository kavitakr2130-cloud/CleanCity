import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowRight, User, Phone, Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/Logo';

export const Register: React.FC = () => {
  const { registerUser, isLoggedIn } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const passedState = location.state as { phone?: string; otpVerified?: boolean; rememberMe?: boolean } | null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState(passedState?.phone || '');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(passedState?.rememberMe !== undefined ? passedState.rememberMe : true);

  // Auto redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home', { replace: true });
    }
  }, [isLoggedIn, navigate]);
  
  // OTP flow states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [smsVisible, setSmsVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in all details.');
      return;
    }
    setIsLoading(true);
    setError('');

    if (passedState?.otpVerified) {
      // Directly register the user without requiring an extra OTP step
      setTimeout(async () => {
        await registerUser(name.trim(), phone.trim(), email.trim(), '', rememberMe);
        setIsLoading(false);
        navigate('/home');
      }, 1000);
      return;
    }

    // Generate simulated 6-digit OTP
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setIsLoading(false);
      setOtpSent(true);
      setCountdown(60);
      setSmsVisible(true);
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    if (otp !== generatedOtp) {
      setError('Incorrect OTP code. Tap the simulated SMS banner to fill.');
      return;
    }
    setIsLoading(true);
    setError('');

    // Simulate registration & log in with custom credentials
    setTimeout(async () => {
      await registerUser(name.trim(), phone.trim(), email.trim(), '', rememberMe);
      setIsLoading(false);
      navigate('/home');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 md:p-8 font-sans">
      <main className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col p-8 md:p-10 relative text-left">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => {
            if (otpSent) {
              setOtpSent(false);
            } else {
              navigate('/login');
            }
          }}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-emerald-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          id="register-back-btn"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <header className="flex flex-col items-center mb-6">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
            <Logo size={70} />
          </div>
          <h2 className="text-2xl font-black text-emerald-800 tracking-tight text-center leading-none">
            {passedState?.otpVerified ? 'Complete Account Profile' : (otpSent ? 'Verify Phone Number' : 'Create Citizen Account')}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-2 px-4 text-center leading-relaxed">
            {passedState?.otpVerified 
              ? 'Enter your name and email to finalize your secure citizen account registration.'
              : (otpSent 
                  ? `We have dispatched a security OTP verification code to mobile number ${phone}.`
                  : 'Register with mobile number and email to start reporting environmental grievances.')}
          </p>
        </header>

        {error && (
          <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3.5 rounded-2xl border border-rose-100 mb-4 text-center">
            {error}
          </div>
        )}

        {otpSent ? (
          /* OTP VERIFICATION VIEW */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-1 text-center">
              <h4 className="font-extrabold text-sm text-slate-700">Enter 6-Digit OTP</h4>
              <p className="text-[11px] text-slate-400">Please enter the security verification code</p>
            </div>

            <div className="relative flex items-center border border-slate-200 focus-within:border-emerald-600 transition-all rounded-2xl bg-slate-50 overflow-hidden">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="------"
                className="w-full text-center py-4 bg-transparent text-lg font-black tracking-widest focus:outline-none text-slate-800"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold px-1">
              <span>Code Sent</span>
              {countdown > 0 ? (
                <span className="text-emerald-600">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleRegisterSubmit}
                  className="text-emerald-600 hover:underline cursor-pointer"
                >
                  Resend SMS
                </button>
              )}
            </div>

            {/* Remember Me Toggle on OTP Code step */}
            <div className="flex items-center justify-between px-1 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-400">Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-4 rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              {isLoading ? 'Verifying...' : 'Verify & Complete Registration'}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full text-[11px] font-black text-slate-400 hover:text-slate-600 text-center block cursor-pointer"
            >
              Modify Registration Details
            </button>
          </form>
        ) : (
          /* REGISTRATION DETAILS FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                Full Name
              </label>
              <div className="relative flex items-center border border-slate-200 focus-within:border-emerald-500 rounded-2xl bg-slate-50 overflow-hidden px-4">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-3 bg-transparent text-xs font-semibold focus:outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                Mobile Number
              </label>
              <div className="relative flex items-center border border-slate-200 focus-within:border-emerald-500 rounded-2xl bg-slate-50 overflow-hidden px-4">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="tel"
                  required
                  readOnly={passedState?.otpVerified}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={`w-full px-3 py-3 bg-transparent text-xs font-semibold focus:outline-none text-slate-800 ${
                    passedState?.otpVerified ? 'text-slate-400 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                Email Address
              </label>
              <div className="relative flex items-center border border-slate-200 focus-within:border-emerald-500 rounded-2xl bg-slate-50 overflow-hidden px-4">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@example.com"
                  className="w-full px-3 py-3 bg-transparent text-xs font-semibold focus:outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Terms Policy */}
            <div className="pt-2">
              <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed">
                By registering, you agree to our Terms of Service and Privacy Policy, enabling secure GPS mapping and photographic evidence collection for municipal actions.
              </p>
            </div>

            {/* Remember Me Toggle on Main Register Form */}
            <div className="flex items-center justify-between px-1 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-400">Remember Me</span>
              </label>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading 
                ? (passedState?.otpVerified ? 'Creating Account...' : 'Generating OTP...') 
                : (passedState?.otpVerified ? 'Create Account' : 'Generate OTP & Register')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        )}

        <footer className="mt-6 text-center border-t border-slate-100 pt-4">
          <Link
            to="/login"
            className="text-xs font-bold text-slate-400 hover:text-emerald-700 hover:underline"
          >
            Already have an account? <span className="text-emerald-600 font-extrabold">Sign In</span>
          </Link>
        </footer>
      </main>

      {/* REAL-TIME SIMULATED SMS BANNER */}
      {smsVisible && (
        <div 
          onClick={() => {
            setOtp(generatedOtp);
            setSmsVisible(false);
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[420px] bg-slate-900/95 backdrop-blur-sm text-white p-4 rounded-2xl shadow-2xl border border-slate-800 z-[100] cursor-pointer hover:scale-102 transition-transform animate-bounce flex items-center gap-3.5"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl flex-shrink-0">
            💬
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">SIMULATED SMS CARRIER</p>
              <span className="text-[9px] text-slate-400 font-bold">Just Now</span>
            </div>
            <p className="text-xs font-bold text-slate-100 mt-1 leading-relaxed">
              CleanCity Security Code: <span className="text-emerald-400 font-black text-sm tracking-wider select-all px-1.5 py-0.5 bg-slate-800 rounded">{generatedOtp}</span>. Do not disclose.
            </p>
            <p className="text-[9px] text-emerald-500 mt-1.5 font-bold animate-pulse">⚡ Click this banner to auto-fill code</p>
          </div>
        </div>
      )}
    </div>
  );
};
