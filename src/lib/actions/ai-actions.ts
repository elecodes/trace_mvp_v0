'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function analyzeAssetImage(base64Data: string, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY no está configurada.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Analyze this image of an asset/object. Return a JSON object with the following fields:
{
  "category": "TYPOGRAPHY" | "FURNITURE" | "PROPS" | "WARDROBE" | "EQUIPMENT" | "GENERIC",
  "description": "A short, professional description of the asset (in Spanish, max 150 characters)",
  "material": "Estimated primary material (e.g. Madera, Metal, Plástico, Vidrio, Textil, Papel/Cartón, Cerámica)",
  "weightKg": number | null
}
Ensure the category matches one of the specified enum values. Do not write markdown tags, return only the raw JSON.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const text = result.response.text();
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error al analizar la imagen con Gemini:', error);
    return null;
  }
}
