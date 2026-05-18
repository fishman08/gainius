import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildAnalysisPrompt, analyzeConversationForInsights } from '../coachingAnalyzer';
import type { ChatMessage } from '../../types';

vi.mock('../claudeClient', () => ({
  sendMessage: vi.fn(),
}));

import { sendMessage } from '../claudeClient';

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

describe('analyzeConversationForInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when fewer than 10 messages', async () => {
    const result = await analyzeConversationForInsights({
      apiKey: 'test-key',
      messages: makeMessages(8),
      existingNotes: null,
    });
    expect(result).toBeNull();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('calls sendMessage with correct model and returns text', async () => {
    vi.mocked(sendMessage).mockResolvedValue({
      text: 'Prefers compound movements, trains Mon/Wed/Fri',
      inputTokens: 100,
      outputTokens: 20,
    });

    const result = await analyzeConversationForInsights({
      apiKey: 'test-key',
      messages: makeMessages(10),
      existingNotes: null,
    });

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-key',
        model: 'claude-haiku-4-5-20251001',
      }),
    );
    expect(result).toBe('Prefers compound movements, trains Mon/Wed/Fri');
  });

  it('returns null on API failure without throwing', async () => {
    vi.mocked(sendMessage).mockRejectedValue(new Error('API error'));

    const result = await analyzeConversationForInsights({
      apiKey: 'test-key',
      messages: makeMessages(10),
      existingNotes: null,
    });

    expect(result).toBeNull();
  });

  it('returns null when result is empty string', async () => {
    vi.mocked(sendMessage).mockResolvedValue({
      text: '',
      inputTokens: 50,
      outputTokens: 0,
    });

    const result = await analyzeConversationForInsights({
      apiKey: 'test-key',
      messages: makeMessages(10),
      existingNotes: null,
    });

    expect(result).toBeNull();
  });
});
