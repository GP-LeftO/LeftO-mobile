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

function SellerDetailModal({ seller, onClose, t }) {
  const { lang } = useLang();
  const docs = seller.documents ?? seller.user?.documents ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div className="card" style={{
        width: 540, maxHeight: '85vh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 0,
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', margin: 0 }}>{seller.businessName}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{t('sellerData')}</p>
          </div>
          <button className="btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Seller info */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {t('sellerData')}
          </p>
          <Row label={t('businessName')} value={seller.businessName} />
          <Row label={t('businessType')} value={seller.businessType} />
          <Row label={t('address')}      value={seller.address} />
          <Row label={t('registeredAt')} value={fmtDate(seller.createdAt, lang)} />
          {seller.status && <Row label={t('status')} value={seller.status} />}
          {seller.rating != null && <Row label={t('rating')} value={`⭐ ${seller.rating.toFixed(1)}`} />}
          {seller.verifiedBadge != null && (
            <Row label={t('verified')} value={seller.verifiedBadge ? `${t('verifiedYes')} ✅` : '—'} />
          )}
        </div>

        {/* Owner info */}
        {seller.user && (
          <div style={{ marginBottom: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {t('ownerInfo') || (lang === 'ar' ? 'بيانات المالك' : 'Owner Info')}
            </p>
            <Row label={t('name')}     value={seller.user.name} />
            <Row label={t('phoneCol')} value={seller.user.phone} dir="ltr" />
            {seller.user.email && <Row label={t('email')} value={seller.user.email} dir="ltr" />}
            {seller.user.isBlocked != null && (
              <Row label={t('status')} value={seller.user.isBlocked ? `${t('blockedOnly')} 🚫` : `${t('activeOnly')} ✅`} />
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

export default function Sellers() {
  const toast      = useToast();
  const t          = useT();
  const [tab,      setTab]      = useState('PENDING');
  const [sellers,  setSellers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [viewSeller, setViewSeller] = useState(null);

  const TABS = [
    { key: 'PENDING',  label: t('pending')  },
    { key: 'APPROVED', label: t('approved') },
    { key: 'REJECTED', label: t('rejected') },
  ];

  const load = (t_) => {
    setLoading(true);
    const url = t_ === 'PENDING' ? '/api/admin/sellers/pending' : `/api/admin/sellers?status=${t_}`;
    api.get(url)
      .then(r => { const d = r.data?.data ?? r.data; setSellers(d?.sellers ?? d ?? []); })
      .catch(e => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(tab); }, [tab]);

  const approve = async (id) => {
    setActing(id + '-approve');
    try {
      await api.patch(`/api/admin/sellers/${id}/approve`);
      setSellers(prev => prev.filter(s => s.id !== id));
      toast(t('approveSuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  const reject = async (id, reason) => {
    setRejectId(null);
    setActing(id + '-reject');
    try {
      await api.patch(`/api/admin/sellers/${id}/reject`, { reason });
      setSellers(prev => prev.filter(s => s.id !== id));
      toast(t('rejectSuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  return (
    <div>
      {viewSeller && <SellerDetailModal seller={viewSeller} onClose={() => setViewSeller(null)} t={t} />}
      {rejectId && <RejectModal t={t} onConfirm={(r) => reject(rejectId, r)} onCancel={() => setRejectId(null)} />}

      <h1 className="page-title">{t('sellersTitle')} 🏪</h1>

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
      ) : sellers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          {t('noData')}
        </div>
      ) : tab === 'PENDING' ? (
        <PendingTable sellers={sellers} acting={acting}
          onApprove={approve} onReject={setRejectId} onView={setViewSeller} t={t} />
      ) : (
        <ApprovedRejectedTable sellers={sellers} onView={setViewSeller} t={t} />
      )}
    </div>
  );
}

function PendingTable({ sellers, acting, onApprove, onReject, onView, t }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table><thead><tr>
        <th>{t('businessName')}</th><th>{t('businessType')}</th><th>{t('address')}</th>
        <th>{t('owner')}</th><th>{t('phoneCol')}</th><th>{t('registeredAt')}</th>
        <th>{t('documents')}</th><th>{t('action')}</th>
      </tr></thead>
      <tbody>
        {sellers.map(s => (
          <tr key={s.id}>
            <td style={{ fontWeight: 700 }}>{s.businessName}</td>
            <td><span className="badge badge-orange">{s.businessType ?? '—'}</span></td>
            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.address ?? '—'}</td>
            <td>{s.user?.name ?? '—'}</td>
            <td dir="ltr">{s.user?.phone ?? '—'}</td>
            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtDate(s.createdAt)}</td>
            <td>
              <DocViewer docs={s.documents ?? []} compact />
            </td>
            <td>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button className="btn-secondary btn-sm" onClick={() => onView(s)}>{t('view')}</button>
                <button className="btn-success btn-sm" disabled={!!acting} onClick={() => onApprove(s.id)}>
                  {acting === s.id + '-approve' ? t('saving') : t('approve')}
                </button>
                <button className="btn-danger btn-sm" disabled={!!acting} onClick={() => onReject(s.id)}>
                  {acting === s.id + '-reject' ? t('saving') : t('reject')}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}

function ApprovedRejectedTable({ sellers, onView, t }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table><thead><tr>
        <th>{t('businessName')}</th><th>{t('businessType')}</th><th>{t('address')}</th>
        <th>{t('rating')}</th><th>{t('verified')}</th><th>{t('owner')}</th>
        <th>{t('phoneCol')}</th><th>{t('blocked')}</th><th>{t('actions')}</th>
      </tr></thead>
      <tbody>
        {sellers.map(s => (
          <tr key={s.id} style={{ background: s.user?.isBlocked ? 'rgba(239,68,68,0.04)' : undefined }}>
            <td style={{ fontWeight: 700 }}>{s.businessName}</td>
            <td><span className="badge badge-orange">{s.businessType ?? '—'}</span></td>
            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.address ?? '—'}</td>
            <td>{s.rating != null ? `⭐ ${s.rating.toFixed(1)}` : '—'}</td>
            <td>{s.verifiedBadge ? <span className="badge badge-green">{t('verifiedYes')}</span> : '—'}</td>
            <td>{s.user?.name ?? '—'}</td>
            <td dir="ltr">{s.user?.phone ?? '—'}</td>
            <td>{s.user?.isBlocked
              ? <span className="badge badge-red">{t('blockedOnly')}</span>
              : <span className="badge badge-green">{t('active')}</span>}</td>
            <td>
              <button className="btn-secondary btn-sm" onClick={() => onView(s)}>{t('view')}</button>
            </td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}
