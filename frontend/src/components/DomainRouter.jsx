import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

// Domains that belong to us (not custom domains)
const OWN_DOMAINS = ['makar.id', 'localhost', 'preview.emergentagent.com'];

const isOwnDomain = (hostname) => {
  return OWN_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
};

export const DomainRouter = ({ children }) => {
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  const hostname = window.location.hostname;

  useEffect(() => {
    if (isOwnDomain(hostname)) {
      setLoading(false);
      return;
    }

    const lookup = async () => {
      try {
        const response = await axios.get(`${API}/public/domain-lookup?hostname=${hostname}`, { timeout: 8000 });
        if (response.data.found) {
          setResolved(response.data);
        }
      } catch (error) {
        console.error('Domain lookup failed:', error);
      } finally {
        setLoading(false);
      }
    };

    lookup();
  }, [hostname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  // Own domain → normal routing
  if (isOwnDomain(hostname)) {
    return children;
  }

  // Custom domain resolved
  if (resolved) {
    const slug = resolved.slug || resolved.company_name;
    const pageType = resolved.page_type;

    if (pageType === 'careers') {
      // Check if there's a path like /apply/xxx
      const path = window.location.pathname;
      const applyMatch = path.match(/\/apply\/(.+)/);
      if (applyMatch) {
        return <Navigate to={`/careers/${slug}/apply/${applyMatch[1]}`} replace />;
      }
      return <Navigate to={`/careers/${slug}`} replace />;
    }
    if (pageType === 'hr') {
      return <Navigate to="/company-login" replace />;
    }
    // main or default
    return <Navigate to={`/company/${slug}`} replace />;
  }

  // Not found → show normal app
  return children;
};
