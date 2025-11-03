
import { GoogleGenAI } from "@google/genai";
import { Payslip } from '../types';

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

export const generatePayslipSummary = async (payslip: Payslip): Promise<string> => {
    try {
        const prompt = `
        Genera un resumen amigable y fácil de entender para el siguiente recibo de pago.
        Explica de dónde viene el salario bruto, qué son las deducciones y cómo se llega al salario neto.

        Detalles del Recibo:
        - Empleado: ${payslip.employeeName}
        - Salario Bruto del Periodo: ${payslip.grossPay.toFixed(2)}
        - Total de Deducciones: ${payslip.deductions.toFixed(2)}
        - Salario Neto a Pagar: ${payslip.netPay.toFixed(2)}

        Sé conciso y claro.
        `;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.3,
          },
        });
        return response.text;
    } catch (error) {
        console.error("Error al generar resumen del recibo de pago:", error);
        return "No se pudo generar el resumen en este momento.";
    }
}
