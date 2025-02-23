export interface QuizResult {
    word: string;
    language: string;
    correct: boolean;
    timestamp: string;
  }
  
  export interface QuizStats {
    totalAttempts: number;
    correctAnswers: number;
    incorrectAnswers: number;
    results: QuizResult[];
  }