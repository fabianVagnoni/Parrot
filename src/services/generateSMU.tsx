import { getText } from '../utils/getText';
import { selectWord } from './getWord';
import { generateSMUQuiz } from './SMUgetQuiz';
import { generateSMUPractice } from './SMUgetPractice';
import { getQuizStats } from './saveQuizResults';
import { determineQuizMode } from './showQuizStats';
import { createPopupWindow } from '../components/createPopUp';
import { saveQuizResult } from './saveQuizResults';

export const generateTaskQuiz = async (
  selectedLanguage: string,
  manualTestMode: boolean = false
): Promise<void> => {
  if (selectedLanguage === 'Select Language') {
    throw new Error('Please select a language first');
  }
  console.log('Selected language in quiz:', selectedLanguage);

  try {
    const visibleText = await getText();
    const selectedWord = await selectWord(visibleText);
    console.log('Selected word:', selectedWord);
    
    // Get current quiz mode based on stats
    const stats = await getQuizStats();
    const quizMode = determineQuizMode(stats);
    console.log('Quiz mode:', quizMode);
    
    // Generate quiz based on mode or manual override
    const isTestMode = manualTestMode || quizMode === 'SMU_Test';
    console.log('Quiz mode:', isTestMode ? 'Test' : 'Practice');
    const quiz = isTestMode
      ? await generateSMUQuiz(selectedWord, selectedLanguage)
      : await generateSMUPractice(selectedWord, selectedLanguage);
    console.log('Quiz:', quiz);

    const result = await createPopupWindow(selectedWord, quiz, isTestMode);
    await saveQuizResult(
      selectedWord,
      selectedLanguage,
      result === 1
    );
  } catch (error) {
    console.error("Error in generateTaskQuiz:", error);
    throw error;
  }
};