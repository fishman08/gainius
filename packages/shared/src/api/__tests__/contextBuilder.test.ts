import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../contextBuilder';
import type { WorkoutSession } from '../../types';

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
});
