
const getText = async (): Promise<string> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error("No active tab found");
  
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          function isInViewport(element: Element): boolean {
            const rect = element.getBoundingClientRect();
            return (
              rect.top >= 0 &&
              rect.left >= 0 &&
              rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
              rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
          }
  
          try {
            console.log('[Content Script] Starting text extraction...');
            
            if (!document || !document.body) {
              throw new Error('Document body not available');
            }
  
            const filter = {
              acceptNode: function(node: Node) {
                if (!node.textContent?.trim()) {
                  return NodeFilter.FILTER_REJECT;
                }
                const parent = node.parentElement;
                if (!parent || 
                    getComputedStyle(parent).display === 'none' || 
                    getComputedStyle(parent).visibility === 'hidden' ||
                    getComputedStyle(parent).opacity === '0') {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            };
  
            const walker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              filter as NodeFilter
            );
  
            let node: Node | null;
            const visibleText: string[] = [];
            let wordCount = 0;
            const maxWords = 100; // Hardcoded value since we can't access CONFIG
  
            console.log('[Content Script] TreeWalker created, starting traversal...');
  
            while ((node = walker.nextNode()) && wordCount < maxWords) {
              const parentElement = (node as Text).parentElement;
              if (!parentElement) continue;
  
              if (isInViewport(parentElement) && 
                  parentElement.getBoundingClientRect().width > 0 && 
                  parentElement.getBoundingClientRect().height > 0) {
                const text = node.textContent?.trim() || '';
                
                const words = text.split(/\s+/)
                  .filter(word => {
                    const clean = word.trim();
                    return clean.length >= 3 && /^[a-zA-Z]+$/.test(clean);
                  });
  
                for (const word of words) {
                  if (wordCount >= maxWords) break;
                  visibleText.push(word);
                  wordCount++;
                }
              }
            }
  
            console.log('[Content Script] Found words:', visibleText.length);
  
            const result = visibleText.join(' ');
            
            if (!result) {
              console.log('[Content Script] No visible text found');
              throw new Error('No visible text found on the page');
            }
            
            console.log('[Content Script] Successfully extracted text');
            return result;
  
          } catch (error) {
            console.error('[Content Script] Error:', error);
            // Make sure we're returning a string with the error message
            return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
          }
        },
        world: "MAIN"
      });
  
      console.log('[Extension] Script execution result:', result);
  
      if (!result?.[0]?.result) {
        throw new Error("Failed to retrieve text from the page");
      }

      // Check if the result starts with "Error:"
      if (typeof result[0].result === 'string' && result[0].result.startsWith('Error:')) {
        throw new Error(result[0].result.substring(7)); // Remove "Error: " prefix
      }
  
      return result[0].result;
    } catch (error) {
      console.error('[Extension] Error in getText:', error);
      throw error;
    }
  };
  
  export { getText };