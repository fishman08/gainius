import { useState, useRef, useCallback, useEffect } from 'react';

interface RestTimerOptions {
  defaultSeconds?: number;
  onWarning?: () => void;
  onComplete?: () => void;
}

export function useRestTimer(optionsOrDefault: number | RestTimerOptions = 90) {
  const opts: RestTimerOptions =
    typeof optionsOrDefault === 'number' ? { defaultSeconds: optionsOrDefault } : optionsOrDefault;
  const defaultSeconds = opts.defaultSeconds ?? 90;

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDurationState] = useState(defaultSeconds);
  const [endTime, setEndTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number>(0);
  const warningFiredRef = useRef(false);

  const onWarningRef = useRef(opts.onWarning);
  const onCompleteRef = useRef(opts.onComplete);
  onWarningRef.current = opts.onWarning;
  onCompleteRef.current = opts.onComplete;

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
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

      if (remaining <= 10 && remaining > 0 && !warningFiredRef.current) {
        warningFiredRef.current = true;
        onWarningRef.current?.();
      }

      if (remaining <= 0) {
        clearTimer();
        setIsRunning(false);
        setSecondsLeft(0);
        endTimeRef.current = 0;
        setEndTime(0);
        onCompleteRef.current?.();
        return;
      }

      setSecondsLeft(remaining);
    }, 1000);
  }, [clearTimer]);

  const start = useCallback(
    (seconds?: number) => {
      const d = seconds ?? duration;
      const et = Date.now() + d * 1000;
      endTimeRef.current = et;
      setEndTime(et);
      setSecondsLeft(d);
      warningFiredRef.current = false;
      startInterval();
    },
    [duration, startInterval],
  );

  const resume = useCallback(() => {
    if (secondsLeft > 0 && !isRunning) {
      const et = Date.now() + secondsLeft * 1000;
      endTimeRef.current = et;
      setEndTime(et);
      warningFiredRef.current = false;
      startInterval();
    }
  }, [secondsLeft, isRunning, startInterval]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    endTimeRef.current = 0;
    setEndTime(0);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setSecondsLeft(0);
    endTimeRef.current = 0;
    setEndTime(0);
  }, [clearTimer]);

  const syncFromBackground = useCallback(() => {
    if (endTimeRef.current <= 0) return;
    const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

    if (remaining <= 0) {
      clearTimer();
      setIsRunning(false);
      setSecondsLeft(0);
      endTimeRef.current = 0;
      setEndTime(0);
      onCompleteRef.current?.();
      return;
    }

    if (remaining <= 10 && !warningFiredRef.current) {
      warningFiredRef.current = true;
      onWarningRef.current?.();
    }

    setSecondsLeft(remaining);
    startInterval();
  }, [clearTimer, startInterval]);

  const setDuration = useCallback((seconds: number) => {
    setDurationState(seconds);
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    secondsLeft,
    isRunning,
    isPaused,
    duration,
    endTime,
    start,
    resume,
    stop,
    reset,
    setDuration,
    syncFromBackground,
  };
}
