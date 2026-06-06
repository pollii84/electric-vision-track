'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getTenantCollection,
  addTenantDoc,
  updateTenantDoc,
  deleteTenantDoc,
  getGlobalDoc,
  onTenantCollectionSnapshot,
} from '@/lib/firestore';

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const { user, tenantId, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load tenant info and company divisions
  useEffect(() => {
    if (authLoading) return;
    if (!user || !tenantId) {
      setTenant(null);
      setCompanies([]);
      setActiveCompanyId(null);
      setLoading(false);
      return;
    }

    let unsubCompanies = null;

    const loadTenant = async () => {
      try {
        // Load tenant document
        const tenantData = await getGlobalDoc('tenants', tenantId);
        setTenant(tenantData);

        // Subscribe to company divisions in real-time
        unsubCompanies = onTenantCollectionSnapshot(
          tenantId,
          'companies',
          (docs) => {
            setCompanies(docs);
            // Auto-select first company if none active
            if (docs.length > 0 && !activeCompanyId) {
              setActiveCompanyId(docs[0].id);
            }
          },
          { sort: { field: 'name', direction: 'asc' } }
        );
      } catch (error) {
        console.error('Error loading tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();

    return () => {
      if (unsubCompanies) unsubCompanies();
    };
  }, [user, tenantId, authLoading]);

  const switchCompany = useCallback((companyId) => {
    setActiveCompanyId(companyId);
  }, []);

  const createCompany = useCallback(async (details) => {
    if (!tenantId) return null;
    try {
      const id = await addTenantDoc(tenantId, 'companies', {
        name: details.name,
        address: details.address || '',
        description: details.description || '',
        manager: details.manager || '',
        stats: details.stats || { sites: 0, workers: 0, managers: 0 },
      });
      return id;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }, [tenantId]);

  const updateCompany = useCallback(async (companyId, details) => {
    if (!tenantId) return;
    try {
      await updateTenantDoc(tenantId, 'companies', companyId, details);
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }, [tenantId]);

  const deleteCompany = useCallback(async (companyId) => {
    if (!tenantId) return;
    if (companies.length <= 1) {
      throw new Error('Cannot delete the last company division.');
    }
    try {
      await deleteTenantDoc(tenantId, 'companies', companyId);
      if (activeCompanyId === companyId) {
        const remaining = companies.filter(c => c.id !== companyId);
        setActiveCompanyId(remaining[0]?.id || null);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }, [tenantId, companies, activeCompanyId]);

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0] || null;

  const value = {
    tenant,
    companies,
    activeCompanyId,
    activeCompany,
    loading,
    switchCompany,
    setActiveCompanyId: switchCompany, // Backwards compatibility with old BusinessContext
    createCompany,
    updateCompany,
    deleteCompany,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}

export { TenantContext, TenantContext as BusinessContext, TenantProvider as BusinessProvider, useTenant as useBusiness };
