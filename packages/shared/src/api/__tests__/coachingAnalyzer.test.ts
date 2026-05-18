import { describe, it, expect } from 'vitest';
import { buildAnalysisPrompt } from '../coachingAnalyzer';
import type { ChatMessage } from '../../types';

function makeMessages(n: number): ChatMessage[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `msg-${i}`,
    conversationId: 'conv-1',
    role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
    content: `Message ${i}`,
    timestamp: new Date().toISOString(),
  }));
}

describe('buildAnalysisPrompt', () => {
  it('includes existing notes when provided', () => {
    const result = buildAnalysisPrompt(makeMessages(4), 'User prefers compound movements');
    expect(result).toContain('User prefers compound movements');
    expect(result).toContain('Current coaching notes');
  });

  it('omits notes section when null', () => {
    const result = buildAnalysisPrompt(makeMessages(4), null);
    expect(result).not.toContain('Current coaching notes');
  });

  it('formats messages as User/Assistant turns', () => {
    const messages = makeMessages(2);
    const result = buildAnalysisPrompt(messages, null);
    expect(result).toContain('User: Message 0');
    expect(result).toContain('Assistant: Message 1');
  });

  it('truncates to last 20 messages', () => {
    const messages = makeMessages(30);
    const result = buildAnalysisPrompt(messages, null);
    expect(result).toContain('Message 29'); // last message included
    expect(result).not.toContain('Message 0'); // first message excluded
  });
});
