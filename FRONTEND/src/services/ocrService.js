// Google Gemini Vision AI OCR Service
// Exclusively uses Google Gemini Vision API for high-accuracy handwritten & printed receipt recognition.

// Permanent Embedded Gemini API Key provided for receipt scanning
const _EMBEDDED_ENC_KEY = 'QVEuQWI4Uk42TENYdlA4MGNSeC1MZ0tmVTNXWk9IbzVqSGpVZGgyT2Zpa1hYSDZRUlQ5d0E=';
export const DEFAULT_EMBEDDED_GEMINI_KEY = typeof atob === 'function' ? atob(_EMBEDDED_ENC_KEY) : '';

/**
 * Returns active Gemini API key:
 * Always returns the embedded verified key and clears any stale keys from localStorage.
 */
export function getGeminiApiKey() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('petc_gemini_api_key');
    } catch {
      // ignore localStorage errors
    }
  }
  return DEFAULT_EMBEDDED_GEMINI_KEY;
}

export function setCustomGeminiApiKey(key) {
  // no-op: internal key is locked to embedded key
}

/**
 * Tests whether a Gemini API key is valid by making a minimal request to the Google API.
 */
export async function testGeminiApiKey(candidateKey) {
  const keyToTest = (candidateKey || getGeminiApiKey() || '').trim();
  if (!keyToTest) {
    return { ok: false, error: 'No API key provided.' };
  }
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${keyToTest}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping test. Reply with OK' }] }]
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || 'Network connection error' };
  }
}

/**
 * Uses Google Gemini Vision API to accurately read physical receipts (handwritten & printed).
 * High accuracy: extracts establishment, date, description, amount, invoice/OR number, and lineItems.
 */
async function extractWithGeminiVision(imageSource, onProgress, receiptType = null) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      isReceipt: false,
      isApiKeyError: true,
      rejectionReason: 'No Gemini Vision API key is configured. Please provide an active Gemini API key from Google AI Studio (aistudio.google.com/apikey).',
      establishment: '',
      receiptDate: '',
      description: '',
      amount: 0,
      orNumber: '',
      lineItems: [],
      rawOcrText: ''
    };
  }

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

    // High accuracy vision models (ordered by availability & reliability)
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'gemini-flash-latest'];

    const typeContext = receiptType?.name ? `The document is being filed as: "${receiptType.name}" (${receiptType.category || ''}). ` : '';

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: 'You are an expert OCR receipt extractor and financial document verifier.\n' +
                        'CRITICAL VERIFICATION STEP:\n' +
                        'First, determine whether this image is a genuine physical or digital receipt, sales invoice, official receipt (OR), cash voucher, billing invoice, or collection receipt.\n' +
                        '- If the image is NOT a receipt (e.g. it shows a keyboard, computer monitor, person, face, animal, random object, blank paper, landscape, screenshot of a non-financial app, food without a bill, etc.), set "isReceipt": false, explain what is in the photo in "rejectionReason", and leave other fields empty.\n' +
                        '- If the image IS a valid receipt, invoice, or voucher, set "isReceipt": true and extract the actual data.\n\n' +
                        typeContext + 'Return ONLY valid JSON with the following structure:\n' +
                        '{\n' +
                        '  "isReceipt": true,\n' +
                        '  "rejectionReason": "",\n' +
                        '  "establishment": "Name of the business, store, or vendor at the top (e.g. RED GOOSE, KM100, Petron)",\n' +
                        '  "receiptDate": "YYYY-MM-DD format (if handwritten e.g. 10/6 2026, convert to 2026-10-06; if not found, use empty string)",\n' +
                        '  "description": "Short description of items or service (e.g. Kitchen Supplies, Groceries, Fuel, Emission Testing)",\n' +
                        '  "amount": 2795.00,\n' +
                        '  "orNumber": "Official Receipt No., Order Slip No., Sales Invoice No., or Reference Number",\n' +
                        '  "lineItems": [\n' +
                        '    {\n' +
                        '      "qty": "10",\n' +
                        '      "unit": "PCS",\n' +
                        '      "name": "ALASKA CREMA",\n' +
                        '      "unitPrice": 75.00,\n' +
                        '      "amount": 750.00\n' +
                        '    }\n' +
                        '  ]\n' +
                        '}\n' +
                        'Important Notes:\n' +
                        '- For receipts or order slips with listed items/entries, extract EVERY single entry into "lineItems" with its qty, unit, article/item name, unit price, and total amount.\n' +
                        '- Set "amount" to the final TOTAL / GRAND TOTAL amount (sum of all entries).\n' +
                        '- If there is only one unitemized purchase, you may leave "lineItems" as an empty array [].\n' +
                        '- Do NOT hallucinate data. Read the actual text from the image accurately.'
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
        const fetchTimeout = setTimeout(() => controller.abort(), 9000);

        if (onProgress) onProgress(0.55, 'Verifying receipt details with Gemini AI...');

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(fetchTimeout);

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          console.warn(`Gemini API model ${model} responded with status:`, res.status, errBody);
          // If the key is invalid, disabled, or unauthenticated, report immediately instead of silent failure
          if (res.status === 400 || res.status === 401 || res.status === 403) {
            const apiMessage = errBody?.error?.message || `Authentication error (${res.status})`;
            return {
              isReceipt: false,
              isApiKeyError: true,
              rejectionReason: `AI Service Error: ${apiMessage}. The Google Cloud service account bound to this key is deleted or disabled.`,
              establishment: '',
              receiptDate: '',
              description: '',
              amount: 0,
              orNumber: '',
              lineItems: [],
              rawOcrText: JSON.stringify(errBody)
            };
          }
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
          // If the AI explicitly rejected the image as not a receipt
          if (parsedJson.isReceipt === false) {
            if (onProgress) onProgress(1.0, 'Validation: Image is not a receipt.');
            return {
              isReceipt: false,
              rejectionReason: parsedJson.rejectionReason || 'The scanned image does not appear to be an official receipt, invoice, or voucher.',
              establishment: '',
              receiptDate: '',
              description: '',
              amount: 0,
              orNumber: '',
              lineItems: [],
              rawOcrText: candidateText
            };
          }

          const establishment = (parsedJson.establishment || '').trim();
          const amount = typeof parsedJson.amount === 'number' ? parsedJson.amount : parseFloat(parsedJson.amount) || 0;
          const orNumber = String(parsedJson.orNumber || '').trim();

          // Parse and normalize lineItems (if any)
          let lineItems = [];
          const rawItems = Array.isArray(parsedJson.lineItems)
            ? parsedJson.lineItems
            : Array.isArray(parsedJson.items)
              ? parsedJson.items
              : Array.isArray(parsedJson.articles)
                ? parsedJson.articles
                : [];

          lineItems = rawItems.map(it => {
            const qty = String(it.qty || it.quantity || '').trim();
            const unit = String(it.unit || '').trim();
            const name = String(it.name || it.item || it.description || it.article || '').trim();
            const unitPrice = typeof it.unitPrice === 'number'
              ? it.unitPrice
              : parseFloat(String(it.unitPrice || it.price || 0).replace(/[^0-9.]/g, '')) || 0;
            const amountVal = typeof it.amount === 'number'
              ? it.amount
              : parseFloat(String(it.amount || it.total || 0).replace(/[^0-9.]/g, '')) || 0;
            return { qty, unit, name, unitPrice, amount: amountVal };
          }).filter(it => it.name.length > 0 || it.amount > 0);

          // Sanity check: must have at least one meaningful receipt field
          const hasReceiptData = Boolean(
            (establishment && establishment.length >= 2) ||
            (amount > 0) ||
            (orNumber && orNumber.length >= 2)
          );

          if (!hasReceiptData) {
            if (onProgress) onProgress(1.0, 'Validation: No receipt details found.');
            return {
              isReceipt: false,
              rejectionReason: 'No readable receipt details (store name, amount, or receipt number) could be found in this image.',
              establishment: '',
              receiptDate: '',
              description: '',
              amount: 0,
              orNumber: '',
              lineItems: [],
              rawOcrText: candidateText
            };
          }

          if (onProgress) onProgress(0.95, 'Receipt scan complete!');
          return {
            isReceipt: true,
            rejectionReason: '',
            establishment,
            receiptDate: (parsedJson.receiptDate || '').trim(),
            description: (parsedJson.description || '').trim(),
            amount,
            orNumber,
            lineItems,
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
 * Runs receipt recognition on an image:
 * Uses Google Gemini Vision AI exclusively for high-accuracy handwritten & printed text recognition.
 * NEVER falls back to low-accuracy local OCR engines.
 */
export async function runOcrOnImage(imageSource, onProgress, receiptType = null) {
  try {
    if (onProgress) onProgress(0.1, 'Analyzing receipt image with Gemini Vision AI...');

    const geminiResult = await extractWithGeminiVision(imageSource, onProgress, receiptType);
    if (geminiResult) {
      if (geminiResult.isApiKeyError) {
        if (onProgress) onProgress(1.0, 'Gemini API authentication failed.');
        return geminiResult;
      }
      if (geminiResult.isReceipt === false) {
        if (onProgress) onProgress(1.0, 'Validation: ' + (geminiResult.rejectionReason || 'Image is not a receipt.'));
        return geminiResult;
      }
      if (geminiResult.isReceipt === true) {
        if (onProgress) onProgress(1.0, 'Receipt details verified with Gemini AI!');
        return geminiResult;
      }
    }

    return {
      isReceipt: false,
      rejectionReason: 'Gemini Vision AI was unable to parse this receipt. Please ensure your Gemini API key is valid and active, and upload a clear, well-lit photo.',
      establishment: '',
      receiptDate: '',
      description: '',
      amount: 0,
      orNumber: '',
      lineItems: [],
      rawOcrText: ''
    };
  } catch (err) {
    console.warn('Gemini OCR processing error:', err);
    return {
      isReceipt: false,
      rejectionReason: 'Receipt scanning failed: ' + (err.message || 'Unknown network error'),
      establishment: '',
      receiptDate: '',
      description: '',
      amount: 0,
      orNumber: '',
      lineItems: [],
      rawOcrText: ''
    };
  }
}
