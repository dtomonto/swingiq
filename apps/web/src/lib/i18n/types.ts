// ============================================================
// SwingIQ — i18n Type Definitions
// All translation keys and language configuration.
// ============================================================

export type LanguageCode =
  | 'en' | 'es' | 'zh' | 'hi' | 'ar' | 'fr' | 'pt' | 'bn'
  | 'ru' | 'ur' | 'id' | 'de' | 'ja' | 'ko' | 'vi' | 'it'
  | 'tr' | 'pl' | 'nl' | 'fil';

export interface LanguageConfig {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  rtl: boolean;
  locale: string;
}

export const LANGUAGE_CONFIG: Record<LanguageCode, LanguageConfig> = {
  en:  { code: 'en',  nativeName: 'English',           englishName: 'English',            rtl: false, locale: 'en-US' },
  es:  { code: 'es',  nativeName: 'Español',           englishName: 'Spanish',            rtl: false, locale: 'es-ES' },
  zh:  { code: 'zh',  nativeName: '中文',              englishName: 'Chinese',            rtl: false, locale: 'zh-CN' },
  hi:  { code: 'hi',  nativeName: 'हिन्दी',           englishName: 'Hindi',              rtl: false, locale: 'hi-IN' },
  ar:  { code: 'ar',  nativeName: 'العربية',           englishName: 'Arabic',             rtl: true,  locale: 'ar-SA' },
  fr:  { code: 'fr',  nativeName: 'Français',          englishName: 'French',             rtl: false, locale: 'fr-FR' },
  pt:  { code: 'pt',  nativeName: 'Português',         englishName: 'Portuguese',         rtl: false, locale: 'pt-BR' },
  bn:  { code: 'bn',  nativeName: 'বাংলা',             englishName: 'Bengali',            rtl: false, locale: 'bn-BD' },
  ru:  { code: 'ru',  nativeName: 'Русский',           englishName: 'Russian',            rtl: false, locale: 'ru-RU' },
  ur:  { code: 'ur',  nativeName: 'اردو',              englishName: 'Urdu',               rtl: true,  locale: 'ur-PK' },
  id:  { code: 'id',  nativeName: 'Bahasa Indonesia',  englishName: 'Bahasa Indonesia',   rtl: false, locale: 'id-ID' },
  de:  { code: 'de',  nativeName: 'Deutsch',           englishName: 'German',             rtl: false, locale: 'de-DE' },
  ja:  { code: 'ja',  nativeName: '日本語',             englishName: 'Japanese',           rtl: false, locale: 'ja-JP' },
  ko:  { code: 'ko',  nativeName: '한국어',             englishName: 'Korean',             rtl: false, locale: 'ko-KR' },
  vi:  { code: 'vi',  nativeName: 'Tiếng Việt',        englishName: 'Vietnamese',         rtl: false, locale: 'vi-VN' },
  it:  { code: 'it',  nativeName: 'Italiano',          englishName: 'Italian',            rtl: false, locale: 'it-IT' },
  tr:  { code: 'tr',  nativeName: 'Türkçe',            englishName: 'Turkish',            rtl: false, locale: 'tr-TR' },
  pl:  { code: 'pl',  nativeName: 'Polski',            englishName: 'Polish',             rtl: false, locale: 'pl-PL' },
  nl:  { code: 'nl',  nativeName: 'Nederlands',        englishName: 'Dutch',              rtl: false, locale: 'nl-NL' },
  fil: { code: 'fil', nativeName: 'Filipino',          englishName: 'Filipino / Tagalog', rtl: false, locale: 'fil-PH' },
};

export const RTL_LANGUAGES: Set<LanguageCode> = new Set(['ar', 'ur']);

export const ALL_LANGUAGE_CODES = Object.keys(LANGUAGE_CONFIG) as LanguageCode[];

export interface Translations {
  common: {
    save: string;
    cancel: string;
    close: string;
    back: string;
    next: string;
    continue: string;
    delete: string;
    edit: string;
    view: string;
    share: string;
    export: string;
    import: string;
    download: string;
    upload: string;
    search: string;
    filter: string;
    sport: string;
    date: string;
    all: string;
    none: string;
    loading: string;
    error: string;
    success: string;
    newLabel: string;
    done: string;
    yes: string;
    no: string;
    confirm: string;
    optional: string;
    required: string;
    privacy: string;
    publicLabel: string;
    privateLabel: string;
    followers: string;
    join: string;
    leave: string;
    points: string;
    xp: string;
    rank: string;
    sessions: string;
    badges: string;
    challenges: string;
    streak: string;
    days: string;
    hours: string;
    minutes: string;
  };

  sports: {
    golf: string;
    tennis: string;
    baseball: string;
    softball_slow: string;
    softball_fast: string;
    allSports: string;
  };

  nav: {
    dashboard: string;
    profile: string;
    equipment: string;
    sessions: string;
    importData: string;
    logSession: string;
    diagnose: string;
    training: string;
    practice: string;
    preGame: string;
    video: string;
    drills: string;
    progress: string;
    milestones: string;
    compare: string;
    aiCoach: string;
    reports: string;
    community: string;
    challenges: string;
    badges: string;
    leaderboard: string;
    groups: string;
    data: string;
    settings: string;
    signOut: string;
    language: string;
    activeSport: string;
  };

  language: {
    title: string;
    change: string;
    setting: string;
    helperText: string;
    backupNote: string;
    en: string;
    es: string;
    zh: string;
    hi: string;
    ar: string;
    fr: string;
    pt: string;
    bn: string;
    ru: string;
    ur: string;
    id: string;
    de: string;
    ja: string;
    ko: string;
    vi: string;
    it: string;
    tr: string;
    pl: string;
    nl: string;
    fil: string;
  };

  community: {
    title: string;
    subtitle: string;
    yourProgress: string;
    sessionCount: string;
    streakDays: string;
    xpPoints: string;
    backupStatus: string;
    exportReminder: string;
    noActivity: string;
    activityFeed: string;
    activeChallenges: string;
    recentBadges: string;
    leaderboardSnapshot: string;
    suggestedChallenges: string;
    suggestedGroups: string;
    shareProgress: string;
    exportData: string;
    privacyStatus: string;
    sportFilter: string;
    joinCommunity: string;
    communityDesc: string;
    performanceSummary: string;
    lastSession: string;
    nextMilestone: string;
  };

  achievements: {
    title: string;
    subtitle: string;
    locked: string;
    unlocked: string;
    progress: string;
    earnedOn: string;
    xpReward: string;
    allBadges: string;
    earnedBadges: string;
    lockedBadges: string;
    categories: {
      consistency: string;
      improvement: string;
      personalBests: string;
      sportMastery: string;
      diagnostics: string;
      community: string;
      challenges: string;
      dataProtection: string;
      comeback: string;
      coachability: string;
    };
    noAchievements: string;
    firstAchievement: string;
    progressTo: string;
  };

  challenges: {
    title: string;
    subtitle: string;
    join: string;
    leave: string;
    active: string;
    completed: string;
    available: string;
    progress: string;
    expiresIn: string;
    reward: string;
    difficulty: {
      beginner: string;
      intermediate: string;
      advanced: string;
    };
    types: {
      consistency: string;
      improvement: string;
      personalBest: string;
      accuracy: string;
      skill: string;
      team: string;
      beginner: string;
      data: string;
    };
    noChallenges: string;
    joinFirst: string;
    completedOn: string;
    noActiveChallenges: string;
    exportReminder: string;
    sessionRequired: string;
    viewDetails: string;
    startDate: string;
    endDate: string;
    duration: string;
    participants: string;
    rules: string;
  };

  streaks: {
    currentStreak: string;
    longestStreak: string;
    days: string;
    day: string;
    practiceStreak: string;
    exportStreak: string;
    noStreak: string;
    keepGoing: string;
    backupCurrent: string;
    backupRecommended: string;
    backupUrgent: string;
    noBackupFound: string;
  };

  leaderboard: {
    title: string;
    subtitle: string;
    rank: string;
    athlete: string;
    sport: string;
    metric: string;
    change: string;
    weekly: string;
    monthly: string;
    allTime: string;
    friends: string;
    group: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    open: string;
    anonymous: string;
    optOut: string;
    optIn: string;
    noData: string;
    improvement: string;
    sessions: string;
    streak: string;
    points: string;
    exportDiscipline: string;
    yourRank: string;
  };

  groups: {
    title: string;
    subtitle: string;
    join: string;
    leave: string;
    members: string;
    member: string;
    publicGroup: string;
    privateGroup: string;
    inviteOnly: string;
    recentActivity: string;
    challenges: string;
    leaderboard: string;
    noGroups: string;
    joinGroup: string;
    myGroups: string;
    availableGroups: string;
    sport: string;
    description: string;
    created: string;
    exportReminderGroup: string;
  };

  activity: {
    title: string;
    noActivity: string;
    sessionCompleted: string;
    achievementUnlocked: string;
    streakDay: string;
    personalBest: string;
    challengeCompleted: string;
    challengeJoined: string;
    backupExported: string;
    milestoneReached: string;
    justNow: string;
    hoursAgo: string;
    daysAgo: string;
    weeksAgo: string;
    today: string;
    yesterday: string;
    privateLabel: string;
    publicLabel: string;
    followersOnly: string;
    viewAll: string;
  };

  data: {
    title: string;
    subtitle: string;
    mainDescription: string;
    exportFull: string;
    exportBySport: string;
    exportBySession: string;
    exportByDate: string;
    exportCSV: string;
    exportJSON: string;
    importBackup: string;
    health: string;
    lastExport: string;
    neverExported: string;
    sessionsSinceExport: string;
    milestonesSinceExport: string;
    exportRecommended: string;
    privacyNote: string;
    clearData: string;
    exportBeforeClear: string;
    restorePreview: string;
    downloadBackup: string;
    languageInBackup: string;
    restoreLanguage: string;
    keepCurrentLanguage: string;
    previewLanguage: string;
    backupContains: string;
    healthCurrent: string;
    healthRecommended: string;
    healthUrgent: string;
    healthNone: string;
    healthCurrentDesc: string;
    healthRecommendedDesc: string;
    healthUrgentDesc: string;
    healthNoneDesc: string;
    promptProtect: string;
    promptSwitchDevice: string;
    promptValueOfData: string;
    promptExportReminder: string;
    promptDownloadBackup: string;
    promptAfterSession: string;
    promptAfterMilestone: string;
    promptAfterChallenge: string;
    promptAfterPersonalBest: string;
    promptBeforeClear: string;
    promptIncludesLanguage: string;
    schemaVersion: string;
    totalSessions: string;
    totalClubs: string;
    totalVideos: string;
  };

  profile: {
    title: string;
    displayName: string;
    primarySports: string;
    skillLevel: string;
    currentGoals: string;
    recentActivity: string;
    personalBests: string;
    challengeHistory: string;
    exportData: string;
    privacyControls: string;
    languageSetting: string;
    backupHealth: string;
    bio: string;
    editProfile: string;
    visibility: {
      private: string;
      followersOnly: string;
      publicLabel: string;
      hideMetrics: string;
      showImprovementOnly: string;
    };
  };

  settings: {
    title: string;
    units: string;
    theme: string;
    coachingStyle: string;
    language: string;
    languageHelper: string;
    privacy: string;
    data: string;
    backupAndRestore: string;
  };

  empty: {
    noSessions: string;
    noBackup: string;
    noChallenges: string;
    noAchievements: string;
    noActivity: string;
    noGroups: string;
    noLeaderboard: string;
    noPersonalBests: string;
    noProfile: string;
  };

  postSession: {
    title: string;
    sessionSaved: string;
    streakUpdate: string;
    badgeProgress: string;
    challengeProgress: string;
    personalBestDetected: string;
    suggestedNext: string;
    shareCommunity: string;
    exportBackup: string;
    downloadSession: string;
    downloadFull: string;
    viewCommunity: string;
    continuePractice: string;
    exportPromptMessage: string;
  };

  tutorial: {
    guide: string;
    openGuide: string;
    notNow: string;
    gotIt: string;
    stepOf: string;
    alreadyCompleted: string;
    resetAllTutorials: string;
    tutorialResetConfirm: string;
  };

  seo: {
    communityTitle: string;
    communityDescription: string;
    challengesTitle: string;
    challengesDescription: string;
    groupsTitle: string;
    groupsDescription: string;
    dataTitle: string;
    dataDescription: string;
    faq: {
      whatIsCommunity: string;
      howTracksPerformance: string;
      howToSaveExport: string;
      whyBackupHistory: string;
      howChallengesWork: string;
      howLeaderboardsWork: string;
      howToChangeLanguage: string;
      whatIsCommunityAnswer: string;
      howTracksPerformanceAnswer: string;
      howToSaveExportAnswer: string;
      whyBackupHistoryAnswer: string;
      howChallengesWorkAnswer: string;
      howLeaderboardsWorkAnswer: string;
      howToChangeLanguageAnswer: string;
    };
  };
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type PartialTranslations = DeepPartial<Translations>;
