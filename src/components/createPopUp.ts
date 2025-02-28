interface QuizOptions {
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct: string;
}

interface SMUPractice {
  originalWord: string;
  translatedWord: string;
  originalWordDef: string;
  exampleOriginal: string;
  exampleTraslated: string;
}

export const createPopupWindow = async (
  chosenWord: string, 
  quizJson: string, 
  isTestMode: boolean
): Promise<number> => {
  return new Promise((resolve) => {
    console.log('Creating popup window...');
    // Check if we're in a background script context
    if (typeof window === 'undefined') {
      console.log('Creating popup window in background script...');
      
      
      function messageListener(
        message: any, 
        sender: chrome.runtime.MessageSender, 
        sendResponse: (response?: any) => void
      ) {
        console.log('Received message:', message, 'from sender:', sender);
        
        if (message.type === 'QUIZ_READY') {
          console.log('Sending quiz data to popup...');
          try {
            chrome.runtime.sendMessage({
              type: 'INIT_QUIZ',
              data: {
                chosenWord, 
                quizJson,
                isTestMode
              }
            });
            sendResponse({ success: true });
          } catch (error) {
            console.error('Error sending message to popup:', error);
            sendResponse({ success: false, error: String(error) });
          }
          return true;
        }
      
        if (message.type === 'QUIZ_COMPLETE') {
          console.log('Quiz completed:', message.result);
          const result = Number(message.result) || 0;
          resolve(result);
          sendResponse({ success: true });
          return false;
        }
        return true; // Keep the message channel open
      }

      // Register the listener
      chrome.runtime.onMessage.addListener(messageListener);

      // Create the popup window
      const popupUrl = chrome.runtime.getURL('popupAuto.html');
      console.log('Attempting to open URL:', popupUrl);
      chrome.windows.create({
        url: popupUrl,
        type: 'popup',
        width: 600,
        height: 800,
        focused: true
      }).then(popupWindow => {
        try {
          console.log('Popup window created:', popupWindow);
          console.log('Popup window ID:', popupWindow?.id);
          
          if (!popupWindow?.id) {
            console.error('Popup window ID not found');
            try {
              chrome.runtime.onMessage.removeListener(messageListener);
              console.log('Listener removed successfully');
            } catch (listenerError) {
              console.error('Error removing listener:', listenerError);
            }
            resolve(0);
            return;
          }
          console.log('Popup window created successfully with ID:', popupWindow.id);
        } catch (error) {
          console.error('Unexpected error in popup window creation handler:', error);
          try {
            chrome.runtime.onMessage.removeListener(messageListener);
          } catch {}
          resolve(0);
        }
      }).catch(error => {
        console.error('Error creating popup window:', error);
        try {
          chrome.runtime.onMessage.removeListener(messageListener);
        } catch (listenerError) {
          console.error('Error removing listener:', listenerError);
        }
        resolve(0);
      });
    } else {
      // Regular window context (app.tsx)
      const popup = window.open('', 'Quiz', 'width=600,height=800');
      if (!popup) throw new Error('Failed to create popup window');
      
      try {
        const data = JSON.parse(quizJson);
        
        if (isTestMode) {
          if (!data.option1 || !data.option2 || !data.option3 || !data.option4 || !data.correct) {
            throw new Error('Missing required quiz options');
          }
          popup.document.write(getTestTemplate(chosenWord, data));
          setupTestMode(popup, data, resolve);
        } else {
          if (!data.originalWord || !data.translatedWord || !data.originalWordDef || 
              !data.exampleOriginal || !data.exampleTraslated) {
            throw new Error('Missing required practice data');
          }
          popup.document.write(getPracticeTemplate(chosenWord, data));
          setupPracticeMode(popup, resolve);
        }

        popup.document.close();
      } catch (error) {
        console.error('Error in createPopupWindow:', error);
        throw error;
      }
    }
  });
};


const getTestTemplate = (chosenWord: string, quizOptions: QuizOptions): string => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Language Quiz - Test Mode</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
        }

        .quiz-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .quiz-title {
          color: #3498db;
          text-align: center;
          font-size: 1.8em;
          margin-bottom: 1.5rem;
          animation: fadeIn 0.8s ease-in;
        }

        .quiz-question {
          font-size: 1.2em;
          color: #2c3e50;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .quiz-options-list {
          list-style-type: none;
          padding: 0;
        }

        .quiz-option {
          padding: 12px 16px;
          margin: 8px 0;
          border: 2px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: white;
        }

        .quiz-option:hover {
          background-color: #f0f0f0;
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .correct {
          background-color: #90EE90 !important;
          border-color: #3CB371;
          cursor: default;
        }

        .incorrect {
          background-color: #FFB6C1 !important;
          border-color: #DC143C;
          cursor: default;
        }

        .disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    </head>
    <body>
      <div class="quiz-container">
        <h2 class="quiz-title">🦜 Test Your Knowledge!</h2>
        <p class="quiz-question">What is "${chosenWord}" translated to?</p>
        <ul class="quiz-options-list">
          <li class="quiz-option" data-value="${quizOptions.option1}">${quizOptions.option1}</li>
          <li class="quiz-option" data-value="${quizOptions.option2}">${quizOptions.option2}</li>
          <li class="quiz-option" data-value="${quizOptions.option3}">${quizOptions.option3}</li>
          <li class="quiz-option" data-value="${quizOptions.option4}">${quizOptions.option4}</li>
        </ul>
      </div>
    </body>
  </html>
`;


const getPracticeTemplate = (chosenWord: string, practiceData: SMUPractice): string => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Language Learning - Practice Mode</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.6;
          color: #333;
        }
        .practice-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }
        .word-section {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .definition-section {
          background-color: #fff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .example-section {
          background-color: #f1f8ff;
          border-radius: 8px;
          padding: 20px;
        }
        .section-title {
          color: #3498db;
          font-size: 1.2em;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .original-word {
          font-size: 1.8em;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .translated-word {
          font-size: 1.6em;
          color: #3498db;
          margin-bottom: 15px;
        }
        .example {
          padding: 10px;
          border-left: 3px solid #3498db;
          margin: 5px 0;
        }
        .reveal-button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.1em;
          width: 100%;
          transition: background-color 0.3s ease;
        }
        .reveal-button:hover {
          background-color: #2980b9;
        }
        .hidden {
          display: none;
        }
        .welcome-message {
          text-align: center;
          margin-bottom: 24px;
          font-size: 1.4em;
          color: #2c3e50;
          font-weight: 500;
          animation: fadeIn 0.8s ease-in;
        }

        .word-section {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 
                      0 1px 3px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease;
        }

        .definition-section {
          background-color: #fff;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 
                      0 1px 3px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease;
        }

        .example-section {
          background-color: #f1f8ff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 
                      0 1px 3px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease;
        }

        .word-section:hover,
        .definition-section:hover,
        .example-section:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.12), 
                      0 2px 4px rgba(0, 0, 0, 0.08);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
    </head>
    <body>
      <div class="practice-container">
        <h1 class="welcome-message">🦜 You have a new Parrot Practice!</h1>
        <button id="revealBtn" class="reveal-button">Reveal Word Study</button>
        
        <div id="content" class="hidden">
          <div class="word-section">
            <div class="section-title">Word Study</div>
            <div class="original-word">${chosenWord}</div>
            <div class="translated-word">${practiceData.translatedWord}</div>
          </div>

          <div class="definition-section">
            <div class="section-title">Definition</div>
            <p>${practiceData.originalWordDef}</p>
          </div>

          <div class="example-section">
            <div class="section-title">Example Usage</div>
            <div class="example">
              <p><em>${practiceData.exampleOriginal}</em></p>
              <p>${practiceData.exampleTraslated}</p>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
`;


const setupTestMode = (popup: Window, quizOptions: QuizOptions, resolve: (value: number) => void) => {
  const options = popup.document.querySelectorAll('.quiz-option');
  options.forEach(option => {
    option.addEventListener('click', function(this: HTMLElement) {
      const selected = this.getAttribute('data-value');
      const allOptions = popup.document.querySelectorAll('.quiz-option');
      
      allOptions.forEach(opt => {
        (opt as HTMLElement).style.pointerEvents = 'none';
        opt.classList.add('disabled');
      });
      
      if (selected === quizOptions.correct) {
        this.classList.add('correct');
        resolve(1);
      } else {
        this.classList.add('incorrect');
        allOptions.forEach(opt => {
          if (opt.textContent === quizOptions.correct) {
            opt.classList.add('correct');
          }
        });
        resolve(-1);
      }
    });
  });
};

const setupPracticeMode = (popup: Window, resolve: (value: number) => void) => {
  const revealBtn = popup.document.getElementById('revealBtn');
  const content = popup.document.getElementById('content');
  
  revealBtn?.addEventListener('click', () => {
    content?.classList.remove('hidden');
    revealBtn.style.display = 'none';
    resolve(1);
  });
};