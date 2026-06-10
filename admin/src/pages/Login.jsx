import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useT, useLang } from '../context/LangContext';

export default function Login() {
  const navigate       = useNavigate();
  const t              = useT();
  const { lang, setLang } = useLang();

  const [phone,    setPhone]   = useState('0598262751');
  const [password, setPass]    = useState('');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');

  if (localStorage.getItem('adminToken')) return <Navigate to="/" replace />;

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res   = await api.post('/api/auth/login', { phone, password });
      const token = res.data?.data?.accessToken ?? res.data?.accessToken;
      if (!token) throw new Error(t('noToken'));
      localStorage.setItem('adminToken', token);
      navigate('/');
    } catch (err) {
      const status = err.response?.status;
      if (status === 404)      setError(t('phoneNotFound'));
      else if (status === 401) setError(t('wrongPassword'));
      else                     setError(errMsg(err) || t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    }}>

      {/* Left panel — branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 48,
        borderRight: lang === 'ar' ? 'none' : '1px solid rgba(255,255,255,0.06)',
        borderLeft:  lang === 'ar' ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #DE985A 0%, #C97E43 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(222,152,90,0.35)',
          }}>🥡</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.03em' }}>LeftO</h1>
          <p style={{ color: '#64748B', marginTop: 8, fontSize: 15, lineHeight: 1.6 }}>
            {lang === 'ar' ? 'لوحة إدارة المنصة' : 'Platform Admin Panel'}
          </p>

          {/* Stats teaser */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 40 }}>
            {[
              { label: lang === 'ar' ? 'بائعون' : 'Sellers',   value: '—', color: '#DE985A' },
              { label: lang === 'ar' ? 'طلبات'  : 'Orders',    value: '—', color: '#10B981' },
              { label: lang === 'ar' ? 'مستخدمون' : 'Users',   value: '—', color: '#6366F1' },
              { label: lang === 'ar' ? 'تبرعات' : 'Donations', value: '—', color: '#8B5CF6' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10, padding: '14px 16px',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'start',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 440, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 48,
        background: '#F8FAFC',
      }}>
        {/* Lang toggle */}
        <div style={{ position: 'absolute', top: 20, right: lang === 'ar' ? 20 : 'auto', left: lang === 'en' ? 20 : 'auto' }}>
          <div style={{ display: 'flex', gap: 2, background: '#E2E8F0', borderRadius: 8, padding: 2 }}>
            {(['ar','en']).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                background: lang === l ? '#fff' : 'transparent',
                color: lang === l ? '#0F172A' : '#94A3B8',
                boxShadow: lang === l ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
                {l === 'ar' ? 'ع' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}
            </h2>
            <p style={{ color: '#64748B', marginTop: 6, fontSize: 14 }}>
              {lang === 'ar' ? 'أدخل بيانات حساب الإدارة' : 'Enter your admin credentials'}
            </p>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                {t('phone')}
              </label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                style={{ fontSize: 15 }} required dir="ltr" />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13, color: '#374151' }}>
                {t('password')}
              </label>
              <input type="password" value={password} onChange={e => setPass(e.target.value)}
                placeholder="••••••••" style={{ fontSize: 15 }} required />
            </div>

            {error && (
              <div style={{
                background: '#FEF2F2', color: '#991B1B', borderRadius: 8,
                padding: '10px 14px', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center',
                border: '1px solid #FECACA',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: 'linear-gradient(135deg, #DE985A 0%, #C97E43 100%)',
              color: '#fff', borderRadius: 9,
              padding: '13px 0', fontSize: 15, fontWeight: 700,
              boxShadow: '0 4px 12px rgba(222,152,90,0.35)',
              transition: 'opacity .15s',
            }}>
              {loading ? t('loggingIn') : t('loginBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
