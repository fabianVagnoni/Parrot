import { QuizResult, QuizStats } from '../utils/interfaces';

export const saveQuizResult = (word: string, language: string, isCorrect: boolean): void => {
  const result: QuizResult = {
    word,
    language,
    correct: isCorrect,
    timestamp: new Date().toISOString()
  };

  // Get existing stats from Chrome storage
  chrome.storage.local.get(['quizStats'], (data) => {
    let stats: QuizStats = data.quizStats || {
      totalAttempts: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      results: []
    };

    // Update stats
    stats.totalAttempts++;
    if (isCorrect) {
      stats.correctAnswers++;
    } else {
      stats.incorrectAnswers++;
    }
    stats.results.push(result);

    // Save updated stats
    chrome.storage.local.set({ quizStats: stats }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving quiz result:', chrome.runtime.lastError);
        throw new Error('Failed to save quiz result');
      }
    });
  });
};

export const getQuizStats = (): Promise<QuizStats> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['quizStats'], (data) => {
      resolve(data.quizStats || {
        totalAttempts: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        results: []
      });
    });
  });
};