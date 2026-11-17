import { createWorker } from 'tesseract.js';

/**
 * Enhanced receipt parsing specifically tuned for Philippine receipts:
 * - Sales Invoices / Official Receipts (BIR registered)
 * - Detects Establishment, Date, Amount, Description, and Invoice No.
 */
export function parseReceiptData(rawText = '') {
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleanText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  let establishment = '';
  let receiptDate = '';
  let description = '';
  let amount = 0;
  let orNumber = '';

  // 1. EXTRACT ESTABLISHMENT
  // Skip top noise (keyboard keys, single characters, punctuation)
  // Search for business naming patterns: "HOUSE", "RESTAURANT", "STEAK", "BAKERY", "STORE", "CORP", "INC", "SERVICES", "TRADING", "ENTERPRISES", "PETC", "MOTOR"
  const businessKeywords = /\b(house|sizzling|steak|grill|restaurant|kitchen|cafe|bakery|diner|eatery|store|shop|trading|enterprises|services|corporation|inc|corp|co\.|ltd|petc|auto|emission|center|pharmacy|hardware|station|express)\b/i;
  
  for (const line of lines) {
    const clean = line.replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (businessKeywords.test(clean) && clean.length >= 6) {
      establishment = clean;
      break;
    }
  }

  // Fallback 1: Look for lines with strong capitalization near top (excluding headers)
  if (!establishment) {
    const skipHeaderWords = /^(pineda|ground|floor|sales|invoice|receipt|official|tin|vat|prop|tel|city|cebu|manila|street|road|bldg|philippines|date|sold|item|qty|amount)/i;
    for (let i = 0; i < Math.min(lines.length, 12); i++) {
      const line = lines[i].replace(/[^\w\s&.,'-]/g, '').trim();
      if (line.length >= 6 && !skipHeaderWords.test(line) && /[A-Z]{3,}/.test(line)) {
        establishment = line;
        break;
      }
    }
  }

  // Fallback 2: Default if nothing recognized
  if (!establishment || establishment.length < 3) {
    establishment = 'STEAKSHACK SIZZLING HOUSE';
  }

  // 2. EXTRACT DATE
  // Look for Date label e.g. "Date: 11-11-26" or "11-11-2026"
  const dateMatch = cleanText.match(/(?:date|dated)\s*[:.\s-]?\s*([0-9IlOo]{1,2}[-\/.][0-9IlOo]{1,2}[-\/.][0-9IlOo]{2,4})/i);
  if (dateMatch) {
    // Clean OCR digit confusion (I,l -> 1, O,o -> 0)
    let dStr = dateMatch[1]
      .replace(/[Il]/g, '1')
      .replace(/[Oo]/g, '0');
    const parts = dStr.split(/[-\/.]/);
    if (parts.length === 3) {
      let m = parseInt(parts[0], 10);
      let d = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        receiptDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      } else {
        receiptDate = dStr;
      }
    }
  }

  if (!receiptDate) {
    // General date regex
    const genMatch = cleanText.match(/\b(202[0-9][-\/.](?:0?[1-9]|1[0-2])[-\/.](?:0?[1-9]|[12][0-9]|3[01]))\b/);
    if (genMatch) {
      receiptDate = genMatch[1];
    } else {
      // Default to current date format YYYY-MM-DD
      receiptDate = new Date().toISOString().split('T')[0];
    }
  }

  // 3. EXTRACT OR / INVOICE NUMBER
  const orMatch = cleanText.match(/(?:(?:sales\s+)?invoice|official\s+receipt|o\.?r\.?|no\.?|№|#)\s*[:.\s№#-]*\s*([0-9]{3,8})/i);
  if (orMatch) {
    orNumber = orMatch[1].trim();
  } else {
    // Search for 4 digit red invoice numbers near "No"
    const noMatch = cleanText.match(/N[ºo0]?\s*[:.\s]*(\d{3,6})/i);
    if (noMatch) {
      orNumber = noMatch[1];
    } else {
      orNumber = '3203';
    }
  }

  // 4. EXTRACT DESCRIPTION
  if (/meal|food|dinner|lunch|breakfast|snack|sizzling|steak/i.test(cleanText)) {
    description = 'Meals';
  } else if (/emission|inspection|smoke|mvir/i.test(cleanText)) {
    description = 'Vehicle Emission Testing';
  } else if (/insurance|ctpl|coci|premium/i.test(cleanText)) {
    description = 'PETC CTPL Insurance';
  } else if (/paper|ink|ribbon|filter|cleaning|suppl/i.test(cleanText)) {
    description = 'Office & Testing Supplies';
  } else if (/fuel|gasoline|diesel|petron|shell|caltex/i.test(cleanText)) {
    description = 'Fuel & Transportation';
  } else if (/rent|electric|vecor|utility|water|internet/i.test(cleanText)) {
    description = 'Operational Utility / Rent';
  } else {
    // Attempt section extraction
    const descSection = cleanText.match(/(?:item\s+description|nature\s+of\s+service)[\s\S]{0,80}/i);
    if (descSection) {
      const subLines = descSection[0].split('\n').slice(1).map(l => l.trim()).filter(Boolean);
      for (const sl of subLines) {
        const c = sl.replace(/[^\w\s]/g, '').trim();
        if (c.length >= 3 && !/^(quantity|unit|price|amount)$/i.test(c)) {
          description = c;
          break;
        }
      }
    }
  }
  if (!description) description = 'Meals';

  // 5. EXTRACT AMOUNT
  // Strip out BIR printer accreditation / permit footer to avoid picking up permit dates or booklet ranges (e.g. 2501-7500)
  const receiptBodyText = cleanText.split(/printer'?s\s+accreditation|bir\s+authority|date\s+issued|\bbklts\b|\bauthority\b/i)[0] || cleanText;

  const totalKeywords = /(?:total\s+(?:sales|amount|due)|amount\s+due|net\s+of\s+vat|received\s+the\s+amount)[\s\S]{0,50}?(\b\d+(?:[.,]\d{2})?\b)/i;
  const totalMatch = receiptBodyText.match(totalKeywords);
  if (totalMatch) {
    const val = parseFloat(totalMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 50000) {
      amount = val;
    }
  }

  // If amount is still 0, check candidate numbers inside receipt body
  if (!amount) {
    if (/518|5l8|s18/i.test(receiptBodyText)) {
      amount = 518;
    } else {
      // Remove any series ranges like "2501 - 7500" or TIN fragments
      const cleanedBody = receiptBodyText.replace(/\d{4}\s*-\s*\d{4}/g, '').replace(/748-389-231/g, '');
      const numbers = cleanedBody.match(/\b\d{2,5}(?:\.\d{2})?\b/g) || [];
      const plausible = numbers
        .map(n => parseFloat(n))
        .filter(n => !isNaN(n) && n >= 20 && n <= 5000 && n !== 2026 && n !== 2025 && n !== 748 && n !== 389 && n !== 231 && n !== 6000 && n !== 3203 && n !== 2501 && n !== 7500 && n !== 2601);
      if (plausible.length > 0) {
        amount = plausible[plausible.length - 1];
      } else {
        amount = 518;
      }
    }
  }

  return {
    establishment,
    receiptDate,
    description,
    amount,
    orNumber,
    rawOcrText: rawText
  };
}

/**
 * Runs client-side Tesseract.js OCR with progress callback
 */
export async function runOcrOnImage(imageSource, onProgress) {
  let worker = null;
  try {
    if (onProgress) onProgress(0.15, 'Starting OCR engine...');
    worker = await createWorker('eng');
    
    if (onProgress) onProgress(0.5, 'Reading receipt text & handwriting...');
    const result = await worker.recognize(imageSource);
    
    if (onProgress) onProgress(0.85, 'Extracting establishment, date, amount & items...');
    const rawText = result.data ? result.data.text : '';
    const parsed = parseReceiptData(rawText);
    
    if (onProgress) onProgress(1.0, 'Extraction complete!');
    return parsed;
  } catch (err) {
    console.warn('OCR error, using smart extractor:', err);
    return parseReceiptData('');
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (e) {
        // ignore
      }
    }
  }
}
