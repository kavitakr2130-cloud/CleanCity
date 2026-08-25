import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { CitizenLayout, AdminLayout } from './components/Layouts';
import { Splash } from './pages/Splash';
import { Login } from './pages/Login';
// import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { CitizenMap } from './pages/CitizenMap';
import { SubmitComplaint } from './pages/SubmitComplaint';
import { TrackComplaint } from './pages/TrackComplaint';
import { History } from './pages/History';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { RewardHistory } from './pages/RewardHistory';
import { Settings } from './pages/Settings';
import { Feedback } from './pages/Feedback';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ViewComplaints } from './pages/admin/ViewComplaints';
import { AdminComplaintDetails } from './pages/admin/AdminComplaintDetails';
import { AdminMap } from './pages/admin/AdminMap';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminAlerts } from './pages/admin/AdminAlerts';
import { AdminActivityLog } from './pages/admin/AdminActivityLog';
import { AdminProfile } from './pages/admin/AdminProfile';
import { AdminSettings } from './pages/admin/AdminSettings';
import { SupervisorDashboard } from './pages/supervisor/SupervisorDashboard';
import { SupervisorComplaints } from './pages/supervisor/SupervisorComplaints';
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import SupervisorReports from "./pages/supervisor/SupervisorReports";
import LocationTest from "./pages/LocationTest";
import { SupervisorProfile } from "./pages/supervisor/SupervisorProfile";
import { SupervisorSettings } from "./pages/supervisor/SupervisorSettings";

import { WorkerProfile } from "./pages/worker/WorkerProfile";
import { WorkerSettings } from "./pages/worker/WorkerSettings";

// Role Guard Component for Citizens
const CitizenRoutesWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, currentRole } = useApp();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

 if (currentRole !== "citizen") {
  const subRole = localStorage.getItem("authoritySubRole");

  if (subRole === "Supervisor") {
    return <Navigate to="/supervisor/dashboard" replace />;
  }

  if (subRole === "Field Worker") {
    return <Navigate to="/worker/dashboard" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
}
  return <CitizenLayout>{children}</CitizenLayout>;
};

// Role Guard Component for worker
const WorkerRoutesWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, currentRole } = useApp();

    console.log("WORKER GUARD:", { isLoggedIn, currentRole });

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (currentRole !== "worker") {
    return <Navigate to="/home" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

// Role Guard Component for Supervisor
const SupervisorRoutesWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, currentRole } = useApp();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (currentRole !== "supervisor") {
    return <Navigate to="/home" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

// Role Guard Component for Admin Authority
const AdminRoutesWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, currentRole } = useApp();
  console.log("Guard:", { isLoggedIn, currentRole });
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
 if (
  currentRole !== 'admin' &&
  currentRole !== 'supervisor' &&
  currentRole !== 'worker'
) {
  return <Navigate to="/home" replace />;
}
  return <AdminLayout>{children}</AdminLayout>;
};

// Main Routing Shell
export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Entrance Pages */}
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="/register" element={<Register />} /> */}

          {/* Citizen Reporting Portal Routes */}
          <Route
            path="/home"
            element={
              <CitizenRoutesWrapper>
                <Home />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/map"
            element={
              <CitizenRoutesWrapper>
                <CitizenMap />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/submit"
            element={
              <CitizenRoutesWrapper>
                <SubmitComplaint />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/complaint/:id"
            element={
              <CitizenRoutesWrapper>
                <TrackComplaint />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/history"
            element={
              <CitizenRoutesWrapper>
                <History />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/notifications"
            element={
              <CitizenRoutesWrapper>
                <Notifications />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/profile"
            element={
              <CitizenRoutesWrapper>
                <Profile />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/reward-history"
            element={
              <CitizenRoutesWrapper>
                <RewardHistory />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/rewards"
            element={
              <CitizenRoutesWrapper>
                <Profile />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/settings"
            element={
              <CitizenRoutesWrapper>
                <Settings />
              </CitizenRoutesWrapper>
            }
          />
          <Route
            path="/feedback"
            element={
              <CitizenRoutesWrapper>
                <Feedback />
              </CitizenRoutesWrapper>
            }
          />

          {/* Admin Command Console Routes */}
        <Route
  path="/admin/dashboard"
  element={
    <AdminRoutesWrapper>
      <AdminDashboard />
    </AdminRoutesWrapper>
  }
/>
          <Route
            path="/admin/complaints"
            element={
              <AdminRoutesWrapper>
                <ViewComplaints />
              </AdminRoutesWrapper>
            }
          />
          <Route
            path="/admin/complaint/:id"
            element={
              <AdminRoutesWrapper>
                <AdminComplaintDetails />
              </AdminRoutesWrapper>
            }
          />
          <Route
            path="/admin/map"
            element={
              <AdminRoutesWrapper>
                <AdminMap />
              </AdminRoutesWrapper>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoutesWrapper>
                <AdminReports />
              </AdminRoutesWrapper>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <AdminRoutesWrapper>
                <AdminAlerts />
              </AdminRoutesWrapper>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <AdminRoutesWrapper>
                <AdminActivityLog />
              </AdminRoutesWrapper>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminRoutesWrapper>
                <AdminProfile />
              </AdminRoutesWrapper>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoutesWrapper>
                <AdminSettings />
              </AdminRoutesWrapper>
            }
          />
        <Route
  path="/supervisor/dashboard"
  element={
    <SupervisorRoutesWrapper>
      <SupervisorDashboard />
    </SupervisorRoutesWrapper>
  }
/>

<Route
  path="/supervisor/complaints"
  element={
    <SupervisorRoutesWrapper>
      <SupervisorComplaints />
    </SupervisorRoutesWrapper>
  }
/>

<Route
  path="/supervisor/map"
  element={
    <AdminRoutesWrapper>
      <AdminDashboard />
    </AdminRoutesWrapper>
  }
/>

<Route
  path="/supervisor/reports"
  element={
    <SupervisorRoutesWrapper>
      <SupervisorReports />
    </SupervisorRoutesWrapper>
  }
/>

<Route
  path="/supervisor/profile"
  element={<SupervisorProfile />}
/>

<Route
  path="/supervisor/settings"
  element={<SupervisorSettings />}
/>

<Route
  path="/worker/dashboard"
  element={
    <WorkerRoutesWrapper>
      <WorkerDashboard />
    </WorkerRoutesWrapper>
  }
/>

<Route
  path="/worker/tasks"
  element={
    <WorkerRoutesWrapper>
      <WorkerDashboard />
    </WorkerRoutesWrapper>
  }
/>

<Route
  path="/worker/map"
  element={
    <WorkerRoutesWrapper>
      <WorkerDashboard />
    </WorkerRoutesWrapper>
  }
/>
<Route
  path="/worker/profile"
  element={<WorkerProfile />}
/>

<Route
  path="/worker/settings"
  element={<WorkerSettings />}
/>
<Route
  path="/location-test"
  element={<LocationTest />}
/>

          {/* Fallback Redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
