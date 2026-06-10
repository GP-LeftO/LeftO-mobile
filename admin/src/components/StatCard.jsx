import React from 'react';

export default function StatCard({ icon, label, value, color, highlight, sub, delta }) {
  const deltaClass = delta > 0 ? 'badge delta-up' : delta < 0 ? 'badge delta-down' : 'badge delta-flat';
  const deltaIcon  = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';

  return (
    <div className="card card-lift" style={{
      borderLeft: highlight ? `4px solid ${highlight === true ? 'var(--red)' : highlight}` : undefined,
      display: 'flex', flexDirection: 'column', gap: 5,
      cursor: 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>

      <div style={{ fontSize: 30, fontWeight: 800, color: color || 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value ?? '—'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
        {sub && (
          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            ⚠️ {sub}
          </span>
        )}
        {delta != null && (
          <span className={deltaClass} style={{ fontSize: '0.68rem', marginLeft: sub ? 'auto' : undefined }}>
            {deltaIcon} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  );
}
