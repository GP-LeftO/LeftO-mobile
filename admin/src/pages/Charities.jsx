import React, { useState, useEffect } from 'react';
import api, { fmtDate, errMsg } from '../api/axios';
import { useToast } from '../components/Toast';
import { useT, useLang } from '../context/LangContext';
import DocViewer from '../components/DocViewer';

function Row({ label, value, dir }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13, width: 150, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }} dir={dir}>{value ?? '—'}</span>
    </div>
  );
}

function CharityDetailModal({ charity, onClose, t }) {
  const { lang } = useLang();
  const docs = charity.documents ?? charity.user?.documents ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div className="card" style={{
        width: 540, maxHeight: '85vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', margin: 0 }}>
              {charity.orgName ?? charity.name ?? '—'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{t('charityData')}</p>
          </div>
          <button className="btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Charity info */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {t('charityData')}
          </p>
          <Row label={t('orgName')}     value={charity.orgName ?? charity.name} />
          <Row label={t('region')}      value={charity.region} />
          {charity.description && <Row label={t('description')} value={charity.description} />}
          <Row label={t('registeredAt')} value={fmtDate(charity.createdAt, lang)} />
          {charity.status && <Row label={t('status')} value={charity.status} />}
        </div>

        {/* Coordinator info */}
        {charity.user && (
          <div style={{ marginBottom: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {lang === 'ar' ? 'بيانات المنسق' : 'Coordinator Info'}
            </p>
            <Row label={t('name')}     value={charity.user.name} />
            <Row label={t('phoneCol')} value={charity.user.phone} dir="ltr" />
            {charity.user.email && <Row label={t('email')} value={charity.user.email} dir="ltr" />}
            {charity.user.isBlocked != null && (
              <Row label={t('status')} value={charity.user.isBlocked ? `${t('blockedOnly')} 🚫` : `${t('activeOnly')} ✅`} />
            )}
          </div>
        )}

        {/* Documents */}
        <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            {t('documents')} ({docs.length})
          </p>
          <DocViewer docs={docs} />
          {docs.length === 0 && (
            <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>
              {lang === 'ar' ? 'لا توجد وثائق مرفقة' : 'No documents attached'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function RejectModal({ onConfirm, onCancel, t }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001,
    }}>
      <div className="card" style={{ width: 420 }}>
        <p className="section-title">{t('rejectReason')}</p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          placeholder={t('rejectReasonPlaceholder')} rows={4}
          style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--text)' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onCancel}>{t('cancel')}</button>
          <button className="btn-danger" onClick={() => onConfirm(reason)}>{t('reject')}</button>
        </div>
      </div>
    </div>
  );
}

export default function Charities() {
  const toast        = useToast();
  const t            = useT();
  const [tab,        setTab]        = useState('PENDING');
  const [charities,  setCharities]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [acting,     setActing]     = useState(null);
  const [rejectId,   setRejectId]   = useState(null);
  const [viewCharity, setViewCharity] = useState(null);

  const TABS = [
    { key: 'PENDING',  label: t('pending')  },
    { key: 'APPROVED', label: t('approved') },
  ];

  const load = (t_) => {
    setLoading(true);
    const url = t_ === 'PENDING' ? '/api/admin/charities/pending' : '/api/admin/users?role=CHARITY';
    api.get(url)
      .then(r => { const d = r.data?.data ?? r.data; setCharities(d?.charities ?? d?.users ?? d ?? []); })
      .catch(e => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(tab); }, [tab]);

  const approve = async (id) => {
    setActing(id + '-approve');
    try {
      await api.patch(`/api/admin/charities/${id}/approve`);
      setCharities(prev => prev.filter(c => c.id !== id));
      toast(t('approveCharitySuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  const reject = async (id, reason) => {
    setRejectId(null);
    setActing(id + '-reject');
    try {
      await api.patch(`/api/admin/charities/${id}/reject`, { reason });
      setCharities(prev => prev.filter(c => c.id !== id));
      toast(t('rejectCharitySuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  return (
    <div>
      {viewCharity && <CharityDetailModal charity={viewCharity} onClose={() => setViewCharity(null)} t={t} />}
      {rejectId && <RejectModal t={t} onConfirm={(r) => reject(rejectId, r)} onCancel={() => setRejectId(null)} />}

      <h1 className="page-title">{t('charitiesTitle')} 🤝</h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)} style={{
            padding: '7px 18px',
            background: tab === tb.key ? 'var(--brand)' : 'var(--bg)',
            color: tab === tb.key ? '#fff' : 'var(--text-muted)', borderRadius: 8,
            border: '1px solid var(--border)',
          }}>{tb.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : charities.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          {t('noData')}
        </div>
      ) : tab === 'PENDING' ? (
        <PendingTable charities={charities} acting={acting}
          onApprove={approve} onReject={setRejectId} onView={setViewCharity} t={t} />
      ) : (
        <ApprovedTable charities={charities} onView={setViewCharity} t={t} />
      )}
    </div>
  );
}

function PendingTable({ charities, acting, onApprove, onReject, onView, t }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table><thead><tr>
        <th>{t('orgName')}</th><th>{t('region')}</th><th>{t('description')}</th>
        <th>{t('coordinator')}</th><th>{t('phoneCol')}</th><th>{t('registeredAt')}</th>
        <th>{t('documents')}</th><th>{t('action')}</th>
      </tr></thead>
      <tbody>
        {charities.map(c => (
          <tr key={c.id}>
            <td style={{ fontWeight: 700 }}>{c.orgName}</td>
            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.region ?? '—'}</td>
            <td style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 180 }}>
              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {c.description ?? '—'}
              </span>
            </td>
            <td>{c.user?.name ?? '—'}</td>
            <td dir="ltr">{c.user?.phone ?? '—'}</td>
            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtDate(c.createdAt)}</td>
            <td>
              <DocViewer docs={c.documents ?? []} compact />
            </td>
            <td>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button className="btn-secondary btn-sm" onClick={() => onView(c)}>{t('view')}</button>
                <button className="btn-success btn-sm" disabled={!!acting} onClick={() => onApprove(c.id)}>
                  {acting === c.id + '-approve' ? t('saving') : t('approve')}
                </button>
                <button className="btn-danger btn-sm" disabled={!!acting} onClick={() => onReject(c.id)}>
                  {acting === c.id + '-reject' ? t('saving') : t('reject')}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}

function ApprovedTable({ charities, onView, t }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table><thead><tr>
        <th>{t('name')}</th><th>{t('phoneCol')}</th><th>{t('email')}</th>
        <th>{t('joinedAt')}</th><th>{t('actions')}</th>
      </tr></thead>
      <tbody>
        {charities.map(c => (
          <tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name ?? c.orgName ?? '—'}</td>
            <td dir="ltr">{c.phone ?? '—'}</td>
            <td dir="ltr">{c.email ?? '—'}</td>
            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtDate(c.createdAt)}</td>
            <td>
              <button className="btn-secondary btn-sm" onClick={() => onView(c)}>{t('view')}</button>
            </td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}
