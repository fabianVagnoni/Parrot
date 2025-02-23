interface QuizOptions {
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct: string;
}


export const createPopupWindow = async (chosenWord: string, quizJson: string): Promise<number> => {
  return new Promise((resolve) => {
    const popup = window.open('', 'Quiz', 'width=600,height=400');
    if (!popup) throw new Error('Failed to create popup window');
    
    try {
      // console.log('Received quiz JSON:', quizJson); // Debug log
      
      let quizOptions: QuizOptions;
      try {
        quizOptions = JSON.parse(quizJson);
      } catch (parseError) {
        console.error('JSON Parse error:', parseError);
        throw new Error(`Invalid JSON format: ${parseError instanceof Error ? parseError.message : 'unknown error'}`);
      }
      
      if (!quizOptions || !quizOptions.option1 || !quizOptions.option2 || 
          !quizOptions.option3 || !quizOptions.option4 || !quizOptions.correct) {
        throw new Error('Missing required quiz options');
      }

      popup.document.write(`
      <!DOCTYPE html>
        <html>
          <head>
            <title>Language Quiz</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.6;
              }
              .quiz-option {
                padding: 10px;
                margin: 5px 0;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
              }
              .quiz-option:hover {
                background-color: #f0f0f0;
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
              }
            </style>
          </head>
          <body>
            <div>
              <h2 style="color: #3498db; text-align: center;">Learn a new word!</h2>
              <p>What is "${chosenWord}" translated to?</p>
              <ul id="quiz-options-list" style="list-style-type: none; padding: 0;">
                <li class="quiz-option" data-value="${quizOptions.option1}">${quizOptions.option1}</li>
                <li class="quiz-option" data-value="${quizOptions.option2}">${quizOptions.option2}</li>
                <li class="quiz-option" data-value="${quizOptions.option3}">${quizOptions.option3}</li>
                <li class="quiz-option" data-value="${quizOptions.option4}">${quizOptions.option4}</li>
              </ul>
            </div>
          </body>
        </html>
      `);

      // Add event listeners after the document is written
      const correctAnswer = quizOptions.correct;
      const options = popup.document.querySelectorAll('.quiz-option');
      
      options.forEach(option => {
        option.addEventListener('click', function(this: HTMLElement) {
          const selected = this.getAttribute('data-value');
          const allOptions = popup.document.querySelectorAll('.quiz-option');
          
          // Disable all options
          allOptions.forEach(opt => {
            (opt as HTMLElement).style.pointerEvents = 'none';
            opt.classList.add('disabled');
          });
          
          // Check answer and apply styles
          if (selected === correctAnswer) {
            this.classList.add('correct');
            resolve(1);
          } else {
            this.classList.add('incorrect');
            // Show correct answer
            allOptions.forEach(opt => {
              if (opt.textContent === correctAnswer) {
                opt.classList.add('correct');
              }
            });
            resolve(-1);
          }
        });
      });

      popup.document.close();
    } catch (error) {
      console.error('Error in createPopupWindow:', error);
      throw error;
    }
  });
};