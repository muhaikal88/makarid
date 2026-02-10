import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing (React StrictMode)
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processGoogleAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const fragment = location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id found');
          navigate('/company-login');
          return;
        }

        // Send session_id to backend
        const response = await axios.post(`${API}/auth/google/callback?session_id=${sessionId}`, {}, {
          withCredentials: true
        });

        const data = response.data;

        // Check if needs company/role selection
        if (data.needs_selection) {
          sessionStorage.setItem('login_data', JSON.stringify(data));
          navigate('/select-company', { state: { loginData: data } });
        } else {
          // Auto-selected, redirect to dashboard
          if (data.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/employee/dashboard');
          }
        }
      } catch (error) {
        console.error('Google auth error:', error);
        navigate('/company-login?error=auth_failed');
      }
    };

    processGoogleAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7] mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
};
