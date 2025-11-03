
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("La variable de entorno API_KEY no está configurada.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateJobDescription = async (positionTitle: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Genera una descripción de puesto profesional y detallada para el cargo de "${positionTitle}". Incluye responsabilidades clave, cualificaciones requeridas y habilidades deseadas. Formatea la respuesta en Markdown.`,
      config: {
        temperature: 0.5,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error al generar descripción del puesto:", error);
    return "No se pudo generar la descripción en este momento.";
  }
};
