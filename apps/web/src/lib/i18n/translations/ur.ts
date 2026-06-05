import type { PartialTranslations } from '../types';
// Urdu (RTL) — partial translation. Falls back to English for missing keys.
// RTL support: document direction set to 'rtl' automatically when this language is selected.
export const ur: PartialTranslations = {
  common: { save: 'محفوظ کریں', cancel: 'منسوخ', close: 'بند کریں', back: 'واپس', export: 'برآمد', download: 'ڈاؤن لوڈ', loading: 'لوڈ ہو رہا ہے…', done: 'مکمل', yes: 'ہاں', no: 'نہیں', join: 'شامل ہوں', days: 'دن', sessions: 'سیشن', streak: 'سلسلہ' },
  nav: { dashboard: 'ڈیش بورڈ', community: 'کمیونٹی', challenges: 'چیلنجز', badges: 'بیجز', leaderboard: 'لیڈر بورڈ', data: 'ڈیٹا سینٹر', settings: 'ترتیبات', language: 'زبان', training: 'تربیت', progress: 'پیشرفت' },
  language: { title: 'زبان', change: 'زبان تبدیل کریں', setting: 'ایپ کی زبان', helperText: 'SwingVantage کے لیے زبان منتخب کریں۔ آپ کی ترجیح آپ کے ڈیٹا بیک اپ میں محفوظ کی جائے گی۔' },
  community: { title: 'SwingVantage کمیونٹی', subtitle: 'اپنے سیشنز کو سلسلوں، بیجز اور دیرپا ترقی میں بدلیں۔' },
  data: { title: 'ڈیٹا سینٹر', lastExport: 'آخری برآمد', neverExported: 'کبھی برآمد نہیں کیا', exportFull: 'مکمل بیک اپ برآمد کریں' },
  empty: { noSessions: 'اپنا پہلا سیشن مکمل کریں اور اپنی کارکردگی کی تاریخ بنانا شروع کریں۔', noBackup: 'آپ نے ابھی تک بیک اپ برآمد نہیں کیا۔ اپنی پیشرفت محفوظ کرنے کے لیے ابھی برآمد کریں۔' },
};
