import React, { useState, useEffect } from 'react';
import api, { errMsg } from '../api/axios';
import { useToast } from '../components/Toast';
import { useT } from '../context/LangContext';

function Toggle({ label, desc, value, onChange, loading }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid #F3F4F6',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{desc}</div>}
      </div>
      <div className={`toggle${value ? ' on' : ''}`} onClick={!loading ? onChange : undefined}
        style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'wait' : 'pointer', flexShrink: 0 }} />
    </div>
  );
}

export default function Settings() {
  const toast     = useToast();
  const t         = useT();
  const [config,  setConfig]  = useState({ isRamadanSeason: false });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get('/api/app/config')
      .then(r => {
        const d = r.data?.data ?? r.data;
        if (d) setConfig({ isRamadanSeason: !!d.isRamadanSeason });
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    const next = !config[key];
    setSaving(true);
    try {
      await api.patch('/api/admin/config', { [key]: next });
      setConfig(prev => ({ ...prev, [key]: next }));
      toast(t('settingsSaved'), 'success');
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  );

  return (
    <div>
      <h1 className="page-title">{t('settingsTitle')}</h1>
      <div className="card" style={{ maxWidth: 520 }}>
        <p className="section-title">{t('platformSettingsTitle')}</p>
        <Toggle
          label={t('ramadanMode')}
          desc={t('ramadanModeDesc')}
          value={config.isRamadanSeason}
          onChange={() => toggle('isRamadanSeason')}
          loading={saving}
        />
      </div>
    </div>
  );
}
