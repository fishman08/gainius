export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  extractedExercises?: string[];
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messages: ChatMessage[];
}
