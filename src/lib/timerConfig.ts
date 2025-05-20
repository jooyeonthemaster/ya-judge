/**
 * timerConfig.ts
 * 
 * This file centralizes all timer-related settings for the chat application.
 * It provides a single source of truth for timer durations and states.
 */

// Timer duration in seconds
export const DEFAULT_TIMER_DURATION = 5 * 60; // 5 minutes
export const TEST_TIMER_DURATION = 10; // 1 minute for testing

// Timer state types
export type TimerState = 'idle' | 'running' | 'completed';

// Interface for timer data stored in Firebase
export interface TimerData {
  active: boolean;
  startTime?: string; // ISO string
  durationSeconds: number;
  completed?: boolean;
  completedAt?: string; // ISO string
  endReason?: 'time_expired' | 'aggressive_language' | 'user_ended' | 'other';
  messagesSent?: boolean;
}

// Function to format remaining time
export const formatRemainingTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Get appropriate timer duration based on environment
export const getTimerDuration = (isTestMode = false): number => {
  // Use test duration if in test mode or development environment
  if (isTestMode || process.env.NODE_ENV === 'development') {
    return TEST_TIMER_DURATION;
  }
  return DEFAULT_TIMER_DURATION;
}; 