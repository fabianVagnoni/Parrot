// src/types/index.ts
export interface OpenAIResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  }
  
export interface PopupWindowStyles {
    body: React.CSSProperties;
    summaryContainer: React.CSSProperties;
    dragHandle: React.CSSProperties;
    // Add other styles as needed
  }