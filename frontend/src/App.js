import React from "react";
import "@/App.css";
import axios from "axios";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useDomain } from "./contexts/DomainContext";
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
import { CompanyProfileEdit } from "./pages/CompanyProfileEdit";
import { DomainRouter } from "./components/DomainRouter";

// Production domain fix: ensure API calls use same-origin when on production
axios.interceptors.request.use((config) => {
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && !hostname.includes('preview.emergentagent.com')) {
    const url = config.url || '';
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

function CustomDomainRouter() {
  const { pageType, companySlug } = useDomain();

  if (pageType === 'careers') {
    return (
      <Routes>
        <Route path="/" element={<Careers domainOverride={companySlug} />} />
        <Route path="/apply/:jobId" element={<ApplyJob domainOverride={companySlug} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (pageType === 'hr') {
    return (
      <Routes>
        <Route path="/" element={<UnifiedLogin />} />
        <Route path="/select-company" element={<CompanySelector />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/settings" element={<CompanySettings />} />
        <Route path="/admin/profile" element={<UserProfile />} />
        <Route path="/admin/company-profile" element={<CompanyProfileEdit />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee/profile" element={<UserProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Default: main company profile
  return (
    <Routes>
      <Route path="/" element={<CompanyProfile domainOverride={companySlug} />} />
      <Route path="/careers" element={<Careers domainOverride={companySlug} />} />
      <Route path="/careers/apply/:jobId" element={<ApplyJob domainOverride={companySlug} />} />
      <Route path="/apply/:jobId" element={<ApplyJob domainOverride={companySlug} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppRouter() {
  const { isCustomDomain } = useDomain();
  const location = window.location;
  
  if (location.hash && location.hash.includes('session_id=')) {
    return <GoogleAuthCallback />;
  }

  // Custom domain: render company-specific routes
  if (isCustomDomain) {
    return <CustomDomainRouter />;
  }
  
  // Own domain (makar.id): full app routing
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/company-login" element={<UnifiedLogin />} />
      <Route path="/select-company" element={<CompanySelector />} />
      <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/superadmin/dashboard" element={<Dashboard />} />
      <Route path="/superadmin/admins" element={<SuperAdmins />} />
      <Route path="/superadmin/companies" element={<Companies />} />
      <Route path="/superadmin/users" element={<Users />} />
      <Route path="/superadmin/logs" element={<ActivityLogs />} />
      <Route path="/superadmin/settings" element={<Settings />} />
      <Route path="/superadmin/profile" element={<SuperAdminProfile />} />
      
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/settings" element={<CompanySettings />} />
      <Route path="/admin/profile" element={<UserProfile />} />
      
      <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
      <Route path="/employee/profile" element={<UserProfile />} />
      
      <Route path="/company/:domain" element={<CompanyProfile />} />
      <Route path="/careers/:domain" element={<Careers />} />
      <Route path="/careers/:domain/apply/:jobId" element={<ApplyJob />} />
      
      <Route path="/login/:domain" element={<CompanyLogin />} />
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
