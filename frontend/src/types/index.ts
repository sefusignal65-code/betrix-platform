export interface User {
  id: string;
  username: string;
  role: string;
  subscription?: {
    level: string;
    expiresAt: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
}
