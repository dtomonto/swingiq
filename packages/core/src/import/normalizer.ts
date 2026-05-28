// ============================================================
// SwingIQ Universal Launch-Monitor Data Normalizer
// Converts CSV rows from any brand into the universal schema
// ============================================================

import type { BallData, ClubDeliveryData, StrikeData, LaunchMonitorBrand } from '../types';

// ── Column name maps per brand ────────────────────────────────

type ColumnMap = Record<string, string[]>; // universalField -> possible csv headers

const UNIVERSAL_COLUMN_MAP: ColumnMap = {
  club: ['club', 'club name', 'club_name', 'clubname', 'Club', 'Club Name'],
  carry_distance: ['carry', 'carry distance', 'carry_distance', 'Carry Distance (yds)', 'carry_yds', 'Carry (yds)', 'Carry'],
  total_distance: ['total', 'total distance', 'total_distance', 'Total Distance (yds)', 'Total Distance', 'total_yds'],
  ball_speed: ['ball speed', 'ball_speed', 'Ball Speed (mph)', 'Ball Speed', 'ballspeed', 'BS (mph)', 'BS'],
  club_speed: ['club speed', 'club_speed', 'Club Speed (mph)', 'Club Speed', 'cs', 'CS (mph)'],
  launch_angle: ['launch angle', 'launch_angle', 'Launch Angle (deg)', 'Launch Angle', 'la', 'LA (deg)', 'Vert. Launch Angle', 'Vertical Launch Angle'],
  launch_direction: ['launch direction', 'launch_direction', 'Launch Direction', 'Horiz. Launch Angle', 'Horizontal Launch Angle', 'start direction', 'Start Direction'],
  spin_rate: ['spin rate', 'spin_rate', 'Spin Rate (rpm)', 'Spin Rate', 'backspin', 'Back Spin', 'Total Spin', 'spin'],
  spin_axis: ['spin axis', 'spin_axis', 'Spin Axis (deg)', 'Spin Axis', 'Side Spin', 'sidespin'],
  apex_height: ['apex', 'apex height', 'apex_height', 'Apex Height (ft)', 'Max Height', 'max height', 'Peak Height'],
  smash_factor: ['smash factor', 'smash_factor', 'Smash Factor', 'SF'],
  attack_angle: ['attack angle', 'attack_angle', 'Attack Angle (deg)', 'Attack Angle', 'AoA', 'Angle of Attack'],
  club_path: ['club path', 'club_path', 'Club Path (deg)', 'Club Path', 'swing direction', 'Swing Direction'],
  face_angle: ['face angle', 'face_angle', 'Face Angle (deg)', 'Face Angle', 'face to target', 'Face To Target'],
  face_to_path: ['face to path', 'face_to_path', 'Face To Path (deg)', 'Face To Path', 'FtP'],
  dynamic_loft: ['dynamic loft', 'dynamic_loft', 'Dynamic Loft (deg)', 'Dynamic Loft', 'DL'],
  spin_loft: ['spin loft', 'spin_loft', 'Spin Loft (deg)', 'Spin Loft', 'SL'],
  low_point: ['low point', 'low_point', 'Low Point (in)', 'Low Point', 'LP'],
  side_carry: ['side', 'side carry', 'side_carry', 'Side Carry (yds)', 'Side (yds)', 'offline', 'Offline'],
  lateral_offline: ['lateral', 'lateral offline', 'lateral_offline', 'Side Distance (yds)', 'Miss Distance'],
  impact_location_lateral: ['impact x', 'impact_location_lateral', 'Impact Location (X)', 'ImpactX', 'Strike Location X'],
  impact_location_vertical: ['impact y', 'impact_location_vertical', 'Impact Location (Y)', 'ImpactY', 'Strike Location Y'],
  descent_angle: ['descent', 'descent angle', 'Descent Angle (deg)', 'Descent Angle'],
  roll_distance: ['roll', 'roll distance', 'Roll Distance (yds)', 'Run', 'roll'],
};

// ── Brand-specific overrides ──────────────────────────────────

const BRAND_COLUMN_OVERRIDES: Partial<Record<LaunchMonitorBrand, ColumnMap>> = {
  flightscope: {
    spin_axis: ['Spin Axis', 'Axis', 'Side Spin'],
    low_point: ['Low Point Pos', 'Low Point (in)'],
    club_path: ['Club Path', 'In-to-Out'],
  },
  trackman: {
    carry_distance: ['Carry', 'Carry Distance'],
    club_path: ['Club Path', 'Swing Direction'],
    face_angle: ['Face Angle'],
    face_to_path: ['Face To Path'],
    attack_angle: ['Attack Angle'],
    spin_loft: ['Spin Loft'],
    dynamic_loft: ['Dynamic Loft'],
    lateral_offline: ['Offline'],
  },
  foresight: {
    spin_rate: ['Back Spin', 'Backspin (rpm)', 'Spin (rpm)'],
    spin_axis: ['Side Spin (rpm)', 'Side Spin'],
    carry_distance: ['Carry Dist (yds)', 'Carry Distance (yds)'],
    lateral_offline: ['Side Dist (yds)'],
  },
  garmin: {
    carry_distance: ['Carry (yds)', 'Distance Carry'],
    club_speed: ['Club Speed (mph)', 'Swing Speed'],
    launch_angle: ['Launch Angle (deg)'],
  },
  skytrak: {
    spin_rate: ['Back Spin', 'Spin Rate (rpm)'],
    spin_axis: ['Side Spin'],
    carry_distance: ['Carry Distance'],
  },
  rapsodo: {
    carry_distance: ['Carry Distance', 'Carry (yds)'],
    ball_speed: ['Ball Speed', 'Ball Velocity'],
    spin_rate: ['Total Spin', 'Spin Rate'],
  },
};

// ── Column Detection ──────────────────────────────────────────

export function detectColumnMapping(
  headers: string[],
  brand: LaunchMonitorBrand = 'manual',
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const brandOverrides = BRAND_COLUMN_OVERRIDES[brand] ?? {};
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const [universalField, candidates] of Object.entries(UNIVERSAL_COLUMN_MAP)) {
    const allCandidates = [
      ...(brandOverrides[universalField] ?? []),
      ...candidates,
    ];

    for (const candidate of allCandidates) {
      const idx = normalizedHeaders.indexOf(candidate.toLowerCase().trim());
      if (idx !== -1) {
        mapping[universalField] = headers[idx]!;
        break;
      }
    }
  }

  return mapping;
}

export function getMissingCriticalFields(mapping: Record<string, string>): string[] {
  const critical = ['club', 'carry_distance'];
  return critical.filter((f) => !mapping[f]);
}

export function getMissingRecommendedFields(mapping: Record<string, string>): string[] {
  const recommended = [
    'ball_speed', 'club_speed', 'launch_angle', 'spin_rate',
    'face_to_path', 'club_path', 'attack_angle', 'dynamic_loft',
    'smash_factor',
  ];
  return recommended.filter((f) => !mapping[f]);
}

// ── Row Normalization ─────────────────────────────────────────

function parseNum(value: string | undefined): number | null {
  if (value === undefined || value === null || value.trim() === '' || value === '--' || value === 'N/A') return null;
  const n = parseFloat(value.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
}

export interface NormalizedShot {
  club_name: string;
  ball_data: BallData;
  club_data: ClubDeliveryData;
  strike_data: StrikeData;
  raw: Record<string, string>;
}

export function normalizeRow(
  row: Record<string, string>,
  mapping: Record<string, string>,
  brand: LaunchMonitorBrand = 'manual',
): NormalizedShot {
  const get = (field: string): string | undefined => {
    const col = mapping[field];
    return col ? row[col] : undefined;
  };

  // Unit conversions
  let carry = parseNum(get('carry_distance'));
  let total = parseNum(get('total_distance'));
  let ballSpeed = parseNum(get('ball_speed'));
  let clubSpeed = parseNum(get('club_speed'));

  // Foresight sometimes exports in meters
  if (brand === 'foresight') {
    // Detect if values look like meters (< 100 for carry is suspicious)
    if (carry !== null && carry < 80 && carry > 5) carry = Math.round(carry * 1.09361);
    if (total !== null && total < 90 && total > 5) total = Math.round(total * 1.09361);
  }

  const ball_data: BallData = {
    carry_distance: carry,
    total_distance: total,
    roll_distance: parseNum(get('roll_distance')),
    ball_speed: ballSpeed,
    launch_angle_vertical: parseNum(get('launch_angle')),
    launch_direction_horizontal: parseNum(get('launch_direction')),
    spin_rate: parseNum(get('spin_rate')),
    spin_axis: parseNum(get('spin_axis')),
    apex_height: parseNum(get('apex_height')),
    descent_angle: parseNum(get('descent_angle')),
    side_carry: parseNum(get('side_carry')),
    lateral_offline: parseNum(get('lateral_offline')) ?? parseNum(get('side_carry')),
    curve: null,
    flight_time: null,
    shot_shape: null,
    smash_factor: parseNum(get('smash_factor')) ??
      (ballSpeed !== null && clubSpeed !== null && clubSpeed > 0
        ? Math.round((ballSpeed / clubSpeed) * 100) / 100
        : null),
  };

  const club_data: ClubDeliveryData = {
    club_speed: clubSpeed,
    attack_angle: parseNum(get('attack_angle')),
    club_path: parseNum(get('club_path')),
    face_angle_to_target: parseNum(get('face_angle')),
    face_to_path: parseNum(get('face_to_path')),
    dynamic_loft: parseNum(get('dynamic_loft')),
    spin_loft: parseNum(get('spin_loft')),
    swing_plane_horizontal: null,
    swing_plane_vertical: null,
    low_point_position: parseNum(get('low_point')),
    low_point_height: null,
    closure_rate: null,
    swing_direction: null,
    lie_angle_dynamic: null,
  };

  const strike_data: StrikeData = {
    impact_location_lateral: parseNum(get('impact_location_lateral')),
    impact_location_vertical: parseNum(get('impact_location_vertical')),
  };

  return {
    club_name: get('club') ?? 'Unknown',
    ball_data,
    club_data,
    strike_data,
    raw: row,
  };
}

// ── CSV Parser ────────────────────────────────────────────────

export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]!);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]!);
    if (values.every((v) => v === '')) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

export function getMissingFieldMessage(missingFields: string[]): string {
  if (missingFields.length === 0) return '';
  const fieldLabels: Record<string, string> = {
    club_path: 'Club Path',
    face_to_path: 'Face-to-Path',
    attack_angle: 'Attack Angle',
    dynamic_loft: 'Dynamic Loft',
    smash_factor: 'Smash Factor',
    spin_rate: 'Spin Rate',
    ball_speed: 'Ball Speed',
    club_speed: 'Club Speed',
    launch_angle: 'Launch Angle',
  };
  const labels = missingFields.map((f) => fieldLabels[f] ?? f);
  return `This file does not include: ${labels.join(', ')}. ` +
    `The app can still analyze distance, launch, and dispersion, ` +
    `but some diagnostic rules require the missing data to run.`;
}
