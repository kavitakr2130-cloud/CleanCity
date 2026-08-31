import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Save, Eye, EyeOff } from "lucide-react";

export const SupervisorSettings: React.FC = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      alert("Please enter both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://127.0.0.1:5000/supervisor/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Password changed successfully");

      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update error:", error);
      alert("Failed to change password.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            <span
              className="hover:text-emerald-600 cursor-pointer"
              onClick={() => navigate("/supervisor/dashboard")}
            >
              Dashboard
            </span>

            <span>/</span>

            <span className="text-slate-600">Settings</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Supervisor Settings
          </h1>

          <p className="text-xs text-slate-500 font-semibold mt-1">
            Manage your account security and preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/supervisor/dashboard")}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Password Card */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>

          <div>
            <h2 className="text-sm font-black text-slate-800">
              Change Password
            </h2>

            <p className="text-[10px] text-slate-400">
              Update your supervisor account password.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              New Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Confirm New Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Show Password */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show password
          </label>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="mt-6 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </form>
    </div>
  );
};