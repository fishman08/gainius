import { useState, useRef, useCallback, useEffect } from 'react';

export function useRestTimer(defaultSeconds: number = 90) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDurationState] = useState(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPaused = !isRunning && secondsLeft > 0;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    clearTimer();
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const start = useCallback(
    (seconds?: number) => {
      const d = seconds ?? duration;
      setSecondsLeft(d);
      startInterval();
    },
    [duration, startInterval],
  );

  const resume = useCallback(() => {
    if (secondsLeft > 0 && !isRunning) {
      startInterval();
    }
  }, [secondsLeft, isRunning, startInterval]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setSecondsLeft(0);
  }, [clearTimer]);

  const setDuration = useCallback((seconds: number) => {
    setDurationState(seconds);
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  return { secondsLeft, isRunning, isPaused, duration, start, resume, stop, reset, setDuration };
}
