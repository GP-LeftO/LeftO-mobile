import api from '../shared/api';

export async function downloadImpactCertificate(month: string, _accessToken: string): Promise<void> {
  const response = await api.get(`/api/users/me/impact-certificate?month=${month}`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lefto-impact-${month}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
