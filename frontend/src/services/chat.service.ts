import { Message, ChatResponse } from '../types';

class ChatService {
  private API_URL = '/api/ai';

  async getContext(): Promise<Message[]> {
    const response = await fetch(`${this.API_URL}/context`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat context');
    }

    const data = await response.json();
    return data.context;
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await fetch(`${this.API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  async clearContext(): Promise<void> {
    const response = await fetch(`${this.API_URL}/context`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to clear context');
    }
  }

  getStreamUrl(message: string): string {
    const token = localStorage.getItem('token');
    return `${this.API_URL}/chat/stream?message=${encodeURIComponent(message)}&token=${token}`;
  }
}

export const chatService = new ChatService();
