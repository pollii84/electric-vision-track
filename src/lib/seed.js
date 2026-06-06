'use client';

import { setTenantDoc } from './firestore';

export async function seedTenantData(tenantId) {
  try {
    console.log('Starting seed operations for tenant:', tenantId);
    
    // 1. Seed companies
    const defaultCompanies = [
      {
        name: 'Cluj Division',
        address: 'Str. Avram Iancu 12, Cluj-Napoca',
        description: 'Main operational hub for Transylvania region',
        manager: 'Andrei Popescu',
        stats: { sites: 6, workers: 8, managers: 2 }
      },
      {
        name: 'Bucharest Branch',
        address: 'Bd. Unirii 45, Bucureşti',
        description: 'Southern division office',
        manager: 'Ion Munteanu',
        stats: { sites: 2, workers: 4, managers: 1 }
      },
      {
        name: 'Oradea Logistics',
        address: 'Calea Borşului 88, Oradea',
        description: 'Logistics and supply warehouse depot',
        manager: 'Elena Dragomir',
        stats: { sites: 1, workers: 3, managers: 1 }
      }
    ];

    for (let i = 0; i < defaultCompanies.length; i++) {
      const id = i === 0 ? 'company-cluj' : i === 1 ? 'company-bucharest' : 'company-oradea';
      await setTenantDoc(tenantId, 'companies', id, defaultCompanies[i]);
    }

    // 2. Seed workers
    const defaultWorkers = [
      { firstName: 'Andrei', lastName: 'Popescu', phone: '+40 741 234 567', email: 'andrei@electricvision.eu', experienceLevel: 'manager', isTeamLeader: true, hourlyRate: 85, isActive: true },
      { firstName: 'Maria', lastName: 'Ionescu', phone: '+40 742 345 678', email: 'maria@electricvision.eu', experienceLevel: 'seniorWithDegree', isTeamLeader: false, hourlyRate: 70, isActive: true },
      { firstName: 'Ion', lastName: 'Munteanu', phone: '+40 743 456 789', email: 'ion@electricvision.eu', experienceLevel: 'senior', isTeamLeader: true, hourlyRate: 65, isActive: true },
      { firstName: 'Elena', lastName: 'Dragomir', phone: '+40 744 567 890', email: 'elena@electricvision.eu', experienceLevel: 'intermediateWithDegree', isTeamLeader: false, hourlyRate: 55, isActive: true },
      { firstName: 'Vlad', lastName: 'Gheorghiu', phone: '+40 745 678 901', email: 'vlad@electricvision.eu', experienceLevel: 'intermediate', isTeamLeader: false, hourlyRate: 50, isActive: true },
      { firstName: 'Ana', lastName: 'Popa', phone: '+40 746 789 012', email: 'ana@electricvision.eu', experienceLevel: 'juniorWithDegree', isTeamLeader: false, hourlyRate: 40, isActive: true },
      { firstName: 'Mihai', lastName: 'Stan', phone: '+40 747 890 123', email: 'mihai@electricvision.eu', experienceLevel: 'junior', isTeamLeader: false, hourlyRate: 35, isActive: true },
      { firstName: 'Cristian', lastName: 'Barbu', phone: '+40 748 901 234', email: 'cristian@electricvision.eu', experienceLevel: 'associated', isTeamLeader: false, hourlyRate: 25, isActive: false }
    ];

    for (let i = 0; i < defaultWorkers.length; i++) {
      const id = String(i + 1);
      await setTenantDoc(tenantId, 'workers', id, defaultWorkers[i]);
    }

    // 3. Seed sites
    const defaultSites = [
      { name: 'Vila Popescu', address: 'Str. Eroilor 15, Cluj-Napoca', clientName: 'Popescu Ion', status: 'in_progress', progress: 65, budget: 125000, startDate: '2026-03-15', workers: ['Andrei P.', 'Maria I.', 'Ion M.', 'Vlad G.'] },
      { name: 'Bloc Florești - Et. 3', address: 'Str. Avram Iancu 42, Florești', clientName: 'SC Residential SRL', status: 'in_progress', progress: 40, budget: 85000, startDate: '2026-04-01', workers: ['Elena D.', 'Ana P.', 'Mihai S.'] },
      { name: 'Birouri Sigma Center', address: 'Bd. 21 Decembrie 77, Cluj-Napoca', clientName: 'Sigma Development', status: 'planned', progress: 0, budget: 210000, startDate: '2026-07-01', workers: [] },
      { name: 'Casa Marin - Borșa', address: 'Str. Libertății 8, Borșa', clientName: 'Marin Alexandru', status: 'completed', progress: 100, budget: 45000, startDate: '2026-01-10', workers: [] },
      { name: 'Hotel Panoramic Renovare', address: 'Str. Republicii 120, Cluj-Napoca', clientName: 'SC Turism SA', status: 'in_progress', progress: 25, budget: 350000, startDate: '2026-05-01', workers: ['Andrei P.', 'Maria I.', 'Ion M.', 'Elena D.', 'Vlad G.', 'Ana P.', 'Mihai S.', 'Cristian B.'] },
      { name: 'Depozit Logistic Turda', address: 'Zona Industrială, Turda', clientName: 'SC Logistica SRL', status: 'on_hold', progress: 15, budget: 180000, startDate: '2026-02-20', workers: ['Ion M.'] },
      { name: 'Restaurant Bella Vista', address: 'Str. Napoca 5, Cluj-Napoca', clientName: 'Bella Vista SRL', status: 'planned', progress: 0, budget: 95000, startDate: '2026-08-15', workers: [] },
      { name: 'Clădire Rezidențială Dej', address: 'Str. 1 Mai 33, Dej', clientName: 'SC Imobiliare SA', status: 'in_progress', progress: 55, budget: 420000, startDate: '2026-04-10', workers: ['Andrei P.', 'Elena D.', 'Mihai S.', 'Ana P.', 'Vlad G.'] }
    ];

    for (let i = 0; i < defaultSites.length; i++) {
      const id = String(i + 1);
      await setTenantDoc(tenantId, 'sites', id, defaultSites[i]);
    }

    // 4. Seed contacts
    const defaultContacts = [
      { type: 'client', firstName: 'Popescu', lastName: 'Ion', company: '', phone: '+40 741 111 222', email: 'popescu.ion@gmail.com', address: 'Str. Eroilor 15, Cluj-Napoca', workTypes: ['Rezidențial'] },
      { type: 'client', firstName: 'Marin', lastName: 'Alexandru', company: '', phone: '+40 742 222 333', email: 'marin.alex@yahoo.com', address: 'Str. Libertății 8, Borșa', workTypes: ['Rezidențial'] },
      { type: 'supplier', firstName: '', lastName: '', company: 'Sigma Development', phone: '+40 264 111 222', email: 'office@sigma.ro', address: 'Bd. 21 Decembrie 77, Cluj', workTypes: ['Birouri', 'Comercial'] },
      { type: 'supplier', firstName: '', lastName: '', company: 'SC Turism SA', phone: '+40 264 333 444', email: 'achizitii@turism-sa.ro', address: 'Str. Republicii 120, Cluj', workTypes: ['Hospitality'] },
      { type: 'supplier', firstName: '', lastName: '', company: 'Elmark Romania', phone: '+40 264 555 666', email: 'comenzi@elmark.ro', address: 'Zona Industriala, Turda', workTypes: ['Furnizor materiale'] },
      { type: 'subcontractor', firstName: 'Vasile', lastName: 'Crăciun', company: 'Clima Expert SRL', phone: '+40 743 444 555', email: 'vasile@climaexpert.ro', address: 'Str. Fabricii 12, Cluj', workTypes: ['HVAC', 'Climatizare'] }
    ];

    for (let i = 0; i < defaultContacts.length; i++) {
      const id = String(i + 1);
      await setTenantDoc(tenantId, 'contacts', id, defaultContacts[i]);
    }

    // 5. Seed stocks
    const defaultStocks = [
      { name: 'Copper Wire NYM 3x1.5mm²', category: 'cabling', qty: 250, unit: 'm', threshold: 100, preferredSupplier: 'Elmark' },
      { name: 'Copper Wire NYM 3x2.5mm²', category: 'cabling', qty: 40, unit: 'm', threshold: 150, preferredSupplier: 'Electro Global' },
      { name: 'Circuit Breaker MCB 1P 16A', category: 'protection', qty: 15, unit: 'pcs', threshold: 30, preferredSupplier: 'Schneider Direct' },
      { name: 'Junction Box IP55', category: 'fixtures', qty: 85, unit: 'pcs', threshold: 50, preferredSupplier: 'Elmark' },
      { name: 'Insulating Tape (Black)', category: 'consolidated', qty: 8, unit: 'rolls', threshold: 20, preferredSupplier: 'Elmark' },
      { name: 'Main Distribution Cabinet', category: 'protection', qty: 3, unit: 'pcs', threshold: 2, preferredSupplier: 'Schneider Direct' }
    ];

    for (let i = 0; i < defaultStocks.length; i++) {
      const id = String(i + 1);
      await setTenantDoc(tenantId, 'stocks', id, defaultStocks[i]);
    }

    console.log('Seed operations completed successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}
