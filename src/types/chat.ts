import { ReactNode, RefObject } from 'react';
import { Database } from 'firebase/database';
import { RefObject } from 'react';

// Message Types
export interface MessageSender {
  id: string;
  username: string;
}

export interface Message {
  id?: string;
  user: 'user-general' | 'judge' | 'system';
  name: string;
  text: string;
  timestamp?: string | number;
  roomId?: string;
  sender?: MessageSender;
  messageType?: 'normal' | 'evidence' | 'objection' | 'closing' | 'question';
  relatedIssue?: string;
}

// User Types
export interface User {
  id: string;
  username: string;
}

export interface TypingUser {
  username: string;
  isTyping: boolean;
}

// Timer Types
export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerData {
  active: boolean;
  startTime?: string;
  durationSeconds?: number;
  completed?: boolean;
  completedAt?: string;
  endReason?: string;
  messagesSent?: boolean;
  reset?: boolean;
  resetAt?: string;
}

// Component Props
export interface ProfileInitialProps {
  name: string;
  isMine: boolean;
}

export interface MessageListProps {
  messages: Message[];
  username: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  getUserCurseLevel: (userId: string) => number;
  hasFinalVerdict: boolean;
  lastVerdictIndex: number;
}

export interface MessageInputProps {
  disabled: boolean;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onTypingStatus: (isTyping: boolean) => void;
}

export interface JudgeMessageDisplayProps {
  text: string;
}

export interface CurseLevelBadgeProps {
  level: number;
}

export interface TimerInfoBarProps {
  isActive: boolean;
  remainingTimeFormatted: string;
}

export interface IssueNotificationProps {
  issues: string[];
  hasNewIssues: boolean;
  onToggle?: () => void;
}

export interface TypingIndicatorProps {
  typingUsers: Record<string, TypingUser>;
  currentUsername: string;
}

export interface UseCourtTimerProps {
  roomId: string | null;
  isRoomHost: boolean;
  onTimerComplete: () => void;
  addMessage: (message: Message) => void;
}

export interface ChatRoomProps {
  roomId: string | null;
  userType?: string;
  customUsername?: string;
  onShare?: () => void;
  initialStage?: string;
  activeChattersCount?: number;
} 