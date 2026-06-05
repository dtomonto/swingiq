// ============================================================
// SwingVantage — Image/Table Extraction Service
// OCR stub + manual fallback for screenshot/photo imports
// ============================================================

export type ImageExtractionSource =
  | 'flightscope' | 'trackman' | 'foresight' | 'garmin' | 'rapsodo'
  | 'blast_motion' | 'zepp' | 'diamond_kinetics' | 'hittrax'
  | 'tennis_sensor' | 'spreadsheet' | 'generic' | 'unknown';

export type ExtractionConfidence = 'high' | 'medium' | 'low' | 'unreviewed';

export interface ExtractedCell {
  columnKey: string;
  rawValue: string;
  normalizedValue: number | string | null;
  unit: string | null;
  confidence: ExtractionConfidence;
  warning: string | null;
}

export interface ExtractedRow {
  rowIndex: number;
  cells: ExtractedCell[];
  rowConfidence: ExtractionConfidence;
  warnings: string[];
  isDuplicate: boolean;
}

export interface ImageExtractionResult {
  source: ImageExtractionSource;
  sport: string;
  movementType: string;
  detectedColumns: string[];
  suggestedColumnMapping: Record<string, string>; // rawCol -> normalizedField
  rows: ExtractedRow[];
  overallConfidence: ExtractionConfidence;
  warnings: string[];
  requiresReview: true; // always true — never analyze without user review
  extractedAt: string;
}

export interface ManualTableEntry {
  columnHeaders: string[];
  rows: string[][];
  source: ImageExtractionSource;
  sport: string;
  movementType: string;
}

// Stub: In a real implementation this calls an OCR/vision API.
// Returns a mock low-confidence result that requires user review.
export async function extractTableFromImage(
  fileBase64: string,
  sport: string,
  movementType: string,
  source: ImageExtractionSource,
): Promise<ImageExtractionResult> {
  // TODO: integrate with Google Vision API, AWS Textract, or OpenAI Vision
  // For now, return a stub that directs users to manual entry
  void fileBase64; // reserved for future OCR integration
  return {
    source,
    sport,
    movementType,
    detectedColumns: [],
    suggestedColumnMapping: {},
    rows: [],
    overallConfidence: 'unreviewed',
    warnings: [
      'Automatic extraction is not yet enabled. Please enter your data manually below.',
      'Upload your image for reference, then type your values into the table.',
    ],
    requiresReview: true,
    extractedAt: new Date().toISOString(),
  };
}

export function normalizeManualEntry(entry: ManualTableEntry): ImageExtractionResult {
  const rows: ExtractedRow[] = entry.rows.map((row, i) => ({
    rowIndex: i,
    cells: entry.columnHeaders.map((col, j) => ({
      columnKey: col,
      rawValue: row[j] ?? '',
      normalizedValue: parseFloat(row[j] ?? '') || row[j] || null,
      unit: null,
      confidence: 'high' as ExtractionConfidence,
      warning: null,
    })),
    rowConfidence: 'high',
    warnings: [],
    isDuplicate: false,
  }));
  return {
    source: entry.source,
    sport: entry.sport,
    movementType: entry.movementType,
    detectedColumns: entry.columnHeaders,
    suggestedColumnMapping: {},
    rows,
    overallConfidence: 'high',
    warnings: [],
    requiresReview: true,
    extractedAt: new Date().toISOString(),
  };
}
