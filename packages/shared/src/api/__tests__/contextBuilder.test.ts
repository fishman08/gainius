import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildSystemPrompt } from '../contextBuilder';
import type { PreviousPlanData } from '../contextBuilder';
import type { WorkoutSession, ChatMessage } from '../../types';

describe('buildSystemPrompt', () => {
  beforeEach(() => {
    // Fix "now" so the 14-day window is deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('includes expanded base instruction with all format examples and prohibitions', () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toContain('personal fitness coach');
    // All 4 format examples
    expect(prompt).toContain('X sets x Y reps at Z lbs');
    expect(prompt).toContain('XxY at Z lbs');
    expect(prompt).toContain('X sets to failure');
    expect(prompt).toContain('X sets x max reps');
    // WRONG/RIGHT examples
    expect(prompt).toContain('WRONG');
    expect(prompt).toContain('RIGHT');
    expect(prompt).toContain('A. Back Squats');
    expect(prompt).toContain('165 lbs: 4 sets x 5 reps');
    // Prohibition on bad formats
    expect(prompt).toContain('letter-prefixed headers break parsing');
    // Day header format
    expect(prompt).toContain('**Monday**');
    expect(prompt).toContain('**Wednesday**');
    // End-of-prompt reinforcement
    expect(prompt).toContain('Reminder: Every exercise must be a dash-bullet line');
  });

  it('appends custom system prompt', () => {
    const prompt = buildSystemPrompt({
      customSystemPrompt: 'Focus on strength training',
    });
    expect(prompt).toContain('Focus on strength training');
    expect(prompt).toContain('Additional instructions');
  });

  it('formats recent sessions with weight unit', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-02-15',
        startTime: '2026-02-15T10:00:00Z',
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
    expect(prompt).toContain('Recent workout history (last 2 weeks)');
    expect(prompt).toContain('Bench Press');
    expect(prompt).toContain('135 lbs');
  });

  it('uses kg when user prefers kg', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-02-15',
        startTime: '2026-02-15T10:00:00Z',
        completed: true,
        loggedExercises: [
          {
            id: 'e1',
            sessionId: 's1',
            exerciseName: 'Squat',
            sets: [{ setNumber: 1, reps: 5, weight: 100, completed: true, timestamp: '' }],
          },
        ],
      },
    ];
    const prompt = buildSystemPrompt({
      recentSessions: sessions,
      preferences: {
        weightUnit: 'kg',
        restTimerDefault: 90,
        voiceInputEnabled: false,
        cloudSyncEnabled: false,
      },
    });
    expect(prompt).toContain('100x5 kg');
  });

  it('shows bodyweight for weight = 0', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-02-15',
        startTime: '2026-02-15T10:00:00Z',
        completed: true,
        loggedExercises: [
          {
            id: 'e1',
            sessionId: 's1',
            exerciseName: 'Pull-ups',
            sets: [{ setNumber: 1, reps: 8, weight: 0, completed: true, timestamp: '' }],
          },
        ],
      },
    ];
    const prompt = buildSystemPrompt({ recentSessions: sessions });
    expect(prompt).toContain('Pull-ups: BWx8 lbs');
  });

  it('filters out sessions older than 14 days', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-02-15',
        startTime: '2026-02-15T10:00:00Z',
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
      {
        id: 's2',
        userId: 'u1',
        date: '2026-01-20',
        startTime: '2026-01-20T10:00:00Z',
        completed: true,
        loggedExercises: [
          {
            id: 'e2',
            sessionId: 's2',
            exerciseName: 'Old Exercise',
            sets: [{ setNumber: 1, reps: 10, weight: 100, completed: true, timestamp: '' }],
          },
        ],
      },
    ];
    const prompt = buildSystemPrompt({ recentSessions: sessions });
    expect(prompt).toContain('Bench Press');
    expect(prompt).not.toContain('Old Exercise');
  });

  it('omits history section when all sessions are older than 14 days', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 's1',
        userId: 'u1',
        date: '2026-01-01',
        startTime: '2026-01-01T10:00:00Z',
        completed: true,
        loggedExercises: [
          {
            id: 'e1',
            sessionId: 's1',
            exerciseName: 'Old',
            sets: [{ setNumber: 1, reps: 10, weight: 100, completed: true, timestamp: '' }],
          },
        ],
      },
    ];
    const prompt = buildSystemPrompt({ recentSessions: sessions });
    expect(prompt).not.toContain('Recent workout history');
  });

  it('includes weight suggestions with correct unit', () => {
    const prompt = buildSystemPrompt({
      preferences: {
        weightUnit: 'kg',
        restTimerDefault: 90,
        voiceInputEnabled: false,
        cloudSyncEnabled: false,
      },
      weightSuggestions: [
        {
          exerciseName: 'Bench Press',
          currentWeight: 60,
          suggestedWeight: 62.5,
          direction: 'increase',
          confidence: 'high',
          reason: 'Consistently hitting 10 reps',
        },
      ],
    });
    expect(prompt).toContain('62.5 kg');
    expect(prompt).toContain('\u2191');
  });

  it('capitalizes role names in conversation context', () => {
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
    expect(prompt).toContain('User: What should I do');
    expect(prompt).toContain('Assistant: I recommend');
  });

  it('uses updated conversation header without "from previous session"', () => {
    const messages: ChatMessage[] = [
      { id: 'm1', conversationId: 'c1', role: 'user', content: 'Hello', timestamp: '' },
    ];
    const prompt = buildSystemPrompt({ previousMessages: messages });
    expect(prompt).toContain('Recent conversation context:');
    expect(prompt).not.toContain('from previous session');
  });

  it('truncates long previous messages to 200 chars', () => {
    const longContent = 'A'.repeat(300);
    const messages: ChatMessage[] = [
      { id: 'm1', conversationId: 'c1', role: 'user', content: longContent, timestamp: '' },
    ];
    const prompt = buildSystemPrompt({ previousMessages: messages });
    expect(prompt).toContain('...');
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

  it('formats structured previous plan data with day headers', () => {
    const planData: PreviousPlanData = {
      plan: {
        id: 'p1',
        userId: 'u1',
        weekNumber: 12,
        startDate: '2026-02-08',
        endDate: '2026-02-15',
        createdBy: 'ai',
        exercises: [
          {
            id: 'e1',
            planId: 'p1',
            exerciseName: 'Bench Press',
            targetSets: 4,
            targetReps: 8,
            suggestedWeight: 135,
            dayOfWeek: 1,
            order: 0,
          },
          {
            id: 'e2',
            planId: 'p1',
            exerciseName: 'Squat',
            targetSets: 4,
            targetReps: 6,
            suggestedWeight: 225,
            dayOfWeek: 3,
            order: 0,
          },
          {
            id: 'e3',
            planId: 'p1',
            exerciseName: 'Dips',
            targetSets: 3,
            targetReps: 'failure',
            dayOfWeek: 1,
            order: 1,
          },
        ],
        conversationId: 'c1',
      },
      completionRate: 85,
      totalVolume: 42350,
      exerciseProgression: [
        { exerciseName: 'Bench Press', direction: 'progressed' },
        { exerciseName: 'Squat', direction: 'stalled' },
        { exerciseName: 'Dips', direction: 'regressed' },
      ],
    };
    const prompt = buildSystemPrompt({ previousPlanData: planData });
    expect(prompt).toContain('Week 12 plan (created 2026-02-08)');
    expect(prompt).toContain('**Monday**');
    expect(prompt).toContain('**Wednesday**');
    expect(prompt).toContain('Bench Press: 4 sets x 8 reps at 135 lbs');
    expect(prompt).toContain('Squat: 4 sets x 6 reps at 225 lbs');
    expect(prompt).toContain('Dips: 3 sets to failure');
    expect(prompt).toContain('Completion rate: 85%');
    expect(prompt).toContain('42,350 lbs');
    expect(prompt).toContain('Exercises with progression (\u2191): Bench Press');
    expect(prompt).toContain('Exercises stalled (\u2192): Squat');
    expect(prompt).toContain('Exercises regressed (\u2193): Dips');
    expect(prompt).toContain('Progress exercises that showed improvement');
    expect(prompt).toContain('Preserve the overall training split');
  });

  it('falls back to raw previousPlanContext when no structured data', () => {
    const prompt = buildSystemPrompt({
      previousPlanContext: 'Week 3: Bench Press 4x8 at 135',
    });
    expect(prompt).toContain('Previous workout plan context');
    expect(prompt).toContain('Week 3');
  });

  it('prefers previousPlanData over previousPlanContext', () => {
    const planData: PreviousPlanData = {
      plan: {
        id: 'p1',
        userId: 'u1',
        weekNumber: 5,
        startDate: '2026-02-08',
        endDate: '2026-02-15',
        createdBy: 'ai',
        exercises: [],
        conversationId: 'c1',
      },
      completionRate: 50,
      totalVolume: 10000,
      exerciseProgression: [],
    };
    const prompt = buildSystemPrompt({
      previousPlanData: planData,
      previousPlanContext: 'This should be ignored',
    });
    expect(prompt).toContain('Week 5 plan');
    expect(prompt).not.toContain('This should be ignored');
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

  it('returns base prompt for empty options', () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toContain('fitness coach');
    expect(prompt).not.toContain('Recent workout history');
    expect(prompt).not.toContain('weight suggestions');
  });
});
