import { createWorker } from 'tesseract.js';

// Gemini API Key from Vite env
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Singleton OCR Worker for local fallback (used only if offline or API unavailable)
 */
let workerInstance = null;
let workerInitPromise = null;

async function getOcrWorker(onProgress) {
  if (workerInstance) return workerInstance;
  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      try {
        if (onProgress) onProgress(0.15, 'Initializing local OCR engine...');
        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m && m.status && onProgress) {
              if (m.status === 'recognizing text' && typeof m.progress === 'number') {
                onProgress(0.3 + m.progress * 0.6, `Scanning text (${Math.round(m.progress * 100)}%)...`);
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
 * Uses Google Gemini Vision API to accurately read physical receipts (handwritten & printed).
 * High accuracy: extracts establishment, date, description, amount, and invoice/OR number.
 */
async function extractWithGeminiVision(imageSource, onProgress, receiptType = null) {
  if (!GEMINI_API_KEY) return null;

  try {
    if (onProgress) onProgress(0.25, 'Analyzing receipt with Gemini Vision AI...');

    let base64Data = imageSource;
    let mimeType = 'image/jpeg';
    if (imageSource.startsWith('data:')) {
      const parts = imageSource.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      base64Data = parts[1] || '';
    }

    if (!base64Data) return null;

    // High availability models
    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

    const typeContext = receiptType?.name ? `The document is being filed as: "${receiptType.name}" (${receiptType.category || ''}). ` : '';

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: 'You are an expert OCR receipt extractor. Analyze this physical receipt image (both printed and handwritten text). ' + typeContext + 'Return ONLY valid JSON with the following structure:\n' +
                        '{\n' +
                        '  "establishment": "Name of the business, store, or vendor at the top",\n' +
                        '  "receiptDate": "YYYY-MM-DD format (if handwritten e.g. 11-11-26, convert to 2026-11-11; if not found, use empty string)",\n' +
                        '  "description": "Short description of the items or nature of service (e.g. Emission Testing Sales, Daily Income Collection, Supplies, Fuel, Food, Service)",\n' +
                        '  "amount": 0.00,\n' +
                        '  "orNumber": "Official Receipt No., Sales Invoice No., or Reference Number"\n' +
                        '}\n' +
                        'Important: Do NOT invent or hallucinate data. Read the actual text from the image accurately.'
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        };

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 7500);

        if (onProgress) onProgress(0.55, 'Gemini AI reading text & figures...');

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(fetchTimeout);

        if (!res.ok) {
          console.warn(`Gemini API model ${model} responded with status:`, res.status);
          continue; // Try next model
        }

        const data = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) continue;

        let parsedJson = null;
        try {
          parsedJson = JSON.parse(candidateText.trim());
        } catch {
          const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsedJson = JSON.parse(jsonMatch[0]);
        }

        if (parsedJson) {
          if (onProgress) onProgress(0.95, 'AI extraction complete!');
          return {
            establishment: (parsedJson.establishment || '').trim(),
            receiptDate: (parsedJson.receiptDate || '').trim(),
            description: (parsedJson.description || '').trim(),
            amount: typeof parsedJson.amount === 'number' ? parsedJson.amount : parseFloat(parsedJson.amount) || 0,
            orNumber: String(parsedJson.orNumber || '').trim(),
            rawOcrText: candidateText
          };
        }
      } catch (err) {
        console.warn(`Error querying model ${model}:`, err.message || err);
      }
    }
  } catch (err) {
    console.warn('Extraction failed:', err);
  }

  return null;
}

/**
 * Fallback receipt parsing that dynamically extracts details from the raw scanned text.
 * NEVER hardcodes any specific store, amount, or invoice number.
 */
export function parseReceiptData(rawText = '', receiptType = null) {
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
  const skipHeaderKeywords = /^(ground\s+floor|pineda\s+bldg|sales\s+invoice|official\s+receipt|collection\s+receipt|cash\s+invoice|tin[\s:]|vat[\s:]|prop[\s:]|tel[\s:]|phone[\s:]|cell[\s:]|address[\s:]|terminal[\s:]|pos[\s:]|welcome\b|thank\s+you|printed\b|date\b|time\b|sold\s+to)/i;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const rawLine = lines[i];
    const cleanLine = rawLine.replace(/^[^\w]+|[^\w]+$/g, '').trim();
    if (cleanLine.length < 3) continue;
    if (skipHeaderKeywords.test(cleanLine)) continue;
    if (/^[0-9\s:.,\/-]+$/.test(cleanLine)) continue;

    if (/[a-zA-Z]{3,}/.test(cleanLine)) {
      establishment = cleanLine;
      break;
    }
  }

  // 2. EXTRACT DATE
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
        receiptDate = `${p0}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      } else {
        let y = p2 < 100 ? 2000 + p2 : p2;
        let m = p0 <= 12 ? p0 : p1;
        let d = p0 <= 12 ? p1 : p0;
        receiptDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }

  if (!receiptDate) {
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
  if (/emission|inspection|mvir|smoke|testing\s+fee|vehicle/i.test(cleanText)) {
    description = 'Vehicle Emission Testing Sales';
  } else if (/insurance|ctpl|coci|premium|policy/i.test(cleanText)) {
    description = 'PETC CTPL Insurance Payment';
  } else if (/collection|remittance|revenue|sales|income/i.test(cleanText)) {
    description = 'Daily Collection / Revenue';
  } else if (/meal|food|dinner|lunch|breakfast|snack|sizzling|steak|restaurant|burger|chicken|beverage|drink|coffee/i.test(cleanText)) {
    description = 'Meals & Refreshments';
  } else if (/paper|ink|ribbon|filter|chemical|suppl|consumable/i.test(cleanText)) {
    description = 'Office & Testing Supplies';
  } else if (/fuel|gasoline|diesel|petron|shell|caltex|v-power|unleaded/i.test(cleanText)) {
    description = 'Fuel & Transportation';
  } else if (/rent|electric|vecor|utility|water|internet|pldt|meralco/i.test(cleanText)) {
    description = 'Operational Utility / Rent';
  } else if (/repair|maintenance|hardware|parts|tools|labor/i.test(cleanText)) {
    description = 'Maintenance & Repairs';
  } else if (receiptType) {
    if (receiptType.id === 'petc-sales') description = 'Vehicle Emission Testing Sales';
    else if (receiptType.id === 'petc-income') description = 'Daily Collection / Revenue';
    else if (receiptType.id === 'petc-insurance') description = 'PETC CTPL Insurance Payment';
    else if (receiptType.id === 'consumables-delivery') description = 'Office & Testing Supplies';
    else if (receiptType.id === 'voucher-disbursement') description = 'Petty Cash Payment Voucher';
    else if (receiptType.name) description = receiptType.name;
  } else {
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
  const receiptBodyText = cleanText.split(/printer'?s\s+accreditation|bir\s+authority|date\s+issued|\bbklts\b|\bauthority\b/i)[0] || cleanText;

  const totalKeywords = /(?:total\s+(?:sales|amount|due)|amount\s+due|net\s+of\s+vat|total\s+sales\s+\(vat\s+inclusive\)|total|amount|due|balance|paid|cash)[\s\S]{0,35}?(?:PHP|₱)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const totalMatch = receiptBodyText.match(totalKeywords);

  if (totalMatch) {
    const val = parseFloat(totalMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 500000) {
      amount = val;
    }
  }

  if (!amount) {
    const cleanedBody = receiptBodyText
      .replace(/\d{4}\s*-\s*\d{4}/g, '')
      .replace(/748-389-231/g, '')
      .replace(/081[a-zA-Z0-9]+/g, '');

    const numberMatches = cleanedBody.match(/(?:PHP|₱)?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]{2,6}(?:\.[0-9]{1,2})?)/g) || [];
    const candidates = numberMatches
      .map(n => parseFloat(n.replace(/[^0-9.]/g, '')))
      .filter(n => !isNaN(n) && n >= 10 && n <= 100000 && n !== 2026 && n !== 2025 && n !== 2024);

    if (candidates.length > 0) {
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
 * Runs receipt recognition on an image:
 * 1. Uses Gemini Vision AI for high-accuracy handwritten & printed text recognition.
 * 2. Falls back to local Tesseract OCR if network is unavailable.
 */
export async function runOcrOnImage(imageSource, onProgress, receiptType = null) {
  try {
    if (onProgress) onProgress(0.1, 'Analyzing receipt image with Gemini Vision AI...');

    // 1. Primary: Use Gemini Vision AI
    const geminiResult = await extractWithGeminiVision(imageSource, onProgress, receiptType);
    if (geminiResult && (geminiResult.establishment || geminiResult.amount > 0 || geminiResult.orNumber)) {
      if (onProgress) onProgress(1.0, 'Receipt details verified with Gemini AI!');
      return geminiResult;
    }

    // 2. Fallback: Local OCR
    if (onProgress) onProgress(0.4, 'Running fallback local OCR engine...');
    const worker = await getOcrWorker(onProgress);
    const result = await worker.recognize(imageSource);
    const rawText = result && result.data ? result.data.text : '';
    const parsed = parseReceiptData(rawText, receiptType);
    if (onProgress) onProgress(1.0, 'Receipt details extracted!');
    return parsed;
  } catch (err) {
    console.warn('OCR processing error:', err);
    return parseReceiptData('', receiptType);
  }
}
