import type { PartialTranslations } from '../types';
// Arabic (RTL) — partial translation. Falls back to English for missing keys.
// RTL support: document direction set to 'rtl' automatically when this language is selected.
export const ar: PartialTranslations = {
  common: { save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', back: 'رجوع', next: 'التالي', export: 'تصدير', download: 'تحميل', loading: 'جارٍ التحميل…', done: 'تم', yes: 'نعم', no: 'لا', join: 'انضم', days: 'أيام', sessions: 'جلسات', streak: 'سلسلة' },
  nav: { dashboard: 'لوحة التحكم', community: 'المجتمع', challenges: 'التحديات', badges: 'الشارات', leaderboard: 'لوحة المتصدرين', data: 'مركز البيانات', settings: 'الإعدادات', language: 'اللغة', training: 'التدريب', progress: 'التقدم' },
  language: { title: 'اللغة', change: 'تغيير اللغة', setting: 'لغة التطبيق', helperText: 'اختر لغة SwingVantage. سيتم حفظ تفضيلك في نسخة احتياطية من بياناتك.' },
  community: { title: 'مجتمع SwingVantage', subtitle: 'حوّل جلساتك إلى سلاسل وشارات وتحديات وتقدم دائم.' },
  data: { title: 'مركز البيانات', lastExport: 'آخر تصدير', neverExported: 'لم يتم التصدير من قبل', exportFull: 'تصدير نسخة احتياطية كاملة' },
  empty: { noSessions: 'أكمل جلستك الأولى لبناء سجل أدائك الرياضي.', noBackup: 'لم تقم بتصدير نسخة احتياطية بعد. قم بالتصدير الآن لحماية تقدمك.' },
};
