interface QuizOptions {
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct: string;
}


export const createPopupWindow = async (chosenWord: string, quizJson: string): Promise<void> => {
  const popup = window.open('', 'Quiz', 'width=600,height=400');
  if (!popup) throw new Error('Failed to create popup window');
  
  try {
    console.log('Received quiz JSON:', quizJson); // Debug log
    
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
            }
            .quiz-option:hover {
              background-color: #f0f0f0;
            }
          </style>
        </head>
        <body>
          <div>
            <h2 style="color: #3498db; text-align: center;">Learn a new word!</h2>
            <p>What is "${chosenWord}" translated to?</p>
            <ul id="quiz-options-list" style="list-style-type: none; padding: 0;">
              <li class="quiz-option">${quizOptions.option1}</li>
              <li class="quiz-option">${quizOptions.option2}</li>
              <li class="quiz-option">${quizOptions.option3}</li>
              <li class="quiz-option">${quizOptions.option4}</li>
            </ul>
          </div>
        </body>
      </html>
    `);
    popup.document.close();
  } catch (error) {
    console.error('Error in createPopupWindow:', error);
    throw error; // Propagate the specific error
  }
};