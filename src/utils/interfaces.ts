export interface SMUQuizResult {
    word: string;
    language: string;
    correct: boolean;
    timestamp: string;
  }
  
export interface SMUQuizStats {
    totalAttempts: number;
    correctAnswers: number;
    incorrectAnswers: number;
    results: SMUQuizResult[];
  }

export interface SMUPractice {
    translatedWord: string;
    originalWordDef: string;
    exampleOriginal: string;
    exampleTraslated: string;
  }
