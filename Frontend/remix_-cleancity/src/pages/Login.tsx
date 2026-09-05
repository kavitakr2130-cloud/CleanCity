import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Phone, ArrowRight, ShieldCheck, CheckCircle2, User, Landmark, Mail, Lock, Check, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/Logo';
import { mockAuthorityUsers } from '../data/mockData';
import {
  sendOtp,
  verifyOtp,
  googleLogin,
  completeGoogleRegistration,
  adminLogin,
  supervisorLogin,
} from "../services/api";
import { GoogleLogin } from '@react-oauth/google';

export const Login: React.FC = () => {
  const { loginUser, setRole, setIsLoggedIn, currentRole, currentLanguage, setAuthoritySubRole, t, isLoggedIn, checkUserExistsByPhone, checkAuthorityUserExists } = useApp();
  const navigate = useNavigate();

// Auto redirect if already logged in
/* useEffect(() => {
  if (!isLoggedIn) return;

const subRole = localStorage.getItem("cleancity_authority_subrole");

  console.log("Auto redirect check:", {
    isLoggedIn,
    currentRole,
    subRole,
  });

  if (currentRole === "admin") {
    if (subRole === "Supervisor") {
      navigate("/supervisor/dashboard", { replace: true });
    } else if (subRole === "Field Worker") {
      navigate("/worker/dashboard", { replace: true });
    } else {
      navigate("/admin/dashboard", { replace: true });
    }
  } else {
    navigate("/home", { replace: true });
  }
}, [isLoggedIn, currentRole, navigate]);
 */

  // Mode toggles
 const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [googleNewUser, setGoogleNewUser] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleDob, setGoogleDob] = useState('');
  const [googleMobile, setGoogleMobile] = useState('');

  // OTP flow states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [smsVisible, setSmsVisible] = useState(false);

  // General Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Authority Portal state
  const [adminRole, setAdminRole] = useState<'Admin' | 'Supervisor' | 'Field Worker'>('Admin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  useEffect(() => {
  const timer = setTimeout(() => {
    setUsernameInput('');
    setPassword('');
  }, 300);

  return () => clearTimeout(timer);
}, []);

  useEffect(() => {
    setLoginMethod(currentRole === 'citizen' ? 'otp' : 'password');
    setOtpSent(false);
    setSmsVisible(false);
    setError('');
    setUsernameInput('');
    setPassword('');
  }, [currentRole]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle standard password-based login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'citizen') {
  if (!usernameInput.trim()) {
    setError('Please enter your email address.');
    return;
  }

  setIsLoading(true);
  setError('');

  try {
    const success = await loginUser(usernameInput.trim(), undefined, rememberMe);

    if (success) {
      setSuccessToast('Signed in successfully!');
      navigate('/home', { replace: true });
    } else {
        setGoogleNewUser(true);
        setGoogleEmail(usernameInput.trim());
    }
  } catch (error) {
    console.error(error);
    setError('Unable to sign in.');
  } finally {
    setIsLoading(false);
  }

  return;
}
    if (!usernameInput.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
     if (currentRole === "admin" && adminRole === "Admin") {
     const data = await adminLogin(usernameInput, password);
     console.log(data);

     if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));

     const success = await loginUser(usernameInput, password, rememberMe);

     if (success) {
      setIsLoading(false);
      setSuccessToast("Signed in successfully!");
      navigate("/admin/dashboard");
      return;
    }
    } else {
    setError(data.message);
    setIsLoading(false);
    return;
    }
}

if (currentRole === "admin" && adminRole === "Supervisor") {
  console.log("Supervisor login:", usernameInput);

  setRole("supervisor");
  setAuthoritySubRole("Supervisor");

  const success = await loginUser(usernameInput, password, rememberMe);

  if (success) {
   localStorage.setItem("cleancity_authority_subrole", "Supervisor");
    localStorage.setItem("cleancity_role", "supervisor");

    setIsLoading(false);
    setSuccessToast("Supervisor signed in successfully!");

    console.log("Supervisor login successful");
    console.log(
      "authoritySubRole =",
      localStorage.getItem("authoritySubRole")
    );

    navigate("/supervisor/dashboard", { replace: true });

    return;
  } else {
    setError("Invalid Supervisor credentials.");
    setIsLoading(false);
    return;
  }
}

if (currentRole === "admin" && adminRole === "Field Worker") {
  setRole("worker");
  setAuthoritySubRole("Field Worker");

  const success = await loginUser(usernameInput, password, rememberMe);

  if (success) {
   localStorage.setItem("cleancity_authority_subrole", "Field Worker");
    localStorage.setItem("cleancity_role", "worker");

    setIsLoading(false);
    setSuccessToast("Worker signed in successfully!");

    console.log("Worker login successful");
    console.log(
      "authoritySubRole =",
      localStorage.getItem("authoritySubRole")
    );

    navigate("/worker/dashboard", { replace: true });

    return;
  } else {
    setError("Invalid Worker credentials.");
    setIsLoading(false);
    return;
  }
}

const success = await loginUser(usernameInput, password, rememberMe);
      if (success) {


        setIsLoading(false);
        setSuccessToast('Signed in successfully!');

        if (currentRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/home');
        }
      } else {
        setError('Login failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch {
      setError('An error occurred during authentication.');
      setIsLoading(false);
    }
  };


  // Handle requesting an OTP
  /*
 const handleRequestOtp = async (e: React.FormEvent) => {

  e.preventDefault();

  if (!usernameInput.trim()) {
    setError("Please enter your mobile number.");
    return;
  }

  setIsLoading(true);
  setError("");

  try {

    const data = await sendOtp(usernameInput);


    setOtpSent(true);
    setCountdown(60);
    setSuccessToast("OTP sent successfully to your registered mobile number.");

  } catch (error) {

    setError("Failed to send OTP.");

  } finally {

    setIsLoading(false);

  }
};
*/


  // Handle verifying OTP
  /*
 const handleVerifyOtp = async (e: React.FormEvent) => {

  e.preventDefault();

  if (!otp.trim()) {
    setError("Please enter OTP.");
    return;
  }

  setIsLoading(true);
  setError("");

  try {

    const data = await verifyOtp(usernameInput, otp);

   if (data.token) {

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

   const success = await loginUser(usernameInput, undefined, rememberMe);

   if (success) {
     navigate("/home");
   } else {
     setError("Unable to complete login.");
   }
  }else {

    setError(data.message);

  }

  } catch (error) {

    setError("OTP Verification Failed");

  } finally {

    setIsLoading(false);

  }

};
*/
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setSuccessToast(`A password reset instructions link has been dispatched to ${resetEmail}`);
    setShowForgotPassword(false);
    setResetEmail('');
  };

  const handleRoleToggle = (role: 'citizen' | 'admin') => {
  setUsernameInput('');
  setPassword('');
  setError('');
  setOtpSent(false);
  setSmsVisible(false);

  setRole(role);

  // Clear Chrome autofill after switching between Citizen and Authority
  setTimeout(() => {
    setUsernameInput('');
    setPassword('');
  }, 500);
};




  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 md:p-8 font-sans">
      <main className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col p-8 md:p-10 relative">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-emerald-700 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
          id="login-back-btn"
          title="Back to Welcome Page"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header / Logo */}
        <header className="flex flex-col items-center mb-8">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
            <Logo size={70} />
          </div>
          <h2 className="text-2xl font-black text-emerald-800 tracking-tight text-center leading-none">
            CleanCity
          </h2>
          <p className="text-xs font-bold text-slate-400 text-center mt-2 px-4 leading-relaxed">
            {currentRole === 'admin'
              ? 'MUNICIPAL INTERNAL CONSOLE PORTAL'
              : 'REPORT GARBAGE • TRACK TEAMS • EARN CLEANPOINTS'}
          </p>

          {/* Role Toggle Selector */}
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full mt-6 border border-slate-200/60">
            <button
              onClick={() => handleRoleToggle('citizen')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                currentRole === 'citizen'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Citizen Login
            </button>
            <button
              onClick={() => handleRoleToggle('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              Authority Portal
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3.5 rounded-2xl border border-rose-100 mb-6 text-center">
            {error}
          </div>
        )}

        {/* FORGOT PASSWORD SCREEN */}
        {showForgotPassword ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-sm">Recover Password</h3>
              <p className="text-[11px] text-slate-400">Enter your email and we'll send you a password reset link.</p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                Email Address
              </label>
              <div className="relative flex items-center border border-slate-200 focus-within:border-emerald-600 rounded-2xl bg-slate-50 overflow-hidden px-4">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-3.5 bg-transparent text-xs font-semibold focus:outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-extrabold py-3.5 text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD FORM CHANNELS */
          <div>
            {/* AUTHORITY PORTAL SPECIFICS */}
            {currentRole === 'admin' && (
              <div className="mb-4 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                  Department Role
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Admin', 'Supervisor', 'Field Worker'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                    onClick={() => {
  setAdminRole(r);
  setRole("admin");
}}
                      className={`py-2 px-1 rounded-xl border text-[9px] font-black tracking-tight uppercase transition-all cursor-pointer ${
                        adminRole === r
                          ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

{/* FORM CONDITIONAL PATHS */}
{googleNewUser ? (
  <form className="space-y-4">
    <div className="text-center">
      <h4 className="font-extrabold text-sm text-slate-700">
        Complete Your Registration
      </h4>
      <p className="text-[11px] text-slate-400">
        Please enter your mobile number and date of birth.
      </p>
    </div>

    <input
      type="tel"
      value={googleMobile}
      onChange={(e) => setGoogleMobile(e.target.value)}
      placeholder="Mobile Number"
      maxLength={10}
      required
      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
    />

    <input
      type="date"
      value={googleDob}
      onChange={(e) => setGoogleDob(e.target.value)}
      required
      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-600"
    />

   <button
  type="button"
  disabled={isLoading}
  onClick={async () => {
    if (!googleMobile.trim()) {
      setError("Please enter your mobile number.");
      return;
    }

    if (!googleDob) {
      setError("Please select your date of birth.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await completeGoogleRegistration(
        googleEmail,
        "Citizen",
        googleMobile,
        googleDob
      );

      console.log("Google registration response:", data);

     if (data.token) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));

  const success = await loginUser(
    googleMobile,
    undefined,
    true
  );

  if (success) {
    setSuccessToast("Registration successful!");
    navigate("/home", { replace: true });
  } else {
    setError("Registration succeeded, but login could not be completed.");
  }
} else {
        setError(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error(error);
      setError("Google registration failed.");
    } finally {
      setIsLoading(false);
    }
  }}
  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-4 rounded-xl"
>
  {isLoading ? "Creating Account..." : "Complete Registration"}
</button>
  </form>
// ) : loginMethod === 'otp' && otpSent ? (
//               /* OTP VERIFICATION FORM */
//               <form onSubmit={handleVerifyOtp} className="space-y-5">
//                 <div className="space-y-1 text-center">
//                   <h4 className="font-extrabold text-sm text-slate-700">Enter 6-Digit OTP</h4>
//                   <p className="text-[11px] text-slate-400">Simulated SMS sent to {usernameInput}</p>
//                 </div>
//                 <div className="relative flex items-center border border-slate-200 focus-within:border-emerald-600 transition-all rounded-2xl bg-slate-50 overflow-hidden">
//                   <input
//                     type="text"
//                     maxLength={6}
//                     value={otp}
//                     onChange={(e) => setOtp(e.target.value)}
//                     placeholder="------"
//                     className="w-full text-center py-4 bg-transparent text-lg font-black tracking-widest focus:outline-none text-slate-800"/>
//                 </div>
//                 <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold px-1">
//                   <span>Code Sent</span>
//                   {countdown > 0 ? (
//                     <span className="text-emerald-600">Resend in {countdown}s</span>
//                   ) : (
//                     <button
//                       type="button"
//                       onClick={handleRequestOtp}
//                       className="text-emerald-600 hover:underline cursor-pointer"
//                     >
//                       Resend SMS
//                     </button>
//                   )}
//                 </div>

//                 {/* Remember Me Toggle on OTP Code step */}
//                 <div className="flex items-center justify-between px-1 py-1">
//                   <label className="flex items-center gap-2 cursor-pointer select-none">
//                     <input
//                       type="checkbox"
//                       checked={rememberMe}
//                       onChange={(e) => setRememberMe(e.target.checked)}
//                       className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
//                     />
//                     <span className="text-xs font-bold text-slate-400">Remember Me</span>
//                   </label>
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-4 rounded-xl shadow-lg transition-all active:scale-98 cursor-pointer"
//                 >
//                   {isLoading ? 'Verifying...' : 'Verify OTP & Sign In'}
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => setOtpSent(false)}
//                   className="w-full text-[11px] font-black text-slate-400 hover:text-slate-600 text-center block cursor-pointer"
//                 >
//                   Change Mobile Number
//                 </button>
//               </form>
            ) : (
              /* STANDARD PASSWORD OR EMAIL LOGIN FORM */
     <form
  onSubmit={handlePasswordLogin}
  className="space-y-4"
  autoComplete="off"
>
                {/* Username/Email/Phone Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block ml-1">
                   {currentRole === 'admin' ? 'Employee ID or Email' : 'Email Address'}
                  </label>
                  <div className="relative flex items-center border border-slate-200 focus-within:border-emerald-600 rounded-2xl bg-slate-50 overflow-hidden px-4">
                   {currentRole === 'citizen' ? (
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                   <input
                      type={currentRole === 'citizen' ? 'email' : 'text'}
                      name="username"
                      autoComplete="username"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder={currentRole === 'admin' ? '' : 'name@example.com'}
                      className="w-full px-3 py-3 bg-transparent text-xs font-semibold focus:outline-none text-slate-800"

                    />
                  </div>
                </div>

                {/* Password Input (Hidden if OTP Mode selected) */}
                {currentRole !== 'citizen' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative flex items-center border border-slate-200 focus-within:border-emerald-600 rounded-2xl bg-slate-50 overflow-hidden px-4">
                      <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-3 bg-transparent text-xs font-semibold focus:outline-none text-slate-800"

                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me Toggle */}
                {(loginMethod === 'password' || loginMethod === 'otp') && (
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
                )}

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                    currentRole === 'admin' ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/10' : 'shadow-emerald-600/10'
                  }`}
                >
                  {isLoading ? 'Processing...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          {/* GOOGLE LOGIN - CITIZEN ONLY */}
          {currentRole === 'citizen' && (
            <div className="mt-4">
              <GoogleLogin
  onSuccess={async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setError("Google login failed.");
      return;
    }

    try {
      setIsLoading(true);

      const data = await googleLogin(credentialResponse.credential);

      console.log("Google backend response:", data);

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setIsLoggedIn(true);
        setRole("citizen");

        navigate("/home");
      } else {
        console.log("New Google user:", data);

        setGoogleNewUser(true);
        setGoogleEmail(data.email);
      }
    } catch (error) {
      console.error(error);
      setError("Google login failed.");
    } finally {
      setIsLoading(false);
    }
  }}
  onError={() => {
    setError("Google Login Failed");
  }}
/>
            </div>
          )}

          </div>
        )}


        {/* Footer redirects to Register or shows security notice */}
        <footer className="mt-8 text-center border-t border-slate-100 pt-6">
          {currentRole === 'admin' ? (
            <div className="space-y-4 px-4 text-center">
              <p id="gov-portal-notice-msg" className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                Department Portal: Employee accounts are pre-created by the Government/Department. Self-registration is disabled for Admin, Supervisor, and Field Workers.
              </p>

            </div>
          ) : (
            <></>
          )}
        </footer>
      </main>


      {/* SUCCESS TOAST MESSAGE */}
      {successToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2.5 z-50 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}
    </div>
  );
};
