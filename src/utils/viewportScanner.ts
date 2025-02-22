import { CONFIG } from '../config/constants';

export const isInViewport = (element: Element): boolean => {
  const rect = element.getBoundingClientRect();
  const isVisible = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
  console.log('Viewport check for element:', element, 'Result:', isVisible);
  return isVisible;
};

export const getVisibleText = (): string => {
  try {
    console.log('Starting getVisibleText function');
    // Verify document context
    if (!document || !document.body) {
      throw new Error('Document body not available');
    }
    console.log('Document context verified');

    // Create NodeFilter object
    const filter = {
      acceptNode: function(node: Node) {
        console.log('Checking node:', node);
        // Skip empty or whitespace-only nodes
        if (!node.textContent?.trim()) {
          console.log('Rejecting empty node');
          return NodeFilter.FILTER_REJECT;
        }
        // Skip hidden elements
        const parent = node.parentElement;
        if (!parent || getComputedStyle(parent).display === 'none' || 
            getComputedStyle(parent).visibility === 'hidden' ||
            getComputedStyle(parent).opacity === '0') {
          console.log('Rejecting node without parent');
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;

        
      }
    };

    console.log('Creating TreeWalker');
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      filter as NodeFilter
    );
    console.log('TreeWalker created');

    let node: Node | null;
    const visibleText: string[] = [];
    let wordCount = 0;
    const maxWordCount = CONFIG.MAX_WORD_COUNT || 100;
    console.log('Initial setup complete. Max word count:', maxWordCount);

    while ((node = walker.nextNode()) && wordCount < maxWordCount) {
      console.log('Processing node:', node);
      const parentElement = (node as Text).parentElement;
      if (!parentElement){ 
        console.log('Skipping node without parent element');
        continue
      };

      const rect = parentElement.getBoundingClientRect();
      console.log('Element dimensions:', {
        width: rect.width,
        height: rect.height
      });

      // Check if element is visible and has minimum dimensions
      if (isInViewport(parentElement) && 
          parentElement.getBoundingClientRect().width > 0 && 
          parentElement.getBoundingClientRect().height > 0) {
        const text = node.textContent?.trim() || '';
        console.log('Processing visible text:', text);
        
        const words = text.split(/\s+/)
        .filter(word => {
          const clean = word.trim();
          const isValid = clean.length >= 3 && /^[a-zA-Z]+$/.test(clean);
          console.log('Word:', clean, 'Valid:', isValid);
          return isValid;
        });

      for (const word of words) {
        if (wordCount >= maxWordCount) break;
        visibleText.push(word);
        wordCount++;
        console.log('Added word:', word, 'Current count:', wordCount);
      }
        } else {
          console.log('Element not visible or has no dimensions');
        }
      }

      console.log('Node traversal complete');
      console.log('Total words collected:', visibleText.length);
      
      const result = visibleText.join(' ');
      console.log('Final result:', result);
      
      if (!result) {
        console.log('No visible text found');
        throw new Error('No visible text found');
      }
  
  return result;

  } catch (error: unknown) {
    console.error('Error in getVisibleText:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve visible text: ${error.message}`);
    }
    // Handle non-Error objects
    throw new Error('Failed to retrieve visible text: Unknown error');
  }
};