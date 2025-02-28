document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .close-button {
      background: none;
      border: none;
      color: #666;
      font-size: 20px;
      cursor: pointer;
      padding: 5px 10px;
      margin-bottom: 10px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .close-button:hover {
      background-color: #f0f0f0;
      color: #333;
    }

    .quiz-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 12px 16px !important;
    }

    .option-text {
      font-size: 1.1em;
      font-weight: 500;
    }

    .pronunciation {
      font-size: 0.9em;
      color: #666;
      font-style: italic;
      margin-top: 4px;
    }

    .correct .pronunciation {
      color: #2ecc71;
    }

    .incorrect .pronunciation {
      color: #e74c3c;
    }
  `;
  document.head.appendChild(style);

  // Notify background script that popup is ready
  console.log('Popup is ready');
  try {
    chrome.runtime.sendMessage({ type: 'QUIZ_READY' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending QUIZ_READY:', chrome.runtime.lastError);
        return;
      }
      console.log('QUIZ_READY response:', response);
    });
  } catch (error) {
    console.error('Error in DOMContentLoaded:', error);
  }
});

// Listen for quiz initialization
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  try {
    if (message.type === 'INIT_QUIZ') {
      console.log('Initializing quiz');
      const { chosenWord, quizJson, isTestMode } = message.data;
      const data = JSON.parse(quizJson);
      
      // Write the appropriate template
      document.body.innerHTML = isTestMode 
        ? getTestTemplate(chosenWord, data)
        : getPracticeTemplate(chosenWord, data);

      // Set up the appropriate mode
      console.log('Setting up quiz mode:', isTestMode ? 'test' : 'practice');
      if (isTestMode) {
        console.log('Setting up test mode');
        setupTestMode(window, data, sendQuizComplete);
      } else {
        console.log('Setting up practice mode');
        setupPracticeMode(window, sendQuizComplete);
      }
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: String(error) });
  }
  return true; // Keep the message channel open
});

function sendQuizComplete(result) {
  try {
    chrome.runtime.sendMessage({ 
      type: 'QUIZ_COMPLETE', 
      result 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending QUIZ_COMPLETE:', chrome.runtime.lastError);
        return;
      }
      console.log('QUIZ_COMPLETE response:', response);
    });
  } catch (error) {
    console.error('Error sending quiz complete:', error);
  }
}

function getTestTemplate(chosenWord, quizOptions) {
  return `
    <div class="quiz-container">
      <div style="display: flex; justify-content: flex-end;">
        <button class="close-button">✕</button>
      </div>
      <h2 class="quiz-title">🦜 Test Your Knowledge!</h2>
      <p class="quiz-question">What is "${chosenWord}" translated to?</p>
      <ul class="quiz-options-list">
        <li class="quiz-option" data-value="${quizOptions.option1}">
          <span class="option-text">${quizOptions.option1}</span>
          <span class="pronunciation">${quizOptions.option1Pronunciation}</span>
        </li>
        <li class="quiz-option" data-value="${quizOptions.option2}">
          <span class="option-text">${quizOptions.option2}</span>
          <span class="pronunciation">${quizOptions.option2Pronunciation}</span>
        </li>
        <li class="quiz-option" data-value="${quizOptions.option3}">
          <span class="option-text">${quizOptions.option3}</span>
          <span class="pronunciation">${quizOptions.option3Pronunciation}</span>
        </li>
        <li class="quiz-option" data-value="${quizOptions.option4}">
          <span class="option-text">${quizOptions.option4}</span>
          <span class="pronunciation">${quizOptions.option4Pronunciation}</span>
        </li>
      </ul>
    </div>
  `;
}

function getPracticeTemplate(chosenWord, practiceData) {
  return `
    <div class="practice-container">
      <div style="display: flex; justify-content: flex-end;">
        <button class="close-button">✕</button>
      </div>
      <h1 class="welcome-message">🦜 You have a new Parrot Practice!</h1>
      <button id="revealBtn" class="reveal-button">Reveal Word Study</button>
      
      <div id="content" class="hidden">
        <div class="word-section">
          <div class="section-title">Word Study</div>
          <div class="original-word">${chosenWord}</div>
          <div class="translated-word">
            <span class="option-text">${practiceData.translatedWord}</span>
            <span class="pronunciation">${practiceData.translatedWordPronunciation}</span>
          </div>
        </div>

        <div class="definition-section">
          <div class="section-title">Definition</div>
          <p>${practiceData.originalWordDef}</p>
        </div>

        <div class="example-section">
          <div class="section-title">Example Usage</div>
          <div class="example">
            <p><em>${practiceData.exampleOriginal}</em></p>
            <div class="translated-example">
              <span class="option-text">${practiceData.exampleTraslated}</span>
              <span class="pronunciation">${practiceData.exampleTranslatedPronunciation}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupCloseButton() {
  const closeButton = document.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      window.close();
    });
  }
}

function setupTestMode(window, quizOptions, callback) {
  setupCloseButton();
  const options = window.document.querySelectorAll('.quiz-option');
  options.forEach(option => {
    option.addEventListener('click', function() {
      const selected = this.getAttribute('data-value');
      const allOptions = window.document.querySelectorAll('.quiz-option');
      
      // Disable all options first
      allOptions.forEach(opt => {
        opt.style.pointerEvents = 'none';
        opt.classList.add('disabled');
      });
      
      // Show the result
      if (selected === quizOptions.correct) {
        this.classList.add('correct');
        // Add a success message
        const message = document.createElement('p');
        message.textContent = '✅ Correct! Well done!';
        message.style.textAlign = 'center';
        message.style.color = '#2ecc71';
        message.style.fontWeight = 'bold';
        message.style.marginTop = '20px';
        this.parentNode.appendChild(message);
        callback(1);
      } else {
        this.classList.add('incorrect');
        // Highlight the correct answer
        allOptions.forEach(opt => {
          if (opt.querySelector('.option-text').textContent === quizOptions.correct) {
            opt.classList.add('correct');
          }
        });
        // Add an explanation message
        const message = document.createElement('p');
        message.textContent = '❌ Not quite. The correct answer is shown in green.';
        message.style.textAlign = 'center';
        message.style.color = '#e74c3c';
        message.style.fontWeight = 'bold';
        message.style.marginTop = '20px';
        this.parentNode.appendChild(message);
        callback(-1);
      }
    });
  });
}

function setupPracticeMode(window, callback) {
  setupCloseButton();
  const revealBtn = window.document.getElementById('revealBtn');
  const content = window.document.getElementById('content');
  
  revealBtn?.addEventListener('click', () => {
    content?.classList.remove('hidden');
    revealBtn.style.display = 'none';
    // Add a completion message
    const message = document.createElement('p');
    message.textContent = '✨ Great job studying! Keep it up!';
    message.style.textAlign = 'center';
    message.style.color = '#3498db';
    message.style.fontWeight = 'bold';
    message.style.marginTop = '20px';
    content?.appendChild(message);
    callback(1);
  });
}