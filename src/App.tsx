//import React from 'react';  useEffect 
import { useState} from 'react';
import { LanguageDropdown } from './components/languageDropdown';
// import { AutoLaunchToggle } from './components/autoLaunchToggle';
// import { useAutoLaunch } from './components/useAutoLaunch';
import { generateSMUQuiz } from './services/SMUgetQuiz';
import { selectWord } from './services/getWord';
import { createPopupWindow } from './components/createPopUp';
import { getText } from './utils/getText';
import { saveQuizResult, getQuizStats } from './services/saveQuizResults';
import { QuizStats, determineQuizMode } from './services/showQuizStats';
import { generateSMUPractice } from './services/SMUgetPractice';
import { QuizModeToggle } from './components/QuizModeToggleSMU';
import './App.css';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('Select Language');
  // const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(false);
  const [manualTestMode, setManualTestMode] = useState(false);

  // const highlightWord = (text: string, word: string): string => {
  //   return text.replace(
  //     new RegExp(`(${word})`, 'gi'),
  //     '<span style="background-color: yellow;">$1</span>'
  //   );
  // };


  const generateTaskQuiz = async () => {
    if (selectedLanguage === 'Select Language') {
      alert('Please select a language first');
      return;
    }
  
    try {
      const visibleText = await getText();
      const selectedWord = await selectWord(visibleText);
      
      // Get current quiz mode based on stats
      const stats = await getQuizStats();
      const quizMode = determineQuizMode(stats);
      
      // Generate quiz based on mode or manual override
      const isTestMode = manualTestMode || quizMode === 'SMU_Test';
      console.log('Quiz mode:', isTestMode ? 'Test' : 'Practice');
      const quiz = isTestMode
        ? await generateSMUQuiz(selectedWord, selectedLanguage)
        : await generateSMUPractice(selectedWord, selectedLanguage);
      console.log('Quiz:', quiz);
  
      const result = await createPopupWindow(selectedWord, quiz, isTestMode);
      saveQuizResult(
        selectedWord,
        selectedLanguage,
        result === 1
      );
    } catch (error) {
      console.error("Error in generateTaskQuiz:", error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  // useAutoLaunch(autoLaunchEnabled, generateTaskQuiz);

  // useEffect(() => {
  //   console.log('Auto Launch state changed:', autoLaunchEnabled);
  // }, [autoLaunchEnabled]);

  return (
    <div className="container">
      <h1>Parrot</h1>
      <div className="card">
        <h2>Quiz Stats</h2>
        <QuizStats />
        <h2>Quiz Settings</h2>
        <QuizModeToggle
          enabled={manualTestMode}
          onToggle={setManualTestMode}
        />
        {/* <AutoLaunchToggle 
          enabled={autoLaunchEnabled}
          onToggle={setAutoLaunchEnabled}
        /> */}
        <LanguageDropdown
          selectedLanguage={selectedLanguage}
          onLanguageSelect={setSelectedLanguage}
        />
        <p>Click below to launch task</p>
        <button onClick={generateTaskQuiz} className="button">
          Launch Task
        </button>
      </div>
    </div>
  );
}

export default App; 