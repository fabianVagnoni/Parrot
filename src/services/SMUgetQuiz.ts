// src/services/openai.ts
import OpenAI from "openai";
import { CONFIG } from "../config/constants";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true
});


const buildPrompt = (selectedWord: string, selectedLanguage: string): string => {
    return "You will make a multiple choice quiz where the user is going to select the correct word.\
    the quiz question will be 'How do you say this <x> word in " + selectedLanguage +  "?'\
    Generate the 4 options based on this concept:" + selectedWord + ". Only output the 4 options in " + selectedLanguage +  " please and a 5th json element with the correcrt answer. no additional text. \
    Display in json format and let the first letter always be capitalized. Let the keys be\
    option1, option2, option3, option4, correct. Be sure that the correct answer is always one of the 4 options (chosen word translated in " + selectedLanguage +  "). No answers text should have accent/special characters.\n\
    You must return the following JSON object and NOTHING ELSE:\n\{\
        'option1': 'yourSelectedOption1',\
        'option2': 'yourSelectedOption2',\
        'option3': 'yourSelectedOption3',\
        'option4': 'yourSelectedOption4',\
        'correct': 'correctOptionAmongThePreviousOptions'\
      }\
    Please, ensure that your output CAN BE PARSED by the following TypeScript interface:\n\
    interface QuizOptions {\
      option1: string;\
      option2: string;\
      option3: string;\
      option4: string;\
      correct: string;\
    }\
    quizOptions = JSON.parse(quizJson);\
    That is, be careful that your output DOES NOT CAUSE THE FOLLOWING ERROR:\
    Unexpected token '`', ```json\
    ";
}

export const generateSMUQuiz = async (context: string, selectedLanguage: string): Promise<string> => {
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