import React, { useState, useMemo } from 'react';
import { useLang } from '../context/LangContext';

function SkeletonRows({ columns, count = 5 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i}>
      {columns.map(c => (
        <td key={c.key}>
          <div className="skeleton" style={{ height: 14, width: c.skeletonW ?? '65%' }} />
        </td>
      ))}
    </tr>
  ));
}

export default function DataTable({ columns, rows, loading, empty, totalCount }) {
  const { lang } = useLang();
  const isRtl = lang === 'ar';

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!rows?.length || !sortKey) return rows ?? [];
    const col = columns.find(c => c.key === sortKey);
    if (!col?.sortable) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv, lang) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir, columns, lang]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key}
                  onClick={c.sortable ? () => handleSort(c.key) : undefined}
                  style={{ cursor: c.sortable ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {c.label}
                    {c.sortable && (
                      <span style={{
                        color: sortKey === c.key ? 'var(--brand)' : 'var(--text-faint)',
                        fontSize: 10,
                      }}>
                        {sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows columns={columns} />
            ) : !sorted.length ? (
              <tr>
                <td colSpan={columns.length} style={{ border: 'none' }}>
                  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15, marginBottom: 4 }}>
                      {isRtl ? 'لا توجد بيانات' : 'No data found'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      {empty ?? (isRtl ? 'لا توجد عناصر لعرضها حالياً' : 'No items to display at the moment')}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map(c => (
                    <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Row count footer */}
      {!loading && sorted.length > 0 && (
        <div style={{
          padding: '9px 14px', borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)', fontSize: 12,
        }}>
          {isRtl
            ? `عرض ${sorted.length}${totalCount ? ` من ${totalCount}` : ''} عنصر`
            : `Showing ${sorted.length}${totalCount ? ` of ${totalCount}` : ''} ${sorted.length === 1 ? 'item' : 'items'}`}
        </div>
      )}
    </div>
  );
}
