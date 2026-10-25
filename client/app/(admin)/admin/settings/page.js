'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const emptyLocationForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  openingHours: '',
  amenities: [],
};

function AmenitiesInput({ value, onChange }) {
  const [input, setInput] = useState('');
  const add = () => {
    const s = input.trim();
    if (s && !value.includes(s)) { onChange([...value, s]); setInput(''); }
  };
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Amenities</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {value.map((a) => (
          <span key={a} style={{ padding: '3px 10px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 100, fontSize: 12, color: 'var(--accent-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            {a}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== a))} style={{ background: 'none', border: 'none', color: 'var(--accent-text)', cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Add amenity..." style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border-strong)', borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
        <Button type="button" variant="ghost" size="sm" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

function SettingField({ label, settingKey, type = 'text', value, onSaved }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setVal(value); }, [value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/settings/${settingKey}`, { value: val });
      toast.success('Setting saved');
      setEditing(false);
      if (onSaved) onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{label}</p>
        {editing ? (
          <input
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--accent-border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
          />
        ) : (
          <p style={{ fontSize: 14, color: val ? 'var(--text)' : 'var(--muted)', fontFamily: type === 'number' ? 'monospace' : 'inherit' }}>
            {val || '- not set -'}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {editing ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setVal(value); }}>Cancel</Button>
            <Button variant="accent" size="sm" loading={saving} onClick={handleSave}>Save</Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>
    </div>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px', marginBottom: 4 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('locations');
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, location: null });
  const [form, setForm] = useState(emptyLocationForm);
  const [saving, setSaving] = useState(false);
  const [appSettings, setAppSettings] = useState({});
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => { fetchLocations(); }, []);

  const fetchAppSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const { data } = await api.get('/admin/settings');
      const map = {};
      (data.settings || []).forEach((s) => { map[s.key] = s.value; });
      setAppSettings(map);
    } catch { setAppSettings({}); } finally { setLoadingSettings(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'general') fetchAppSettings();
  }, [activeTab, fetchAppSettings]);

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const { data } = await api.get('/admin/locations');
      setLocations(data.locations || data || []);
    } catch { setLocations([]); } finally { setLoadingLocations(false); }
  };

  const openCreate = () => { setForm(emptyLocationForm); setFormModal({ open: true, location: null }); };
  const openEdit = (loc) => {
    setForm({
      name: loc.name || '',
      address: loc.address || '',
      city: loc.city || '',
      state: loc.state || '',
      phone: loc.phone || '',
      email: loc.email || '',
      openingHours: loc.openingHours || '',
      amenities: loc.amenities || [],
    });
    setFormModal({ open: true, location: loc });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (formModal.location) {
        await api.put(`/admin/locations/${formModal.location._id}`, form);
        toast.success('Location updated');
      } else {
        await api.post('/admin/locations', form);
        toast.success('Location created');
      }
      setFormModal({ open: false, location: null });
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (loc) => {
    try {
      const action = loc.isActive ? 'deactivate' : 'activate';
      await api.patch(`/admin/locations/${loc._id}/${action}`);
      toast.success(`Location ${action}d`);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div style={{ maxWidth: 1000, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: 'var(--accent-text)', fontSize: 12, fontWeight: 800, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</p>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', textTransform: 'uppercase' }}>Settings</h1>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 4,
          background: 'var(--surface)',
          borderRadius: 12,
          padding: 4,
          width: 'fit-content',
          marginBottom: 24,
          border: '1px solid var(--border)',
        }}
      >
        {['locations', 'general', 'roles'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              color: activeTab === tab ? 'var(--accent-fg)' : 'var(--muted)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'locations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button variant="accent" onClick={openCreate}>+ Add Location</Button>
          </div>
          {loadingLocations ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {locations.map((loc) => (
                <div
                  key={loc._id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--accent-dim)',
                      border: '1px solid var(--accent-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    📍
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h3 style={{ fontWeight: 800, color: 'var(--text)', fontSize: 15 }}>{loc.name}</h3>
                      <Badge status={loc.isActive ? 'active' : 'cancelled'}>{loc.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: 13 }}>{[loc.address, loc.city, loc.state].filter(Boolean).join(', ')}</p>
                    {loc.amenities?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {loc.amenities.map((a) => (
                          <span key={a} style={{ padding: '1px 8px', background: 'var(--surface2)', borderRadius: 100, fontSize: 11, color: 'var(--muted)' }}>{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(loc)}>Edit</Button>
                    <Button variant={loc.isActive ? 'danger' : 'ghost'} size="sm" onClick={() => handleToggle(loc)}>
                      {loc.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
              {locations.length === 0 && (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>No locations yet</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'general' && (
        <div>
          {loadingSettings ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--accent-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            </div>
          ) : (
            <>
              <SettingsSection title="Membership">
                <SettingField label="Joining Fee (NGN)" settingKey="joining_fee" type="number" value={appSettings.joining_fee || ''} onSaved={fetchAppSettings} />
              </SettingsSection>

              <SettingsSection title="Bank Details (for manual transfers)">
                <SettingField label="Bank Name" settingKey="bank_name" value={appSettings.bank_name || ''} onSaved={fetchAppSettings} />
                <SettingField label="Account Number" settingKey="bank_account_number" value={appSettings.bank_account_number || ''} onSaved={fetchAppSettings} />
                <SettingField label="Account Name" settingKey="bank_account_name" value={appSettings.bank_account_name || ''} onSaved={fetchAppSettings} />
              </SettingsSection>

              <SettingsSection title="Locker Pricing">
                <SettingField label="Monthly Price (NGN)" settingKey="locker_monthly_price" type="number" value={appSettings.locker_monthly_price || ''} onSaved={fetchAppSettings} />
                <SettingField label="Quarterly Price (NGN)" settingKey="locker_quarterly_price" type="number" value={appSettings.locker_quarterly_price || ''} onSaved={fetchAppSettings} />
                <SettingField label="Paystack Monthly Plan Code" settingKey="locker_paystack_monthly_plan_code" value={appSettings.locker_paystack_monthly_plan_code || ''} onSaved={fetchAppSettings} />
                <SettingField label="Paystack Quarterly Plan Code" settingKey="locker_paystack_quarterly_plan_code" value={appSettings.locker_paystack_quarterly_plan_code || ''} onSaved={fetchAppSettings} />
              </SettingsSection>

              <SettingsSection title="Personal Trainer">
                <p style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 10, lineHeight: 1.6, marginBottom: 4 }}>
                  💡 PT packages (duration &amp; price) are managed in <strong style={{ color: 'var(--accent-text)' }}>Admin → PT Plans</strong>.
                </p>
                <SettingField label="Receptionist Notification Email" settingKey="receptionist_notification_email" type="email" value={appSettings.receptionist_notification_email || ''} onSaved={fetchAppSettings} />
              </SettingsSection>
            </>
          )}
        </div>
      )}

      {activeTab === 'roles' && (
        <div style={{ background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 20 }}>Role Permissions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { role: 'Admin', color: 'var(--accent-text)', desc: 'Full access to all features, settings, and reports', perms: ['All permissions'] },
              { role: 'Manager', color: '#00d4ff', desc: 'Manage members, classes, trainers. View reports.', perms: ['Members', 'Classes', 'Trainers', 'Reports'] },
              { role: 'Staff', color: '#ffa500', desc: 'Check-in members, manage bookings, view schedule', perms: ['Bookings', 'Check-ins', 'Schedule'] },
              { role: 'Member', color: 'var(--muted)', desc: 'Book classes, view schedule, manage profile', perms: ['Book Classes', 'View Schedule', 'Manage Profile'] },
            ].map((r) => (
              <div
                key={r.role}
                style={{
                  padding: '16px 20px',
                  background: 'var(--surface2)',
                  borderRadius: 12,
                  border: `1px solid ${r.color}20`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: `${r.color}15`,
                    border: `1px solid ${r.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {r.role === 'Admin' ? '👑' : r.role === 'Manager' ? '🏢' : r.role === 'Staff' ? '🎫' : '💪'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, color: r.color, fontSize: 14 }}>{r.role}</span>
                  </div>
                  <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>{r.desc}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {r.perms.map((p) => (
                      <span key={p} style={{ padding: '2px 10px', background: `${r.color}10`, border: `1px solid ${r.color}25`, borderRadius: 100, fontSize: 11, color: r.color, fontWeight: 700 }}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={formModal.open} onClose={() => setFormModal({ open: false, location: null })} title={formModal.location ? 'Edit Location' : 'Add Location'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Location Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <Input label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
            <Input label="State" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <Input label="Opening Hours" value={form.openingHours} onChange={(e) => setForm((p) => ({ ...p, openingHours: e.target.value }))} placeholder="e.g. Mon-Fri 5AM-10PM, Sat-Sun 7AM-8PM" />
          <AmenitiesInput value={form.amenities} onChange={(a) => setForm((p) => ({ ...p, amenities: a }))} />
          <div className="apex-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="ghost" onClick={() => setFormModal({ open: false, location: null })}>Cancel</Button>
            <Button type="submit" variant="accent" loading={saving}>{formModal.location ? 'Save Changes' : 'Add Location'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
