'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const BusinessContext = createContext();

const DEFAULT_COMPANIES = [
  {
    id: 'company-cluj',
    name: 'Cluj Division',
    address: 'Str. Avram Iancu 12, Cluj-Napoca',
    description: 'Main operational hub for Transylvania region',
    manager: 'Andrei Popescu',
    stats: { sites: 6, workers: 8, managers: 2 }
  },
  {
    id: 'company-bucharest',
    name: 'Bucharest Branch',
    address: 'Bd. Unirii 45, Bucureşti',
    description: 'Southern division office',
    manager: 'Ion Munteanu',
    stats: { sites: 2, workers: 4, managers: 1 }
  },
  {
    id: 'company-oradea',
    name: 'Oradea Logistics',
    address: 'Calea Borşului 88, Oradea',
    description: 'Logistics and supply warehouse depot',
    manager: 'Elena Dragomir',
    stats: { sites: 1, workers: 3, managers: 1 }
  }
];

export function BusinessProvider({ children }) {
  const { addToast } = useToast();
  const [companies, setCompanies] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ev-companies');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANIES;
    }
    return DEFAULT_COMPANIES;
  });

  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ev-active-company') || 'company-cluj';
    }
    return 'company-cluj';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ev-companies', JSON.stringify(companies));
    }
  }, [companies]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ev-active-company', activeCompanyId);
    }
  }, [activeCompanyId]);

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0];

  const switchCompany = (id) => {
    if (companies.some(c => c.id === id)) {
      setActiveCompanyId(id);
      addToast(`Switched workspace to ${companies.find(c => c.id === id).name}`, 'success');
    }
  };

  const createCompany = (details) => {
    const newCompany = {
      id: `company-${Date.now()}`,
      name: details.name || 'New Branch',
      address: details.address || '',
      description: details.description || '',
      manager: details.manager || '',
      stats: { sites: 0, workers: 0, managers: 0 }
    };
    setCompanies(prev => [...prev, newCompany]);
    addToast(`Business unit ${newCompany.name} created!`, 'success');
    return newCompany;
  };

  const updateCompany = (id, details) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...details };
      }
      return c;
    }));
    addToast('Business unit updated successfully', 'success');
  };

  const deleteCompany = (id) => {
    if (companies.length <= 1) {
      addToast('Cannot delete the only remaining business unit', 'error');
      return;
    }
    setCompanies(prev => prev.filter(c => c.id !== id));
    if (activeCompanyId === id) {
      const remaining = companies.filter(c => c.id !== id);
      setActiveCompanyId(remaining[0].id);
    }
    addToast('Business unit deleted', 'info');
  };

  return (
    <BusinessContext.Provider value={{
      companies,
      activeCompanyId,
      activeCompany,
      setActiveCompanyId: switchCompany,
      createCompany,
      updateCompany,
      deleteCompany
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
