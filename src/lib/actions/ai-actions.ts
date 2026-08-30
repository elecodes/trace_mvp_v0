'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT_TEMPLATE = `Analyze the provided information (image and/or webpage text content). 
Return a JSON object containing information to populate an asset catalog and its rights/license records.
JSON structure:
{
  "category": "TYPOGRAPHY" | "FURNITURE" | "PROPS" | "WARDROBE" | "EQUIPMENT" | "GENERIC",
  "description": "A short, professional description of the asset (in Spanish, max 150 characters)",
  "material": "Estimated primary material (e.g. Madera, Metal, Plástico, Vidrio, Textil, Papel/Cartón, Cerámica)",
  "weightKg": number | null,
  "rightsRecord": {
    "licenseType": "ORIGINAL" | "STOCK_LICENSED" | "AI_GENERATED" | "PUBLIC_DOMAIN" | "UNKNOWN",
    "sourceName": "Name of photographer/author and platform (e.g. 'John Doe en Unsplash')",
    "licenseDocUrl": "Document URL or license URL (e.g. 'https://unsplash.com/es/licencia')",
    "notes": "Additional metadata like camera, lens, date published, and location (in Spanish, max 200 characters)"
  }
}

Exemplary rules for metadata extraction:
- CRITICAL: If the URL or webpage content is from Unsplash (unsplash.com), you MUST set "licenseType" to "STOCK_LICENSED" and "licenseDocUrl" to "https://unsplash.com/es/licencia". Do NOT return "UNKNOWN" or "N/A" for these.
- Extract photographer's name and platform for "sourceName" (e.g. 'John Doe en Unsplash'). If not found but the site is Unsplash, set to 'Unsplash'.
- Gather camera info (e.g. Canon EOS R5), publication date, and location to put into rightsRecord "notes".

Ensure the category and licenseType match one of the specified enum values. Return only raw JSON.`;

export async function analyzeAssetImage(base64Data: string, mimeType: string, textContext?: string, originUrl?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY no está configurada.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const promptParts: any[] = [];
    if (base64Data) {
      promptParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      });
    }

    let fullPrompt = PROMPT_TEMPLATE;
    if (originUrl) {
      fullPrompt = `${fullPrompt}\n\nOrigin URL: ${originUrl}`;
    }
    if (textContext) {
      fullPrompt = `${fullPrompt}\n\nWebpage text context:\n${textContext}`;
    }

    promptParts.push(fullPrompt);

    const result = await model.generateContent(promptParts);
    const text = result.response.text();
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error al analizar la imagen con Gemini:', error);
    return null;
  }
}

export async function analyzeAssetImageUrl(url: string) {
  try {
    console.log('Gemini analyzing URL:', url);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    };

    let fetchUrl = url;
    const isUnsplashPage = url.includes('unsplash.com') && !url.includes('images.unsplash.com');
    if (isUnsplashPage) {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      const id = lastPart.includes('-') ? lastPart.split('-').pop() : lastPart;
      if (id) {
        fetchUrl = `https://unsplash.com/photos/${id}/download`;
        console.log(`[Unsplash Bot Bypass] Rewrote target URL to download path: ${fetchUrl}`);
      }
    }

    const res = await fetch(fetchUrl, { headers });
    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);

    const contentType = res.headers.get('content-type') || '';
    let base64Data = '';
    let mimeType = 'image/jpeg';
    let cleanHtmlText = '';

    if (contentType.includes('text/html')) {
      const html = await res.text();
      const ogImageRegex = /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i;
      const ogImageMatch = html.match(ogImageRegex);
      
      cleanHtmlText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000);
      
      if (ogImageMatch && ogImageMatch[1]) {
        const directImageUrl = ogImageMatch[1];
        try {
          const imgRes = await fetch(directImageUrl);
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            base64Data = buffer.toString('base64');
            mimeType = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
          }
        } catch (e) {
          console.error('Failed to fetch og:image in url analyzer:', e);
        }
      }
    } else {
      const buffer = Buffer.from(await res.arrayBuffer());
      base64Data = buffer.toString('base64');
      mimeType = contentType.split(';')[0].trim();
    }

    return await analyzeAssetImage(base64Data, mimeType, cleanHtmlText, url);
  } catch (error) {
    console.error('Error al analizar URL de imagen con Gemini:', error);
    return null;
  }
}
