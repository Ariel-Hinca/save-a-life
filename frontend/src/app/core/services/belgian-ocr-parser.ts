import { OcrScanResponse } from '../models/models';

/** Parse Belgian Red Cross OCR text into structured fields (client fallback). */
export function parseBelgianRedCrossOcr(text: string, clientConfidence = 0): OcrScanResponse {
  const normalized = normalizeOcrNoise(text || '');
  const response: OcrScanResponse = {
    donationId: '',
    donationDate: '',
    donationType: 'Whole Blood',
    center: '',
    confidence: clientConfidence || 0,
    detectedLanguage: detectLanguage(normalized),
    hemoglobin: null,
    hematocrit: null,
    redBloodCells: null,
    whiteBloodCells: null,
    platelets: null,
    ferritin: null,
    bloodPressure: null,
    weight: null,
    notes: '',
    rawText: text || '',
  };

  const ref =
    normalized.match(/Ref\.?\s*[:.]?\s*(\d{5,})\s*\/\s*([A-Z0-9]+)/i) ||
    normalized.match(/\b(\d{6,8})\s*\/\s*(B[A-Z0-9]{10,})/i);
  if (ref) response.donationId = `${ref[1]}/${ref[2].toUpperCase()}`;

  const gift = normalized.match(
    /(?:GIFT\s+VAN|DON\s+DU|DON\s+DE|Donation\s+(?:of|on)|bloedinzameling\s+van|collecte\s+du)\s+(\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4})/i
  );
  if (gift) {
    response.donationDate = normalizeDate(gift[1]);
  } else {
    const dates = [...normalized.matchAll(/\b(\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4})\b/g)];
    for (const m of dates) {
      const idx = m.index ?? 0;
      const window = normalized.slice(Math.max(0, idx - 40), idx + 40);
      if (/GIFT|DON |bloedinzameling|collecte|deelname|participation/i.test(window)) {
        response.donationDate = normalizeDate(m[1]);
        break;
      }
    }
    if (!response.donationDate && dates[0]) response.donationDate = normalizeDate(dates[0][1]);
  }

  if (/donatie\s+van\s+bloedplaatjes|don\s+de\s+plaquette|platelet\s+donat/i.test(normalized)) {
    response.donationType = 'Platelets';
  } else if (/plasadonatie|don\s+de\s+plasma|plasma\s+donat/i.test(normalized)) {
    response.donationType = 'Plasma';
  } else {
    response.donationType = 'Whole Blood';
  }

  const centers: [RegExp, string][] = [
    [/Bruxelles|Brussel|Brussels|Uccle|Ukkel/i, 'Brussels'],
    [/Leuven|Louvain/i, 'Leuven'],
    [/Antwerpen|Anvers|Antwerp/i, 'Antwerp'],
    [/Gent|Gand|Ghent/i, 'Ghent'],
    [/Li[eè]ge|Luik/i, 'Liège'],
    [/Namur|Namen|Suarl[eé]e/i, 'Namur'],
    [/Mons|Bergen/i, 'Mons'],
    [/Charleroi/i, 'Charleroi'],
  ];
  for (const [re, center] of centers) {
    if (re.test(normalized)) {
      response.center = center;
      break;
    }
  }

  response.hemoglobin = normalizeHemoglobin(
    extractLab(normalized, /Hemoglob(?:ine|lne|me)|Hémoglobine|Hemoglobin|\bHb\b/i, ['g/dl', 'g/l'])
  );
  response.hematocrit = normalizeHematocrit(
    extractLab(normalized, /Hematokriet|Hématocrite|Hematocrit|\bHct\b/i, ['%'])
  );
  response.redBloodCells = normalizeScaled(
    extractLab(normalized, /Rode bloedcellen|Globules rouges|Red blood cells/i),
    100
  );
  response.whiteBloodCells = normalizeScaled(
    extractLab(normalized, /W(?:itte|te)\s+bloedcellen|Globules blancs|White blood cells/i),
    10
  );
  response.platelets = extractLab(normalized, /Bloedplaatjes|Plaquettes|Platelets/i);
  response.ferritin = extractLab(normalized, /Ferritine|Ferritin/i);

  if (/hemoglobinegehalte bevindt zich onder|hémoglobine .* sous|hemoglobin .* below|onder de norm|sous la norme/i.test(normalized)) {
    response.notes = 'Hemoglobin below donation threshold — control required before next donation.';
  }

  let found = 0;
  if (response.donationId) found++;
  if (response.donationDate) found++;
  if (response.center) found++;
  if (response.hemoglobin != null) found++;
  if (response.hematocrit != null) found++;
  response.confidence = Math.min(99, (clientConfidence || 40) + found * 3);

  return response;
}

export function normalizeOcrResponse(raw: Record<string, unknown> | OcrScanResponse | null | undefined): OcrScanResponse {
  const r = (raw || {}) as Record<string, unknown>;
  const pick = <T>(...keys: string[]): T | undefined => {
    for (const key of keys) {
      if (r[key] !== undefined && r[key] !== null && r[key] !== '') return r[key] as T;
    }
    return undefined;
  };

  return {
    donationId: String(pick('donationId', 'DonationId') ?? ''),
    donationDate: String(pick('donationDate', 'DonationDate') ?? ''),
    donationType: String(pick('donationType', 'DonationType') ?? 'Whole Blood'),
    center: String(pick('center', 'Center') ?? ''),
    confidence: Number(pick('confidence', 'Confidence') ?? 0),
    detectedLanguage: String(pick('detectedLanguage', 'DetectedLanguage') ?? ''),
    hemoglobin: toNum(pick('hemoglobin', 'Hemoglobin')),
    hematocrit: toNum(pick('hematocrit', 'Hematocrit')),
    redBloodCells: toNum(pick('redBloodCells', 'RedBloodCells')),
    whiteBloodCells: toNum(pick('whiteBloodCells', 'WhiteBloodCells')),
    platelets: toNum(pick('platelets', 'Platelets')),
    ferritin: toNum(pick('ferritin', 'Ferritin')),
    bloodPressure: (pick<string>('bloodPressure', 'BloodPressure') as string | undefined) ?? null,
    weight: toNum(pick('weight', 'Weight')),
    notes: String(pick('notes', 'Notes') ?? ''),
    extractionMethod: String(pick('extractionMethod', 'ExtractionMethod') ?? ''),
    rawText: String(pick('rawText', 'RawText') ?? ''),
  };
}

export function mergeOcrResults(primary: OcrScanResponse, fallback: OcrScanResponse): OcrScanResponse {
  return {
    donationId: primary.donationId || fallback.donationId,
    donationDate: primary.donationDate || fallback.donationDate,
    donationType: primary.donationType || fallback.donationType || 'Whole Blood',
    center: primary.center || fallback.center,
    confidence: Math.max(primary.confidence || 0, fallback.confidence || 0),
    detectedLanguage: primary.detectedLanguage || fallback.detectedLanguage,
    hemoglobin: primary.hemoglobin ?? fallback.hemoglobin ?? null,
    hematocrit: primary.hematocrit ?? fallback.hematocrit ?? null,
    redBloodCells: primary.redBloodCells ?? fallback.redBloodCells ?? null,
    whiteBloodCells: primary.whiteBloodCells ?? fallback.whiteBloodCells ?? null,
    platelets: primary.platelets ?? fallback.platelets ?? null,
    ferritin: primary.ferritin ?? fallback.ferritin ?? null,
    bloodPressure: primary.bloodPressure || fallback.bloodPressure || null,
    weight: primary.weight ?? fallback.weight ?? null,
    notes: primary.notes || fallback.notes || '',
    extractionMethod: primary.extractionMethod || fallback.extractionMethod,
    rawText: primary.rawText || fallback.rawText || '',
  };
}

function extractLab(text: string, label: RegExp, unitHints: string[] = []): number | null {
  const match = text.match(label);
  if (!match || match.index == null) return null;
  const window = text.slice(match.index, match.index + 120);
  const numbers = [...window.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) => ({
    raw: m[1],
    index: m.index ?? 0,
    value: Number(m[1].replace(',', '.')),
  }));
  if (!numbers.length) return null;

  for (const hint of unitHints) {
    const unitRe = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${hint.replace('/', '\\/')}`, 'i');
    const unitMatch = window.match(unitRe);
    if (unitMatch) return Number(unitMatch[1].replace(',', '.'));
  }

  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i];
    const after = window.slice(n.index + n.raw.length, n.index + n.raw.length + 3);
    if (/^\s*[-–—]/.test(after)) continue;
    if (!Number.isFinite(n.value)) continue;
    return n.value;
  }

  return Number.isFinite(numbers[0].value) ? numbers[0].value : null;
}

function normalizeOcrNoise(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\bWte\b/gi, 'Witte')
    .replace(/Hemogloblne/gi, 'Hemoglobine')
    .replace(/Hematokr[il]et/gi, 'Hematokriet')
    .replace(/G[Il]FT\s+VAN/gi, 'GIFT VAN');
}

function normalizeHemoglobin(value: number | null): number | null {
  if (value == null) return null;
  if (value >= 30 && value <= 250) return Math.round((value / 10) * 10) / 10;
  if (value < 5 || value > 25) return null;
  return value;
}

function normalizeHematocrit(value: number | null): number | null {
  if (value == null) return null;
  if (value >= 200 && value <= 600) return Math.round((value / 10) * 10) / 10;
  if (value < 20 || value > 65) return null;
  return value;
}

function normalizeScaled(value: number | null, scaleIfLarge: number): number | null {
  if (value == null) return null;
  if (value >= scaleIfLarge) return Math.round((value / scaleIfLarge) * 100) / 100;
  return value;
}

function normalizeDate(raw: string): string {
  const parts = raw.replace(/\s+/g, '').replace(/[-.]/g, '/').split('/');
  if (parts.length !== 3) return raw;
  let [d, m, y] = parts;
  if (y.length === 2) y = `20${y}`;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

function detectLanguage(text: string): string {
  if (/Beste Donor|Hartelijk bedankt|bloedinzameling|Hemoglobine|Hematokriet/i.test(text)) return 'nl';
  if (/Cher Donneur|collecte|Hémoglobine|Hématocrite/i.test(text)) return 'fr';
  return 'en';
}

function toNum(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
