import React from "react";
import "@/App.css";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Login } from "./pages/Login";
import { CompanyLogin } from "./pages/CompanyLogin";
import { Dashboard } from "./pages/Dashboard";
import { Companies } from "./pages/Companies";
import { Users } from "./pages/Users";
import { Settings } from "./pages/Settings";
import { CompanyProfile } from "./pages/CompanyProfile";
import { Careers } from "./pages/Careers";
import { ApplyJob } from "./pages/ApplyJob";
import { AdminDashboard } from "./pages/AdminDashboard";
import { LandingPage } from "./pages/LandingPage";
import { CompanySettings } from "./pages/CompanySettings";
import { CompanyLoginPortal } from "./pages/CompanyLoginPortal";
import { UnifiedLogin } from "./pages/UnifiedLogin";
import { CompanySelector } from "./pages/CompanySelector";
import { GoogleAuthCallback } from "./pages/GoogleAuthCallback";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { SuperAdminProfile } from "./pages/SuperAdminProfile";
import { UserProfile } from "./pages/UserProfile";
import { SuperAdmins } from "./pages/SuperAdmins";
import { ActivityLogs } from "./pages/ActivityLogs";
import { DomainRouter } from "./components/DomainRouter";

// Production domain fix: ensure API calls use same-origin when on production
// This fixes CORS issues when REACT_APP_BACKEND_URL was baked with a different domain
axios.interceptors.request.use((config) => {
  const hostname = window.location.hostname;
  // If we're on a production domain (not localhost, not preview), force same-origin API calls
  if (hostname !== 'localhost' && !hostname.includes('preview.emergentagent.com')) {
    const url = config.url || '';
    // If the URL points to an external backend (different host), rewrite to relative
    if (url.includes('emergentagent.com') || url.includes('emergent.host')) {
      const apiPath = url.replace(/^https?:\/\/[^/]+/, '');
      config.url = apiPath;
    }
  }
  return config;
});

// Global axios retry for transient errors (502, 503, network)
axios.interceptors.response.use(null, async (error) => {
  const config = error.config;
  const status = error.response?.status;
  if (!config || config._retryCount >= 2) return Promise.reject(error);
  if (status === 502 || status === 503 || status === 504 || !error.response) {
    config._retryCount = (config._retryCount || 0) + 1;
    await new Promise(r => setTimeout(r, 1000 * config._retryCount));
    return axios(config);
  }
  return Promise.reject(error);
});

function AppRouter() {
  const location = window.location;
  
  // Synchronously check for session_id in URL fragment (prevents race conditions)
  if (location.hash && location.hash.includes('session_id=')) {
    return <GoogleAuthCallback />;
  }
  
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Unified Login - New single login for all company users */}
      <Route path="/company-login" element={<UnifiedLogin />} />
      
      {/* Company/Role Selector */}
      <Route path="/select-company" element={<CompanySelector />} />
      
      {/* Google OAuth Callback */}
      <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
      
      {/* Auth - Super Admin (separate) */}
      <Route path="/login" element={<Login />} />
      
      {/* Super Admin Dashboard */}
      <Route path="/superadmin/dashboard" element={<Dashboard />} />
      <Route path="/superadmin/admins" element={<SuperAdmins />} />
      <Route path="/superadmin/companies" element={<Companies />} />
      <Route path="/superadmin/users" element={<Users />} />
      <Route path="/superadmin/logs" element={<ActivityLogs />} />
      <Route path="/superadmin/settings" element={<Settings />} />
      <Route path="/superadmin/profile" element={<SuperAdminProfile />} />
      
      {/* Company Admin Dashboard */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/settings" element={<CompanySettings />} />
      <Route path="/admin/profile" element={<UserProfile />} />
      
      {/* Employee Dashboard */}
      <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
      <Route path="/employee/profile" element={<UserProfile />} />
      
      {/* Public Pages */}
      <Route path="/company/:domain" element={<CompanyProfile />} />
      <Route path="/careers/:domain" element={<Careers />} />
      <Route path="/careers/:domain/apply/:jobId" element={<ApplyJob />} />
      
      {/* Old routes - keep for backward compatibility */}
      <Route path="/login/:domain" element={<CompanyLogin />} />
      
      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <DomainRouter>
            <AppRouter />
          </DomainRouter>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
