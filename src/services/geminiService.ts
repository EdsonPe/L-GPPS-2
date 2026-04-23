import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TriageResult {
  organ: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  legal_context: string;
  suggested_actions: string[];
}

export class GeminiTriageService {
  /**
   * Analysis and triage of civic evidence
   */
  static async analyzeEvent(description: string, type: string): Promise<TriageResult> {
    try {
      const prompt = `
        Aja como um Arquiteto de Infraestrutura Cívica.
        Analise o seguinte registro de problema urbano:
        Tipo: ${type}
        Descrição: ${description}

        Forneça uma triagem estruturada em JSON contendo:
        - organ: Qual órgão público é responsável (ex: Secretaria de Obras, Polícia Militar, etc)
        - priority: Nível de urgência (low, medium, high, critical)
        - legal_context: Resumo breve do RAG jurídico (baseado em códigos civis/urbanos brasileiros)
        - suggested_actions: Lista de 3 ações imediatas sugeridas.

        Retorne APENAS o JSON.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      return {
        organ: result.organ || 'Secretaria Geral',
        priority: result.priority || 'medium',
        legal_context: result.legal_context || 'Análise jurídica pendente.',
        suggested_actions: result.suggested_actions || []
      };
    } catch (error) {
      console.error('Gemini Triagem Error:', error);
      return {
        organ: 'Triagem Automática (Falha)',
        priority: 'medium',
        legal_context: 'Erro na conexão com L3 Intelligence.',
        suggested_actions: ['Reavaliar manualmente', 'Confirmar evidência']
      };
    }
  }
}
