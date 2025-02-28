import { generateTaskQuiz } from './services/generateSMU';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RUN_QUIZ') {
    generateTaskQuiz(message.language, message.manualTestMode)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

// Tab update listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('wikipedia.org')) {
    chrome.storage.local.get(['autoLaunchEnabled', 'selectedLanguage'], (result) => {
      if (result.autoLaunchEnabled && result.selectedLanguage) {
        // Inject a content script instead of trying to run generateTaskQuiz directly
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (language) => {
            chrome.runtime.sendMessage({
              type: 'RUN_QUIZ',
              language: language,
              manualTestMode: false
            });
          },
          args: [result.selectedLanguage]
        });
      }
    });
  }
});