import { useState, useEffect } from 'react';
import { LanguageDropdown } from './components/languageDropdown';
import { AutoLaunchToggle } from './components/autoLaunchToggle';
import { generateSMUQuiz } from './services/SMUgetQuiz';
import { selectWord } from './services/getWord';
import { createPopupWindow } from './components/createPopUp';
import { getText } from './utils/getText';
import { saveQuizResult, getQuizStats } from './services/saveQuizResults';
import { QuizStats, determineQuizMode } from './services/showQuizStats';
import { generateSMUPractice } from './services/SMUgetPractice';
import { QuizModeToggle } from './components/QuizModeToggleSMU';
import { ThresholdSlider } from './components/ThresholdSlider';
import './App.css';

type Mode = 'parrot' | 'owl';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('Select Language');
  const [manualTestMode, setManualTestMode] = useState(false);
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>('parrot');
  const [isResetting, setIsResetting] = useState(false);
  const [statsVersion, setStatsVersion] = useState(0); // Add a version counter for stats
  const [wordThreshold, setWordThreshold] = useState(30); // Default to 30 (300 words)
  const [settingsExpanded, setSettingsExpanded] = useState(false); // Always closed by default

  // Load saved preferences when component mounts
  useEffect(() => {
    chrome.storage.local.get(['selectedLanguage', 'autoLaunchEnabled', 'currentMode', 'wordThreshold'], (result) => {
      if (result.selectedLanguage) {
        setSelectedLanguage(result.selectedLanguage);
      }
      if (result.autoLaunchEnabled !== undefined) {
        setAutoLaunchEnabled(result.autoLaunchEnabled);
      }
      if (result.currentMode) {
        setCurrentMode(result.currentMode as Mode);
      }
      if (result.wordThreshold !== undefined) {
        setWordThreshold(result.wordThreshold);
      }
      // We don't load settingsExpanded from storage to ensure it's always closed on startup
    });
  }, []);

  // Set up a listener for changes to quizStats in Chrome storage
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes.quizStats) {
        // Increment the stats version to trigger a re-render of the QuizStats component
        setStatsVersion(prev => prev + 1);
      }
    };

    // Add the listener
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Clean up the listener when the component unmounts
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleModeChange = (mode: Mode) => {
    setCurrentMode(mode);
    chrome.storage.local.set({ currentMode: mode });
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    chrome.storage.local.set({ selectedLanguage: language });
  };

  const handleAutoLaunchToggle = (enabled: boolean) => {
    setAutoLaunchEnabled(enabled);
    chrome.storage.local.set({ autoLaunchEnabled: enabled });
  };

  const handleThresholdChange = (value: number) => {
    setWordThreshold(value);
    chrome.storage.local.set({ wordThreshold: value });
    
    // Calculate the actual word count threshold
    const actualThreshold = Math.round((1000 * value) / 100);
    console.log(`Word threshold set to ${value} (${actualThreshold} words)`);
    
    // Update active tabs with the new threshold if auto-launch is enabled
    if (autoLaunchEnabled) {
      chrome.tabs.query({ active: true }, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'UPDATE_WORD_THRESHOLD',
              wordThreshold: actualThreshold
            }).catch(() => {
              // Ignore errors - tab might not have content script
            });
          }
        });
      });
    }
  };

  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all your data? This will clear all your scores and statistics.')) {
      setIsResetting(true);
      
      // Clear all data in chrome.storage
      chrome.storage.local.clear(() => {
        // Reset local state
        setSelectedLanguage('Select Language');
        setManualTestMode(false);
        setAutoLaunchEnabled(false);
        setWordThreshold(30); // Reset to default
        
        // Keep the current mode for UI consistency
        chrome.storage.local.set({ 
          currentMode,
          wordThreshold: 30 // Save the default threshold
        }, () => {
          // Increment stats version to force a refresh
          setStatsVersion(prev => prev + 1);
          
          setTimeout(() => {
            setIsResetting(false);
            alert('All data has been reset successfully!');
          }, 500);
        });
      });
    }
  };

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
      
      // Save the quiz result - this will trigger the storage change listener
      await saveQuizResult(
        selectedWord,
        selectedLanguage,
        result === 1
      );
      
      // Force a refresh of the stats component
      setStatsVersion(prev => prev + 1);
    } catch (error) {
      console.error("Error in generateTaskQuiz:", error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  // Add a function to toggle settings visibility
  const toggleSettings = () => {
    setSettingsExpanded(!settingsExpanded);
    // We don't save to storage so it always starts closed
  };

  return (
    <div className={`container theme-${currentMode}`}>
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${currentMode === 'parrot' ? 'active' : ''}`}
          onClick={() => handleModeChange('parrot')}
        >
          🦜 Parrot
        </button>
        <button 
          className={`tab-button ${currentMode === 'owl' ? 'active' : ''}`}
          onClick={() => handleModeChange('owl')}
        >
          🦉 Owl
        </button>
      </nav>

      <div className="header">
        <h1 className="title">
          {currentMode === 'parrot' ? '🦜 Parrot' : '🦉 Owl'}
        </h1>
        <p className="subtitle">
          {currentMode === 'parrot' 
            ? 'Your Language Learning Assistant'
            : 'Your Contextual Comprehension Tutor'}
        </p>
      </div>

      <div className="card">
        <div className="section">
          <h2 className="section-title">Current Level: Start-Me-Up</h2>
          <div className="section-content">
            {/* Pass the statsVersion as a key to force re-render when stats change */}
            <QuizStats key={statsVersion} />
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">⚙️ Settings</h2>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button 
              className="settings-toggle" 
              onClick={toggleSettings}
            >
              <span>{settingsExpanded ? 'Hide Settings' : 'Show Settings'}</span>
              <span className={`settings-toggle-icon ${settingsExpanded ? 'expanded' : ''}`}>
                {settingsExpanded ? '▲' : '▼'}
              </span>
            </button>
          </div>
          <div className="section-content" style={{ 
            maxHeight: settingsExpanded ? '1000px' : '0',
            opacity: settingsExpanded ? 1 : 0,
            transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out'
          }}>
            <div className="setting-item">
              <QuizModeToggle
                enabled={manualTestMode}
                onToggle={setManualTestMode}
              />
            </div>
            <div className="setting-item">
              <AutoLaunchToggle
                enabled={autoLaunchEnabled}
                onToggle={handleAutoLaunchToggle}
              />
            </div>
            <ThresholdSlider
              value={wordThreshold}
              onChange={handleThresholdChange}
            />
            <div className="setting-item">
              <LanguageDropdown
                selectedLanguage={selectedLanguage}
                onLanguageSelect={handleLanguageChange}
              />
            </div>
          </div>
        </div>
        
        <div className="launch-section">
          <p className="launch-text">
            {currentMode === 'parrot' 
              ? 'Ready for more learning?'
              : 'Ready to improve your comprehension?'}
          </p>
          <button onClick={generateTaskQuiz} className="launch-button">
            <span className="button-icon">
              {currentMode === 'parrot' ? '🎯' : '📚'}
            </span>
            {currentMode === 'parrot' ? 'Launch Task' : 'Start Reading'}
          </button>
        </div>
        
        <div className="reset-container">
          <button 
            className="reset-button" 
            onClick={resetAllData}
            disabled={isResetting}
          >
            {isResetting ? 'Resetting...' : '🗑️ Reset All Data'}
          </button>
          <p className="reset-description">This will clear all your scores and statistics</p>
        </div>
      </div>
    </div>
  );
}

export default App;