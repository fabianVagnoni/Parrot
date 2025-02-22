export const createPopupWindow = async (content: string): Promise<void> => {
    const popup = window.open('', 'Quiz', 'width=600,height=400');
    if (!popup) throw new Error('Failed to create popup window');
    
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
            .highlighted span {
              background-color: yellow;
            }
          </style>
        </head>
        <body>
          <div class="highlighted">
            ${content}
          </div>
        </body>
      </html>
    `);
    popup.document.close();
  };