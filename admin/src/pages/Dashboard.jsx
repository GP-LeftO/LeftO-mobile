import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import api, { fmtMonth, errMsg } from '../api/axios';
import StatCard from '../components/StatCard';
import { useToast } from '../components/Toast';
import { useT, useLang } from '../context/LangContext';

const COLORS = {
  orange: '#DE985A', green: '#16A34A', blue: '#6366F1',
  purple: '#8B5CF6', red: '#EF4444', amber: '#F59E0B', teal: '#14B8A6',
};

function Toggle({ label, value, onChange, loading }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{label}</span>
      <div className={`toggle${value ? ' on' : ''}`} onClick={!loading ? onChange : undefined}
        style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'wait' : 'pointer', flexShrink: 0 }} />
    </div>
  );
}

function KpiCard({ icon, label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 12, padding: '18px 20px',
      boxShadow: 'var(--shadow)',
      borderLeft: `4px solid ${color || COLORS.orange}`,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1.2 }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard() {
  const toast     = useToast();
  const t         = useT();
  const { lang }  = useLang();

  const [stats,     setStats]     = useState(null);
  const [charts,    setCharts]    = useState([]);
  const [bestRated, setBestRated] = useState(null);
  const [winner,    setWinner]    = useState(null);
  const [topBuyer,  setTopBuyer]  = useState(null);
  const [config,    setConfig]    = useState({ isRamadanSeason: false, donationEnabled: true });
  const [toggling,  setToggling]  = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/stats'),
      api.get('/api/admin/stats/charts').catch(() => null),
      api.get('/api/admin/stats/best-rated').catch(() => null),
      api.get('/api/stats/monthly-winner').catch(() => null),
      api.get('/api/app/config').catch(() => null),
      api.get('/api/stats/leaderboard').catch(() => null),
    ]).then(([s, c, b, w, cfg, lb]) => {
      const sd = s.data?.data ?? s.data;
      setStats(sd);
      const cd = c?.data?.data?.charts ?? c?.data?.data ?? c?.data?.charts ?? c?.data ?? [];
      setCharts(Array.isArray(cd) ? cd : []);
      setBestRated(b?.data?.data ?? b?.data ?? null);
      const wd = w?.data?.data ?? w?.data;
      setWinner(wd?.winner ?? wd ?? null);
      const cfgd = cfg?.data?.data ?? cfg?.data;
      if (cfgd) setConfig({ isRamadanSeason: cfgd.isRamadanSeason ?? false, donationEnabled: cfgd.donationEnabled ?? true });
      const lbd = lb?.data?.data ?? lb?.data;
      const buyers = lbd?.topBuyers ?? [];
      if (buyers.length > 0) setTopBuyer(buyers[0]);
    }).catch(e => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  }, []);

  const toggleConfig = async (key) => {
    setToggling(true);
    const next = !config[key];
    try {
      await api.patch('/api/admin/config', { [key]: next });
      setConfig(prev => ({ ...prev, [key]: next }));
      toast(t('settingsSaved'), 'success');
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div className="spinner" style={{ margin: '0 auto', width: 40, height: 40, borderWidth: 4 }} />
    </div>
  );

  const pendingSellers   = stats?.pendingApprovals?.sellers   ?? 0;
  const pendingCharities = stats?.pendingApprovals?.charities ?? 0;

  /* ── chart data ── */
  const trendData = charts.map(c => ({
    name:          fmtMonth(c.month, lang),
    [t('orders')]: c.completedOrders ?? 0,
    [t('newUsers')]: c.newUsers ?? 0,
    [t('listings')]: c.listingsCreated ?? 0,
  }));

  const pieData = [
    { name: t('buyersLabel'),    value: stats?.users?.buyers    ?? 0, color: COLORS.blue   },
    { name: t('sellersLabel'),   value: stats?.users?.sellers   ?? 0, color: COLORS.orange },
    { name: t('charitiesLabel'), value: stats?.users?.charities ?? 0, color: COLORS.green  },
  ].filter(d => d.value > 0);

  const orderStatusData = [
    { name: t('completedOrders'), value: stats?.orders?.completed ?? 0, color: COLORS.green  },
    { name: t('pendingOrders'),   value: stats?.orders?.pending   ?? 0, color: COLORS.amber  },
    { name: t('cancelledOrders'), value: stats?.orders?.cancelled ?? 0, color: COLORS.red    },
  ].filter(d => d.value > 0);

  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fmtWinnerMonth = (ym) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{t('dashboardTitle')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{today}</p>
        </div>
        {(pendingSellers > 0 || pendingCharities > 0) && (
          <div style={{
            background: 'var(--red-light)', border: '1px solid var(--red)',
            borderRadius: 10, padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>⚠️</span>
            <span style={{ fontWeight: 700, color: 'var(--red)', fontSize: 13 }}>
              {pendingSellers > 0 && `${pendingSellers} ${t('pendingSeller')}`}
              {pendingSellers > 0 && pendingCharities > 0 && ' + '}
              {pendingCharities > 0 && `${pendingCharities} ${t('pendingCharity')}`}
              {' '}{t('pendingApprovals')}
            </span>
            <a href="/sellers" style={{ color: 'var(--red)', fontWeight: 700, fontSize: 12 }}>{t('reviewNow')}</a>
          </div>
        )}
      </div>

      {/* ── Monthly winner banners ── */}
      {(winner || topBuyer) && (
        <div style={{ display: 'grid', gridTemplateColumns: winner && topBuyer ? '1fr 1fr' : '1fr', gap: 14 }}>
          {winner && (
            <div style={{
              background: 'var(--amber-light)', border: '1px solid var(--amber)',
              borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 32 }}>🏆</span>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--amber)', fontSize: 13 }}>
                  {t('monthlyWinner')} · {fmtWinnerMonth(winner.month)}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2, color: 'var(--text)' }}>
                  {winner.name ?? '—'}
                </div>
                {winner.rating != null && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                    ⭐ {winner.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          )}
          {topBuyer && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.04) 100%)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 32 }}>🥇</span>
              <div>
                <div style={{ fontWeight: 700, color: '#6366F1', fontSize: 13 }}>
                  {t('buyerOfMonth')} {fmtWinnerMonth(topBuyer.month)}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2, color: 'var(--text)' }}>
                  {topBuyer.name ?? '—'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
                  {t('ecoChampion')} · {topBuyer.totalCo2SavedKg?.toFixed(1)} {t('co2KgLabel')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── KPI row 1: users ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KpiCard icon="👥" label={t('totalUsers')}    value={stats?.users?.total}     color={COLORS.blue}   />
        <KpiCard icon="🛍️" label={t('buyersLabel')}   value={stats?.users?.buyers}    color="#6366F1"       />
        <KpiCard icon="🏪" label={t('sellersLabel')}  value={stats?.users?.sellers}   color={COLORS.orange}
          sub={pendingSellers > 0 ? `⚠️ ${pendingSellers} pending` : undefined} />
        <KpiCard icon="🤝" label={t('charitiesLabel')} value={stats?.users?.charities} color={COLORS.green}
          sub={pendingCharities > 0 ? `⚠️ ${pendingCharities} pending` : undefined} />
      </div>

      {/* ── KPI row 2: activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <KpiCard icon="📋" label={t('activeListings')}  value={stats?.listings?.active}    color={COLORS.orange} />
        <KpiCard icon="✅" label={t('completedOrders')} value={stats?.orders?.completed}   color={COLORS.green}  />
        <KpiCard icon="🎁" label={t('totalDonations')}  value={stats?.donations?.total}    color={COLORS.purple} />
        <KpiCard icon="🌱" label={t('co2Saved')}        value={stats?.impact?.totalCo2SavedKg?.toFixed(1)} color={COLORS.teal} />
      </div>

      {/* ── Area chart + Pie chart ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>

        {/* Area chart */}
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
          <p className="section-title">{t('ordersAndUsers')}</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.orange} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.blue} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey={t('orders')}   stroke={COLORS.orange} strokeWidth={2} fill="url(#gOrders)" />
                <Area type="monotone" dataKey={t('newUsers')} stroke={COLORS.blue}   strokeWidth={2} fill="url(#gUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>—</div>}
        </div>

        {/* User distribution donut */}
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
          <p className="section-title">{t('userDistribution')}</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value" labelLine={false} label={renderCustomLabel}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{d.name}</span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>—</div>}
        </div>
      </div>

      {/* ── Bar chart + Order status donut ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>

        {/* Bar chart: listings */}
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
          <p className="section-title">{t('listingsCreated')}</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={t('listings')} fill={COLORS.green} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>—</div>}
        </div>

        {/* Order status donut */}
        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
          <p className="section-title">{t('orderStatus')}</p>
          {orderStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%"
                    innerRadius={40} outerRadius={65}
                    dataKey="value" labelLine={false} label={renderCustomLabel}>
                    {orderStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                {orderStatusData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{d.name}</span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 40 }}>—</div>}
        </div>
      </div>

      {/* ── Platform controls + Best rated ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
          <p className="section-title">{t('platformSettings')}</p>
          <Toggle label={t('ramadanMode')}      value={config.isRamadanSeason} onChange={() => toggleConfig('isRamadanSeason')} loading={toggling} />
          <Toggle label={t('donationsEnabled')} value={config.donationEnabled}  onChange={() => toggleConfig('donationEnabled')}  loading={toggling} />
        </div>

        {bestRated && (
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
            <p className="section-title">{t('bestOnPlatform')}</p>
            {bestRated.bestSeller && (
              <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: COLORS.orange, fontSize: 13 }}>{t('bestSeller')}</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{bestRated.bestSeller.businessName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  ⭐ {bestRated.bestSeller.rating?.toFixed(1)}
                  {bestRated.bestSeller.address ? ` · ${bestRated.bestSeller.address}` : ''}
                </div>
              </div>
            )}
            {bestRated.bestCharity && (
              <div style={{ paddingTop: 10 }}>
                <div style={{ fontWeight: 700, color: COLORS.green, fontSize: 13 }}>{t('bestCharity')}</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{bestRated.bestCharity.orgName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {bestRated.bestCharity.region}
                  {bestRated.bestCharity._count?.donations != null ? ` · ${bestRated.bestCharity._count.donations} ${t('donations')}` : ''}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Impact row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <KpiCard icon="🌱" label={t('co2Saved')}    value={stats?.impact?.totalCo2SavedKg?.toFixed(1)} color={COLORS.teal}  />
        <KpiCard icon="🍱" label={t('itemsRescued')} value={stats?.impact?.totalItemsSaved}              color={COLORS.green} />
      </div>

    </div>
  );
}
