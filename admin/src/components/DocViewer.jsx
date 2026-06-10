import React, { useState } from 'react';

function isImage(url) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(url);
}

function DocThumb({ doc, compact, onOpen }) {
  const url   = doc.fileUrl ?? doc.url ?? '';
  const label = doc.documentType ?? doc.type ?? 'مستند';
  const img   = isImage(url);
  const size  = compact ? 52 : 80;

  if (img) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div onClick={() => url && onOpen(url, label)} style={{
          width: size, height: size, borderRadius: 8,
          overflow: 'hidden', border: '2px solid var(--border)',
          cursor: url ? 'zoom-in' : 'default',
          transition: 'border-color .15s, box-shadow .15s',
          flexShrink: 0,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(222,152,90,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <img src={url} alt={label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.src = ''; e.target.parentElement.innerHTML = '<span style="font-size:28px;display:flex;align-items:center;justify-content:center;height:100%">🖼️</span>'; }} />
        </div>
        {!compact && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: size, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
        <div style={{
          width: size, height: size, borderRadius: 8,
          border: '2px solid var(--border)', background: 'var(--bg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 2, cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(222,152,90,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
          <span style={{ fontSize: compact ? 22 : 30 }}>📄</span>
          {!compact && (
            <span style={{ fontSize: 9, color: 'var(--brand)', fontWeight: 700 }}>PDF</span>
          )}
        </div>
      </a>
      {!compact && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: size, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
    </div>
  );
}

export default function DocViewer({ docs, compact = false }) {
  const [lightbox, setLightbox] = useState(null);

  if (!docs?.length) {
    return <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>—</span>;
  }

  return (
    <>
      {lightbox && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }} onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff', width: 36, height: 36, borderRadius: '50%',
            fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
          <div style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.label}
              style={{
                maxWidth: '90vw', maxHeight: '85vh', borderRadius: 10,
                boxShadow: '0 20px 80px rgba(0,0,0,0.6)', display: 'block',
              }} />
            <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 12 }}>{lightbox.label}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 6 : 10 }}>
        {docs.map((doc, i) => (
          <DocThumb key={i} doc={doc} compact={compact} onOpen={(url, label) => setLightbox({ url, label })} />
        ))}
      </div>
    </>
  );
}
