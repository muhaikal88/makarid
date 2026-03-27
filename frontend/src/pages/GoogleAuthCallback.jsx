import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const GoogleAuthCallback = () => {
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processGoogleAuth = async () => {
      const loginPath = window.location.hostname.includes('makar.id') || window.location.hostname === 'localhost'
        ? '/company-login' : '/';

      try {
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          window.location.replace(`${loginPath}?error=auth_failed`);
          return;
        }

        const response = await axios.post(`${API}/auth/google/callback?session_id=${sessionId}`, {}, {
          withCredentials: true
        });

        const data = response.data;

        if (data.needs_selection) {
          sessionStorage.setItem('login_data', JSON.stringify(data));
          window.location.replace('/select-company');
        } else if (data.role === 'admin') {
          window.location.replace('/admin/dashboard');
        } else {
          window.location.replace('/employee/dashboard');
        }
      } catch (error) {
        console.error('Google auth error:', error);
        const errMsg = error.response?.data?.detail || 'auth_failed';
        const errParam = errMsg.includes('No company access') ? 'no_access' : 'auth_failed';
        window.location.replace(`${loginPath}?error=${errParam}`);
      }
    };

    processGoogleAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7] mx-auto mb-4"></div>
        <p className="text-gray-600">Memproses login...</p>
      </div>
    </div>
  );
};
