import { useState, useRef, useCallback, useEffect } from "react";

interface UseAlgorithmPlayerOptions<T> {
  steps: T[];
  speed: number;
  onStepChange?: (step: T, index: number) => void;
}

export function useAlgorithmPlayer<T>({
  steps,
  speed,
  onStepChange,
}: UseAlgorithmPlayerOptions<T>) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setCurrentStepIndex(-1);
  }, []);

  const stepForward = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      onStepChange?.(steps[newIndex], newIndex);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, steps, onStepChange]);

  const stepBackward = useCallback(() => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      onStepChange?.(steps[newIndex], newIndex);
    }
  }, [currentStepIndex, steps, onStepChange]);

  const play = useCallback(() => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, steps.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            return prev;
          }
          const newIndex = prev + 1;
          onStepChange?.(steps[newIndex], newIndex);
          return newIndex;
        });
      }, speed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, steps, onStepChange]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) {
        setCurrentStepIndex(index);
        onStepChange?.(steps[index], index);
      }
    },
    [steps, onStepChange]
  );

  return {
    currentStepIndex,
    isPlaying,
    currentStep: steps[currentStepIndex],
    isAtStart: currentStepIndex <= 0,
    isAtEnd: currentStepIndex >= steps.length - 1,
    hasSteps: steps.length > 0,
    reset,
    stepForward,
    stepBackward,
    play,
    pause,
    togglePlay,
    goToStep,
    setCurrentStepIndex,
    setIsPlaying,
  };
}
