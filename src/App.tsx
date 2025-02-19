import './App.css'
import OpenAI from "openai";
import { useState } from 'react';

console.log('API Key exists:', !!import.meta.env.VITE_OPEN_AI_API_KEY)
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true
});

const TEMPERATURE = 0.1;
const MAX_TOKENS = 500;

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Select Language');

  const languages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Latvian'];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setIsOpen(false);
  };

  const formatText = (text: string): string => {
    // First, create a temporary div to handle HTML entities
    const temp = document.createElement('div');
    temp.innerHTML = text;
    let decodedText = temp.textContent || temp.innerText;

    // Convert markdown to HTML
    decodedText = decodedText
      // Handle bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Handle headers
      .replace(/###(.*)/g, '<h3>$1</h3>')
      .replace(/##(.*)/g, '<h2>$1</h2>')
      .replace(/#(.*)/g, '<h1>$1</h1>')
      // Handle italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Handle horizontal rules
      .replace(/---/g, '<hr>')
      // Convert newlines to <br> tags
      .replace(/\n/g, '<br>');

    return decodedText;
  };

  const createPopupWindow = async (summary: string) => {
    try {
      // Format the summary text
      const formattedSummary = formatText(summary);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Parrot</title>
            <meta charset="UTF-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 16px;
                background-color: white;
                overflow: auto;
                height: 100vh;
              }
              .summary-container {
                background-color: white;
                border-radius: 8px;
                height: 100%;
              }
              h1 {
                color: #333;
                margin: 0 0 16px 0;
                font-size: 18px;
              }
              h3 {
                color: #444;
                margin: 16px 0 8px 0;
                font-size: 16px;
              }
              .summary-text {
                color: #444;
                font-size: 14px;
                line-height: 1.5;
                text-align: justify;
              }
              .summary-text strong {
                color: #000;
              }
              .summary-text em {
                color: #666;
              }
              .drag-handle {
                -webkit-app-region: drag;
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 20px;
                background: #f5f5f5;
                border-bottom: 1px solid #ddd;
              }
              hr {
                border: none;
                border-top: 1px solid #ddd;
                margin: 16px 0;
              }
            </style>
          </head>
          <body>
            <div class="drag-handle"></div>
            <div class="summary-container">
              <h1>Parrot Task</h1>
              <div class="summary-text">${formattedSummary}</div>
            </div>
          </body>
        </html>
      `;

      // Create a Blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Get the current window position to place the popup relative to it
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentWindow = await chrome.windows.get(currentTab.windowId);

      // Calculate position for the popup
      const left = (currentWindow.left || 0) + 50;
      const top = (currentWindow.top || 0) + 50;

      // Create the popup window
      await chrome.windows.create({
        url: url,
        type: 'popup',
        width: 400,
        height: 500,
        left,
        top,
        focused: true
      });

      // Clean up the Blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating popup window:', error);
      alert(`Failed to create popup: ${error}`);
    }
  };

  const getText = async (): Promise<string> => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error("No active tab found");

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText || document.body.textContent,
    });

    if (!result?.[0]?.result) {
      throw new Error("Failed to retrieve text content from the page.");
    }
    return result[0].result;
  };

  const summarizeAPI = async () => {
    try {
      const text = await getText();
      console.log("Extracted Text:", text);
      const summary = await gpt_call(text);
      await createPopupWindow(summary);
    } catch (error) {
      console.error("Error summarizing:", error);
      alert(error);
    }
  };

  const gpt_call = async (context: string): Promise<string> => {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful language professor.' },
          { role: 'user', content: `Your student is reading this web page ${context} and finds it
            very interesting. He is studying ${selectedLanguage} and wants to learn 
            essential vocabulary and phrases taylored to the content he is reading now.
            Please, select in the text the most important concept, translate it to 
            ${selectedLanguage} and provide a definition both in the original
            text's language and in ${selectedLanguage}. Also, please format everything
            such that it is very easy to read and understand. Additionally, please write the
            text as if the student was reading a text book: everything should be in third
            person and other relevant formats for a text book. Return the following content
            (That that is between brakents is what you need to replace with the actual content.
            When you read ORIGINAL LANGUAGE, this refers to the language in which the web page
            is written. For example, if the page is written in English, you would replace ORINGAL
            LANGUAGE by 'English' and everything written as [X in ORIGINAL LANGUAGE] would be something
            written in English):

            [MAIN CONCEPT IN ORIGINAL LANGUAGE]: [TRANSLATION TO ${selectedLanguage}]
            Definition in [ORIGINAL LANGUAGE]: [DEFINITION IN ORIGINAL LANGUAGE]
            Definition in ${selectedLanguage}: [DEFINITION IN ${selectedLanguage}]
            
            
            Key Vocabulary:
            - [VOCABULARY 1]: [TRANSLATION 1]
                Definition in [ORIGINAL LANGUAGE]: [DEFINITION IN ORIGINAL LANGUAGE]
                Definition in ${selectedLanguage}: [DEFINITION IN ${selectedLanguage}]

            - [VOCABULARY 2]: [TRANSLATION 2]
                Definition in [ORIGINAL LANGUAGE]: [DEFINITION IN ORIGINAL LANGUAGE]
                Definition in ${selectedLanguage}: [DEFINITION IN ${selectedLanguage}]

            - [VOCABULARY 3]: [TRANSLATION 3]
                Definition in [ORIGINAL LANGUAGE]: [DEFINITION IN ORIGINAL LANGUAGE]
                Definition in ${selectedLanguage}: [DEFINITION IN ${selectedLanguage}]`
          }
        ],
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
      });
      return completion.choices[0].message.content || 'No summary generated';
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw new Error('Failed to generate summary');
    }
  };

  // Rest of your component's JSX remains the same
  return (
    <div className="container">
      <h1>Parrot</h1>
      <div className="card">
        <h2>Launch Task</h2>
        <div>
          <div className="dropdown" style={{ 
            marginTop: "2rem",
            marginBottom: "2rem",
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minWidth: "15rem",
            position: 'relative'
          }}>
            <div 
              className={`select ${isOpen ? 'select-clicked' : ''}`}
              onClick={toggleDropdown}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "2px solid",
                padding: "1rem",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <span>{selectedLanguage}</span>
              <div className="caret" style={{
                width: "0",
                height: "0",
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid #fff",
                marginLeft: "5px",
                transition: "all 0.3s ease",
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
              }}></div>
            </div>
            {isOpen && (
              <ul className="dropdown-menu" style={{
                listStyle: "none",
                padding: "0.2rem 0.5rem",
                border: "2px solid",
                position: "absolute",
                boxShadow: "0 0.5rem 1rem rgba(0, 0, 0, 0.2)",
                borderRadius: "0.5rem",
                width: "100%",
                top: "3rem",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "white",
                zIndex: "1",
              }}>
                {languages.map((language) => (
                  <li 
                    key={language}
                    onClick={() => handleLanguageSelect(language)}
                    style={{
                      padding: "0.7rem",
                      cursor: "pointer",
                      borderRadius: "0.3rem",
                    }}
                    onMouseOver={(e: React.MouseEvent<HTMLLIElement>) => {
                      (e.target as HTMLLIElement).style.backgroundColor = "#f0f0f0";
                    }}
                    onMouseOut={(e: React.MouseEvent<HTMLLIElement>) => {
                      (e.target as HTMLLIElement).style.backgroundColor = "transparent";
                    }}
                  >
                    {language}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p>Click below to launch task</p>
        <button onClick={summarizeAPI} className="button">
          Launch Task
        </button>
      </div>
    </div>
  );
}

export default App