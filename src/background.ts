import { generateTaskQuiz } from './services/generateSMU';

// Map to track active quiz windows and their associated tabs
const activeQuizWindows = new Map<number, { tabId: number, triggerNumber: number, startTime: number }>();

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('%c[Background] Message received:', 'color: #2196F3', message);

  if (message.type === 'RUN_QUIZ') {
    console.log('%c[Background] Running quiz for language:', 'color: #2196F3', message.language);
    
    // Validate that we have a tab ID
    if (!sender.tab?.id) {
      console.error('%c[Background] Error: No valid tab ID found in sender', 'color: #D32F2F');
      sendResponse({ 
        success: false, 
        error: 'No valid tab ID found. Please try again.' 
      });
      return true;
    }

    const tabId = sender.tab.id; // Store the tab ID to ensure it's defined

    try {
      // Generate and show the quiz
      generateTaskQuiz(message.language, message.manualTestMode)
        .then(() => {
          // Since generateTaskQuiz doesn't return the window, we need to track it differently
          // We'll use the most recently created window as a workaround
          chrome.windows.getAll((windows) => {
            // Find the most recently created window (likely our quiz window)
            const latestWindow = windows[windows.length - 1];
            
            if (latestWindow && typeof latestWindow.id === 'number') {
              const windowId = latestWindow.id; // Store the window ID to ensure it's defined
              console.log('%c[Background] Assuming quiz window ID:', 'color: #2196F3', windowId);
              
              // Store information about this quiz window
              activeQuizWindows.set(windowId, {
                tabId: tabId,
                triggerNumber: message.triggerNumber || 0,
                startTime: Date.now()
              });
              
              sendResponse({ success: true, windowId: windowId });
              
              // Set a timeout to handle cases where the window doesn't close properly
              setTimeout(() => {
                if (activeQuizWindows.has(windowId)) {
                  console.log('%c[Background] Quiz timeout reached for window:', 'color: #FF9800', windowId);
                  
                  // Get the tab ID associated with this quiz window
                  const quizInfo = activeQuizWindows.get(windowId);
                  if (quizInfo) {
                    // Send a message to the content script to reset
                    chrome.tabs.sendMessage(quizInfo.tabId, {
                      type: 'QUIZ_COMPLETED',
                      triggerNumber: quizInfo.triggerNumber,
                      error: 'Quiz timed out',
                      duration: Date.now() - quizInfo.startTime
                    });
                    
                    // Clean up
                    activeQuizWindows.delete(windowId);
                  }
                }
              }, 300000); // 5 minute timeout
            } else {
              console.error('%c[Background] Failed to identify quiz window', 'color: #D32F2F');
              sendResponse({ 
                success: false, 
                error: 'Failed to identify quiz window' 
              });
            }
          });
        })
        .catch(error => {
          console.error('%c[Background] Error generating quiz:', 'color: #D32F2F', error);
          sendResponse({ 
            success: false, 
            error: error.message || 'Unknown error generating quiz' 
          });
        });
    } catch (error) {
      console.error('%c[Background] Synchronous error in quiz generation:', 'color: #D32F2F', error);
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    return true;
  } else if (message.type === 'CHECK_WORD_COUNTER_STATUS') {
    // Check if there's an active quiz for this tab
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ shouldCount: true });
      return true;
    }
    
    // Check if this tab has an active quiz
    const hasActiveQuiz = Array.from(activeQuizWindows.values()).some(info => info.tabId === tabId);
    
    // If there's an active quiz, the content script should not count
    sendResponse({ shouldCount: !hasActiveQuiz });
    return true;
  }
});

// Listen for window removal to detect when a quiz is closed
chrome.windows.onRemoved.addListener((windowId) => {
  console.log('%c[Background] Window closed:', 'color: #2196F3', windowId);
  
  // Check if this was a quiz window
  if (activeQuizWindows.has(windowId)) {
    const quizInfo = activeQuizWindows.get(windowId);
    console.log('%c[Background] Quiz window closed:', 'color: #2196F3', windowId);
    
    if (quizInfo) {
      // Calculate duration
      const duration = Date.now() - quizInfo.startTime;
      
      // Notify the content script that the quiz is completed
      chrome.tabs.sendMessage(quizInfo.tabId, {
        type: 'QUIZ_COMPLETED',
        triggerNumber: quizInfo.triggerNumber,
        duration: duration
      }).catch(error => {
        console.error('%c[Background] Error sending completion message:', 'color: #D32F2F', error);
      });
      
      console.log('%c[Background] Sent quiz completion message to tab:', 'color: #2196F3', quizInfo.tabId);
    }
    
    // Remove from tracking
    activeQuizWindows.delete(windowId);
  }
});

// Listen for tab removal to clean up any associated quiz windows
chrome.tabs.onRemoved.addListener((_tabId: number, _removeInfo: chrome.tabs.TabRemoveInfo) => {
  console.log('%c[Background] Tab closed:', 'color: #2196F3', _tabId);
  
  // Check if this tab had any active quizzes
  for (const [windowId, quizInfo] of activeQuizWindows.entries()) {
    if (quizInfo.tabId === _tabId) {
      console.log('%c[Background] Cleaning up quiz window for closed tab:', 'color: #2196F3', windowId);
      
      // Try to close the quiz window
      chrome.windows.remove(windowId).catch(error => {
        console.error('%c[Background] Error closing quiz window:', 'color: #D32F2F', error);
      });
      
      // Remove from tracking
      activeQuizWindows.delete(windowId);
    }
  }
});

// Tab update listener - inject content script on Wikipedia pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('wikipedia.org')) {
    console.log(`%c[Background] Wikipedia page loaded: ${tab.url}`, 'color: #673AB7');
    
    chrome.storage.local.get(['autoLaunchEnabled', 'selectedLanguage', 'wordThreshold'], (result) => {
      if (result.autoLaunchEnabled && result.selectedLanguage) {
        console.log(`%c[Background] Auto-launch enabled for language: ${result.selectedLanguage}`, 'color: #673AB7');
        
        // Calculate the actual word threshold based on the slider value
        const sliderValue = result.wordThreshold || 30; // Default to 30 (300 words)
        const actualThreshold = Math.round((1000 * sliderValue) / 100);
        
        console.log(`%c[Background] Word threshold set to: ${actualThreshold} words (slider value: ${sliderValue})`, 'color: #673AB7');
        
        // Inject the content script that will monitor word count
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['wordCounter.js']
        }).then(() => {
          console.log('%c[Background] Word counter script injected successfully', 'color: #673AB7');
          
          // Pass the language to the content script
          chrome.tabs.sendMessage(tabId, {
            type: 'INIT_WORD_COUNTER',
            language: result.selectedLanguage,
            wordThreshold: actualThreshold
          }).then(() => {
            console.log('%c[Background] Word counter initialized with settings', 'color: #673AB7');
            console.log('%c-------- WORD COUNTING STARTED --------', 'color: #673AB7; background-color: #EDE7F6; font-weight: bold; padding: 3px; border-radius: 3px;');
          }).catch(err => {
            console.error('%c[Background] Error initializing word counter:', 'color: #D32F2F', err);
          });
        }).catch(err => {
          console.error('%c[Background] Error injecting word counter script:', 'color: #D32F2F', err);
        });
      } else {
        console.log('%c[Background] Auto-launch disabled or language not selected', 'color: #9E9E9E');
      }
    });
  }
});