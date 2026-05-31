import type { PartialTranslations } from '../types';
// Chinese (Simplified) — partial translation. Falls back to English for missing keys.
export const zh: PartialTranslations = {
  common: { save: '保存', cancel: '取消', close: '关闭', back: '返回', next: '下一步', export: '导出', download: '下载', loading: '加载中…', done: '完成', yes: '是', no: '否', join: '加入', days: '天', sessions: '训练', streak: '连续' },
  nav: { dashboard: '仪表板', profile: '我的档案', sessions: '训练记录', community: '社区', challenges: '挑战', badges: '徽章', leaderboard: '排行榜', groups: '小组', data: '数据中心', settings: '设置', signOut: '退出', language: '语言', training: '训练', progress: '进度' },
  language: { title: '语言', change: '切换语言', setting: '应用语言', helperText: '选择SwingIQ的显示语言。您的偏好将保存在数据备份中。' },
  community: { title: 'SwingIQ社区', subtitle: '将训练数据转化为连续记录、徽章和持久进步。' },
  data: { title: '数据中心', lastExport: '上次导出', neverExported: '从未导出', exportFull: '导出完整备份', clearData: '清除所有数据' },
  empty: { noSessions: '完成第一次训练，开始建立您的运动表现记录。', noBackup: '您还没有导出备份，请立即导出以保护您的训练记录。' },
};
