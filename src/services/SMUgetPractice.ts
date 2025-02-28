// src/services/openai.ts
import OpenAI from "openai";
import { CONFIG } from "../config/constants";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true
});


const buildPrompt = (selectedWord: string, selectedLanguage: string): string => {
    return "You will make a translation of the following concept.\
    Generate these 4 things based on this concept:" + selectedWord + ". Only output the following 4 things, please. NO additional text. \
    Display in json format and let the first letter always be capitalized.\
    You must return the following JSON object and ¡¡¡NOTHING ELSE!!!:\n\{\
        'originalWord': '" + selectedWord + "' UNCHANGED,\
        'translatedWord': 'Translate the word to " + selectedLanguage + "',\
        'translatedWordPronunciation': 'After translating the word to " + selectedLanguage + ", write how that translation sounds using the writing system of the ORIGINAL language (the language of " + selectedWord + "). For example, if the original word is in English \"children\" and we translate it to Spanish \"niños\", write how \"niños\" sounds using English writing system, like \"neen-yos\"',\
        'originalWordDef': 'Define '" + selectedWord + "' in its ORIGINAL language (the same language as the input word)',\
        'exampleOriginal': 'Write an example sentence using '" + selectedWord + "' in its ORIGINAL language (the same language as the input word)',\
        'exampleTraslated': 'Translate the example sentence to " + selectedLanguage + "',\
        'exampleTranslatedPronunciation': 'Write how the " + selectedLanguage + " translation sounds using the writing system of the ORIGINAL language (the language of " + selectedWord + "). Use only letters and writing conventions from the original language'\
      }\
    Please, ensure that your output CAN BE PARSED by the following TypeScript interface:\n\
    interface QuizOptions {\
      originalWord: string;\
      translatedWord: string;\
      translatedWordPronunciation: string;\
      originalWordDef: string;\
      exampleOriginal: string;\
      exampleTraslated: string;\
      exampleTranslatedPronunciation: string;\
    }\
    That is, be careful that your output ¡¡¡DOES NOT CAUSE THE FOLLOWING ERROR!!!:\
    Unexpected token '`', ```json\
    That is: do NOT return ANYTHING ELSE than the JSON OBJECT, NO INTRODUCTION, NO TEXT, NOTHING.\
    If you do not follow these instructions, you will be penalized.\
    ";
}

export const generateSMUPractice = async (context: string, selectedLanguage: string): Promise<string> => {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful language professor.' },
          { 
            role: 'user', 
            content: buildPrompt(context, selectedLanguage)
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