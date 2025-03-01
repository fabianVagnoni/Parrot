// Word counter content script
(() => {
  let wordThreshold = 300;
  let language = '';
  let wordCount = 0;
  let cumulativeWordCount = 0;
  let lastTriggerCount = 0;
  let hasTriggeredQuiz = false;
  let observer = null;
  let lastLoggedCount = 0;
  let startTime = null;
  let previousVisibleText = '';
  let sessionQuizCount = 0;
  let lastLogTime = 0;
  let errorCount = 0;
  let isActive = true;
  let statusCheckInterval = null;

  // Initialize the word counter with settings from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INIT_WORD_COUNTER') {
      wordThreshold = message.wordThreshold || 300;
      language = message.language;
      
      // Log initialization
      console.log(`%c[Word Counter] Initialized with threshold: ${wordThreshold} words, language: ${language}`, 'color: #4CAF50; font-weight: bold');
      startTime = new Date();
      
      // Start monitoring scroll events
      startMonitoring();
      sendResponse({ success: true });
    } else if (message.type === 'QUIZ_COMPLETED') {
      // Reset the trigger flag when quiz is completed
      console.log(`%c[Word Counter] Quiz #${message.triggerNumber || sessionQuizCount} completed! Resetting trigger state`, 'color: #2196F3; font-weight: bold');
      
      // Check if there was an error
      if (message.error) {
        console.error(`%c[Word Counter] Quiz had an error: ${message.error}`, 'color: #D32F2F');
        errorCount++;
        
        // If we've had multiple errors, increase the threshold temporarily to avoid getting stuck
        if (errorCount > 2) {
          console.log(`%c[Word Counter] Multiple errors detected. Temporarily increasing threshold to avoid getting stuck.`, 'color: #FF9800; font-weight: bold');
          lastTriggerCount = cumulativeWordCount; // Reset the count point to current
        }
      } else {
        // Reset error count on successful quiz
        errorCount = 0;
        
        // Log quiz duration if available
        if (message.duration) {
          console.log(`%c[Word Counter] Quiz duration: ${Math.round(message.duration / 1000)} seconds`, 'color: #2196F3');
        }
      }
      
      console.log(`%c[Word Counter] Progress reset: Starting to count toward next ${wordThreshold} words`, 'color: #2196F3; font-weight: bold');
      console.log(`%c[Word Counter] Current progress: 0/${wordThreshold} (0%)`, 'color: #2196F3');
      
      // Create a visual marker in the console
      console.log('%c-------- WORD COUNT RESET --------', 'color: #2196F3; background-color: #E3F2FD; font-weight: bold; padding: 3px; border-radius: 3px;');
      
      // Reset the trigger flag and resume counting
      hasTriggeredQuiz = false;
      isActive = true;
      
      // Force an immediate count update
      setTimeout(() => {
        countVisibleWords();
      }, 500);
    } else if (message.type === 'UPDATE_WORD_THRESHOLD') {
      // Update the word threshold
      const oldThreshold = wordThreshold;
      wordThreshold = message.wordThreshold || 300;
      
      console.log(`%c[Word Counter] Word threshold updated: ${oldThreshold} → ${wordThreshold} words`, 'color: #FF9800; font-weight: bold');
      
      // Recalculate progress percentage with new threshold
      const currentProgress = cumulativeWordCount - lastTriggerCount;
      const percentage = Math.round((currentProgress / wordThreshold) * 100);
      
      console.log(`%c[Word Counter] Current progress with new threshold: ${currentProgress}/${wordThreshold} (${percentage}%)`, 'color: #FF9800');
      
      // Create a visual marker in the console
      console.log('%c-------- THRESHOLD UPDATED --------', 'color: #FF9800; background-color: #FFF3E0; font-weight: bold; padding: 3px; border-radius: 3px;');
      
      // Force an immediate count update to check if we've reached the new threshold
      setTimeout(() => {
        countVisibleWords();
      }, 500);
      
      sendResponse({ success: true });
    }
    return true;
  });

  // Periodically check with the background script if we should be counting
  function startStatusCheck() {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    statusCheckInterval = setInterval(() => {
      if (!hasTriggeredQuiz) {
        chrome.runtime.sendMessage({ type: 'CHECK_WORD_COUNTER_STATUS' }, (response) => {
          if (response) {
            if (response.shouldCount !== isActive) {
              isActive = response.shouldCount;
              console.log(`%c[Word Counter] Status updated: ${isActive ? 'Active' : 'Paused'}`, 
                isActive ? 'color: #4CAF50' : 'color: #9E9E9E');
              
              if (isActive) {
                // If we've become active again, force a count update
                countVisibleWords();
              }
            }
          }
        });
      }
    }, 5000); // Check every 5 seconds
  }

  // Count visible words in the viewport
  function countVisibleWords() {
    // Don't count if we've triggered a quiz or if we're not active
    if (hasTriggeredQuiz || !isActive) return;

    try {
      // Get all text nodes in the viewport
      const visibleText = getVisibleText();
      
      // Calculate new words that weren't visible before
      const newWords = calculateNewWords(previousVisibleText, visibleText);
      previousVisibleText = visibleText;
      
      // Count current visible words (for logging)
      const currentVisibleWords = visibleText.split(/\s+/).filter(word => word.length > 0);
      wordCount = currentVisibleWords.length;
      
      // Add new words to cumulative count
      if (newWords > 0) {
        const oldCumulative = cumulativeWordCount;
        cumulativeWordCount += newWords;
        
        // Log when new words are added
        const currentProgress = cumulativeWordCount - lastTriggerCount;
        const previousProgress = oldCumulative - lastTriggerCount;
        
        // Only log if we've added a significant number of words or it's been a while since last log
        const now = Date.now();
        if (newWords >= 5 || (now - lastLogTime) > 5000) {
          console.log(`%c[Word Counter] Added ${newWords} new words! Progress: ${currentProgress}/${wordThreshold} (${Math.round(currentProgress/wordThreshold*100)}%)`, 'color: #4CAF50');
          lastLogTime = now;
        }
        
        // Log progress milestones
        if (Math.floor(previousProgress / 50) < Math.floor(currentProgress / 50)) {
          const milestone = Math.floor(currentProgress / 50) * 50;
          console.log(`%c[Word Counter] MILESTONE: ${milestone} words viewed (${Math.round(milestone/wordThreshold*100)}% toward next quiz)`, 'color: #FF9800; font-weight: bold');
        }
      }
      
      // Only log detailed stats if the count has changed significantly
      const countDifference = Math.abs(wordCount - lastLoggedCount);
      if (countDifference >= 10 || countDifference / (lastLoggedCount || 1) >= 0.1) {
        const timeElapsed = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
        
        // Log to console with more visual distinction
        const progressBar = createProgressBar(cumulativeWordCount - lastTriggerCount, wordThreshold);
        console.log(`%c[Word Counter] ${timeElapsed}s - Stats Update`, 'color: #9E9E9E');
        console.log(`%c${progressBar}`, 'font-family: monospace; line-height: 1.5');
        console.log(`%c• Current visible: ${wordCount} words`, 'color: #9E9E9E');
        console.log(`%c• Cumulative total: ${cumulativeWordCount} words`, 'color: #9E9E9E');
        console.log(`%c• Progress toward next quiz: ${cumulativeWordCount - lastTriggerCount}/${wordThreshold} words`, 'color: #9E9E9E');
        
        // Store the count for comparison next time
        lastLoggedCount = wordCount;
        
        // Log to storage for potential retrieval later
        chrome.storage.local.set({ 
          wordCounterLog: {
            currentVisible: wordCount,
            cumulative: cumulativeWordCount,
            newWords: newWords,
            nextTriggerAt: lastTriggerCount + wordThreshold,
            progress: cumulativeWordCount - lastTriggerCount,
            threshold: wordThreshold,
            percentage: Math.round((cumulativeWordCount - lastTriggerCount) / wordThreshold * 100),
            timeElapsed: timeElapsed,
            timestamp: new Date().toISOString(),
            sessionQuizCount: sessionQuizCount,
            errorCount: errorCount,
            isActive: isActive
          }
        });
      }
      
      // If threshold reached, trigger the quiz
      if ((cumulativeWordCount - lastTriggerCount) >= wordThreshold && !hasTriggeredQuiz) {
        const progressBar = createProgressBar(wordThreshold, wordThreshold);
        console.log(`%c${progressBar}`, 'font-family: monospace; line-height: 1.5');
        console.log(`%c[Word Counter] THRESHOLD REACHED! ${cumulativeWordCount - lastTriggerCount} new words viewed.`, 'color: #F44336; font-weight: bold');
        console.log('%c-------- TRIGGERING QUIZ --------', 'color: #F44336; background-color: #FFEBEE; font-weight: bold; padding: 3px; border-radius: 3px;');
        
        // Update the last trigger count before triggering
        lastTriggerCount = cumulativeWordCount;
        triggerQuiz();
      }
    } catch (error) {
      console.error(`%c[Word Counter] Error in countVisibleWords:`, 'color: #D32F2F', error);
    }
  }

  // Create a visual progress bar for the console
  function createProgressBar(current, total) {
    const percentage = Math.min(100, Math.round((current / total) * 100));
    const filledBlocks = Math.round(percentage / 5);
    const emptyBlocks = 20 - filledBlocks;
    
    const filled = '█'.repeat(filledBlocks);
    const empty = '░'.repeat(emptyBlocks);
    
    return `Progress: [${filled}${empty}] ${percentage}% (${current}/${total})`;
  }

  // Calculate new words that weren't visible before
  function calculateNewWords(previousText, currentText) {
    if (!previousText) return 0;
    
    try {
      // Simple approach: if current text is longer, estimate new words based on length difference
      const prevWords = previousText.split(/\s+/).filter(word => word.length > 0);
      const currWords = currentText.split(/\s+/).filter(word => word.length > 0);
      
      // More sophisticated approach: find words in current text that weren't in previous text
      const prevWordsSet = new Set(prevWords);
      const newWordsCount = currWords.filter(word => !prevWordsSet.has(word)).length;
      
      // Use a reasonable estimate - don't count all words as new if there's significant overlap
      return Math.min(newWordsCount, Math.max(0, currWords.length - prevWords.length) + 5);
    } catch (error) {
      console.error(`%c[Word Counter] Error calculating new words:`, 'color: #D32F2F', error);
      return 0;
    }
  }

  // Get visible text in the viewport
  function getVisibleText() {
    let visibleText = '';
    
    try {
      // Get all text nodes
      const textNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            // Skip script and style elements
            if (!node.parentNode || 
                node.parentNode.tagName === 'SCRIPT' || 
                node.parentNode.tagName === 'STYLE' ||
                node.parentNode.tagName === 'NOSCRIPT') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }
      
      // Check if each text node is visible in the viewport
      textNodes.forEach(node => {
        if (!node.parentNode) return;
        
        const rect = node.parentNode.getBoundingClientRect();
        
        // Check if the node is in the viewport
        if (rect.top < window.innerHeight && 
            rect.bottom > 0 && 
            rect.left < window.innerWidth && 
            rect.right > 0) {
          
          // Check if the node is visible (not hidden by CSS)
          const style = window.getComputedStyle(node.parentNode);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            visibleText += node.textContent + ' ';
          }
        }
      });
    } catch (error) {
      console.error(`%c[Word Counter] Error getting visible text:`, 'color: #D32F2F', error);
    }
    
    return visibleText;
  }

  // Trigger the quiz
  function triggerQuiz() {
    hasTriggeredQuiz = true;
    isActive = false; // Pause counting while quiz is active
    sessionQuizCount++;
    
    // Log the final word count before triggering
    console.log(`%c[Word Counter] Triggering quiz #${sessionQuizCount} at cumulative word count: ${cumulativeWordCount}`, 'color: #F44336; font-weight: bold');
    
    // Save the trigger data to storage
    chrome.storage.local.set({ 
      wordCounterTriggerLog: {
        triggerNumber: sessionQuizCount,
        cumulativeCount: cumulativeWordCount,
        threshold: wordThreshold,
        timeElapsed: Math.round((new Date().getTime() - startTime.getTime()) / 1000),
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    });
    
    try {
      // Send message to background script to run the quiz
      chrome.runtime.sendMessage({
        type: 'RUN_QUIZ',
        language: language,
        manualTestMode: false,
        triggerNumber: sessionQuizCount,
        wordData: {
          cumulativeCount: cumulativeWordCount,
          visibleCount: wordCount,
          triggerThreshold: wordThreshold
        }
      }, response => {
        if (response && response.success) {
          console.log('%c[Word Counter] Quiz triggered successfully:', 'color: #F44336', response);
        } else {
          console.error('%c[Word Counter] Error triggering quiz:', 'color: #D32F2F', response?.error || 'Unknown error');
          errorCount++;
          
          // Auto-reset if there was an error
          setTimeout(() => {
            if (hasTriggeredQuiz) {
              console.log('%c[Word Counter] Auto-resetting after quiz error', 'color: #FF9800; font-weight: bold');
              hasTriggeredQuiz = false;
              isActive = true; // Resume counting
              countVisibleWords(); // Force an immediate count
            }
          }, 5000); // Short timeout for error recovery
        }
        
        // We'll wait for the QUIZ_COMPLETED message from background script to reset
        // But add a safety timeout in case that message never comes
        setTimeout(() => {
          if (hasTriggeredQuiz) {
            console.log('%c[Word Counter] Safety timeout - resetting trigger state', 'color: #FF9800; font-weight: bold');
            hasTriggeredQuiz = false;
            isActive = true; // Resume counting
            countVisibleWords(); // Force an immediate count
          }
        }, 120000); // 2 minute safety timeout
      });
    } catch (error) {
      console.error(`%c[Word Counter] Error sending message to background:`, 'color: #D32F2F', error);
      
      // Auto-reset on error
      setTimeout(() => {
        console.log('%c[Word Counter] Auto-resetting after error', 'color: #FF9800; font-weight: bold');
        hasTriggeredQuiz = false;
        isActive = true; // Resume counting
        countVisibleWords(); // Force an immediate count
      }, 5000);
    }
  }

  // Start monitoring scroll and DOM changes
  function startMonitoring() {
    console.log('%c[Word Counter] Starting to monitor page for word counting', 'color: #4CAF50; font-weight: bold');
    
    // Start the status check with background script
    startStatusCheck();
    
    // Initial count
    setTimeout(() => {
      console.log('%c[Word Counter] Performing initial word count', 'color: #4CAF50');
      countVisibleWords();
    }, 1000);
    
    // Listen for scroll events
    window.addEventListener('scroll', debounce(() => {
      countVisibleWords();
    }, 300));
    
    // Observe DOM changes
    observer = new MutationObserver(debounce(() => {
      countVisibleWords();
    }, 500));
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      characterData: true
    });
    
    // Also set up a regular interval to check for new words
    // This helps in case scroll events or DOM mutations are missed
    setInterval(() => {
      if (isActive && !hasTriggeredQuiz) {
        countVisibleWords();
      }
    }, 3000);
    
    console.log('%c[Word Counter] Monitoring set up successfully', 'color: #4CAF50');
    console.log('%c-------- WORD COUNTING STARTED --------', 'color: #4CAF50; background-color: #E8F5E9; font-weight: bold; padding: 3px; border-radius: 3px;');
  }

  // Utility function to debounce frequent events
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }
})(); 