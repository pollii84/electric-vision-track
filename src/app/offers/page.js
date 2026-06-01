'use client';

import { useState, useMemo } from 'react';
import { useRouter as useNextRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_SITES = [
  { id: '1', name: 'Vila Popescu', clientName: 'Popescu Ion' },
  { id: '2', name: 'Bloc Florești - Et. 3', clientName: 'SC Residential SRL' },
  { id: '3', name: 'Birouri Sigma Center', clientName: 'Sigma Development' },
];

const DEMO_OFFERS_DATA = {
  // Site ID '1' Vila Popescu
  '1': {
    batch: 'Phase 1: Cabling',
    originalSubtotal: 3510,
    items: [
      {
        name: 'Cablu NYM 3x2.5mm',
        qty: 500,
        unit: 'm',
        quotePrice: 3.20,
        bids: {
          elmark: 3.10,
          electroGlobal: 3.00,
          schneider: 3.40,
        }
      },
      {
        name: 'Întrerupător automat 16A',
        qty: 24,
        unit: 'buc',
        quotePrice: 25.00,
        bids: {
          elmark: 24.50,
          electroGlobal: 23.80,
          schneider: 26.00,
        }
      },
      {
        name: 'Priză simplă Legrand',
        qty: 45,
        unit: 'buc',
        quotePrice: 18.00,
        bids: {
          elmark: 19.00,
          electroGlobal: 17.50,
          schneider: 19.50,
        }
      },
      {
        name: 'Tub PVC 20mm',
        qty: 200,
        unit: 'm',
        quotePrice: 2.50,
        bids: {
          elmark: 2.30,
          electroGlobal: 2.40,
          schneider: 2.60,
        }
      }
    ]
  },
  // Site ID '2'
  '2': {
    batch: 'Phase 1: Cabling',
    originalSubtotal: 2150,
    items: [
      {
        name: 'Cablu NYM 3x1.5mm',
        qty: 400,
        unit: 'm',
        quotePrice: 2.10,
        bids: {
          elmark: 2.05,
          electroGlobal: 1.95,
          schneider: 2.20,
        }
      },
      {
        name: 'Întrerupător automat 10A',
        qty: 16,
        unit: 'buc',
        quotePrice: 22.00,
        bids: {
          elmark: 22.50,
          electroGlobal: 21.00,
          schneider: 23.50,
        }
      },
      {
        name: 'Doză de legătură',
        qty: 80,
        unit: 'buc',
        quotePrice: 4.00,
        bids: {
          elmark: 3.80,
          electroGlobal: 4.20,
          schneider: 4.50,
        }
      }
    ]
  },
  // Site ID '3'
  '3': {
    batch: 'Phase 1: Cabling',
    originalSubtotal: 5120,
    items: [
      {
        name: 'Cablu NYM 3x2.5mm',
        qty: 800,
        unit: 'm',
        quotePrice: 3.20,
        bids: {
          elmark: 3.15,
          electroGlobal: 3.05,
          schneider: 3.35,
        }
      },
      {
        name: 'Tablou electric 24 module',
        qty: 4,
        unit: 'buc',
        quotePrice: 180.00,
        bids: {
          elmark: 175.00,
          electroGlobal: 178.00,
          schneider: 185.00,
        }
      },
      {
        name: 'Șină DIN',
        qty: 20,
        unit: 'buc',
        quotePrice: 12.00,
        bids: {
          elmark: 11.50,
          electroGlobal: 12.50,
          schneider: 13.00,
        }
      }
    ]
  }
};

const SUPPLIER_DETAILS = {
  elmark: { name: 'Elmark Romania', phone: '+40 264 555 666', email: 'comenzi@elmark.ro' },
  electroGlobal: { name: 'Electro Global', phone: '+40 264 111 222', email: 'sales@electroglobal.ro' },
  schneider: { name: 'Schneider Direct', phone: '+40 264 777 888', email: 'distrib@schneider.ro' },
};

export default function OffersPage() {
  const router = useNextRouter();
  const { t } = useI18n();

  const [selectedSiteId, setSelectedSiteId] = useState('1');
  const [orderStatus, setOrderStatus] = useState('');

  const currentOfferData = useMemo(() => {
    return DEMO_OFFERS_DATA[selectedSiteId] || DEMO_OFFERS_DATA['1'];
  }, [selectedSiteId]);

  const supplierTotals = useMemo(() => {
    const totals = { elmark: 0, electroGlobal: 0, schneider: 0 };
    currentOfferData.items.forEach((item) => {
      totals.elmark += item.qty * item.bids.elmark;
      totals.electroGlobal += item.qty * item.bids.electroGlobal;
      totals.schneider += item.qty * item.bids.schneider;
    });
    return totals;
  }, [currentOfferData]);

  const lowestSupplier = useMemo(() => {
    const totals = supplierTotals;
    let minKey = 'electroGlobal';
    let minVal = totals[minKey];

    Object.entries(totals).forEach(([key, val]) => {
      if (val < minVal) {
        minVal = val;
        minKey = key;
      }
    });

    return minKey;
  }, [supplierTotals]);

  const handleGenerateOrder = (supplierKey) => {
    setOrderStatus('generating');
    setTimeout(() => {
      setOrderStatus('success');
      setTimeout(() => {
        setOrderStatus('');
        // Navigate to orders page, passing site & supplier
        router.push(`/orders?site=${selectedSiteId}&supplier=${supplierKey}&new=1`);
      }, 1000);
    }, 800);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>💰 {t('offers.title')}</h1>
      </div>

      {/* Select Site and Batch */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)', alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 240 }}>
          <label className="form-label" htmlFor="site-select">{t('quotes.fields.site')}</label>
          <select
            id="site-select"
            className="form-select"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
          >
            {DEMO_SITES.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} — {site.clientName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 200 }}>
          <label className="form-label">Batch Phase</label>
          <input
            className="form-input"
            type="text"
            value={currentOfferData.batch}
            disabled
            style={{ background: 'var(--clr-bg-deep)', opacity: 0.8, cursor: 'not-allowed' }}
          />
        </div>
      </div>

      {/* Offers Comparison Matrix */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--sp-md) var(--sp-md) 0 var(--sp-md)' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>📊 {t('offers.compareOffers')}</h2>
        </div>

        <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr style={{ textAlign: 'center' }}>
                <th style={{ textAlign: 'left' }}>Required Materials</th>
                <th>Qty</th>
                <th>Target Quote</th>
                <th>Elmark Romania</th>
                <th>Electro Global</th>
                <th>Schneider Direct</th>
              </tr>
            </thead>
            <tbody>
              {currentOfferData.items.map((item, idx) => {
                // Find lowest bid price for this line item
                const minBid = Math.min(item.bids.elmark, item.bids.electroGlobal, item.bids.schneider);

                return (
                  <tr key={idx}>
                    <td className="font-semibold" style={{ textAlign: 'left' }}>{item.name}</td>
                    <td>{item.qty} {item.unit}</td>
                    {/* Target Quote column */}
                    <td style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                      <span className="font-medium">{formatCurrency(item.quotePrice)} RON</span>
                      <div className="text-muted text-xs">{formatCurrency(item.qty * item.quotePrice)} RON</div>
                    </td>

                    {/* Elmark bid column */}
                    <td style={{ background: item.bids.elmark === minBid ? 'rgba(34, 197, 94, 0.04)' : 'transparent' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span className="font-medium" style={{ color: item.bids.elmark > item.quotePrice ? 'var(--clr-danger)' : 'inherit' }}>
                          {formatCurrency(item.bids.elmark)} RON
                        </span>
                        <span className="text-muted text-xs">{formatCurrency(item.qty * item.bids.elmark)} RON</span>
                        {item.bids.elmark === minBid && (
                          <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 5px' }}>✓ Lowest</span>
                        )}
                        {item.bids.elmark > item.quotePrice && (
                          <span className="badge badge-danger" style={{ fontSize: '10px', padding: '1px 5px' }} title={t('offers.marginErosion')}>⚠️ Risk</span>
                        )}
                      </div>
                    </td>

                    {/* Electro Global bid column */}
                    <td style={{ background: item.bids.electroGlobal === minBid ? 'rgba(34, 197, 94, 0.04)' : 'transparent' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span className="font-medium" style={{ color: item.bids.electroGlobal > item.quotePrice ? 'var(--clr-danger)' : 'inherit' }}>
                          {formatCurrency(item.bids.electroGlobal)} RON
                        </span>
                        <span className="text-muted text-xs">{formatCurrency(item.qty * item.bids.electroGlobal)} RON</span>
                        {item.bids.electroGlobal === minBid && (
                          <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 5px' }}>✓ Lowest</span>
                        )}
                        {item.bids.electroGlobal > item.quotePrice && (
                          <span className="badge badge-danger" style={{ fontSize: '10px', padding: '1px 5px' }} title={t('offers.marginErosion')}>⚠️ Risk</span>
                        )}
                      </div>
                    </td>

                    {/* Schneider bid column */}
                    <td style={{ background: item.bids.schneider === minBid ? 'rgba(34, 197, 94, 0.04)' : 'transparent' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span className="font-medium" style={{ color: item.bids.schneider > item.quotePrice ? 'var(--clr-danger)' : 'inherit' }}>
                          {formatCurrency(item.bids.schneider)} RON
                        </span>
                        <span className="text-muted text-xs">{formatCurrency(item.qty * item.bids.schneider)} RON</span>
                        {item.bids.schneider === minBid && (
                          <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 5px' }}>✓ Lowest</span>
                        )}
                        {item.bids.schneider > item.quotePrice && (
                          <span className="badge badge-danger" style={{ fontSize: '10px', padding: '1px 5px' }} title={t('offers.marginErosion')}>⚠️ Risk</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Bids Totals summary row */}
              <tr style={{ background: 'var(--clr-bg-elevated)', borderTop: '2px solid var(--clr-border)', fontWeight: 'bold' }}>
                <td colSpan="2" style={{ textAlign: 'right', padding: '16px' }}>Total Bids:</td>
                <td style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px' }}>
                  {formatCurrency(currentOfferData.originalSubtotal)} RON
                  <div className="text-muted" style={{ fontSize: '10px', fontWeight: 'normal', marginTop: 2 }}>Original Quote</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ color: supplierTotals.elmark > currentOfferData.originalSubtotal ? 'var(--clr-danger)' : 'var(--clr-success)' }}>
                    {formatCurrency(supplierTotals.elmark)} RON
                  </span>
                  <div className="text-muted" style={{ fontSize: '10px', fontWeight: 'normal', marginTop: 2 }}>
                    {supplierTotals.elmark > currentOfferData.originalSubtotal ? '+' : ''}
                    {formatCurrency(supplierTotals.elmark - currentOfferData.originalSubtotal)} RON
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ color: supplierTotals.electroGlobal > currentOfferData.originalSubtotal ? 'var(--clr-danger)' : 'var(--clr-success)' }}>
                    {formatCurrency(supplierTotals.electroGlobal)} RON
                  </span>
                  <div className="text-muted" style={{ fontSize: '10px', fontWeight: 'normal', marginTop: 2 }}>
                    {supplierTotals.electroGlobal > currentOfferData.originalSubtotal ? '+' : ''}
                    {formatCurrency(supplierTotals.electroGlobal - currentOfferData.originalSubtotal)} RON
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ color: supplierTotals.schneider > currentOfferData.originalSubtotal ? 'var(--clr-danger)' : 'var(--clr-success)' }}>
                    {formatCurrency(supplierTotals.schneider)} RON
                  </span>
                  <div className="text-muted" style={{ fontSize: '10px', fontWeight: 'normal', marginTop: 2 }}>
                    +{formatCurrency(supplierTotals.schneider - currentOfferData.originalSubtotal)} RON
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Selection Cards (Bottom Row) */}
      <h3 style={{ marginTop: 'var(--sp-lg)', marginBottom: 'var(--sp-md)' }}>📦 {t('offers.selectSupplier')}</h3>

      <div className="content-grid grid-cols-3">
        {Object.entries(SUPPLIER_DETAILS).map(([key, details]) => {
          const isLowest = key === lowestSupplier;
          const totalVal = supplierTotals[key];
          const exceedsOriginal = totalVal > currentOfferData.originalSubtotal;

          return (
            <div
              key={key}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-sm)',
                border: isLowest ? '2px solid var(--clr-success)' : '1px solid var(--clr-border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--fs-md)' }} className="font-bold">{details.name}</h4>
                {isLowest && (
                  <span className="badge badge-success">✓ Best Choice</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '6px 0' }} className="text-muted text-xs">
                <span>📞 {details.phone}</span>
                <span>✉️ {details.email}</span>
              </div>

              <div style={{
                marginTop: 'auto',
                borderTop: '1px solid var(--clr-border)',
                paddingTop: 'var(--sp-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <span className="text-muted text-xs">Total Bid Value</span>
                  <div className="font-bold" style={{ color: exceedsOriginal ? 'var(--clr-danger)' : 'var(--clr-success)', fontSize: 'var(--fs-md)', marginTop: 2 }}>
                    {formatCurrency(totalVal)} RON
                  </div>
                </div>
                <button
                  className={`btn ${isLowest ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => handleGenerateOrder(key)}
                  disabled={orderStatus === 'generating'}
                >
                  {orderStatus === 'generating' ? 'Creating...' : t('offers.generateOrder')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
