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

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth - Super Admin */}
            <Route path="/login" element={<Login />} />
            
            {/* Auth - Company Admin/Employee */}
            <Route path="/login/:domain" element={<CompanyLogin />} />
            
            {/* Super Admin Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Company Admin Dashboard */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* Public Pages */}
            <Route path="/company/:domain" element={<CompanyProfile />} />
            <Route path="/careers/:domain" element={<Careers />} />
            <Route path="/careers/:domain/apply/:jobId" element={<ApplyJob />} />
            
            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
