import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../contextBuilder';
import type { WorkoutSession, ChatMessage } from '../../types';

describe('buildSystemPrompt', () => {
  it('includes coach instruction in default prompt', () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toContain('personal fitness coach');
    expect(prompt).toContain('exercise');
  });

  it('appends custom system prompt', () => {
    const prompt = buildSystemPrompt({
      customSystemPrompt: 'Focus on strength training',
    });
    expect(prompt).toContain('Focus on strength training');
    expect(prompt).toContain('Additional instructions');
  });

  it('formats recent sessions', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-02-01',
        startTime: '2026-02-01T10:00:00Z',
        completed: true,
        loggedExercises: [
          {
            id: 'e1',
            sessionId: 's1',
            exerciseName: 'Bench Press',
            sets: [{ setNumber: 1, reps: 10, weight: 135, completed: true, timestamp: '' }],
          },
        ],
      },
    ];
    const prompt = buildSystemPrompt({ recentSessions: sessions });
    expect(prompt).toContain('Recent workout history');
    expect(prompt).toContain('Bench Press');
    expect(prompt).toContain('135');
  });

  it('includes weight suggestions', () => {
    const prompt = buildSystemPrompt({
      weightSuggestions: [
        {
          exerciseName: 'Bench Press',
          currentWeight: 135,
          suggestedWeight: 140,
          direction: 'increase',
          confidence: 'high',
          reason: 'Consistently hitting 10 reps',
        },
      ],
    });
    expect(prompt).toContain('weight suggestions');
    expect(prompt).toContain('Bench Press');
    expect(prompt).toContain('140');
  });

  it('includes previous plan context', () => {
    const prompt = buildSystemPrompt({
      previousPlanContext: 'Week 3: Bench Press 4x8 at 135',
    });
    expect(prompt).toContain('Previous week plan');
    expect(prompt).toContain('Week 3');
  });

  it('returns base prompt for empty options', () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toContain('fitness coach');
    expect(prompt).not.toContain('Recent workout history');
    expect(prompt).not.toContain('weight suggestions');
  });

  it('includes user preferences', () => {
    const prompt = buildSystemPrompt({
      preferences: {
        weightUnit: 'kg',
        restTimerDefault: 90,
        voiceInputEnabled: false,
        cloudSyncEnabled: false,
      },
    });
    expect(prompt).toContain('weight unit = kg');
  });

  it('includes user goals', () => {
    const prompt = buildSystemPrompt({ goals: 'Build muscle mass' });
    expect(prompt).toContain('Build muscle mass');
  });

  it('includes previous messages for conversation continuity', () => {
    const messages: ChatMessage[] = [
      {
        id: 'm1',
        conversationId: 'c1',
        role: 'user',
        content: 'What should I do for chest day?',
        timestamp: '',
      },
      {
        id: 'm2',
        conversationId: 'c1',
        role: 'assistant',
        content: 'I recommend starting with bench press.',
        timestamp: '',
      },
    ];
    const prompt = buildSystemPrompt({ previousMessages: messages });
    expect(prompt).toContain('Recent conversation context');
    expect(prompt).toContain('chest day');
    expect(prompt).toContain('bench press');
  });

  it('truncates long previous messages to 200 chars', () => {
    const longContent = 'A'.repeat(300);
    const messages: ChatMessage[] = [
      { id: 'm1', conversationId: 'c1', role: 'user', content: longContent, timestamp: '' },
    ];
    const prompt = buildSystemPrompt({ previousMessages: messages });
    expect(prompt).toContain('...');
    // Should not contain the full 300-char string
    expect(prompt).not.toContain(longContent);
  });

  it('only includes last 6 previous messages', () => {
    const messages: ChatMessage[] = Array.from({ length: 10 }, (_, i) => ({
      id: `m${i}`,
      conversationId: 'c1',
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Message ${i}`,
      timestamp: '',
    }));
    const prompt = buildSystemPrompt({ previousMessages: messages });
    expect(prompt).not.toContain('Message 0');
    expect(prompt).not.toContain('Message 3');
    expect(prompt).toContain('Message 4');
    expect(prompt).toContain('Message 9');
  });

  it('skips previous messages section when empty array', () => {
    const prompt = buildSystemPrompt({ previousMessages: [] });
    expect(prompt).not.toContain('Recent conversation context');
  });
});
