import type { PartialTranslations } from '../types';
// Hindi — partial translation. Falls back to English for missing keys.
export const hi: PartialTranslations = {
  common: { save: 'सहेजें', cancel: 'रद्द करें', close: 'बंद करें', back: 'वापस', export: 'निर्यात', download: 'डाउनलोड', loading: 'लोड हो रहा है…', done: 'हो गया', yes: 'हाँ', no: 'नहीं', join: 'शामिल हों', days: 'दिन', sessions: 'सत्र', streak: 'लकीर' },
  nav: { dashboard: 'डैशबोर्ड', community: 'समुदाय', challenges: 'चुनौतियाँ', badges: 'बैज', leaderboard: 'लीडरबोर्ड', data: 'डेटा केंद्र', settings: 'सेटिंग्स', language: 'भाषा', training: 'प्रशिक्षण', progress: 'प्रगति' },
  language: { title: 'भाषा', change: 'भाषा बदलें', setting: 'ऐप भाषा', helperText: 'SwingIQ के लिए भाषा चुनें। आपकी प्राथमिकता आपके डेटा बैकअप में सहेजी जाएगी।' },
  community: { title: 'SwingIQ समुदाय', subtitle: 'अपने सत्रों को लकीर, बैज और स्थायी प्रगति में बदलें।' },
  data: { title: 'डेटा केंद्र', lastExport: 'अंतिम निर्यात', neverExported: 'कभी निर्यात नहीं किया', exportFull: 'पूर्ण बैकअप निर्यात करें' },
  empty: { noSessions: 'अपना पहला सत्र पूरा करें और अपना प्रदर्शन इतिहास बनाना शुरू करें।', noBackup: 'आपने अभी तक बैकअप निर्यात नहीं किया है। अपनी प्रगति सुरक्षित रखने के लिए अभी निर्यात करें।' },
};
