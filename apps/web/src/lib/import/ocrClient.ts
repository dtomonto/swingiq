// Client helper for the optional OCR auto-extraction route.
// Always degrades to "not configured" so the manual importer keeps working.

export interface OcrClientResult {
  configured: boolean;
  headers?: string[];
  rows?: string[][];
  confidence?: 'high' | 'medium' | 'low';
  message?: string;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

/** Returns true when the server reports a live OCR provider. */
export async function isOcrLive(): Promise<boolean> {
  try {
    const res = await fetch('/api/capabilities');
    const caps = (await res.json()) as { ocr?: boolean };
    return !!caps.ocr;
  } catch {
    return false;
  }
}

/** Attempt OCR extraction for an image. Never throws. */
export async function runOcr(file: File, source: string): Promise<OcrClientResult> {
  try {
    const imageBase64 = await fileToBase64(file);
    const res = await fetch('/api/import/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, source }),
    });
    return (await res.json()) as OcrClientResult;
  } catch {
    return { configured: false, message: 'Auto-extraction unavailable. Enter your data manually.' };
  }
}
