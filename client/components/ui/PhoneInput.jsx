'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria',           dial: '+234', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana',             dial: '+233', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya',             dial: '+254', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa',      dial: '+27',  flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt',             dial: '+20',  flag: '🇪🇬' },
  { code: 'ET', name: 'Ethiopia',          dial: '+251', flag: '🇪🇹' },
  { code: 'TZ', name: 'Tanzania',          dial: '+255', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda',            dial: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda',            dial: '+250', flag: '🇷🇼' },
  { code: 'SN', name: 'Senegal',           dial: '+221', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire",     dial: '+225', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon',          dial: '+237', flag: '🇨🇲' },
  { code: 'AO', name: 'Angola',            dial: '+244', flag: '🇦🇴' },
  { code: 'MZ', name: 'Mozambique',        dial: '+258', flag: '🇲🇿' },
  { code: 'ZM', name: 'Zambia',            dial: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe',          dial: '+263', flag: '🇿🇼' },
  { code: 'BJ', name: 'Benin',             dial: '+229', flag: '🇧🇯' },
  { code: 'BF', name: 'Burkina Faso',      dial: '+226', flag: '🇧🇫' },
  { code: 'CD', name: 'DR Congo',          dial: '+243', flag: '🇨🇩' },
  { code: 'CG', name: 'Congo',             dial: '+242', flag: '🇨🇬' },
  { code: 'GA', name: 'Gabon',             dial: '+241', flag: '🇬🇦' },
  { code: 'GN', name: 'Guinea',            dial: '+224', flag: '🇬🇳' },
  { code: 'ML', name: 'Mali',              dial: '+223', flag: '🇲🇱' },
  { code: 'MR', name: 'Mauritania',        dial: '+222', flag: '🇲🇷' },
  { code: 'MW', name: 'Malawi',            dial: '+265', flag: '🇲🇼' },
  { code: 'NA', name: 'Namibia',           dial: '+264', flag: '🇳🇦' },
  { code: 'NE', name: 'Niger',             dial: '+227', flag: '🇳🇪' },
  { code: 'SD', name: 'Sudan',             dial: '+249', flag: '🇸🇩' },
  { code: 'SL', name: 'Sierra Leone',      dial: '+232', flag: '🇸🇱' },
  { code: 'SO', name: 'Somalia',           dial: '+252', flag: '🇸🇴' },
  { code: 'SS', name: 'South Sudan',       dial: '+211', flag: '🇸🇸' },
  { code: 'TG', name: 'Togo',              dial: '+228', flag: '🇹🇬' },
  { code: 'MA', name: 'Morocco',           dial: '+212', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia',           dial: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algeria',           dial: '+213', flag: '🇩🇿' },
  { code: 'LY', name: 'Libya',             dial: '+218', flag: '🇱🇾' },
  { code: 'MU', name: 'Mauritius',         dial: '+230', flag: '🇲🇺' },

  { code: 'GB', name: 'United Kingdom',    dial: '+44',  flag: '🇬🇧' },
  { code: 'IE', name: 'Ireland',           dial: '+353', flag: '🇮🇪' },
  { code: 'DE', name: 'Germany',           dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',            dial: '+33',  flag: '🇫🇷' },
  { code: 'IT', name: 'Italy',             dial: '+39',  flag: '🇮🇹' },
  { code: 'ES', name: 'Spain',             dial: '+34',  flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal',          dial: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Netherlands',       dial: '+31',  flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium',           dial: '+32',  flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland',       dial: '+41',  flag: '🇨🇭' },
  { code: 'AT', name: 'Austria',           dial: '+43',  flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden',            dial: '+46',  flag: '🇸🇪' },
  { code: 'NO', name: 'Norway',            dial: '+47',  flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark',           dial: '+45',  flag: '🇩🇰' },
  { code: 'FI', name: 'Finland',           dial: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland',            dial: '+48',  flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic',    dial: '+420', flag: '🇨🇿' },
  { code: 'RO', name: 'Romania',           dial: '+40',  flag: '🇷🇴' },
  { code: 'HU', name: 'Hungary',           dial: '+36',  flag: '🇭🇺' },
  { code: 'GR', name: 'Greece',            dial: '+30',  flag: '🇬🇷' },

  { code: 'US', name: 'United States',     dial: '+1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Canada',            dial: '+1',   flag: '🇨🇦' },
  { code: 'BR', name: 'Brazil',            dial: '+55',  flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico',            dial: '+52',  flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina',         dial: '+54',  flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia',          dial: '+57',  flag: '🇨🇴' },
  { code: 'CL', name: 'Chile',             dial: '+56',  flag: '🇨🇱' },
  { code: 'JM', name: 'Jamaica',           dial: '+1876',flag: '🇯🇲' },
  { code: 'TT', name: 'Trinidad & Tobago', dial: '+1868',flag: '🇹🇹' },

  { code: 'AE', name: 'UAE',               dial: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia',      dial: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar',             dial: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait',            dial: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain',           dial: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman',              dial: '+968', flag: '🇴🇲' },
  { code: 'IL', name: 'Israel',            dial: '+972', flag: '🇮🇱' },

  { code: 'IN', name: 'India',             dial: '+91',  flag: '🇮🇳' },
  { code: 'CN', name: 'China',             dial: '+86',  flag: '🇨🇳' },
  { code: 'JP', name: 'Japan',             dial: '+81',  flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea',       dial: '+82',  flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore',         dial: '+65',  flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia',          dial: '+60',  flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines',       dial: '+63',  flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia',         dial: '+62',  flag: '🇮🇩' },
  { code: 'PK', name: 'Pakistan',          dial: '+92',  flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh',        dial: '+880', flag: '🇧🇩' },
  { code: 'AU', name: 'Australia',         dial: '+61',  flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand',       dial: '+64',  flag: '🇳🇿' },
];

export default function PhoneInput({ label = 'Phone Number', value = '', onChange, error, name }) {
  const parseValue = (v) => {
    if (!v) return { country: COUNTRIES[0], local: '' };
    const pn = parsePhoneNumberFromString(v);
    if (pn && pn.country) {
      const byCountry = COUNTRIES.find((c) => c.code === pn.country);
      if (byCountry) return { country: byCountry, local: pn.nationalNumber };
    }
    const match = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length)
      .find((c) => v.startsWith(c.dial));
    if (match) return { country: match, local: v.slice(match.dial.length) };
    return { country: COUNTRIES[0], local: v.replace(/^\+\d+/, '') };
  };

  const parsed = parseValue(value);
  const [selected, setSelected] = useState(parsed.country);
  const [localNumber, setLocalNumber] = useState(parsed.local);
  const [valid, setValid] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const emit = useCallback((country, local) => {
    if (!onChange) return;
    const digits = local.replace(/\D/g, '');
    if (!digits) {
      setValid(true);
      onChange({ target: { name, value: '' } });
      return;
    }
    const pn = parsePhoneNumberFromString(digits, country.code);
    if (pn) {
      setValid(pn.isValid());
      onChange({ target: { name, value: pn.number } });
    } else {
      setValid(false);
      onChange({ target: { name, value: `${country.dial}${digits.replace(/^0+/, '')}` } });
    }
  }, [onChange, name]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30);
  }, [open]);

  const filtered = COUNTRIES.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
  });

  const handleSelect = (country) => {
    setSelected(country);
    setOpen(false);
    setSearch('');
    emit(country, localNumber);
  };

  const handleLocalChange = (e) => {
    const raw = e.target.value.replace(/[^\d\s\-().]/g, '').replace(/^0+/, '');
    setLocalNumber(raw);
    emit(selected, raw);
  };

  const showError = error || (localNumber && !valid ? 'Enter a valid phone number for the selected country' : null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {label}
        </label>
      )}

      <div
        style={{
          display: 'flex',
          border: showError ? '1px solid rgba(255,68,68,0.6)' : '1px solid var(--border-strong)',
          borderRadius: 12,
          background: 'var(--surface2)',
          overflow: 'visible',
          position: 'relative',
          transition: 'border-color 0.2s',
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = showError ? 'rgba(255,68,68,0.8)' : 'var(--accent)';
        }}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.style.borderColor = showError ? 'rgba(255,68,68,0.6)' : 'var(--border-strong)';
          }
        }}
      >

        <div ref={dropdownRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              height: '100%',
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid var(--border-strong)',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              borderRadius: '12px 0 0 12px',
              minWidth: 80,
            }}
            aria-label="Select country code"
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{selected.flag}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.dial}</span>
            <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 2 }}>▼</span>
          </button>

          {open && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                zIndex: 9999,
                background: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                width: 260,
                overflow: 'hidden',
              }}
            >

              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search country or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    color: 'var(--text)',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '16px 12px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
                    No results
                  </div>
                ) : filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 14px',
                      background: selected.code === c.code ? 'rgba(200,255,0,0.07)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text)',
                      fontSize: 13,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,255,0,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = selected.code === c.code ? 'rgba(200,255,0,0.07)' : 'transparent'; }}
                  >
                    <span style={{ fontSize: 16 }}>{c.flag}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span style={{ color: 'var(--muted)', flexShrink: 0, fontSize: 12 }}>{c.dial}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <input
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={handleLocalChange}
          placeholder="8012345678"
          autoComplete="tel-national"
          style={{
            flex: 1,
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 15,
            minWidth: 0,
          }}
        />
      </div>

      {showError && (
        <span style={{ fontSize: 12, color: '#ff4444', marginTop: 2 }}>{showError}</span>
      )}
    </div>
  );
}
