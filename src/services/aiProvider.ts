/**
 * Future scalable AI Architecture
 * 
 * Rules:
 * - DO NOT ADD GOOGLE_API_KEY OR GEMINI_API_KEY in the frontend.
 * - This file acts as a bridge for future backend integration.
 * - When ready, replace the mock logic with an API call to a Supabase Edge Function or custom backend.
 */
import { generateAIResponse as generateLocalResponse, AIResponse } from '../utils/aiAssistant';

export type AIMode = 'local' | 'cloud_function';

interface AIProviderOptions {
  mode: AIMode;
}

export const aiProvider = {
  mode: 'local' as AIMode,

  setMode(mode: AIMode) {
    this.mode = mode;
  },

  async ask(query: string, state: any): Promise<AIResponse> {
    if (this.mode === 'local') {
      // Use existing rule-based engine
      return generateLocalResponse(query, state);
    } else {
      // Future: Call Supabase Edge Function
      // const response = await supabase.functions.invoke('assistant', { body: { query, state }});
      // return response.data;
      throw new Error("Cloud function AI provider not yet implemented. Use 'local' mode for now.");
    }
  }
};
