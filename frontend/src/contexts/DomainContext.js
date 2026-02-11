import React, { createContext, useContext } from 'react';

const DomainContext = createContext({
  isCustomDomain: false,
  companySlug: null,
  pageType: null,
  companyName: null,
  companyLogo: null,
  companyDomain: null,
  companyId: null,
});

export const DomainProvider = DomainContext.Provider;

export const useDomain = () => useContext(DomainContext);
