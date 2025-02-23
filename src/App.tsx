//import React from 'react';
import { useState, useEffect } from 'react';
import { LanguageDropdown } from './components/languageDropdown';
import { AutoLaunchToggle } from './components/autoLaunchToggle';
import { useAutoLaunch } from './components/useAutoLaunch';
import { generateSummary } from './services/getQuiz';
//import { getVisibleText } from './utils/viewportScanner';
import { selectWord } from './services/getWord';
import { createPopupWindow } from './components/createPopUp';
import { getText } from './utils/getText';
import { saveQuizResult } from './services/saveQuizResults';
import { QuizStats } from './services/showQuizStats';
import './App.css';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('Select Language');
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(false);

  //console.log('App loaded');

  // const highlightWord = (text: string, word: string): string => {
  //   return text.replace(
  //     new RegExp(`(${word})`, 'gi'),
  //     '<span style="background-color: yellow;">$1</span>'
  //   );
  // };

  //console.log('Text Highlighted');

  //console.log('Text Retrieved');

  const generateTaskQuiz = async () => {
    if (selectedLanguage === 'Select Language') {
      alert('Please select a language first');
      return;
    }
  
    try {
      //console.log('Starting task quiz generation...');
      const visibleText = await getText();
      //console.log('Retrieved text:', visibleText);
  
      const selectedWord = await selectWord(visibleText);
      //console.log('Selected word:', selectedWord);
  
      //const highlighted = highlightWord(visibleText, selectedWord);
      //console.log('Text highlighted');
      
      const quiz = await generateSummary(selectedWord, selectedLanguage);
      // console.log('Quiz generated:', quiz);
  
      const result = await createPopupWindow(selectedWord, quiz);
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

  useAutoLaunch(autoLaunchEnabled, generateTaskQuiz);

  useEffect(() => {
    console.log('Auto Launch state changed:', autoLaunchEnabled);
  }, [autoLaunchEnabled]);

  return (
    <div className="container">
      <h1>Parrot</h1>
      <div className="card">
        <h2>Quiz Stats</h2>
        <QuizStats />
        <h2>Launch Task</h2>
        <AutoLaunchToggle 
          enabled={autoLaunchEnabled}
          onToggle={setAutoLaunchEnabled}
        />
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