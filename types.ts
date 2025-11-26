export interface Attachment {
  id: string;
  mimeType: string;
  base64: string; // Raw base64 data without the data URL prefix
  previewUrl: string; // Data URL for display
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
}

// Extend Window interface for Web Speech API which isn't fully typed in standard TS lib
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export interface SpeechConfig {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
}