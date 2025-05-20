/**
 * Central configuration for timer values across the application
 */

// Timer duration in milliseconds
export const TIMER_DURATION_MS = 30000; // 30 seconds

// Timer duration in seconds (for components that use seconds)
export const TIMER_DURATION_SECONDS = TIMER_DURATION_MS / 1000; // 30 seconds

// Minimum time between judge interventions
export const MIN_INTERVENTION_INTERVAL_MS = 8000; // 8 seconds 