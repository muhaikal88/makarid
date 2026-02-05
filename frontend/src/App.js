import React from "react";
import "@/App.css";
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

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Auth - Super Admin */}
            <Route path="/login" element={<Login />} />
            
            {/* Auth - Company Admin/Employee */}
            <Route path="/login/:domain" element={<CompanyLogin />} />
            
            {/* Super Admin Dashboard */}
            <Route path="/superadmin/dashboard" element={<Dashboard />} />
            <Route path="/superadmin/companies" element={<Companies />} />
            <Route path="/superadmin/users" element={<Users />} />
            <Route path="/superadmin/settings" element={<Settings />} />
            
            {/* Company Admin Dashboard */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* Public Pages */}
            <Route path="/company/:domain" element={<CompanyProfile />} />
            <Route path="/careers/:domain" element={<Careers />} />
            <Route path="/careers/:domain/apply/:jobId" element={<ApplyJob />} />
            
            {/* Redirects */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
