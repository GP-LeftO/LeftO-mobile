import axios from 'axios';

const api = axios.create({
  baseURL: 'https://lefto-backend-production.up.railway.app',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                   'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun',
                   'Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtMonth(ym, lang = 'ar') {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  const months = lang === 'ar' ? MONTHS_AR : MONTHS_EN;
  return `${months[+m - 1]} ${y}`;
}

export function fmtDate(iso, lang = 'ar') {
  if (!iso) return '—';
  const locale = lang === 'ar' ? 'ar-EG' : 'en-GB';
  return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function errMsg(err) {
  return err?.response?.data?.message || err?.message || 'حدث خطأ غير متوقع';
}
