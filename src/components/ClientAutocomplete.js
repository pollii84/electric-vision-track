'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export function getContactDisplayName(contact) {
  if (contact.company && !contact.firstName && !contact.lastName) {
    return contact.company;
  }
  const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
  return contact.company ? `${name} (${contact.company})` : name;
}

// Typeahead over the tenant's contacts. Opens after 3 typed characters;
// last option always offers creating a new client contact.
export default function ClientAutocomplete({
  contacts,
  value,
  onChange,
  onSelect,
  onCreateNew,
  inputId,
  placeholder,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const query = (value || '').trim().toLowerCase();

  const matches = useMemo(() => {
    if (query.length < 3) return [];
    return contacts
      .filter((c) => {
        const display = getContactDisplayName(c).toLowerCase();
        return (
          display.includes(query) ||
          (c.company || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [contacts, query]);

  const showDropdown = open && query.length >= 3;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        id={inputId}
        className="form-input"
        type="text"
        autoComplete="off"
        placeholder={placeholder || t('invoices.clientSearch.placeholder')}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'var(--clr-bg-elevated)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            zIndex: 50,
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c);
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid var(--clr-border)',
                color: 'var(--clr-text)',
                cursor: 'pointer',
                fontSize: 'var(--fs-sm)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <div style={{ fontWeight: 600 }}>{getContactDisplayName(c)}</div>
              {(c.email || c.address) && (
                <div style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-xs)', marginTop: 2 }}>
                  {[c.email, c.address].filter(Boolean).join(' · ')}
                </div>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onCreateNew(value.trim());
              setOpen(false);
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '10px 12px',
              background: 'none',
              border: 'none',
              color: 'var(--clr-primary)',
              cursor: 'pointer',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            ➕ {t('invoices.clientSearch.createNew').replace('{name}', value.trim())}
          </button>
        </div>
      )}
    </div>
  );
}
