import React, { useState, useEffect } from 'react';
import api, { fmtDate, errMsg } from '../api/axios';
import { useToast } from '../components/Toast';
import { useT } from '../context/LangContext';

export default function Reports() {
  const toast      = useToast();
  const t          = useT();

  const REASON_MAP = {
    SPOILED_FOOD:          t('spoiledFood'),
    WRONG_DESCRIPTION:     t('wrongDesc'),
    WRONG_PRICE:           t('wrongPrice'),
    INAPPROPRIATE_CONTENT: t('inappropriate'),
    OTHER:                 t('other'),
  };

  const TABS = [
    { key: 'PENDING',   label: t('pending')   },
    { key: 'REVIEWED',  label: t('reviewed')  },
    { key: 'DISMISSED', label: t('dismissed') },
  ];

  const [reports,    setReports]    = useState([]);
  const [tab,        setTab]        = useState('PENDING');
  const [loading,    setLoading]    = useState(false);
  const [acting,     setActing]     = useState(null);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = (tb, p) => {
    setLoading(true);
    api.get(`/api/reports?status=${tb}&page=${p}&limit=20`)
      .then(r => {
        const d = r.data?.data ?? r.data;
        setReports(d?.reports ?? d ?? []);
        const tot = d?.pagination?.total ?? d?.total ?? 0;
        setTotalPages(Math.ceil(tot / 20) || 1);
      })
      .catch(e => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(tab, page); }, [tab, page]);

  const markReviewed = async (id) => {
    setActing(id + '-review');
    try {
      await api.patch(`/api/reports/${id}/review`, { action: 'REVIEWED' });
      setReports(prev => prev.filter(r => r.id !== id));
      toast(t('reviewedSuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  const dismiss = async (id) => {
    setActing(id + '-dismiss');
    try {
      await api.patch(`/api/reports/${id}/review`, { action: 'DISMISSED' });
      setReports(prev => prev.filter(r => r.id !== id));
      toast(t('dismissedSuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  const removeListing = async (id) => {
    if (!confirm(t('removeConfirm'))) return;
    setActing(id + '-remove');
    try {
      await api.delete(`/api/reports/${id}/listing`);
      setReports(prev => prev.filter(r => r.id !== id));
      toast(t('removedSuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  return (
    <div>
      <h1 className="page-title">{t('reportsTitle')} 🚩</h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => { setTab(tb.key); setPage(1); }} style={{
            padding: '7px 18px',
            background: tab === tb.key ? '#DE985A' : '#F3F4F6',
            color: tab === tb.key ? '#fff' : '#374151', borderRadius: 8,
          }}>{tb.label}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6B7280', padding: 40 }}>{t('noReports')}</div>
        ) : (
          <table>
            <thead><tr>
              <th>{t('reporter')}</th><th>{t('listing')}</th><th>{t('reason')}</th>
              <th>{t('details')}</th><th>{t('reportedAt')}</th><th>{t('status')}</th>
              {tab === 'PENDING' && <th>{t('actions')}</th>}
            </tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.buyer?.name ?? r.reporter?.name ?? '—'}</div>
                    <div style={{ color: '#6B7280', fontSize: 12 }} dir="ltr">{r.buyer?.phone ?? r.reporter?.phone ?? ''}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.listing?.title ?? '—'}</div>
                    <div style={{ color: '#6B7280', fontSize: 12 }}>{r.listing?.seller?.businessName ?? ''}</div>
                  </td>
                  <td><span className="badge badge-amber">{REASON_MAP[r.reason] ?? r.reason ?? '—'}</span></td>
                  <td style={{ color: '#6B7280', fontSize: 13, maxWidth: 180 }}>{r.details || '—'}</td>
                  <td style={{ color: '#6B7280', fontSize: 13 }}>{fmtDate(r.createdAt)}</td>
                  <td>
                    <span className={`badge ${
                      r.status === 'PENDING' ? 'badge-amber' :
                      r.status === 'REVIEWED' ? 'badge-green' : 'badge-gray'
                    }`}>
                      {r.status === 'PENDING' ? t('pending') : r.status === 'REVIEWED' ? t('reviewed') : t('dismissed')}
                    </span>
                  </td>
                  {tab === 'PENDING' && (
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn-secondary btn-sm" disabled={!!acting} onClick={() => markReviewed(r.id)}>
                          {acting === r.id + '-review' ? t('saving') : t('markReviewed')}
                        </button>
                        <button className="btn-secondary btn-sm" disabled={!!acting} onClick={() => dismiss(r.id)}>
                          {acting === r.id + '-dismiss' ? t('saving') : t('dismiss')}
                        </button>
                        <button className="btn-danger btn-sm" disabled={!!acting} onClick={() => removeListing(r.id)}>
                          {acting === r.id + '-remove' ? t('saving') : t('removeListing')}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{t('prev')}</button>
          <span style={{ padding: '6px 12px', color: '#6B7280' }}>{t('page')} {page} {t('of')} {totalPages}</span>
          <button className="btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>{t('next')}</button>
        </div>
      )}
    </div>
  );
}
