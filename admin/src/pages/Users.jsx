import React, { useState, useEffect, useCallback, useRef } from 'react';
import api, { fmtDate, errMsg } from '../api/axios';
import { useToast } from '../components/Toast';
import { useT, useLang } from '../context/LangContext';
import DocViewer from '../components/DocViewer';

function UserDetailModal({ userId, onClose, t }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();

  useEffect(() => {
    api.get(`/api/admin/users/${userId}`)
      .then(r => setUser(r.data?.data ?? r.data))
      .finally(() => setLoading(false));
  }, [userId]);

  const docs = user?.documents ?? user?.seller?.documents ?? user?.charity?.documents ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div className="card" style={{ width: 520, maxHeight: '85vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : !user ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('userNotFound')}</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', margin: 0 }}>{user.name ?? '—'}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 3 }}>{user.role}</p>
              </div>
              <button className="btn-secondary btn-sm" onClick={onClose}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {t('userData')}
              </p>
              <Row label={t('phoneCol')} value={user.phone} dir="ltr" />
              <Row label={t('email')}    value={user.email} dir="ltr" />
              <Row label={t('language')} value={user.language ?? '—'} />
              <Row label={t('joinedAt')} value={fmtDate(user.createdAt, lang)} />
              <Row label={t('status')}   value={user.isBlocked ? `${t('blockedOnly')} 🚫` : `${t('activeOnly')} ✅`} />
            </div>

            {user.seller && (
              <div style={{ marginBottom: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {t('sellerData')}
                </p>
                <Row label={t('businessName')} value={user.seller.businessName} />
                <Row label={t('status')}       value={user.seller.status} />
                <Row label={t('verified')}     value={user.seller.verifiedBadge ? `${t('verifiedYes')} ✅` : '—'} />
              </div>
            )}

            {user.charity && (
              <div style={{ marginBottom: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {t('charityData')}
                </p>
                <Row label={t('orgName')} value={user.charity.orgName} />
                <Row label={t('status')}  value={user.charity.status} />
              </div>
            )}

            <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                {t('docsLabel')} ({docs.length})
              </p>
              <DocViewer docs={docs} />
              {docs.length === 0 && (
                <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>
                  {lang === 'ar' ? 'لا توجد وثائق مرفقة' : 'No documents attached'}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, dir }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13, width: 150, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }} dir={dir}>{value ?? '—'}</span>
    </div>
  );
}

export default function Users() {
  const toast  = useToast();
  const t      = useT();
  const LIMIT  = 10;

  const [users,      setUsers]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [role,       setRole]       = useState('');
  const [blocked,    setBlocked]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [acting,     setActing]     = useState(null);
  const [viewId,     setViewId]     = useState(null);
  const debounceRef  = useRef(null);

  const ROLES = [
    { value: '', label: t('allRoles') },
    { value: 'BUYER',   label: t('buyer')   },
    { value: 'SELLER',  label: t('seller')  },
    { value: 'CHARITY', label: t('charity') },
    { value: 'ADMIN',   label: t('admin')   },
  ];
  const BLOCKED_OPTS = [
    { value: '',      label: t('all')        },
    { value: 'true',  label: t('blockedOnly')},
    { value: 'false', label: t('activeOnly') },
  ];

  const load = useCallback(async (p, s, r, b) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (s) params.set('search', s);
      if (r) params.set('role', r);
      if (b) params.set('isBlocked', b);
      const res = await api.get(`/api/admin/users?${params}`);
      const d = res.data?.data ?? res.data;
      setUsers(d?.users ?? d ?? []);
      setTotal(d?.pagination?.total ?? d?.total ?? 0);
      const totalCount = d?.pagination?.total ?? d?.total ?? 0;
      setTotalPages(d?.pagination?.totalPages ?? (Math.ceil(totalCount / LIMIT) || 1));
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, search, role, blocked); }, [page, role, blocked, load]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, val, role, blocked); }, 300);
  };

  const blockUser = async (id) => {
    setActing(id + '-block');
    try {
      await api.patch(`/api/admin/users/${id}/block`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: true } : u));
      toast(t('suspendSuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  const unblockUser = async (id) => {
    setActing(id + '-unblock');
    try {
      await api.patch(`/api/admin/users/${id}/unblock`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: false } : u));
      toast(t('unblockSuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`${t('deleteConfirm')} "${name}"? ${t('deleteWarning')}`)) return;
    setActing(id + '-delete');
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      setTotal(n => n - 1);
      toast(t('deleteSuccess'), 'success');
    } catch (e) { toast(errMsg(e), 'error'); }
    finally { setActing(null); }
  };

  return (
    <div>
      {viewId && <UserDetailModal userId={viewId} onClose={() => setViewId(null)} t={t} />}

      <h1 className="page-title">{t('usersTitle')} 👥</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder={t('searchPlaceholder')} value={search}
          onChange={e => handleSearch(e.target.value)} style={{ minWidth: 240 }} />
        <select value={role}    onChange={e => { setRole(e.target.value);    setPage(1); }}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={blocked} onChange={e => { setBlocked(e.target.value); setPage(1); }}>
          {BLOCKED_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>{total} {t('userCount')}</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{t('noResults')}</div>
        ) : (
          <table>
            <thead><tr>
              <th>{t('name')}</th><th>{t('phoneCol')}</th><th>{t('role')}</th>
              <th>{t('joinedAt')}</th><th>{t('cancellations')}</th><th>{t('status')}</th><th>{t('actions')}</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name ?? '—'}</td>
                  <td dir="ltr">{u.phone ?? '—'}</td>
                  <td>
                    <span className={`badge ${
                      u.role === 'ADMIN' ? 'badge-amber' :
                      u.role === 'SELLER' ? 'badge-orange' :
                      u.role === 'CHARITY' ? 'badge-green' : 'badge-gray'
                    }`}>{u.role}</span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ textAlign: 'center', color: (u.cancellationCount ?? 0) >= 3 ? '#EF4444' : undefined }}>
                    {u.cancellationCount ?? 0}
                  </td>
                  <td>
                    {u.isBlocked
                      ? <span className="badge badge-red">{t('blockedOnly')}</span>
                      : <span className="badge badge-green">{t('activeOnly')}</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn-secondary btn-sm" onClick={() => setViewId(u.id)}>{t('view')}</button>
                      {!u.isBlocked && u.role !== 'ADMIN' && (
                        <button className="btn-secondary btn-sm" style={{ background: 'var(--amber-light)', color: '#92400E' }}
                          disabled={!!acting} onClick={() => blockUser(u.id)}>
                          {acting === u.id + '-block' ? t('saving') : t('suspend')}
                        </button>
                      )}
                      {u.isBlocked && (
                        <button className="btn-success btn-sm" disabled={!!acting} onClick={() => unblockUser(u.id)}>
                          {acting === u.id + '-unblock' ? t('saving') : t('unblock')}
                        </button>
                      )}
                      {u.role !== 'ADMIN' && (
                        <button className="btn-danger btn-sm" disabled={!!acting} onClick={() => deleteUser(u.id, u.name)}>
                          {acting === u.id + '-delete' ? t('saving') : t('delete')}
                        </button>
                      )}
                    </div>
                  </td>
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
