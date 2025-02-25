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
      <div className="header">
        <h1 className="title">🦜 Parrot</h1>
        <p className="subtitle">Your Language Learning Assistant</p>
      </div>
      <div className="card">
        <div className="section">
          <h2 className="section-title">📊 Quiz Statistics</h2>
          <div className="section-content">
            <QuizStats />
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">⚙️ Quiz Settings</h2>
          <div className="section-content">
            <div className="setting-item">
              <QuizModeToggle
                enabled={manualTestMode}
                onToggle={setManualTestMode}
              />
            </div>
            <div className="setting-item">
              <LanguageDropdown
                selectedLanguage={selectedLanguage}
                onLanguageSelect={setSelectedLanguage}
              />
            </div>
          </div>
        </div>
        
        <div className="launch-section">
          <p className="launch-text">Ready for more learnings?</p>
          <button onClick={generateTaskQuiz} className="launch-button">
            <span className="button-icon">🎯</span>
            Launch Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default App; 