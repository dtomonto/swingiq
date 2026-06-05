// ============================================================
// SwingVantage — Professional Swing Reference Library
// IMPORTANT: All video IDs are PLACEHOLDER — admin must verify
// before they are shown to users. Never make up YouTube IDs.
// ============================================================

import type { SportId } from './types';

export type ProfessionalSex = 'male' | 'female';
export type ActiveStatus = 'current' | 'recent' | 'retired' | 'unknown';
export type ReferenceCameraAngle = 'face_on' | 'down_the_line' | 'side' | 'rear' | 'broadcast' | 'unknown';
export type StyleTag = string;

export interface ProfessionalSwingVideo {
  id: string;
  youtubeVideoId: string;         // IMPORTANT: use real well-known IDs only, or PLACEHOLDER if unknown
  title: string;
  embedUrl: string;               // https://www.youtube-nocookie.com/embed/{id}
  watchUrl: string;               // https://www.youtube.com/watch?v={id}
  movementType: string;
  cameraAngle: ReferenceCameraAngle;
  verified: boolean;              // FALSE unless you are 100% sure the ID is real
  lastVerifiedAt?: string;
  tags: string[];
  sourceChannel?: string;
  qualityNote?: string;
}

export interface ProfessionalSwingReference {
  id: string;
  sport: SportId;
  sex: ProfessionalSex;
  athleteName: string;
  activeStatus: ActiveStatus;
  movementTypes: string[];
  handedness?: 'right' | 'left' | 'switch' | 'unknown';
  styleTags: StyleTag[];
  bio: string;                    // 1-2 sentences, factual only
  referenceVideos: ProfessionalSwingVideo[];
  adminNotes?: string;
  requiresVerification: boolean;  // true = admin must verify before showing
}

// ──────────────────────────────────────────────────────────────
// Helper to build placeholder video entries
// ──────────────────────────────────────────────────────────────

const PLACEHOLDER_ID = 'PLACEHOLDER_REQUIRES_ADMIN_VERIFICATION';

function placeholderVideo(
  idSuffix: string,
  title: string,
  movementType: string,
  cameraAngle: ReferenceCameraAngle,
  tags: string[],
): ProfessionalSwingVideo {
  return {
    id: idSuffix,
    youtubeVideoId: PLACEHOLDER_ID,
    title,
    embedUrl: `https://www.youtube-nocookie.com/embed/${PLACEHOLDER_ID}`,
    watchUrl: `https://www.youtube.com/watch?v=${PLACEHOLDER_ID}`,
    movementType,
    cameraAngle,
    verified: false,
    tags,
  };
}

// ──────────────────────────────────────────────────────────────
// GOLF — 5 Male, 5 Female
// ──────────────────────────────────────────────────────────────

const GOLF_MALE: ProfessionalSwingReference[] = [
  {
    id: 'golf_m_tiger_woods',
    sport: 'golf',
    sex: 'male',
    athleteName: 'Tiger Woods',
    activeStatus: 'recent',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['power', 'rotation', 'lag', 'consistency'],
    bio: 'Tiger Woods is a 15-time major champion widely regarded as one of the greatest golfers of all time. Known for his exceptional swing rotation, lag, and mental game.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_m_tiger_v1', 'Tiger Woods Driver Swing Analysis — Down the Line', 'driver', 'down_the_line', ['driver', 'rotation', 'lag']),
      placeholderVideo('golf_m_tiger_v2', 'Tiger Woods Iron Swing — Face On', 'iron', 'face_on', ['iron', 'compression', 'tempo']),
    ],
  },
  {
    id: 'golf_m_rory_mcilroy',
    sport: 'golf',
    sex: 'male',
    athleteName: 'Rory McIlroy',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['speed', 'hip_rotation', 'extension', 'athleticism'],
    bio: 'Rory McIlroy is a 4-time major champion and one of the longest drivers on the PGA Tour. Known for his fast hip rotation and wide swing arc.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_m_rory_v1', 'Rory McIlroy Driver Swing — Slow Motion', 'driver', 'down_the_line', ['driver', 'speed', 'hip_rotation']),
      placeholderVideo('golf_m_rory_v2', 'Rory McIlroy Iron Play — Face On Slow Motion', 'iron', 'face_on', ['iron', 'extension', 'ball_striking']),
    ],
  },
  {
    id: 'golf_m_jon_rahm',
    sport: 'golf',
    sex: 'male',
    athleteName: 'Jon Rahm',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['compact', 'power', 'ball_striking', 'aggressive'],
    bio: 'Jon Rahm is a 2-time major champion and former world number one. Known for his compact, powerful swing and exceptional ball-striking.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_m_rahm_v1', 'Jon Rahm Swing Analysis — Slow Motion DTL', 'driver', 'down_the_line', ['driver', 'compact', 'power']),
      placeholderVideo('golf_m_rahm_v2', 'Jon Rahm Iron Swing — Face On', 'iron', 'face_on', ['iron', 'ball_striking']),
    ],
  },
  {
    id: 'golf_m_scottie_scheffler',
    sport: 'golf',
    sex: 'male',
    athleteName: 'Scottie Scheffler',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['consistency', 'neutral_path', 'control', 'tempo'],
    bio: 'Scottie Scheffler is a Masters champion and world number one known for his consistent, repeatable swing mechanics and exceptional iron play.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_m_scheffler_v1', 'Scottie Scheffler Driver Swing Slow Motion', 'driver', 'down_the_line', ['driver', 'consistency', 'tempo']),
      placeholderVideo('golf_m_scheffler_v2', 'Scottie Scheffler Iron Swing Analysis', 'iron', 'face_on', ['iron', 'control', 'neutral_path']),
    ],
  },
  {
    id: 'golf_m_brooks_koepka',
    sport: 'golf',
    sex: 'male',
    athleteName: 'Brooks Koepka',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['power', 'major_performance', 'flat_plane', 'distance'],
    bio: 'Brooks Koepka is a 5-time major champion known for elevating his game in majors. His swing features a flat plane and strong lag position for distance.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_m_koepka_v1', 'Brooks Koepka Driver Swing — Slow Motion', 'driver', 'down_the_line', ['driver', 'power', 'lag']),
      placeholderVideo('golf_m_koepka_v2', 'Brooks Koepka Iron Swing — Analysis', 'iron', 'face_on', ['iron', 'flat_plane', 'distance']),
    ],
  },
];

const GOLF_FEMALE: ProfessionalSwingReference[] = [
  {
    id: 'golf_f_nelly_korda',
    sport: 'golf',
    sex: 'female',
    athleteName: 'Nelly Korda',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['athleticism', 'power', 'fluidity', 'consistency'],
    bio: 'Nelly Korda is a major champion and Olympic gold medalist, ranked as one of the top women\'s golfers in the world. Known for her athletic, fluid swing.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_f_korda_v1', 'Nelly Korda Swing Analysis — Slow Motion', 'driver', 'down_the_line', ['driver', 'athleticism', 'power']),
      placeholderVideo('golf_f_korda_v2', 'Nelly Korda Iron Play — Face On', 'iron', 'face_on', ['iron', 'fluidity', 'consistency']),
    ],
  },
  {
    id: 'golf_f_lydia_ko',
    sport: 'golf',
    sex: 'female',
    athleteName: 'Lydia Ko',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['consistency', 'accuracy', 'tempo', 'control'],
    bio: 'Lydia Ko is a two-time Olympic medalist and multiple LPGA major champion known for her remarkably consistent and accurate ball-striking.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_f_lydiako_v1', 'Lydia Ko Swing Analysis — Slow Motion', 'driver', 'down_the_line', ['driver', 'consistency', 'tempo']),
      placeholderVideo('golf_f_lydiako_v2', 'Lydia Ko Iron Swing — Face On', 'iron', 'face_on', ['iron', 'accuracy', 'control']),
    ],
  },
  {
    id: 'golf_f_brooke_henderson',
    sport: 'golf',
    sex: 'female',
    athleteName: 'Brooke Henderson',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'left',
    styleTags: ['long_hitter', 'left_handed', 'powerful', 'aggressive'],
    bio: 'Brooke Henderson is a 13-time LPGA Tour winner known as one of the longest hitters on the women\'s tour. She plays left-handed with a powerful, upright swing.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_f_henderson_v1', 'Brooke Henderson Swing — Slow Motion DTL', 'driver', 'down_the_line', ['driver', 'left_handed', 'power']),
      placeholderVideo('golf_f_henderson_v2', 'Brooke Henderson Iron Swing Analysis', 'iron', 'face_on', ['iron', 'left_handed', 'aggressive']),
    ],
  },
  {
    id: 'golf_f_lexi_thompson',
    sport: 'golf',
    sex: 'female',
    athleteName: 'Lexi Thompson',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['power', 'distance', 'strong_grip', 'athletic'],
    bio: 'Lexi Thompson is a major champion and one of the longest drivers on the LPGA Tour. Known for her powerful, athletic swing and strong grip.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_f_lexi_v1', 'Lexi Thompson Driver Swing — Slow Motion', 'driver', 'down_the_line', ['driver', 'power', 'distance']),
      placeholderVideo('golf_f_lexi_v2', 'Lexi Thompson Iron Swing — Face On Analysis', 'iron', 'face_on', ['iron', 'strong_grip', 'athletic']),
    ],
  },
  {
    id: 'golf_f_jennifer_kupcho',
    sport: 'golf',
    sex: 'female',
    athleteName: 'Jennifer Kupcho',
    activeStatus: 'current',
    movementTypes: ['full_swing', 'driver', 'iron'],
    handedness: 'right',
    styleTags: ['balanced', 'accuracy', 'modern_swing', 'consistent'],
    bio: 'Jennifer Kupcho is a major champion on the LPGA Tour known for her balanced, modern swing technique and iron accuracy.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('golf_f_kupcho_v1', 'Jennifer Kupcho Swing Analysis — Slow Motion', 'driver', 'down_the_line', ['driver', 'balanced', 'modern_swing']),
      placeholderVideo('golf_f_kupcho_v2', 'Jennifer Kupcho Iron Play — Face On', 'iron', 'face_on', ['iron', 'accuracy', 'consistent']),
    ],
  },
];

// ──────────────────────────────────────────────────────────────
// TENNIS — 5 Male, 5 Female
// ──────────────────────────────────────────────────────────────

const TENNIS_MALE: ProfessionalSwingReference[] = [
  {
    id: 'tennis_m_roger_federer',
    sport: 'tennis',
    sex: 'male',
    athleteName: 'Roger Federer',
    activeStatus: 'retired',
    movementTypes: ['forehand', 'backhand', 'serve'],
    handedness: 'right',
    styleTags: ['effortless', 'flat_forehand', 'one_handed_backhand', 'footwork', 'elegance'],
    bio: 'Roger Federer is a 20-time Grand Slam champion widely considered one of the greatest tennis players of all time. Known for his effortless technique and one-handed backhand.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_m_federer_v1', 'Roger Federer Forehand Slow Motion Analysis', 'forehand', 'face_on', ['forehand', 'flat', 'wrist_snap']),
      placeholderVideo('tennis_m_federer_v2', 'Roger Federer One-Handed Backhand — Slow Motion', 'backhand', 'down_the_line', ['backhand', 'one_handed', 'elegance']),
    ],
  },
  {
    id: 'tennis_m_rafael_nadal',
    sport: 'tennis',
    sex: 'male',
    athleteName: 'Rafael Nadal',
    activeStatus: 'retired',
    movementTypes: ['forehand', 'backhand', 'serve'],
    handedness: 'left',
    styleTags: ['heavy_topspin', 'extreme_grip', 'physicality', 'left_handed', 'clay_specialist'],
    bio: 'Rafael Nadal is a 22-time Grand Slam champion and all-time clay court record holder. Known for his extreme western grip, heavy topspin forehand, and relentless physicality.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_m_nadal_v1', 'Rafael Nadal Forehand Slow Motion — Extreme Topspin', 'forehand', 'face_on', ['forehand', 'heavy_topspin', 'extreme_grip']),
      placeholderVideo('tennis_m_nadal_v2', 'Rafael Nadal Backhand Analysis — Slow Motion', 'backhand', 'down_the_line', ['backhand', 'two_handed', 'left_handed']),
    ],
  },
  {
    id: 'tennis_m_novak_djokovic',
    sport: 'tennis',
    sex: 'male',
    athleteName: 'Novak Djokovic',
    activeStatus: 'current',
    movementTypes: ['forehand', 'backhand', 'serve'],
    handedness: 'right',
    styleTags: ['flexibility', 'two_handed_backhand', 'consistency', 'return_of_serve', 'neutralizing'],
    bio: 'Novak Djokovic holds the all-time record for Grand Slam singles titles. Known for extraordinary flexibility, a formidable two-handed backhand, and elite court coverage.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_m_djokovic_v1', 'Novak Djokovic Forehand — Slow Motion Analysis', 'forehand', 'face_on', ['forehand', 'consistency', 'neutralizing']),
      placeholderVideo('tennis_m_djokovic_v2', 'Novak Djokovic Two-Handed Backhand — Slow Motion', 'backhand', 'down_the_line', ['backhand', 'two_handed', 'flexibility']),
    ],
  },
  {
    id: 'tennis_m_carlos_alcaraz',
    sport: 'tennis',
    sex: 'male',
    athleteName: 'Carlos Alcaraz',
    activeStatus: 'current',
    movementTypes: ['forehand', 'backhand', 'serve', 'drop_shot'],
    handedness: 'right',
    styleTags: ['explosive', 'variety', 'drop_shot', 'modern', 'aggressive'],
    bio: 'Carlos Alcaraz is a multiple Grand Slam champion and the youngest player to reach world number one. Known for his explosive movement, variety, and elite drop shot.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_m_alcaraz_v1', 'Carlos Alcaraz Forehand Slow Motion', 'forehand', 'face_on', ['forehand', 'explosive', 'modern']),
      placeholderVideo('tennis_m_alcaraz_v2', 'Carlos Alcaraz Backhand — Slow Motion Analysis', 'backhand', 'down_the_line', ['backhand', 'variety', 'aggressive']),
    ],
  },
  {
    id: 'tennis_m_jannik_sinner',
    sport: 'tennis',
    sex: 'male',
    athleteName: 'Jannik Sinner',
    activeStatus: 'current',
    movementTypes: ['forehand', 'backhand', 'serve'],
    handedness: 'right',
    styleTags: ['flat_hitting', 'clean_contact', 'aggressive_baseline', 'modern'],
    bio: 'Jannik Sinner is a Grand Slam champion and world number one known for his flat, penetrating groundstrokes and aggressive baseline game.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_m_sinner_v1', 'Jannik Sinner Forehand — Slow Motion', 'forehand', 'face_on', ['forehand', 'flat_hitting', 'modern']),
      placeholderVideo('tennis_m_sinner_v2', 'Jannik Sinner Backhand Analysis — Slow Motion', 'backhand', 'down_the_line', ['backhand', 'clean_contact', 'aggressive']),
    ],
  },
];

const TENNIS_FEMALE: ProfessionalSwingReference[] = [
  {
    id: 'tennis_f_serena_williams',
    sport: 'tennis',
    sex: 'female',
    athleteName: 'Serena Williams',
    activeStatus: 'retired',
    movementTypes: ['serve', 'forehand', 'backhand'],
    handedness: 'right',
    styleTags: ['power_serve', 'physicality', 'consistency', 'champion_mentality'],
    bio: 'Serena Williams is a 23-time Grand Slam champion widely regarded as the greatest women\'s tennis player of all time. Known for her dominant serve and powerful groundstrokes.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_f_serena_v1', 'Serena Williams Serve — Slow Motion Analysis', 'serve', 'side', ['serve', 'power', 'technique']),
      placeholderVideo('tennis_f_serena_v2', 'Serena Williams Forehand — Slow Motion', 'forehand', 'face_on', ['forehand', 'power', 'physicality']),
    ],
  },
  {
    id: 'tennis_f_iga_swiatek',
    sport: 'tennis',
    sex: 'female',
    athleteName: 'Iga Swiatek',
    activeStatus: 'current',
    movementTypes: ['forehand', 'backhand', 'serve'],
    handedness: 'right',
    styleTags: ['heavy_topspin', 'clay_specialist', 'consistency', 'mental_strength'],
    bio: 'Iga Swiatek is a multiple Grand Slam champion and former world number one known for her heavy topspin forehand and dominant clay court game.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_f_swiatek_v1', 'Iga Swiatek Forehand — Heavy Topspin Slow Motion', 'forehand', 'face_on', ['forehand', 'heavy_topspin', 'consistency']),
      placeholderVideo('tennis_f_swiatek_v2', 'Iga Swiatek Backhand — Slow Motion Analysis', 'backhand', 'down_the_line', ['backhand', 'clay_specialist']),
    ],
  },
  {
    id: 'tennis_f_aryna_sabalenka',
    sport: 'tennis',
    sex: 'female',
    athleteName: 'Aryna Sabalenka',
    activeStatus: 'current',
    movementTypes: ['serve', 'forehand', 'backhand'],
    handedness: 'right',
    styleTags: ['power', 'aggressive', 'big_serve', 'flat_hitting'],
    bio: 'Aryna Sabalenka is a multiple Grand Slam champion and former world number one known for her powerful, aggressive baseline game and big serve.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_f_sabalenka_v1', 'Aryna Sabalenka Forehand — Power Slow Motion', 'forehand', 'face_on', ['forehand', 'power', 'aggressive']),
      placeholderVideo('tennis_f_sabalenka_v2', 'Aryna Sabalenka Serve Analysis — Slow Motion', 'serve', 'side', ['serve', 'big_serve', 'flat_hitting']),
    ],
  },
  {
    id: 'tennis_f_naomi_osaka',
    sport: 'tennis',
    sex: 'female',
    athleteName: 'Naomi Osaka',
    activeStatus: 'current',
    movementTypes: ['serve', 'forehand', 'backhand'],
    handedness: 'right',
    styleTags: ['flat_forehand', 'power_serve', 'hard_court_specialist'],
    bio: 'Naomi Osaka is a 4-time Grand Slam champion and former world number one known for her flat forehand and powerful serve on hard courts.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_f_osaka_v1', 'Naomi Osaka Forehand — Slow Motion Analysis', 'forehand', 'face_on', ['forehand', 'flat', 'power']),
      placeholderVideo('tennis_f_osaka_v2', 'Naomi Osaka Serve — Slow Motion', 'serve', 'side', ['serve', 'power_serve', 'hard_court']),
    ],
  },
  {
    id: 'tennis_f_coco_gauff',
    sport: 'tennis',
    sex: 'female',
    athleteName: 'Coco Gauff',
    activeStatus: 'current',
    movementTypes: ['forehand', 'backhand', 'serve'],
    handedness: 'right',
    styleTags: ['baseline', 'consistency', 'two_handed_backhand', 'young_elite'],
    bio: 'Coco Gauff is a Grand Slam champion and former world number one, becoming one of the youngest major champions in the Open Era. Known for consistent baseline play.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('tennis_f_gauff_v1', 'Coco Gauff Forehand — Slow Motion Analysis', 'forehand', 'face_on', ['forehand', 'baseline', 'consistency']),
      placeholderVideo('tennis_f_gauff_v2', 'Coco Gauff Two-Handed Backhand — Slow Motion', 'backhand', 'down_the_line', ['backhand', 'two_handed', 'young_elite']),
    ],
  },
];

// ──────────────────────────────────────────────────────────────
// BASEBALL — 5 Male (MLB), 0 Female (pending)
// ──────────────────────────────────────────────────────────────

const BASEBALL_MALE: ProfessionalSwingReference[] = [
  {
    id: 'baseball_m_mike_trout',
    sport: 'baseball',
    sex: 'male',
    athleteName: 'Mike Trout',
    activeStatus: 'current',
    movementTypes: ['batting_swing', 'left_side_hitting'],
    handedness: 'right',
    styleTags: ['power', 'average', 'balanced', 'hip_drive'],
    bio: 'Mike Trout is a 3-time American League MVP widely considered one of the best all-around players in MLB history. Known for his balanced, powerful swing with elite hip drive.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('baseball_m_trout_v1', 'Mike Trout Batting Swing — Slow Motion DTL', 'batting_swing', 'down_the_line', ['batting', 'power', 'hip_drive']),
      placeholderVideo('baseball_m_trout_v2', 'Mike Trout Swing Analysis — Face On Slow Motion', 'batting_swing', 'face_on', ['batting', 'balance', 'average']),
    ],
  },
  {
    id: 'baseball_m_shohei_ohtani',
    sport: 'baseball',
    sex: 'male',
    athleteName: 'Shohei Ohtani',
    activeStatus: 'current',
    movementTypes: ['batting_swing', 'right_side_hitting'],
    handedness: 'left',
    styleTags: ['power', 'launch_angle', 'exit_velocity', 'modern'],
    bio: 'Shohei Ohtani is a two-way MLB superstar and multiple MVP winner known for elite exit velocity, launch angle optimization, and exceptional bat speed as a left-handed hitter.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('baseball_m_ohtani_v1', 'Shohei Ohtani Batting Swing — Slow Motion', 'batting_swing', 'down_the_line', ['batting', 'power', 'launch_angle']),
      placeholderVideo('baseball_m_ohtani_v2', 'Shohei Ohtani Swing Mechanics — Face On', 'batting_swing', 'face_on', ['batting', 'exit_velocity', 'modern']),
    ],
  },
  {
    id: 'baseball_m_juan_soto',
    sport: 'baseball',
    sex: 'male',
    athleteName: 'Juan Soto',
    activeStatus: 'current',
    movementTypes: ['batting_swing', 'left_side_hitting'],
    handedness: 'left',
    styleTags: ['plate_discipline', 'contact', 'walk_rate', 'balanced'],
    bio: 'Juan Soto is one of MLB\'s elite hitters known for extraordinary plate discipline, high walk rates, and a balanced swing producing both power and contact.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('baseball_m_soto_v1', 'Juan Soto Batting Swing — Slow Motion DTL', 'batting_swing', 'down_the_line', ['batting', 'plate_discipline', 'contact']),
      placeholderVideo('baseball_m_soto_v2', 'Juan Soto Swing Analysis — Face On', 'batting_swing', 'face_on', ['batting', 'balance', 'walk_rate']),
    ],
  },
  {
    id: 'baseball_m_freddie_freeman',
    sport: 'baseball',
    sex: 'male',
    athleteName: 'Freddie Freeman',
    activeStatus: 'current',
    movementTypes: ['batting_swing', 'left_side_hitting'],
    handedness: 'left',
    styleTags: ['contact', 'line_drive', 'consistent', 'inside_out'],
    bio: 'Freddie Freeman is a World Series MVP and six-time All-Star known for his consistent, line-drive swing with excellent contact rates as a left-handed hitter.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('baseball_m_freeman_v1', 'Freddie Freeman Swing — Slow Motion DTL', 'batting_swing', 'down_the_line', ['batting', 'contact', 'line_drive']),
      placeholderVideo('baseball_m_freeman_v2', 'Freddie Freeman Batting Mechanics — Face On', 'batting_swing', 'face_on', ['batting', 'consistent', 'inside_out']),
    ],
  },
  {
    id: 'baseball_m_bryce_harper',
    sport: 'baseball',
    sex: 'male',
    athleteName: 'Bryce Harper',
    activeStatus: 'current',
    movementTypes: ['batting_swing', 'left_side_hitting'],
    handedness: 'left',
    styleTags: ['power', 'pull_hitter', 'aggressive', 'launch_angle'],
    bio: 'Bryce Harper is a two-time NL MVP known for his explosive, pull-oriented power swing with elite launch angle mechanics as a left-handed hitter.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('baseball_m_harper_v1', 'Bryce Harper Swing — Slow Motion DTL', 'batting_swing', 'down_the_line', ['batting', 'power', 'pull_hitter']),
      placeholderVideo('baseball_m_harper_v2', 'Bryce Harper Batting Analysis — Face On', 'batting_swing', 'face_on', ['batting', 'aggressive', 'launch_angle']),
    ],
  },
];

// Baseball: no verified female professional entries yet
const BASEBALL_FEMALE: ProfessionalSwingReference[] = [];

// ──────────────────────────────────────────────────────────────
// SLOW PITCH SOFTBALL — 5 Placeholder entries
// ──────────────────────────────────────────────────────────────

function slowPitchPlaceholderEntry(index: number): ProfessionalSwingReference {
  return {
    id: `softball_slow_placeholder_${index}`,
    sport: 'softball_slow',
    sex: 'male',
    athleteName: 'TBD — Admin Verification Required',
    activeStatus: 'unknown',
    movementTypes: ['batting_swing'],
    handedness: 'unknown',
    styleTags: ['slow_pitch', 'recreational', 'tournament'],
    bio: 'Placeholder entry — slow pitch softball professional reference pending admin verification and athlete identification.',
    requiresVerification: true,
    adminNotes: 'Slow pitch softball lacks widely-known professional athletes with verifiable YouTube content. Admin should identify top ASA/USA Softball national tournament competitors and verify video sources before populating.',
    referenceVideos: [
      placeholderVideo(`softball_slow_ph${index}_v1`, 'Slow Pitch Softball Swing — Reference TBD', 'batting_swing', 'face_on', ['slow_pitch', 'batting']),
      placeholderVideo(`softball_slow_ph${index}_v2`, 'Slow Pitch Softball Mechanics — Reference TBD', 'batting_swing', 'down_the_line', ['slow_pitch', 'mechanics']),
    ],
  };
}

const SOFTBALL_SLOW_ENTRIES: ProfessionalSwingReference[] = [1, 2, 3, 4, 5].map(slowPitchPlaceholderEntry);

// ──────────────────────────────────────────────────────────────
// FAST PITCH SOFTBALL — 5 Female, 2 Male (TBD)
// ──────────────────────────────────────────────────────────────

const SOFTBALL_FAST_FEMALE: ProfessionalSwingReference[] = [
  {
    id: 'softball_fast_f_jennie_finch',
    sport: 'softball_fast',
    sex: 'female',
    athleteName: 'Jennie Finch',
    activeStatus: 'retired',
    movementTypes: ['batting_swing', 'pitching'],
    handedness: 'right',
    styleTags: ['power', 'compact_swing', 'icon', 'two_way'],
    bio: 'Jennie Finch is a two-time Olympic medalist and legendary fast pitch softball pitcher who also demonstrated exceptional hitting mechanics throughout her career.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('softball_fast_f_finch_v1', 'Jennie Finch Batting Swing Analysis', 'batting_swing', 'face_on', ['batting', 'compact', 'power']),
      placeholderVideo('softball_fast_f_finch_v2', 'Jennie Finch Swing Mechanics — Slow Motion', 'batting_swing', 'down_the_line', ['batting', 'icon', 'fast_pitch']),
    ],
  },
  {
    id: 'softball_fast_f_monica_abbott',
    sport: 'softball_fast',
    sex: 'female',
    athleteName: 'Monica Abbott',
    activeStatus: 'retired',
    movementTypes: ['pitching', 'batting_swing'],
    handedness: 'left',
    styleTags: ['left_handed', 'power_pitcher', 'elite', 'ncaa_record'],
    bio: 'Monica Abbott is a two-time Olympic medalist and record-breaking fast pitch pitcher known for her elite mechanics and left-handed power delivery.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('softball_fast_f_abbott_v1', 'Monica Abbott Fast Pitch Mechanics — Slow Motion', 'pitching', 'side', ['pitching', 'left_handed', 'elite']),
      placeholderVideo('softball_fast_f_abbott_v2', 'Monica Abbott Batting Swing Analysis', 'batting_swing', 'face_on', ['batting', 'left_handed', 'power']),
    ],
  },
  {
    id: 'softball_fast_f_cat_osterman',
    sport: 'softball_fast',
    sex: 'female',
    athleteName: 'Cat Osterman',
    activeStatus: 'retired',
    movementTypes: ['pitching', 'batting_swing'],
    handedness: 'left',
    styleTags: ['strikeout_artist', 'left_handed', 'olympic_gold', 'spin_rate'],
    bio: 'Cat Osterman is a two-time Olympic medalist considered one of the best fast pitch pitchers ever. Known for elite spin rates, movement, and left-handed delivery.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('softball_fast_f_osterman_v1', 'Cat Osterman Pitching Mechanics — Slow Motion', 'pitching', 'side', ['pitching', 'strikeout', 'left_handed']),
      placeholderVideo('softball_fast_f_osterman_v2', 'Cat Osterman Batting — Analysis', 'batting_swing', 'face_on', ['batting', 'technique', 'fast_pitch']),
    ],
  },
  {
    id: 'softball_fast_f_yukiko_ueno',
    sport: 'softball_fast',
    sex: 'female',
    athleteName: 'Yukiko Ueno',
    activeStatus: 'retired',
    movementTypes: ['pitching', 'batting_swing'],
    handedness: 'right',
    styleTags: ['olympic_gold', 'endurance', 'spin', 'japanese_technique'],
    bio: 'Yukiko Ueno is a two-time Olympic medalist (silver and gold) from Japan, famous for her legendary 2008 Olympic performance pitching 413 pitches in 21 hours over multiple games.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('softball_fast_f_ueno_v1', 'Yukiko Ueno Pitching Mechanics — Slow Motion', 'pitching', 'side', ['pitching', 'spin', 'endurance']),
      placeholderVideo('softball_fast_f_ueno_v2', 'Yukiko Ueno Batting Swing Analysis', 'batting_swing', 'face_on', ['batting', 'japanese_technique', 'fast_pitch']),
    ],
  },
  {
    id: 'softball_fast_f_yukari_yamamoto',
    sport: 'softball_fast',
    sex: 'female',
    athleteName: 'Yukari Yamamoto',
    activeStatus: 'retired',
    movementTypes: ['batting_swing'],
    handedness: 'right',
    styleTags: ['power_hitter', 'contact', 'japanese_softball', 'olympic'],
    bio: 'Yukari Yamamoto is a decorated Japanese softball player and Olympic medalist known for her consistent hitting mechanics and power in international competition.',
    requiresVerification: true,
    referenceVideos: [
      placeholderVideo('softball_fast_f_yamamoto_v1', 'Yukari Yamamoto Batting Swing — Slow Motion', 'batting_swing', 'face_on', ['batting', 'power', 'contact']),
      placeholderVideo('softball_fast_f_yamamoto_v2', 'Yukari Yamamoto Swing Mechanics Analysis', 'batting_swing', 'down_the_line', ['batting', 'japanese_softball', 'olympic']),
    ],
  },
];

function fastPitchMalePlaceholder(index: number): ProfessionalSwingReference {
  return {
    id: `softball_fast_male_placeholder_${index}`,
    sport: 'softball_fast',
    sex: 'male',
    athleteName: 'TBD — Admin Verification Required',
    activeStatus: 'unknown',
    movementTypes: ['batting_swing', 'pitching'],
    handedness: 'unknown',
    styleTags: ['fast_pitch', 'male_softball'],
    bio: 'Placeholder entry — male fast pitch softball professional reference pending admin verification.',
    requiresVerification: true,
    adminNotes: 'Men\'s fast pitch softball has professional-level players in international competition (ISF World Championships). Admin should identify top international competitors and verify video sources.',
    referenceVideos: [
      placeholderVideo(`softball_fast_m_ph${index}_v1`, 'Men\'s Fast Pitch Softball — Reference TBD', 'batting_swing', 'face_on', ['fast_pitch', 'batting']),
      placeholderVideo(`softball_fast_m_ph${index}_v2`, 'Men\'s Fast Pitch Softball Pitching — Reference TBD', 'pitching', 'side', ['fast_pitch', 'pitching']),
    ],
  };
}

const SOFTBALL_FAST_MALE: ProfessionalSwingReference[] = [1, 2].map(fastPitchMalePlaceholder);

// ──────────────────────────────────────────────────────────────
// Combined export
// ──────────────────────────────────────────────────────────────

export const ALL_PROFESSIONAL_REFERENCES: ProfessionalSwingReference[] = [
  ...GOLF_MALE,
  ...GOLF_FEMALE,
  ...TENNIS_MALE,
  ...TENNIS_FEMALE,
  ...BASEBALL_MALE,
  ...BASEBALL_FEMALE,
  ...SOFTBALL_SLOW_ENTRIES,
  ...SOFTBALL_FAST_FEMALE,
  ...SOFTBALL_FAST_MALE,
];
