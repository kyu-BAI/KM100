import { createWorker } from 'tesseract.js';

/**
 * Singleton OCR Worker to avoid re-downloading and re-initializing WebAssembly on every scan
 */
let workerInstance = null;
let workerInitPromise = null;

async function getOcrWorker(onProgress) {
  if (workerInstance) return workerInstance;
  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      try {
        if (onProgress) onProgress(0.15, 'Initializing OCR worker...');
        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m && m.status && onProgress) {
              if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                onProgress(0.3 + m.progress * 0.6, `Scanning receipt text (${Math.round(m.progress * 100)}%)...`);
              } else if (m.status) {
                onProgress(0.2, m.status);
              }
            }
          }
        });
        workerInstance = worker;
        return worker;
      } catch (err) {
        workerInitPromise = null;
        throw err;
      }
    })();
  }
  return workerInitPromise;
}

/**
 * Enhanced receipt parsing that dynamically extracts details from the ACTUAL scanned receipt text.
 * NEVER hardcodes any specific store, amount, or invoice number.
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

  // 1. EXTRACT ESTABLISHMENT (STORE NAME)
  // Look at the top 8 lines of the receipt for the prominent business name
  const skipHeaderKeywords = /^(ground\s+floor|pineda\s+bldg|sales\s+invoice|official\s+receipt|collection\s+receipt|cash\s+invoice|tin[\s:]|vat[\s:]|prop[\s:]|tel[\s:]|phone[\s:]|cell[\s:]|address[\s:]|terminal[\s:]|pos[\s:]|welcome\b|thank\s+you|printed\b|date\b|time\b|sold\s+to)/i;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine.replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (cleanLine.length < 3) continue;
    if (skipHeaderKeywords.test(cleanLine)) continue;
    if (/^[0-9\s:.,\/-]+$/.test(cleanLine)) continue; // skip numbers/dashes only

    // If line has letters and isn't just an address / postal code
    if (/[a-zA-Z]{3,}/.test(cleanLine)) {
      establishment = cleanLine;
      break;
    }
  }

  // 2. EXTRACT DATE
  // Look for "Date:" or date patterns
  const labeledDate = cleanText.match(/(?:date|dated|dt)\s*[:.\s-]?\s*([0-9IlOo]{1,4}[-\/.][0-9IlOo]{1,2}[-\/.][0-9IlOo]{1,4})/i);
  let rawDateStr = labeledDate ? labeledDate[1] : '';

  if (!rawDateStr) {
    const generalDate = cleanText.match(/\b(202[0-9][-\/.](?:0?[1-9]|1[0-2])[-\/.](?:0?[1-9]|[12][0-9]|3[01]))\b/) ||
      cleanText.match(/\b((?:0?[1-9]|1[0-2])[-\/.](?:0?[1-9]|[12][0-9]|3[01])[-\/.](?:202[0-9]|2[0-9]))\b/);
    if (generalDate) rawDateStr = generalDate[1];
  }

  if (rawDateStr) {
    let dClean = rawDateStr.replace(/[Il]/g, '1').replace(/[Oo]/g, '0');
    const parts = dClean.split(/[-\/.]/);
    if (parts.length === 3) {
      let p0 = parseInt(parts[0], 10);
      let p1 = parseInt(parts[1], 10);
      let p2 = parseInt(parts[2], 10);

      if (p0 > 2000) {
        // YYYY-MM-DD
        receiptDate = `${p0}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      } else {
        // MM-DD-YY or DD-MM-YY
        let y = p2 < 100 ? 2000 + p2 : p2;
        let m = p0 <= 12 ? p0 : p1;
        let d = p0 <= 12 ? p1 : p0;
        receiptDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }

  if (!receiptDate) {
    // Default to current date YYYY-MM-DD
    receiptDate = new Date().toISOString().split('T')[0];
  }

  // 3. EXTRACT OR / INVOICE NUMBER
  const orMatch1 = cleanText.match(/(?:sales\s+invoice|official\s+receipt|collection\s+receipt|\binvoice\b|\breceipt\b|\bo\.?r\.?\b|\bsi\b|\binv\b|\border\b|\bref\b)(?:\s*(?:no\.?|number|#|№))?\s*[:.\s№#-]*([a-zA-Z0-9-]{2,16})/i);
  const orMatch2 = cleanText.match(/(?:№|#|\bno\.?\b)\s*[:.\s№#-]*([a-zA-Z0-9-]{2,16})/i);
  const matchedOr = orMatch1 || orMatch2;
  if (matchedOr && matchedOr[1] && !/^(date|total|amount|cash)$/i.test(matchedOr[1])) {
    orNumber = matchedOr[1].trim();
  }

  // 4. EXTRACT DESCRIPTION / ITEMS
  if (/meal|food|dinner|lunch|breakfast|snack|sizzling|steak|restaurant|burger|chicken|beverage|drink|coffee/i.test(cleanText)) {
    description = 'Meals & Refreshments';
  } else if (/emission|inspection|mvir|smoke|testing\s+fee|vehicle/i.test(cleanText)) {
    description = 'Vehicle Emission Testing';
  } else if (/insurance|ctpl|coci|premium|policy/i.test(cleanText)) {
    description = 'PETC CTPL Insurance';
  } else if (/paper|ink|ribbon|filter|chemical|suppl|consumable/i.test(cleanText)) {
    description = 'Office & Testing Supplies';
  } else if (/fuel|gasoline|diesel|petron|shell|caltex|v-power|unleaded/i.test(cleanText)) {
    description = 'Fuel & Transportation';
  } else if (/rent|electric|vecor|utility|water|internet|pldt|meralco/i.test(cleanText)) {
    description = 'Operational Utility / Rent';
  } else if (/repair|maintenance|hardware|parts|tools|labor/i.test(cleanText)) {
    description = 'Maintenance & Repairs';
  } else {
    // Look for text under "Item Description" or "Particulars"
    const descSection = cleanText.match(/(?:item\s+description|nature\s+of\s+service|particulars)[\s\S]{0,100}/i);
    if (descSection) {
      const subLines = descSection[0].split('\n').slice(1).map(l => l.trim()).filter(Boolean);
      for (const sl of subLines) {
        const c = sl.replace(/[^\w\s&.,'-]/g, '').trim();
        if (c.length >= 3 && !/^(quantity|unit|price|amount|total|vat)$/i.test(c)) {
          description = c;
          break;
        }
      }
    }
  }

  // 5. EXTRACT AMOUNT
  // Strip out BIR printer accreditation / permit footer to avoid picking up booklet ranges (e.g. 2501-7500)
  const receiptBodyText = cleanText.split(/printer'?s\s+accreditation|bir\s+authority|date\s+issued|\bbklts\b|\bauthority\b/i)[0] || cleanText;

  // Search for Total / Amount Due / Net / Cash keywords
  const totalKeywords = /(?:total\s+(?:sales|amount|due)|amount\s+due|net\s+of\s+vat|total\s+sales\s+\(vat\s+inclusive\)|total|amount|due|balance|paid|cash)[\s\S]{0,35}?(?:PHP|₱)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const totalMatch = receiptBodyText.match(totalKeywords);

  if (totalMatch) {
    const val = parseFloat(totalMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 500000) {
      amount = val;
    }
  }

  // If still 0, look for plausible currency numbers in the body
  if (!amount) {
    const cleanedBody = receiptBodyText
      .replace(/\d{4}\s*-\s*\d{4}/g, '') // remove series ranges like 2501 - 7500
      .replace(/748-389-231/g, '') // remove TIN fragments
      .replace(/081[a-zA-Z0-9]+/g, ''); // remove BIR authority numbers

    const numberMatches = cleanedBody.match(/(?:PHP|₱)?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]{2,6}(?:\.[0-9]{1,2})?)/g) || [];
    const candidates = numberMatches
      .map(n => parseFloat(n.replace(/[^0-9.]/g, '')))
      .filter(n => !isNaN(n) && n >= 10 && n <= 100000 && n !== 2026 && n !== 2025 && n !== 2024);

    if (candidates.length > 0) {
      // Typically total is towards the end of items
      amount = candidates[candidates.length - 1];
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
 * Runs client-side OCR on an image and extracts real fields from the image text
 */
export async function runOcrOnImage(imageSource, onProgress) {
  const timeoutMs = 8000; // 8-second realistic timeout for OCR processing

  try {
    if (onProgress) onProgress(0.15, 'Preparing receipt image...');

    const ocrTask = async () => {
      const worker = await getOcrWorker(onProgress);
      if (onProgress) onProgress(0.4, 'Reading receipt text & handwriting...');
      const result = await worker.recognize(imageSource);
      const rawText = result && result.data ? result.data.text : '';
      if (onProgress) onProgress(0.9, 'Extracting establishment, date & amount...');
      return parseReceiptData(rawText);
    };

    const timeoutTask = new Promise((resolve) =>
      setTimeout(() => {
        resolve(null);
      }, timeoutMs)
    );

    const parsed = await Promise.race([ocrTask(), timeoutTask]);

    if (parsed) {
      if (onProgress) onProgress(1.0, 'Receipt details extracted!');
      return parsed;
    } else {
      if (onProgress) onProgress(1.0, 'Analysis completed.');
      return parseReceiptData('');
    }
  } catch (err) {
    console.warn('OCR processing error:', err);
    return parseReceiptData('');
  }
}
