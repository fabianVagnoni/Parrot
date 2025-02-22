// src/services/openai.ts
import OpenAI from "openai";
import { CONFIG } from "../config/constants";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true
});

const buildSearchPrompt = (context: string): string => {
  return "You are an educational tool to help people learn a new language.\
          You will be provided with a sentence or a body of text and you to identify and select an ideal word to learn in a new language.\
          Your output can ONLY be the single word you selected and no other text.\
          Be sure Capitalize the first letter of your output word. Here's the text: \n)" + context + "\n";
}

export const selectWord = async (context: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful language professor.' },
        { 
          role: 'user', 
          content: buildSearchPrompt(context)
        }
      ],
      temperature: CONFIG.TEMPERATURE,
      max_tokens: CONFIG.MAX_TOKENS,
    });
    return completion.choices[0].message.content || 'No summary generated';
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to generate summary');
  }
};