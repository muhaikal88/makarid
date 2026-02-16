import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { DomainProvider } from '../contexts/DomainContext';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

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

  const domainValue = useMemo(() => {
    if (!resolved || isOwnDomain(hostname)) {
      return {
        isCustomDomain: false,
        companySlug: null,
        pageType: null,
        companyName: null,
        companyLogo: null,
        companyDomain: null,
        companyId: null,
      };
    }
    return {
      isCustomDomain: true,
      companySlug: resolved.slug || resolved.company_name,
      pageType: resolved.page_type,
      companyName: resolved.company_name,
      companyLogo: resolved.logo_url,
      companyDomain: resolved.domain,
      companyId: resolved.company_id,
      pageTitle: resolved.page_title,
    };
  }, [resolved, hostname]);

  // Set page title, favicon, and OG meta for custom domains
  useEffect(() => {
    if (domainValue.isCustomDomain) {
      const title = domainValue.pageTitle || domainValue.companyName;
      if (title) document.title = title;

      // Set favicon - change ALL favicon links
      const faviconLinks = document.querySelectorAll('link[rel*="icon"]');
      if (domainValue.companyLogo) {
        faviconLinks.forEach(el => { el.href = domainValue.companyLogo; });
      } else {
        faviconLinks.forEach(el => el.remove());
      }

      // Update OG meta tags & description
      const setMeta = (prop, content) => {
        if (!content) return;
        let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(prop.startsWith('og:') ? 'property' : 'name', prop);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };
      setMeta('og:title', title);
      setMeta('og:image', domainValue.companyLogo);
      setMeta('description', title);
    }
  }, [domainValue]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  return (
    <DomainProvider value={domainValue}>
      {children}
    </DomainProvider>
  );
};
