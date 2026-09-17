import { SpotType, SpotTypePricing } from '../types';

/**
 * Messy rate card parser for Level 1 — T4 challenge.
 * Handles various formats of rate data with junk/noise.
 */

export interface ParsedRateEntry {
  spotType: SpotType;
  firstHour: number;
  additionalHour: number;
  dailyCap: number;
  raw: string; // Original messy line
  cleaned: string; // Cleaned version
  warnings: string[]; // Issues found during parsing
}

export interface ParseResult {
  entries: ParsedRateEntry[];
  errors: string[];
  skipped: string[];
  stats: {
    totalLines: number;
    parsedLines: number;
    junkLines: number;
    duplicates: number;
  };
}

/**
 * Sample messy rate card data (realistic junk data).
 * This simulates what might come from a scanned document, manual entry, or legacy system.
 */
export const SAMPLE_MESSY_RATE_CARD = `
# Parking Rate Card - City Centre Mall
# Last updated: 2024 (???)

Vehicle Type | 1st Hour | Additional Hour | Daily Max
------------------------------------------------------
Two Wheeler     Rs. 20        10             100/-
compact car     ₹40          Rs 20          200 rupees
STANDARD        60/-         INR 30         300
E.V. (Electric)  80          40             400

# Notes:
# - Part hours round up
# - EV charging included
# - Rates subject to change

towheeler    25    12    120
Compct       45    22    220
standerd     65    32    320
ev           85    42    420

# Duplicate entries (should be ignored or flagged)
Two-Wheeler   ₹20   ₹10   ₹100
compact       40    20    200

# Junk lines
This is not a rate
Random text here!!!
12345
!!!@#$%
N/A  N/A  N/A
-    -    -

# More messy entries
TWO WHEELER    Rs 20/-    10/-    100/-
Compact Car    ₹ 40       ₹ 20    ₹ 200
Standard       INR60      INR30   INR300
EV / Electric  ₹80        ₹40     ₹400

# Edge cases
tw   20   10   100
comp   40   20   200
std   60   30   300
electric   80   40   400

# Missing values
Two-Wheeler   20        100
Compact       40   20
Standard      60   30   300
EV            80   40   400

# Invalid numbers
Two-Wheeler   abc   10   100
Compact       40    xyz  200
Standard      60    30   ###
EV            80    40   400

# Negative numbers (invalid)
Two-Wheeler   -20   10   100
Compact       40    -10  200

# Very large numbers (suspicious)
Two-Wheeler   20    10   999999
Compact       40    20   200

# Extra whitespace
   Two-Wheeler      20      10      100   
	Compact    40    20    200	
  Standard   60   30   300  
    EV       80   40   400    

# Tab-separated
Two-Wheeler	20	10	100
Compact	40	20	200

# Mixed separators
Two-Wheeler | 20 | 10 | 100
Compact,40,20,200
Standard;60;30;300
EV  80  40  400
`;

/**
 * Normalize spot type from messy input.
 * Handles typos, abbreviations, variations.
 */
function normalizeSpotType(raw: string): SpotType | null {
  const normalized = raw.toLowerCase().trim();

  // Two-wheeler variations
  if (
    normalized.includes('two') ||
    normalized.includes('2') ||
    normalized === 'tw' ||
    normalized.includes('bike') ||
    normalized.includes('scooter') ||
    normalized.includes('motorcycle') ||
    normalized.includes('towheeler') ||
    normalized.includes('towheeler')
  ) {
    return 'twoWheeler';
  }

  // Compact variations
  if (
    normalized.includes('compact') ||
    normalized.includes('compct') ||
    normalized.includes('comp') ||
    normalized.includes('small') ||
    normalized === 'c'
  ) {
    return 'compact';
  }

  // Standard variations
  if (
    normalized.includes('standard') ||
    normalized.includes('standerd') ||
    normalized.includes('std') ||
    normalized.includes('sedan') ||
    normalized.includes('suv') ||
    normalized === 's'
  ) {
    return 'standard';
  }

  // EV variations
  if (
    normalized.includes('ev') ||
    normalized.includes('electric') ||
    normalized.includes('e.v.') ||
    normalized.includes('e-v') ||
    normalized === 'e'
  ) {
    return 'ev';
  }

  return null;
}

/**
 * Parse a monetary value from messy input.
 * Handles: ₹40, Rs. 40, 40 rupees, INR 40, 40/-, 40, etc.
 */
function parseMonetaryValue(raw: string): { value: number | null; warning: string | null } {
  if (!raw || typeof raw !== 'string') {
    return { value: null, warning: 'Empty value' };
  }

  let cleaned = raw.trim();

  // Remove currency symbols and text
  cleaned = cleaned
    .replace(/₹/g, '')
    .replace(/rs\.?/gi, '')
    .replace(/rupees?/gi, '')
    .replace(/inr\.?/gi, '')
    .replace(/\/-/g, '')
    .replace(/[-–—]/g, '') // Remove dashes
    .replace(/\s+/g, ' ')
    .trim();

  // Check for invalid markers
  if (
    cleaned === '' ||
    cleaned.toLowerCase() === 'n/a' ||
    cleaned === '-' ||
    cleaned === '###' ||
    cleaned === '???'
  ) {
    return { value: null, warning: `Invalid marker: "${raw}"` };
  }

  // Try to parse as number
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    return { value: null, warning: `Cannot parse number: "${raw}"` };
  }

  if (num < 0) {
    return { value: null, warning: `Negative number: ${num}` };
  }

  if (num > 10000) {
    return { value: num, warning: `Suspiciously large value: ${num}` };
  }

  return { value: num, warning: null };
}

/**
 * Split a line into columns, handling various separators.
 */
function splitLine(line: string): string[] {
  // Try different separators in order of preference
  const separators = ['|', '\t', ';', ','];

  for (const sep of separators) {
    if (line.includes(sep)) {
      return line.split(sep).map(s => s.trim());
    }
  }

  // Fall back to whitespace splitting
  return line.split(/\s{2,}/).map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Parse a single line of rate data.
 */
function parseLine(line: string): ParsedRateEntry | null {
  const warnings: string[] = [];
  const columns = splitLine(line);

  if (columns.length < 2) {
    return null;
  }

  // First column should be spot type
  const rawType = columns[0];
  const spotType = normalizeSpotType(rawType);

  if (!spotType) {
    return null;
  }

  // Parse monetary values
  const firstHourResult = parseMonetaryValue(columns[1] || '');
  const additionalHourResult = parseMonetaryValue(columns[2] || '');
  const dailyCapResult = parseMonetaryValue(columns[3] || '');

  if (firstHourResult.warning) warnings.push(firstHourResult.warning);
  if (additionalHourResult.warning) warnings.push(additionalHourResult.warning);
  if (dailyCapResult.warning) warnings.push(dailyCapResult.warning);

  // Need at least first hour rate
  if (firstHourResult.value === null) {
    return null;
  }

  // Use defaults for missing values
  const firstHour = firstHourResult.value;
  const additionalHour = additionalHourResult.value ?? Math.round(firstHour / 2);
  const dailyCap = dailyCapResult.value ?? firstHour * 5;

  if (additionalHourResult.value === null) {
    warnings.push(`Missing additional hour rate, using default: ${additionalHour}`);
  }
  if (dailyCapResult.value === null) {
    warnings.push(`Missing daily cap, using default: ${dailyCap}`);
  }

  return {
    spotType,
    firstHour,
    additionalHour,
    dailyCap,
    raw: line,
    cleaned: `${spotType}: ₹${firstHour}/₹${additionalHour}/₹${dailyCap}`,
    warnings,
  };
}

/**
 * Parse the entire messy rate card.
 */
export function parseMessyRateCard(input: string): ParseResult {
  const lines = input.split('\n');
  const entries: ParsedRateEntry[] = [];
  const errors: string[] = [];
  const skipped: string[] = [];
  const seenTypes = new Set<SpotType>();
  let duplicates = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    // Skip header lines
    if (
      line.toLowerCase().includes('vehicle type') ||
      line.toLowerCase().includes('rate card') ||
      line.includes('---') ||
      line.toLowerCase().includes('last updated')
    ) {
      continue;
    }

    // Try to parse the line
    const entry = parseLine(line);

    if (!entry) {
      skipped.push(`Line ${i + 1}: "${line}"`);
      continue;
    }

    // Check for duplicates (keep first occurrence)
    if (seenTypes.has(entry.spotType)) {
      duplicates++;
      if (entry.warnings.length === 0) {
        entry.warnings.push('Duplicate entry (keeping first occurrence)');
      }
      // Still add it but mark as duplicate
      entries.push(entry);
      continue;
    }

    seenTypes.add(entry.spotType);
    entries.push(entry);
  }

  return {
    entries,
    errors,
    skipped,
    stats: {
      totalLines: lines.length,
      parsedLines: entries.length,
      junkLines: skipped.length,
      duplicates,
    },
  };
}

/**
 * Convert parsed entries to PricingConfig.
 * Uses first occurrence of each spot type.
 */
export function entriesToPricing(entries: ParsedRateEntry[]): {
  byType: {
    twoWheeler: SpotTypePricing;
    compact: SpotTypePricing;
    standard: SpotTypePricing;
    ev: SpotTypePricing;
  };
} {
  const byType = {
    twoWheeler: { firstHourRate: 20, additionalHourRate: 10, dailyCap: 100 },
    compact: { firstHourRate: 40, additionalHourRate: 20, dailyCap: 200 },
    standard: { firstHourRate: 60, additionalHourRate: 30, dailyCap: 300 },
    ev: { firstHourRate: 80, additionalHourRate: 40, dailyCap: 400 },
  };

  for (const entry of entries) {
    // Skip duplicates (keep first)
    if (entry.warnings.some(w => w.includes('Duplicate'))) {
      continue;
    }

    byType[entry.spotType] = {
      firstHourRate: entry.firstHour,
      additionalHourRate: entry.additionalHour,
      dailyCap: entry.dailyCap,
    };
  }

  return { byType };
}
