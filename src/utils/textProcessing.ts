export const formatText = (text: string): string => {
    const temp = document.createElement('div');
    temp.innerHTML = text;
    let decodedText = temp.textContent || temp.innerText;
  
    return decodedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/###(.*)/g, '<h3>$1</h3>')
      .replace(/##(.*)/g, '<h2>$1</h2>')
      .replace(/#(.*)/g, '<h1>$1</h1>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/---/g, '<hr>')
      .replace(/\n/g, '<br>');
  };